#!/bin/bash

# Quick start script for VM server development
# Run with: ./start-vm-server.sh

echo "🚀 Starting VM Server for Local Development"
echo "==========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Navigate to VM server directory
cd "$(dirname "$0")/packages/vm-server" || exit 1

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env <<EOF
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Capacity (lower for local dev)
MAX_CONCURRENT_GAMES=10
MAX_QUEUE_SIZE=50

# Performance
STATE_BROADCAST_FPS=20
INPUT_RATE_LIMIT=100

# Backend Integration
BACKEND_URL=http://localhost:3000
VM_SERVER_TOKEN=local-dev-token-12345

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
EOF
    echo "✅ .env file created"
    echo ""
fi

# Check if scratch-vm is built
if [ ! -d "../scratch-vm/dist" ]; then
    echo "🔨 Building scratch-vm..."
    cd ../scratch-vm
    npm install
    npm run build
    cd ../vm-server
    echo "✅ scratch-vm built"
    echo ""
fi

# Start the server
echo "🎮 Starting VM Server..."
echo ""
echo "Server will be available at:"
echo "  HTTP: http://localhost:3001"
echo "  WebSocket: ws://localhost:3001/game"
echo ""
echo "Health check: http://localhost:3001/api/health"
echo "Status: http://localhost:3001/api/status"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "==========================================="
echo ""

# Start with nodemon for auto-reload
npm run dev
