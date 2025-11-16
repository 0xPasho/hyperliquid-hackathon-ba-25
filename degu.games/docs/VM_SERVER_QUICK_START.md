# VM Server - Quick Start 🚀

Get the VM server running locally in under 2 minutes.

## Prerequisites

- Node.js 18+
- Terminal

## One-Command Start

```bash
./start-vm-server.sh
```

That's it! The script will:
1. ✅ Check Node.js installation
2. ✅ Install dependencies if needed
3. ✅ Create `.env` file if missing
4. ✅ Build scratch-vm if needed
5. ✅ Start the VM server

## Verify It's Working

Open another terminal and run:

```bash
# Health check
curl http://localhost:3001/api/health

# Server status
curl http://localhost:3001/api/status
```

## Test With a Game

```bash
cd packages/vm-server
node test-local.js
```

You should see:
```
🎮 Testing Local VM Server
===========================

1️⃣  Health Check...
   ✅ VM Server is healthy

2️⃣  Loading test project...
   ✅ Test project loaded

3️⃣  Requesting game slot...
   ✅ Slot requested successfully

4️⃣  Connecting to WebSocket...
   ✅ WebSocket connected

5️⃣  Sending keyboard input (space key)...
   ✅ Input sent

6️⃣  Receiving state updates...
   ✅ Full state received

✅ Test Complete!
```

## Manual Start (if you prefer)

```bash
cd packages/vm-server

# Install dependencies
npm install

# Create .env (see LOCAL_DEVELOPMENT_SETUP.md for details)
cp .env.example .env

# Start in development mode
npm run dev
```

## What's Running?

- **HTTP API**: http://localhost:3001
  - `/api/health` - Health check
  - `/api/status` - Server status
  - `/api/request-slot` - Request game slot

- **WebSocket**: ws://localhost:3001/game
  - Connect with: `?roomId=xxx&userId=xxx`
  - Send inputs, receive game state

## Logs

```bash
# View logs in real-time
tail -f packages/vm-server/logs/combined.log

# Error logs only
tail -f packages/vm-server/logs/error.log
```

## Stop Server

Press `Ctrl+C` in the terminal where the server is running.

## Next Steps

1. ✅ **VM Server running** ← You are here
2. ⏭️ **Integrate with your frontend** (see `SCRATCH_GUI_VM_INTEGRATION.md`)
3. ⏭️ **Connect backend API** (see `BACKEND_INTEGRATION_EXAMPLE.md`)
4. ⏭️ **Test full flow** (see `TESTING_GUIDE.md`)
5. ⏭️ **Deploy to production** (see `DEPLOYMENT_GUIDE.md`)

## Troubleshooting

### Port 3001 already in use

```bash
# Find and kill the process
lsof -i :3001
kill -9 <PID>
```

### "Cannot find module 'scratch-vm'"

```bash
cd packages/scratch-vm
npm install
npm run build
```

### Need help?

See full guide: `LOCAL_DEVELOPMENT_SETUP.md`

## Architecture Overview

```
┌──────────────┐      WebSocket       ┌──────────────┐
│   Players    │ ◄─────────────────► │  VM Server   │
│  (Browser)   │   (Input/State)      │ (localhost)  │
└──────────────┘                      └──────┬───────┘
                                             │
                                      ┌──────▼───────┐
                                      │  Scratch VM  │
                                      │   (Server)   │
                                      └──────────────┘
```

**Server runs the game logic** → **Players send inputs only** → **No cheating possible** ✨

---

**Documentation:**
- Full setup: `LOCAL_DEVELOPMENT_SETUP.md`
- Architecture decisions: `FINAL_ARCHITECTURE_DECISIONS.md`
- Implementation plan: `VM_SERVER_IMPLEMENTATION_PLAN.md`
- Testing: `TESTING_GUIDE.md`
- Deployment: `DEPLOYMENT_GUIDE.md`
