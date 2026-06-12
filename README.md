# Jarvis AI Agent

A JARVIS-inspired AI assistant — the **Jarvis harness**, built on the Pi coding agent — designed to be calm, precise, and proactive.

## Features

- **JARVIS-inspired persona** - Professional, composed, and efficient
- **Google Workspace integration** - Gmail, Drive, Calendar automation
- **Context-mode** - Process large outputs without consuming context window
- **Visual diagrams** - Generate HTML architecture diagrams and tables
- **Persistent memory** - Engram memory system across sessions
- **Comprehensive skills** - 18+ installed extensions and capabilities

## Quick Start

/ctx_insight - Opens a dashboard to see statistics, past sessions and data about you agent.
/tree - go back to a previous message
SO much more but these are the big ones

### Installation

```bash
# Clone and run the install script
git clone --branch Jarvis-pi https://github.com/JackJohnsonGitHub/Jarvis.git ~/.pi
cd ~/.pi
./install.sh
```

The install script will:
- Check prerequisites (Pi, Node.js, npm, git)
- Install extension dependencies (`npm install` in `agent/`)
- Use the vendored extension packages in `agent/packages/`
- Set up skills and configuration
- Create runtime directories

### Starting Jarvis

```bash
jarvis
```

(`jarvis` is the branded entry point installed by `install.sh`; the underlying `pi` command also works.)

## Configuration

### Agent Settings

Configuration is stored in `agent/settings.json`:
- Default provider and model
- Theme: `tokyonight-storm`
- Extensions and skills
- Prompts and packages

### Google Workspace Setup

After installation, configure Google Workspace tools:

#### Gmail (gmcli)
```bash
gmcli accounts credentials /path/to/credentials.json
gmcli accounts add your-email@gmail.com
```

#### Google Drive (gdcli)
```bash
gdcli accounts credentials /path/to/credentials.json
gdcli accounts add your-email@gmail.com
```

#### Google Calendar (gccli)
```bash
gccli accounts credentials /path/to/credentials.json
gccli accounts add your-email@gmail.com
```

See [Google Workspace documentation](./Docs/Usage/google-workspace.md) for detailed setup.

## Documentation

Comprehensive documentation is available in `Docs/Usage/`:

- **[Getting Started](./Docs/Usage/getting-started.md)** - Basic interaction patterns
- **[Google Workspace](./Docs/Usage/google-workspace.md)** - Email, Drive, Calendar
- **[Context Mode](./Docs/Usage/context-mode.md)** - Efficient data processing
- **[Visual Explainer](./Docs/Usage/visual-explainer.md)** - HTML diagrams
- **[Memory System](./Docs/Usage/memory-system.md)** - Persistent memory
- **[Skills & Workflows](./Docs/Usage/skills-and-workflows.md)** - Available capabilities
- **[Best Practices](./Docs/Usage/best-practices.md)** - Patterns and tips

## Installed Extensions

### Core Extensions
- **context-mode** - Efficient context window management
- **pi-lens** - Code analysis and diagnostics
- **gentle-engram** - Persistent memory system
- **visual-explainer** - HTML diagram generation

### Google Workspace
- **gmcli** - Gmail operations
- **gdcli** - Google Drive management
- **gccli** - Google Calendar operations

### Additional Tools
- **pi-web-access** - Web research and content fetching
- **pi-mcp-adapter** - MCP server integration
- **@yeliu84/pi-model-router** - Multi-model routing
- **@apmantza/greedysearch-pi** - Multi-engine search
- **@narumitw/pi-chrome-devtools** - Browser automation

### UI Enhancements
- **pi-powerline-footer** - Enhanced status bar
- **pi-markdown-preview** - Markdown rendering
- **@mammothb/pi-tokyonight-storm** - Tokyo Night theme

## Skills

Installed skills in `agent/skills/`:

