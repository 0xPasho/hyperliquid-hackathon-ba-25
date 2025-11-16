# Blockchain Multiplayer Integration Plan
## Base Testnet + GameEscrow Contract

**Date:** 2025-10-21
**Objective:** Enable blockchain-based multiplayer games using GameEscrow contract on Base testnet with USDC payments

---

## 📋 REQUIREMENTS SUMMARY

1. ✅ **Base Testnet Support**: Users log in with Base testnet network
2. ✅ **Blockchain Game Creation**: When publishing multiplayer games, create on-chain game via GameEscrow
3. ✅ **Token Selection**: Users select payment token (USDC for now, extensible)
4. ✅ **Pay-to-Join**: Players pay entry fee to join multiplayer game rooms
5. ✅ **Wallet Support**: Handle both Privy embedded wallets AND external wallets (MetaMask, etc.)
6. ✅ **Complete Flow Validation**: End-to-end testing of entire user journey

---

## 🔍 CURRENT STATE ANALYSIS

### ✅ What We Have

**Frontend (packages/web)**:
- Privy authentication with embedded wallets
- Room lobby system (RoomLobby.tsx, RoomCard.tsx)
- Game creation UI (NewGameModal.tsx, Project settings page)
- Blockchain API client (blockchain-api.ts) for SimpleBetting contract
- Private key handling via Privy's `eth_private_key` method
- Multiplayer settings: `isMultiplayer`, `minPlayers`, `maxPlayers`

**Backend (packages/api)**:
- Room creation/join endpoints
- Blockchain service for Westend Asset Hub
- Private key storage in temp files (hackathon approach)
- Room-blockchain linking via `blockchainGameId` field
- JWT authentication

**Contracts (packages/contracts)**:
- ✅ **GameEscrow.sol** - Production-ready escrow contract
- ✅ **Comprehensive test suite** - 59 passing tests
- ✅ **Deployment script** - Ready for any network
- Supports multiple game modes, ERC20 tokens, team battles

### ❌ What We Need to Build

1. **Base Testnet Configuration**
   - Add Base testnet to Privy supported chains
   - Add Base testnet RPC to Hardhat config
   - Deploy GameEscrow to Base testnet
   - Find/configure USDC contract address on Base testnet

2. **Contract Deployment**
   - Deploy GameEscrow to Base testnet
   - Add USDC as supported token
   - Set up admin/oracle roles
   - Configure TVL limits

3. **Frontend Changes**
   - Add token selection to game creation flow
   - Add entry fee input when creating multiplayer games
   - Update room creation to call blockchain when needed
   - Add approval + payment flow when joining games
   - Display blockchain game status in lobby
   - Handle wallet connection for external wallets

4. **Backend Changes**
   - Add Base testnet support to blockchain service
   - Implement GameEscrow contract interactions
   - Link room creation to blockchain game creation
   - Handle game result reporting (oracle)
   - Validate blockchain state before allowing joins

5. **Integration Logic**
   - When user creates multiplayer game → Create GameEscrow game on-chain
   - When player joins room → Approve token + call joinGame on-chain
   - When host starts game → Update room status
   - When game ends → Oracle reports results, prizes distributed
   - Handle edge cases: cancellations, refunds, network errors

---

## 🗺️ INTEGRATION POINTS MAP

