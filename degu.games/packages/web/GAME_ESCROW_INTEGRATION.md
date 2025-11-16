# GameEscrow Integration - Implementation Guide

## Overview

I've successfully integrated the GameEscrow smart contract into the web frontend. This allows players to create paid game rooms with entry fees that are held in escrow until the game completes.

## ✅ What's Been Implemented (Frontend)

### 1. Smart Contract Integration

**Files Created:**
- `/src/lib/game-escrow-api.ts` - API client for GameEscrow contract operations
- `/src/lib/abis/GameEscrow.json` - GameEscrow contract ABI
- `/src/lib/abis/MockERC20.json` - ERC20 token ABI (for USDC)

**Functions Available:**
- `createEscrowGame()` - Create a new escrow game on-chain
- `joinEscrowGame()` - Join an existing escrow game and pay entry fee
- `reportGameResult()` - Report game winners (oracle only)
- `cancelEscrowGame()` - Cancel game and refund players
- `getEscrowGameDetails()` - Fetch game information
- `getPlayerInfo()` - Get player-specific game data
- `approveTokenForEscrow()` - Approve USDC spending
- `checkTokenAllowance()` - Check if approval is needed

### 2. UI Components

**CreateRoomModal** (`/src/components/rooms/CreateRoomModal.tsx`)
- Modal dialog for creating rooms with payment options
- Toggle for paid vs free rooms
- Entry fee configuration (USDC)
- Max players selection
- Game mode selection (Winner Takes All, Free For All, Score Based)
- Shows prize pool calculation
- Handles token approval + escrow game creation
- Loading states with progress messages

**JoinRoomDialog** (`/src/components/rooms/JoinRoomDialog.tsx`)
- Payment confirmation dialog for paid rooms
- Shows entry fee and total prize pool
- Explains escrow protection
- Handles token approval + join escrow game
- Loading states during blockchain transactions

**Updated Components:**
- `RoomLobby.tsx` - Now uses modal dialogs for create/join
- `RoomCard.tsx` - Shows entry fee badge for paid rooms
- `room-api.ts` - Added `escrowGameId`, `entryFee`, `paymentToken` fields to Room type

### 3. Data Model Updates

**Room Interface** now includes:
```typescript
interface Room {
    // ... existing fields
    escrowGameId?: number;      // On-chain escrow game ID
    entryFee?: string;          // Entry fee in USDC
    paymentToken?: string;      // Token address (e.g., USDC)
}
```

### 4. User Flow

**Creating a Paid Room:**
1. User clicks "Create Room"
2. Modal opens with room configuration
3. User enables "Paid Room" toggle
4. Sets entry fee and max players
5. On create:
   - Frontend approves USDC spending
   - Creates escrow game on-chain
   - Gets `gameId` from blockchain
   - Creates room in database with `escrowGameId`

**Joining a Paid Room:**
1. User clicks "Join Room" on a paid room card
2. Join dialog shows entry fee and prize pool
3. On confirm:
   - Frontend approves USDC spending
   - Joins escrow game on-chain (pays entry fee)
   - Joins room in database

**Game Completion:**
- TODO: Implement game result reporting
- Oracle (backend) reports winners to escrow contract
- Contract automatically distributes prizes

## 🔴 Backend API Routes Needed

You need to create these API routes in the backend (packages/api):

### 1. POST `/api/game-escrow/create`

Creates an escrow game on-chain.

**Request Body:**
```typescript
{
    tokenAddress: string;      // USDC address
    entryFee: string;         // Entry fee in wei (e.g., "1000000" for 1 USDC)
    minPlayers: number;
    maxPlayers: number;
    mode: 0 | 1 | 2 | 3;      // GameMode enum
    teams?: number;            // Number of teams (for team mode)
    prizePercentages?: number[]; // Prize distribution (must sum to 100)
}
```

**Response:**
```typescript
{
    success: boolean;
    data?: {
        gameId: number;        // On-chain game ID
        txHash: string;
    };
    error?: string;
}
```

**Implementation Notes:**
- Use server wallet to create game on behalf of user
- User must be the creator in the contract
- Returns the on-chain `gameId`

### 2. POST `/api/game-escrow/join`

Joins an existing escrow game.

**Request Body:**
```typescript
{
    gameId: number;
    teamId?: number;           // 0 for non-team games
}
```

**Response:**
```typescript
{
    success: boolean;
    data?: {
        txHash: string;
    };
    error?: string;
}
```

**Implementation Notes:**
- User must approve USDC before calling (frontend handles this)
- Backend calls `joinGame(gameId, teamId)` on contract
- Entry fee is automatically transferred from user's wallet

### 3. POST `/api/game-escrow/approve`

Approves USDC spending for GameEscrow contract.

**Request Body:**
```typescript
{
    tokenAddress: string;      // USDC address
    amount: string;            // Amount in wei
}
```

**Response:**
```typescript
{
    success: boolean;
    data?: {
        txHash: string;
    };
    error?: string;
}
```

### 4. POST `/api/game-escrow/report-result`

Reports game results (oracle only - should be backend-initiated).

**Request Body:**
```typescript
{
    gameId: number;
    winners: string[];         // Winner addresses
    scores: number[];          // Player scores
    teamAssignments: number[]; // Team IDs
}
```

**Response:**
```typescript
{
    success: boolean;
    data?: {
        txHash: string;
    };
    error?: string;
}
```

**Implementation Notes:**
- **IMPORTANT**: This should be called by backend oracle, not directly by users
- Backend needs ORACLE_ROLE granted on contract
- Called automatically when game completes
- Contract auto-distributes prizes based on game mode