- **artystic** - Design polish for web pages
- **gccli** - Google Calendar CLI
- **gdcli** - Google Drive CLI
- **gmcli** - Gmail CLI
- **find-skills** - Skill discovery and installation

## Directory Structure

```
.pi/
├── agent/
│   ├── AGENTS.md              # Agent persona and contracts
│   ├── settings.json          # Pi configuration
│   ├── packages/              # Vendored extension packages (editable)
│   ├── package.json           # Dependency manifest (npm install → node_modules)
│   └── skills/                # Installed skills
│       ├── artystic/
│       ├── gccli/
│       ├── gdcli/
│       └── gmcli/
├── Docs/
│   ├── Usage/                 # Training documentation
│   │   ├── README.md
│   │   ├── getting-started.md
│   │   ├── google-workspace.md
│   │   ├── context-mode.md
│   │   ├── visual-explainer.md
│   │   ├── memory-system.md
│   │   ├── skills-and-workflows.md
│   │   └── best-practices.md
│   └── extensions/            # Extension development guides
├── .agent/
│   └── diagrams/              # Generated HTML diagrams
├── install.sh                 # Installation script
└── README.md                  # This file
```

## Usage Examples

### Email Operations
```
"What are my important unread emails?"
"Send an email to the team about the release"
"Accept all my calendar invites"
```

### Code Analysis
```
"Show me the architecture of the auth module"
"Find all TypeScript errors in the project"
"Create a visual diagram of the WebSocket flow"
```

### Data Processing
```
"Analyze this log file for errors"
"Summarize the test output"
"Generate a comparison table of these options"
```

### Memory
```
"What did we decide about caching?"
"Save this bug fix to memory"
"Search for previous authentication issues"
```

## Agent Persona

Jarvis operates with a JARVIS-inspired style:
- **Calm and precise** - Professional communication
- **Proactive** - Anticipates needs and suggests next steps
- **Technically capable** - Understands systems and tools
- **Discreet** - Protects sensitive information
- **Slightly witty** - Dry humor when appropriate

### Preferred Phrasing
- "Certainly."
- "I've reviewed the situation."
- "The most efficient path is…"
- "I recommend…"
- "Shall I proceed?"

## Development

### Modifying Extensions

Extensions are vendored in `agent/packages/<name>` — edit the files directly, then `/reload` or restart Jarvis.

### Adding Extensions

1. Add to `agent/package.json` and run `npm install` in `agent/`
2. Copy `agent/node_modules/<name>` to `agent/packages/<name>`
3. Add `"packages/<name>"` to the `agent/settings.json` packages list
4. Restart Pi

### Adding Skills

1. Create skill directory in `agent/skills/`
2. Add `SKILL.md` with metadata and documentation
3. Skills are auto-loaded by Pi

### Updating Documentation

Documentation lives in `Docs/Usage/`. Keep it synchronized with functionality:
- Update guides when behavior changes
- Add examples for new features
- Keep AGENTS.md files current

## Troubleshooting

### "Command not found: pi"
Install Pi from: https://github.com/piaddict/pi

### Google Workspace tools fail
Run the OAuth setup for each tool (gmcli, gdcli, gccli). See documentation.

### Extensions not loading
1. Check `agent/settings.json` packages entries match directories under `agent/packages/`
2. Run `npm install` in `agent/` (provides extension dependencies in `agent/node_modules`)
3. Restart Pi

### Memory not persisting
Ensure the vendored `gentle-engram` package is listed in `agent/settings.json` packages

## Support

- **Documentation**: `Docs/Usage/`
- **Repository**: https://github.com/JackJohnsonGitHub/Jarvis
- **Pi Documentation**: https://github.com/piaddict/pi

## License

See repository for license information.

## Acknowledgments

Built on:
- **Pi** by piaddict
- **context-mode** by nicobailon
- **visual-explainer** by nicobailon
- **Engram** by pi-labs
- Multiple community extensions

Inspired by JARVIS from Iron Man (fictional AI assistant).
