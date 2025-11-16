# Smart Contracts for Scratch Blockchain Games

This package contains the EVM smart contracts for the Scratch blockchain gaming platform.

## Contracts

### GameEscrow - Production-Grade Game Escrow System

A comprehensive, secure escrow contract for managing multiplayer blockchain games with multiple game modes, prize distribution, and advanced security features.

**Key Features:**

- **Multiple Game Modes:**
  - Winner Takes All: Single winner gets entire prize pool
  - Team Battle: Team-based competitions with winner team splitting prizes
  - Free For All: Multiple winners share prize pool
  - Score-Based: Prize distribution based on player scores

- **Security & Safety:**
  - Role-based access control (Admin, Oracle, Emergency roles)
  - Reentrancy protection
  - Pausable functionality for emergency situations
  - TVL (Total Value Locked) circuit breakers
  - Emergency withdrawal system
  - Comprehensive rate limiting and anti-griefing measures

- **Advanced Features:**
  - Support for multiple ERC20 tokens
  - Native ETH support
  - Flexible prize distribution with custom percentages
  - Automatic game state management
  - Player score tracking and verification
  - Cooldown periods between game joins
  - Daily game creation limits per player
  - Cancellation with automatic refunds
  - Team-based games with configurable team sizes

- **Token Management:**
  - Support for any ERC20 token (admin-approved)
  - Configurable entry fees per game
  - Platform fee system
  - Emergency token recovery

**Game Flow:**

1. Admin adds supported ERC20 tokens to whitelist
2. Creator creates a game with parameters (mode, entry fee, player limits, team sizes)
3. Players join by depositing the entry fee
4. Game automatically starts when minimum players reached or creator manually starts
5. Oracle reports game results (winners, scores, team assignments)
6. Smart contract automatically distributes prizes based on game mode
7. Players can cancel and refund if game hasn't started
8. Emergency pause available for critical issues

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your environment variables:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

## Testing

The GameEscrow contract includes a comprehensive test suite with 59 tests covering all functionality:

```bash
# Run all tests
npm test

# Run GameEscrow tests specifically
npx hardhat test test/GameEscrow.test.js

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npx hardhat coverage
```

**Test Coverage:**
- ✅ Deployment (3 tests)
- ✅ Token Management (3 tests)
- ✅ Game Creation (5 tests)
- ✅ Joining Games (6 tests)
- ✅ Team Battle Games (2 tests)
- ✅ Game Results & Payouts (10 tests)
- ✅ Game Cancellation & Refunds (7 tests)
- ✅ Withdrawals (6 tests)
- ✅ Emergency Functions (4 tests)
- ✅ Admin Functions (3 tests)
- ✅ View Functions (5 tests)
- ✅ TVL Circuit Breakers (2 tests)
- ✅ Rate Limiting (2 tests)

**Total: 59 passing tests**

## Deployment

### Local Network (Hardhat)

```bash
# Start local Hardhat node
npx hardhat node

# Deploy GameEscrow to local network (in another terminal)
npx hardhat run scripts/deploy-game-escrow.js --network localhost
```

The deployment script will:
- Deploy the GameEscrow contract
- Set up roles (Admin, Oracle, Emergency)
- Configure TVL limits
- Deploy MockERC20 for testing (local network only)
- Save deployment info to `deployments/` directory

### Sepolia Testnet

```bash
npx hardhat run scripts/deploy-game-escrow.js --network sepolia
```

### Polkadot Asset Hub (Westend Testnet)

```bash
npx hardhat run scripts/deploy-game-escrow.js --network polkadotAssetHubTestnet
```

### Polkadot Asset Hub (Mainnet)

```bash
npx hardhat run scripts/deploy-game-escrow.js --network polkadotAssetHub
```

### Mainnet

```bash
npx hardhat run scripts/deploy-game-escrow.js --network mainnet
```

## Verification

After deployment, verify your contracts on the block explorer:

