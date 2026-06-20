#!/usr/bin/env bash
# =============================================================================
#  Jarvis AI Agent — Installation Script
#  Installs Google Workspace CLIs, espeak-ng, ffmpeg, and extension deps.
#  Assumes Pi is already installed (curl -fsSL https://pi.dev/install.sh | sh).
#  Optionally pre-downloads the Whisper STT model.
# =============================================================================
set -euo pipefail

VERSION="1.1.0"
REPO_URL="https://github.com/JackJohnsonGitHub/Jarvis.git"
BRANCH="main"

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC}    $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}      $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC}    $1"; }
log_error() { echo -e "${RED}[ERROR]${NC}   $1"; }
log_step() { echo -e "\n${CYAN}▶  $1${NC}"; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Jarvis AI Agent Installer  v${VERSION}     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Paths ─────────────────────────────────────────────────────────────────────
PI_HOME="${HOME}/.pi"
NPM_GLOBAL="${HOME}/.npm-global"
NPM_BIN="${NPM_GLOBAL}/bin"
MODELS_DIR="${PI_HOME}/models/whisper-base"

# ═════════════════════════════════════════════════════════════════════════════
# STEP 1 — npm global prefix (must come first so subsequent npm -g calls land
#           in the right place and binaries are immediately on PATH).
# ═════════════════════════════════════════════════════════════════════════════
log_step "Configuring npm global prefix"

if [ "$(npm config get prefix 2>/dev/null)" != "${NPM_GLOBAL}" ]; then
	npm config set prefix "${NPM_GLOBAL}"
	log_success "npm prefix → ${NPM_GLOBAL}"
else
	log_success "npm prefix already set to ${NPM_GLOBAL}"
fi

# Make binaries available for the rest of this script right now.
export PATH="${NPM_BIN}:${PATH}"

# ═════════════════════════════════════════════════════════════════════════════
# STEP 2 — System prerequisites (node, npm, git)
# ═════════════════════════════════════════════════════════════════════════════
log_step "Checking required tools"

MISSING=0
for cmd in node npm git curl tar; do
	if command -v "$cmd" &>/dev/null; then
		log_success "$cmd found  ($(${cmd} --version 2>&1 | head -1))"
	else
		log_error "$cmd is not installed"
		MISSING=1
	fi
done

if [ $MISSING -eq 1 ]; then
	echo ""
	log_error "Install missing tools, then re-run this script."
	echo "  Node.js : https://nodejs.org/  (v18+ recommended)"
	echo "  git     : https://git-scm.com/"
	echo "  curl    : usually pre-installed on most systems"
	exit 1
fi

# Node version guard (>= 18)
NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "${NODE_MAJOR}" -lt 18 ]; then
	log_error "Node.js ${NODE_MAJOR} detected — v18 or later is required."
	exit 1
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 3 — System audio packages (espeak-ng + ffmpeg, needed for voice)
# ═════════════════════════════════════════════════════════════════════════════
log_step "Installing system audio packages (espeak-ng + ffmpeg)"

install_system_pkg() {
	local pkg="$1"
	if command -v "$pkg" &>/dev/null; then
		log_success "$pkg already installed"
		return 0
	fi

	log_info "Attempting to install $pkg via system package manager…"

	if command -v apt-get &>/dev/null; then
		sudo apt-get update -y 2>&1 | tail -2 || true
		sudo apt-get install -y "$pkg" 2>&1 | tail -3 || true
	elif command -v dnf &>/dev/null; then
		sudo dnf install -y "$pkg" 2>&1 | tail -3 || {
			# Fedora: full ffmpeg requires RPM Fusion; fall back to ffmpeg-free
			if [ "$pkg" = "ffmpeg" ]; then
				sudo dnf install -y ffmpeg-free 2>&1 | tail -3 || true
			fi
		}
	elif command -v yum &>/dev/null; then
		sudo yum install -y "$pkg" 2>&1 | tail -3 || true
	elif command -v pacman &>/dev/null; then
		sudo pacman -S --noconfirm "$pkg" 2>&1 | tail -3 || true
	elif command -v brew &>/dev/null; then
		brew install "$pkg" 2>&1 | tail -3 || true
	else
		log_warning "Cannot auto-install $pkg — no recognised package manager."
		log_warning "Install it manually, then re-run the script."
		return 1
	fi

	if command -v "$pkg" &>/dev/null; then
		log_success "$pkg installed"
	else
		log_warning "$pkg may not have installed correctly — voice features may not work."
	fi
}