```
┌─────────────────────────────────────────────────────────────┐
│                    USER FLOW DIAGRAM                        │
└─────────────────────────────────────────────────────────────┘

1. USER CREATES PROJECT
   ├─ NewGameModal.tsx → createProject()
   ├─ Redirects to Scratch GUI editor
   └─ User builds game

2. USER PUBLISHES PROJECT (Sets Multiplayer Settings)
   ├─ /projects/[id]/page.tsx (Edit mode)
   ├─ User sets: isMultiplayer = true, minPlayers, maxPlayers
   ├─ **NEW**: Select token (USDC), set entry fee
   ├─ updateProject() → API
   └─ Project saved with blockchain settings

3. HOST CREATES GAME ROOM
   ├─ RoomLobby.tsx → handleCreateRoom()
   ├─ Frontend calls: createRoom(projectId, hostId, ...)
   │
   ├─ **NEW FLOW - If isMultiplayer + has entryFee:**
   │   ├─ 1. Call blockchain API: createGameEscrowGame()
   │   │   ├─ Frontend: Approve token spending (USDC)
   │   │   └─ Backend: Calls GameEscrow.createGame()
   │   │       └─ Returns: blockchainGameId
   │   │
   │   └─ 2. Create room with blockchainGameId
   │       └─ Room.blockchainGameId = blockchain game ID
   │
   └─ Room created, host redirected to /rooms/[id]

4. PLAYER JOINS ROOM
   ├─ RoomLobby.tsx → handleJoinRoom(roomId)
   │
   ├─ **NEW FLOW - If room has blockchainGameId:**
   │   ├─ 1. Frontend checks: User has enough tokens
   │   ├─ 2. Frontend: Approve token spending
   │   ├─ 3. Call blockchain API: joinGameEscrowGame(blockchainGameId)
   │   │   └─ Backend: Calls GameEscrow.joinGame()
   │   ├─ 4. On success: Call joinRoom() API
   │   │   └─ Room.currentPlayers++
   │   └─ 5. Redirect to /rooms/[id]
   │
   └─ Player joins room, sees lobby

5. PLAYERS READY UP
   ├─ /rooms/[id]/page.tsx → toggleReady()
   └─ All players ready → Host can start

6. HOST STARTS GAME
   ├─ /rooms/[id]/page.tsx → handleStartGame()
   │
   ├─ **NEW FLOW - If blockchain game:**
   │   ├─ Check: All players joined on-chain
   │   └─ Update room status to PLAYING
   │
   ├─ Room.status = PLAYING
   └─ Game starts in Scratch GUI

7. GAME ENDS
   ├─ Scratch GUI → Game finish event
   │
   ├─ **NEW FLOW - Oracle reports results:**
   │   ├─ Backend: Collects winner data
   │   ├─ Backend: Calls GameEscrow.reportGameResult()
   │   │   └─ Contract distributes prizes automatically
   │   ├─ Room.status = COMPLETED
   │   └─ Players notified of results
   │
   └─ Players can claim prizes or auto-distributed

┌─────────────────────────────────────────────────────────────┐
│               COMPONENT INTEGRATION MAP                      │
└─────────────────────────────────────────────────────────────┘

FRONTEND (packages/web):
├─ /src/lib/privy.ts
│  └─ [UPDATE] Add Base testnet to supportedChains
│
├─ /src/app/projects/[id]/page.tsx
│  └─ [UPDATE] Add token selection + entry fee input
│
├─ /src/components/NewGameModal.tsx
│  └─ [NO CHANGE] Simple title-only creation
│
├─ /src/components/rooms/RoomLobby.tsx
│  ├─ [UPDATE] handleCreateRoom() → Create blockchain game first
│  └─ [UPDATE] handleJoinRoom() → Pay + join blockchain game
│
├─ /src/app/rooms/[id]/page.tsx
│  ├─ [UPDATE] Display blockchain game info
│  └─ [UPDATE] Handle blockchain game status
│
├─ /src/lib/blockchain-api.ts
│  └─ [NEW] Add GameEscrow functions:
│      ├─ createGameEscrowGame()
│      ├─ joinGameEscrowGame()
│      ├─ getGameEscrowDetails()
│      └─ cancelGameEscrowGame()
│
└─ /src/app/api/blockchain/*
   └─ [NEW] Add Next.js API routes for GameEscrow

BACKEND (packages/api):
├─ /src/modules/blockchain/blockchain.service.ts
│  ├─ [UPDATE] Add Base testnet RPC
│  ├─ [NEW] Add GameEscrow contract ABI
│  └─ [NEW] Implement GameEscrow methods:
│      ├─ createGameEscrowGame()
│      ├─ joinGameEscrowGame()
│      ├─ reportGameResult() [Oracle]
│      └─ getGameEscrowDetails()
│
├─ /src/modules/rooms/room.service.ts
│  ├─ [UPDATE] createRoom() → Accept blockchainGameId
│  └─ [UPDATE] joinRoom() → Validate blockchain state
│
├─ /prisma/schema.prisma
│  └─ [UPDATE] Add fields to Project:
│      ├─ tokenAddress: String?
│      └─ entryFee: String? (stored as wei string)
│
└─ /src/modules/blockchain/blockchain.controller.ts
   └─ [NEW] Add GameEscrow endpoints

CONTRACTS (packages/contracts):
├─ /scripts/deploy-game-escrow.js
│  └─ [RUN] Deploy to Base testnet
│
└─ /hardhat.config.js
   └─ [UPDATE] Add Base testnet network config
```

---

## 📝 DETAILED IMPLEMENTATION PLAN

### Phase 1: Base Testnet Configuration & Deployment

