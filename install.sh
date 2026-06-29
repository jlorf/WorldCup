#!/bin/bash
set -e

echo "========================================"
echo "  World Cup 2026 - Dependency Installer"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install nvm if not present
if [ -z "$NVM_DIR" ]; then
    if [ -d "$HOME/.nvm" ]; then
        export NVM_DIR="$HOME/.nvm"
    elif [ -d "$HOME/.config/nvm" ]; then
        export NVM_DIR="$HOME/.config/nvm"
    fi
fi

if [ -z "$NVM_DIR" ] || [ ! -s "$NVM_DIR/nvm.sh" ]; then
    echo "nvm not found. Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    echo "nvm found - OK"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Install latest LTS Node.js
echo "Installing latest Node.js LTS..."
nvm install --lts
nvm use --lts

echo "Node.js $(node -v) - OK"
echo "npm $(npm -v) - OK"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
npm install
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install
echo ""

# Install root dependencies (Playwright, etc.)
echo "Installing root dependencies..."
cd "$SCRIPT_DIR"
npm install
echo ""

echo "========================================"
echo "  All dependencies installed!"
echo "  Run ./start.sh to launch the app."
echo "========================================"
