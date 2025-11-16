# Multiplayer Room Join, Payment & Play - Implementation Plan

## Overview
Implement the complete flow for users to join multiplayer rooms, pay entry fees via escrow, select seats, and play games with automatic prize distribution on completion.

---

## 🎯 Core Features

### 1. **Room Joining & Payment Flow**
- Users can view multiplayer rooms even when not logged in
- Non-joined users see "Join Room" button
- Users can select specific seat (1-4 for 4-player game) OR random seat
- Payment required via Privy wallet (sign transaction)
- Entry fee held in GameEscrow.sol contract
- Seat reserved on successful payment confirmation

### 2. **Room Leaving & Refund Flow**
- Users can press "Leave" button to exit room
- Money refunded from escrow to their wallet
- Seat becomes available again

### 3. **Game Start Flow**
- Host presses "Start Game" when minimum players met
- 3-second countdown: "Starting game in 3... 2... 1..."
- Game auto-starts (Scratch loads with proper URL)
- Players can play immediately

### 4. **Game Completion & Prize Distribution**
- VM-server detects game end (already implemented)
- Backend receives game result via `/game/report-result`
- Backend calls GameEscrow contract to distribute prizes
- Winner receives payout automatically

---

## 🔧 Technical Architecture

### **Smart Contract (GameEscrow.sol)**
**Current Functions:**
- ✅ `createGame()` - Create game with entry fee and token
- ✅ `joinGame(gameId, teamId)` - Pay and join (money held in escrow)
- ✅ `reportGameResult(gameId, winners[])` - Distribute prizes (ORACLE_ROLE only)
- ✅ `cancelGame(gameId, reason)` - Refund all players (creator/admin only)
- ❌ **MISSING: Individual player leave function**

**Issues to Address:**
1. No way for individual player to leave and get refunded before game starts
2. Current `cancelGame()` refunds ALL players, not just one

### **VM Server**
**Current Implementation:**
- ✅ Game end detection via VMInstance finalize event
- ✅ Calls backend `/game/report-result` with winner info
- ✅ Logs complete game results

**What's Needed:**
- Wire up backend response handling for blockchain transaction

### **Backend API**
**Current State:**
- Has `/game/report-result` endpoint (called by VM server)
- Has rooms system with status management

**What's Needed:**
- Blockchain integration to call GameEscrow contract
- Handle contract game creation when room is created
- Handle player join → contract joinGame() call
- Handle player leave → contract refund (NEW CONTRACT FUNCTION NEEDED)
- Handle game start → update contract status
- Handle game result → call reportGameResult() on contract

### **Frontend (Web)**
**Current State:**
- Room lobby UI exists
- Join/leave room API calls exist
- Basic room status display

**What's Needed:**
- Payment UI for joining (Privy wallet integration)
- Seat selection UI (grid/slots showing occupied/available)
- 3-second countdown UI before game start
- Loading states during blockchain transactions
- Error handling for failed payments
- Refund confirmation flow

---

## 📋 Detailed Implementation Plan

### **Phase 1: Smart Contract Updates**
**Duration:** 1-2 hours

#### Task 1.1: Add Individual Leave Function to GameEscrow.sol
```solidity
function leaveGame(uint256 gameId) external gameExists(gameId) nonReentrant {
    Game storage game = games[gameId];

    // Only allow leaving if game hasn't started
    if (game.status != GameStatus.Waiting) revert GameNotWaiting();
    if (!game.hasJoined[msg.sender]) revert PlayerNotInGame();

    // Remove player from game
    _removePlayer(gameId, msg.sender);

    // Refund entry fee
    uint256 refundAmount = game.entryFee;
    game.prizePool -= refundAmount;
    totalValueLocked -= refundAmount;
    tokenTVL[game.paymentToken] -= refundAmount;

    // Transfer refund
    game.paymentToken.safeTransfer(msg.sender, refundAmount);

    emit PlayerLeft(gameId, msg.sender, refundAmount);
}
```

#### Task 1.2: Add Helper Function to Remove Player
```solidity
function _removePlayer(uint256 gameId, address player) internal {
    Game storage game = games[gameId];

    // Find and remove player from array
    for (uint256 i = 0; i < game.players.length; i++) {
        if (game.players[i] == player) {
            game.players[i] = game.players[game.players.length - 1];
            game.players.pop();
            break;
        }
    }

    // Reset mappings
    game.hasJoined[player] = false;
    delete game.playerTeams[player];
}
```

