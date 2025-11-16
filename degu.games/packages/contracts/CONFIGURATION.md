# Contract Configuration Guide

This document explains how the smart contracts are integrated with the Scratch GUI and how to configure them.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│   Web App       │         │   Scratch GUI    │         │   Blockchain        │
│  (Next.js)      │◄────────┤  (auth-manager)  │◄────────┤   (Sepolia/ETH)     │
│                 │         │                  │         │                     │
│  - Web3Auth     │         │  - ethers.js     │         │  - DEGU Token       │
│  - Login        │         │  - ERC20 calls   │         │  - SimpleBetting    │
│  - Provider     │         │  - Betting calls │         │  - Events           │
└─────────────────┘         └──────────────────┘         └─────────────────────┘
        │                            │                            │
        │                            │                            │
        └────────────────────────────┴────────────────────────────┘
                         Cross-Domain Session
```

## Contract ABIs

All contract ABIs are defined in `/packages/scratch-gui/src/lib/auth-manager.js`.

### ERC20 ABI

Used for token transfers, approvals, and balance checking:

```javascript
this.ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
];
```

**Functions:**
- `transfer(to, amount)` - Transfer tokens to an address
- `balanceOf(owner)` - Get token balance for an address
- `decimals()` - Get token decimals (usually 18)
- `symbol()` - Get token symbol (e.g., "DEGU")
- `approve(spender, amount)` - Approve spender to use tokens
- `allowance(owner, spender)` - Check approved allowance

### SimpleBetting ABI

Used for all betting game operations:

```javascript
this.BETTING_ABI = [
    'function createGame(address token, uint256 betAmount, uint256 minPlayers, uint256 maxPlayers) returns (uint256)',
    'function joinGame(uint256 gameId) payable',
    'function startGame(uint256 gameId)',
    'function selectWinners(uint256 gameId, address[] calldata winnerAddresses)',
    'function claimPrize(uint256 gameId)',
    'function cancelGame(uint256 gameId)',
    'function getGameDetails(uint256 gameId) view returns (...)',
    'function getPlayers(uint256 gameId) view returns (address[])',
    'function getWinners(uint256 gameId) view returns (address[])',
    'function hasPlayerJoined(uint256 gameId, address player) view returns (bool)',
    'function hasWinnerClaimed(uint256 gameId, address winner) view returns (bool)',
    'function getTotalGames() view returns (uint256)',

    // Events
    'event GameCreated(uint256 indexed gameId, address indexed creator, address token, uint256 betAmount, uint256 minPlayers, uint256 maxPlayers)',
    'event PlayerJoined(uint256 indexed gameId, address indexed player)',
    'event GameStarted(uint256 indexed gameId)',
    'event WinnersSelected(uint256 indexed gameId, address[] winners)',
    'event PrizeClaimed(uint256 indexed gameId, address indexed winner, uint256 amount)'
];
```

**Functions:**
- `createGame()` - Create new betting game, returns gameId
- `joinGame()` - Join existing game (ETH or ERC20)
- `startGame()` - Start game (creator only)
- `selectWinners()` - Select winners (creator only)
- `claimPrize()` - Claim prize (winners only)
- `cancelGame()` - Cancel game and refund (creator only, open games)
- `getGameDetails()` - Get full game information
- `getPlayers()` - Get array of player addresses
- `getWinners()` - Get array of winner addresses

**Events:**
- `GameCreated` - Emitted when game is created
- `PlayerJoined` - Emitted when player joins
- `GameStarted` - Emitted when game starts
- `WinnersSelected` - Emitted when winners are selected
- `PrizeClaimed` - Emitted when winner claims prize

## Contract Addresses

Contract addresses are configured in `auth-manager.js` constructor:

```javascript
// ERC20 Token Contracts on Sepolia Testnet
this.TOKEN_CONTRACTS = {
    DEGU: '0x0000000000000000000000000000000000000000', // Replace after deployment
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    USDT: '0x0000000000000000000000000000000000000000', // Replace if needed
    ETH: null // Native token, no contract address
};

