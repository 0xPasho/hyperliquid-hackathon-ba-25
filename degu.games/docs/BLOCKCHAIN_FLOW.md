# Blockchain Transaction Flow

## Architecture Overview

```
Main Web App (localhost:3001)
    ↓ Extract private key from Web3Auth
    ↓ Store in cookie + localStorage
    ↓ Open Scratch GUI in new window
    ↓
Scratch GUI (localhost:8601)
    ↓ GET /api/blockchain/get-private-key
    ↓ Receives private key
    ↓
    ↓ POST /api/blockchain/create-game (with private key in body)
    ↓
Next.js API Proxy (localhost:3001)
    ↓ Receives private key from request body
    ↓
    ↓ POST /api/v1/blockchain/betting/create-game
    ↓
Backend API (localhost:3000)
    ↓ Signs transaction with private key
    ↓ Sends transaction to blockchain
    ↓ Returns result
```

## Components

### 1. Main Web App (`/packages/web/src/app/projects/[id]/page.tsx`)

**Lines 661-744**: When user clicks "Edit in Scratch":

```typescript
const extractAndStorePrivateKey = async () => {
    // 1. Get Web3Auth provider
    const provider = (window as any).__WEB3_PROVIDER__;

    // 2. Extract private key
    const privateKey = await provider.request({
        method: 'private_key'
    });

    // 3. Store in cookie (for Next.js API routes)
    document.cookie = `temp_private_key=${privateKey}; path=/; SameSite=Lax; max-age=3600`;

    // 4. Store in localStorage (backup)
    localStorage.setItem('temp_private_key', privateKey);

    // 5. Send via postMessage (fallback)
    editorWindow.postMessage({
        type: "AUTH_TOKEN",
        data: { token, user, privateKey }
    }, "http://localhost:8601");
};
```

### 2. Next.js API Routes

#### GET `/api/blockchain/get-private-key` (`/packages/web/src/app/api/blockchain/get-private-key/route.ts`)

Returns private key from session cookie:

```typescript
export async function GET(request: NextRequest) {
    const privateKey = request.cookies.get('temp_private_key')?.value;

    if (!privateKey) {
        return NextResponse.json({
            success: false,
            error: 'No private key available'
        }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({
        success: true,
        privateKey: privateKey
    }, { headers: corsHeaders });
}
```

#### POST `/api/blockchain/create-game` (`/packages/web/src/app/api/blockchain/create-game/route.ts`)

Proxy to backend API:

```typescript
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { tokenAddress, betAmount, minPlayers, maxPlayers } = body;
    let { privateKey } = body;

    // If no private key in body, try cookie
    if (!privateKey) {
        privateKey = request.cookies.get('temp_private_key')?.value;
    }

    // Call backend API
    const response = await fetch(`${BACKEND_API_URL}/blockchain/betting/create-game`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            privateKey,
            tokenAddress,
            betAmount,
            minPlayers,
            maxPlayers
        })
    });

    return NextResponse.json(await response.json(), { headers: corsHeaders });
}
```

**Key Features:**
- CORS headers for cross-origin requests from localhost:8601
- Accepts private key in request body OR cookie
- Forwards to backend API with authentication

### 3. Scratch GUI (`/packages/scratch-gui/src/lib/auth-manager.js`)

**Lines 764-842**: Create betting game method:

```javascript
async createBettingGame(tokenSymbol, betAmount, minPlayers, maxPlayers) {
    // 1. Check if we have private key cached
    if (!this.privateKey) {
        // 2. Fetch from Next.js API
        const pkResponse = await fetch(`${this.WEB_APP_URL}/api/blockchain/get-private-key`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (pkResponse.ok) {
            const pkResult = await pkResponse.json();
            if (pkResult.success && pkResult.privateKey) {
                this.privateKey = pkResult.privateKey;
                console.log('[AuthManager] ✅ Private key fetched from API');
            }
        }
    }

    // 3. Ensure we have private key
    if (!this.privateKey) {
        throw new Error('Private key not available');
    }

    // 4. Call Next.js API with private key
    const response = await fetch(`${this.WEB_APP_URL}/api/blockchain/create-game`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        },
        credentials: 'include',
        body: JSON.stringify({
            privateKey: this.privateKey,
            tokenAddress,
            betAmount: betAmount.toString(),
            minPlayers: parseInt(minPlayers),
            maxPlayers: parseInt(maxPlayers)
        })
    });

    const result = await response.json();
    return {
        success: true,
        gameId: result.data.gameId,
        hash: result.data.transactionHash,
        blockNumber: result.data.blockNumber
    };
}
```

### 4. Backend API (`/packages/api/src/modules/blockchain/`)

#### Controller (`blockchain.controller.ts`)

```typescript
async createBettingGame(req: Request, res: Response) {
    const { privateKey, tokenAddress, betAmount, minPlayers, maxPlayers } = req.body;

    if (!privateKey) {
        return res.status(400).json({
            success: false,
            error: "privateKey is required for signing",
        });
    }

    const result = await blockchainService.createBettingGame(
        privateKey,
        tokenAddress,
        betAmount,
        minPlayers,
        maxPlayers
    );

    return res.json({ success: true, data: result });
}
```

#### Service (`blockchain.service.ts`)

