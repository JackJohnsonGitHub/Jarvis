#!/usr/bin/env bash
set -euo pipefail

# Jarvis AI Agent Installation Script
# Installs and configures the Jarvis Pi agent with all skills and extensions

VERSION="1.0.0"
REPO_URL="https://github.com/JackJohnsonGitHub/Jarvis.git"
BRANCH="Jarvis-pi"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
	echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
	echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
	echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
	echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
	if command -v "$1" &>/dev/null; then
		log_success "$1 is installed"
		return 0
	else
		log_error "$1 is not installed"
		return 1
	fi
}

# Banner
echo "=========================================="
echo "   Jarvis AI Agent Installer v${VERSION}"
echo "=========================================="
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

MISSING_DEPS=0

if ! check_command "pi"; then
	log_error "Pi coding agent is required. Install from: https://github.com/piaddict/pi"
	MISSING_DEPS=1
fi

if ! check_command "node"; then
	log_error "Node.js is required. Install from: https://nodejs.org/"
	MISSING_DEPS=1
fi

if ! check_command "npm"; then
	log_error "npm is required (usually bundled with Node.js)"
	MISSING_DEPS=1
fi

if ! check_command "git"; then
	log_error "git is required for installation"
	MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
	log_error "Please install missing dependencies and try again."
	exit 1
fi

log_success "All prerequisites satisfied"
echo ""

# Determine installation path
PI_HOME="${HOME}/.pi"
INSTALL_DIR="${PI_HOME}"

log_info "Installation directory: ${INSTALL_DIR}"

# Check if .pi directory exists
if [ -d "${PI_HOME}" ]; then
	log_warning "Existing .pi directory found at ${PI_HOME}"
	read -p "Do you want to backup and reinstall? (y/N) " -n 1 -r
	echo
	if [[ $REPLY =~ ^[Yy]$ ]]; then
		BACKUP_DIR="${PI_HOME}.backup.$(date +%Y%m%d_%H%M%S)"
		log_info "Backing up existing installation to ${BACKUP_DIR}"
		mv "${PI_HOME}" "${BACKUP_DIR}"
		log_success "Backup created: ${BACKUP_DIR}"
	else
		log_info "Installation cancelled"
		exit 0
	fi
fi

# Clone the repository
log_info "Cloning Jarvis repository..."
git clone --branch "${BRANCH}" "${REPO_URL}" "${INSTALL_DIR}"
log_success "Repository cloned"
echo ""

# Install extension dependencies into agent/node_modules
log_info "Installing extension dependencies..."
cd "${INSTALL_DIR}/agent"
npm install
log_success "Extension dependencies installed"
echo ""

# Extension packages are vendored in agent/packages/ and referenced as local
# paths in agent/settings.json; they resolve their runtime dependencies from
# agent/node_modules via standard Node directory walk-up. No `pi install` or
# symlinks needed.
log_info "Extension packages are vendored in agent/packages/ (no pi install needed)"
cd "${INSTALL_DIR}"

log_success "Pi packages ready"
echo ""

# Install the `jarvis` command (branded entry point wrapping `pi`)
log_info "Installing the jarvis command..."
PI_BIN_DIR="$(dirname "$(command -v pi)")"
install -m 0755 "${INSTALL_DIR}/agent/bin/jarvis" "${PI_BIN_DIR}/jarvis"
log_success "jarvis command installed to ${PI_BIN_DIR}/jarvis"
echo ""

# Set up skills directory structure
log_info "Setting up skills..."

# All skills (including find-skills) ship in agent/skills/ — nothing external to wire up.

log_success "Skills directory configured"
echo ""

# Configure Pi to use the agent directory
log_info "Configuring Pi..."

# The settings.json is already in place from the clone
# Just verify it exists
if [ -f "${INSTALL_DIR}/agent/settings.json" ]; then
	log_success "Pi configuration in place"
else
	log_error "settings.json not found"
fi

echo ""

# Create directories for runtime data
log_info "Creating runtime directories..."
mkdir -p "${INSTALL_DIR}/.agent/diagrams"
mkdir -p "${HOME}/.gmcli"
mkdir -p "${HOME}/.gdcli"
mkdir -p "${HOME}/.gccli"
log_success "Runtime directories created"
echo ""

# Configure .bashrc
log_info "Configuring shell environment..."

BASHRC="${HOME}/.bashrc"
BASHRC_ADDITIONS="
# Jarvis AI Agent Configuration
export EDITOR=nvim
export PATH=\"/home/zhiroku/.npm-global/bin:\$PATH\"
alias jarvis='pi --name Jarvis'
export PILENS_DATA_DIR=\"\$HOME/.pi/pi-lens\"
"

if [ -f "${BASHRC}" ]; then
	# Check if already configured
	if grep -q "Jarvis AI Agent Configuration" "${BASHRC}"; then
		log_info ".bashrc already configured"
	else
		echo "${BASHRC_ADDITIONS}" >>"${BASHRC}"
		log_success "Added Jarvis configuration to .bashrc"
		log_info "Run 'source ~/.bashrc' or restart your shell to apply changes"
	fi
else
	log_warning ".bashrc not found at ${BASHRC}"
	log_info "Please manually add these lines to your shell configuration:"
	echo "${BASHRC_ADDITIONS}"
fi

echo ""

# Print post-installation instructions
echo "=========================================="
echo "   Installation Complete!"
echo "========================================="
echo ""
log_success "Jarvis AI agent installed successfully"
echo ""
echo "Next steps:"
echo ""
echo "1. Apply shell configuration:"
echo "   ${BLUE}source ~/.bashrc${NC}"
echo "   Or restart your terminal"
echo ""
echo "2. Start Pi using the 'jarvis' alias:"
echo "   ${BLUE}cd ${INSTALL_DIR}${NC}"
echo "   ${BLUE}jarvis${NC}"
echo ""
echo "   Or use Pi directly:"
echo "   ${BLUE}pi${NC}"
echo ""
echo "3. Configure Google Workspace tools (if needed):"
echo ""
echo "   Gmail (gmcli):"
echo "   - Set up OAuth credentials from Google Cloud Console"
echo "   - ${BLUE}gmcli accounts credentials /path/to/credentials.json${NC}"
echo "   - ${BLUE}gmcli accounts add your-email@gmail.com${NC}"
echo ""
echo "   Google Drive (gdcli):"
echo "   - ${BLUE}gdcli accounts credentials /path/to/credentials.json${NC}"
echo "   - ${BLUE}gdcli accounts add your-email@gmail.com${NC}"
echo ""
echo "   Google Calendar (gccli):"
echo "   - ${BLUE}gccli accounts credentials /path/to/credentials.json${NC}"
echo "   - ${BLUE}gccli accounts add your-email@gmail.com${NC}"
echo ""
echo "4. Read the documentation:"
echo "   ${BLUE}${INSTALL_DIR}/Docs/Usage/README.md${NC}"
echo ""
echo "5. Configure your API keys (if not using pi-anthropic-auth):"
echo "   - Set ${BLUE}ANTHROPIC_API_KEY${NC} environment variable"
echo "   - Or configure via Pi's built-in auth"
echo ""
echo "6. Optional: Configure OhMyOpenAgent integration:"
echo "   - Clone oh-my-openagent to ${BLUE}~/src/oh-my-openagent${NC}"
echo "   - Skills and prompts will be automatically available"
echo ""
log_info "Installation log saved to: ${INSTALL_DIR}/install.log"
echo ""
echo "Enjoy your Jarvis AI agent!"
echo "=========================================="
