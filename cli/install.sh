#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════════
# RSHIP Enterprise OS Intelligence — Shell Installer
# ═══════════════════════════════════════════════════════════════════════════════
#
# USAGE:
#   curl -fsSL https://freddycreates.github.io/Enterprise-OS-intelligence/install.sh | sh
#
# This installs the RSHIP CLI to your system and configures it for immediate use.
# Supports macOS, Linux (x86_64, aarch64)
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ── Configuration ─────────────────────────────────────────────────────────────
VERSION="1.0.0"
REPO_OWNER="FreddyCreates"
REPO_NAME="Enterprise-OS-intelligence"
BINARY_NAME="rship"
INSTALL_DIR="${RSHIP_INSTALL_DIR:-$HOME/.rship}"
GITHUB_BASE="https://github.com/$REPO_OWNER/$REPO_NAME"
PAGES_BASE="https://freddycreates.github.io/Enterprise-OS-intelligence"

# ── Colors ────────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[0;90m'
RESET='\033[0m'

# ── Banner ────────────────────────────────────────────────────────────────────
show_banner() {
    printf "${CYAN}"
    cat << 'EOF'

    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   ◎  RSHIP Enterprise OS Intelligence                        ║
    ║                                                              ║
    ║   Sovereign AI Infrastructure · Zero Third-Party AI          ║
    ║   Intelligent Cache Organisms · Production Runtime           ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝

EOF
    printf "${RESET}"
    printf "  Installing RSHIP CLI v${VERSION}...\n\n"
}

# ── Detect OS & Architecture ──────────────────────────────────────────────────
detect_platform() {
    OS="$(uname -s)"
    ARCH="$(uname -m)"

    case "$OS" in
        Linux*)   PLATFORM="linux" ;;
        Darwin*)  PLATFORM="darwin" ;;
        MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
        *)
            printf "  ${RED}[!] Unsupported OS: $OS${RESET}\n"
            exit 1
            ;;
    esac

    case "$ARCH" in
        x86_64|amd64)   ARCH="x86_64" ;;
        aarch64|arm64)  ARCH="aarch64" ;;
        *)
            printf "  ${RED}[!] Unsupported architecture: $ARCH${RESET}\n"
            exit 1
            ;;
    esac
}

# ── Download ──────────────────────────────────────────────────────────────────
download() {
    url="$1"
    dest="$2"
    
    if command -v curl > /dev/null 2>&1; then
        curl -fsSL "$url" -o "$dest"
    elif command -v wget > /dev/null 2>&1; then
        wget -qO "$dest" "$url"
    else
        printf "  ${RED}[!] Neither curl nor wget found. Install one and retry.${RESET}\n"
        exit 1
    fi
}

# ── Install ───────────────────────────────────────────────────────────────────
install_rship() {
    detect_platform

    printf "  ${DIM}[1/5] Detecting system... ${PLATFORM} ${ARCH}${RESET}\n"

    # Create install directory
    mkdir -p "$INSTALL_DIR/bin"

    # Download CLI
    printf "  ${DIM}[2/5] Downloading RSHIP CLI...${RESET}\n"
    CLI_URL="$PAGES_BASE/cli/rship-cli.js"
    download "$CLI_URL" "$INSTALL_DIR/bin/rship-cli.js" 2>/dev/null || {
        printf "  ${YELLOW}[!] Pages download failed. Falling back to GitHub...${RESET}\n"
        CLI_URL="$GITHUB_BASE/raw/main/cli/rship-cli.js"
        download "$CLI_URL" "$INSTALL_DIR/bin/rship-cli.js"
    }

    # Create shell wrapper
    printf "  ${DIM}[3/5] Creating launcher...${RESET}\n"
    cat > "$INSTALL_DIR/bin/rship" << 'LAUNCHER'
#!/bin/sh
exec node "$(dirname "$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")")/rship-cli.js" "$@"
LAUNCHER
    chmod +x "$INSTALL_DIR/bin/rship"

    # Configure PATH
    printf "  ${DIM}[4/5] Configuring PATH...${RESET}\n"
    SHELL_NAME="$(basename "$SHELL")"
    PATH_LINE="export PATH=\"\$PATH:$INSTALL_DIR/bin\""
    
    case "$SHELL_NAME" in
        zsh)
            PROFILE="$HOME/.zshrc"
            ;;
        bash)
            if [ -f "$HOME/.bash_profile" ]; then
                PROFILE="$HOME/.bash_profile"
            else
                PROFILE="$HOME/.bashrc"
            fi
            ;;
        fish)
            PROFILE="$HOME/.config/fish/config.fish"
            PATH_LINE="set -gx PATH \$PATH $INSTALL_DIR/bin"
            ;;
        *)
            PROFILE="$HOME/.profile"
            ;;
    esac

    if [ -f "$PROFILE" ]; then
        if ! grep -q "$INSTALL_DIR/bin" "$PROFILE" 2>/dev/null; then
            printf "\n# RSHIP CLI\n$PATH_LINE\n" >> "$PROFILE"
        fi
    else
        printf "\n# RSHIP CLI\n$PATH_LINE\n" > "$PROFILE"
    fi

    # Add to current session
    export PATH="$PATH:$INSTALL_DIR/bin"

    # Check Node.js
    printf "  ${DIM}[5/5] Verifying dependencies...${RESET}\n"
    if ! command -v node > /dev/null 2>&1; then
        printf "\n  ${YELLOW}[!] Node.js not found. Install from https://nodejs.org${RESET}\n"
        printf "      RSHIP CLI requires Node.js 18+ to run.\n\n"
    fi
}

# ── Post-Install ──────────────────────────────────────────────────────────────
show_post_install() {
    printf "\n  ${GREEN}✓ RSHIP CLI installed successfully!${RESET}\n\n"
    printf "  ${DIM}┌─────────────────────────────────────────────────────────┐${RESET}\n"
    printf "  ${DIM}│${RESET}  Quick Start:                                           ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}                                                         ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship                     — Interactive dashboard    ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship status              — System health check      ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship deploy              — Deploy to production     ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship intel               — Intelligence console     ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship apps                — List production apps     ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship cache               — Cache organism control   ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}                                                         ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}  Modes:                                                 ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}                                                         ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship --mode enterprise   — Full enterprise suite    ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship --mode developer    — Developer tools          ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship --mode operator     — Infrastructure ops       ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}    rship --mode sovereign    — Self-hosted sovereign    ${DIM}│${RESET}\n"
    printf "  ${DIM}│${RESET}                                                         ${DIM}│${RESET}\n"
    printf "  ${DIM}└─────────────────────────────────────────────────────────┘${RESET}\n"
    printf "\n  ${DIM}Documentation: $PAGES_BASE${RESET}\n"
    printf "  ${DIM}Source:        $GITHUB_BASE${RESET}\n\n"
    printf "  ${CYAN}Restart your terminal, then run: rship${RESET}\n\n"
}

# ── Main ──────────────────────────────────────────────────────────────────────
show_banner
install_rship
show_post_install
