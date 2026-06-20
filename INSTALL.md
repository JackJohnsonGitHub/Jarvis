# Jarvis AI Agent — Installation Guide

## Prerequisites

The install script handles most setup automatically.
You only need three things pre-installed before running it:

| Tool | Min Version | Install |
|---|---|---|
| Node.js | v18+ | https://nodejs.org/ |
| git | any | https://git-scm.com/ |
| curl | any | usually pre-installed |

`espeak-ng` and `ffmpeg` are installed automatically by the script using your system package manager (`apt`, `dnf`, `pacman`, or `brew`).

## Quick Install

```bash
# 1. Install Pi first
curl -fsSL https://pi.dev/install.sh | sh

# 2. Clone Jarvis into Pi's config directory
git clone --branch main https://github.com/JackJohnsonGitHub/Jarvis.git ~/.pi

# 3. Run the setup script
cd ~/.pi && ./install.sh
```

That single command sequence will:

1. Configure the npm global prefix (`~/.npm-global`)
2. Check for `node`, `npm`, `git`, `curl`, `tar`
3. Install `espeak-ng` and `ffmpeg` via the system package manager
4. Verify the Pi coding agent is installed (`pi` command on PATH)
5. Install Google Workspace CLIs (`gmcli`, `gdcli`, `gccli`)
6. Clone or update the Jarvis repository to `~/.pi`
7. Install all Pi extension dependencies (`agent/npm install`)
8. Install the `jarvis` launcher binary to `~/.npm-global/bin/jarvis`
9. Create all required runtime directories
10. Offer to pre-download the Whisper STT model (~200 MB, optional)
11. Configure `~/.bashrc` / `~/.zshrc` with the correct `PATH` and env vars
12. Verify the installation

## After Installation

```bash
# Apply shell config (or restart terminal)
source ~/.bashrc

# Launch Jarvis
cd ~/.pi && jarvis
```

## Your First Session

When you run `jarvis` for the first time, here is what to expect:

1. **A blank prompt appears.** There is no menu or setup screen. Just type something natural like `What can you do?`

2. **The first response may take 5–15 seconds** as the model loads and context initializes. This delay is normal and will not repeat on subsequent messages.

3. **Jarvis introduces itself** and lists its core capabilities — email, calendar, code analysis, research, voice, and memory.

4. **If no API keys are set**, you may see a prompt asking for one. The quickest fix:

   ```bash
   export ANTHROPIC_API_KEY="your-key"
   ```

   If you have a Claude Pro or Max subscription, the included OAuth extension handles authentication automatically — follow the on-screen link.

5. **Try a simple command** to verify everything is working:

   ```
   What time is it?
   ```

6. **When you are done**, press **Ctrl+C** or **Ctrl+D** to exit. Run `jarvis` again to start a new session.

Everything except Google Workspace (Gmail, Drive, Calendar) works immediately:

| Feature | Works Out of the Box | Needs Setup
|---|---|---|
| Conversation & questions | ✅ | |
| Code analysis & editing | ✅ | |
| Voice (listen/speak) | ✅ | |
| Memory (Engram) | ✅ | |
| Visual diagrams | ✅ | |
| Web research | ✅ | |
| Gmail, Drive, Calendar | | Requires Google OAuth (see below)

See [Getting Started](./Docs/Usage/Getting-Started.md) for a complete walkthrough.

## Google Workspace Setup (optional)

Requires OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/).
Enable the Gmail, Drive, and Calendar APIs, create an OAuth Desktop client, and download `credentials.json`.

```bash
gmcli accounts credentials ~/Downloads/credentials.json
gmcli accounts add your-email@gmail.com

gdcli accounts credentials ~/Downloads/credentials.json
gdcli accounts add your-email@gmail.com

gccli accounts credentials ~/Downloads/credentials.json
gccli accounts add your-email@gmail.com
```

A browser window will open for each OAuth flow.
Use `--manual` if running headless:

```bash
gmcli accounts add your-email@gmail.com --manual
```

## API Keys

Set keys in your shell profile for the providers you use:

```bash
export ANTHROPIC_API_KEY="your-key"   # required for Claude models
export OPENAI_API_KEY="your-key"       # GPT fallbacks
export GOOGLE_API_KEY="your-key"       # Gemini fallbacks
```

`pi-anthropic-auth` (included) can manage Anthropic OAuth automatically
if you have a Claude Pro/Max subscription — no API key needed for that path.

## Re-running the Script

The script is idempotent.
Re-running it on an existing `~/.pi` offers three choices: **Update** (git pull),
**Reinstall** (backup + fresh clone), or **Skip** (leave the repo as-is).
All other steps (npm packages, Google CLIs, binaries) are skipped if already present.

## Manual Install

If you prefer manual steps:

```bash
# 1. npm global prefix
npm config set prefix ~/.npm-global
export PATH="${HOME}/.npm-global/bin:${PATH}"

# 2. System packages (Debian/Ubuntu example)
sudo apt-get install -y espeak-ng ffmpeg

# 3. Pi coding agent
npm install -g @earendil-works/pi-coding-agent

# 4. Google Workspace CLIs
npm install -g @mariozechner/gmcli @mariozechner/gdcli @mariozechner/gccli

# 5. Clone repo into Pi's config directory
git clone --branch main https://github.com/JackJohnsonGitHub/Jarvis.git ~/.pi

# 6. Extension dependencies
cd ~/.pi/agent && npm install

# 7. Jarvis binary
install -m 0755 ~/.pi/agent/bin/jarvis ~/.npm-global/bin/jarvis

# 8. Runtime dirs
mkdir -p ~/.pi/{pi-lens,models,context-mode/{sessions,content}} \
         ~/.engram ~/.gmcli ~/.gdcli ~/.gccli
```

## Updating

```bash
cd ~/.pi
./install.sh        # choose "Update" when prompted
```

Or manually:

```bash
cd ~/.pi
git pull origin main
cd agent && npm install
```

## Troubleshooting

**`pi` or `jarvis` not found after install**
The binary lands in `~/.npm-global/bin`.
Add it to your PATH: `export PATH="${HOME}/.npm-global/bin:${PATH}"`
or run `source ~/.bashrc`.

**Extension load failure**
```bash
cd ~/.pi/agent
rm -rf node_modules
npm install
```

**Voice not working**
Check `espeak-ng` and `ffmpeg` are installed:
```bash
espeak-ng --version
ffmpeg -version
```
The Whisper model auto-downloads on first `/listen` if it wasn't pre-installed.

**Google CLI OAuth fails**
Ensure your email is added as a test user on the OAuth consent screen in Google Cloud Console.

## Uninstalling

```bash
# Optional: back up config and memory
cp -r ~/.pi ~/.pi.backup
cp -r ~/.engram ~/.engram.backup

# Remove installation
rm -rf ~/.pi

# Remove CLI data (optional)
rm -rf ~/.gmcli ~/.gdcli ~/.gccli ~/.engram

# Remove global npm packages (optional)
npm uninstall -g @earendil-works/pi-coding-agent \
                 @mariozechner/gmcli \
                 @mariozechner/gdcli \
                 @mariozechner/gccli
```
