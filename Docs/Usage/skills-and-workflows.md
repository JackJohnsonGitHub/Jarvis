# Skills and Workflows

This guide covers available skills, when to invoke them, and common workflow patterns for complex tasks.

## Available Skills

### Core Skills

#### context-mode
Process large outputs without consuming context window.

**Triggers:**
- "analyze logs"
- "summarize output"
- "process data"
- "parse JSON"
- "filter results"
- "extract errors"

**See:** [Context Mode](./context-mode.md)

#### visual-explainer
Generate HTML diagrams, architecture views, and data tables.

**Triggers:**
- "create a diagram"
- "show the architecture"
- "generate a visual"
- "make a comparison table"
- Any ASCII table with 4+ rows or 3+ columns (automatic)

**See:** [Visual Explainer](./visual-explainer.md)

#### gmcli
Gmail operations (search, read, send, labels).

**Triggers:**
- "check my email"
- "search for emails"
- "send an email"
- "mark as read"

**See:** [Google Workspace](./google-workspace.md)

#### gdcli
Google Drive file management.

**Triggers:**
- "upload to Drive"
- "download from Drive"
- "share this file"
- "list Drive files"

**See:** [Google Workspace](./google-workspace.md)

#### gccli
Google Calendar operations.

**Triggers:**
- "check my calendar"
- "create an event"
- "accept calendar invites"
- "list events"

**See:** [Google Workspace](./google-workspace.md)

### Extended Skills

#### find-skills
Discover and install new agent skills.

**Triggers:**
- "how do I do X?"
- "find a skill for X"
- "is there a skill that can...?"

**Use when:** Looking for capabilities that might exist as installable skills.

#### artystic
Aggressive design polish for web pages (making sites feel authored, editorial, image-led).

**Triggers:**
- "make this look more editorial"
- "polish the design"
- "make it feel more authored"

**Use when:** A page looks too generic, safe, or SaaS-like.

### Engineering Craft Skills

General software-quality skills loaded on demand:

| Skill | Use for |
|---|---|
| `code-design` | Designing code structure and APIs before implementing |
| `design-review` | Reviewing a design or architecture proposal |
| `testing` | Writing and structuring tests |
| `mermaid` | Mermaid diagram syntax and conventions |
| `markdown-conventions` | Markdown style rules for docs in this project |
| `improvement-discovery` | Systematically finding improvement opportunities |

### Meta Skills (working on Jarvis itself)

Skills for developing and debugging this `~/.pi` configuration:

| Skill | Use for |
|---|---|
| `pi-extension-lifecycle` | Extension development workflow (create, register, reload, verify) |
| `pi-cli-repro` | Reproducing Pi behavior through the real `pi` executable |
| `anthropic` | Debugging Anthropic OAuth failures and Pi request shaping |
| `frontmatter` | Skill frontmatter rules when creating or reviewing skills |

## Multi-Agent Orchestration (planned)

The previous workflow/sub-brain system (`@quintinshaw/pi-dynamic-workflows` and the `workflow` tool) has been **removed**. The target replacement — main Jarvis orchestrating five specialized sub-brains (`assistant`, `coder`, `redteam`, `blueteam`, `homelab`) — is defined in `Instructions/jarvis-project-context.md` and not yet implemented. Until then, the main session handles all domains directly.

## Common Workflow Patterns

### Email Triage and Response

1. Search for important unread emails
2. Read threads
3. Mark as read
4. Draft or send responses

**Commands:**
```bash
gmcli vikram@malkans.net search "is:unread in:inbox -category:promotions"
gmcli vikram@malkans.net thread <threadId>
gmcli vikram@malkans.net labels <threadId> --remove UNREAD
gmcli vikram@malkans.net send --to "..." --subject "..." --body "..."
```

### Calendar Management

1. List upcoming events
2. Find and read invites
3. Accept invites (copy to calendar)
4. Create new events

**Commands:**
```bash
gccli vikram@malkans.net events primary
gmcli vikram@malkans.net search "subject:Invitation"
gmcli vikram@malkans.net thread <threadId>
gccli vikram@malkans.net create primary --summary "..." --start "..." --end "..."
```

### Code Investigation

1. Use LSP to find definitions/references
2. Read relevant files
3. Process large outputs with ctx_execute
4. Save findings to memory

