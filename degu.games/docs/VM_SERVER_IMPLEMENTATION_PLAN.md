# VM Server Implementation Plan

**Date:** 2025-10-29
**Status:** Ready for Implementation
**Estimated Time:** 3-4 weeks

---

## Overview

This document provides a step-by-step implementation plan for the server-authoritative Scratch VM architecture. Each component is analyzed for dependencies, integration points, and testing requirements.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ scratch-gui (React App)                                   │  │
│  │  - Room creation UI                                       │  │
│  │  - Queue status display                                   │  │
│  │  - Game renderer (receives state)                         │  │
│  │  - Input capture (keyboard/mouse)                         │  │
│  └────────┬─────────────────────────────────────────┬────────┘  │
│           │                                          │           │
└───────────┼──────────────────────────────────────────┼───────────┘
            │                                          │
            │ HTTP: Create room                        │ WS: Game I/O
            │                                          │
┌───────────▼──────────────────────────────────────────▼───────────┐
│                         BACKEND API                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Node.js/Express Backend                                  │   │
│  │  - POST /api/game/create-room                            │   │
│  │  - POST /api/game/report-result (from VM server)         │   │
│  │  - Game escrow/betting logic                             │   │
│  │  - Smart contract integration                            │   │
│  └────────┬─────────────────────────────────────────────────┘   │
└───────────┼──────────────────────────────────────────────────────┘
            │
            │ HTTP: Request VM slot
            │
┌───────────▼──────────────────────────────────────────────────────┐
│                      VM SERVER (NEW)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ REST API Service (Express)                               │   │
│  │  - POST /request-slot → Request game instance            │   │
│  │  - GET /status → Server health/capacity                  │   │
│  │  - POST /end-game → Force end game (admin)               │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                      │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │ GameInstanceManager                                       │   │
│  │  - Map<roomId, VM>                                        │   │
│  │  - Queue management                                       │   │
│  │  - Capacity checking                                      │   │
│  │  - VM lifecycle (start/stop)                              │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                      │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │ WebSocket Server (ws library)                             │   │
│  │  - Player connections                                     │   │
│  │  - Room-based routing                                     │   │
│  │  - Input → VM injection                                   │   │
│  │  - State → Broadcast to players                           │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                      │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │ Scratch VM Instances                                      │   │
│  │  - VM 1 (Room abc123)                                     │   │
│  │  - VM 2 (Room def456)                                     │   │
│  │  - VM 3 (Room ghi789)                                     │   │
│  │  - ... (up to 200 concurrent)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Analysis

### Component 1: VM Server Package Structure

**Location:** `packages/vm-server/`

**Purpose:** Run Scratch VM instances, manage game lifecycle, route I/O

**Dependencies:**
- `scratch-vm` - Core Scratch virtual machine
- `ws` - WebSocket server
- `express` - REST API
- `dotenv` - Environment configuration
- `winston` - Logging

**File Structure:**
```
packages/vm-server/
├── src/
│   ├── index.js                 # Entry point
│   ├── rest-api.js              # REST API routes
│   ├── websocket-server.js      # WebSocket handling
│   ├── GameInstanceManager.js   # VM lifecycle management
│   ├── VMInstance.js            # Single VM wrapper
│   ├── QueueManager.js          # Waiting queue logic
│   ├── StateSerializer.js       # VM state → JSON
│   ├── InputInjector.js         # Browser input → VM
│   ├── config.js                # Configuration
│   └── logger.js                # Winston logger
├── package.json
├── .env.example
└── README.md
```

**Integration Points:**
- **← Backend API:** Receives room creation requests via HTTP
- **→ Backend API:** Sends game results via HTTP POST
- **← Scratch GUI:** Receives player inputs via WebSocket
- **→ Scratch GUI:** Broadcasts game state via WebSocket

---

### Component 2: Backend API Updates

**Location:** `packages/backend/` (or wherever your backend is)

**Changes Needed:**
1. New endpoint: `POST /api/game/create-room`
2. New endpoint: `POST /api/game/report-result` (enhanced)
3. VM server communication client
4. Room status tracking

