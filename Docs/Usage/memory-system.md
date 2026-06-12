# Memory System (Engram)

Engram provides persistent memory that survives across sessions and compactions. This guide covers when and how to save memory, search past work, and manage session summaries.

## Overview

Engram is a persistent memory system that remembers:
- Bug fixes and their solutions
- Architecture and design decisions
- Discoveries about the codebase
- Configuration changes
- Established patterns and conventions
- User preferences and constraints

**Key insight:** Memory persists across sessions. What you save today helps tomorrow.

## When to Save (Mandatory)

Call `mem_save` IMMEDIATELY after:
- ✅ Bug fix completed
- ✅ Architecture or design decision made
- ✅ Non-obvious discovery about the codebase
- ✅ Configuration change or environment setup
- ✅ Pattern established (naming, structure, convention)
- ✅ User preference or constraint learned

**This is not optional.** Saving memory is a core operating requirement.

## Memory Format

### mem_save Structure

```javascript
mem_save(
  title: "Verb + what — short, searchable",
  type: "bugfix | decision | architecture | discovery | pattern | config | preference",
  scope: "project | personal",
  topic_key: "stable-key-for-evolving-decisions",  // Optional
  content: `
    **What**: One sentence — what was done
    **Why**: What motivated it
    **Where**: Files or paths affected
    **Learned**: Gotchas, edge cases, surprises
  `
)
```

### Example: Bug Fix

```javascript
mem_save(
  title: "Fixed WebSocket reconnection loop",
  type: "bugfix",
  scope: "project",
  content: `
    **What**: Fixed infinite reconnection attempts when server returns 429
    **Why**: Rate limiting wasn't respected; client kept hammering server
    **Where**: src/modem/websocket-client.ts (retry logic)
    **Learned**: WebSocket error codes don't map 1:1 to HTTP status; need custom 429 detection via close reason
  `
)
```

### Example: Design Decision

```javascript
mem_save(
  title: "Chose PostgreSQL over MongoDB for user data",
  type: "decision",
  scope: "project",
  topic_key: "database-choice",
  content: `
    **What**: Selected PostgreSQL as primary datastore
    **Why**: ACID guarantees required for financial data; relational model fits domain
    **Where**: Database layer, migration scripts in db/migrations/
    **Learned**: JSONB columns give us schema flexibility without sacrificing transactions
  `
)
```

### Example: User Preference

```javascript
mem_save(
  title: "Mark emails read after opening in gmcli",
  type: "preference",
  scope: "personal",
  content: `
    **What**: After reading Gmail threads with gmcli, remove the UNREAD label
    **Why**: User wants email state to reflect that message was read
    **Where**: Gmail CLI workflow using \`gmcli <email> labels <threadId> --remove UNREAD\`
    **Learned**: gmcli supports modifying system labels directly; UNREAD can be removed after thread reads
  `
)
```

## Searching Memory

### mem_context

Get current context overview:

```javascript
mem_context()
```

Returns recent observations, active decisions, and relevant session state.

### mem_search

Search for specific past work:

```javascript
mem_search(
  query: "WebSocket reconnection bug"
)
```

**Use cases:**
- "What did we decide about caching?"
- "How did we fix the auth timeout issue?"
- "What patterns did we establish for error handling?"

**Filters:**
```javascript
mem_search(
  query: "database choice",
  type: "decision",
  project: "myapp"
)
```

### mem_get_observation

Retrieve full content by ID:

```javascript
mem_get_observation(
  id: 42
)
```

## Session Management

### Session Summaries

Before ending a session or saying "done", call `mem_session_summary`:

```javascript
mem_session_summary(
  content: `
    **Goal**: [What was the original objective?]
    **Instructions**: [What was the user's request?]
    **Discoveries**: [What did we learn?]
    **Accomplished**: [What did we complete?]
    **Next Steps**: [What should happen next?]
    **Relevant Files**: [What files were touched?]
  `
)
```

**If it fails** because Engram can't detect a project, ask the user which project should receive the summary, then retry with:

```javascript
mem_session_summary(
  content: "...",
  project: "<name>"
)
```

### After Compaction

If you see "FIRST ACTION REQUIRED" or a compacted summary:

1. Save it immediately with `mem_session_summary`
2. Call `mem_context` before continuing

This restores session context after Pi compacts the conversation.

## Memory Types

### bugfix
- What was broken
- Root cause
- How it was fixed
- Edge cases discovered

### decision
- What was decided
- Why (trade-offs considered)
- Alternatives rejected
- Implementation notes

### architecture
- System structure
- Component relationships
- Design patterns used
- Constraints and rationale

### discovery
- Non-obvious findings
- Undocumented behavior
- Hidden dependencies
- Gotchas and edge cases

### pattern
- Established conventions
- Naming schemes
- Code organization
- Consistent approaches

### config
- Environment setup
- Tool configuration
- Build settings
- Deployment parameters

### preference
- User workflow preferences
- Communication style
- Tool choices
- Automation preferences

## Scope: Project vs Personal

### project (default)
- Applies to the current project
- Shared across all work on this codebase
- Architectural decisions, bug fixes, patterns

### personal
- Applies to the user across projects
- Communication preferences
- Workflow choices
- Tool configuration preferences

## Topic Keys

Use `topic_key` for decisions that may evolve:

```javascript
mem_save(
  title: "Chose Redis for session storage",
  type: "decision",
  topic_key: "session-storage",
  content: "..."
)