**Tools:**
- `lsp_navigation` for code intelligence
- `Read` for file contents
- `ctx_execute_file` for processing
- `mem_save` for discoveries

### Architecture Documentation

1. Analyze codebase structure
2. Generate visual diagram
3. Share with team

**Workflow:**
```javascript
// 1. Analyze
ctx_batch_execute({
  commands: [
    { label: "Structure", command: "tree -L 3 src/" },
    { label: "Components", command: "ls -la src/components/" },
    { label: "Services", command: "ls -la src/services/" }
  ],
  queries: ["main components", "service structure"]
})

// 2. Generate diagram
// User: "Create a visual diagram of the architecture"
// → Jarvis generates HTML to ~/.agent/diagrams/

// 3. Share
bash ~/.pi/agent/skills/visual-explainer/scripts/share.sh ~/.agent/diagrams/architecture.html
```

### Bug Investigation and Fix

1. Search memory for similar past bugs
2. Analyze current error
3. Locate problematic code (LSP)
4. Fix the issue
5. Verify fix works
6. Save to memory

**Workflow:**
```javascript
// 1. Search memory
mem_search({ query: "authentication timeout" })

// 2. Analyze error (via ctx_execute to filter logs)
ctx_execute_file({
  path: "error.log",
  language: "javascript",
  code: "const errors = FILE_CONTENT.split('\\n').filter(l => /ERROR/.test(l)); console.log(errors.join('\\n'));"
})

// 3. Find code
lsp_navigation({
  operation: "definition",
  filePath: "src/auth.ts",
  line: 45,
  symbol: "validateToken"
})

// 4. Fix
Edit(...)

// 5. Verify
Bash("npm test")

// 6. Save
mem_save({
  title: "Fixed authentication timeout in token validation",
  type: "bugfix",
  content: "What/Why/Where/Learned"
})
```

### Multi-File Analysis

1. Batch execute to gather data
2. Index output with queries
3. Generate visual summary

**Workflow:**
```javascript
ctx_batch_execute({
  commands: [
    { label: "Auth module", command: "cat src/auth/*.ts" },
    { label: "Tests", command: "cat tests/auth/*.test.ts" },
    { label: "Config", command: "cat config/auth.json" }
  ],
  queries: [
    "authentication methods",
    "test coverage",
    "configuration options"
  ],
  concurrency: 1
})
```

## Skill Loading

### On-Demand Loading

Jarvis loads skills when needed:

```bash
Read: /home/zhiroku/.pi/agent/skills/<skill-name>/SKILL.md
```

Skills are not held in memory — loaded fresh each time.

### Finding New Skills

```javascript
// User: "Is there a skill for X?"
// → Jarvis invokes find-skills skill
```

The find-skills skill searches available skills and offers installation options.

## Parallel Execution

### ctx_batch_execute Concurrency

For I/O-bound work:
```javascript
ctx_batch_execute({
  commands: [/* multiple I/O commands */],
  concurrency: 4  // Parallel execution
})
```

**Use 4-8 for:** Network calls, gh, curl, cloud APIs, multi-repo git reads

**Keep at 1 for:** CPU-bound (test, build, lint), stateful commands (ports, locks)

## Chaining Operations

### Sequential with Results

```bash
# 1. Find files
ctx_execute(...)  # → list of files

# 2. Process each
ctx_batch_execute({
  commands: files.map(f => ({ label: f, command: `cat ${f}` })),
  queries: ["specific information"]
})

# 3. Synthesize
# User: "Create a summary diagram"
# → visual-explainer generates HTML
```

## Tips

1. **Batch when possible** - ctx_batch_execute is efficient
2. **Save to memory** - After decisions, bugs, discoveries
3. **Search before repeating** - Check memory first
4. **Use visual diagrams** - For complex explanations
5. **Process in-sandbox** - Keep large data out of context
6. **Read the SKILL.md** - Before composing non-trivial skill commands

## Summary

Skills provide specialized capabilities:
- **context-mode** - Process large outputs efficiently
- **visual-explainer** - Generate HTML diagrams
- **gmcli/gdcli/gccli** - Google Workspace automation
- **Craft skills** - code-design, design-review, testing, mermaid, markdown-conventions, improvement-discovery
- **Meta skills** - pi-extension-lifecycle, pi-cli-repro, anthropic, frontmatter for working on Jarvis itself

Each skill has specific use cases. Read the relevant documentation for details.
