# AGENTS.md (context-mode)

## Purpose
Storage and management of the context-mode FTS5 knowledge base and associated session data.

## Ownership
Project Lead / Jarvis

## Local Contracts
- Database files in `content/` are durable and should not be manually edited.

## Work Guidance
- Session data in `sessions/` is ephemeral but used for diagnostics.

## Verification
- `ctx_doctor` should return [OK] for all critical checks.

## Child Jarvis Index
- `context-mode/content/`: Knowledge base storage.
- `context-mode/sessions/`: Session metadata.
