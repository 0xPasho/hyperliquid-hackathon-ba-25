# Betting Blocks - Backend API Integration Guide

## Overview

This document describes the backend API endpoints needed to support the room-based betting blocks in Scratch. The architecture separates concerns:

- **Scratch Games**: Report winners by user IDs only
- **Backend API**: Validates results, maps user IDs to wallet addresses, calls smart contract
- **Smart Contract (GameEscrow.sol)**: Handles money distribution

## Architecture Flow

```
1. Web App → Creates room → Generates room context
2. Backend → Passes room context to Scratch via URL/window object
3. Scratch Game → Reports winners by user IDs → Backend API
4. Backend API → Validates game result → Maps user IDs to wallets
5. Backend API → Calls GameEscrow.sol → Distributes prizes
```

## Room Context Structure

When loading a Scratch game, pass this context via URL parameters or `window.roomContext`:

### URL Parameters Method
```
/play/game?roomId=abc123&entryFee=10&prizePool=72&playerCount=4&myUserId=user_456&players=[...]
```

### Window Object Method
```javascript
window.roomContext = {
    roomId: "abc123",
    entryFee: 10,           // USDC
    prizePool: 72,          // USDC after fees (80-90% of total)
    playerCount: 4,
    players: [
        { userId: "user_123", username: "Alice" },
        { userId: "user_456", username: "Bob" },
        { userId: "user_789", username: "Charlie" },
        { userId: "user_012", username: "Dave" }
    ],
    myUserId: "user_456"    // Current player's user ID
};
```

### Players Array Format
```javascript
[
    {
        userId: "user_123",      // Your internal user ID
        username: "Alice",        // Display name
        walletAddress: "0x..."   // (Optional - can be looked up on backend)
    },
    // ... more players
]
```

## Backend API Endpoints

### 1. Report Game Result

**Endpoint**: `POST /game/report-result`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
    "roomId": "abc123",
    "winnerUserIds": ["user_123", "user_456"]
}
```

For single winner:
```json
{
    "roomId": "abc123",
    "winnerUserIds": ["user_123"]
}
```

For no winners (house wins):
```json
{
    "roomId": "abc123",
    "winnerUserIds": []
}
```

**Response**:
```json
{
    "success": true,
    "message": "Winners reported successfully",
    "data": {
        "roomId": "abc123",
        "winners": [
            {
                "userId": "user_123",
                "username": "Alice",
                "walletAddress": "0x1234...",
                "prizeAmount": 36
            },
            {
                "userId": "user_456",
                "username": "Bob",
                "walletAddress": "0x5678...",
                "prizeAmount": 36
            }
        ],
        "transactionHash": "0xabc...",
        "status": "completed"
    }
}
```

**Backend Logic**:
```javascript
async function reportGameResult(roomId, winnerUserIds) {
    // 1. Validate request
    const room = await getRoomById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'in_progress') throw new Error('Game not in progress');

    // 2. Validate winners are actual players in the room
    const validWinners = winnerUserIds.filter(userId =>
        room.players.some(p => p.userId === userId)
    );

    if (validWinners.length !== winnerUserIds.length) {
        throw new Error('Invalid winner user IDs');
    }

    // 3. Map user IDs to wallet addresses
    const winners = await Promise.all(
        validWinners.map(async userId => {
            const user = await getUserById(userId);
            return {
                userId: user.id,
                username: user.username,
                walletAddress: user.walletAddress
            };
        })
    );

    // 4. Calculate prize distribution
    // GameEscrow.sol handles equal splits automatically
    const prizePerWinner = winners.length > 0
        ? room.prizePool / winners.length
        : 0;

    // 5. Call smart contract
    if (winners.length > 0) {
        const walletAddresses = winners.map(w => w.walletAddress);
        const tx = await gameEscrowContract.reportGameResult(
            room.gameId,
            walletAddresses
        );
        await tx.wait();

        return {
            success: true,
            winners: winners.map(w => ({
                ...w,
                prizeAmount: prizePerWinner
            })),
            transactionHash: tx.hash
        };
    } else {
        // No winners - house wins
        // Contract automatically handles this case
        const tx = await gameEscrowContract.reportGameResult(
            room.gameId,
            [] // Empty array
        );
        await tx.wait();

        return {
            success: true,
            winners: [],
            transactionHash: tx.hash,
            message: 'House wins'
        };
    }
}
```

### 2. End Game Session

**Endpoint**: `POST /game/end-session`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
    "roomId": "abc123"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Game session ended",
    "data": {
        "roomId": "abc123",
        "status": "completed",
        "redirectUrl": "/results/abc123"
    }
}
```

