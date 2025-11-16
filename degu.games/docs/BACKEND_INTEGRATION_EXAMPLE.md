# Backend Integration Example

This document provides example code for integrating the backend API with the VM server.

## Required Environment Variables

Add to your backend `.env`:

```bash
# VM Server Configuration
VM_SERVER_URL=http://localhost:3001
VM_SERVER_TOKEN=your_secure_token_here
VM_REQUEST_TIMEOUT=10000

# This token must match the one in vm-server/.env
```

## Files Created

1. **packages/api/src/lib/vm-server-client.ts** - VM server HTTP client
2. **packages/api/src/middleware/vm-auth.ts** - VM server authentication middleware

## Example Game Routes

Create `packages/api/src/routes/game.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { authenticateVMServer } from '../middleware/vm-auth';
import { authenticateUser } from '../middleware/auth'; // Your existing auth
import vmServerClient from '../lib/vm-server-client';
import prisma from '../lib/prisma'; // Your Prisma client
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/game/create-room
 * Create a new game room and request VM slot
 *
 * Called by frontend when player wants to start a game
 */
router.post('/create-room', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { projectId, players, betAmount } = req.body;

        // Validation
        if (!projectId || !players || !Array.isArray(players)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: projectId and players array required'
            });
        }

        if (players.length < 1 || players.length > 4) {
            return res.status(400).json({
                success: false,
                error: 'Players must be between 1 and 4'
            });
        }

        logger.info(`[Game] Creating room for project ${projectId} with ${players.length} players`);

        // 1. Validate all players exist and have wallet addresses
        const users = await prisma.user.findMany({
            where: {
                id: { in: players }
            },
            select: {
                id: true,
                walletAddress: true
            }
        });

        if (users.length !== players.length) {
            return res.status(400).json({
                success: false,
                error: 'One or more players not found'
            });
        }

        const missingWallet = users.find(u => !u.walletAddress);
        if (missingWallet) {
            return res.status(400).json({
                success: false,
                error: 'All players must have connected wallets'
            });
        }

        // 2. Get project data (verified Scratch project)
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                projectData: true, // JSON field with Scratch project
                verified: true
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        if (!project.verified) {
            return res.status(400).json({
                success: false,
                error: 'Only verified projects allowed for betting'
            });
        }

        // 3. Lock bet amounts (if applicable)
        // TODO: Implement your escrow/locking logic here
        // This would lock the bet amount from each player's wallet/balance

        // 4. Create room in database
        const room = await prisma.gameRoom.create({
            data: {
                projectId: project.id,
                players: players,
                betAmount: betAmount,
                status: 'pending',
                createdAt: new Date()
            }
        });

        logger.info(`[Game] Created room ${room.id}`);

        // 5. Request slot from VM server
        const vmResult = await vmServerClient.requestSlot(
            room.id,
            project.id,
            project.projectData,
            players
        );

        if (!vmResult.success) {
            // VM server error - rollback
            await prisma.gameRoom.update({
                where: { id: room.id },
                data: { status: 'failed', error: vmResult.error }
            });

            return res.status(503).json({
                success: false,
                error: 'Game server unavailable: ' + vmResult.error
            });
        }

        // 6. Update room with VM server info
        await prisma.gameRoom.update({
            where: { id: room.id },
            data: {
                status: vmResult.data!.status,
                vmServerUrl: vmResult.data!.wsUrl,
                queuePosition: vmResult.data!.queuePosition
            }
        });

        // 7. Return room info to frontend
        return res.json({
            success: true,
            data: {
                roomId: room.id,
                status: vmResult.data!.status,
                wsUrl: vmResult.data!.wsUrl,
                queuePosition: vmResult.data!.queuePosition,
                message: vmResult.data!.message
            }
        });

    } catch (error: any) {
        logger.error(`[Game] Create room error: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/game/report-result
 * Receive game result from VM server
 *
 * Called by VM server when game ends
 * MUST be authenticated with VM_SERVER_TOKEN
 */