install_system_pkg "espeak-ng"
install_system_pkg "ffmpeg"

# ═════════════════════════════════════════════════════════════════════════════
# STEP 4 — Verify Pi is installed
# Install Pi first via: curl -fsSL https://pi.dev/install.sh | sh
# ═════════════════════════════════════════════════════════════════════════════
log_step "Checking for Pi coding agent"

if command -v pi &>/dev/null; then
	INSTALLED_VER=$(pi --version 2>&1 | head -1)
	log_success "pi found  (${INSTALLED_VER})"
else
	log_error "Pi coding agent not found."
	echo ""
	echo "  Install it first, then re-run this script:"
	echo "    curl -fsSL https://pi.dev/install.sh | sh"
	echo ""
	exit 1
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 5 — Install Google Workspace CLIs globally
# ═════════════════════════════════════════════════════════════════════════════
log_step "Installing Google Workspace CLIs (gmcli / gdcli / gccli)"

for pkg in "@mariozechner/gmcli" "@mariozechner/gdcli" "@mariozechner/gccli"; do
	bin="${pkg##*/}" # strip @scope/ prefix → gmcli / gdcli / gccli
	if command -v "${bin}" &>/dev/null; then
		log_success "${bin} already installed"
	else
		log_info "Installing ${pkg}…"
		npm install -g "${pkg}"
		log_success "${bin} installed"
	fi
done

# ═════════════════════════════════════════════════════════════════════════════
# STEP 6 — Verify Jarvis repo is present at ~/.pi (main branch)
# Clone manually first: git clone --branch main https://github.com/JackJohnsonGitHub/Jarvis.git ~/.pi
# To use another branch: git -C ~/.pi checkout <branch-name>
# ═════════════════════════════════════════════════════════════════════════════
log_step "Setting up Jarvis repository at ${PI_HOME}"

if [ -d "${PI_HOME}/.git" ]; then
	log_warning "Existing Jarvis installation detected at ${PI_HOME}"
	echo ""
	read -r -p "  Options: [U]pdate in-place  [R]einstall (backup first)  [S]kip  > " CHOICE
	echo ""
	case "${CHOICE,,}" in
	u | update)
		log_info "Pulling latest changes from ${BRANCH}…"
		git -C "${PI_HOME}" fetch origin
		git -C "${PI_HOME}" reset --hard "origin/${BRANCH}"
		log_success "Repository updated"
		;;
	r | reinstall)
		BACKUP="${PI_HOME}.backup.$(date +%Y%m%d_%H%M%S)"
		log_info "Backing up to ${BACKUP}…"
		mv "${PI_HOME}" "${BACKUP}"
		log_success "Backup created: ${BACKUP}"
		log_info "Cloning ${REPO_URL} (branch: ${BRANCH})…"
		git clone --branch "${BRANCH}" "${REPO_URL}" "${PI_HOME}"
		log_success "Repository cloned"
		;;
	*)
		log_info "Skipping clone — using existing installation"
		;;
	esac
elif [ -d "${PI_HOME}" ] && [ ! -d "${PI_HOME}/.git" ]; then
	# Directory exists but is not a git repo (e.g. bare ~/.pi from Pi itself)
	log_warning "${PI_HOME} exists but is not a git repository."
	log_warning "Jarvis must live at ${PI_HOME} — this will OVERWRITE the existing directory."
	echo ""
	read -r -p "  Backup and overwrite? (y/N) > " CONFIRM
	echo ""
	if [[ "${CONFIRM,,}" == "y" ]]; then
		BACKUP="${PI_HOME}.backup.$(date +%Y%m%d_%H%M%S)"
		log_info "Backing up to ${BACKUP}…"
		mv "${PI_HOME}" "${BACKUP}"
		log_success "Backup created: ${BACKUP}"
		log_info "Cloning repository…"
		git clone --branch "${BRANCH}" "${REPO_URL}" "${PI_HOME}"
		log_success "Repository cloned"
	else
		log_error "Installation cancelled."
		exit 1
	fi