// Later, if decision changes:
mem_save(
  title: "Migrated session storage to PostgreSQL",
  type: "decision",
  topic_key: "session-storage",  // Same key
  content: "..."
)
```

Engram can track decision evolution via the stable key.

## Update and Delete

### mem_update

Update existing observation:

```javascript
mem_update(
  id: 42,
  title: "Updated title",
  content: "Updated content"
)
```

### mem_delete

Delete observation:

```javascript
mem_delete(
  id: 42,
  hard_delete: true  // Permanent
)
```

**Use sparingly.** Memory is cheap; deletion is permanent.

## Memory Statistics

### mem_stats

View memory statistics:

```javascript
mem_stats()
```

Shows:
- Total observations
- Breakdown by type
- Project distribution

## Timeline View

### mem_timeline

View observations around a specific one:

```javascript
mem_timeline(
  observation_id: 42,
  before: 5,  // 5 observations before
  after: 5    // 5 observations after
)
```

Useful for understanding context around a specific memory.

## Best Practices

### Save Early, Save Often

Don't wait until the end of a session. Save memory immediately after:
- Making a decision
- Fixing a bug
- Discovering something non-obvious

**Why:** If the session gets compacted or crashes, the memory persists.

### Be Specific in Titles

**Bad titles:**
- "Fixed bug"
- "Made a change"
- "Updated config"

**Good titles:**
- "Fixed WebSocket reconnection loop"
- "Chose PostgreSQL over MongoDB for user data"
- "Updated API rate limit to 1000 req/min"

### Include Context in Content

Don't just state what was done. Explain:
- **Why** it was done
- **What** alternatives were considered
- **Where** it affects the codebase
- **What** was learned

### Use Topic Keys for Decisions

Decisions evolve. Use topic keys to track evolution:

```javascript
// Initial decision
topic_key: "api-authentication"

// Evolution
topic_key: "api-authentication"  // Same key tracks history
```

### Search Before Repeating

Before solving a problem, search memory:

```javascript
mem_search(query: "authentication timeout")
```

You may have already solved this.

## Common Workflows

### Recording a Bug Fix

1. Fix the bug
2. Verify the fix works
3. Save to memory:
   ```javascript
   mem_save(
     title: "Fixed [specific issue]",
     type: "bugfix",
     content: "What/Why/Where/Learned"
   )
   ```

### Recording a Decision

1. Make the decision
2. Implement it
3. Save to memory:
   ```javascript
   mem_save(
     title: "Chose [option] for [purpose]",
     type: "decision",
     topic_key: "decision-area",
     content: "What/Why/Where/Learned"
   )
   ```

### Ending a Session

1. Complete the work
2. Save final memories
3. Write session summary:
   ```javascript
   mem_session_summary(
     content: "Goal/Instructions/Discoveries/Accomplished/NextSteps/Files"
   )
   ```

### Starting After Compaction

1. Check for "FIRST ACTION REQUIRED"
2. Save any compaction summary:
   ```javascript
   mem_session_summary(content: "...")
   ```
3. Load context:
   ```javascript
   mem_context()
   ```
4. Continue work

## Memory Hygiene

### What to Save

✅ **Save:**
- Decisions with rationale
- Bug fixes with root cause
- Non-obvious discoveries
- Established patterns
- User preferences

❌ **Don't save:**
- Trivial file reads
- Standard operations
- Obvious facts
- Temporary experiments

### When to Clean Up

Memory is cheap, but you can:
- Update observations that evolved
- Delete duplicates
- Remove obsolete temporary notes

**Use `mem_stats` to review** before bulk cleanup.

## Integration with Context-Mode

Engram memory and context-mode knowledge base are separate:

- **Engram** - Structured observations (decisions, bugs, patterns)
- **Context-mode** - Full-text search over indexed content + session events

Both accessible via:
- `mem_search` - Engram observations
- `ctx_search` - Context-mode FTS5 + auto-memory

Use **Engram** for explicit memory saves. Use **context-mode** for full-text search over large content and auto-captured events.

## Troubleshooting

### "Cannot detect project"

If `mem_session_summary` fails with project detection error:

1. Ask user which project
2. Retry with explicit project:
   ```javascript
   mem_session_summary(
     content: "...",
     project: "myapp"
   )
   ```

### Lost Memory After Compaction

Memory is **persistent**. If you can't find it:

1. Check `mem_stats` - is it there?
2. Search broadly: `mem_search(query: "broad term")`
3. Check timeline: `mem_timeline(observation_id: <known_id>)`

### Duplicate Saves

Use `topic_key` to update rather than duplicate:

```javascript
// Initial
mem_save(topic_key: "caching-strategy", ...)

// Update (same key)
mem_save(topic_key: "caching-strategy", ...)
```

Engram tracks evolution via the key.

## Summary

Engram persistent memory:
- **Save immediately** after decisions, bug fixes, discoveries
- **Format:** What/Why/Where/Learned
- **Search** before repeating work
- **Session summaries** before ending sessions
- **Scope:** Project or personal
- **Topic keys** for evolving decisions

Memory is your agent's long-term knowledge. Use it.