**Backend Logic**:
```javascript
async function endGameSession(roomId) {
    // 1. Get room
    const room = await getRoomById(roomId);
    if (!room) throw new Error('Room not found');

    // 2. Update room status
    await updateRoom(roomId, {
        status: 'completed',
        endedAt: new Date()
    });

    // 3. Generate results page URL
    const redirectUrl = `/results/${roomId}`;

    return {
        success: true,
        status: 'completed',
        redirectUrl
    };
}
```

## Database Schema (Suggested)

### Rooms Table
```sql
CREATE TABLE rooms (
    id VARCHAR(255) PRIMARY KEY,
    game_id INTEGER NOT NULL,
    creator_user_id VARCHAR(255) NOT NULL,
    entry_fee DECIMAL(18, 6) NOT NULL,
    prize_pool DECIMAL(18, 6) NOT NULL,
    player_count INTEGER NOT NULL,
    status ENUM('waiting', 'in_progress', 'completed', 'cancelled') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,

    INDEX idx_status (status),
    INDEX idx_creator (creator_user_id)
);
```

### Room Players Table
```sql
CREATE TABLE room_players (
    room_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    INDEX idx_user (user_id)
);
```

### Game Results Table
```sql
CREATE TABLE game_results (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    winner_user_ids JSON,
    transaction_hash VARCHAR(66),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id) REFERENCES rooms(id),
    INDEX idx_room (room_id)
);
```

## Security Considerations

### 1. Validation
- **Verify requestor is in the room**: Only players in the room should report results
- **Validate game state**: Only allow result reporting for in-progress games
- **Validate winners**: Ensure all winner user IDs are actual players in the room
- **Prevent duplicate reporting**: Only allow one result per game

### 2. Anti-Cheat Measures
```javascript
// Backend validation logic
async function validateGameResult(roomId, winnerUserIds, requestUserId) {
    const room = await getRoomById(roomId);

    // Check requestor is in the room
    const isPlayer = room.players.some(p => p.userId === requestUserId);
    if (!isPlayer) {
        throw new Error('Unauthorized: Not a player in this room');
    }

    // Check game is in progress
    if (room.status !== 'in_progress') {
        throw new Error('Game is not in progress');
    }

    // Check not already reported
    const existingResult = await getGameResult(roomId);
    if (existingResult) {
        throw new Error('Result already reported for this game');
    }

    // Validate all winners are players
    const invalidWinners = winnerUserIds.filter(userId =>
        !room.players.some(p => p.userId === userId)
    );

    if (invalidWinners.length > 0) {
        throw new Error(`Invalid winner IDs: ${invalidWinners.join(', ')}`);
    }

    return true;
}
```

### 3. Rate Limiting
```javascript
// Prevent spam/DoS attacks
const rateLimit = require('express-rate-limit');

const reportResultLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Too many result reports, please try again later'
});

app.post('/game/report-result', reportResultLimiter, reportGameResult);
```

## Error Handling

### Common Errors

1. **Room not found**
```json
{
    "success": false,
    "error": "Room not found",
    "code": "ROOM_NOT_FOUND"
}
```

2. **Invalid winners**
```json
{
    "success": false,
    "error": "Invalid winner user IDs",
    "code": "INVALID_WINNERS",
    "details": {
        "invalidUserIds": ["user_999"]
    }
}
```

3. **Game not in progress**
```json
{
    "success": false,
    "error": "Game is not in progress",
    "code": "INVALID_GAME_STATE",
    "details": {
        "currentStatus": "completed"
    }
}
```