#### Task 1.3: Deploy Updated Contract
- Deploy to testnet (Base Sepolia)
- Update contract address in backend config
- Update ABI files

---

### **Phase 2: Backend Blockchain Integration**
**Duration:** 4-6 hours

#### Task 2.1: Setup Contract Integration
**Files:**
- `packages/api/src/lib/blockchain/game-escrow.ts` (NEW)
- `packages/api/src/lib/blockchain/config.ts` (UPDATE)

**Implementation:**
```typescript
// Setup ethers.js with GameEscrow contract
// Functions needed:
// - createGame()
// - joinGame()
// - leaveGame()
// - reportGameResult()
// - getGame()
```

#### Task 2.2: Update Room Creation Flow
**File:** `packages/api/src/modules/rooms/rooms.service.ts`

**Changes:**
```typescript
async createRoom(data: CreateRoomData) {
    // 1. Create room in database
    const room = await prisma.room.create({...});

    // 2. Create game in GameEscrow contract (if has entry fee)
    if (data.entryFee && data.paymentToken) {
        const escrowGameId = await gameEscrowContract.createGame({
            paymentToken: data.paymentToken,
            mode: GameMode.WinnerTakesAll, // or from data
            entryFee: data.entryFee,
            maxPlayers: data.maxPlayers,
            // ... other params
        });

        // 3. Update room with escrow game ID
        await prisma.room.update({
            where: { id: room.id },
            data: { escrowGameId }
        });
    }

    return room;
}
```

#### Task 2.3: Update Join Room Flow
**File:** `packages/api/src/modules/rooms/rooms.service.ts`

**Changes:**
```typescript
async joinRoom(roomId: string, userId: string, seatNumber?: number) {
    const room = await prisma.room.findUnique({...});

    // If room has escrow, player must join via blockchain
    if (room.escrowGameId) {
        // Frontend will call contract directly
        // We just verify player joined on-chain
        const gameData = await gameEscrowContract.getGame(room.escrowGameId);

        if (!gameData.players.includes(userWalletAddress)) {
            throw new Error("Must join and pay via blockchain first");
        }
    }

    // Create room player record
    const player = await prisma.roomPlayer.create({
        data: {
            roomId,
            userId,
            seatNumber, // NEW FIELD
            isReady: false
        }
    });

    return player;
}
```

#### Task 2.4: Add Leave Room Flow
**File:** `packages/api/src/modules/rooms/rooms.service.ts`

**Changes:**
```typescript
async leaveRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({...});
    const player = await prisma.roomPlayer.findUnique({...});

    // If room has escrow, player must leave via blockchain
    if (room.escrowGameId) {
        // Frontend will call contract directly to get refund
        // We verify player left on-chain
        const gameData = await gameEscrowContract.getGame(room.escrowGameId);

        if (gameData.players.includes(userWalletAddress)) {
            throw new Error("Must leave via blockchain first to get refund");
        }
    }

    // Remove from database
    await prisma.roomPlayer.delete({
        where: { id: player.id }
    });
}
```

#### Task 2.5: Update Game Result Handler
**File:** `packages/api/src/modules/game/game.service.ts`

**Changes:**
```typescript
async reportGameResult(roomId: string, winnerUserId: string) {
    const room = await prisma.room.findUnique({
        include: { players: { include: { user: true } } }
    });

    // Get winner's wallet address
    const winner = room.players.find(p => p.userId === winnerUserId);
    const winnerWallet = winner?.user?.walletAddress;

    if (!winnerWallet) {
        throw new Error("Winner must have wallet address");
    }

    // Call contract to distribute prizes
    if (room.escrowGameId) {
        const tx = await gameEscrowContract.reportGameResult(
            room.escrowGameId,
            [winnerWallet] // Array of winners
        );

        await tx.wait(); // Wait for confirmation

        return {
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed
        };
    }
}
```

---

### **Phase 3: Frontend Payment Integration**
**Duration:** 6-8 hours

#### Task 3.1: Add Privy Wallet Hooks
**File:** `packages/web/src/hooks/useWallet.ts` (NEW)

```typescript
export function useWallet() {
    const { user, ready, authenticated } = usePrivy();
    const { wallets } = useWallets();

    const sendTransaction = async (tx: TransactionRequest) => {
        const wallet = wallets[0];
        if (!wallet) throw new Error("No wallet found");

        const provider = await wallet.getEthersProvider();
        const signer = provider.getSigner();

        return await signer.sendTransaction(tx);
    };

    return {
        walletAddress: wallets[0]?.address,
        sendTransaction,
        ready,
        authenticated
    };
}
```

