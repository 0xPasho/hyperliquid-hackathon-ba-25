# Multiplayer Payment System - Implementation Summary

## ✅ COMPLETED WORK

### 1. Database Schema
**File:** `packages/api/prisma/schema.prisma`
- Added `seatNumber` field to RoomPlayer model
- Database synced successfully with `npx prisma db push`

### 2. Blockchain Integration (Backend)
**Files Created:**
- `packages/api/src/lib/blockchain/config.ts` - Configuration
- `packages/api/src/lib/blockchain/gameEscrow.ts` - Contract client
- `packages/api/src/lib/blockchain/gameEscrowABI.json` - Contract ABI

**Environment Variables Required:**
```env
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
GAME_ESCROW_CONTRACT_ADDRESS=0xabc  # Update with real address
ORACLE_PRIVATE_KEY=your_private_key_here
BLOCKCHAIN_CHAIN_ID=84532
```

**Methods Available:**
- `gameEscrowClient.createGame()` - Creates escrow game on blockchain
- `gameEscrowClient.getGame()` - Fetches game data
- `gameEscrowClient.reportGameResult()` - Distributes prizes

### 3. Room Service Updates
**File:** `packages/api/src/modules/rooms/room.service.ts`
- Added seat number validation in `joinRoom()`
- Imported blockchain client
- Ready for blockchain integration

---

## 🚧 REMAINING WORK

### Backend Tasks

#### Task 1: Update Room Creation to Create Blockchain Game
**File:** `packages/api/src/modules/rooms/room.service.ts`

In `createRoom()` method, after creating room in database, add:

```typescript
// If room has entry fee, create blockchain escrow game
if (data.entryFee && data.tokenAddress) {
    const bcResult = await gameEscrowClient.createGame({
        paymentToken: data.tokenAddress,
        mode: data.gameMode !== undefined ? data.gameMode : GameMode.WinnerTakesAll,
        entryFee: data.entryFee,
        maxPlayers: data.maxPlayers || 4,
        numTeams: data.teams || 0,
        timeLimit: 3600, // 1 hour default
        creatorCommission: 0, // 0% for now
        platformCommission: 200, // 2%
    });

    if (bcResult.success && bcResult.gameId !== undefined) {
        // Update room with blockchain game ID
        room = await this.prisma.room.update({
            where: { id: room.id },
            data: { blockchainGameId: bcResult.gameId.toString() },
            include: {
                project: { select: { id: true, title: true } },
                host: { select: { id: true, name: true, walletAddress: true } },
            },
        });

        console.log(`[RoomService] Created blockchain game ${bcResult.gameId} for room ${room.id}`);
    } else {
        console.error(`[RoomService] Failed to create blockchain game: ${bcResult.error}`);
        // Don't fail room creation, just log the error
    }
}
```

#### Task 2: Create Game Result Handler
**File:** `packages/api/src/modules/game/game.service.ts` (or create new file)

```typescript
import { gameEscrowClient } from "../../lib/blockchain/gameEscrow";
import roomService from "../rooms/room.service";
import { prisma } from "../../lib/prisma";

export async function handleGameResult(roomId: string, winnerUserId: string) {
    const room = await roomService.getRoomById(roomId);

    if (!room) {
        return { success: false, error: "Room not found" };
    }

    // Get winner's wallet address
    const winner = room.players?.find(p => p.userId === winnerUserId);
    const winnerWallet = winner?.user?.walletAddress;

    if (!winnerWallet) {
        return { success: false, error: "Winner wallet address not found" };
    }

    // If room has blockchain game, distribute prizes
    if (room.blockchainGameId) {
        const gameId = parseInt(room.blockchainGameId);

        const result = await gameEscrowClient.reportGameResult(gameId, [winnerWallet]);

        if (result.success) {
            console.log(`[GameResult] Prizes distributed for game ${gameId}, tx: ${result.txHash}`);

            // Mark room as completed
            await roomService.completeGame(roomId);

            return {
                success: true,
                transactionHash: result.txHash,
                blockNumber: result.receipt?.blockNumber,
                gasUsed: result.receipt?.gasUsed,
            };
        } else {
            console.error(`[GameResult] Failed to distribute prizes: ${result.error}`);
            return { success: false, error: result.error };
        }
    }

    // No blockchain game, just mark as completed
    await roomService.completeGame(roomId);
    return { success: true };
}
```

#### Task 3: Update VM Server's Game Finalization
**File:** `packages/vm-server/src/GameInstanceManager.js`

Update the `finalizeGame()` method around line 194 to call the new game result handler:

```javascript
// Call backend API
const response = await fetch(`${config.backendUrl}/api/v1/game/result`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-VM-Server': 'true'
    },
    body: JSON.stringify({
        roomId: roomId,
        winnerUserId: gameInfo.winner,
        source: 'vm_server',
    }),
    timeout: 30000
});
```

---

### Frontend Tasks

#### Task 4: Create useWallet Hook
**File:** `packages/web/src/hooks/useWallet.ts`

```typescript
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';

export function useWallet() {
    const { user, ready, authenticated } = usePrivy();
    const { wallets } = useWallets();

    const getProvider = async () => {
        if (!wallets || wallets.length === 0) {
            throw new Error("No wallet found");
        }

        const wallet = wallets[0];
        return await wallet.getEthersProvider();
    };

    const sendTransaction = async (to: string, data: string, value?: string) => {
        const provider = await getProvider();
        const signer = await provider.getSigner();

        return await signer.sendTransaction({
            to,
            data,
            value: value ? ethers.parseEther(value) : undefined,
        });
    };

    return {
        walletAddress: wallets?.[0]?.address,
        sendTransaction,
        getProvider,
        ready,
        authenticated,
    };
}
```

