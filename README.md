# Jarvis AI Agent

A JARVIS-inspired AI assistant built on the [Pi coding agent](https://github.com/earendil-works/pi-coding-agent) — calm, precise, proactive, and technically capable.

---

## Quick Start

```bash
# 1. Install Pi first
curl -fsSL https://pi.dev/install.sh | sh

# 2. Clone Jarvis into Pi's config directory
git clone --branch main https://github.com/JackJohnsonGitHub/Jarvis.git ~/.pi

# 3. Run the setup script
cd ~/.pi && ./install.sh
```

Then launch:

```bash
source ~/.bashrc   # or restart your terminal
jarvis
```

> `jarvis` is the branded launcher installed by the script. The underlying `pi` command works identically.

---

## First Launch — What to Expect

This is what happens the first time you type `jarvis`.

### 1. You See a Blank Prompt

Jarvis starts with a clean prompt — no menus, no configuration screens. Just type something natural:

```
What can you do?
```

or say hello. Everything is plain English.

### 2. Jarvis Introduces Itself

The first response explains who Jarvis is and briefly lists what it can help with — email, calendar, code, research, voice, memory. It also mentions a few slash commands like `/listen` and `/speak`.

### 3. Explore Naturally

You do not need to learn any commands upfront. Try one of these right away:

```
What time is it?
What are my unread emails?
Show me the files in this directory.
```

Jarvis infers intent and picks the right tool automatically.

### 4. If It Asks for API Keys

Jarvis uses a model router that tries the strongest available model first. If no API key is set, you might see a prompt.

**Quick fix:**

```bash
export ANTHROPIC_API_KEY="your-key"   # Recommended — Claude models
```

If you have **Claude Pro/Max**, the OAuth extension can authenticate without an API key — follow the on-screen link when prompted. Type `/router profile bulk` to switch to a minimal model if you just want to test the interface.

### 5. That Is It

There is nothing else to configure for a basic session. Voice, memory, and code intelligence all work out of the box.

For Gmail, Drive, or Calendar access, follow the [Google Workspace setup](./Docs/Usage/google-workspace.md) when you are ready.

---

## What `install.sh` Does

The script is fully automated and idempotent — safe to re-run.
**Pi must be installed first** (step 1 of Quick Start); the script will exit if it is not found.

1. Configures the npm global prefix (`~/.npm-global`)
2. Checks for `node` (v18+), `npm`, `git`, `curl`, `tar`
3. Installs `espeak-ng` and `ffmpeg` via your system package manager (`apt` / `dnf` / `pacman` / `brew`)
4. Verifies the Pi coding agent is installed (exits with instructions if not)
5. Installs Google Workspace CLIs (`gmcli`, `gdcli`, `gccli`)
6. Verifies the Jarvis repo is present at `~/.pi` (`main` branch — checkout a different branch manually if needed)
7. Installs all extension dependencies (`cd agent && npm install`)
8. Installs the `jarvis` binary to `~/.npm-global/bin/`
9. Creates runtime directories (`pi-lens`, `context-mode`, `models`, `~/.engram`, etc.)
10. Offers to pre-download the Whisper STT model (~200 MB, optional — auto-downloads on first `/listen` otherwise)
11. Appends `PATH` and env vars to `~/.bashrc` / `~/.zshrc`
12. Verifies all binaries and config files

See [INSTALL.md](./INSTALL.md) for prerequisites, manual steps, and troubleshooting.

---

## Features

| Category | Capability |
|---|---|
| **Persona** | JARVIS-inspired — calm, precise, proactive, dry wit |
| **Voice** | Local STT (Whisper base int8 via sherpa-onnx) + TTS (espeak-ng) — no cloud, no API keys |
| **Google Workspace** | Gmail, Drive, and Calendar via `gmcli` / `gdcli` / `gccli` |
| **Memory** | Persistent cross-session memory via Engram (`gentle-engram`) |
| **Context management** | `context-mode` processes large outputs without consuming context window |
| **Code intelligence** | `pi-lens` — LSP diagnostics, ast-grep, tree-sitter rules |
| **Visual diagrams** | `visual-explainer` generates self-contained HTML pages |
| **Web research** | `pi-web-access` — web fetch and content extraction |
| **Browser automation** | Chrome DevTools Protocol via `pi-chrome-devtools` |
| **Model routing** | `pi-model-router` with 6 profiles and Gemini fallback |

---

## Voice System

Jarvis includes fully local voice — no cloud services required.

| Command | Description |
|---|---|
| `/listen` | Record speech and paste transcription into the editor |
| `/speak` | Read the last response aloud |
| `/voice-live` | Live voice steering while Jarvis is working |
| `/auto-speak` | Toggle automatic TTS after every response |
| `/voice-config` | Configure language, threads, and reset the model |

The Whisper base int8 model (~157 MB on disk) is downloaded once to `~/.pi/models/whisper-base/`.
TTS uses `espeak-ng` — zero model download, zero latency.

---

## Model Router

Routing is configured in `agent/model-router.json`.
The default profile is `auto` (quality-first).

| Profile | Use case |
|---|---|
| `auto` | General — highest quality available |
| `coding` | Engineering and implementation |
| `research` | Long-context research tasks |
| `writing` | Drafting and editing |
| `bulk` | High-volume, cost-sensitive work |
| `ops` | Infrastructure and scripting |

Switch profiles with `/router profile <name>`.
Every tier has a Gemini fallback (`google/gemini-flash-latest`, 1M context window) so rate limits never hard-stop a session.

---

## Extensions (17 packages)

All extensions are vendored in `agent/packages/` and editable in-place.

### Core
- **`jarvis-tts-sst`** — local voice (STT + TTS), custom fork
- **`jarvis-branding`** — JARVIS persona injection + live token usage widget
- **`pi-lens`** — LSP diagnostics, ast-grep, tree-sitter, complexity rules
- **`context-mode`** — large-output routing without context burn
- **`gentle-engram`** — persistent cross-session memory

### Intelligence
- **`@yeliu84/pi-model-router`** — multi-model routing with profiles
- **`@juicesharp/rpiv-advisor`** — strong-model escalation
- **`@juicesharp/rpiv-ask-user-question`** — structured user questions
- **`pi-web-access`** — web fetch and content extraction

### Workspace & UI
- **`@narumitw/pi-chrome-devtools`** — Chrome DevTools Protocol
- **`visual-explainer`** — HTML visual diagrams
- **`pi-mcp-adapter`** — MCP server integration
- **`pi-markdown-preview`** — Markdown rendering
- **`pi-powerline-footer`** — enhanced status bar with token counters
- **`@mammothb/pi-tokyonight-storm`** — Tokyo Night Storm theme
- **`@ramarivera/pi-skill-selector`** — contextual skill loading
- **`@gotgenes/pi-anthropic-auth`** — Anthropic OAuth (Claude Pro/Max, no API key needed)

---

## Skills (16 installed)

Skills live in `agent/skills/` and are auto-loaded by Pi.

| Skill | Purpose |
|---|---|
| `gmcli` | Gmail — search, read, send, labels |
| `gdcli` | Google Drive — list, upload, share |
| `gccli` | Google Calendar — events, availability, RSVP |
| `artystic` | Aggressive design polish for websites |
| `code-design` | TypeScript conventions, SOLID, Pi SDK patterns |
| `design-review` | Dependency and structural code smell review |
| `pi-extension-lifecycle` | Extension event timing and API reference |
| `pi-cli-repro` | Debug Pi behavior via the real CLI |
| `context-mode` | When and how to use context-mode tools |
| `lsp-navigation` | LSP-based code navigation and diagnostics |
| `ast-grep` | Semantic code search and replacement |
| `visual-explainer` | Generating HTML visual diagrams |
| `markdown-conventions` | Project markdown rules |
| `mermaid` | Mermaid diagram authoring |
| `find-skills` | Discover and install new skills |
| `frontmatter` | Pi skill frontmatter rules |

---

## Google Workspace Setup

Requires OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/).
Enable the Gmail, Drive, and Calendar APIs, create an **OAuth Desktop** client, and download `credentials.json`.

