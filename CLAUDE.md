# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is **not an application codebase** — it is the live `~/.pi` configuration directory for the **Jarvis harness**: the Pi coding agent (`@earendil-works/pi-coding-agent`) customized into a JARVIS-inspired assistant called "Jarvis" and launched via the `jarvis` command (a wrapper around `pi`; the `~/.pi` path and `pi` binary name are fixed by the upstream engine). The working branch is `Jarvis-Fabel`. There is no build, lint, or test suite; "development" here means editing configuration, extensions, skills, and docs that Pi loads at startup.

## Commands

```bash
# Install/refresh extensions (the main verification step — this must succeed)
cd agent && npm install

# Full setup from scratch (prereq checks, npm install, pi package install, runtime dirs)
./install.sh

# Run the agent (from repo root) — `jarvis` is a wrapper installed to ~/.npm-global/bin
jarvis    # equivalent: pi
```

There are no tests. After config changes, restart Pi to verify extensions load.

```bash
# Test a single extension without auto-discovery
pi -e ./agent/extensions/jarvis/jarvis-branding.ts

# Hot-reload extensions inside a running Pi session
/reload
```

## Architecture

Pi loads everything from `agent/`:

- **`agent/settings.json`** — the central config: default provider/model (via model router), theme, and the `packages` list of enabled npm extensions. **Must be strict JSON — a single trailing comma breaks the entire config load** and causes Pi to misbehave; validate after editing (`node -e "JSON.parse(require('fs').readFileSync('agent/settings.json','utf8'))"`).
- **`agent/packages/`** — the ~16 third-party Pi extensions (context-mode, pi-lens, gentle-engram, pi-web-access, pi-chrome-devtools, model-router, etc.) are **vendored here as local packages** so they can be edited directly. Each is a copy of the published npm package; Pi loads them via local-path entries (`"packages/<name>"`) in the `packages` array of `agent/settings.json` and discovers entry points from each package's `pi` field in its package.json.
- **`agent/package.json`** — the **dependency provider**: `npm install` in `agent/` populates `agent/node_modules`, and the vendored packages (plus `agent/extensions/`) resolve their runtime dependencies from it via standard Node directory walk-up. No symlinks are used. Keep its version pins aligned with the vendored copies.
- **Adding an extension**: vendor it under `agent/packages/<name>` (copy the published package), add it to `agent/package.json` + `npm install` in `agent/` so its dependencies exist, add the path to the `packages` array in `agent/settings.json`, then restart Pi. Remove by reversing all three. **Updating a vendored extension**: bump it in `agent/package.json`, `npm install`, then re-copy `agent/node_modules/<name>` over `agent/packages/<name>` (this overwrites local modifications — diff first).
- **`agent/extensions/jarvis/jarvis-branding.ts`** — the only extension under `agent/extensions/`; hooks `session_start` and `before_agent_start` to rename the agent "Jarvis" and inject identity into the system prompt, and `turn_end` to accumulate per-session token usage into a GPT/CLAUDE status-line widget.
- **`agent/packages/jarvis-tts-sst/`** — the other locally-authored extension, a heavily modified fork of `@wenjinnn/pi-mimo-voice` rewritten for **fully local voice** (no cloud, no API keys): STT via sherpa-onnx Whisper base int8 (models auto-downloaded to `models/whisper-base/`), TTS via the system `espeak-ng`. Registers `/speak`, `/listen`, `/voice-live`, `/auto-speak`, `/voice-config`. Unlike the other vendored packages it has no npm upstream entry in `agent/package.json` (only its runtime dep `sherpa-onnx-node` is pinned there) — **the "re-copy from node_modules" update rule does not apply; edit it in place.**
- **Extension development** (official docs: https://pi.dev/docs/latest, extensions guide at /docs/latest/extensions): extensions are TypeScript modules run through jiti (no build step) that export a default factory receiving `ExtensionAPI`. Pi auto-discovers `agent/extensions/*.ts` and `agent/extensions/*/index.ts` here (this repo *is* `~/.pi`). The API surface: `pi.on(event, ...)` for lifecycle events (`session_start`, `before_agent_start`, `tool_call` — which can block/modify tool calls, etc.), `pi.registerTool()` for LLM-callable tools, `pi.registerCommand()` for slash commands, and `ctx.ui` for TUI interaction (`notify`, `confirm`, `select`, `setStatus`, `setWidget`). Extensions needing npm deps get their own `package.json` next to the entry file.
- **Settings precedence**: global `~/.pi/agent/settings.json` (this repo) is overridden by per-project `.pi/settings.json`, with nested objects merged. Resource fields (`extensions`, `skills`, `prompts`, `packages`) accept paths (relative to the settings file, `~` ok) and glob patterns with `!` exclusions.
- **`agent/skills/`** — auto-loaded skills, each a directory with a `SKILL.md`. Includes the Google Workspace CLIs: `gmcli` (Gmail), `gdcli` (Drive), `gccli` (Calendar) — every command takes the account email as its first argument (resolve via `<tool> accounts list`); read the tool's `SKILL.md` before composing non-trivial commands. Also includes meta-skills for working on this repo itself: `pi-extension-lifecycle` (extension dev workflow), `pi-cli-repro` (reproducing Pi behavior via the real CLI), `anthropic` (debugging Anthropic OAuth/request shaping), and `frontmatter` (skill frontmatter rules) — consult these before nontrivial extension or skill work.
- **`agent/models.json` / `agent/model-router.json`** — provider/model definitions consumed by the model router. `settings.json` sets `defaultProvider: "router"`, `defaultModel: "auto"` (quality-first: high tier routes to Fable 5/Opus); available router profiles are `auto`, `bulk`, `coding`, `ops`, `research`, `writing` (see the `profiles` block in `model-router.json`).
- **Sub-brains are planned, not implemented.** The old implementation (`@quintinshaw/pi-dynamic-workflows` + `agents/`/`sub-agents/` definitions + `workflows/`) was abandoned and removed. The target architecture — main Jarvis orchestrating `assistant`, `coder`, `redteam`, `blueteam` (Kali Linux MCP for the security pair, own-homelab only), and `homelab` sub-brains — is defined in `Instructions/jarvis-project-context.md`, which is the source of truth for project intent, autonomy policy (trusted-after-approval), model strategy, and roadmap. Read it before making architectural changes.

## The Jarvis AGENTS.md hierarchy (binding)

`Instructions/jarvis-framework.md` defines the contract: **AGENTS.md files are binding work contracts for their subtrees.** Before editing any path, read the root AGENTS.md and every AGENTS.md on the route to that path; the closest one controls local details. After any meaningful change, update the closest owning AGENTS.md (purpose/structure/contract changes). Key files: `agent/AGENTS.md` (persona + Google Workspace operating rules), `agent/skills/AGENTS.md`, `Instructions/AGENTS.md`.

Persona rules from `agent/AGENTS.md`: JARVIS-*inspired* style (calm, precise, slightly dry wit) but never claim to be JARVIS or reference Iron Man/Marvel/Tony Stark. Treat sending email, creating/updating calendar events, and sharing/deleting Drive files as side-effecting — confirm intent first, except for recurring tasks the user has already explicitly approved (trusted-after-approval policy). Calendar RSVP is done by copying the event to the open vikram@malkans.net calendar account.

## Runtime artifacts — do not commit

`agent/sessions/`, `agent/auth.json`, `agent/run-history.jsonl`, `agent/mcp-cache.json`, `context-mode/sessions/`, `context-mode/content/`, `context-mode/insight-cache/`, `pi-lens/` (cache, change-log, metrics, turn-state), `cache/`, `models/` (auto-downloaded ONNX voice models, large binaries), and `*.db`/`*.db-shm`/`*.db-wal` files are runtime state that churns constantly. They show up in `git status` but should not be staged with config changes.

## Documentation layout

- `Docs/Usage/` — user-facing guides (getting started, Google Workspace, context-mode, memory, visual explainer). Keep synchronized when behavior changes.
- `Instructions/` — agent-facing contracts (Jarvis framework, extension management guides, `jarvis-project-context.md` for project intent/roadmap).
- `INSTALL.md` / `install.sh` — installation; keep in sync with the extension list.
