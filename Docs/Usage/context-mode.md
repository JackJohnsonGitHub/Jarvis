# Context Mode

Context-mode is a knowledge base and execution sandbox that keeps large outputs out of your conversation memory. This guide covers the Think-in-Code philosophy and context-mode tools.

## Philosophy: Think-in-Code

**Core principle:** The bytes your code processes never enter conversation memory; only what you `console.log()` does.

### The Problem

Reading a 700KB log file directly means 700KB of your reasoning capacity gets spent on raw bytes, leaving less room for actual work.

### The Solution

Run code over that same log in the context-mode sandbox and print a 3KB summary — leaves you with 697KB of capacity for the work.

**Concrete example:**

❌ **Bad (700KB consumed):**
```bash
Read: huge-application.log
```

✅ **Good (3KB consumed):**
```javascript
ctx_execute_file(
  path: "huge-application.log",
  language: "javascript",
  code: `
    const errors = FILE_CONTENT.split('\\n').filter(l => /ERROR|FATAL/.test(l));
    console.log(\`\${errors.length} error lines\`);
    console.log(errors.slice(-5).join('\\n'));
  `
)
```

**Result:** 47 files analyzed, 15,314 LoC summarized in ~3.6KB instead of 700KB.

## When to Use Context-Mode

### Use ctx_execute when:
- You intend to **derive an answer FROM data** (filter, count, aggregate, parse, compare, transform)
- Output shape or size cannot be predicted before execution
- You would otherwise read raw output and mentally compute
- You need to keep a long-running process alive (with `background: true`)

### Use ctx_execute_file when:
- You want to know **something about a file** without seeing all of it
- The file is structured (CSV, JSON, log, code)
- The file is large enough that reading it would burn meaningful context
- You intend to edit the file later (still need to Read for exact text matching)

### Use ctx_batch_execute when:
- You have 3+ related commands to run sequentially
- You want to gather AND query in one round trip (pass `queries`)
- You want to parallelize I/O-bound work (pass `concurrency` 2-8)
- The combined output is large enough that querying later would be expensive

### Use Bash when:
- Single observational command with short output (whoami, pwd, git status on clean tree)
- File mutations (handled by Edit/Write) or navigation (cd/ls)
- You know the output is one short fixed line

## Core Tools

### ctx_execute

Run code in a sandbox. Only what you print enters context.

**JavaScript example:**
```javascript
ctx_execute(
  language: "javascript",
  code: `
    const fs = require('fs');
    const files = fs.readdirSync('src').filter(f => f.endsWith('.ts'));
    console.log(\`Found \${files.length} TypeScript files\`);
    files.forEach(f => {
      const lines = fs.readFileSync(\`src/\${f}\`, 'utf8').split('\\n').length;
      console.log(\`\${f}: \${lines} lines\`);
    });
  `
)
```

**Shell example:**
```bash
ctx_execute(
  language: "shell",
  code: "npm test 2>&1 | grep -E '(FAIL|✗|×|Error:|Tests +.*(failed|passed))' | head -60"
)
```

**Python example:**
```python
ctx_execute(
  language: "python",
  code: `
import json
with open('data.json') as f:
    data = json.load(f)
print(f"Total records: {len(data)}")
print(f"Keys: {', '.join(data[0].keys())}")
  `
)
```

**Available languages:**
- javascript, typescript (Bun - 3-5× faster than Node)
- shell
- python
- ruby, go, rust, php, perl, r, elixir, csharp
*-- Fuck ruby, fuck perl, and fuck r...--*

**Background processes:**
```javascript
ctx_execute(
  language: "javascript",
  code: "require('child_process').spawn('npm', ['run', 'dev'])",
  background: true,
  timeout: 30000
)
```

With `background: true`, the process keeps running after timeout. Returns partial output without killing the process. **Do NOT add setTimeout/self-close timers** — the process must stay alive.

### ctx_execute_file

Process a single file in-sandbox. The file content loads into a `FILE_CONTENT` variable.

**Example:**
```javascript
ctx_execute_file(
  path: "huge.log",
  language: "javascript",
  code: `
    const errs = FILE_CONTENT.split('\\n').filter(l => /ERROR|FATAL/.test(l));
    console.log(\`\${errs.length} error lines\`);
    console.log(errs.slice(-5).join('\\n'));
  `
)
```

**Use cases:**
- Count lines, matches, or patterns
- Extract specific sections
- Parse structured data (CSV, JSON, logs)
- Statistical aggregates

**When NOT to use:**
- You intend to Edit the file (need exact text from Read)
- File is small AND you'll consume all of it
- You only need one specific line with known offset (Read with offset/limit)

### ctx_batch_execute

Run multiple commands in one call. Every command's output is auto-indexed; matching sections come back if you pass `queries`.

**Example:**
```javascript
ctx_batch_execute(
  commands: [
    { label: "README", command: "cat README.md" },
    { label: "Package", command: "cat package.json" },
    { label: "Tree", command: "tree -L 2 src/" },
    { label: "Git log", command: "git log --oneline -10" }
  ],
  queries: [
    "What dependencies are used?",
    "What's the project structure?",
    "Recent changes to authentication"
  ]
)
```

**Concurrency:**
```javascript
ctx_batch_execute(
  commands: [
    { label: "issue 1", command: "gh issue view 1" },
    { label: "issue 2", command: "gh issue view 2" },
    { label: "issue 3", command: "gh issue view 3" }
  ],
  queries: ["root cause", "proposed fix"],
  concurrency: 3  // Parallel I/O
)
```

- **concurrency: 1** (default) - Sequential execution, shared timeout budget
- **concurrency: 2-8** - Parallel execution, per-command timeouts

Use 4-8 for I/O-bound batches (network, gh, curl, multi-repo git reads). Keep at 1 for CPU-bound (npm test, build, lint) or stateful commands (ports, locks).

**Query scope:**
- `query_scope: "batch"` (default) - Search ONLY this batch's output
- `query_scope: "global"` - Search entire persistent index

## Indexing and Search

### ctx_index

Store content in the searchable knowledge base.

**Single file:**
```javascript
ctx_index(
  path: "/path/to/docs.md",
  source: "react-useeffect-docs"
)
```

**Directory:**
```javascript
ctx_index(
  path: "/path/to/project/docs/",
  source: "project-documentation",
  maxDepth: 3,
  maxFiles: 200
)
```

**Inline content:**
```javascript
ctx_index(
  content: "# API Reference\n\nEndpoint docs here...",
  source: "api-reference"
)
```

**Use cases:**
- Documentation from web or MCP tools
- API references
- Skill prompts too large for conversation
- README files, migration guides, changelogs

**When NOT to use:**
- Log files, test output, CSV, build output (use ctx_execute_file)
- Single-use ephemeral content

### ctx_search

Search the unified knowledge base (indexed content + auto-captured session memory).

**Example:**
```javascript
ctx_search(
  queries: [
    "root cause",
    "proposed fix",
    "test coverage"
  ],
  source: "issue-#683",  // Optional filter
  limit: 5
)
```

**Multi-strategy ranking:**
- Porter-stemming matcher ("caching" finds "cached", "caches")
- Trigram substring ("useEff" finds "useEffect")
- Results merged via Reciprocal Rank Fusion
- Proximity rerank for multi-term queries
- Typo correction via Levenshtein distance

**Session memory categories:**
- decision (user corrections/preferences)
- error and error-resolution (past failures + fixes)
- blocker
- plan
- user-prompt
- rejected-approach
- compaction (post-compact session guide)

**Sort modes:**
- `sort: "relevance"` (default) - BM25 ranked, current session only
- `sort: "timeline"` - Chronological across sessions

**Content type filter:**
- `contentType: "code"` - Implementation snippets
- `contentType: "prose"` - Explanations

### ctx_fetch_and_index

Fetch URLs, convert to markdown, and index in one call.

**Single URL:**
```javascript
ctx_fetch_and_index(
  url: "https://react.dev/reference/react/useEffect",
  source: "react-useeffect"
)
```

**Batch with concurrency:**
```javascript
ctx_fetch_and_index(
  requests: [
    { url: "https://react.dev/...", source: "react" },
    { url: "https://vuejs.org/...", source: "vue" },
    { url: "https://angular.io/...", source: "angular" }
  ],
  concurrency: 5
)
```

**Caching:**
- Default TTL: 24 hours
- Override: `ttl: <milliseconds>`
- Bypass cache: `force: true` or `ttl: 0`
- Cleanup: Content older than 14 days deleted on startup

**Use cases:**
- Documentation, changelogs, API references
- Multi-URL research (library evaluation, migration scans)
- Long-lived cache for stable specs

**When NOT to use:**
- Content already local (use ctx_index)
- SPA-rendered pages (no headless browser)

## Session Statistics

### ctx_stats

Show context savings for the current session.

```javascript
ctx_stats()
```

**Output:**
- Total bytes returned to context
- Breakdown by tool
- Call counts
- Estimated token usage
- Context savings ratio

Read-only — no reset capability. To wipe the knowledge base entirely, use `ctx_purge`.

### ctx_insight

Open the context-mode Insight analytics dashboard.

```javascript
ctx_insight()
```

**Shows:**
- Session activity
- Tool usage
- Error rate
- Parallel work patterns
- Project focus
- Actionable insights

First run installs dependencies (~30s). Subsequent runs open instantly. Defaults to port 4747.

## Purging Data

### ctx_purge

**DESTRUCTIVE.** Permanently delete indexed content.

**Per-session:**
```javascript
ctx_purge(
  confirm: true,
  sessionId: "<uuid>"
)
```

Deletes that session's events and FTS5 chunks. Sibling sessions and stats preserved.

**Per-project:**
```javascript
ctx_purge(
  confirm: true,
  scope: "project"
)
```

Wipes FTS5 knowledge base, every session DB row, events markdown, and resets stats.

**Requirements:**
- `confirm: true` required
- Exactly one scope (sessionId OR scope:'project')
- Cannot be undone

## Best Practices

### Processing Large Outputs

1. **Derive, don't dump** - Print the answer, not the raw data
2. **Filter early** - grep/filter before processing
3. **Summarize aggressively** - Counts, samples, key excerpts
4. **Use intent parameter** - For recall-by-topic on large outputs

### Intent-Based Indexing

When output may legitimately be large but you want recall-by-topic:

```javascript
ctx_execute(
  language: "shell",
  code: "npm test 2>&1",
  intent: "failing tests"
)
```

Outputs over ~5KB are auto-indexed. Only section titles + previews come back. Use `ctx_search` to drill into sections.

**Searchable terms shown in response** - Use those for targeted retrieval.

### Batching Queries

**Bad (3 separate round trips):**
```javascript
ctx_search(queries: ["root cause"])
ctx_search(queries: ["proposed fix"])
ctx_search(queries: ["test coverage"])
```

**Good (1 round trip):**
```javascript
ctx_search(queries: [
  "root cause",
  "proposed fix",
  "test coverage"
])
```

### Concurrency Guidelines

**I/O-bound (use 4-8):**
- Network calls (gh, curl)
- Cloud APIs
- Multi-repo git reads

**CPU-bound or stateful (use 1):**
- npm test, build, lint
- Port-binding servers
- Lock-file holders
- Anything that races on the same resource

### Memory Management

Context-mode's FTS5 index is persistent. Clean it periodically:

1. Check stats: `ctx_stats()`
2. Review categories: `ctx_search(sort: "timeline")`
3. Purge stale sessions: `ctx_purge(confirm: true, sessionId: "<uuid>")`
4. Full reset: `ctx_purge(confirm: true, scope: "project")` (nuclear option)

## Troubleshooting

### ctx_doctor

Run diagnostics:

```javascript
ctx_doctor()
```

Checks:
- Runtimes (Node, Bun, Python, etc.)
- Hooks
- FTS5
- Plugin registration
- npm and marketplace versions

### ctx_upgrade

Update context-mode:

```javascript
ctx_upgrade()
```

Returns a shell command to execute. Run it with Bash, then restart your session.

## Advanced Patterns

### MCP Tool Output

Context-mode auto-routes MCP tool outputs via PreToolUse hook. Any MCP tool that may return >20 lines gets wrapped in ctx_execute.

### Browser Snapshot

Page snapshots via Chrome DevTools can be processed:

```javascript
ctx_execute(
  language: "javascript",
  code: `
    const snapshot = /* DOM structure */;
    // Extract forms, links, key elements
    console.log("Extracted navigation links");
  `
)
```

## Summary

Context-mode keeps large data out of conversation memory:
- **ctx_execute** - Derive answers from data
- **ctx_execute_file** - Process single files in-sandbox
- **ctx_batch_execute** - Multi-command with auto-indexing
- **ctx_index** - Store searchable content
- **ctx_search** - Retrieve indexed knowledge
- **ctx_fetch_and_index** - Web content in one call

**Key insight:** Code over data, print only the answer. Save 90%+ of context capacity for actual reasoning.
