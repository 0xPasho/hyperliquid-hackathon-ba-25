# Simple Winner Reporting System - Implementation Plan

## Executive Summary

A simple, secure system to report game winners using cloud variables as the source of truth. The cloud server watches for two conditions and calls the backend API **only once** when both are met.

## Core Requirements

✅ **Report Winner Block** - Sets cloud variable with winner user ID
✅ **End Game Block** - Sets cloud variable indicating game ended
✅ **Cloud Server Watches** - Detects when BOTH conditions are met
✅ **Single API Call** - Backend endpoint called ONLY ONCE by cloud server
✅ **Source of Truth** - Cloud server is authoritative, not client-side
✅ **Single Winner** - One winner per game (for now)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Player Wins                                        │
│  ────────────────────────────────────────────────────────   │
│  Player calls: report winner [user_123]                     │
│  ↓                                                           │
│  Scratch Extension → Sets cloud variable:                   │
│  room_abc123_winner = "user_123"                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Game Ends                                          │
│  ────────────────────────────────────────────────────────   │
│  Player calls: end game                                     │
│  ↓                                                           │
│  Scratch Extension → Sets cloud variable:                   │
│  room_abc123_ended = "true"                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Cloud Server Detects Both Conditions              │
│  ────────────────────────────────────────────────────────   │
│  Cloud Server watches variables                             │
│  ↓                                                           │
│  Checks: winner SET? ✅  AND  ended SET? ✅                 │
│  ↓                                                           │
│  Both conditions met → Proceed to finalize                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Call Backend API (ONCE)                           │
│  ────────────────────────────────────────────────────────   │
│  Cloud Server → POST /api/game/report-result                │
│  {                                                           │
│    roomId: "abc123",                                        │
│    winnerUserId: "user_123",                                │
│    source: "cloud_server"                                   │
│  }                                                           │
│  ↓                                                           │
│  Set finalized flag → Prevent duplicate calls               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Backend Processes Result                          │
│  ────────────────────────────────────────────────────────   │
│  Backend validates request from cloud server                │
│  ↓                                                           │
│  Map user_123 → wallet address                             │
│  ↓                                                           │
│  Call smart contract: distributeWinnings(gameId, winner)    │
│  ↓                                                           │
│  Return transaction hash                                    │
└─────────────────────────────────────────────────────────────┘
```

## What Already Exists

Based on our previous implementation:

✅ **Scratch Extension** - `packages/scratch-vm/src/extensions/scratch3_blockchain/index.js`
  - Already has `reportWinner()` block
  - Already has `endGame()` block
  - Already sets cloud variables
  - Already has WebSocket connection to cloud server

✅ **Cloud Server** - `packages/cloud-server/src/`
  - Already has `betting-handler.js` watching cloud variables
  - Already detects when both conditions are met
  - Already calls backend API once
  - Already prevents duplicate calls with `finalized` flag

✅ **Documentation** - `CLOUD_VARIABLES_IMPLEMENTATION.md`
  - Complete documentation exists

## What Needs to Be Done

### 1. Backend API Endpoint

**Status**: ❌ NOT IMPLEMENTED

**File**: `packages/backend/src/routes/game.js` (or similar)

**Endpoint**: `POST /api/game/report-result`

**Purpose**: Receive winner report from cloud server and distribute prizes

**Request Body**:
```json
{
  "roomId": "string",
  "winnerUserId": "string",
  "source": "cloud_server",
  "metadata": {
    "setBy": {
      "winner": "user_123",
      "ended": "user_456"
    },
    "finalizedAt": 1234567890,
    "playerCount": 4
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionHash": "0xabc...",
    "winner": {
      "userId": "user_123",
      "walletAddress": "0xdef..."
    },
    "prizeAmount": "1000000000000000000"
  }
}
```

**Implementation Steps**:

1. **Authenticate Cloud Server**
```javascript
// Middleware to verify request is from cloud server
function authenticateCloudServer(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token !== process.env.CLOUD_SERVER_TOKEN) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - Invalid cloud server token'
        });
    }

    next();
}
```

2. **Validate Request**
```javascript
// Validate room exists and is active
const room = await db.query(
    'SELECT * FROM game_rooms WHERE id = $1',
    [roomId]
);

if (!room) {
    return res.status(404).json({
        success: false,
        error: 'Room not found'
    });
}

