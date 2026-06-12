# Jarvis AI Agent - Installation Guide

Complete installation instructions for the Jarvis AI agent.

## Prerequisites

Before installing, ensure you have:

- **Pi coding agent** - Install from: https://github.com/piaddict/pi
- **Node.js** (v18 or later) - Install from: https://nodejs.org/
- **npm** (comes with Node.js)
- **git**

### Verify Prerequisites

```bash
pi --version
node --version
npm --version
git --version
```

All commands should return version numbers.

## Installation Methods

### Method 1: Automated Install (Recommended)

```bash
# Clone the repository
git clone --branch Jarvis-pi https://github.com/JackJohnsonGitHub/Jarvis.git ~/.pi

# Run the install script
cd ~/.pi
./install.sh
```

The script will:
1. Check prerequisites
2. Backup existing `.pi` directory (if present)
3. Install npm extensions
4. Install Pi packages
5. Set up directory structure
6. Display post-installation instructions

### Method 2: Manual Install

If you prefer manual installation:

```bash
# 1. Clone repository
git clone --branch Jarvis-pi https://github.com/JackJohnsonGitHub/Jarvis.git ~/.pi
cd ~/.pi

# 2. Install extension dependencies
cd agent
npm install
cd ..

# 3. Extension packages are vendored in agent/packages/ and already listed
#    as local paths in agent/settings.json — no `pi install` step is needed.
#    The npm install above provides their runtime dependencies.

# 4. Create runtime directories
mkdir -p .agent/diagrams
mkdir -p ~/.gmcli
mkdir -p ~/.gdcli
mkdir -p ~/.gccli
```

## Post-Installation Setup

### 1. Start Jarvis

```bash
cd ~/.pi
jarvis
```

### 2. Configure Google Workspace Tools (Optional)

If you want to use Gmail, Drive, or Calendar features:

#### Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable these APIs:
   - Gmail API
   - Google Drive API
   - Google Calendar API
4. Set up OAuth consent screen:
   - Go to "OAuth consent screen"
   - Add your email as test user
5. Create OAuth credentials:
   - Go to "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Desktop app"
   - Download the JSON file

#### Configure CLI Tools

**Gmail (gmcli):**
```bash
gmcli accounts credentials ~/Downloads/credentials.json
gmcli accounts add your-email@gmail.com
```

**Google Drive (gdcli):**
```bash
gdcli accounts credentials ~/Downloads/credentials.json
gdcli accounts add your-email@gmail.com
```

**Google Calendar (gccli):**
```bash
gccli accounts credentials ~/Downloads/credentials.json
gccli accounts add your-email@gmail.com
```

The CLI tools will open a browser for OAuth authentication.

### 3. Configure API Keys

If not using `pi-anthropic-auth`, set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY="your-key-here"
```

Add to your `~/.bashrc` or `~/.zshrc` for persistence:

```bash
echo 'export ANTHROPIC_API_KEY="your-key-here"' >> ~/.bashrc
```

### 4. Optional: OhMyOpenAgent Integration

If you want additional skills and prompts:

```bash
# Clone OhMyOpenAgent
git clone https://github.com/nicobailon/oh-my-openagent.git ~/src/oh-my-openagent
```

Skills and prompts will be automatically available from:
- `~/src/oh-my-openagent/.opencode/skills/`
- `~/src/oh-my-openagent/.opencode/command/`

## Verification

Test the installation:

```bash
cd ~/.pi
jarvis
```

Then in Jarvis, try:

```
"Hello Jarvis, run a quick system check"
```

Jarvis should respond with confirmation that systems are operational.

## Troubleshooting

### Pi not found

```bash
# Install Pi
npm install -g @piaddict/pi
```

### Extension installation fails

```bash
# Clear npm cache and retry
cd ~/.pi/agent
rm -rf node_modules
npm install
```

### Skills not loading

Check `~/.pi/agent/settings.json` has correct paths:
```json
{
  "skills": [
    "/home/yourusername/src/oh-my-openagent/.opencode/skills"
  ]
}
```

### Google Workspace tools fail

1. Verify credentials.json is correct
2. Ensure you're added as a test user in OAuth consent screen
3. Try `--manual` flag for browserless OAuth:
   ```bash
   gmcli accounts add your-email@gmail.com --manual
   ```

### Memory not persisting

Ensure Engram is installed:
```bash
pi install npm:gentle-engram
```

Check `~/.pi/agent/settings.json` includes:
```json
{
  "packages": ["npm:gentle-engram"]
}
```

## Updating

To update Jarvis:

```bash
cd ~/.pi
git pull origin Jarvis-pi
cd agent
npm install
```

Then reinstall Pi packages if any were added:
```bash
pi install npm:<package-name>
```

## Uninstalling

To completely remove Jarvis:

```bash
# Backup data if needed
cp -r ~/.pi ~/.pi.backup

# Remove installation
rm -rf ~/.pi

# Remove Google Workspace tool data (optional)
rm -rf ~/.gmcli ~/.gdcli ~/.gccli

# Remove Engram data (optional)
# Location varies by project
```

## Next Steps

After installation:

1. **Read the documentation**: `~/.pi/Docs/Usage/README.md`
2. **Try basic commands**: Email, calendar, code analysis
3. **Generate a diagram**: "Create a visual diagram of the system"
4. **Save to memory**: Jarvis automatically saves important decisions
5. **Explore skills**: `/context-mode:ctx-stats`, `/visual-explainer:generate-web-diagram`

## Support

- **Documentation**: `~/.pi/Docs/Usage/`
- **Repository**: https://github.com/JackJohnsonGitHub/Jarvis
- **Issues**: https://github.com/JackJohnsonGitHub/Jarvis/issues

## Quick Reference

### Start Jarvis
```bash
cd ~/.pi && jarvis
```

### Common Commands
```
"What are my unread emails?"
"Check my calendar for today"
"Create a visual diagram of the architecture"
"Save this to memory"
"Search memory for authentication issues"
```

### Configuration Files
- Agent settings: `~/.pi/agent/settings.json`
- Vendored extensions: `~/.pi/agent/packages/` (dependency manifest: `~/.pi/agent/package.json`)
- Skills: `~/.pi/agent/skills/`
- Documentation: `~/.pi/Docs/Usage/`

Enjoy your Jarvis AI agent!