```bash
gmcli accounts credentials ~/Downloads/credentials.json
gmcli accounts add your-email@gmail.com

gdcli accounts credentials ~/Downloads/credentials.json
gdcli accounts add your-email@gmail.com

gccli accounts credentials ~/Downloads/credentials.json
gccli accounts add your-email@gmail.com
```

Use `--manual` for headless/SSH installs (prints an auth URL instead of opening a browser).

See [Docs/Usage/google-workspace.md](./Docs/Usage/google-workspace.md) for a full walkthrough.

---

## API Keys

```bash
export ANTHROPIC_API_KEY="your-key"   # Claude models (or use pi-anthropic-auth for OAuth)
export OPENAI_API_KEY="your-key"      # GPT fallbacks
export GOOGLE_API_KEY="your-key"      # Gemini fallbacks
```

Add to `~/.bashrc` for persistence.
`pi-anthropic-auth` handles Anthropic OAuth automatically for Claude Pro/Max subscribers — no API key needed.

---

## Directory Structure

```
~/.pi/
├── agent/
│   ├── settings.json          # Central config — provider, model, packages list
│   ├── model-router.json      # Model routing profiles and fallback chains
│   ├── models.json            # Provider/model alias definitions
│   ├── AGENTS.md              # Agent persona, contracts, operating rules
│   ├── bin/
│   │   └── jarvis             # Branded launcher (wraps pi)
│   ├── extensions/
│   │   └── jarvis/
│   │       └── jarvis-branding.ts   # Persona injection + token widget
│   ├── packages/              # Vendored extensions (editable in-place)
│   │   ├── jarvis-tts-sst/    # Local voice — custom fork
│   │   ├── context-mode/
│   │   ├── gentle-engram/
│   │   ├── pi-lens/
│   │   └── …15 more
│   ├── skills/                # Auto-loaded skills
│   │   ├── gmcli/
│   │   ├── gdcli/
│   │   ├── gccli/
│   │   └── …13 more
│   └── package.json           # Dependency manifest → agent/node_modules
├── models/
│   └── whisper-base/          # Whisper int8 STT model (~157 MB)
├── Docs/
│   └── Usage/                 # User-facing guides
├── Instructions/              # Agent-facing contracts and architecture docs
├── install.sh                 # Full setup automation
├── INSTALL.md                 # Detailed install guide
└── README.md                  # This file
```