// Check if already finalized
if (room.result_finalized) {
    return res.status(400).json({
        success: false,
        error: 'Game already finalized'
    });
}

// Verify winner is a player in the room
const isPlayer = await db.query(
    'SELECT 1 FROM room_players WHERE room_id = $1 AND user_id = $2',
    [roomId, winnerUserId]
);

if (!isPlayer) {
    return res.status(400).json({
        success: false,
        error: 'Winner is not a player in this room'
    });
}
```

3. **Get Winner Wallet Address**
```javascript
// Map user ID to wallet address
const winner = await db.query(
    'SELECT id, wallet_address FROM users WHERE id = $1',
    [winnerUserId]
);

if (!winner || !winner.wallet_address) {
    return res.status(400).json({
        success: false,
        error: 'Winner has no wallet address'
    });
}
```

4. **Call Smart Contract**
```javascript
// Initialize contract
const gameEscrow = new ethers.Contract(
    process.env.GAME_ESCROW_ADDRESS,
    GameEscrowABI,
    wallet // Server wallet
);

// Report game result
const tx = await gameEscrow.reportGameResult(
    room.game_id, // On-chain game ID
    winner.wallet_address
);

// Wait for confirmation
const receipt = await tx.wait();
```

5. **Update Database**
```javascript
// Mark game as finalized
await db.query(
    `UPDATE game_rooms
     SET result_finalized = true,
         winner_user_id = $1,
         finalized_at = NOW(),
         transaction_hash = $2
     WHERE id = $3`,
    [winnerUserId, receipt.transactionHash, roomId]
);

// Store result record
await db.query(
    `INSERT INTO game_results (
        room_id,
        winner_user_id,
        source,
        metadata,
        transaction_hash,
        created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())`,
    [
        roomId,
        winnerUserId,
        source,
        JSON.stringify(metadata),
        receipt.transactionHash
    ]
);
```

6. **Return Response**
```javascript
return res.json({
    success: true,
    data: {
        transactionHash: receipt.transactionHash,
        winner: {
            userId: winnerUserId,
            walletAddress: winner.wallet_address
        },
        prizeAmount: room.prize_pool
    }
});
```

### 2. Database Schema

**Status**: ❌ NEEDS UPDATING

**Required Columns**:

```sql
-- Add to game_rooms table
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS result_finalized BOOLEAN DEFAULT false;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS winner_user_id UUID REFERENCES users(id);
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66);

-- Create game_results table if not exists
CREATE TABLE IF NOT EXISTS game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES game_rooms(id) NOT NULL,
    winner_user_id UUID REFERENCES users(id) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'cloud_server' or 'direct'
    metadata JSONB,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_results_room ON game_results(room_id);