4. **Already reported**
```json
{
    "success": false,
    "error": "Result already reported",
    "code": "DUPLICATE_REPORT",
    "details": {
        "existingResult": {
            "reportedAt": "2025-01-15T10:30:00Z",
            "winners": ["user_123"]
        }
    }
}
```

5. **Blockchain transaction failed**
```json
{
    "success": false,
    "error": "Failed to submit transaction to blockchain",
    "code": "BLOCKCHAIN_ERROR",
    "details": {
        "message": "Insufficient gas"
    }
}
```

## Smart Contract Integration

### GameEscrow.sol Method

```solidity
function reportGameResult(
    uint256 gameId,
    address[] calldata winners
) external onlyRole(ORACLE_ROLE) {
    // Contract handles:
    // 1. Validation (game exists, not already finished)
    // 2. Creator fee calculation (0-10%)
    // 3. Platform fee (10%)
    // 4. Equal prize distribution among winners
    // 5. House wins if winners array is empty
}
```

### Backend Call Example

```javascript
const { ethers } = require('ethers');

// Initialize contract
const gameEscrowContract = new ethers.Contract(
    GAME_ESCROW_ADDRESS,
    GAME_ESCROW_ABI,
    oracleWallet // Backend wallet with ORACLE_ROLE
);

// Report result
async function reportToContract(gameId, winnerWallets) {
    const tx = await gameEscrowContract.reportGameResult(
        gameId,
        winnerWallets, // Array of wallet addresses
        {
            gasLimit: 500000 // Adjust based on number of winners
        }
    );

    const receipt = await tx.wait();
    return receipt.transactionHash;
}
```

## Testing

### Test Scenarios

1. **Single Winner**
```javascript
POST /game/report-result
{
    "roomId": "test_001",
    "winnerUserIds": ["user_123"]
}
// Expected: 1 winner gets full prize pool
```

2. **Multiple Winners (Equal Split)**
```javascript
POST /game/report-result
{
    "roomId": "test_002",
    "winnerUserIds": ["user_123", "user_456", "user_789"]
}
// Expected: 3 winners split prize pool equally
```

3. **No Winners (House Wins)**
```javascript
POST /game/report-result
{
    "roomId": "test_003",
    "winnerUserIds": []
}
// Expected: Prize pool goes to house/platform
```

4. **Invalid Winner**
```javascript
POST /game/report-result
{
    "roomId": "test_004",
    "winnerUserIds": ["user_999"] // Not in room
}
// Expected: 400 error - Invalid winner
```

## Frontend Integration (Web App)

### Creating a Room

```javascript
// 1. User creates room from web app
const createRoom = async (gameId, entryFee, playerCount) => {
    const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            gameId,
            entryFee,
            playerCount
        })
    });

    const { roomId } = await response.json();
    return roomId;
};

// 2. Players join room
const joinRoom = async (roomId) => {
    await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

// 3. Start game - redirect to Scratch with room context
const startGame = async (roomId) => {
    const room = await fetch(`/api/rooms/${roomId}`).then(r => r.json());

    // Pass room context via URL
    const scratchUrl = new URL('https://scratch.degu.games/play');
    scratchUrl.searchParams.set('roomId', room.id);
    scratchUrl.searchParams.set('entryFee', room.entryFee);
    scratchUrl.searchParams.set('prizePool', room.prizePool);
    scratchUrl.searchParams.set('playerCount', room.players.length);
    scratchUrl.searchParams.set('myUserId', currentUser.id);
    scratchUrl.searchParams.set('players', JSON.stringify(room.players));

    window.location.href = scratchUrl.toString();
};
```

## Summary

The betting blocks architecture is clean and secure:

1. **Scratch**: Only reports user IDs (no wallet logic, no blockchain)
2. **Backend**: Validates, maps to wallets, calls contract
3. **Contract**: Handles money distribution securely

This separation ensures:
- ✅ Games remain simple and focused on gameplay
- ✅ Backend can implement sophisticated validation
- ✅ Contract handles financial logic trustlessly
- ✅ No private keys or wallets in Scratch
- ✅ Easy to add new games without blockchain knowledge
