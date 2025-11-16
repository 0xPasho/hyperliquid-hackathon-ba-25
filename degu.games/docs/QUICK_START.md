# Quick Start Guide - Secure Multiplayer

## 🚀 Start Servers (Development)

```bash
# Terminal 1: API
cd packages/api && npm run dev

# Terminal 2: VM Server
cd packages/vm-server && npm run dev

# Terminal 3: Scratch GUI
cd packages/scratch-gui && npm run start

# Terminal 4: Web
cd packages/web && npm run dev
```

## ⚙️ Environment Setup (First Time Only)

```bash
# API Server
cd packages/api
cp .env.example .env
# Edit .env: Add VM_SERVER_TOKEN=your_secret_123

# VM Server
cd packages/vm-server
cp .env.example .env
# Edit .env: Add VM_SERVER_TOKEN=your_secret_123 (MUST MATCH API)
```

## ✅ Test Flow

1. **Create Room**: http://localhost:3001
2. **Join Room**: Two players join and click "Ready"
3. **Start Game**: Host clicks "Start Game"
4. **Play**: Press keys, see sync between players
5. **Win**: Game detects winner server-side

## 🔍 Verify It Works

**Browser Console (vm-player):**
```
✓ [VMPlayer] Connected to VM server
✓ [VMPlayer] Project loaded successfully
✓ [VMPlayer] Applied remote keyboard: player2 keydown space
```

**VM Server Console:**
```
✓ [WebSocket] room123: Player user1 connected
✓ [WebSocket] room123: Player user2 connected
✓ [VMInstance] room123: Winner reported: user1
```

## 🛡️ Security Status

✅ Server determines winner (cannot be faked)
✅ Inputs validated and rate limited
✅ Authentication between services
⚠️ Bots allowed (acceptable tradeoff)

## 📁 Key Files Modified

1. `vm-server/src/websocket-server.js` - Input broadcasting
2. `scratch-gui/src/playground/vm-player.jsx` - Remote input handling
3. `api/src/modules/rooms/room.service.ts` - VM server integration
4. `web/src/app/rooms/[id]/page.tsx` - Navigation to vm-player

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Connection refused" | Start vm-server on port 3002 |
| "Invalid token" | Match VM_SERVER_TOKEN in api/.env and vm-server/.env |
| Desynced games | Check browser console for remote input messages |
| "Room not found" | Ensure startGame API succeeds before redirect |

## 📊 Ports

- API: `3000`
- Web: `3001`
- VM Server: `3002`
- Scratch GUI: `8601`

## 🎮 How It Works

```
Player 1 presses space
  ↓
vm-server: Injects to server VM + broadcasts to Player 2
  ↓
Player 2's vm-player: Receives and applies input
  ↓
Both see synchronized game state
  ↓
Server detects winner → Calls API → Updates database
```

---

**For detailed docs, see [SETUP_SECURE_MULTIPLAYER.md](./SETUP_SECURE_MULTIPLAYER.md)**