**1.1 Add Base Testnet to Hardhat**
```javascript
// hardhat.config.js
networks: {
    baseTestnet: {
        url: process.env.BASE_TESTNET_RPC || "https://sepolia.base.org",
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        chainId: 84532,
        gasPrice: "auto",
    }
}
```

**1.2 Add Base Testnet to Privy**
```typescript
// packages/web/src/lib/privy.ts
supportedChains: [
    {
        id: 84532, // Base Sepolia testnet
        name: 'Base Sepolia',
        network: 'base-sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
            default: { http: ['https://sepolia.base.org'] },
            public: { http: ['https://sepolia.base.org'] }
        },
        blockExplorers: {
            default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' }
        }
    }
],
defaultChain: baseSepoliaChain
```

**1.3 Deploy GameEscrow to Base Testnet**
```bash
# Set environment variables
export PRIVATE_KEY=your_deployer_private_key
export BASE_TESTNET_RPC=https://sepolia.base.org

# Deploy contract
cd packages/contracts
npx hardhat run scripts/deploy-game-escrow.js --network baseTestnet

# Note deployed address for configuration
```

**1.4 Add USDC as Supported Token**
```javascript
// After deployment, add USDC
const USDC_BASE_TESTNET = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
await gameEscrow.addSupportedToken(USDC_BASE_TESTNET);
```

---

### Phase 2: Database Schema Updates

**2.1 Update Project Model**
```prisma
model Project {
  // ... existing fields

  // Blockchain multiplayer fields
  tokenAddress     String?  // ERC20 token for entry fee (e.g., USDC)
  entryFee         String?  // Entry fee in wei (stored as string)

  // ... rest of fields
}
```

**2.2 Run Migration**
```bash
cd packages/api
npx prisma migrate dev --name add_blockchain_game_fields
```

---

### Phase 3: Backend Implementation

**3.1 Update Blockchain Service for Base Testnet**

File: `packages/api/src/modules/blockchain/blockchain.service.ts`

```typescript
// Add Base testnet configuration
const BASE_TESTNET_RPC = process.env.BASE_TESTNET_RPC || "https://sepolia.base.org";
const GAME_ESCROW_ADDRESS = process.env.GAME_ESCROW_ADDRESS || "0x...";
const USDC_ADDRESS = process.env.USDC_BASE_TESTNET || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

this.baseProvider = new ethers.JsonRpcProvider(BASE_TESTNET_RPC);
```

**3.2 Add GameEscrow Contract Methods**

```typescript
// GameEscrow ABI import
import GameEscrowABI from "../../../contracts/abi/GameEscrow.json";

class BlockchainService {
    // New methods:

    async createGameEscrowGame(
        userId: string,
        tokenAddress: string,
        entryFee: string,
        minPlayers: number,
        maxPlayers: number,
        gameMode: number = 0 // WinnerTakesAll
    ): Promise<{ gameId: number, txHash: string }> {
        // 1. Get user's private key
        // 2. Create wallet with Base provider
        // 3. Call GameEscrow.createGame()
        // 4. Return blockchain game ID
    }

    async joinGameEscrowGame(
        userId: string,
        blockchainGameId: number
    ): Promise<{ txHash: string }> {
        // 1. Get user's private key
        // 2. Approve USDC spending (if not already approved)
        // 3. Call GameEscrow.joinGame()
        // 4. Return transaction hash
    }

    async getGameEscrowDetails(gameId: number): Promise<any> {
        // Read-only call to GameEscrow.getGame()
    }

    async reportGameResult(
        blockchainGameId: number,
        winners: string[],
        scores: number[]
    ): Promise<{ txHash: string }> {
        // Oracle function - requires ORACLE_ROLE
        // Calls GameEscrow.reportGameResult()
    }
}
```

**3.3 Add Blockchain Controller Endpoints**

File: `packages/api/src/modules/blockchain/blockchain.controller.ts`

```typescript
// New endpoints:

async createGameEscrowGame(req: AuthRequest, res: Response) {
    const { tokenAddress, entryFee, minPlayers, maxPlayers, gameMode } = req.body;
    const userId = req.user?.userId;

    const result = await blockchainService.createGameEscrowGame(
        userId, tokenAddress, entryFee, minPlayers, maxPlayers, gameMode
    );

    res.json({ success: true, data: result });
}

async joinGameEscrowGame(req: AuthRequest, res: Response) {
    const { blockchainGameId } = req.body;
    const userId = req.user?.userId;

    const result = await blockchainService.joinGameEscrowGame(userId, blockchainGameId);

    res.json({ success: true, data: result });
}
```

