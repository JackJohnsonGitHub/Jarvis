# Getting Started with Jarvis

## Introduction

Jarvis is your JARVIS-inspired AI assistant — the Jarvis harness, built on Pi — designed to be calm, precise, and proactive. Launch it with the `jarvis` command from `~/.pi`. This guide covers fundamental interaction patterns and core capabilities.

## Basic Interaction Patterns

### Asking Questions

Jarvis understands natural language and infers intent from context. Be specific when precision matters, but don't over-explain:

**Good:**
- "What are my unread emails that are important?"
- "Show me the most recent changes to the authentication module"
- "Create a visual diagram of the WebSocket architecture"

**Less Effective:**
- "Can you maybe help me check if there are emails?" (too tentative)
- "I was wondering if you could possibly..." (unnecessary hedging)

### Getting Confirmations

Jarvis will confirm before:
- Sending emails or calendar invites
- Deleting or overwriting files
- Executing destructive operations
- Accepting calendar invites or RSVPing

You can skip confirmations by being explicit: "Send this email now" vs "Draft this email for review."

## Core Tool Usage

### Reading Files

```bash
# Single file
Read: /path/to/file.txt

# With offset and limit for large files
Read: /path/to/file.txt (offset: 100, limit: 50)
```

Jarvis uses the `Read` tool for examining file contents. For large files, consider using `ctx_execute_file` to process in-sandbox without consuming context.

### Editing Files

Jarvis uses precise text replacement:

```
Edit: /path/to/file.js
- oldText: "const apiUrl = 'http://localhost'"
- newText: "const apiUrl = 'https://api.example.com'"
```

**Key rules:**
- `oldText` must match exactly (including whitespace)
- Multiple non-overlapping edits can happen in one call
- Each edit applies to the original file, not incrementally

### Writing Files

```bash
Write: /path/to/newfile.txt
Content: "File contents here"
```

Creates new files or completely overwrites existing ones. For modifications, use Edit instead.

### Executing Commands

**Bash** - For direct command execution:
```bash
Bash: ls -la /home/zhiroku/projects/
```

**ctx_execute** - For processing large outputs:
```javascript
ctx_execute(language: "javascript", code: `
  const fs = require('fs');
  const files = fs.readdirSync('src').filter(f => f.endsWith('.ts'));
  console.log(\`Found \${files.length} TypeScript files\`);
`)
```

**When to use each:**
- **Bash**: Simple commands with short output (ls, pwd, git status)
- **ctx_execute**: Processing that derives an answer from data
- **ctx_execute_file**: Processing a specific large file

See [Context Mode](./context-mode.md) for detailed guidance.

## Understanding Responses

### Response Structure

Jarvis typically follows this pattern:

1. **Brief acknowledgement** - "Certainly."
2. **Direct answer or action** - The result or information
3. **Important notes or risks** - Caveats or considerations
4. **Suggested next step** - When useful

**Example:**
> "Certainly. The issue appears to be caused by an incorrect environment variable. I recommend updating `API_BASE_URL` in your `.env` file and restarting the service.
> 
> One concern: the current value points to production, so test changes locally first.
> 
> Shall I proceed with updating the file and running a local test?"

### Reading Between the Lines

Jarvis communicates efficiently:
- **"I recommend..."** - Strong suggestion based on best practices
- **"One concern..."** - Risk or side effect you should know
- **"Shall I proceed?"** - Asking permission before a side effect
- **"There is one concern worth noting..."** - Pay attention to this
- **"If you'd like, I can..."** - Optional enhancement or automation

## File and Path Handling

### Path Resolution

- Relative paths resolve from current working directory (`/home/zhiroku/.pi`)
- Use absolute paths when ambiguous
- Jarvis will check paths before operations

### Reading Skill Files

When a skill is needed, Jarvis loads it with:
```bash
Read: /home/zhiroku/.pi/agent/skills/<skill-name>/SKILL.md
```

Skills are loaded on-demand, not held in memory.

## Working with Large Outputs

### Think-in-Code Philosophy

The core principle: **bytes your code processes never enter conversation memory; only what you console.log() does.**

**Bad (700KB consumed):**
```bash
# Reading a 700KB log file directly
Read: huge-application.log
```

**Good (3KB consumed):**
```javascript
ctx_execute_file(path: "huge-application.log", language: "javascript", code: `
  const errors = FILE_CONTENT.split('\\n').filter(l => /ERROR|FATAL/.test(l));
  console.log(\`\${errors.length} error lines found\`);
  console.log(errors.slice(-5).join('\\n'));
`)
```

Result: 47 files analyzed, 15,314 LoC summarized in ~3.6KB instead of 700KB.

## Error Handling

When Jarvis encounters errors:

1. **Stays calm** - No panic or confusion
2. **Explains what is known** - Facts about the error
3. **Explains what is unknown** - Gaps in understanding
4. **Suggests next steps** - How to proceed

**Example:**
> "The command failed with exit code 1. The error indicates a missing dependency. I recommend checking `package.json` for the required module and running `npm install`. Would you like me to inspect the dependency list?"

## Next Steps

- Learn about [Google Workspace](./google-workspace.md) integration
- Explore [Context Mode](./context-mode.md) for efficient data processing
- Review [Visual Explainer](./visual-explainer.md) for diagram generation
- Understand the [Memory System](./memory-system.md) for persistent knowledge

## Common Patterns

### Reading and Summarizing

**Request:** "What's in the config file?"

**Jarvis will:**
1. Read the file
2. Summarize key settings
3. Note any unusual or risky values
4. Suggest improvements if relevant

### Making Changes

**Request:** "Update the API URL to production"

**Jarvis will:**
1. Locate the configuration
2. Show current vs. proposed change
3. Warn about side effects (if any)
4. Ask for confirmation
5. Execute and verify

### Investigating Issues

**Request:** "Why is the build failing?"

**Jarvis will:**
1. Check recent changes (git log)
2. Review build output (via ctx_execute to filter errors)
3. Identify the root cause
4. Suggest a fix
5. Offer to implement it

## Tips for Effective Collaboration

1. **Be direct** - State what you want clearly
2. **Trust inference** - Jarvis fills in reasonable details
3. **Confirm when it matters** - Explicitly approve destructive actions
4. **Ask for explanations** - "Why did you choose X?" is always valid
5. **Leverage proactivity** - Let Jarvis suggest next steps
