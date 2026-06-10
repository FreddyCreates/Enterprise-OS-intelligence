#!/bin/sh
# RSHIP Enterprise OS Intelligence — Shell Installer
# Usage: curl -fsSL https://freddycreates.github.io/Enterprise-OS-intelligence/install.sh | sh
set -e
VERSION="1.0.0"
INSTALL_DIR="${RSHIP_INSTALL_DIR:-$HOME/.rship}"
PAGES_BASE="https://freddycreates.github.io/Enterprise-OS-intelligence"
GITHUB_BASE="https://github.com/FreddyCreates/Enterprise-OS-intelligence"

printf "\n  \033[0;36m◎  RSHIP Enterprise OS Intelligence — Installing v${VERSION}\033[0m\n\n"

mkdir -p "$INSTALL_DIR/bin"

printf "  [1/3] Downloading CLI...\n"
if command -v curl > /dev/null 2>&1; then
    curl -fsSL "$PAGES_BASE/cli/rship-cli.js" -o "$INSTALL_DIR/bin/rship-cli.js" 2>/dev/null || \
    curl -fsSL "$GITHUB_BASE/raw/main/cli/rship-cli.js" -o "$INSTALL_DIR/bin/rship-cli.js"
else
    wget -qO "$INSTALL_DIR/bin/rship-cli.js" "$PAGES_BASE/cli/rship-cli.js" 2>/dev/null || \
    wget -qO "$INSTALL_DIR/bin/rship-cli.js" "$GITHUB_BASE/raw/main/cli/rship-cli.js"
fi

printf "  [2/3] Creating launcher...\n"
cat > "$INSTALL_DIR/bin/rship" << 'EOF'
#!/bin/sh
exec node "$(dirname "$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")")/rship-cli.js" "$@"
EOF
chmod +x "$INSTALL_DIR/bin/rship"

printf "  [3/3] Configuring PATH...\n"
SHELL_NAME="$(basename "${SHELL:-/bin/sh}")"
case "$SHELL_NAME" in
    zsh)  PROFILE="$HOME/.zshrc" ;;
    fish) PROFILE="$HOME/.config/fish/config.fish" ;;
    *)    PROFILE="$HOME/.bashrc" ;;
esac
if [ -f "$PROFILE" ] && ! grep -q "$INSTALL_DIR/bin" "$PROFILE" 2>/dev/null; then
    printf '\n# RSHIP CLI\nexport PATH="$PATH:%s/bin"\n' "$INSTALL_DIR" >> "$PROFILE"
fi

printf "\n  \033[0;32m✓ Installed! Restart terminal, then run: rship\033[0m\n\n"
