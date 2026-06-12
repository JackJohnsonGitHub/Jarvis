import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const AGENT_NAME = "Jarvis";

/** Classify a provider string into the two display buckets. */
function bucket(provider: string): "gpt" | "claude" {
	if (/anthropic/i.test(provider)) return "claude";
	return "gpt";
}

/** Format a raw token count as a compact string (e.g. 84.3k). */
function fmt(n: number): string {
	if (n === 0) return "0";
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return `${n}`;
}

export default function (pi: ExtensionAPI) {
	/** Per-session cumulative token totals. */
	let tokens = { gpt: 0, claude: 0 };

	function buildLabel(): string {
		return `GPT: ${fmt(tokens.gpt)} tok | CLAUDE: ${fmt(tokens.claude)} tok`;
	}

	pi.on("session_start", async (_event, ctx) => {
		// Reset accumulators on each new session.
		tokens = { gpt: 0, claude: 0 };

		if (!pi.getSessionName()) {
			pi.setSessionName(AGENT_NAME);
		}

		if (ctx.hasUI) {
			ctx.ui.setTitle(`${AGENT_NAME} harness`);
			ctx.ui.setStatus("agent-name", `agent: ${AGENT_NAME}`);
			ctx.ui.setStatus("usage-limits", buildLabel());
		}
	});

	pi.on("turn_end", async (event, ctx) => {
		if (!ctx.hasUI) return;

		const msg = event.message as any;
		if (msg?.role === "assistant" && msg?.usage?.totalTokens != null) {
			const b = bucket(msg.provider ?? "");
			tokens[b] += msg.usage.totalTokens as number;
			ctx.ui.setStatus("usage-limits", buildLabel());
		}
	});

	pi.on("before_agent_start", async (event) => {
		return {
			systemPrompt: `${event.systemPrompt}\n\n## Agent identity\nThe Pi coding agent is configured to be called ${AGENT_NAME}. When referring to yourself by name, use "${AGENT_NAME}" instead of "Pi".`,
		};
	});
}