---

## Usage Examples

**Email**
```
"What are my unread emails from today?"
"Send a reply to the last thread from Alice"
```

**Calendar**
```
"What's on my calendar this week?"
"Accept the meeting invite from Bob"
```

**Code**
```
"Find all TypeScript errors in this project"
"Create a visual architecture diagram of the auth module"
"Refactor this function to use async/await"
```

**Research**
```
"Research the best approach to rate limiting in Node.js"
"Summarize this log file and highlight the errors"
```

**Memory**
```
"What did we decide about the database schema?"
"Save this bug fix to memory"
```

**Voice**
```
/listen      → speak your message
/speak       → hear the last response
/auto-speak  → toggle hands-free mode
```

---

## Development

### Modifying an Extension

Extensions live in `agent/packages/<name>` — edit the TypeScript files directly, then `/reload` inside Jarvis or restart.

### Adding an Extension

1. Vendor it: copy the npm package to `agent/packages/<name>`
2. Add to `agent/package.json` and run `cd agent && npm install`
3. Add `"packages/<name>"` to the `packages` array in `agent/settings.json`
4. Restart Jarvis

### Adding a Skill

1. Create `agent/skills/<name>/SKILL.md`
2. Skills are auto-loaded — no config changes needed

### Updating a Vendored Extension

```bash
# Diff first to preserve any local modifications
diff -r agent/packages/<name> agent/node_modules/<name>

# Then bump in package.json, reinstall, and re-copy
cd agent && npm install
cp -r node_modules/<name> packages/<name>
```

---

## Troubleshooting

**`jarvis` or `pi` not found**
```bash
export PATH="${HOME}/.npm-global/bin:${PATH}"
# or: source ~/.bashrc
```

**Extensions not loading**
```bash
cd ~/.pi/agent
rm -rf node_modules && npm install
# Then restart Jarvis
```

**Voice not working**
```bash
espeak-ng --version   # must be present
ffmpeg -version       # must be present
# Whisper model auto-downloads on first /listen if not pre-installed
```

**Google Workspace auth fails**
Ensure your email is listed as a **test user** in the OAuth consent screen on Google Cloud Console.

**`settings.json` errors**
```bash
node -e "JSON.parse(require('fs').readFileSync('~/.pi/agent/settings.json','utf8'))"
```
Settings must be strict JSON — no trailing commas.

---

## Documentation

| Doc | Contents |
|---|---|
| [INSTALL.md](./INSTALL.md) | Prerequisites, manual steps, troubleshooting |
| [Docs/Usage/Getting-Started.md](./Docs/Usage/Getting-Started.md) | Your first session — what to expect, what to ask, how to discover capabilities |
| [Docs/Usage/google-workspace.md](./Docs/Usage/google-workspace.md) | Gmail, Drive, Calendar setup |
| [Docs/Usage/context-mode.md](./Docs/Usage/context-mode.md) | Efficient large-output processing |
| [Docs/Usage/visual-explainer.md](./Docs/Usage/visual-explainer.md) | Generating HTML diagrams |
| [Docs/Usage/memory-system.md](./Docs/Usage/memory-system.md) | Persistent memory with Engram |
| [Docs/Usage/skills-and-workflows.md](./Docs/Usage/skills-and-workflows.md) | Skills reference |
| [Docs/Usage/best-practices.md](./Docs/Usage/best-practices.md) | Patterns and tips |
| [Instructions/jarvis-project-context.md](./Instructions/jarvis-project-context.md) | Architecture, roadmap, autonomy policy |

---

## License

See repository for license information.

## Acknowledgments

Built on:
- **[Pi](https://pi.dev)** by Earendil Works (`@earendil-works/pi-coding-agent`)
- **context-mode**, **visual-explainer** by nicobailon
- **gentle-engram** by the Engram project
- **sherpa-onnx** by k2-fsa (Whisper inference)
- Multiple open-source community extensions

Inspired by the fictional AI assistant archetype — professional, capable, and calm under pressure.
