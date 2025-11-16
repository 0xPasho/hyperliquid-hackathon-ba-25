# In-Room Multiplayer Architecture

## 🎯 New Approach: Stay in Room, Sync in Background

### What Changed
Previously, players were redirected to vm-player.html. Now:
- ✅ Players **stay in the room page**
- ✅ Game runs in **iframe** (each player's browser)
- ✅ Inputs sync to **vm-server in background**
- ✅ Server determines winner (secure)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Room Page (Web App)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │              Game Iframe (Scratch GUI)                   │ │
│  │                                                          │ │
│  │    [Each player runs VM locally in their browser]       │ │
│  │                                                          │ │
│  │    VM Sync Manager ──────────┐                          │ │
│  │         ↓                     │                          │ │
│  │    Sends inputs               │ Receives remote inputs  │ │
│  └────────┼──────────────────────┼──────────────────────────┘ │
│           │                     │                            │
│           ↓                     ↑                            │
│      WebSocket                 WebSocket                     │
│           │                     │                            │
└───────────┼─────────────────────┼────────────────────────────┘
            │                     │
            ↓                     ↑
    ┌───────────────────────────────────┐
    │        VM Server (Backend)        │
    │                                   │
    │  - Receives all player inputs     │
    │  - Runs authoritative VM          │
    │  - Determines winner              │
    │  - Broadcasts inputs to all       │
    └───────────────────────────────────┘
```

---

## 📋 Flow

### 1. Room Creation & Joining
```
1. Players join room
2. Mark ready
3. Room shows waiting state (no game yet)
```

### 2. Game Start
```
1. Host clicks "Start Game"
2. API calls vm-server: POST /api/request-slot
3. vm-server creates VMInstance
4. Room status → PLAYING
5. Room page shows game iframe
6. GameIframe sends START_VM_SYNC message to iframe
7. Scratch player receives message
8. VMSyncManager connects WebSocket to vm-server
```

### 3. Gameplay
```
Player 1 Browser:
  - Runs Scratch VM locally
  - Presses space key
  - VMSyncManager sends input to vm-server

VM Server:
  - Receives Player 1's input
  - Injects into server-side VM
  - Broadcasts to Player 2

Player 2 Browser:
  - VMSyncManager receives remote input
  - Applies to local VM
  - Both VMs now synchronized
```

### 4. Winner Detection
```
1. Game completes
2. Server VM detects "report winner" block
3. vm-server → API: POST /game/report-result
4. API updates database
5. vm-server broadcasts: {type: "game_ended", winner}
6. All players see result
```

---

## 🔧 Implementation Details

### Files Created/Modified

**1. `packages/scratch-gui/src/lib/vm-sync-manager.js`** (NEW)
- Manages WebSocket connection to vm-server
- Sends local inputs to server
- Receives and applies remote player inputs
- Handles game end events

**2. `packages/scratch-gui/src/playground/player.jsx`** (MODIFIED)
- Listens for START_VM_SYNC message from parent
- Initializes VMSyncManager
- Connects to vm-server when game starts

**3. `packages/web/src/components/rooms/GameIframe.tsx`** (MODIFIED)
- Added `isPlaying` prop
- Sends START_VM_SYNC message when game starts
- Passes roomId, userId, vmServerUrl, token to iframe

**4. `packages/web/src/app/rooms/[id]/page.tsx`** (MODIFIED)
- Shows game iframe when status = PLAYING
- Stores vmServerUrl in sessionStorage
- No redirect - players stay on room page

**5. `packages/api/src/modules/rooms/room.service.ts`** (MODIFIED)
- Allows single-player games (1/1)
- Changed validation to require >= 1 player

---

## 🔐 Security

### ✅ Server-Side Winner Detection
- VM runs on vm-server (authoritative)
- Server determines winner
- Clients cannot fake winner

### ✅ Input Synchronization
- All inputs go through vm-server
- Server broadcasts to all players
- Everyone sees same game state

### ⚠️ Client-Side Execution
- Each player runs VM locally (for performance)
- Can see game state (acceptable)
- Can use bots (acceptable)
- **But cannot fake winner** (server decides)

---

## 📊 Data Flow

### Input Flow
```
Player 1: keydown "space"
    ↓
VMSyncManager.sendInput({type: "keyboard", action: "keydown", key: " "})
    ↓
WebSocket → vm-server
    ↓
vm-server: inputInjector.inject(vm, userId, input)
    ↓
vm-server: broadcastInputToRoom(roomId, userId, input)
    ↓
WebSocket → Player 2
    ↓
VMSyncManager.applyRemoteInput(playerId, input)
    ↓
Player 2: vm.runtime.ioDevices.keyboard.postData({key: " ", isDown: true})
```

### Winner Flow
```
Scratch VM: "report winner" block executes
    ↓
vm-server VM: runtime.emit('REPORT_WINNER', {userId})
    ↓
VMInstance: captures winner
    ↓
vm-server → API: POST /game/report-result
    ↓
API: Update database, process payment
    ↓
vm-server → All players: {type: "game_ended", winner}
    ↓
VMSyncManager: notify parent window
    ↓
Room page: Show winner UI
```

---

## 🎮 User Experience

### Before (Old - Redirected)
```
1. Players in room lobby
2. Host starts game
3. → Redirect to vm-player.html
4. New page loads
5. Game plays
6. Shows winner
```

### After (New - In-Room)
```
1. Players in room lobby (waiting state)
2. Host starts game
3. → Game appears in same page (iframe)
4. Game plays (seamless)
5. Shows winner (stays in room)
```

**Benefits:**
- ✅ No page reload/redirect
- ✅ Seamless experience
- ✅ Chat/players list still visible
- ✅ Can see room context
- ✅ Better UX overall

---

## 🧪 Testing

### Test Single Player (1/1)
```
1. Create room with maxPlayers=1
2. Join as host
3. Click "Ready Up"
4. Click "Start Game" (should appear green)
5. ✅ Game loads in iframe
6. ✅ Can play normally
7. ✅ Complete game, winner detected
```

### Test Multiplayer (2/2)
```
Browser 1 (Host):
1. Create room with maxPlayers=2
2. Click "Ready Up"
3. Wait for Player 2

Browser 2 (Player):
1. Join room
2. Click "Ready Up"

Browser 1 (Host):
3. Click "Start Game" (green button appears)
4. ✅ Game loads in iframe

Both Browsers:
5. ✅ Press keys in Browser 1 → See effect in Browser 2
6. ✅ Press keys in Browser 2 → See effect in Browser 1
7. ✅ Complete game
8. ✅ Both see winner
9. ✅ Database updated correctly
```

### Expected Console Logs

**Browser (Room Page):**
```
[Room] Game started, VM server ready: ws://localhost:3002/game
[GameIframe] Starting VM sync: {roomId, userId, vmServerUrl}
[GameIframe] ✅ Sent START_VM_SYNC message
```

**Browser (Iframe - Scratch GUI):**
```
[Player] VM initialized
[Player] Received START_VM_SYNC message: {roomId, userId, vmServerUrl}
[VMSyncManager] Initialized
[VMSyncManager] Connecting to: ws://localhost:3002/game?roomId=...
[VMSyncManager] Connected to VM server
[VMSyncManager] Input hooks installed
[VMSyncManager] Applied remote keyboard: player2 keydown space
```

**Server (vm-server):**
```
[WebSocket] room123: Player user1 connected
[WebSocket] room123: Player user2 connected
[InputInjector] Injected keyboard: user1 keydown space
[WebSocket] Broadcasting input from user1 to 1 other players
[VMInstance] room123: Winner reported: user1
```

---

## 🚀 Deployment

### Development
```bash
# All servers run as before
./start-all-servers.sh

# Or manually:
cd packages/api && npm run dev         # Port 3000
cd packages/vm-server && npm run dev   # Port 3002
cd packages/scratch-gui && npm run start # Port 8601
cd packages/web && npm run dev         # Port 3001
```

### Production
- No changes needed
- Same deployment as before
- vm-server still runs server-side
- WebSocket connections work same way

---

## 📝 Summary

**What This Achieves:**
1. ✅ Players stay in room (no redirect)
2. ✅ Game runs locally (fast, responsive)
3. ✅ Inputs sync via vm-server (multiplayer)
4. ✅ Server determines winner (secure)
5. ✅ Better UX (seamless, no page reload)
6. ✅ Single-player support (1/1 rooms)

**Security Status:**
- 🛡️ Server-authoritative (winner cannot be faked)
- 🛡️ Input validation (rate limiting, type checking)
- 🛡️ Authentication (token-based)
- ⚠️ Client-side execution (performance > security for inputs)

**Perfect for betting games where winner verification matters most!**
