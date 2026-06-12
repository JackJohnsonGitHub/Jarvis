# Project Organization

This project is a specialized configuration of the **Pi Coding Agent** environment, customized for the identity "Jarvis". It is designed to enhance the agent's capabilities through a curated set of extensions, skills, and infrastructure settings.

## Directory Structure

### Core Configuration
- `/home/zhiroku/.pi`: The root directory for the Pi agent environment (this repo).
- `agent/settings.json`: Central config — default provider/model (router), theme, enabled extension packages.
- `agent/models.json` / `agent/model-router.json`: Provider/model definitions and routing profiles.

### Agent & Extensions
- `agent/packages/`: Vendored third-party Pi extension packages, loaded as local paths and editable in place.
- `agent/package.json`: Dependency manifest — `npm install` in `agent/` populates `agent/node_modules`, which the vendored packages and local extensions resolve via standard Node directory walk-up (no symlinks).
- `agent/extensions/`: Local, project-specific extension scripts (currently `jarvis/jarvis-branding.ts`).
- `agent/skills/`: Auto-loaded skills, each a directory with a `SKILL.md` (Google Workspace CLIs, craft skills, meta skills).

### State & Memory (runtime — not committed)
- `agent/sessions/`: JSONL logs of agent sessions for persistence and recovery.
- `context-mode/`: SQLite databases and session files used by `context-mode` for high-efficiency retrieval of large datasets.
- `pi-lens/`: Continuous codebase-analysis caches and metrics.

### Governance & Docs
- `Instructions/`: Agent-facing contracts — the Jarvis framework (AGENTS.md rules), extension lists, and `jarvis-project-context.md` (project intent and roadmap).
- `Docs/`: User-facing documentation (`Usage/`) and per-extension guides (`extensions/`).
- AGENTS.md files throughout the tree are binding work contracts for their subtrees.

## Orchestration Layers
1. **Core Pi Agent**: the primary interface, branded as Jarvis.
2. **Model Router**: per-turn model selection across Anthropic/OpenAI tiers, quality-first.
3. **Context-Mode**: a specialized memory layer for processing large logs or codebases without flooding the conversation window.
4. **Sub-brains (planned)**: five specialized agents (`assistant`, `coder`, `redteam`, `blueteam`, `homelab`) orchestrated by main Jarvis — see `Instructions/jarvis-project-context.md`.
