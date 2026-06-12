# Pi Extension Packages (vendored)

All third-party Pi extension packages are **vendored locally** under `agent/packages/<name>` so they can be modified directly. Pi loads them via local-path entries (`"packages/<name>"`) in the `packages` array of `agent/settings.json` — not via `npm:` specifiers.

`agent/package.json` still declares every package, but only as the **dependency provider**: `npm install` in `agent/` populates `agent/node_modules`, which the vendored copies reach via standard Node directory walk-up for their runtime dependencies (typebox, better-sqlite3, puppeteer-core, etc.). No symlinks are used.

## Procedures

- **Modify an extension**: edit files under `agent/packages/<name>/` directly, then `/reload` (or restart Pi). Note local changes in the package's README or a comment so updates don't silently destroy them.
- **Update an extension**: bump the version in `agent/package.json`, run `npm install` in `agent/`, diff `agent/node_modules/<name>` against `agent/packages/<name>` to preserve local modifications, then copy the new version over the vendored copy and re-apply changes.
- **Add an extension**: `cp -a agent/node_modules/<name> agent/packages/<name>` (after adding to `agent/package.json` + `npm install`), then add `"packages/<name>"` to the `packages` array in `agent/settings.json`.
- **Remove an extension**: delete from all three places — `agent/packages/`, the `packages` array, and `agent/package.json`.

## Required Packages

# TUI
* https://pi.dev/packages/@gotgenes/pi-anthropic-auth
* Theme: https://pi.dev/packages/@mammothb/pi-tokyonight-storm
* MD Preview: https://pi.dev/packages/pi-markdown-preview
* Special Defualts: https://pi.dev/packages/pi-powerline-footer

# Functionality
* LLM Selector: https://pi.dev/packages/@yeliu84/pi-model-router
* Memory: https://pi.dev/packages/gentle-engram
* Memory MCP Adapter: https://pi.dev/packages/pi-mcp-adapter
* Context saver: https://pi.dev/packages/context-mode
* LSP/Linters: https://pi.dev/packages/pi-lens
* Advisor: https://pi.dev/packages/@juicesharp/rpiv-advisor

# WorkFlow
* Ask Questionns: https://pi.dev/packages/@juicesharp/rpiv-ask-user-question
* Skill Selector: https://pi.dev/packages/@ramarivera/pi-skill-selector

# Intigrations
* Slides: https://pi.dev/packages/visual-explainer
* Web Access: https://pi.dev/packages/pi-web-access
* https://pi.dev/packages/@apmantza/greedysearch-pi
* https://pi.dev/packages/@narumitw/pi-chrome-devtools?name=Chrome+Dev+tools