```bash
# Verify GameEscrow
npx hardhat verify --network sepolia <GAME_ESCROW_ADDRESS>

# For Polkadot Asset Hub, verification may not be available yet
```

## Post-Deployment Configuration

After deploying GameEscrow, you'll need to configure it:

### 1. Add Supported Tokens

```javascript
// Add ERC20 token to whitelist (requires ADMIN_ROLE)
await gameEscrow.addSupportedToken(tokenAddress);

// Check if a token is supported
const isSupported = await gameEscrow.isSupportedToken(tokenAddress);
```

### 2. Grant Roles to Other Addresses

```javascript
const ORACLE_ROLE = await gameEscrow.ORACLE_ROLE();
const EMERGENCY_ROLE = await gameEscrow.EMERGENCY_ROLE();

// Grant oracle role to your backend service
await gameEscrow.grantRole(ORACLE_ROLE, oracleAddress);

// Grant emergency role to trusted address
await gameEscrow.grantRole(EMERGENCY_ROLE, emergencyAddress);

// Revoke roles if needed
await gameEscrow.revokeRole(ORACLE_ROLE, oldOracleAddress);
```

### 3. Configure TVL Limits

```javascript
// Set maximum total value locked (e.g., 1 million tokens)
await gameEscrow.setMaxTVLLimit(ethers.parseEther("1000000"));

// Check current TVL
const currentTVL = await gameEscrow.totalValueLocked();
const maxTVL = await gameEscrow.maxTVLLimit();
```

### 4. Emergency Controls

```javascript
// Pause all game operations
await gameEscrow.pause();

// Resume operations
await gameEscrow.unpause();

// Emergency withdraw tokens (if needed)
await gameEscrow.emergencyWithdraw(tokenAddress, recipientAddress);
```

## Contract Addresses

After deployment, the script saves deployment information to `deployments/game-escrow-{chainId}-{timestamp}.json`.

Update your application configuration with the deployed addresses:

```javascript
// Example: packages/web/.env
NEXT_PUBLIC_GAME_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_SUPPORTED_TOKEN_ADDRESS=0x...
```

## Integration Examples

### Creating a Game

```javascript
import { ethers } from "ethers";

// Connect to GameEscrow contract
const gameEscrow = new ethers.Contract(
  GAME_ESCROW_ADDRESS,
  GameEscrowABI,
  signer
);

// Approve token spending first
const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
const entryFee = ethers.parseEther("10"); // 10 tokens
await token.approve(GAME_ESCROW_ADDRESS, entryFee);

// Create a Winner Takes All game
const tx = await gameEscrow.createGame(
  TOKEN_ADDRESS,           // token address
  entryFee,               // entry fee (10 tokens)
  2,                      // min players
  4,                      // max players
  0,                      // game mode (0 = WinnerTakesAll)
  2,                      // teams (0 for non-team games)
  [100],                  // prize percentages (100% to winner)
  ethers.ZeroAddress      // creator (0x0 means msg.sender)
);
await tx.wait();
```

### Joining a Game

```javascript
// Approve token spending
const entryFee = ethers.parseEther("10");
await token.approve(GAME_ESCROW_ADDRESS, entryFee);

// Join game (gameId = 0, teamId = 0 for non-team games)
await gameEscrow.joinGame(0, 0);
```

### Reporting Game Results (Oracle)

```javascript
// Oracle reports game results
const gameId = 0;
const winners = [playerAddress1, playerAddress2]; // Winner addresses
const scores = [100, 75]; // Player scores
const teamAssignments = [0, 1]; // Team IDs (for team games)

await gameEscrow.reportGameResult(
  gameId,
  winners,
  scores,
  teamAssignments
);

// Contract automatically distributes prizes
```

### Checking Game Status

