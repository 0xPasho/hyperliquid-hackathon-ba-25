# Local Development Setup

Quick guide to run the VM server architecture locally for development and testing.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running locally (for backend)
- Git

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# From project root
cd /Users/pasho/Projects/degu.games

# Install VM server dependencies
cd packages/vm-server
npm install

# Install backend dependencies
cd ../api
npm install

# Build scratch-vm (if not already built)
cd ../scratch-vm
npm install
npm run build
```

### 2. Configure VM Server

```bash
cd /Users/pasho/Projects/degu.games/packages/vm-server

# Create .env file
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
```

### 3. Configure Backend (if running)

```bash
cd /Users/pasho/Projects/degu.games/packages/api

# Create .env file (if not exists)
cat > .env <<EOF
# Server
NODE_ENV=development
PORT=3000

# Database (update with your local PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/degu_games_dev

# VM Server Integration
VM_SERVER_URL=http://localhost:3001
VM_SERVER_TOKEN=local-dev-token-12345
VM_REQUEST_TIMEOUT=10000

# JWT
JWT_SECRET=local-dev-secret-key-change-in-production
JWT_EXPIRY=7d

# Logging
LOG_LEVEL=debug
EOF
```

### 4. Start VM Server

```bash
cd /Users/pasho/Projects/degu.games/packages/vm-server

# Start in development mode
npm run dev

# Or with node directly
node src/index.js
```

You should see:
```
[2025-01-29 10:00:00] [info] [VMServer] Starting VM Server...
[2025-01-29 10:00:00] [info] [VMServer] Configuration validated
[2025-01-29 10:00:00] [info] [VMServer] HTTP server listening on http://localhost:3001
[2025-01-29 10:00:00] [info] [VMServer] WebSocket server ready at ws://localhost:3001/game
[2025-01-29 10:00:00] [info] [VMServer] VM Server started successfully
```

### 5. Test It's Working

Open another terminal:

```bash
# Health check
curl http://localhost:3001/api/health

# Expected response:
# {"success":true,"data":{"status":"ok","timestamp":1706526000000}}

# Check status
curl http://localhost:3001/api/status

# Expected response:
# {"success":true,"data":{"status":"healthy","capacity":{...},"stats":{...}}}
```

## Testing a Game Flow

### Option 1: Simple Test (No Backend)

Create a test script:

**File**: `packages/vm-server/test-local.js`

```javascript
const fetch = require('node-fetch');
const WebSocket = require('ws');

async function testGameFlow() {
    console.log('🎮 Testing local VM server...\n');

    // 1. Request a game slot
    console.log('1️⃣  Requesting game slot...');
    const response = await fetch('http://localhost:3001/api/request-slot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer local-dev-token-12345'
        },
        body: JSON.stringify({
            roomId: 'test-room-123',
            projectId: 'test-project',
            projectData: require('./test-data/simple-game.json'), // You'll need a test project
            players: ['alice', 'bob']
        })
    });

    const result = await response.json();
    console.log('✅ Slot requested:', result);

    if (!result.success) {
        console.error('❌ Failed to request slot');
        return;
    }

    // 2. Connect via WebSocket
    console.log('\n2️⃣  Connecting to WebSocket...');
    const wsUrl = result.data.wsUrl || 'ws://localhost:3001/game';
    const ws = new WebSocket(`${wsUrl}?roomId=test-room-123&userId=alice`);

    ws.on('open', () => {
        console.log('✅ WebSocket connected');

        // 3. Send input
        console.log('\n3️⃣  Sending input...');
        ws.send(JSON.stringify({
            type: 'keyboard',
            action: 'keydown',
            key: 'space'
        }));
        console.log('✅ Input sent');
    });

    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('\n4️⃣  Received state update:', message.type);
        if (message.type === 'full') {
            console.log('   Sprites:', Object.keys(message.sprites || {}));
        }
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
    });

    // Keep alive for 5 seconds
    setTimeout(() => {
        console.log('\n✅ Test complete!');
        ws.close();
        process.exit(0);
    }, 5000);
}

testGameFlow().catch(console.error);
```

**Run test:**
```bash
cd packages/vm-server
node test-local.js
```

### Option 2: With Backend API

**Terminal 1 - Start VM Server:**
```bash
cd /Users/pasho/Projects/degu.games/packages/vm-server
npm run dev
```

**Terminal 2 - Start Backend:**
```bash
cd /Users/pasho/Projects/degu.games/packages/api

# Setup database (first time only)
npx prisma migrate dev

# Start backend
npm run dev
```

**Terminal 3 - Test full flow:**
```bash
# Create game room (via backend)
curl -X POST http://localhost:3000/api/game/create-room \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-123",
    "players": ["user1", "user2"],
    "betAmount": 10
  }'

# You should get back:
# {
#   "success": true,
#   "data": {
#     "roomId": "...",
#     "status": "ready",
#     "wsUrl": "ws://localhost:3001/game",
#     "message": "Game ready to start"
#   }
# }
```

## Development Workflow

### Running in Watch Mode

**VM Server with auto-reload:**
```bash
cd packages/vm-server

# Install nodemon
npm install --save-dev nodemon

# Add to package.json scripts:
# "dev": "nodemon src/index.js"