**New Files:**
```
src/
├── services/
│   └── vm-server-client.js      # HTTP client for VM server
├── routes/
│   └── game.js                  # Enhanced game routes
└── middleware/
    └── vm-auth.js               # Authenticate VM server calls
```

**Integration Points:**
- **→ VM Server:** Request game slots via HTTP
- **← VM Server:** Receive game results via HTTP webhook
- **← Scratch GUI:** Create room requests
- **→ Smart Contract:** Distribute prizes

---

### Component 3: Scratch VM Extension Updates

**Location:** `packages/scratch-vm/src/extensions/scratch3_blockchain/`

**Changes Needed:**
1. Remove cloud variable winner reporting (keep for fallback)
2. Add VM runtime events for winner/end game
3. Emit events instead of setting variables

**Modified Methods:**
```javascript
reportWinner(args) {
  // NEW: Emit event for VM server
  this.runtime.emit('REPORT_WINNER', {
    userId: args.USERID,
    roomId: this._roomContext.roomId
  });

  // KEEP: Cloud variable fallback (if VM server unavailable)
  this._setCloudVariable('room_X_winner', args.USERID);
}

endGame() {
  // NEW: Emit event for VM server
  this.runtime.emit('GAME_ENDED', {
    roomId: this._roomContext.roomId
  });

  // KEEP: Cloud variable fallback
  this._setCloudVariable('room_X_ended', 'true');
}
```

**Integration Points:**
- **→ VM Server:** Emit events when running server-side
- **→ Cloud Server:** Fall back to cloud variables if needed

---

### Component 4: Scratch GUI Updates

**Location:** `packages/scratch-gui/`

**Changes Needed:**
1. New component: `<GameServerConnection />`
2. WebSocket client for VM server
3. Input capture and forwarding
4. State rendering from server
5. Queue/waiting UI

**New Files:**
```
src/
├── lib/
│   ├── vm-server-client.js      # WebSocket client
│   └── input-forwarder.js       # Capture + send inputs
└── components/
    ├── game-server-connection/
    │   ├── game-server-connection.jsx
    │   └── game-server-connection.css
    └── queue-status/
        ├── queue-status.jsx
        └── queue-status.css
```

**Integration Points:**
- **→ Backend API:** Create room, get VM server URL
- **→ VM Server:** WebSocket connection for game I/O
- **← VM Server:** Receive state updates, render game

---

## Data Flow Analysis

### Flow 1: Room Creation

```
┌─────────────┐
│ User clicks │
│ "Start Game"│
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────┐
│ Frontend: POST /api/game/create-room│
│ {                                   │
│   projectId: "123",                 │
│   players: ["user1", "user2"],      │
│   betAmount: 10                     │
│ }                                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend: Validate request          │
│  - Check users exist                │
│  - Check wallet balances            │
│  - Lock bet amounts                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend → VM Server:                │
│ POST /request-slot                  │
│ {                                   │
│   roomId: "abc123",                 │
│   projectId: "123",                 │
│   players: ["user1", "user2"]       │
│ }                                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server: Check capacity           │
│ if (games < 200) → Start VM         │
│ else → Add to queue                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server Response:                 │
│ {                                   │
│   status: "ready" | "queued",       │
│   wsUrl: "wss://vm.../abc123",      │
│   queuePosition: 5 // if queued     │
│ }                                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend: Store room info            │
│ {                                   │
│   roomId: "abc123",                 │
│   vmServerUrl: "wss://...",         │
│   status: "ready",                  │
│   players: [...]                    │
│ }                                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend Response to Frontend:       │
│ {                                   │
│   roomId: "abc123",                 │
│   wsUrl: "wss://vm.../abc123",      │
│   status: "ready"                   │
│ }                                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Frontend: Connect to WebSocket      │
│ ws = new WebSocket(wsUrl)           │
│ ws.send({ type: "join", userId })   │
└─────────────────────────────────────┘
```

### Flow 2: Gameplay