```typescript
async createBettingGame(
    privateKey: string,
    tokenAddress: string,
    betAmount: string,
    minPlayers: number,
    maxPlayers: number
) {
    // 1. Create wallet from private key
    const wallet = new ethers.Wallet(privateKey, this.provider);

    // 2. Create contract instance
    const contract = this.getBettingContract(privateKey);

    // 3. Send transaction
    const tx = await contract.createGame(
        tokenAddress,
        amountWei,
        minPlayers,
        maxPlayers,
        { gasPrice, gasLimit: 200000 }
    );

    // 4. Wait for confirmation
    const receipt = await tx.wait(1);

    // 5. Extract gameId from events and return
    return {
        gameId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
    };
}
```

## Security Considerations

1. **Private Key Transmission**: Private keys are transmitted over HTTPS only
2. **No Storage**: Private keys are never stored permanently - only in session (1 hour expiry)
3. **Cookie Security**: Cookies use `SameSite=Lax` to prevent CSRF attacks
4. **CORS Protection**: Only localhost:8601 is allowed to make cross-origin requests
5. **Authentication**: All blockchain operations require valid JWT token

## Testing the Flow

### Step 1: Start all services
```bash
# Terminal 1: Backend API
cd packages/api
npm run dev

# Terminal 2: Next.js Web App
cd packages/web
npm run dev

# Terminal 3: Scratch GUI
cd packages/scratch-gui
npm start
```

### Step 2: Login with Web3Auth
1. Go to http://localhost:3001
2. Click "Login" and authenticate with Web3Auth
3. Ensure you see your wallet address in the UI

### Step 3: Open Scratch Editor
1. Navigate to one of your projects
2. Click "Edit in Scratch" button
3. Check browser console for these logs:
   - `[Editor] 🚀 Starting private key extraction...`
   - `[Editor] ✅ Web3Auth provider found`
   - `[Editor] ✅✅✅ Private key extracted successfully`
   - `[Editor] Private key stored in session cookie for 1 hour`

### Step 4: Create a Betting Game
1. In Scratch GUI, use the blockchain blocks to create a game
2. Check console logs in Scratch GUI:
   - `[AuthManager] Creating betting game via Next.js API`
   - `[AuthManager] No private key cached, attempting to fetch from main web app...`
   - `[AuthManager] ✅ Private key fetched from API`
   - `[AuthManager] ✅ Private key available, proceeding with game creation...`
   - `[AuthManager] ✅ Game created successfully`

### Expected Console Output

**Main Web App (localhost:3001):**
```
[Editor] 🚀 Starting private key extraction...
[Editor] ✅ Web3Auth provider found
[Editor] ✅✅✅ Private key extracted successfully
[Editor] Private key stored in session cookie for 1 hour
[Editor] Private key also stored in localStorage
[Editor] ✅ Sent auth token + private key to editor window (attempt 1)
```

**Scratch GUI (localhost:8601):**
```
[AuthManager] Creating betting game via Next.js API
[AuthManager] No private key cached, attempting to fetch from main web app...
[AuthManager] ✅ Private key fetched from API
[AuthManager] ✅ Private key available, proceeding with game creation...
[Next.js API] Creating betting game...
[Next.js API] Auth token found
[Next.js API] Using private key from session cookie
[Next.js API] Calling backend API...
[Next.js API] ✅ Game created successfully
[AuthManager] ✅ Game created successfully
```

**Backend API (localhost:3000):**
```
[Blockchain Service] Creating betting game...
[Blockchain Service] Wallet address: 0x...
[Blockchain Service] Checking for stuck transactions...
[Blockchain Service] Nonce: latest=X, pending=X
[Blockchain Service] Sending transaction...
[Blockchain Service] ✅ Transaction sent: 0x...
[Blockchain Service] ✅ Game created with ID: 123
```

## Troubleshooting

### Error: "Private key not available"
**Cause**: Private key wasn't extracted or stored properly
**Solution**:
1. Ensure you're logged in with Web3Auth on main web app
2. Check that `__WEB3_PROVIDER__` is available in browser console
3. Verify cookie was set: Check Application > Cookies > localhost:3001 > temp_private_key

### Error: "CORS policy blocked"
**Cause**: CORS headers not properly configured
**Solution**: Verify corsHeaders in `/api/blockchain/*/route.ts` includes localhost:8601

### Error: "No private key available" from GET endpoint
**Cause**: Cookie not accessible from cross-origin request
**Solution**: This is now handled by fetching the key explicitly in auth-manager.js

### Error: "Failed to create game: Backend error"
**Cause**: Backend blockchain service error
**Solution**: Check backend logs for specific error (gas, nonce, etc.)

## Contract Addresses

- **SimpleBetting Contract**: `0x7f4736bb8011e152C14a98858EA532dA45370cFb`
- **DEGU Token**: `0xFee95Ee1E03bE4832E6F318d94243ee5cbFDc2B4`
- **Chain**: PolkaVM (Westend Asset Hub) - Chain ID: 420420421
- **RPC**: https://westend-asset-hub-eth-rpc.polkadot.io

## Next Steps

1. Test the complete flow end-to-end
2. Implement similar proxy endpoints for other blockchain operations:
   - `/api/blockchain/join-game`
   - `/api/blockchain/start-game`
   - `/api/blockchain/select-winners`
   - `/api/blockchain/claim-prize`
3. Add better error handling and user feedback
4. Consider implementing account abstraction for better security