// SimpleBetting contract address
this.BETTING_CONTRACT = '0x0000000000000000000000000000000000000000'; // Replace after deployment
```

**To update after deployment:**

1. Deploy contracts (see DEPLOYMENT_GUIDE.md)
2. Copy deployed addresses
3. Update `TOKEN_CONTRACTS.DEGU` with DEGU token address
4. Update `BETTING_CONTRACT` with SimpleBetting address
5. Restart Scratch GUI

## Auth Manager Methods

The `AuthManager` class provides these blockchain methods:

### Token Operations

#### `transferERC20(tokenSymbol, toAddress, amount)`
Transfer ERC20 tokens or native ETH.

**Parameters:**
- `tokenSymbol` (string) - Token symbol: 'DEGU', 'USDC', 'USDT', 'ETH'
- `toAddress` (string) - Recipient address (0x...)
- `amount` (string|number) - Amount in token units (e.g., 10 = 10 DEGU)

**Returns:**
```javascript
{
    success: true,
    hash: "0x...",
    blockNumber: 12345,
    from: "0x...",
    to: "0x...",
    amount: "10",
    token: "DEGU"
}
```

**Example:**
```javascript
const result = await authManager.transferERC20('DEGU', '0x123...', 100);
if (result.success) {
    console.log('Transfer successful:', result.hash);
}
```

#### `getTokenBalance(tokenSymbol, address)`
Get token balance for an address.

**Parameters:**
- `tokenSymbol` (string) - Token symbol
- `address` (string) - Address to check (optional, defaults to current user)

**Returns:** Balance as string (e.g., "100.5")

**Example:**
```javascript
const balance = await authManager.getTokenBalance('DEGU', '0x123...');
console.log(`Balance: ${balance} DEGU`);
```

### Betting Operations

#### `createBettingGame(tokenSymbol, betAmount, minPlayers, maxPlayers)`
Create a new betting game.

**Parameters:**
- `tokenSymbol` (string) - Token to bet with
- `betAmount` (string|number) - Bet amount per player
- `minPlayers` (number) - Minimum players to start
- `maxPlayers` (number) - Maximum players allowed

**Returns:**
```javascript
{
    success: true,
    gameId: "0",
    hash: "0x...",
    blockNumber: 12345
}
```

**Example:**
```javascript
const result = await authManager.createBettingGame('DEGU', 100, 2, 4);
console.log('Game created:', result.gameId);
```

#### `joinBettingGame(gameId, tokenSymbol, betAmount)`
Join an existing betting game.

**Parameters:**
- `gameId` (number) - Game ID to join
- `tokenSymbol` (string) - Token symbol (for approval)
- `betAmount` (string|number) - Bet amount

**Returns:**
```javascript
{
    success: true,
    hash: "0x...",
    blockNumber: 12345
}
```

**Note:** For ERC20 tokens, this automatically approves tokens first.

#### `startBettingGame(gameId)`
Start a betting game (creator only).

**Parameters:**
- `gameId` (number) - Game ID to start

**Returns:**
```javascript
{
    success: true,
    hash: "0x..."
}
```

#### `selectBettingWinners(gameId, winnerAddresses)`
Select winners for a game (creator only).

**Parameters:**
- `gameId` (number) - Game ID
- `winnerAddresses` (array) - Array of winner addresses

**Returns:**
```javascript
{
    success: true,
    hash: "0x...",
    winners: ["0x...", "0x..."]
}
```

**Example:**
```javascript
// Single winner
await authManager.selectBettingWinners(0, ['0x123...']);