```
┌─────────────┐
│ Player      │
│ presses key │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────┐
│ Frontend: Capture input             │
│ document.addEventListener('keydown')│
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Frontend → VM Server:               │
│ ws.send({                           │
│   type: "input",                    │
│   userId: "user1",                  │
│   action: "keydown",                │
│   key: "space",                     │
│   timestamp: Date.now()             │
│ })                                  │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server: Route to correct VM      │
│ const vm = gameManager.getVM(roomId)│
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server: Inject input             │
│ vm.runtime.ioDevices.keyboard       │
│   .postData({                       │
│     key: "space",                   │
│     isDown: true                    │
│   })                                │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Scratch VM: Execute frame           │
│  - Process input                    │
│  - Update sprite positions          │
│  - Check win conditions             │
│  - Update variables                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server: Extract state            │
│ state = {                           │
│   sprites: { ... },                 │
│   variables: { ... },               │
│   timestamp: ...                    │
│ }                                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server → All Players:            │
│ broadcast(roomId, state)            │
│ (Send to all WebSocket connections) │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Frontend: Receive state             │
│ ws.onmessage = (msg) => {           │
│   renderState(msg.data)             │
│ }                                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Frontend: Update display            │
│  - Move sprites to positions        │
│  - Update UI elements               │
│  - Show scores/timers               │
└─────────────────────────────────────┘
```

### Flow 3: Game End & Winner Determination

