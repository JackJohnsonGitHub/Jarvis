/**
 * jarvis-tts-sst — Pi extension
 *
 * Fully local voice input (STT) and output (TTS). No cloud, no API keys.
 *
 * STT: sherpa-onnx Whisper base int8 (auto-downloaded to ~/.pi/models/whisper-base/)
 * TTS: espeak-ng (system package, zero model download)
 *
 * Commands:
 *   /speak <text>    — Speak text aloud via espeak-ng
 *   /listen          — Record and transcribe speech; auto-stops on silence; pastes into editor
 *   /voice-live      — Toggle live mode: auto-listen + auto-speak every reply
 *   /auto-speak      — Toggle auto-speak mode (read all assistant replies)
 *   /voice-config    — View/change voice settings
 */

import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { Text } from "@earendil-works/pi-tui";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import { unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

import {
	assertModelIntact,
	ensureModelDownloaded,
	getModelPaths,
	isModelDownloaded,
	ModelInstallError,
	removeModelInstall,
} from "./audio/model-download.js";
import { createSttEngine, type SttEngine } from "./audio/stt-engine.js";
import { isHallucination } from "./audio/hallucination-filter.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const PLATFORM = process.platform;

// ─── State ──────────────────────────────────────────────────────────────────

interface VoiceState {
	autoSpeak: boolean;
	ttsVoice: string; // espeak-ng voice identifier
	ttsSpeed: number; // espeak-ng words-per-minute
	autoStopSilence: number; // seconds of silence before auto-stop recording
}

const state: VoiceState = {
	autoSpeak: false,
	ttsVoice: process.env.JARVIS_TTS_VOICE ?? "en-gb",
	ttsSpeed: Number(process.env.JARVIS_TTS_SPEED ?? 160),
	autoStopSilence: 3,
};

// ─── STT engine singleton ────────────────────────────────────────────────────

let _sttEngine: SttEngine | null = null;
let _sttEngineLoading: Promise<SttEngine> | null = null;

async function ensureSttEngine(
	onStatus: (msg: string) => void,
): Promise<SttEngine> {
	if (_sttEngine) return _sttEngine;
	if (_sttEngineLoading) return _sttEngineLoading;

	_sttEngineLoading = (async () => {
		// 1. Download / verify Whisper model
		if (!isModelDownloaded()) {
			onStatus("Downloading Whisper model (~200 MB, first run only)…");
			try {
				await ensureModelDownloaded((p) => {
					if (p.percent !== undefined) {
						onStatus(`Downloading Whisper model… ${p.percent}%`);
					}
				});
			} catch (e) {
				_sttEngineLoading = null;
				if (e instanceof ModelInstallError) {
					throw new Error(
						`Model install failed at stage '${e.stage}'. Check network and retry.`,
					);
				}
				throw e;
			}
		} else {
			// Verify files still intact
			try {
				assertModelIntact();
			} catch (e) {
				removeModelInstall();
				_sttEngineLoading = null;
				throw new Error(
					"Whisper model files corrupted — removed. Retry to re-download.",
				);
			}
		}

		// 2. Load engine
		onStatus("Loading Whisper STT engine…");
		const paths = getModelPaths();
		const engine = await createSttEngine({
			encoderPath: paths.encoderPath,
			decoderPath: paths.decoderPath,
			tokensPath: paths.tokensPath,
		});

		_sttEngine = engine;
		_sttEngineLoading = null;
		return engine;
	})();

	return _sttEngineLoading;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cmdExists(cmd: string): boolean {
	try {
		execSync(`which ${cmd}`, { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

async function tmpFile(ext: string): Promise<string> {
	const dir = join(tmpdir(), "jarvis-tts-sst");
	await mkdir(dir, { recursive: true });
	return join(dir, `${randomUUID()}${ext}`);
}

// ─── Recording ───────────────────────────────────────────────────────────────

let _recordingProc: ChildProcess | null = null;
let _recordingFile: string | null = null;

/**
 * Start background recording via parecord (Linux/PulseAudio) or ffmpeg.
 * Calls onFinish(audioPath) once recording stops.
 */
async function startRecording(
	onFinish: (audioPath: string) => Promise<void>,
	maxDurationMs = 60_000,
): Promise<void> {
	if (_recordingProc) throw new Error("Already recording");

	const audioPath = await tmpFile(".wav");
	_recordingFile = audioPath;

	let proc: ChildProcess;

	if (PLATFORM === "linux" && cmdExists("parecord")) {
		proc = spawn("parecord", ["--file-format=wav", audioPath], {
			stdio: "ignore",
		});
	} else {
		// Fallback: ffmpeg (cross-platform)
		const inputArgs = getFFmpegInputArgs();
		proc = spawn("ffmpeg", ["-y", ...inputArgs, audioPath], {
			stdio: "ignore",
		});
	}

	_recordingProc = proc;

	const timer = setTimeout(() => stopRecording(), maxDurationMs);

	proc.on("close", async () => {
		clearTimeout(timer);
		_recordingProc = null;
		const path = _recordingFile;
		_recordingFile = null;
		if (path) await onFinish(path);
	});
}

function stopRecording(force = false): void {
	if (!_recordingProc) return;
	try {
		if (force) {
			_recordingProc.kill("SIGKILL");
		} else {
			_recordingProc.kill("SIGTERM");
		}
	} catch {
		// already dead
	}
}

/**
 * Record audio for up to maxDurationMs, then return the path.
 */
function recordAudio(maxDurationMs = 10_000): Promise<string> {
	return new Promise((resolve, reject) => {
		startRecording(async (path) => resolve(path), maxDurationMs).catch(reject);
	});
}

/**
 * Record with real Voice Activity Detection (VAD) via ffmpeg's silencedetect filter.
 *
 * Strategy:
 *  1. Pipe audio through ffmpeg silencedetect → parse stderr events.
 *  2. Wait up to `initialTimeoutMs` for first speech (amplitude above threshold).
 *  3. Once speech starts, stop when silence exceeds `silenceDurationSec`.
 *  4. Hard cap at `maxDurationMs`.
 *
 * Returns the path of the saved WAV file.
 */
async function recordWithVad({
	silenceDurationSec = 2,
	noiseThresholdDb = -35,
	maxDurationMs = 60_000,
	initialTimeoutMs = 10_000,
	onStatus,
}: {
	silenceDurationSec?: number;
	noiseThresholdDb?: number;
	maxDurationMs?: number;
	initialTimeoutMs?: number;
	onStatus?: (msg: string) => void;
}): Promise<string> {
	const audioPath = await tmpFile(".wav");

	return new Promise<string>((resolve, reject) => {
		const inputArgs = getFFmpegInputArgs();

		// Record while piping through silencedetect + write to file
		// -af silencedetect emits markers to stderr we parse to know when to stop
		const proc = spawn(
			"ffmpeg",
			[
				"-y",
				...inputArgs,
				"-af",
				`silencedetect=noise=${noiseThresholdDb}dB:duration=${silenceDurationSec}`,
				audioPath,
			],
			{ stdio: ["ignore", "ignore", "pipe"] },
		);

		_recordingProc = proc;
		_recordingFile = audioPath;

		let speechDetected = false;
		let done = false;
		let stderrBuf = "";

		const finish = (reason: string) => {
			if (done) return;
			done = true;
			clearTimeout(hardTimer);
			clearTimeout(initialTimer);
			if (onStatus) onStatus(`Stopped (${reason})`);
			try {
				proc.kill("SIGTERM");
			} catch {
				/* ignore */
			}
		};

		// Hard cap
		const hardTimer = setTimeout(
			() => finish("max duration reached"),
			maxDurationMs,
		);

		// Initial timeout — no speech at all
		const initialTimer = setTimeout(() => {
			if (!speechDetected) finish("no speech detected");
		}, initialTimeoutMs);

		// Parse ffmpeg silencedetect output
		proc.stderr!.on("data", (chunk: Buffer) => {
			stderrBuf += chunk.toString();
			const lines = stderrBuf.split("\n");
			stderrBuf = lines.pop() ?? "";

			for (const line of lines) {
				// silence_end signals that silence has ended → speech starting
				if (line.includes("silence_end")) {
					if (!speechDetected) {
						speechDetected = true;
						clearTimeout(initialTimer);
						if (onStatus) onStatus("🎙 Speech detected — listening…");
					}
				}
				// silence_start + silence_duration line signals silence after speech
				if (speechDetected && line.includes("silence_start")) {
					// silence_start fires at start of silence region; after silenceDurationSec
					// ffmpeg emits the duration line — we stop immediately on silence_start
					// (the duration filter already ensures this only fires after the hold time)
					finish("silence detected");
				}
			}
		});

		proc.on("close", () => {
			_recordingProc = null;
			_recordingFile = null;
			if (!done) {
				done = true;
				clearTimeout(hardTimer);
				clearTimeout(initialTimer);
			}
			resolve(audioPath);
		});

		proc.on("error", (err) => {
			clearTimeout(hardTimer);
			clearTimeout(initialTimer);
			reject(err);
		});
	});
}

function getFFmpegInputArgs(): string[] {
	const rate = "16000";
	const channels = "1";
	switch (PLATFORM) {
		case "darwin":
			return [
				"-f",
				"avfoundation",
				"-i",
				":default",
				"-ar",
				rate,
				"-ac",
				channels,
			];
		case "win32": {
			const device = process.env.MIC_DEVICE ?? "audio=麦克风";
			return ["-f", "dshow", "-i", device, "-ar", rate, "-ac", channels];
		}
		default:
			return ["-f", "pulse", "-i", "default", "-ar", rate, "-ac", channels];
	}
}

// ─── Playback ─────────────────────────────────────────────────────────────────

let _currentAudioPlayer: ChildProcess | null = null;

function stopAudio(): void {
	if (_currentAudioPlayer) {
		try {
			_currentAudioPlayer.kill("SIGTERM");
		} catch {
			/* ignore */
		}
		_currentAudioPlayer = null;
	}
}

async function playAudio(audioPath: string): Promise<void> {
	stopAudio();
	return new Promise((resolve, reject) => {
		let proc: ChildProcess;
		if (PLATFORM === "linux") {
			if (cmdExists("paplay")) {
				proc = spawn("paplay", [audioPath], { stdio: "ignore" });
			} else if (cmdExists("aplay")) {
				proc = spawn("aplay", [audioPath], { stdio: "ignore" });
			} else if (cmdExists("ffplay")) {
				proc = spawn("ffplay", ["-nodisp", "-autoexit", audioPath], {
					stdio: "ignore",
				});
			} else if (cmdExists("mpv")) {
				proc = spawn("mpv", ["--no-video", audioPath], { stdio: "ignore" });
			} else {
				return reject(
					new Error(
						"No audio player found. Install paplay, aplay, ffplay, or mpv.",
					),
				);
			}
		} else if (PLATFORM === "darwin") {
			proc = spawn("afplay", [audioPath], { stdio: "ignore" });
		} else {
			if (cmdExists("ffplay")) {
				proc = spawn("ffplay", ["-nodisp", "-autoexit", audioPath], {
					stdio: "ignore",
				});
			} else {
				return reject(
					new Error("No audio player found. Install ffplay or mpv."),
				);
			}
		}
		_currentAudioPlayer = proc;
		proc.on("close", (code) => {
			_currentAudioPlayer = null;
			if (code === 0 || code === null) resolve();
			else reject(new Error(`Audio player exited with code ${code}`));
		});
		proc.on("error", (err) => {
			_currentAudioPlayer = null;
			reject(err);
		});
	});
}

// ─── TTS (espeak-ng) ─────────────────────────────────────────────────────────

/**
 * Synthesize text to a WAV file via espeak-ng, then play it.
 * Fully local — no network, no API key.
 */
async function synthesizeTTS(text: string): Promise<void> {
	if (!cmdExists("espeak-ng")) {
		throw new Error(
			"espeak-ng not found. Install it: sudo dnf install espeak-ng  (or apt/pacman equivalent).",
		);
	}
	const wavPath = await tmpFile(".wav");
	try {
		await new Promise<void>((resolve, reject) => {
			const proc = spawn(
				"espeak-ng",
				[
					"-v",
					state.ttsVoice,
					"-s",
					String(state.ttsSpeed),
					"-w",
					wavPath,
					text,
				],
				{ stdio: "ignore" },
			);
			proc.on("close", (code) => {
				if (code === 0) resolve();
				else reject(new Error(`espeak-ng exited with code ${code}`));
			});
			proc.on("error", reject);
		});
		await playAudio(wavPath);
	} finally {
		await unlink(wavPath).catch(() => {});
	}
}

// ─── STT (sherpa-onnx via WAV → f32le conversion) ────────────────────────────

/**
 * Convert an audio file to a Float32Array of 16 kHz mono PCM samples
 * using ffmpeg — the universal bridge between any recorded format and sherpa.
 */
async function audioFileToFloat32(audioPath: string): Promise<Float32Array> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		const proc = spawn(
			"ffmpeg",
			[
				"-i",
				audioPath,
				"-f",
				"f32le", // raw 32-bit float little-endian
				"-ar",
				"16000", // 16 kHz — what Whisper expects
				"-ac",
				"1", // mono
				"pipe:1",
			],
			{ stdio: ["ignore", "pipe", "ignore"] },
		);

		proc.stdout!.on("data", (chunk: Buffer) => chunks.push(chunk));
		proc.on("close", (code) => {
			if (code !== 0 && code !== null) {
				return reject(
					new Error(`ffmpeg audio conversion failed (exit ${code})`),
				);
			}
			const buf = Buffer.concat(chunks);
			const samples = new Float32Array(
				buf.buffer,
				buf.byteOffset,
				buf.length / 4,
			);
			resolve(samples);
		});
		proc.on("error", reject);
	});
}

/**
 * Transcribe an audio file. Returns null if no speech detected.
 */
async function transcribeAudioFile(
	audioPath: string,
	onStatus: (msg: string) => void,
): Promise<string | null> {
	const engine = await ensureSttEngine(onStatus);
	onStatus("Transcribing…");
	const samples = await audioFileToFloat32(audioPath);
	const transcript = (await engine.recognize(samples, 16000)).trim();
	if (!transcript || isHallucination(transcript)) return null;
	return transcript;
}

// ─── Live mode ───────────────────────────────────────────────────────────────

let _liveMode = false;
let _liveModeGeneration = 0;

async function startLiveListen(
	ctx: ExtensionContext,
	pi: ExtensionAPI,
): Promise<void> {
	const myGen = _liveModeGeneration;

	while (_liveMode && _liveModeGeneration === myGen) {
		try {
			ctx.ui.notify(
				`🎙 Listening… (auto-stops after ${state.autoStopSilence}s silence, or /voice-live to stop)`,
				"info",
			);

			const audioPath = await recordWithVad({
				silenceDurationSec: state.autoStopSilence,
				maxDurationMs: 60_000,
				initialTimeoutMs: 15_000,
				onStatus: (m) => {
					if (_liveModeGeneration === myGen) ctx.ui.notify(m, "info");
				},
			});

			if (_liveModeGeneration !== myGen) {
				await unlink(audioPath).catch(() => {});
				break;
			}

			const text = await transcribeAudioFile(audioPath, (m) =>
				ctx.ui.notify(m, "info"),
			);
			await unlink(audioPath).catch(() => {});

			if (_liveModeGeneration !== myGen) break;
			if (!text) continue;

			ctx.ui.notify(`🎤 "${text}"`, "info");
			pi.sendUserMessage(text, { deliverAs: "steer" });
		} catch (e) {
			ctx.ui.notify(
				`Live listen error: ${e instanceof Error ? e.message : e}`,
				"error",
			);
			break;
		}
	}
}

// ─── Extension entry point ───────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	// ── Message renderer for TTS/STT log messages ──────────────────────────
	pi.registerMessageRenderer("jarvis-voice", (message, _options, theme) => {
		const text =
			typeof message.content === "string"
				? message.content
				: message.content
						.map((c) => (c.type === "text" ? c.text : ""))
						.join("");
		return new Text(theme.fg("accent", text), 0, 0);
	});

	// ── Warm up STT engine on extension load (background, non-blocking) ────
	pi.on("session_start", () => {
		ensureSttEngine(() => {}).catch(() => {
			// Silently swallow startup warm-up failures; errors surface on first use.
		});
	});

	// ─── /speak ─────────────────────────────────────────────────────────────
	pi.registerCommand("speak", {
		description: "Speak text aloud using local TTS (espeak-ng)",
		getArgumentCompletions: () => null,
		handler: async (args, ctx) => {
			if (!args?.trim()) {
				ctx.ui.notify("Usage: /speak <text>", "warning");
				return;
			}
			try {
				ctx.ui.notify(`Speaking (${args.trim().length} chars)…`, "info");
				await synthesizeTTS(args.trim());
				pi.sendMessage(
					{
						customType: "jarvis-voice",
						content: `🔊 [TTS] ${args.trim()}`,
						display: true,
					},
					{ deliverAs: "followUp" },
				);
			} catch (e) {
				ctx.ui.notify(
					`TTS error: ${e instanceof Error ? e.message : e}`,
					"error",
				);
			}
		},
	});

	// ─── /listen ────────────────────────────────────────────────────────────
	pi.registerCommand("listen", {
		description:
			"Record and transcribe speech (auto-stops on silence). Pastes result into editor — press Enter to send.",
		handler: async (args, ctx) => {
			const argStr = args?.trim() ?? "";

			if (argStr === "stop") {
				if (!_recordingProc) {
					ctx.ui.notify("No active recording.", "warning");
					return;
				}
				ctx.ui.notify("Stopping recording…", "info");
				stopRecording();
				return;
			}

			if (argStr === "status") {
				ctx.ui.notify(
					_recordingProc ? "Recording in progress" : "Not recording",
					"info",
				);
				return;
			}

			// /listen auto-stop [N]
			const autoMatch = argStr.match(/^auto-stop(\s+(\d+))?$/);
			if (autoMatch) {
				const silentSec = parseInt(
					autoMatch[2] ?? String(state.autoStopSilence),
					10,
				);
				ctx.ui.notify(
					`Recording (auto-stop after ${silentSec}s silence)…`,
					"info",
				);
				const started = Date.now();
				const audioPath = await recordWithVad({
					silenceDurationSec: silentSec,
					onStatus: (m) => ctx.ui.notify(m, "info"),
				});
				const text = await transcribeAudioFile(audioPath, (m) =>
					ctx.ui.notify(m, "info"),
				);
				await unlink(audioPath).catch(() => {});
				const elapsed = ((Date.now() - started) / 1_000).toFixed(1);
				if (!text) {
					ctx.ui.notify("No speech detected.", "warning");
					return;
				}
				ctx.ui.notify(`🎤 Transcribed (${elapsed}s): ${text}`, "info");
				pi.sendMessage(
					{
						customType: "jarvis-voice",
						content: `🎤 [STT ${elapsed}s] ${text}`,
						display: true,
					},
					{ deliverAs: "followUp" },
				);
				(pi as any).sendUserMessage?.(text);
				return;
			}

			// /listen <seconds> — fixed duration
			if (argStr && /^\d+$/.test(argStr)) {
				const duration = Math.min(parseInt(argStr, 10), 60);
				ctx.ui.notify(`Recording ${duration}s… speak now`, "info");
				const audioPath = await recordAudio(duration * 1_000);
				const text = await transcribeAudioFile(audioPath, (m) =>
					ctx.ui.notify(m, "info"),
				);
				await unlink(audioPath).catch(() => {});
				if (!text) {
					ctx.ui.notify("No speech detected.", "warning");
					return;
				}
				ctx.ui.notify(`🎤 "${text}"`, "info");
				pi.sendMessage(
					{
						customType: "jarvis-voice",
						content: `🎤 [STT] ${text}`,
						display: true,
					},
					{ deliverAs: "followUp" },
				);
				(pi as any).sendUserMessage?.(text);
				return;
			}

			// /listen (no args) — VAD-based: auto-stop on silence, paste into editor
			if (_recordingProc) {
				ctx.ui.notify(
					"Already recording. Use /listen stop to stop.",
					"warning",
				);
				return;
			}
			ctx.ui.notify(
				`🎙 Listening\u2026 (auto-stops after ${state.autoStopSilence}s silence)`,
				"info",
			);
			const listenAudioPath = await recordWithVad({
				silenceDurationSec: state.autoStopSilence,
				onStatus: (m) => ctx.ui.notify(m, "info"),
			});
			const listenText = await transcribeAudioFile(listenAudioPath, (m) =>
				ctx.ui.notify(m, "info"),
			);
			await unlink(listenAudioPath).catch(() => {});
			if (!listenText) {
				ctx.ui.notify("No speech detected.", "warning");
				return;
			}
			// Paste into editor so user can review/edit before pressing Enter to send
			ctx.ui.notify(
				`🎤 Transcribed: "${listenText}" — press Enter to send`,
				"info",
			);
			ctx.ui.setEditorText(listenText);
		},
	});

	// ─── /voice-live ─────────────────────────────────────────────────────────
	pi.registerCommand("voice-live", {
		description: "Toggle live mode: continuously listen and auto-speak replies",
		handler: async (_args, ctx) => {
			if (_liveMode) {
				_liveMode = false;
				_liveModeGeneration++;
				state.autoSpeak = false;
				stopAudio();
				stopRecording(true);
				ctx.ui.notify("Live mode: OFF", "info");
				return;
			}
			_liveMode = true;
			_liveModeGeneration++;
			state.autoSpeak = true;
			ctx.ui.notify(
				"Live mode: ON (speak to send, replies will be read aloud)",
				"info",
			);
			await startLiveListen(ctx, pi);
		},
	});

	// ─── /auto-speak ─────────────────────────────────────────────────────────
	pi.registerCommand("auto-speak", {
		description: "Toggle auto-speak: read every assistant reply aloud",
		handler: async (_args, ctx) => {
			state.autoSpeak = !state.autoSpeak;
			ctx.ui.notify(`Auto-speak: ${state.autoSpeak ? "ON" : "OFF"}`, "info");
		},
	});

	// ─── /voice-config ────────────────────────────────────────────────────────
	pi.registerCommand("voice-config", {
		description: "View or change local TTS/STT settings",
		handler: async (_args, ctx) => {
			const choices = [
				"Show Current Config",
				"Set TTS Voice",
				"Set TTS Speed",
				"Set Auto-Stop Silence (seconds)",
				"Reset Whisper Model (re-download)",
			];
			const choice = await ctx.ui.select("Voice Config:", choices);
			if (!choice) return;

			if (choice === "Show Current Config") {
				ctx.ui.notify(
					[
						`TTS Voice    : ${state.ttsVoice}`,
						`TTS Speed    : ${state.ttsSpeed} wpm`,
						`Auto-speak   : ${state.autoSpeak}`,
						`Auto-stop    : ${state.autoStopSilence}s silence`,
						`Whisper model: ${isModelDownloaded() ? "downloaded ✓" : "not downloaded"}`,
						`STT engine   : sherpa-onnx Whisper base int8 (local)`,
						`TTS engine   : espeak-ng (local)`,
					].join("\n"),
					"info",
				);
			} else if (choice === "Set TTS Voice") {
				// Show a subset of useful espeak-ng English voices
				const voices = [
					"en-gb     — English (British, default Jarvis voice)",
					"en-us     — English (American)",
					"en-gb-x-rp — English (Received Pronunciation)",
					"en        — English (generic)",
				];
				const selected = await ctx.ui.select("Select TTS voice:", voices);
				if (selected) {
					state.ttsVoice = selected.split(" ")[0]?.trim() ?? "en-gb";
					ctx.ui.notify(`TTS voice set to: ${state.ttsVoice}`, "info");
				}
			} else if (choice === "Set TTS Speed") {
				const speeds = [
					"130 (slow)",
					"160 (default)",
					"190 (fast)",
					"220 (very fast)",
				];
				const selected = await ctx.ui.select("Select TTS speed:", speeds);
				if (selected) {
					state.ttsSpeed = parseInt(selected, 10);
					ctx.ui.notify(`TTS speed set to: ${state.ttsSpeed} wpm`, "info");
				}
			} else if (choice === "Set Auto-Stop Silence (seconds)") {
				const opts = [
					"2 seconds",
					"3 seconds (default)",
					"5 seconds",
					"8 seconds",
				];
				const selected = await ctx.ui.select("Silence before auto-stop:", opts);
				if (selected) {
					state.autoStopSilence = parseInt(selected, 10);
					ctx.ui.notify(`Auto-stop silence: ${state.autoStopSilence}s`, "info");
				}
			} else if (choice === "Reset Whisper Model (re-download)") {
				removeModelInstall();
				_sttEngine?.release();
				_sttEngine = null;
				_sttEngineLoading = null;
				ctx.ui.notify(
					"Whisper model removed. It will re-download on next /listen.",
					"info",
				);
			}
		},
	});

	// ─── LLM tools ──────────────────────────────────────────────────────────
	pi.registerTool({
		name: "jarvis_tts",
		label: "Jarvis TTS",
		description:
			"Speak text aloud using local TTS (espeak-ng). " +
			"Use when the user asks you to 'say', 'speak', 'read aloud', or 'tell me out loud'.",
		promptSnippet: "Speak the following text aloud",
		promptGuidelines: [
			"Use jarvis_tts when the user says 'say that out loud', 'read that to me', or asks for audio output.",
		],
		parameters: Type.Object({
			text: Type.String({ description: "Text to synthesize and speak aloud" }),
		}),
		execute: async (_id, { text }, _signal, _onUpdate, ctx) => {
			const t = text?.trim();
			if (!t)
				return {
					content: [{ type: "text" as const, text: "No text provided." }],
					details: undefined,
				};
			try {
				await synthesizeTTS(t);
				(ctx as any)._ttsJustPlayed = true;
				return {
					content: [{ type: "text" as const, text: `🔊 TTS: ${t}` }],
					details: undefined,
				};
			} catch (e) {
				return {
					content: [
						{
							type: "text" as const,
							text: `TTS error: ${e instanceof Error ? e.message : e}`,
						},
					],
					details: undefined,
				};
			}
		},
	});

	pi.registerTool({
		name: "jarvis_stt",
		label: "Jarvis STT",
		description:
			"Record audio from the microphone and transcribe speech to text using local Whisper. " +
			"Use when the user asks to 'listen', 'record my voice', or input via speech.",
		promptSnippet: "Record and transcribe voice from microphone",
		promptGuidelines: [
			"Use jarvis_stt when the user says 'listen to me', 'record my voice', or wants to speak instead of type.",
		],
		parameters: Type.Object({
			duration: Type.Optional(
				Type.Number({
					description: "Recording duration in seconds (default: 10, max: 60)",
				}),
			),
		}),
		execute: async (_id, { duration }, _signal, _onUpdate, ctx) => {
			const sec = Math.min(duration ?? 10, 60);
			try {
				ctx.ui.notify(`Recording ${sec}s…`, "info");
				const audioPath = await recordAudio(sec * 1_000);
				const text = await transcribeAudioFile(audioPath, (m) =>
					ctx.ui.notify(m, "info"),
				);
				await unlink(audioPath).catch(() => {});
				const result = text ? `Transcription: ${text}` : "No speech detected.";
				return {
					content: [{ type: "text" as const, text: result }],
					details: undefined,
				};
			} catch (e) {
				return {
					content: [
						{
							type: "text" as const,
							text: `STT error: ${e instanceof Error ? e.message : e}`,
						},
					],
					details: undefined,
				};
			}
		},
	});

	// ─── Auto-speak: read every assistant reply ──────────────────────────────
	let _autoSpeakInProgress = false;
	let _ttsJustPlayed = false;

	pi.on("message_end", async (event, ctx) => {
		if (!state.autoSpeak) return;
		if (event.message.role !== "assistant") return;
		if (_autoSpeakInProgress) return;
		if (_ttsJustPlayed) {
			_ttsJustPlayed = false;
			return;
		}

		const content = event.message.content;
		let text = "";
		if (typeof content === "string") {
			text = content;
		} else if (Array.isArray(content)) {
			text = content
				.filter((b: any) => b.type === "text")
				.map((b: any) => b.text)
				.join(" ");
		}
		if (!text.trim()) return;
		if (text.startsWith("🔊 TTS:") || text.startsWith("🎤 [STT")) return;

		const maxChars = 2_000;
		const ttsText =
			text.length > maxChars ? text.slice(0, maxChars) + "…" : text;

		const genBefore = _liveModeGeneration;
		_autoSpeakInProgress = true;
		try {
			await synthesizeTTS(ttsText);
		} catch {
			// Don't surface auto-speak errors as notifications — non-critical path.
		} finally {
			_autoSpeakInProgress = false;
			// If live mode is still running (generation unchanged), resume listening
			if (_liveMode && _liveModeGeneration === genBefore) {
				await startLiveListen(ctx, pi);
			}
		}
	});
}