CREATE INDEX IF NOT EXISTS idx_game_results_winner ON game_results(winner_user_id);
```

### 3. Environment Configuration

**Cloud Server** - `packages/cloud-server/.env`:
```bash
# Already configured
API_URL=http://localhost:3000/api
CLOUD_SERVER_TOKEN=your_secure_token_here
PORT=8080
```

**Backend** - `packages/backend/.env` (or similar):
```bash
# Add these
CLOUD_SERVER_TOKEN=your_secure_token_here  # Must match cloud server
GAME_ESCROW_ADDRESS=0x...  # Smart contract address
BLOCKCHAIN_RPC_URL=https://...  # Blockchain RPC endpoint
SERVER_PRIVATE_KEY=0x...  # Server wallet private key (to sign transactions)
```

### 4. Testing & Verification

**Test Cases**:

1. **Happy Path**
   - Player wins → Reports winner
   - Player calls end game
   - Cloud server calls API
   - Smart contract distributes prize
   - Database updated
   - ✅ Success response

2. **Idempotency**
   - Player wins → Reports winner
   - Player calls end game
   - Cloud server calls API ✅
   - Player tries to call end game again
   - Cloud server ignores (already finalized)
   - ❌ No duplicate API call

3. **Order Independence**
   - Player calls end game FIRST
   - Player reports winner SECOND
   - Cloud server still finalizes correctly
   - ✅ Success

4. **Invalid Winner**
   - Player reports winner: user_999 (not in room)
   - Player calls end game
   - Cloud server calls API
   - Backend validates → Rejects
   - ❌ Error: Winner not in room

5. **Cloud Server Down**
   - Player reports winner
   - Player calls end game
   - Cloud server is offline
   - Extension falls back to direct API call (if implemented)
   - ✅ Success (fallback)

## Implementation Checklist

### Backend (Priority 1)
- [ ] Create database migration for game result columns
- [ ] Create `game_results` table
- [ ] Implement `authenticateCloudServer` middleware
- [ ] Implement `POST /api/game/report-result` endpoint
  - [ ] Validate cloud server token
  - [ ] Validate room exists and is active
  - [ ] Check not already finalized
  - [ ] Verify winner is player in room
  - [ ] Get winner wallet address
  - [ ] Call smart contract
  - [ ] Update database
  - [ ] Return transaction hash
- [ ] Add error handling and logging
- [ ] Add environment variables

### Cloud Server (Already Done ✅)
- ✅ Betting handler watches cloud variables
- ✅ Detects both conditions (winner + ended)
- ✅ Calls backend API once
- ✅ Prevents duplicate calls
- ✅ Error handling and retry logic

### Scratch Extension (Already Done ✅)
- ✅ `reportWinner()` block sets cloud variable
- ✅ `endGame()` block sets cloud variable
- ✅ WebSocket connection to cloud server
- ✅ Fallback to direct API (optional)

### Testing
- [ ] Unit tests for backend endpoint
- [ ] Integration test: Full flow (Scratch → Cloud → Backend → Smart Contract)
- [ ] Test duplicate call prevention
- [ ] Test invalid winner rejection
- [ ] Test cloud server authentication

### Documentation
- [ ] API endpoint documentation
- [ ] Environment setup guide
- [ ] Deployment guide
- [ ] Troubleshooting guide

## API Specification

### POST /api/game/report-result

**Authentication**: Required (Cloud Server Token)

**Headers**:
```
Authorization: Bearer {CLOUD_SERVER_TOKEN}
Content-Type: application/json
X-Cloud-Server: true
```

**Request Body**:
```typescript
{
  roomId: string;           // Game room ID
  winnerUserId: string;     // Winner's user ID
  source: "cloud_server";   // Always "cloud_server" from cloud server
  metadata?: {              // Optional metadata
    setBy: {
      winner: string;       // User who set winner
      ended: string;        // User who ended game
    };
    finalizedAt: number;    // Timestamp
    playerCount: number;    // Number of players
  }
}
```

**Success Response** (200):
```typescript
{
  success: true;
  data: {
    transactionHash: string;    // Blockchain transaction hash
    winner: {
      userId: string;
      walletAddress: string;
    };
    prizeAmount: string;        // Wei amount
  }
}
```

**Error Responses**:

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized - Invalid cloud server token"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Room not found"
}
```

**400 Bad Request**:
```json
{
  "success": false,
  "error": "Game already finalized"
}
```

**400 Bad Request**:
```json
{
  "success": false,
  "error": "Winner is not a player in this room"
}
```

**400 Bad Request**:
```json
{
  "success": false,
  "error": "Winner has no wallet address"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Smart contract call failed: {reason}"
}
```

## Flow Diagram

```
┌─────────────┐
│   Player    │
└──────┬──────┘
       │ Wins game
       ↓
┌─────────────────────────┐
│ Scratch Extension       │
│ reportWinner(user_123)  │
└──────┬──────────────────┘
       │ WebSocket
       ↓
┌─────────────────────────┐         ┌────────────────┐
│ Cloud Server            │────────→│ State Tracking │
│ Sets: room_X_winner     │         │ winner: ✅     │
└─────────────────────────┘         │ ended:  ❌     │
                                    └────────────────┘
       (Later...)

┌─────────────┐
│   Player    │
└──────┬──────┘
       │ Ends game
       ↓
┌─────────────────────────┐
│ Scratch Extension       │
│ endGame()               │
└──────┬──────────────────┘
       │ WebSocket
       ↓
┌─────────────────────────┐         ┌────────────────┐
│ Cloud Server            │────────→│ State Tracking │
│ Sets: room_X_ended      │         │ winner: ✅     │
└──────┬──────────────────┘         │ ended:  ✅     │
       │                            └────────────────┘
       │ Both conditions met! ✅
       ↓
┌─────────────────────────┐
│ Cloud Server            │
│ checkAndFinalize()      │
│ Set finalized = true    │
└──────┬──────────────────┘
       │ HTTP POST
       ↓
┌─────────────────────────────────────────┐
│ Backend API                             │
│ POST /api/game/report-result            │
│                                         │
│ 1. Authenticate cloud server ✓         │
│ 2. Validate room exists ✓              │
│ 3. Check not already finalized ✓       │
│ 4. Verify winner is player ✓           │
│ 5. Get wallet address ✓                │
│ 6. Call smart contract ✓               │
│ 7. Update database ✓                   │
│ 8. Return transaction hash ✓           │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────┐
│ Smart Contract          │
│ GameEscrow.sol          │
│ distributeWinnings()    │
└──────┬──────────────────┘
       │
       ↓
┌─────────────────────────┐
│ Winner Receives Prize   │
│ 💰 Prize transferred    │
└─────────────────────────┘
```

