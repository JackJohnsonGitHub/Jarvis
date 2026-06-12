# Best Practices

This guide covers communication patterns, error handling, performance considerations, and security practices for working effectively with Jarvis.

## Communication Patterns

### Be Direct and Specific

**Good:**
- "Update the API URL to production in the config file"
- "Find all TypeScript errors in the auth module"
- "Create a visual diagram of the WebSocket architecture"

**Less Effective:**
- "Maybe we could possibly update something?"
- "Can you help with some errors somewhere?"
- "I'm not sure, but could you maybe..."

### Trust Inference

Jarvis fills in reasonable details. Don't over-specify:

**Good:**
- "Send an email to the team about the release"
- "Accept all my calendar invites"
- "Fix the authentication bug"

**Over-specified:**
- "Use gmcli to send an email using the send command with these exact flags..."
- "First search for invites, then read each one, then create calendar events for each..."

Jarvis knows the tools and workflows.

### Confirm When It Matters

Jarvis will ask for confirmation before:
- Sending emails
- Deleting files
- Accepting calendar invites
- Sharing Drive files
- Destructive operations

**Override when appropriate:**
- "Send this email now" (explicit approval)
- "Delete these files immediately" (skip confirmation)

### Ask for Explanations

When unclear, ask:
- "Why did you choose this approach?"
- "What are the trade-offs?"
- "What could go wrong?"
- "Can you explain this decision?"

Jarvis will explain reasoning and alternatives.

## File Operations

### Reading Files

**Use Read for:**
- Examining file contents
- Planning edits (need exact text for oldText matching)
- Small to medium files

**Use ctx_execute_file for:**
- Processing large files
- Deriving information (counts, patterns, summaries)
- Files you won't edit

**Example:**
```javascript
// Bad: Reading 700KB log file
Read: application.log

// Good: Processing in-sandbox
ctx_execute_file(
  path: "application.log",
  language: "javascript",
  code: "const errors = FILE_CONTENT.split('\\n').filter(l => /ERROR/.test(l)); console.log(\`\${errors.length} errors\`);"
)
```

### Editing Files

**Key rules:**
1. `oldText` must match exactly (including whitespace)
2. Multiple non-overlapping edits can happen in one call
3. Each edit applies to the original file, not incrementally
4. Keep edits small and unique

**Example:**
```javascript
Edit(
  path: "/path/to/file.js",
  edits: [
    {
      oldText: "const apiUrl = 'http://localhost'",
      newText: "const apiUrl = 'https://api.prod.com'"
    },
    {
      oldText: "timeout: 5000",
      newText: "timeout: 30000"
    }
  ]
)
```

### Writing Files

**Use Write for:**
- Creating new files
- Complete rewrites

**Don't use Write for:**
- Modifying existing files (use Edit)
- Small changes to existing files

## Command Execution

### Choosing the Right Tool

| Task | Tool | Why |
|------|------|-----|
| Simple command, short output | Bash | Direct, efficient |
| Derive answer from data | ctx_execute | Keeps raw data out of context |
| Process specific file | ctx_execute_file | File content in FILE_CONTENT |
| Multiple related commands | ctx_batch_execute | Batch with auto-indexing |

### Think-in-Code

**Principle:** Process data in code, print only the answer.

**Bad:**
```bash
Bash: cat huge-file.log
# 700KB enters context
```

**Good:**
```javascript
ctx_execute_file(
  path: "huge-file.log",
  language: "javascript",
  code: "console.log(\`Lines: \${FILE_CONTENT.split('\\n').length}\`);"
)
# 1 line enters context
```

### Background Processes

For long-running processes:

```javascript
ctx_execute(
  language: "shell",
  code: "npm run dev",
  background: true,
  timeout: 30000
)
```

**Process stays alive after timeout.** Don't add self-close timers.

## Memory Management

### Save Immediately

Don't wait until end of session. Save after:
- Bug fix completed
- Decision made
- Discovery found
- Pattern established
- Preference learned