npm run dev
```

### Viewing Logs

```bash
# Real-time logs
tail -f packages/vm-server/logs/combined.log

# Error logs only
tail -f packages/vm-server/logs/error.log

# With grep for specific room
tail -f packages/vm-server/logs/combined.log | grep "room-123"
```

### Debugging

**With VS Code:**

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "VM Server",
      "program": "${workspaceFolder}/packages/vm-server/src/index.js",
      "cwd": "${workspaceFolder}/packages/vm-server",
      "envFile": "${workspaceFolder}/packages/vm-server/.env",
      "console": "integratedTerminal"
    }
  ]
}
```

Then press F5 to start debugging.

**With Chrome DevTools:**
```bash
node --inspect src/index.js
# Open chrome://inspect in Chrome
```

## Test Data Setup

Create a minimal Scratch project for testing:

**File**: `packages/vm-server/test-data/simple-game.json`

```json
{
  "targets": [
    {
      "isStage": true,
      "name": "Stage",
      "variables": {},
      "lists": {},
      "broadcasts": {},
      "blocks": {},
      "comments": {},
      "currentCostume": 0,
      "costumes": [
        {
          "assetId": "cd21514d0531fdffb22204e0ec5ed84a",
          "name": "backdrop1",
          "md5ext": "cd21514d0531fdffb22204e0ec5ed84a.svg",
          "dataFormat": "svg"
        }
      ],
      "sounds": [],
      "volume": 100
    },
    {
      "isStage": false,
      "name": "Sprite1",
      "variables": {},
      "lists": {},
      "broadcasts": {},
      "blocks": {},
      "comments": {},
      "currentCostume": 0,
      "costumes": [
        {
          "assetId": "b7853f557e4426412e64bb3da6531a99",
          "name": "costume1",
          "md5ext": "b7853f557e4426412e64bb3da6531a99.svg",
          "dataFormat": "svg"
        }
      ],
      "sounds": [],
      "volume": 100,
      "visible": true,
      "x": 0,
      "y": 0,
      "size": 100,
      "direction": 90,
      "draggable": false,
      "rotationStyle": "all around"
    }
  ],
  "meta": {
    "semver": "3.0.0",
    "vm": "0.2.0"
  }
}
```

## Common Issues

### Issue: "Cannot find module 'scratch-vm'"

**Solution:**
```bash
cd packages/scratch-vm
npm install
npm run build

cd ../vm-server
npm install
```

### Issue: "Port 3001 already in use"

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use different port in .env
PORT=3002
```

### Issue: "VM_SERVER_TOKEN not configured"

**Solution:**
Make sure `.env` file exists in `packages/vm-server/` with `VM_SERVER_TOKEN` set.

### Issue: WebSocket connection refused

**Solution:**
1. Make sure VM server is running
2. Check firewall isn't blocking port 3001
3. Verify URL is correct: `ws://localhost:3001/game?roomId=xxx&userId=xxx`

### Issue: "Project data failed to load"

**Solution:**
Ensure your test project JSON is valid Scratch 3.0 format. Use the simple-game.json example above.

## Environment Variables Reference

### VM Server (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | development | Environment |
| PORT | 3001 | Server port |
| HOST | localhost | Server host |
| MAX_CONCURRENT_GAMES | 10 | Max games (keep low locally) |
| MAX_QUEUE_SIZE | 50 | Max queue size |
| STATE_BROADCAST_FPS | 20 | State update frequency |
| INPUT_RATE_LIMIT | 100 | Max inputs per second |
| BACKEND_URL | http://localhost:3000 | Backend API URL |
| VM_SERVER_TOKEN | (required) | Auth token |
| LOG_LEVEL | debug | Log level |
| LOG_DIR | ./logs | Log directory |

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | Backend port (default 3000) |
| DATABASE_URL | Yes | PostgreSQL connection string |
| VM_SERVER_URL | Yes | VM server URL |
| VM_SERVER_TOKEN | Yes | Must match VM server token |
| JWT_SECRET | Yes | JWT signing secret |

## Running Tests Locally

```bash
cd packages/vm-server

# Run unit tests
npm test

# Run specific test
npm test -- VMInstance.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Cleaning Up

```bash
# Stop all processes (Ctrl+C in each terminal)

# Clear logs
rm -rf packages/vm-server/logs/*.log

# Reset database (if needed)
cd packages/api
npx prisma migrate reset
```

## Quick Commands Reference

```bash
# Start VM server
cd packages/vm-server && npm run dev

# Start backend
cd packages/api && npm run dev

# Test health
curl http://localhost:3001/api/health

# View logs
tail -f packages/vm-server/logs/combined.log

# Run tests
cd packages/vm-server && npm test
```

## Next Steps

1. ✅ Get VM server running locally
2. ✅ Test with simple game project
3. ⏭️ Integrate with your frontend (Scratch GUI)
4. ⏭️ Test full betting flow
5. ⏭️ Deploy to production (see DEPLOYMENT_GUIDE.md)

---

Need help? Check the main documentation:
- Architecture: `FINAL_ARCHITECTURE_DECISIONS.md`
- Implementation: `VM_SERVER_IMPLEMENTATION_PLAN.md`
- Testing: `TESTING_GUIDE.md`
- Deployment: `DEPLOYMENT_GUIDE.md`
