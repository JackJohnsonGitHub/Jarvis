---
name: skills-agents
description: Shared instructions for installed agent skills in the skills directory.
---

# AGENTS.md (skills)

## Purpose
Installed agent skills available to the Main agent, including the Google Workspace CLI tools and design/discovery helpers.

## Ownership
Project Lead / Jarvis

## Local Contracts
- Google Workspace tasks use the dedicated CLI skills:
  - `gmcli` — Gmail (search, read, send, drafts, labels, attachments).
  - `gdcli` — Google Drive (list, search, upload, download, share).
  - `gccli` — Google Calendar (calendars, events, availability).
- Each Google CLI takes the account email as its first argument and stores credentials/tokens under `~/.<tool>/`.
- Skill instructions live in `<skill>/SKILL.md`; read the relevant one before composing non-trivial commands.

## Work Guidance
- Resolve the active account with `<tool> accounts list` before issuing commands (currently one configured account).
- Confirm user intent before outbound or irreversible actions: sending email, creating/updating calendar events, sharing or deleting Drive files.
- Prefer `gdcli ls --query` for filename lookups and `gdcli search` for full-text content search.

## Verification
- `gmcli accounts list`, `gdcli accounts list`, and `gccli accounts list` each return at least one account.
- A read-only smoke check succeeds per tool: `gmcli <email> labels list`, `gdcli <email> ls --query "trashed = false"`, `gccli <email> calendars`.

## Child Jarvis Index
- `agent/skills/gmcli/`: Gmail CLI skill.
- `agent/skills/gdcli/`: Google Drive CLI skill.
- `agent/skills/gccli/`: Google Calendar CLI skill.
- `agent/skills/artystic/`: Design-polish skill.
- `agent/skills/find-skills/`: Skill discovery helper.