**3.4 Add Routes**

File: `packages/api/src/modules/blockchain/blockchain.routes.ts`

```typescript
router.post("/game-escrow/create", authMiddleware, blockchainController.createGameEscrowGame);
router.post("/game-escrow/join", authMiddleware, blockchainController.joinGameEscrowGame);
router.get("/game-escrow/:gameId", blockchainController.getGameEscrowDetails);
router.post("/game-escrow/report-result", authMiddleware, blockchainController.reportGameResult);
```

---

### Phase 4: Frontend Implementation

**4.1 Update Project Settings Page**

File: `packages/web/src/app/projects/[id]/page.tsx`

Add fields to edit form:
```typescript
// In edit mode form:
{isMultiplayer && (
    <>
        <div>
            <label>Token for Entry Fee</label>
            <select value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)}>
                <option value="">Select Token</option>
                <option value={USDC_BASE_TESTNET}>USDC (Base Testnet)</option>
            </select>
        </div>

        <div>
            <label>Entry Fee (in tokens)</label>
            <input
                type="number"
                step="0.01"
                value={entryFeeDisplay}
                onChange={(e) => {
                    const fee = parseFloat(e.target.value);
                    setEntryFee(ethers.parseUnits(fee.toString(), 6)); // USDC has 6 decimals
                }}
            />
        </div>
    </>
)}
```

**4.2 Update Room Creation Flow**

File: `packages/web/src/components/rooms/RoomLobby.tsx`

```typescript
const handleCreateRoom = async () => {
    // 1. Check if project requires blockchain game
    if (project.isMultiplayer && project.tokenAddress && project.entryFee) {
        setIsCreating(true);

        try {
            // 2. Create blockchain game first
            const blockchainResult = await createGameEscrowGame({
                tokenAddress: project.tokenAddress,
                entryFee: project.entryFee,
                minPlayers: project.minPlayers,
                maxPlayers: project.maxPlayers,
                gameMode: 0, // WinnerTakesAll
            }, token);

            const blockchainGameId = blockchainResult.gameId;

            // 3. Create room with blockchain game ID
            const newRoom = await createRoom({
                projectId,
                hostId: user.id,
                maxPlayers: project.maxPlayers,
                blockchainGameId: blockchainGameId.toString(),
            }, token);

            router.push(`/rooms/${newRoom.id}`);
        } catch (error) {
            console.error("Failed to create blockchain game:", error);
            setError("Failed to create blockchain game. Please try again.");
        } finally {
            setIsCreating(false);
        }
    } else {
        // Regular non-blockchain room creation
        // ... existing code
    }
};
```

**4.3 Update Join Room Flow**

File: `packages/web/src/components/rooms/RoomLobby.tsx`

```typescript
const handleJoinRoom = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);

    // Check if this is a blockchain game
    if (room.blockchainGameId) {
        setIsJoining(true);

        try {
            // 1. Get token info
            const project = room.project;
            const tokenAddress = project.tokenAddress;
            const entryFee = project.entryFee;

            // 2. Check user balance
            const balance = await getTokenBalance(user.walletAddress, tokenAddress);
            if (BigInt(balance) < BigInt(entryFee)) {
                throw new Error("Insufficient token balance");
            }

            // 3. Approve token spending
            await approveToken(tokenAddress, GAME_ESCROW_ADDRESS, entryFee, token);

            // 4. Join blockchain game
            await joinGameEscrowGame(room.blockchainGameId, token);

            // 5. Join room on backend
            await joinRoom(roomId, user.id, user.walletAddress, undefined, token);

            // 6. Redirect to room
            router.push(`/rooms/${roomId}`);
        } catch (error) {
            console.error("Failed to join blockchain game:", error);
            setError(error.message || "Failed to join game. Please try again.");
        } finally {
            setIsJoining(false);
        }
    } else {
        // Regular non-blockchain room join
        // ... existing code
    }
};
```

**4.4 Add Blockchain API Functions**

File: `packages/web/src/lib/blockchain-api.ts`

```typescript
// GameEscrow functions

export async function createGameEscrowGame(
    data: {
        tokenAddress: string;
        entryFee: string;
        minPlayers: number;
        maxPlayers: number;
        gameMode: number;
    },
    token: string
): Promise<{ gameId: number; txHash: string }> {
    const response = await fetch(`${API_URL}/blockchain/game-escrow/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
}