#### Task 5: Create GameCountdown Component
**File:** `packages/web/src/components/room/GameCountdown.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";

interface GameCountdownProps {
    onComplete: () => void;
}

export function GameCountdown({ onComplete }: GameCountdownProps) {
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
    }, [count, onComplete]);

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-white mb-4 animate-pulse">
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

#### Task 6: Create SeatSelection Component
**File:** `packages/web/src/components/room/SeatSelection.tsx`

```typescript
"use client";

interface SeatSelectionProps {
    maxPlayers: number;
    occupiedSeats: { seatNumber: number | null; userName?: string | null; userId: string }[];
    selectedSeat: number | null;
    onSelectSeat: (seatNumber: number) => void;
}

export function SeatSelection({
    maxPlayers,
    occupiedSeats,
    selectedSeat,
    onSelectSeat,
}: SeatSelectionProps) {
    const seats = Array.from({ length: maxPlayers }, (_, i) => i);

    const isSeatOccupied = (seatNum: number) => {
        return occupiedSeats.some(p => p.seatNumber === seatNum);
    };

    const getSeatPlayer = (seatNum: number) => {
        return occupiedSeats.find(p => p.seatNumber === seatNum);
    };

    return (
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {seats.map((seatNum) => {
                const occupied = isSeatOccupied(seatNum);
                const player = getSeatPlayer(seatNum);
                const selected = selectedSeat === seatNum;

                return (
                    <button
                        key={seatNum}
                        onClick={() => !occupied && onSelectSeat(seatNum)}
                        disabled={occupied}
                        className={`
                            p-6 rounded-lg border-2 transition-all
                            ${occupied
                                ? 'bg-gray-700 border-gray-600 cursor-not-allowed'
                                : selected
                                ? 'bg-indigo-600 border-indigo-400'
                                : 'bg-gray-800 border-gray-600 hover:border-indigo-500'
                            }
                        `}
                    >
                        <div className="text-center">
                            <div className="text-2xl font-bold mb-2">
                                Seat {seatNum + 1}
                            </div>
                            {occupied && player ? (
                                <div className="text-sm text-gray-400">
                                    {player.userName || 'Player'}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">Available</div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
```

#### Task 7: Update Room Page with Countdown
**File:** `packages/web/src/app/rooms/[id]/page.tsx`

Add state and handler:

```typescript
const [showCountdown, setShowCountdown] = useState(false);

const handleStartGame = async () => {
    setShowCountdown(true);
};

const handleCountdownComplete = async () => {
    try {
        const result = await startGame(roomId, hostId, token);

        if (!result.success) {
            throw new Error(result.error);
        }

        // Redirect to game
        window.location.href = result.data.vmServerUrl;
    } catch (error: any) {
        alert(`Failed to start: ${error.message}`);
        setShowCountdown(false);
    }
};

// In render:
{showCountdown && <GameCountdown onComplete={handleCountdownComplete} />}
```

---

## 📝 INTEGRATION NOTES

### Payment Flow (User Perspective)

1. **Room Creation**
   - Host creates room with entry fee
   - Backend creates blockchain escrow game automatically
   - Room gets `blockchainGameId`

2. **Joining & Payment**
   - User clicks "Join Room"
   - Optionally selects seat
   - Frontend calls contract `joinGame()` directly with Privy wallet
   - User signs transaction to pay entry fee
   - After blockchain confirmation, frontend calls backend `joinRoom()`
   - Backend verifies player joined on-chain

3. **Game Start**
   - All players ready (minimum 2 for multiplayer)
   - Host clicks "Start Game"
   - 3-second countdown
   - Game launches

4. **Game End & Prize Distribution**
   - VM server detects game end
   - Calls backend `/api/v1/game/result`
   - Backend calls `gameEscrowClient.reportGameResult()`
   - Smart contract distributes prizes automatically
   - Winner can withdraw from contract

### Testing Checklist

- [ ] Room creation with entry fee creates blockchain game
- [ ] Blockchain game ID is stored in room
- [ ] Join room validates seat selection
- [ ] Seat numbers are unique per room
- [ ] Countdown shows before game starts
- [ ] Game result triggers prize distribution
- [ ] Transaction hash is logged
- [ ] Prizes sent to winner's wallet

---

## 🎯 NEXT STEPS

1. Finish backend integration (Tasks 1-3)
2. Create frontend components (Tasks 4-7)
3. Test with actual deployed contract
4. Update contract address in `.env`
5. Fund oracle wallet for gas fees
6. End-to-end testing

---

## 🔑 KEY FILES MODIFIED

**Backend:**
- `packages/api/prisma/schema.prisma` ✅
- `packages/api/src/lib/blockchain/*` ✅
- `packages/api/src/modules/rooms/room.service.ts` ✅ (partial)
- `packages/api/src/modules/game/game.service.ts` ⏳ (needs creation)

**Frontend:**
- `packages/web/src/hooks/useWallet.ts` ⏳
- `packages/web/src/components/room/GameCountdown.tsx` ⏳
- `packages/web/src/components/room/SeatSelection.tsx` ⏳
- `packages/web/src/app/rooms/[id]/page.tsx` ⏳

**Status:**
- ✅ Complete
- ⏳ Pending