**Format:**
```javascript
mem_save(
  title: "Specific, searchable title",
  type: "bugfix | decision | architecture | discovery | pattern | config | preference",
  content: "What/Why/Where/Learned"
)
```

### Search Before Repeating

Before solving a problem:

```javascript
mem_search({ query: "similar problem description" })
```

You may have already solved it.

### Session Summaries

Before ending a session:

```javascript
mem_session_summary(
  content: "Goal/Instructions/Discoveries/Accomplished/NextSteps/Files"
)
```

This persists context across sessions.

## Performance Considerations

### Context Window Efficiency

**Context is precious.** Use tools that keep data out:

| Operation | Context Cost |
|-----------|-------------|
| Read 700KB file | 700KB |
| ctx_execute_file + print 3KB | 3KB |
| Bash command, 100 lines | ~5KB |
| ctx_execute, print summary | ~2KB |

**Savings ratio:** Often 90%+ with context-mode.

### Batching Operations

**Bad (3 round trips):**
```javascript
ctx_execute(...)
ctx_execute(...)
ctx_execute(...)
```

**Good (1 round trip):**
```javascript
ctx_batch_execute({
  commands: [...],
  queries: [...]
})
```

### Parallel Execution

For I/O-bound work:

```javascript
ctx_batch_execute({
  commands: [/* I/O commands */],
  concurrency: 4
})
```

**When to use:**
- Network calls (gh, curl)
- Cloud APIs
- Multi-repo git operations

**When NOT to use:**
- CPU-bound (test, build, lint)
- Stateful commands (ports, locks)

## Error Handling

### When Errors Occur

Jarvis will:
1. Stay calm
2. Explain what is known
3. Explain what is unknown
4. Suggest next steps

**Your response:**
- Review the explanation
- Approve suggested fix
- Ask for alternatives
- Provide additional context

### Common Error Patterns

#### Tool Failures

**Jarvis reports:**
> "The command failed with exit code 1. The error indicates..."

**You can:**
- "Try the suggested fix"
- "Show me the full error output"
- "What are alternative approaches?"

#### File Not Found

**Jarvis reports:**
> "File not found at /path/to/file"

**You can:**
- "Search for the file"
- "The file is actually at /other/path"
- "Create it with these contents"

#### Permission Denied

**Jarvis reports:**
> "Permission denied. This operation requires..."

**You can:**
- "Run with sudo"
- "Change file permissions"
- "Use a different approach"

### Recovery Strategies

1. **Read error output** - Use ctx_execute to filter and analyze
2. **Check recent changes** - Git log, file history
3. **Search memory** - Similar past issues
4. **Try alternatives** - Different tools or approaches
5. **Verify assumptions** - Double-check paths, permissions, config

## Security and Privacy

### Email and Calendar

**Side effects confirmed:**
- Sending emails
- Creating/updating events
- Accepting invites
- Sharing files

**Best practices:**
- Review draft emails before sending
- Verify event details before creating
- Check file sharing permissions
- Don't share sensitive data unnecessarily

### File Operations

**Destructive operations confirmed:**
- Deleting files
- Overwriting files
- Removing directories

**Best practices:**
- Back up before major changes
- Use git for versioned files
- Double-check paths before deletion
- Test changes locally first

### Credentials and Secrets

**Never:**
- Include API keys in prompts
- Share passwords in conversation
- Commit secrets to git
- Log sensitive data

**Always:**
- Use environment variables
- Store credentials in secure locations
- Use `.gitignore` for secret files
- Rotate exposed credentials immediately

### Data Privacy

**Gmail/Calendar/Drive:**
- Data accessed via CLI tools using OAuth
- No data sent to third parties
- Credentials stored locally (`~/.gmcli`, `~/.gdcli`, `~/.gccli`)

**Context-mode:**
- All processing happens locally
- No data sent to external services
- FTS5 index stored in `~/.context-mode/`

