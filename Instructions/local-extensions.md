# Local Pi Extensions

Source of truth for local TypeScript extensions registered in [`agent/settings.json`](../agent/settings.json) under the `extensions` array. These live alongside the npm-installed packages in [`npm-pi-extensions.md`](./npm-pi-extensions.md) but follow Pi's extension API (https://pi.dev/docs/latest/extensions) instead of being npm packages.

## Required Local Extensions

| Path | Purpose |
|---|---|
| `extensions/jarvis/jarvis-branding.ts` | Renames the agent identity to "Jarvis" via `session_start` + `before_agent_start` hooks; tracks per-session token usage in a status-line widget via `turn_end`. |

## Conventions

- Single-file extensions live at `agent/extensions/<name>.ts`.
- Multi-file extensions live at `agent/extensions/<name>/index.ts` with an adjacent `README.md`.
- TypeScript module resolution for both styles flows through `agent/node_modules` (standard Node directory walk-up from `agent/extensions/`), populated by `npm install` in `agent/`.
- `agent/extensions/tsconfig.json` configures non-strict LSP checking and aliases `@earendil-works/*` to the npm directory.
- Pi loads extensions via jiti at runtime, so the tsconfig affects IDE/LSP only.

## Verification

`lsp_diagnostics` on every `.ts` file under `agent/extensions/` must return "No diagnostics found" with `agent/node_modules` populated.
