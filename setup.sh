#!/bin/bash

# Quick Start Guide for Kafka Broker Simulation

echo -e "\033[1;36mChecking prerequisites...\033[0m"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "\033[1;32m✓ Node.js: $NODE_VERSION\033[0m"
else
    echo -e "\033[1;31m✗ Node.js not found. Please install Node.js 20+ from https://nodejs.org/\033[0m"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "\033[1;32m✓ npm: v$NPM_VERSION\033[0m"
else
    echo -e "\033[1;31m✗ npm not found\033[0m"
    exit 1
fi

echo ""
echo -e "\033[1;36mInstalling dependencies...\033[0m"
echo ""

# Install backend dependencies
echo -e "\033[1;33mInstalling backend dependencies...\033[0m"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "\033[1;31mFailed to install backend dependencies\033[0m"
    exit 1
fi
cd ..

# Install frontend dependencies
echo ""
echo -e "\033[1;33mInstalling frontend dependencies...\033[0m"
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "\033[1;31mFailed to install frontend dependencies\033[0m"
    exit 1
fi
cd ..

echo ""
echo -e "\033[1;32m═══════════════════════════════════════════════════════════\033[0m"
echo -e "\033[1;32m   ✓ Installation Complete!\033[0m"
echo -e "\033[1;32m═══════════════════════════════════════════════════════════\033[0m"
echo ""
echo -e "\033[1;36mTo start the application:\033[0m"
echo ""
echo -e "\033[1;33m  Terminal 1 (Backend):\033[0m"
echo -e "    cd backend"
echo -e "    npm run dev"
echo ""
echo -e "\033[1;33m  Terminal 2 (Frontend):\033[0m"
echo -e "    cd frontend"
echo -e "    npm run dev"
echo ""
echo -e "\033[1;36m  Then open: http://localhost:3000\033[0m"
echo ""