## Security Guarantees

✅ **No Client-Side Manipulation**
- Winner reporting happens via cloud variables
- Client cannot directly call backend API
- Cloud server is source of truth

✅ **Single Finalization**
- `finalized` flag prevents duplicate calls
- Database constraint ensures one result per game
- Idempotent operations

✅ **Authentication**
- Cloud server authenticates with secret token
- Backend rejects unauthorized calls
- Token must match on both sides

✅ **Validation**
- Backend validates winner is in room
- Backend validates room exists
- Backend validates not already finalized

✅ **Blockchain Verification**
- Smart contract validates on-chain
- Transaction hash provides proof
- Immutable record on blockchain

## Deployment Steps

### 1. Prepare Environment

**Backend**:
```bash
# Set environment variables
export CLOUD_SERVER_TOKEN="your_secure_random_token_here"
export GAME_ESCROW_ADDRESS="0x..."
export BLOCKCHAIN_RPC_URL="https://..."
export SERVER_PRIVATE_KEY="0x..."
```

**Cloud Server**:
```bash
# Already set from previous implementation
export API_URL="https://your-backend.com/api"
export CLOUD_SERVER_TOKEN="your_secure_random_token_here"  # Must match backend
```

### 2. Run Database Migrations

```bash
cd packages/backend
npm run migrate  # Or your migration command
```

### 3. Deploy Backend

```bash
cd packages/backend
npm install
npm run build  # If needed
npm start
```

### 4. Start Cloud Server

```bash
cd packages/cloud-server
npm install
npm start
```

### 5. Deploy Scratch GUI

```bash
cd packages/scratch-gui
npm install
npm run build
# Deploy build/ to your hosting
```

### 6. Verify

```bash
# Test cloud server is running
curl http://localhost:8080

# Test backend endpoint (should reject without token)
curl -X POST http://localhost:3000/api/game/report-result

# Test with valid token
curl -X POST http://localhost:3000/api/game/report-result \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test","winnerUserId":"test_user","source":"cloud_server"}'
```

## Monitoring & Logging

**Cloud Server Logs**:
```
[Betting] Room abc123: Winner set by user_123: user_456
[Betting] Room abc123: Game ended by user_123
[Betting] Room abc123: Both conditions met, finalizing...
[Betting] Room abc123: Calling backend API...
[Betting] Room abc123: ✅ Game finalized successfully
[Betting] Room abc123: Transaction hash: 0xabc...
```

**Backend Logs**:
```
[Game] Received result report for room abc123
[Game] Winner: user_456
[Game] Calling smart contract...
[Game] Transaction sent: 0xabc...
[Game] Waiting for confirmation...
[Game] ✅ Transaction confirmed
[Game] Prize distributed to 0xdef...
```

## Next Steps After Implementation

Once the basic system is working:

1. **Add Multiple Winners Support** (Phase 2)
   - Change `winnerUserId` to `winnerUserIds` (array)
   - Update smart contract to handle multiple winners
   - Add prize split logic

2. **Add Tournament Support** (Phase 3)
   - Add round tracking
   - Add bracket logic
   - Add multi-round finalization

3. **Add State Validation** (Phase 4)
   - Track game state
   - Validate winner is legitimate
   - Add anti-cheat measures

But for now, keep it simple: **one winner, one API call, cloud server is source of truth**.

## Summary

This is a **minimal viable implementation** that provides:

✅ Secure winner reporting via cloud variables
✅ Cloud server as source of truth
✅ Single API call to backend
✅ Duplicate call prevention
✅ Smart contract integration
✅ Complete audit trail

**Total Implementation Time**: 1-2 days for backend endpoint + testing

**What's Already Done**: Scratch extension + Cloud server (from previous session)

**What's Left**: Backend endpoint + database + smart contract integration
