# Jarvis Project Context

Source of truth for what Jarvis is supposed to become. Captured from the project lead (2026-06-12). When implementation and this file disagree, this file states the *intent*; update it deliberately, not incidentally.

## Mission

Jarvis is an **all-rounder** personal agent: it can read email, manage calendars, browse, code, and operate infrastructure directly. But for specialized work it is an **orchestrator** — the main brain that decides which specialized sub-brain handles a task and coordinates the results.

## Target sub-brain architecture

Main Jarvis routes work to five specialized sub-brains:

| Sub-brain | Domain | Notes |
|---|---|---|
| `assistant` | Email, calendar, Drive, and other non-technical tasks | Google Workspace via `gmcli`/`gdcli`/`gccli` skills |
| `coder` | Software engineering | Expert at planning first, then implementing; owns project work end-to-end |
| `redteam` | Offensive security / pentesting | Authorized testing of the user's **own homelab only**. Uses the Kali Linux MCP server: https://www.kali.org/tools/mcp-kali-server/ |
| `blueteam` | Defensive security / DevOps | Blue-team counterpart: hardening, detection, monitoring. Also uses the Kali Linux MCP tools, focused on defense |
| `homelab` | Homelab operations | Remote access (SSH) into the cluster hosts; carries knowledge of the homelab architecture (r720/r620 families, NetBox inventory) |

Design rules:
- Main Jarvis dictates which sub-brain to use; sub-brains use specialized skills and extensions rather than ad-hoc methods.
- The previous implementation (`@quintinshaw/pi-dynamic-workflows` + `agents/`/`sub-agents/` definitions + `workflows/model-tiers.json`) is **abandoned**. The delegation mechanism for this architecture has not been chosen yet — that decision is the first step of the rebuild.
- The red-team brain exists for authorized security testing of infrastructure the user owns. It must never be pointed at third-party targets.

## Autonomy policy: trusted after approval

- First occurrence of any side-effecting action (send email, create/update calendar events, share/delete Drive files, mutate homelab hosts) requires explicit user confirmation.
- Once the user approves a specific recurring task (e.g. a standing inbox-triage routine), Jarvis may repeat that same task without re-asking.
- New categories of side effects, or material changes to an approved routine, require fresh approval.

## Model strategy: quality first

- Default to the strongest models (Fable 5 / Opus tier); route downward only for clearly mechanical work (summarize, format, classify, convert).
- Implemented via the model router: `agent/settings.json` defaults to `router`/`auto`, whose high tier is `anthropic/claude-fable-5` with high thinking (see `agent/model-router.json`).

## Roadmap

1. **Stabilize the foundation** — config bugs fixed, stale docs/contracts removed, runtime artifacts kept out of commits. (In progress.)
2. **Choose and install a delegation mechanism** — replacement for dynamic-workflows that can spawn the five sub-brains with bound models, skills, and tool restrictions.
3. **Define the five sub-brains** — role prompts, model bindings, side-effect rules per the autonomy policy above.
4. **Wire the Kali Linux MCP server** — via `pi-mcp-adapter`/`agent/mcp.json`, available to `redteam` and `blueteam` only.
5. **Bring homelab access live** — verified SSH to the r720/r620 hosts, NetBox as inventory source of truth, architecture knowledge captured for the `homelab` brain.
6. **Documentation parity** — keep `Docs/`, `README.md`, and the AGENTS.md chain in sync as each phase lands.