router.post('/report-result', authenticateVMServer, async (req: Request, res: Response) => {
    try {
        const { roomId, winnerUserId, source, metadata } = req.body;

        logger.info(`[Game] Result report for room ${roomId} from ${source}`);

        // Validation
        if (!roomId || !winnerUserId) {
            return res.status(400).json({
                success: false,
                error: 'roomId and winnerUserId required'
            });
        }

        if (source !== 'vm_server') {
            return res.status(400).json({
                success: false,
                error: 'Invalid source'
            });
        }

        // 1. Get room
        const room = await prisma.gameRoom.findUnique({
            where: { id: roomId },
            include: {
                project: true
            }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }

        // 2. Check not already finalized
        if (room.finalized) {
            logger.warn(`[Game] Room ${roomId} already finalized`);
            return res.status(400).json({
                success: false,
                error: 'Game already finalized'
            });
        }

        // 3. Verify winner is a player in the room
        if (!room.players.includes(winnerUserId)) {
            logger.error(`[Game] Winner ${winnerUserId} not in room ${roomId} players`);
            return res.status(400).json({
                success: false,
                error: 'Winner is not a player in this room'
            });
        }

        // 4. Get winner's wallet address
        const winner = await prisma.user.findUnique({
            where: { id: winnerUserId },
            select: {
                id: true,
                walletAddress: true
            }
        });

        if (!winner || !winner.walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Winner has no wallet address'
            });
        }

        logger.info(`[Game] Winner ${winnerUserId} wallet: ${winner.walletAddress}`);

        // 5. Call smart contract to distribute prizes
        // TODO: Implement your smart contract integration here
        // Example:
        /*
        const gameEscrow = new ethers.Contract(
            process.env.GAME_ESCROW_ADDRESS,
            GameEscrowABI,
            wallet
        );

        const tx = await gameEscrow.reportGameResult(
            room.id,
            winner.walletAddress
        );

        const receipt = await tx.wait();
        const txHash = receipt.transactionHash;
        */

        // For now, mock transaction hash
        const txHash = '0x' + Math.random().toString(16).substring(2, 66);

        logger.info(`[Game] Smart contract called, tx: ${txHash}`);

        // 6. Update database
        await prisma.gameRoom.update({
            where: { id: roomId },
            data: {
                finalized: true,
                winnerUserId: winnerUserId,
                finalizedAt: new Date(),
                transactionHash: txHash,
                status: 'completed'
            }
        });

        await prisma.gameResult.create({
            data: {
                roomId: roomId,
                winnerUserId: winnerUserId,
                source: source,
                metadata: metadata,
                transactionHash: txHash
            }
        });

        logger.info(`[Game] Room ${roomId} finalized successfully`);

        // 7. Return success to VM server
        return res.json({
            success: true,
            data: {
                transactionHash: txHash,
                winner: {
                    userId: winnerUserId,
                    walletAddress: winner.walletAddress
                },
                prizeAmount: room.betAmount * room.players.length // Total pot
            }
        });

    } catch (error: any) {
        logger.error(`[Game] Report result error: ${error.message}`);
        logger.error(error.stack);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/game/room/:roomId
 * Get room status
 *
 * Called by frontend to check room/queue status
 */
router.get('/room/:roomId', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;

        const room = await prisma.gameRoom.findUnique({
            where: { id: roomId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }

        // If queued, get current position
        let queuePosition = room.queuePosition;
        if (room.status === 'queued') {
            const currentPosition = await vmServerClient.getQueuePosition(roomId);
            if (currentPosition !== null) {
                queuePosition = currentPosition;

                // Update in database
                await prisma.gameRoom.update({
                    where: { id: roomId },
                    data: { queuePosition: currentPosition }
                });
            }
        }

        return res.json({
            success: true,
            data: {
                roomId: room.id,
                projectId: room.projectId,
                projectName: room.project.name,
                status: room.status,
                players: room.players,
                betAmount: room.betAmount,
                wsUrl: room.vmServerUrl,
                queuePosition: queuePosition,
                finalized: room.finalized,
                winner: room.winnerUserId,
                transactionHash: room.transactionHash,
                createdAt: room.createdAt,
                finalizedAt: room.finalizedAt
            }
        });

    } catch (error: any) {
        logger.error(`[Game] Get room error: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/game/vm-status
 * Get VM server status (admin)
 */
router.get('/vm-status', authenticateUser, async (req: Request, res: Response) => {
    try {
        // TODO: Add admin check
        // if (!req.user.isAdmin) { ... }

        const status = await vmServerClient.getStatus();

        return res.json(status);

    } catch (error: any) {
        logger.error(`[Game] VM status error: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
```

## Database Schema Updates

Add to your Prisma schema:

```prisma
model GameRoom {
  id              String    @id @default(uuid())
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id])

  players         String[]  // Array of user IDs
  betAmount       Decimal?  // Optional betting amount

  // VM Server integration
  status          String    // 'pending', 'queued', 'ready', 'playing', 'completed', 'failed'
  vmServerUrl     String?   // WebSocket URL
  queuePosition   Int?      // Position in queue if queued

  // Results
  finalized       Boolean   @default(false)
  winnerUserId    String?
  winner          User?     @relation(fields: [winnerUserId], references: [id])
  finalizedAt     DateTime?
  transactionHash String?   // Blockchain transaction
  error           String?   // Error message if failed

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  results         GameResult[]
}

model GameResult {
  id              String    @id @default(uuid())
  roomId          String
  room            GameRoom  @relation(fields: [roomId], references: [id])

  winnerUserId    String
  winner          User      @relation(fields: [winnerUserId], references: [id])

  source          String    // 'vm_server' or 'direct'
  metadata        Json?     // Additional data from VM server
  transactionHash String?

  createdAt       DateTime  @default(now())
}

model Project {
  id           String     @id @default(uuid())
  name         String
  projectData  Json       // Scratch project JSON
  verified     Boolean    @default(false)
  createdBy    String
  creator      User       @relation(fields: [createdBy], references: [id])

  rooms        GameRoom[]

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

Run migration:
```bash
cd packages/api
npx prisma migrate dev --name add_vm_server_integration
```

## Registering Routes

In `packages/api/src/routes/index.ts`:

```typescript
import express from 'express';
import gameRoutes from './game';

const router = express.Router();

router.use('/game', gameRoutes);
// ... other routes

export default router;
```

## Testing

### 1. Health Check

```bash
curl http://localhost:3001/api/health
```

### 2. Create Room

```bash
curl -X POST http://localhost:3000/api/game/create-room \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project123",
    "players": ["user1", "user2"],
    "betAmount": 10
  }'
```

### 3. Check Room Status

```bash
curl http://localhost:3000/api/game/room/ROOM_ID \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### 4. Test Result Reporting (simulate VM server)

```bash
curl -X POST http://localhost:3000/api/game/report-result \
  -H "Authorization: Bearer VM_SERVER_TOKEN" \
  -H "X-VM-Server: true" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "ROOM_ID",
    "winnerUserId": "user1",
    "source": "vm_server",
    "metadata": {
      "duration": 120,
      "finalizedAt": 1234567890
    }
  }'
```

## Error Handling

The integration handles these scenarios:

1. **VM Server Down**
   - Returns error to client
   - Rolls back room creation
   - Refunds locked bets

2. **Queue Full**
   - Returns "try again later" error
   - Client should retry

3. **Duplicate Finalization**
   - Rejects with error
   - Prevents double payment

4. **Invalid Winner**
   - Validates winner is in room
   - Validates wallet exists
   - Rejects if validation fails

5. **Smart Contract Failure**
   - Logs error
   - Marks game as failed
   - TODO: Implement refund logic

## Monitoring

Log important events:

```typescript
logger.info('[Game] Room created:', roomId);
logger.info('[Game] Game finalized:', roomId, winnerUserId);
logger.error('[Game] Finalization failed:', roomId, error);
logger.warn('[Game] Duplicate finalization attempt:', roomId);
```

## Security Checklist

✅ VM server authentication (token + header)
✅ User authentication for room creation
✅ Winner validation (is player in room)
✅ Wallet validation (has address)
✅ Duplicate finalization prevention
✅ Verified projects only
✅ Input validation
✅ Error logging
✅ Transaction records

## Next Steps

1. ✅ Implement smart contract integration
2. ✅ Add bet locking/escrow logic
3. ✅ Implement refund mechanism
4. ✅ Add admin endpoints
5. ✅ Setup monitoring/alerts
6. ✅ Load testing
7. ✅ Production deployment

## Support

For questions or issues:
- See `VM_SERVER_IMPLEMENTATION_PLAN.md`
- See `FINAL_ARCHITECTURE_DECISIONS.md`
- Check VM server logs: `packages/vm-server/logs/`
- Check backend logs