**Engram Memory:**
- Stored locally in project directories
- No external synchronization
- User controls retention and deletion

## Visual Diagrams

### When Diagrams Help

Use visual-explainer for:
- Architecture explanations
- Complex comparisons (generates HTML table)
- Process workflows
- Implementation plans
- Project recaps

### When Text Is Better

Use text responses for:
- Simple answers
- Linear lists (< 3 items)
- Quick confirmations
- Status updates

### Aesthetic Variety

Jarvis varies aesthetic choices. Don't expect:
- Same fonts every time
- Same colors every time
- Same layout patterns

**This is intentional.** Each diagram looks distinct.

## Workflow Orchestration

### When to Use workflow

**Use for:**
- Explicit request: "Run a workflow"
- Decomposable work across perspectives
- Fan-out analysis + synthesis
- Parallel independent tasks

**Don't use for:**
- Simple single-file operations
- Quick queries
- Standard tool operations

### Tier Tagging

**Always tag agents:**
- `tier: 'small'` - Quick exploration, search, inventory
- `tier: 'medium'` - Balanced analysis
- `tier: 'big'` - Synthesis across full context

**Example:**
```javascript
await agent('Quick file scan', { tier: 'small' })
await agent('Analyze patterns', { tier: 'medium' })
await agent('Synthesize all findings', { tier: 'big' })
```

## Common Mistakes

### ❌ Over-Reading Files

**Mistake:** Reading every file completely

**Fix:** Use ctx_execute_file to derive information

### ❌ Ignoring Memory

**Mistake:** Solving the same problem twice

**Fix:** Search memory before solving

### ❌ Verbose Communication

**Mistake:** Over-explaining simple requests

**Fix:** Be direct; trust inference

### ❌ Skipping Confirmations

**Mistake:** Assuming Jarvis will always confirm

**Fix:** Explicitly approve side effects when needed

### ❌ Not Using Batching

**Mistake:** Multiple sequential ctx_execute calls

**Fix:** Use ctx_batch_execute with queries

### ❌ Wrong Tool Choice

**Mistake:** Using Bash for data processing

**Fix:** Use ctx_execute for derivation

### ❌ Forgetting Session Summaries

**Mistake:** Ending without mem_session_summary

**Fix:** Always summarize before "done"

## Daily Workflows

### Morning Email Review

1. "What are my important unread emails?"
2. Review summaries
3. "Mark them as read and draft responses where needed"

### Calendar Check

1. "What's on my calendar today?"
2. Review events
3. "Accept any pending invites"

### Code Investigation

1. "Find all TypeScript errors in the project"
2. Review via ctx_execute (filtered)
3. "Show me the architecture of the auth module"
4. Fix issues
5. Save discoveries to memory

### Project Status

1. "Generate a project recap for this week"
2. Review visual diagram
3. Share with team

## Tips for Success

1. **Be direct** - State what you want clearly
2. **Trust the agent** - Jarvis fills in reasonable details
3. **Use the right tool** - context-mode, visual-explainer, memory
4. **Save memory early** - Don't wait until the end
5. **Search before repeating** - Check if you've solved it before
6. **Batch operations** - Combine related commands
7. **Process in-sandbox** - Keep large data out of context
8. **Confirm side effects** - Review before sending/deleting
9. **Ask for explanations** - "Why did you choose this?"
10. **Leverage proactivity** - Let Jarvis suggest next steps

## Summary

Best practices for working with Jarvis:
- **Communication:** Direct, specific, trusting inference
- **Files:** Read for editing, ctx_execute_file for processing
- **Commands:** Choose the right tool for the task
- **Memory:** Save immediately, search before repeating
- **Performance:** Think-in-code, batch operations, parallel I/O
- **Errors:** Stay calm, review suggestions, try alternatives
- **Security:** Confirm side effects, protect credentials, verify operations
- **Workflows:** Use appropriate tools, tag tiers, synthesize results

Follow these patterns for efficient, secure, and effective collaboration.