```
┌─────────────┐
│ Player wins │
│ in game     │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────┐
│ Scratch Game Code:                  │
│ if (position > 100) then            │
│   report winner (my user id)        │
│   end game                          │
│ end                                 │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Scratch VM Extension:               │
│ this.runtime.emit('REPORT_WINNER', │
│   { userId: "user1" })              │
│ this.runtime.emit('GAME_ENDED')    │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server: Listen for events        │
│ vm.runtime.on('REPORT_WINNER', ...) │
│ vm.runtime.on('GAME_ENDED', ...)    │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server: Finalize game            │
│  - Record winner                    │
│  - Stop accepting inputs            │
│  - Prepare result data              │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server → Backend:                │
│ POST /api/game/report-result        │
│ {                                   │
│   roomId: "abc123",                 │
│   winnerUserId: "user1",            │
│   source: "vm_server",              │
│   gameData: { ... },                │
│   signature: "..." // Auth          │
│ }                                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend: Validate result            │
│  - Verify VM server signature       │
│  - Check room exists                │
│  - Verify not already finalized     │
│  - Validate winner is player        │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend: Get wallet address         │
│ winner = await User.findById(...)   │
│ walletAddress = winner.wallet       │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend: Call smart contract        │
│ const tx = await gameEscrow         │
│   .reportGameResult(                │
│     roomId,                         │
│     winnerWallet                    │
│   )                                 │
│ await tx.wait()                     │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend: Update database            │
│ UPDATE rooms SET                    │
│   winner_id = "user1",              │
│   finalized = true,                 │
│   tx_hash = "0xabc..."              │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend → VM Server:                │
│ Response: {                         │
│   success: true,                    │
│   txHash: "0xabc..."                │
│ }                                   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server: Cleanup                  │
│  - Destroy VM instance              │
│  - Close WebSockets                 │
│  - Free memory                      │
│  - Process queue (start next game)  │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ VM Server → All Players:            │
│ ws.send({                           │
│   type: "game_ended",               │
│   winner: "user1",                  │
│   txHash: "0xabc..."                │
│ })                                  │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Frontend: Show results              │
│  - Display winner                   │
│  - Show transaction link            │
│  - Redirect to results page         │
└─────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: VM Server Core (Week 1 - Days 1-3)

**Goal:** Basic VM server that can start/stop Scratch VMs

**Tasks:**

**Day 1: Project Setup**
- [ ] Create `packages/vm-server/` directory
- [ ] Initialize npm project: `npm init`
- [ ] Install dependencies:
  ```bash
  npm install scratch-vm ws express dotenv winston
  npm install --save-dev nodemon jest
  ```
- [ ] Create file structure (all files listed above)
- [ ] Setup `.env.example` with configuration
- [ ] Create basic `index.js` entry point
- [ ] Setup logger with winston

**Day 2: GameInstanceManager**
- [ ] Implement `GameInstanceManager` class
  - [ ] `startGame(roomId, projectJson)` - Create VM instance
  - [ ] `endGame(roomId)` - Destroy VM instance
  - [ ] `getVM(roomId)` - Retrieve VM by room
  - [ ] `canStartGame()` - Check capacity
  - [ ] Track running games in Map
- [ ] Implement `VMInstance` wrapper class
  - [ ] Load Scratch project into VM
  - [ ] Setup VM runtime
  - [ ] Event listeners for REPORT_WINNER, GAME_ENDED
  - [ ] Cleanup method
- [ ] Write unit tests for GameInstanceManager
- [ ] Test: Start 5 VMs, verify memory usage

**Day 3: Queue Management**
- [ ] Implement `QueueManager` class
  - [ ] `add(roomId)` - Add to queue
  - [ ] `remove(roomId)` - Remove from queue
  - [ ] `getPosition(roomId)` - Get queue position
  - [ ] `processNext()` - Start next queued game
- [ ] Integrate queue with GameInstanceManager
- [ ] Add capacity checks (max 200 games)
- [ ] Write unit tests for queue logic
- [ ] Test: Fill capacity, verify queueing works

**Deliverable:** VM server can start/stop VMs, handle queue

---

### Phase 2: REST API (Week 1 - Days 4-5)

**Goal:** HTTP API for backend to request VM slots

**Tasks:**

**Day 4: REST API Implementation**
- [ ] Create `rest-api.js` with Express
- [ ] Implement endpoints:
  - [ ] `POST /request-slot`
    - Parse request (roomId, projectId, players)
    - Load project JSON from storage/backend
    - Check capacity with GameInstanceManager
    - Start VM or add to queue
    - Return status + WebSocket URL
  - [ ] `GET /status`
    - Return server health metrics
    - Active games count
    - Queue length
    - Memory usage
    - CPU usage
  - [ ] `POST /end-game/:roomId`
    - Admin endpoint to force end game
    - Requires auth token
    - Cleanup VM
- [ ] Add authentication middleware
  - Verify requests from backend (shared secret token)
- [ ] Add request validation
  - Validate roomId format
  - Validate projectId exists
  - Validate players array
- [ ] Error handling and logging

**Day 5: Integration Testing**
- [ ] Test POST /request-slot with real Scratch project
- [ ] Test capacity limits (try to start 201st game)
- [ ] Test queue flow (fill capacity, verify queueing)
- [ ] Test GET /status returns correct metrics
- [ ] Test POST /end-game cleans up properly
- [ ] Load test: 50 concurrent requests
- [ ] Document API with examples

**Deliverable:** REST API working, tested, documented

---

### Phase 3: WebSocket Server (Week 2 - Days 1-3)

**Goal:** Real-time communication for game I/O

**Tasks:**

**Day 1: WebSocket Setup**
- [ ] Create `websocket-server.js`
- [ ] Initialize WebSocket server (ws library)
- [ ] Parse connection URL: `?roomId=X&userId=Y`
- [ ] Maintain room-based connection groups
  - Map<roomId, Set<WebSocket>>
- [ ] Handle connection lifecycle
  - `connection` - Add to room
  - `close` - Remove from room
  - `error` - Log and cleanup
- [ ] Basic message handling skeleton
- [ ] Test: Connect 4 clients to same room

**Day 2: Input Injection**
- [ ] Create `InputInjector` class
- [ ] Handle input messages from players:
  ```json
  {
    "type": "input",
    "action": "keydown",
    "key": "space"
  }
  ```
- [ ] Route inputs to correct VM instance
- [ ] Inject into Scratch VM:
  ```javascript
  vm.runtime.ioDevices.keyboard.postData({
    key: "space",
    isDown: true
  })
  ```
- [ ] Support keyboard inputs (all keys)
- [ ] Support mouse inputs (clicks, movement)
- [ ] Add input validation (prevent spam)
- [ ] Add rate limiting (100 inputs/sec per player)
- [ ] Test: Send keyboard input, verify VM receives it

**Day 3: State Broadcasting**
- [ ] Create `StateSerializer` class
- [ ] Extract state from Scratch VM:
  - Sprite positions (x, y)
  - Sprite costumes
  - Sprite visibility
  - Variables (scores, timers, etc.)
  - Stage backdrop
- [ ] Serialize to JSON efficiently
- [ ] Implement delta encoding (only send changes)
- [ ] Setup broadcast loop (20 FPS / every 50ms)
- [ ] Broadcast state to all players in room:
  ```javascript
  roomConnections.get(roomId).forEach(ws => {
    ws.send(JSON.stringify(state))
  })
  ```
- [ ] Optimize: Only broadcast if state changed
- [ ] Test: Verify all players receive state
- [ ] Measure: State size, bandwidth usage

**Deliverable:** WebSocket server handling I/O, broadcasting state

---

### Phase 4: Scratch VM Integration (Week 2 - Days 4-5)

**Goal:** VM emits events for winner/end game

**Tasks:**

**Day 4: Event Emission**
- [ ] Modify `scratch3_blockchain/index.js`
- [ ] Update `reportWinner()`:
  ```javascript
  reportWinner(args) {
    const userId = args.USERID;

    // Emit event for VM server
    this.runtime.emit('REPORT_WINNER', {
      userId: userId,
      roomId: this._roomContext.roomId,
      timestamp: Date.now()
    });

    // Keep cloud variable fallback
    this._setCloudVariable(`room_${roomId}_winner`, userId);
  }
  ```
- [ ] Update `endGame()`:
  ```javascript
  endGame() {
    this.runtime.emit('GAME_ENDED', {
      roomId: this._roomContext.roomId,
      timestamp: Date.now()
    });

    // Keep cloud variable fallback
    this._setCloudVariable(`room_${roomId}_ended`, 'true');
  }
  ```
- [ ] Test: Load extension, verify events emit

**Day 5: VM Server Event Handling**
- [ ] In `VMInstance`, listen for events:
  ```javascript
  vm.runtime.on('REPORT_WINNER', (data) => {
    this.winner = data.userId;
    this.emit('winner_reported', data);
  });

  vm.runtime.on('GAME_ENDED', (data) => {
    this.ended = true;
    this.emit('game_ended', data);
  });
  ```
- [ ] In `GameInstanceManager`, handle events:
  ```javascript
  vmInstance.on('game_ended', async (data) => {
    await this.finalizeGame(roomId);
  });
  ```
- [ ] Implement `finalizeGame()`:
  - Check both winner + ended are set
  - Call backend API
  - Cleanup VM
  - Process queue
- [ ] Test: Full flow from Scratch block to finalization

**Deliverable:** Scratch VM emits events, VM server handles them

---

### Phase 5: Backend Integration (Week 3 - Days 1-3)

**Goal:** Backend communicates with VM server

**Tasks:**

**Day 1: VM Server Client**
- [ ] Create `vm-server-client.js` in backend
- [ ] Implement methods:
  ```javascript
  class VMServerClient {
    async requestSlot(roomId, projectId, players)
    async endGame(roomId)
    async getStatus()
  }
  ```
- [ ] Use `node-fetch` or `axios`
- [ ] Add error handling (VM server down, timeout)
- [ ] Add retry logic (3 attempts)
- [ ] Configuration from env vars:
  ```
  VM_SERVER_URL=http://localhost:3001
  VM_SERVER_TOKEN=secret_token_here
  ```

**Day 2: Room Creation Endpoint**
- [ ] Create/update `POST /api/game/create-room`
- [ ] Flow:
  1. Validate request (auth, players, bet amounts)
  2. Lock bet amounts in database
  3. Request VM slot from VM server
  4. If queued, store queue position
  5. Create room record in database
  6. Return room info + WebSocket URL
- [ ] Handle errors:
  - VM server unavailable → Return error, refund bets
  - Queue full → Return "try again later"
  - Invalid project → Return validation error
- [ ] Add database fields:
  ```sql
  ALTER TABLE game_rooms ADD COLUMN vm_server_url TEXT;
  ALTER TABLE game_rooms ADD COLUMN vm_slot_status VARCHAR(20);
  ALTER TABLE game_rooms ADD COLUMN queue_position INTEGER;
  ```

**Day 3: Result Reporting Endpoint**
- [ ] Update `POST /api/game/report-result`
- [ ] Add VM server authentication:
  ```javascript
  function authenticateVMServer(req, res, next) {
    const token = req.headers['x-vm-server-token'];
    if (token !== process.env.VM_SERVER_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }
  ```
- [ ] Enhanced validation:
  - Verify room exists
  - Verify not already finalized
  - Verify winner is player in room
  - Verify request from VM server (not spoofed)
- [ ] Call smart contract (existing logic)
- [ ] Update database with result
- [ ] Return transaction hash to VM server
- [ ] Test: Full flow from VM server → Backend → Blockchain

**Deliverable:** Backend fully integrated with VM server

---

### Phase 6: Frontend Updates (Week 3 - Days 4-5 + Week 4 - Days 1-2)

**Goal:** Frontend connects to VM server for gameplay

**Tasks:**

**Day 4-5: WebSocket Client**
- [ ] Create `vm-server-client.js` in scratch-gui
- [ ] WebSocket connection:
  ```javascript
  class VMServerClient {
    connect(wsUrl, roomId, userId) {
      this.ws = new WebSocket(`${wsUrl}?roomId=${roomId}&userId=${userId}`);

      this.ws.onopen = () => {
        console.log('Connected to VM server');
        this.send({ type: 'join', userId });
      };

      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        this.handleStateUpdate(data);
      };
    }

    sendInput(action, key) {
      this.send({
        type: 'input',
        action: action,
        key: key,
        timestamp: Date.now()
      });
    }
  }
  ```
- [ ] Input capture:
  ```javascript
  document.addEventListener('keydown', (e) => {
    vmClient.sendInput('keydown', e.key);
  });

  document.addEventListener('keyup', (e) => {
    vmClient.sendInput('keyup', e.key);
  });
  ```
- [ ] Test: Capture inputs, send to VM server

**Day 1-2 (Week 4): State Rendering**
- [ ] Receive state updates from VM server
- [ ] Option A: Update local Scratch VM to match server state
  ```javascript
  handleStateUpdate(state) {
    // Update sprite positions
    vm.runtime.targets.forEach((target, index) => {
      if (state.sprites[index]) {
        target.setXY(state.sprites[index].x, state.sprites[index].y);
        target.setCostume(state.sprites[index].costume);
      }
    });

    // Update variables
    Object.keys(state.variables).forEach(name => {
      vm.runtime.getTargetForStage().variables[name] = state.variables[name];
    });
  }
  ```
- [ ] Option B: Custom renderer (more complex, better performance)
- [ ] Implement Option A for MVP
- [ ] Add interpolation for smooth rendering
- [ ] Test: Verify sprites move as expected

**Deliverable:** Frontend sends inputs, renders server state

---

### Phase 7: UI/UX Updates (Week 4 - Days 3-4)

**Goal:** Improve user experience for server-side games

**Tasks:**

**Day 3: Queue UI**
- [ ] Create `<QueueStatus />` component
- [ ] Display when room is queued:
  ```jsx
  <div className="queue-status">
    <h3>Game Starting Soon...</h3>
    <p>Position in queue: {queuePosition}</p>
    <LoadingSpinner />
  </div>
  ```
- [ ] Poll for queue updates every 5 seconds
- [ ] Auto-connect when status changes to "ready"
- [ ] Show estimated wait time

**Day 4: Connection Status**
- [ ] Create `<ConnectionStatus />` component
- [ ] Show WebSocket connection state:
  - Connecting...
  - Connected ✓
  - Disconnected (reconnecting...)
- [ ] Add reconnection logic (exponential backoff)
- [ ] Show player count in room
- [ ] Show latency (ping time)

**Deliverable:** Better UX with queue/connection feedback

---

### Phase 8: Testing & Optimization (Week 4 - Day 5 + Week 5)

**Goal:** Thorough testing, performance optimization

**Tasks:**

**Day 5: Unit Tests**
- [ ] VM Server tests:
  - GameInstanceManager start/stop
  - Queue add/remove/process
  - Input injection
  - State serialization
  - WebSocket message handling
- [ ] Backend tests:
  - VM server client
  - Room creation
  - Result reporting
- [ ] Target: 80%+ code coverage

**Week 5 Day 1: Integration Tests**
- [ ] End-to-end test: Create room → Play game → Win → Prize distributed
- [ ] Test with 2 players
- [ ] Test with 4 players
- [ ] Test queue (start 201 games)
- [ ] Test concurrent games (50 at once)
- [ ] Test cleanup (verify VMs destroyed)

**Week 5 Day 2: Load Testing**
- [ ] Use `artillery` or `k6` for load tests
- [ ] Test scenarios:
  - 50 concurrent games
  - 200 concurrent games (max capacity)
  - 1000 queue entries
  - 10,000 inputs per second
- [ ] Identify bottlenecks
- [ ] Optimize as needed

**Week 5 Day 3: Performance Optimization**
- [ ] Profile state serialization (use Chrome DevTools)
- [ ] Implement delta encoding (only send changes)
- [ ] Consider binary format (MessagePack, Protocol Buffers)
- [ ] Optimize broadcast (batch multiple updates)
- [ ] Add compression (gzip on WebSocket)
- [ ] Target: <5KB per state update

**Week 5 Day 4: Security Testing**
- [ ] Verify client can't inject false winner
- [ ] Test modified client (verify doesn't affect server)
- [ ] Test input spam (verify rate limiting works)
- [ ] Test authentication (VM server ↔ Backend)
- [ ] Penetration testing (if resources available)

**Week 5 Day 5: Monitoring Setup**
- [ ] Add Prometheus metrics:
  - Active games gauge
  - Queue length gauge
  - State broadcast rate
  - Input rate per game
  - Memory usage
  - CPU usage
- [ ] Setup Grafana dashboards
- [ ] Configure alerts:
  - Memory > 90%
  - Queue > 100
  - Error rate > 5%
  - VM server down

**Deliverable:** Production-ready system with monitoring

---

## Configuration

### VM Server Environment Variables

```bash
# .env file for packages/vm-server/