else
	log_info "Cloning ${REPO_URL} (branch: ${BRANCH})…"
	git clone --branch "${BRANCH}" "${REPO_URL}" "${PI_HOME}"
	log_success "Repository cloned"
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 7 — Install extension dependencies (agent/node_modules)
# ═════════════════════════════════════════════════════════════════════════════
log_step "Installing Pi extension dependencies"

cd "${PI_HOME}/agent"
npm install
log_success "Extension dependencies installed (agent/node_modules)"

cd "${PI_HOME}"

# ═════════════════════════════════════════════════════════════════════════════
# STEP 8 — Install the `jarvis` launcher binary
# ═════════════════════════════════════════════════════════════════════════════
log_step "Installing the 'jarvis' command"

if [ -f "${PI_HOME}/agent/bin/jarvis" ]; then
	install -m 0755 "${PI_HOME}/agent/bin/jarvis" "${NPM_BIN}/jarvis"
	log_success "jarvis → ${NPM_BIN}/jarvis"
else
	log_warning "agent/bin/jarvis not found — skipping (pi command still works)"
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 9 — Create runtime directories
# ═════════════════════════════════════════════════════════════════════════════
log_step "Creating runtime directories"

mkdir -p "${PI_HOME}/pi-lens"
mkdir -p "${PI_HOME}/context-mode/sessions"
mkdir -p "${PI_HOME}/context-mode/content"
mkdir -p "${PI_HOME}/models"
mkdir -p "${HOME}/.engram"
mkdir -p "${HOME}/.gmcli"
mkdir -p "${HOME}/.gdcli"
mkdir -p "${HOME}/.gccli"

log_success "Runtime directories ready"

# ═════════════════════════════════════════════════════════════════════════════
# STEP 10 — Optional: pre-download Whisper STT model (~200 MB)
#            (jarvis-tts-sst also auto-downloads on first /listen — this step
#            just avoids the wait during your first voice session.)
# ═════════════════════════════════════════════════════════════════════════════
log_step "Whisper STT voice model"

SENTINEL="${MODELS_DIR}/.download-complete"

if [ -f "${SENTINEL}" ]; then
	log_success "Whisper base model already downloaded"
else
	echo ""
	echo "  The voice assistant requires the Whisper base int8 model (~200 MB)."
	echo "  It will auto-download on your first /listen command if you skip now."
	echo ""
	read -r -p "  Download now? (Y/n) > " DL_CHOICE
	echo ""

	if [[ "${DL_CHOICE,,}" != "n" ]]; then
		MODEL_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-base.tar.bz2"
		ARCHIVE="/tmp/sherpa-onnx-whisper-base.tar.bz2"

		log_info "Downloading Whisper model…"
		curl -L --progress-bar -o "${ARCHIVE}" "${MODEL_URL}"

		log_info "Extracting…"
		mkdir -p "${MODELS_DIR}"
		tar -xjf "${ARCHIVE}" --strip-components=1 -C "${MODELS_DIR}"

		# Remove fp32 duplicates — only int8 variants are used on CPU
		rm -f "${MODELS_DIR}/base-encoder.onnx" \
			"${MODELS_DIR}/base-decoder.onnx"

		# Write sentinel so jarvis-tts-sst skips the download check
		touch "${SENTINEL}"

		rm -f "${ARCHIVE}"
		log_success "Whisper model ready at ${MODELS_DIR}"
	else
		log_info "Skipping model download — will auto-download on first voice use"
	fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 11 — Configure shell environment (~/.bashrc / ~/.zshrc)
# ═════════════════════════════════════════════════════════════════════════════
log_step "Configuring shell environment"

SHELL_BLOCK='
# ── Jarvis AI Agent ───────────────────────────────────────────────────────────
export PATH="${HOME}/.npm-global/bin:${PATH}"
export PILENS_DATA_DIR="${HOME}/.pi/pi-lens"
# ─────────────────────────────────────────────────────────────────────────────'