export async function joinGameEscrowGame(
    blockchainGameId: string,
    token: string
): Promise<{ txHash: string }> {
    const response = await fetch(`${API_URL}/blockchain/game-escrow/join`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ blockchainGameId }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
}

export async function approveToken(
    tokenAddress: string,
    spender: string,
    amount: string,
    token: string
): Promise<{ txHash: string }> {
    // Call existing approve endpoint or create new one
    const response = await fetch(`${API_URL}/blockchain/approve`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ tokenAddress, spender, amount }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
}

export async function getTokenBalance(
    address: string,
    tokenAddress: string
): Promise<string> {
    const response = await fetch(
        `${API_URL}/blockchain/token-balance/${address}/${tokenAddress}`
    );
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data.balance;
}
```

**4.5 Add Next.js API Routes**

File: `packages/web/src/app/api/blockchain/game-escrow/create/route.ts`

```typescript
export async function POST(req: Request) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const body = await req.json();

    const response = await fetch(`${BACKEND_API_URL}/blockchain/game-escrow/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    const result = await response.json();
    return Response.json(result);
}
```

(Similar routes for join, get-details, etc.)

---

### Phase 5: Wallet Signature Handling

**5.1 Support External Wallets**

File: `packages/web/src/contexts/AuthContext.tsx`

```typescript
// Detect wallet type
const walletType = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;

    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    const externalWallet = wallets.find(w =>
        w.walletClientType === 'metamask' ||
        w.walletClientType === 'coinbase_wallet'
    );

    return externalWallet ? 'external' : 'embedded';
}, [wallets]);

// Provide wallet type in context
<AuthContext.Provider value={{ user, token, walletType, ... }}>
```

**5.2 Update Blockchain Service for External Wallets**

File: `packages/api/src/modules/blockchain/blockchain.service.ts`

```typescript
async createGameEscrowGame(userId: string, data: any, signedTx?: string) {
    if (signedTx) {
        // External wallet: Transaction already signed by frontend
        const txResponse = await this.baseProvider.broadcastTransaction(signedTx);
        await txResponse.wait();
        return { gameId: parsedGameId, txHash: txResponse.hash };
    } else {
        // Embedded wallet: Backend signs with private key
        const privateKey = this.getPrivateKeyFromFile(userId);
        const wallet = new ethers.Wallet(privateKey, this.baseProvider);
        // ... existing signing logic
    }
}
```

**5.3 Frontend Signing for External Wallets**

File: `packages/web/src/lib/blockchain-api.ts`

```typescript
export async function createGameEscrowGame(data, token, useExternalWallet = false) {
    if (useExternalWallet) {
        // Use Privy's wallet to sign transaction
        const { wallets } = usePrivy(); // Access via hook
        const wallet = wallets[0];
        const provider = await wallet.getEthereumProvider();

        // Build unsigned transaction
        const tx = {
            to: GAME_ESCROW_ADDRESS,
            data: gameEscrow.interface.encodeFunctionData('createGame', [...params]),
            value: 0,
        };

        // Request signature from user's wallet
        const signedTx = await provider.request({
            method: 'eth_sendTransaction',
            params: [tx],
        });

        // Send signed tx to backend
        return await fetch(`${API_URL}/blockchain/game-escrow/create`, {
            method: "POST",
            body: JSON.stringify({ ...data, signedTx }),
            headers: { "Authorization": `Bearer ${token}` }
        });
    } else {
        // Backend signs (embedded wallet)
        // ... existing code
    }
}
```

---

### Phase 6: Validation & Edge Cases

**6.1 Validations to Add**

Frontend validations:
- [ ] Check user has sufficient token balance before creating/joining
- [ ] Check token approval allowance before joining
- [ ] Validate entry fee > 0 for blockchain games
- [ ] Validate min/max players match blockchain game limits
- [ ] Show loading states during blockchain transactions
- [ ] Display transaction confirmations

Backend validations:
- [ ] Verify blockchain game exists before linking to room
- [ ] Check blockchain game status before allowing joins
- [ ] Validate player is not already in blockchain game
- [ ] Ensure oracle role is set up for result reporting
- [ ] Rate limit blockchain operations to prevent spam

**6.2 Error Handling**

Common errors to handle:
- Insufficient balance
- Transaction rejected by user
- Gas estimation failure
- Network congestion/timeout
- Contract revert (game full, already joined, etc.)
- Blockchain out of sync with backend state

**6.3 Edge Cases**

- User leaves room before game starts → Refund via blockchain
- Room cancelled by host → Cancel blockchain game, refund all
- Player disconnects mid-game → Handle reconnection, don't re-charge
- Blockchain transaction pending → Show pending state, poll for confirmation
- Oracle fails to report results → Manual intervention needed

---

### Phase 7: Testing Plan

**7.1 Unit Tests**
- [ ] BlockchainService.createGameEscrowGame()
- [ ] BlockchainService.joinGameEscrowGame()
- [ ] BlockchainService.reportGameResult()
- [ ] RoomService.createRoom() with blockchain
- [ ] Token approval logic

**7.2 Integration Tests**
- [ ] Full flow: Create project → Create room → Join → Start → End
- [ ] Payment flow: Approve → Pay → Verify on-chain
- [ ] Refund flow: Cancel room → Verify refunds
- [ ] Oracle flow: Report results → Verify prizes distributed

**7.3 End-to-End Testing Steps**

1. Deploy GameEscrow to Base testnet
2. Get test USDC from Base faucet
3. Create test user accounts with Privy
4. Create multiplayer project with USDC entry fee
5. Create game room (blockchain game created)
6. Join room with second user (pays entry fee)
7. Start game
8. End game and report results
9. Verify prizes distributed correctly

---

## 🔐 SECURITY CONSIDERATIONS

1. **Private Key Storage**
   - Current: Temp files (hackathon/MVP only)
   - Production: Use KMS, Hardware Security Modules, or backend signing service
   - Never expose private keys to frontend

2. **Transaction Signing**
   - For embedded wallets: Backend signs after user authorization
   - For external wallets: Frontend requests signature via Privy
   - Always validate transaction parameters before signing

3. **Role-Based Access**
   - Oracle role: Only backend should have this role
   - Admin role: Separate admin wallet, not user wallets
   - Emergency role: Cold storage wallet for emergencies

4. **Rate Limiting**
   - Limit game creation per user per hour
   - Limit join attempts to prevent spam
   - Gas limit checks to prevent DoS

5. **Input Validation**
   - Validate all user inputs before blockchain calls
   - Check entry fee bounds (min/max)
   - Validate player counts against contract limits
   - Sanitize addresses

---

## 📦 DEPLOYMENT CHECKLIST

**Contracts:**
- [ ] Deploy GameEscrow to Base testnet
- [ ] Verify contract on BaseScan
- [ ] Grant oracle role to backend wallet
- [ ] Add USDC as supported token
- [ ] Set TVL limits
- [ ] Test all contract functions

**Backend:**
- [ ] Update environment variables (Base RPC, contract addresses)
- [ ] Run database migrations
- [ ] Deploy updated API
- [ ] Test all new endpoints
- [ ] Configure oracle wallet with sufficient gas

**Frontend:**
- [ ] Update Privy config with Base testnet
- [ ] Update environment variables
- [ ] Deploy updated web app
- [ ] Test wallet connection (embedded + external)
- [ ] Test full user flow

**Documentation:**
- [ ] Update README with Base testnet instructions
- [ ] Document blockchain game flow for users
- [ ] Create troubleshooting guide
- [ ] Update API documentation

---

## 🎯 SUCCESS CRITERIA

The integration is successful when:

1. ✅ Users can log in with Privy using Base testnet
2. ✅ Users can create multiplayer projects with USDC entry fees
3. ✅ Creating a game room creates an on-chain GameEscrow game
4. ✅ Players can join rooms by paying the entry fee
5. ✅ Payments are handled on-chain via GameEscrow contract
6. ✅ Games can start when minimum players joined
7. ✅ Oracle reports game results correctly
8. ✅ Prizes are distributed automatically on-chain
9. ✅ Both embedded and external wallets work correctly
10. ✅ Edge cases are handled gracefully (cancellations, refunds, errors)

---

## 📅 ESTIMATED TIMELINE

- **Phase 1** (Config & Deployment): 1-2 hours
- **Phase 2** (Database): 30 minutes
- **Phase 3** (Backend): 3-4 hours
- **Phase 4** (Frontend): 4-5 hours
- **Phase 5** (Wallet Handling): 2-3 hours
- **Phase 6** (Validation): 2 hours
- **Phase 7** (Testing): 3-4 hours

**Total Estimate**: 16-21 hours of development

---

## 🚀 NEXT STEPS

1. Review this plan with stakeholders
2. Get approval to proceed
3. Set up Base testnet access (RPC, faucets)
4. Execute phases in order
5. Test thoroughly after each phase
6. Deploy to production when ready

---

**Plan Status**: ✅ READY FOR EXECUTION
**Last Updated**: 2025-10-21