# Server
PORT=3001
NODE_ENV=development

# Capacity
MAX_CONCURRENT_GAMES=200
MAX_QUEUE_SIZE=1000

# Performance
STATE_BROADCAST_FPS=20
INPUT_RATE_LIMIT=100

# Backend Integration
BACKEND_URL=http://localhost:3000
BACKEND_API_TOKEN=backend_secret_token_here

# Authentication
VM_SERVER_TOKEN=vm_server_secret_token_here

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/vm-server.log

# Storage (for loading projects)
PROJECT_STORAGE_PATH=./projects
# Or use backend API:
PROJECT_API_URL=http://localhost:3000/api/projects
```

### Backend Environment Variables

```bash
# Add to backend .env

# VM Server
VM_SERVER_URL=http://localhost:3001
VM_SERVER_TOKEN=vm_server_secret_token_here
VM_SERVER_WS_URL=ws://localhost:3001

# Timeouts
VM_REQUEST_TIMEOUT=10000
```

### Frontend Environment Variables

```bash
# Add to scratch-gui .env

# VM Server (WebSocket)
REACT_APP_VM_SERVER_WS_URL=ws://localhost:3001
```

---

## Testing Strategy

### Unit Tests

**VM Server:**
- GameInstanceManager
  - Start game creates VM
  - End game destroys VM
  - Get VM returns correct instance
  - Capacity check works
- QueueManager
  - Add to queue increments position
  - Remove from queue updates positions
  - Process next starts game
- StateSerializer
  - Extracts sprite data correctly
  - Extracts variables correctly
  - Delta encoding reduces size
- InputInjector
  - Keyboard events injected
  - Mouse events injected
  - Rate limiting prevents spam

**Backend:**
- VM Server Client
  - Request slot succeeds
  - Handles VM server down gracefully
  - Retry logic works

### Integration Tests

**Full Game Flow:**
1. Backend creates room
2. VM server starts VM
3. Players connect via WebSocket
4. Players send inputs
5. VM processes inputs
6. State broadcast to players
7. Game ends (winner reported)
8. VM server calls backend
9. Backend calls smart contract
10. Prize distributed
11. VM cleaned up
12. Queue processed

**Queue Flow:**
1. Fill capacity (200 games)
2. Request 201st game
3. Verify queued
4. End one game
5. Verify queued game starts

### Load Tests

**Scenario 1: Steady Load**
- 50 games running
- 4 players each
- 5 minute duration
- Verify: <100ms latency, no memory leaks

**Scenario 2: Peak Load**
- 200 games running (max capacity)
- 4 players each
- Verify: Server stable, queue works

**Scenario 3: Burst Load**
- 500 room requests in 1 minute
- Verify: Queue handles it, no crashes

**Scenario 4: Input Flood**
- 1 game, 100 inputs/sec per player
- Verify: Rate limiting works, server stable

---

## Deployment

### Development

```bash
# Terminal 1: Backend
cd packages/backend
npm run dev