### 5. POST `/api/game-escrow/cancel`

Cancels an escrow game (before it starts).

**Request Body:**
```typescript
{
    gameId: number;
}
```

**Response:**
```typescript
{
    success: boolean;
    data?: {
        txHash: string;
    };
    error?: string;
}
```

**Implementation Notes:**
- Only creator or admin can cancel
- Automatically refunds all players
- Can only be called if game status is "Waiting"

### 6. GET `/api/game-escrow/game/:gameId`

Gets escrow game details from contract.

**Response:**
```typescript
{
    success: boolean;
    data?: {
        gameId: number;
        creator: string;
        paymentToken: string;
        mode: number;
        entryFee: string;
        maxPlayers: number;
        status: number;        // 0=Waiting, 1=Active, 2=Finished, 3=Cancelled
        players: string[];
        prizePool: string;
        // ... other fields
    };
    error?: string;
}
```

### 7. GET `/api/game-escrow/player/:gameId/:address`

Gets player info in a specific game.

**Response:**
```typescript
{
    success: boolean;
    data?: {
        hasJoined: boolean;
        teamId: number;
        score: number;
        hasClaimed: boolean;
    };
    error?: string;
}
```

### 8. GET `/api/game-escrow/check-allowance`

Checks if user has approved enough tokens.

**Query Params:**
- `user`: User address
- `token`: Token address (USDC)
- `amount`: Amount needed (in wei)

**Response:**
```typescript
{
    success: boolean;
    needsApproval: boolean;
    currentAllowance?: string;
}
```

## 📋 Implementation Steps for Backend

### Step 1: Set up Contract Instances

```typescript
import { ethers } from 'ethers';
import GameEscrowABI from './abis/GameEscrow.json';
import ERC20ABI from './abis/ERC20.json';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);

const gameEscrow = new ethers.Contract(
    GAME_ESCROW_ADDRESS,
    GameEscrowABI,
    wallet
);

const usdc = new ethers.Contract(
    USDC_ADDRESS,
    ERC20ABI,
    wallet
);
```

### Step 2: Grant Oracle Role to Backend

The backend wallet needs ORACLE_ROLE to report game results:

```bash
# On the deployed contract
await gameEscrow.grantRole(ORACLE_ROLE, BACKEND_WALLET_ADDRESS);
```

### Step 3: Implement Game Result Reporting

When a game completes in your system:

```typescript
async function reportGameCompletion(roomId: string) {
    const room = await getRoom(roomId);
    if (!room.escrowGameId) return;

    // Determine winners based on game outcome
    const winners = determineWinners(room);
    const scores = getPlayerScores(room);
    const teamAssignments = getTeamAssignments(room);

    // Report to blockchain
    const tx = await gameEscrow.reportGameResult(
        room.escrowGameId,
        winners,
        scores,
        teamAssignments
    );
    await tx.wait();

    // Prizes are automatically distributed by contract!
}
```

### Step 4: Database Schema Updates

Update your Room model in the database:

```prisma
model Room {
    id              String    @id @default(uuid())
    // ... existing fields
    escrowGameId    Int?      // On-chain game ID
    entryFee        String?   // Entry fee in tokens
    paymentToken    String?   // Token address
}
```

## 🎮 Game Modes Explained

### Winner Takes All (mode: 0)
- Single winner gets 100% of prize pool
- Backend reports 1 winner address

### Free For All (mode: 2)
- Top N players share prize pool
- Backend reports multiple winners
- Prizes split equally among winners

### Score Based (mode: 3)
- Prizes distributed based on scores
- Backend reports all players with scores
- Contract calculates prize distribution

### Team Battle (mode: 1)
- Teams compete, winning team splits prize
- Backend reports team assignments + winning team
- Prize split among winning team members

## 🔐 Security Considerations

1. **Token Approval**: Users only approve exact amount needed
2. **Escrow Protection**: Funds locked in contract until game completes
3. **Oracle Trust**: Backend has ORACLE_ROLE - keep private key secure
4. **Refunds**: Automatic if game cancelled before starting
5. **No Double-Join**: Contract prevents joining same game twice

## 📊 Contract Addresses

```typescript
// Base Sepolia Testnet
GAME_ESCROW_ADDRESS = "0xe9F14E333Ad13a9a28c6722c41f6a91A0e009A4f"
USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
CHAIN_ID = 84532
```

## 🧪 Testing Checklist

- [ ] Create free room
- [ ] Create paid room with small entry fee
- [ ] Join free room
- [ ] Join paid room (approve + pay)
- [ ] Complete game and verify prize distribution
- [ ] Cancel paid room before starting (verify refunds)
- [ ] Try joining without enough USDC (should fail gracefully)
- [ ] Try joining without approval (should fail gracefully)
- [ ] Verify escrow balance increases when players join
- [ ] Verify escrow balance decreases after prize distribution

## 🚀 Next Steps

1. **Implement Backend API Routes** (see above)
2. **Grant Oracle Role** to backend wallet
3. **Test on Base Sepolia** with test USDC
4. **Add Game Result Reporting** logic in backend
5. **Deploy to Production** (Base Mainnet) when ready

## 📚 Resources

- GameEscrow Contract: `packages/contracts/contracts/GameEscrow.sol`
- Deployment Info: `packages/contracts/deployments/game-escrow-base-sepolia-latest.json`
- Base Sepolia Explorer: https://sepolia.basescan.org/address/0xe9F14E333Ad13a9a28c6722c41f6a91A0e009A4f
- Test USDC Faucet: https://faucet.circle.com/