// Multiple winners
await authManager.selectBettingWinners(0, ['0x123...', '0x456...']);
```

#### `claimBettingPrize(gameId)`
Claim prize from a game (winners only).

**Parameters:**
- `gameId` (number) - Game ID

**Returns:**
```javascript
{
    success: true,
    hash: "0x..."
}
```

#### `getBettingGameDetails(gameId)`
Get full game information.

**Parameters:**
- `gameId` (number) - Game ID

**Returns:**
```javascript
{
    creator: "0x...",
    token: "0x...",
    betAmount: "100",
    minPlayers: 2,
    maxPlayers: 4,
    status: 0, // 0=Open, 1=InProgress, 2=Completed, 3=Cancelled
    currentPlayers: 2,
    totalPot: "200",
    players: ["0x...", "0x..."],
    winners: []
}
```

#### `cancelBettingGame(gameId)`
Cancel a game and refund all players (creator only, open games only).

**Parameters:**
- `gameId` (number) - Game ID

**Returns:**
```javascript
{
    success: true,
    hash: "0x..."
}
```

## Scratch Blocks Integration

All blockchain operations are exposed as Scratch blocks in the blockchain extension:

### Available Blocks

**Command Blocks (actions):**
- `transfer [AMOUNT] [TOKEN] to [ADDRESS]`
- `create betting game with [AMOUNT] [TOKEN] bet, [MIN] to [MAX] players`
- `join betting game [GAMEID]`
- `start betting game [GAMEID]`
- `select [ADDRESS] as winner of game [GAMEID]`
- `claim prize from game [GAMEID]`

**Reporter Blocks (return values):**
- `my wallet address`
- `my username`
- `balance of [TOKEN] for [ADDRESS]`
- `game [GAMEID] [INFO]` - Get game status, bet amount, players, etc.

**Boolean Blocks (conditions):**
- `wallet [ADDRESS] has [AMOUNT] [TOKEN]?`
- `player [ADDRESS] has joined?`

### Game Pause Behavior

All blockchain transactions **pause the game** during execution:

```javascript
async transfer(args) {
    // Store pause state
    const wasPaused = this.runtime.ioDevices.clock._paused;

    // Pause game
    if (!wasPaused) {
        this.runtime.emit('PROJECT_RUN_STOP');
    }

    // Execute transaction and wait
    const result = await authManager.transferERC20(...);

    // Resume game
    if (!wasPaused) {
        this.runtime.emit('PROJECT_RUN_START');
    }
}
```

This ensures:
- Game waits for transaction confirmation
- User sees loading/waiting state
- No race conditions with game logic
- Proper error handling before resuming

## Events

The blockchain extension emits custom events you can listen for:

```javascript
runtime.on('BLOCKCHAIN_TRANSFER_SUCCESS', (result) => {
    console.log('Transfer completed:', result.hash);
});

runtime.on('BLOCKCHAIN_GAME_CREATED', (result) => {
    console.log('Game created:', result.gameId);
});

runtime.on('BLOCKCHAIN_WINNERS_SELECTED', (result) => {
    console.log('Winners selected:', result.winners);
});

runtime.on('BLOCKCHAIN_PRIZE_CLAIMED', (result) => {
    console.log('Prize claimed:', result.hash);
});
```

## Error Handling

All methods return `{success: false, error: "message"}` on failure:

```javascript
const result = await authManager.transferERC20('DEGU', '0x123...', 100);

if (!result.success) {
    console.error('Transfer failed:', result.error);
    // Handle error
}
```

**Common errors:**
- `"Web3 provider not initialized"` - User not logged in
- `"User not authenticated"` - No auth token
- `"Transaction was rejected by user"` - User cancelled in wallet
- `"Insufficient funds for transaction"` - Not enough balance
- `"Contract address not configured"` - Missing contract address

## Environment-Specific Configuration

For production vs development:

```javascript
constructor() {
    this.API_URL = process.env.NODE_ENV === 'production'
        ? 'https://api.yourdomain.com/api/v1'
        : 'http://localhost:3000/api/v1';
}
```

Update for your environment:
- Development: Sepolia testnet
- Production: Ethereum mainnet or L2 (Arbitrum, Optimism, Polygon)

## Gas Optimization

Tips for reducing gas costs:

1. **Use L2 networks** (Arbitrum, Optimism) for lower fees
2. **Batch operations** where possible
3. **Approve once** with max uint256 for repeated operations
4. **Test on Sepolia** before mainnet to avoid costly mistakes

## Security Considerations

1. **Web3 Provider**: Never serialize or send provider over postMessage
2. **Private Keys**: Never exposed in frontend code
3. **Token Approvals**: Users approve each transaction in wallet
4. **Contract Verification**: Always verify contracts on Etherscan
5. **Event Validation**: Parse events from trusted contract only

## Testing

Test the integration with these steps:

1. **Setup**: Deploy contracts to Sepolia
2. **Configuration**: Update contract addresses
3. **Login**: Login with Web3Auth
4. **Balance Check**: Verify token balances
5. **Transfer**: Test token transfer
6. **Create Game**: Create betting game
7. **Join**: Join from another account
8. **Complete**: Start, select winner, claim prize

## Troubleshooting

### Provider Issues
```javascript
// Check if provider is available
console.log('Provider:', window.__WEB3_PROVIDER__);
console.log('Auth Manager:', window.authManager);
```

### Transaction Monitoring
```javascript
// Watch transaction on Etherscan
const hash = result.hash;
console.log(`https://sepolia.etherscan.io/tx/${hash}`);
```

### Contract Call Debugging
```javascript
// Enable detailed logging
window.authManager.debugMode = true;
```

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Web3Auth Docs](https://web3auth.io/docs/)