#### Task 3.2: Create Seat Selection UI Component
**File:** `packages/web/src/components/room/SeatSelection.tsx` (NEW)

**Features:**
- Grid layout showing all seats (e.g., 2x2 for 4 players)
- Occupied seats show player avatar/name
- Empty seats show "Available"
- Click to select seat
- Highlight selected seat

#### Task 3.3: Update Room Lobby with Join Payment Flow
**File:** `packages/web/src/components/room/RoomLobby.tsx`

**Implementation:**
```typescript
const handleJoinRoom = async (seatNumber?: number) => {
    setJoining(true);
    try {
        // 1. Get room data
        const room = await getRoom(roomId);

        if (room.escrowGameId && room.entryFee) {
            // 2. Call contract joinGame()
            const contract = getGameEscrowContract();
            const tx = await contract.joinGame(
                room.escrowGameId,
                seatNumber || 0 // teamId/seat
            );

            // 3. Wait for confirmation
            setStatus("Waiting for blockchain confirmation...");
            await tx.wait();

            // 4. Call backend to update room state
            const result = await joinRoom(roomId, userId, seatNumber);

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success("Joined room successfully!");
            refetchRoom();
        } else {
            // No payment required
            const result = await joinRoom(roomId, userId, seatNumber);
            if (!result.success) throw new Error(result.error);
        }
    } catch (error) {
        toast.error(`Failed to join: ${error.message}`);
    } finally {
        setJoining(false);
    }
};
```

#### Task 3.4: Add Leave Room with Refund
**File:** `packages/web/src/components/room/RoomLobby.tsx`

```typescript
const handleLeaveRoom = async () => {
    setLeaving(true);
    try {
        const room = await getRoom(roomId);

        if (room.escrowGameId) {
            // Confirm refund
            const confirmed = confirm(
                `You will receive your ${room.entryFee} entry fee back. Continue?`
            );
            if (!confirmed) return;

            // Call contract leaveGame()
            const contract = getGameEscrowContract();
            const tx = await contract.leaveGame(room.escrowGameId);

            setStatus("Processing refund...");
            await tx.wait();

            toast.success("Refund processed!");
        }

        // Update backend
        await leaveRoom(roomId, userId);
        router.push(`/projects/${room.projectId}`);
    } catch (error) {
        toast.error(`Failed to leave: ${error.message}`);
    } finally {
        setLeaving(false);
    }
};
```

#### Task 3.5: Add 3-Second Countdown Component
**File:** `packages/web/src/components/room/GameCountdown.tsx` (NEW)

```typescript
export function GameCountdown({ onComplete }: { onComplete: () => void }) {
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count === 0) {
            onComplete();
            return;
        }

        const timer = setTimeout(() => {
            setCount(count - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [count]);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-white mb-4">
                    {count || "GO!"}
                </h1>
                <p className="text-2xl text-gray-300">
                    {count ? "Starting game in..." : "Game starting!"}
                </p>
            </div>
        </div>
    );
}
```

#### Task 3.6: Update Start Game Flow
**File:** `packages/web/src/app/rooms/[id]/page.tsx`

```typescript
const [showCountdown, setShowCountdown] = useState(false);

const handleStartGame = async () => {
    // Show countdown
    setShowCountdown(true);
};

const handleCountdownComplete = async () => {
    try {
        // Call backend to start game
        const result = await startGame(roomId, hostId, token);

        if (!result.success) {
            throw new Error(result.error);
        }

        // Redirect to game
        window.location.href = result.data.vmServerUrl;
    } catch (error) {
        toast.error(`Failed to start: ${error.message}`);
        setShowCountdown(false);
    }
};

// Render
{showCountdown && <GameCountdown onComplete={handleCountdownComplete} />}
```

---

### **Phase 4: Database Schema Updates**
**Duration:** 1 hour

#### Task 4.1: Add Seat Number to RoomPlayer
**File:** `packages/api/prisma/schema.prisma`

```prisma
model RoomPlayer {
    id          String   @id @default(cuid())
    roomId      String
    userId      String
    seatNumber  Int?     // NEW: 0-based seat index
    joinedAt    DateTime @default(now())
    leftAt      DateTime?
    isReady     Boolean  @default(false)

    room        Room     @relation(fields: [roomId], references: [id])
    user        User     @relation(fields: [userId], references: [id])

    @@unique([roomId, seatNumber]) // Ensure seat uniqueness
}
```

