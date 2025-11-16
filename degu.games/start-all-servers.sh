#!/bin/bash

# Start All Servers for Degu Games
# This script starts all required servers for local development

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Degu Games - Secure Multiplayer System           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env files exist
echo -e "${YELLOW}Checking configuration...${NC}"

if [ ! -f "packages/api/.env" ]; then
    echo -e "${RED}❌ packages/api/.env not found${NC}"
    echo -e "${YELLOW}Run: cd packages/api && cp .env.example .env${NC}"
    exit 1
fi

if [ ! -f "packages/vm-server/.env" ]; then
    echo -e "${RED}❌ packages/vm-server/.env not found${NC}"
    echo -e "${YELLOW}Run: cd packages/vm-server && cp .env.example .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuration files found${NC}"
echo ""

# Check for tmux
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}❌ tmux not installed${NC}"
    echo -e "${YELLOW}Install with: brew install tmux (macOS) or apt install tmux (Linux)${NC}"
    echo ""
    echo -e "${YELLOW}Alternatively, start servers manually in separate terminals:${NC}"
    echo -e "  Terminal 1: ${BLUE}cd packages/api && npm run dev${NC}"
    echo -e "  Terminal 2: ${BLUE}cd packages/vm-server && npm run dev${NC}"
    echo -e "  Terminal 3: ${BLUE}cd packages/scratch-gui && npm run start${NC}"
    echo -e "  Terminal 4: ${BLUE}cd packages/web && npm run dev${NC}"
    exit 1
fi

echo -e "${GREEN}Starting servers in tmux session 'degu'...${NC}"
echo ""

# Kill existing session if it exists
tmux kill-session -t degu 2>/dev/null

# Create new tmux session
tmux new-session -d -s degu -n api

# Window 1: API Server
tmux send-keys -t degu:api "cd packages/api" C-m
tmux send-keys -t degu:api "echo -e '${GREEN}Starting API Server on port 3000...${NC}'" C-m
tmux send-keys -t degu:api "npm run dev" C-m

# Window 2: VM Server
tmux new-window -t degu -n vm-server
tmux send-keys -t degu:vm-server "cd packages/vm-server" C-m
tmux send-keys -t degu:vm-server "echo -e '${GREEN}Starting VM Server on port 3002...${NC}'" C-m
tmux send-keys -t degu:vm-server "npm run dev" C-m

# Window 3: Scratch GUI
tmux new-window -t degu -n scratch-gui
tmux send-keys -t degu:scratch-gui "cd packages/scratch-gui" C-m
tmux send-keys -t degu:scratch-gui "echo -e '${GREEN}Starting Scratch GUI on port 8601...${NC}'" C-m
tmux send-keys -t degu:scratch-gui "npm run start" C-m

# Window 4: Web (Next.js)
tmux new-window -t degu -n web
tmux send-keys -t degu:web "cd packages/web" C-m
tmux send-keys -t degu:web "echo -e '${GREEN}Starting Web App on port 3001...${NC}'" C-m
tmux send-keys -t degu:web "npm run dev" C-m

echo -e "${GREEN}✓ All servers started in tmux session!${NC}"
echo ""
echo -e "${BLUE}Servers:${NC}"
echo -e "  • API:         ${GREEN}http://localhost:3000${NC}"
echo -e "  • VM Server:   ${GREEN}http://localhost:3002${NC}"
echo -e "  • Scratch GUI: ${GREEN}http://localhost:8601${NC}"
echo -e "  • Web:         ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo -e "  • Attach to session:  ${BLUE}tmux attach -t degu${NC}"
echo -e "  • Switch windows:     ${BLUE}Ctrl+B then 0/1/2/3${NC}"
echo -e "  • Detach from tmux:   ${BLUE}Ctrl+B then D${NC}"
echo -e "  • Stop all servers:   ${BLUE}tmux kill-session -t degu${NC}"
echo ""
echo -e "${GREEN}🚀 System ready! Open http://localhost:3001 to start${NC}"
echo ""

# Attach to the session
tmux attach -t degu