```javascript
// Get game details
const game = await gameEscrow.getGame(0);
console.log("Status:", game.status); // 0=Waiting, 1=Active, 2=Finished, 3=Cancelled

// Get player info
const playerInfo = await gameEscrow.getPlayerInfo(0, playerAddress);
console.log("Score:", playerInfo.score);
console.log("Team:", playerInfo.teamId);

// Get all active games
const activeGameIds = await gameEscrow.getActiveGames();
```

### Cancelling and Refunding

```javascript
// Creator or admin can cancel a game that hasn't started
await gameEscrow.cancelGame(0);

// Players automatically get refunded
```

## Security Considerations

### GameEscrow Security Features

1. **Access Control (OpenZeppelin)**:
   - Role-based permissions (ADMIN, ORACLE, EMERGENCY)
   - Only admins can add supported tokens and configure limits
   - Only oracles can report game results
   - Only emergency role can trigger emergency withdrawals

2. **Reentrancy Protection**:
   - All external calls protected with ReentrancyGuard
   - Checks-Effects-Interactions pattern followed

3. **Circuit Breakers**:
   - TVL (Total Value Locked) limits prevent over-exposure
   - Pausable functionality for emergency situations
   - Emergency withdrawal system for critical issues

4. **Rate Limiting & Anti-Griefing**:
   - 5-second cooldown between game joins per player
   - Maximum 100 games per day per player
   - Prevents spam and griefing attacks

5. **Input Validation**:
   - All parameters validated before processing
   - Token whitelist prevents malicious tokens
   - Prize percentages must sum to 100%
   - Player and team limits enforced

6. **Safe Token Handling**:
   - Uses OpenZeppelin's SafeERC20 for all token transfers
   - Prevents issues with non-standard ERC20 implementations

### Best Practices

1. **Private Keys**: Never commit `.env` file or expose private keys
2. **Contract Verification**: Always verify contracts on block explorers for transparency
3. **Audits**: Consider professional security audits before mainnet deployment with significant funds
4. **Testing**: Thoroughly test on testnets (Sepolia, Westend Asset Hub) before mainnet
5. **Role Management**:
   - Use separate addresses for Admin, Oracle, and Emergency roles
   - Consider using multi-sig wallets for critical roles
   - Regularly audit role assignments
6. **Monitoring**: Monitor contract events and TVL limits
7. **Gradual Rollout**: Start with low TVL limits and increase gradually
8. **Oracle Security**: Ensure oracle backend is secure and trusted

## Contract Architecture

```
GameEscrow
├── Access Control (OpenZeppelin)
│   ├── ADMIN_ROLE (configure contract)
│   ├── ORACLE_ROLE (report results)
│   └── EMERGENCY_ROLE (emergency actions)
├── Security
│   ├── ReentrancyGuard
│   ├── Pausable
│   └── SafeERC20
├── Game Modes
│   ├── WinnerTakesAll
│   ├── TeamBattle
│   ├── FreeForAll
│   └── ScoreBased
├── Circuit Breakers
│   ├── TVL Limits
│   └── Rate Limiting
└── State Management
    ├── Game Status (Waiting → Active → Finished/Cancelled)
    ├── Player Tracking
    └── Prize Distribution
```

## Contract Events

Monitor these events for off-chain integration:

```solidity
event GameCreated(uint256 indexed gameId, address indexed creator, GameMode mode);
event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 teamId);
event GameStarted(uint256 indexed gameId);
event GameFinished(uint256 indexed gameId, address[] winners);
event GameCancelled(uint256 indexed gameId);
event PrizeClaimed(uint256 indexed gameId, address indexed player, uint256 amount);
event TokenAdded(address indexed token);
event TokenRemoved(address indexed token);
event MaxTVLLimitUpdated(uint256 newLimit);
event EmergencyWithdrawal(address indexed token, address indexed to, uint256 amount);
```

## License

MIT

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x/)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Polkadot Asset Hub](https://wiki.polkadot.network/docs/learn-assets)
- [Solidity Documentation](https://docs.soliditylang.org/)