# Terminal 2: VM Server
cd packages/vm-server
npm run dev

# Terminal 3: Scratch GUI
cd packages/scratch-gui
npm start
```

### Production (Hetzner Server)

**Setup:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone repository
git clone https://github.com/your-repo.git
cd degu.games

# Install dependencies
npm install
cd packages/vm-server && npm install
cd ../backend && npm install
cd ../scratch-gui && npm install && npm run build
```

**Run:**
```bash
# Start VM Server with PM2
cd packages/vm-server
pm2 start src/index.js --name vm-server

# Start Backend
cd ../backend
pm2 start server.js --name backend

# Setup nginx for scratch-gui
sudo cp scratch-gui/build /var/www/html/

# Auto-restart on reboot
pm2 startup
pm2 save
```

**Monitoring:**
```bash
# View logs
pm2 logs vm-server
pm2 logs backend

# View metrics
pm2 monit

# Restart
pm2 restart vm-server
```

---

## Success Criteria

### Functionality
- ✅ Games start within 3 seconds
- ✅ Queue works when capacity reached
- ✅ Inputs processed within 50ms
- ✅ State broadcast at 20 FPS
- ✅ Winner determination works correctly
- ✅ Prize distribution succeeds
- ✅ Cleanup frees memory

### Performance
- ✅ <80ms average latency (input → render)
- ✅ <5KB state size per update
- ✅ 200 concurrent games on 32GB server
- ✅ <1% error rate
- ✅ 99% uptime