configure_shell() {
	local rc="$1"
	if [ ! -f "${rc}" ]; then return; fi
	if grep -q "Jarvis AI Agent" "${rc}" 2>/dev/null; then
		log_success "${rc} already configured"
	else
		echo "${SHELL_BLOCK}" >>"${rc}"
		log_success "Added Jarvis config to ${rc}"
	fi
}

configure_shell "${HOME}/.bashrc"
configure_shell "${HOME}/.zshrc"

# Apply to the current session immediately
export PATH="${NPM_BIN}:${PATH}"
export PILENS_DATA_DIR="${PI_HOME}/pi-lens"

# ═════════════════════════════════════════════════════════════════════════════
# STEP 12 — Verify installation
# ═════════════════════════════════════════════════════════════════════════════
log_step "Verifying installation"

VERIFY_OK=1

verify_cmd() {
	if command -v "$1" &>/dev/null; then
		log_success "$1  →  $(command -v "$1")"
	else
		log_warning "$1 not found — may need to restart shell first"
		VERIFY_OK=0
	fi
}

verify_cmd pi
verify_cmd jarvis
verify_cmd gmcli
verify_cmd gdcli
verify_cmd gccli
verify_cmd espeak-ng
verify_cmd ffmpeg

if node -e "JSON.parse(require('fs').readFileSync('${PI_HOME}/agent/settings.json','utf8'))" 2>/dev/null; then
	log_success "agent/settings.json — valid JSON"
else
	log_warning "agent/settings.json could not be parsed — check for syntax errors"
	VERIFY_OK=0
fi

if node -e "JSON.parse(require('fs').readFileSync('${PI_HOME}/agent/model-router.json','utf8'))" 2>/dev/null; then
	log_success "agent/model-router.json — valid JSON"
else
	log_warning "agent/model-router.json could not be parsed — check for syntax errors"
	VERIFY_OK=0
fi

# ═════════════════════════════════════════════════════════════════════════════
# DONE
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
if [ $VERIFY_OK -eq 1 ]; then
	echo -e "${CYAN}║   ✅  Installation complete!              ║${NC}"
else
	echo -e "${CYAN}║   ⚠️   Installation complete (see warns)  ║${NC}"
fi
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}1. Apply shell config (or restart terminal):${NC}"
echo -e "     ${BLUE}source ~/.bashrc${NC}"
echo ""
echo -e "  ${GREEN}2. Launch Jarvis:${NC}"
echo -e "     ${BLUE}cd ~/.pi && jarvis${NC}"
echo ""
echo -e "  ${GREEN}3. Verify everything loaded (inside Jarvis):${NC}"
echo -e '     "Run a systems test on yourself Jarvis"'
echo ""
echo -e "  ${GREEN}4. Configure Google Workspace tools (optional):${NC}"
echo -e "     ${BLUE}gmcli accounts credentials /path/to/credentials.json${NC}"
echo -e "     ${BLUE}gmcli accounts add your-email@gmail.com${NC}"
echo -e "     ${BLUE}gdcli accounts credentials /path/to/credentials.json${NC}"
echo -e "     ${BLUE}gdcli accounts add your-email@gmail.com${NC}"
echo -e "     ${BLUE}gccli accounts credentials /path/to/credentials.json${NC}"
echo -e "     ${BLUE}gccli accounts add your-email@gmail.com${NC}"
echo ""
echo -e "  ${GREEN}5. Configure API authentication:${NC}"
echo -e "     ${BLUE}export ANTHROPIC_API_KEY=\"your-key\"${NC}  — or use pi-anthropic-auth"
echo -e "     ${BLUE}export OPENAI_API_KEY=\"your-key\"${NC}     — for GPT fallbacks"
echo -e "     ${BLUE}export GOOGLE_API_KEY=\"your-key\"${NC}     — for Gemini fallbacks"
echo ""
echo -e "  ${GREEN}Documentation:${NC}  ${BLUE}${PI_HOME}/Docs/Usage/README.md${NC}"
echo ""