#### Task 4.2: Run Migration
```bash
cd packages/api
npx prisma migrate dev --name add_seat_numbers
```

---

### **Phase 5: Testing & Edge Cases**
**Duration:** 2-3 hours

#### Test Cases:
1. ✅ User joins room with payment → money held in escrow
2. ✅ User leaves room before start → receives refund
3. ✅ User selects specific seat → seat reserved
4. ✅ User tries to join full room → shows error
5. ✅ Host starts game with min players → countdown works
6. ✅ Game completes → winner receives payout
7. ✅ User without wallet tries to join paid room → shows error
8. ✅ Transaction fails → shows proper error message
9. ✅ User refreshes during countdown → maintains state
10. ✅ Multiple users join simultaneously → no seat conflicts

---

## ❓ QUESTIONS FOR YOU

### **🔴 CRITICAL: Contract Limitation**
**Question 1:** The current GameEscrow.sol contract does NOT have an individual player leave function. It only has `cancelGame()` which refunds ALL players and is only callable by the room creator or admin.

Do you want me to:
- **Option A:** Add a new `leaveGame()` function to the contract (requires redeployment)
- **Option B:** Use the existing `cancelGame()` workaround (less ideal)
- **Option C:** Something else?

### **💰 Payment & Token Configuration**
**Question 2:** Which ERC20 token will be used for payments?
- The contract supports any ERC20 token configured by admin
- Current testnet: Base Sepolia
- Need to know which token to add as allowed payment method

**Question 3:** What are the typical entry fee amounts?
- Need to configure `minEntryFee` and `maxEntryFee` in contract
- Currently set to 1 USDC - 10,000 USDC

### **🎮 Game Configuration**
**Question 4:** How should minimum players work?
- Should host be able to start with just 1 player?
- Or require minimum 2 players?
- Or configurable per room?

**Question 5:** What happens if not all seats are filled?
- Can host start game with empty seats?
- Or must all seats be filled?

### **💺 Seat Selection Details**
**Question 6:** Is seat selection optional or required?
- Should "Join Room" assign random seat automatically?
- Or must user always choose a specific seat?

**Question 7:** Does seat number matter for gameplay?
- Is it just visual (Player 1, 2, 3, 4)?
- Or does it affect in-game mechanics?
- Contract uses `teamId` - are seats the same as teams?

### **🏆 Prize Distribution**
**Question 8:** How should prizes be distributed?
- Winner takes all?
- Split among top N players?
- Based on score/ranking?

**Question 9:** What are the commission rates?
- Creator commission (room host)
- Platform commission
- Currently max 50% creator, 20% platform

### **⏱️ Timeouts & Cancellation**
**Question 10:** What happens if players join but game never starts?
- Auto-cancel after X minutes?
- Manual cancel only?
- Automatic refunds?

**Question 11:** What if game crashes during play?
- How to handle refunds?
- Who decides (host, admin, automatic)?

### **🔐 Security & Wallet**
**Question 12:** Should users without wallets be able to join paid rooms?
- Privy can create embedded wallets automatically
- But they need to fund them first
- Should we show a "Fund Wallet" step?

### **📱 Real-time Updates**
**Question 13:** How should room state update in real-time?
- Currently using polling (every 2 seconds)
- When player joins/leaves, how quickly should others see it?
- Should we implement WebSocket for instant updates?

---

## 📊 Estimated Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| Phase 1: Contract Updates | 3 tasks | 1-2 hours |
| Phase 2: Backend Integration | 5 tasks | 4-6 hours |
| Phase 3: Frontend Payment | 6 tasks | 6-8 hours |
| Phase 4: Database Updates | 2 tasks | 1 hour |
| Phase 5: Testing | 10 test cases | 2-3 hours |
| **TOTAL** | **26 tasks** | **14-20 hours** |

---

## 🎯 Next Steps

1. **Answer the questions above**
2. I'll finalize the implementation approach based on your answers
3. Begin implementation starting with Phase 1 (Contract Updates)
4. Proceed through each phase systematically
5. Test thoroughly at each phase

---

## 📝 Notes

- VM server already handles game completion detection ✅
- Backend API structure already exists ✅
- Room system already in place ✅
- Privy wallet integration already configured ✅
- Main work: Contract updates, blockchain integration, payment UI

**This is the CORE feature of the entire application - we'll make it seamless!** 🚀
