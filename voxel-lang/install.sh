#!/bin/bash
#
# VoxelScript Installer for Linux/macOS
# Run: curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/voxelscript/main/install.sh | bash
# Or: ./install.sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ██╗   ██╗ ██████╗ ██╗  ██╗███████╗██╗                  ║"
echo "║   ██║   ██║██╔═══██╗╚██╗██╔╝██╔════╝██║                  ║"
echo "║   ██║   ██║██║   ██║ ╚███╔╝ █████╗  ██║                  ║"
echo "║   ╚██╗ ██╔╝██║   ██║ ██╔██╗ ██╔══╝  ██║                  ║"
echo "║    ╚████╔╝ ╚██████╔╝██╔╝ ██╗███████╗███████╗             ║"
echo "║     ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝             ║"
echo "║                                                           ║"
echo "║           VOXELSCRIPT INSTALLER - Matrix Edition          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for Node.js
echo -e "${CYAN}[1/5] Checking dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${YELLOW}Warning: Node.js version 16+ recommended. You have $(node -v)${NC}"
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Determine install location
INSTALL_DIR="$HOME/.voxelscript"
BIN_DIR="$HOME/.local/bin"

echo -e "${CYAN}[2/5] Creating directories...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

# Download or copy VoxelScript
echo -e "${CYAN}[3/5] Installing VoxelScript...${NC}"

if [ -d "./voxel-lang" ]; then
    # Local install
    echo "Installing from local directory..."
    cp -r ./voxel-lang/* "$INSTALL_DIR/"
elif [ -n "$VOXEL_SOURCE" ]; then
    # Custom source
    cp -r "$VOXEL_SOURCE"/* "$INSTALL_DIR/"
else
    # Download from GitHub
    echo "Downloading from GitHub..."
    if command -v git &> /dev/null; then
        git clone --depth 1 https://github.com/YOUR_USERNAME/voxelscript.git "$INSTALL_DIR/temp"
        mv "$INSTALL_DIR/temp/voxel-lang"/* "$INSTALL_DIR/"
        rm -rf "$INSTALL_DIR/temp"
    elif command -v curl &> /dev/null; then
        curl -L https://github.com/YOUR_USERNAME/voxelscript/archive/main.tar.gz | tar xz -C "$INSTALL_DIR" --strip-components=2 "voxelscript-main/voxel-lang"
    else
        echo -e "${RED}Error: git or curl required for installation${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ VoxelScript installed to $INSTALL_DIR${NC}"

# Create CLI wrapper
echo -e "${CYAN}[4/5] Creating command-line tool...${NC}"

cat > "$BIN_DIR/voxel" << 'VOXEL_CLI'
#!/bin/bash
# VoxelScript CLI
VOXEL_HOME="$HOME/.voxelscript"
exec node "$VOXEL_HOME/voxel.js" "$@"
VOXEL_CLI

chmod +x "$BIN_DIR/voxel"

# Create shebang runner for direct execution
cat > "$BIN_DIR/voxelscript" << 'VOXEL_RUNNER'
#!/bin/bash
# VoxelScript runner for shebang support
# Usage in .voxel files: #!/usr/bin/env voxelscript
VOXEL_HOME="$HOME/.voxelscript"
exec node "$VOXEL_HOME/voxel.js" "$@"
VOXEL_RUNNER

chmod +x "$BIN_DIR/voxelscript"

echo -e "${GREEN}✓ CLI tools created${NC}"

# Add to PATH
echo -e "${CYAN}[5/5] Configuring PATH...${NC}"

add_to_path() {
    local shell_rc="$1"
    local path_line='export PATH="$HOME/.local/bin:$PATH"'
    
    if [ -f "$shell_rc" ]; then
        if ! grep -q ".local/bin" "$shell_rc"; then
            echo "" >> "$shell_rc"
            echo "# VoxelScript" >> "$shell_rc"
            echo "$path_line" >> "$shell_rc"
            echo -e "${GREEN}✓ Added to $shell_rc${NC}"
        else
            echo -e "${YELLOW}✓ PATH already configured in $shell_rc${NC}"
        fi
    fi
}

# Detect shell and add to appropriate rc file
if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
    add_to_path "$HOME/.zshrc"
fi

if [ -n "$BASH_VERSION" ] || [ -f "$HOME/.bashrc" ]; then
    add_to_path "$HOME/.bashrc"
fi

if [ -f "$HOME/.profile" ]; then
    add_to_path "$HOME/.profile"
fi

# Add to current session
export PATH="$HOME/.local/bin:$PATH"

# Create file association (Linux only)
if [ "$(uname)" = "Linux" ] && command -v xdg-mime &> /dev/null; then
    echo -e "${CYAN}Setting up file associations...${NC}"
    
    # Create MIME type
    mkdir -p "$HOME/.local/share/mime/packages"
    cat > "$HOME/.local/share/mime/packages/voxelscript.xml" << 'MIME_XML'
<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
    <mime-type type="text/x-voxelscript">
        <comment>VoxelScript source file</comment>
        <glob pattern="*.voxel"/>
        <glob pattern="*.vxl"/>
        <icon name="text-x-script"/>
    </mime-type>
</mime-info>
MIME_XML
    
    # Create desktop entry
    mkdir -p "$HOME/.local/share/applications"
    cat > "$HOME/.local/share/applications/voxelscript.desktop" << DESKTOP_ENTRY
[Desktop Entry]
Name=VoxelScript
Comment=Run VoxelScript files
Exec=$BIN_DIR/voxel %f
Terminal=true
Type=Application
MimeType=text/x-voxelscript;
Categories=Development;
Icon=utilities-terminal
DESKTOP_ENTRY
    
    # Update database
    update-mime-database "$HOME/.local/share/mime" 2>/dev/null || true
    xdg-mime default voxelscript.desktop text/x-voxelscript 2>/dev/null || true
    
    echo -e "${GREEN}✓ File associations configured${NC}"
fi

# macOS file association
if [ "$(uname)" = "Darwin" ]; then
    echo -e "${YELLOW}Note: On macOS, use the VoxelScript Editor app for file associations${NC}"
fi

# Done!
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}           INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "VoxelScript has been installed to: ${CYAN}$INSTALL_DIR${NC}"
echo ""
echo -e "${YELLOW}Usage:${NC}"
echo -e "  ${CYAN}voxel${NC}                    - Start REPL"
echo -e "  ${CYAN}voxel script.voxel${NC}      - Run a script"
echo -e "  ${CYAN}voxel --help${NC}            - Show help"
echo ""
echo -e "${YELLOW}Example:${NC}"
echo -e "  ${CYAN}echo 'print \"Hello, Matrix!\"' > hello.voxel${NC}"
echo -e "  ${CYAN}voxel hello.voxel${NC}"
echo ""
echo -e "${YELLOW}Restart your terminal or run:${NC}"
echo -e "  ${CYAN}source ~/.bashrc${NC}  (or ~/.zshrc)"
echo ""
echo -e "${GREEN}Welcome to the Matrix! 🟢${NC}"
