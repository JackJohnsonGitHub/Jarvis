# AGENTS.md (Instructions)

## Purpose
Source of truth for framework rules and desired extension lists.

## Ownership
User / Project Lead

## Local Contracts
- `npm-pi-extensions.md` is the definitive list of required extension packages (vendored under `agent/packages/`) and the modify/update/add/remove procedures.
- `local-extensions.md` is the definitive list of required local TS extensions.
- `jarvis-framework.md` defines the operational rail for the agent.
- `jarvis-project-context.md` is the source of truth for project intent: mission, target sub-brain architecture, autonomy policy, model strategy, and roadmap.

## Work Guidance
- Update this directory before applying changes to the root or child AGENTS.md.

## Verification
- Required extension packages are vendored under `agent/packages/`, declared in `agent/package.json` (dependency provider), and listed as local paths in the `packages` array in `agent/settings.json`.
- Required local extensions are reflected in the `extensions` array in `agent/settings.json` and pass `lsp_diagnostics` cleanly.

## Child Jarvis Index
(No children)