### Security
- ✅ Client can't inject false winner
- ✅ Modified client doesn't affect server state
- ✅ VM server ↔ Backend auth works
- ✅ Input spam prevented (rate limiting)
- ✅ No memory leaks (24-hour stability test)

---

## Risk Mitigation

### Risk 1: Scratch VM Compatibility

**Risk:** Scratch VM might not work well server-side

**Mitigation:**
- Test with simple project first
- Verify all blocks work
- Test with complex project
- Identify incompatible features early

### Risk 2: Performance Issues

**Risk:** State broadcasting uses too much bandwidth

**Mitigation:**
- Implement delta encoding
- Use binary format if needed
- Compress WebSocket messages
- Reduce FPS if necessary (20 → 15)

### Risk 3: VM Server Instability

**Risk:** VMs crash, memory leaks

**Mitigation:**
- Comprehensive testing
- Memory profiling
- Auto-restart on crash (PM2)
- Health checks
- Graceful degradation

### Risk 4: Integration Complexity

**Risk:** Components don't integrate smoothly

**Mitigation:**
- Clear interface contracts
- Integration tests early
- Incremental integration
- Rollback plan

---

## Next Steps After MVP

### Phase 2 Features

1. **Multiple Winners**
   - Modify finalization to handle array of winners
   - Update smart contract integration
   - Split prizes

2. **Spectator Mode**
   - Allow non-players to watch
   - Read-only WebSocket connections
   - No input, just state broadcast

3. **Replay System**
   - Record all inputs
   - Store replay data
   - Playback system

4. **Geographic Distribution**
   - Multiple VM servers (US, EU, Asia)
   - Route players to nearest server
   - Reduce latency

5. **Advanced Monitoring**
   - Real-time dashboards
   - Player analytics
   - Game analytics

---

## Summary

This implementation plan provides:

✅ **Clear phases** - 8 phases over 3-4 weeks
✅ **Dependencies mapped** - Know what blocks what
✅ **Integration points** - All connections documented
✅ **Data flows** - Complete request/response flows
✅ **Testing strategy** - Unit, integration, load tests
✅ **Deployment guide** - Development and production
✅ **Risk mitigation** - Known risks with solutions
✅ **Success criteria** - Clear goals

**Ready to begin implementation!**

---

*Document Version: 1.0*
*Last Updated: 2025-10-29*
*Estimated Completion: Week of 2025-11-19*
