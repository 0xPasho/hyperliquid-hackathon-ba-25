# Deployment Guide for Scratch Blockchain Contracts

This guide will walk you through deploying the DEGU token and SimpleBetting contracts, and integrating them with your Scratch game.

## Prerequisites

- Node.js and npm installed
- MetaMask or compatible wallet
- Sepolia testnet ETH for gas fees (get from [Sepolia faucet](https://sepoliafaucet.com/))
- Private key for deployment wallet
- Etherscan API key (for verification)

## Step 1: Configure Environment

1. Navigate to the contracts directory:
```bash
cd packages/contracts
```

2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Fill in your environment variables in `.env`:
```env
# RPC URLs (get from Infura, Alchemy, or other providers)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID

# Deployer wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**⚠️ SECURITY WARNING**: Never commit your `.env` file to git!

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Compile Contracts

```bash
npx hardhat compile
```

You should see output like:
```
Compiled 29 Solidity files successfully
```

## Step 4: Run Tests (Optional but Recommended)

Before deploying to testnet or mainnet, verify everything works:

```bash
npm test
```

This will run all tests for both DeguToken and SimpleBetting contracts.

## Step 5: Deploy to Sepolia Testnet

Deploy both contracts to Sepolia:

```bash
npm run deploy:sepolia
```

You should see output like:
```
Starting deployment...

Deploying contracts with account: 0x...
Account balance: 0.5 ETH

Deploying DEGU Token...
✅ DEGU Token deployed to: 0xABCDEF1234567890...
   Initial supply: 10000000 DEGU
   Total supply: 10000000.0 DEGU

Deploying SimpleBetting contract...
✅ SimpleBetting deployed to: 0x123456789ABCDEF0...
   Fee collector: 0x...
   Platform fee: 200 basis points ( 2 %)

========== Deployment Summary ==========
Network: sepolia
Chain ID: 11155111

DEGU Token: 0xABCDEF1234567890...
SimpleBetting: 0x123456789ABCDEF0...
```

**📝 IMPORTANT**: Save these contract addresses! You'll need them for the next steps.

## Step 6: Verify Contracts on Etherscan

Verify your contracts so users can read the source code on Etherscan:

```bash
# Verify DEGU Token (replace with your deployed address)
npx hardhat verify --network sepolia <DEGU_TOKEN_ADDRESS> 10000000

# Verify SimpleBetting (replace with your deployed address)
npx hardhat verify --network sepolia <BETTING_CONTRACT_ADDRESS>
```

After verification, you'll be able to view and interact with your contracts on Etherscan:
- DEGU Token: `https://sepolia.etherscan.io/address/<DEGU_TOKEN_ADDRESS>`
- SimpleBetting: `https://sepolia.etherscan.io/address/<BETTING_CONTRACT_ADDRESS>`

## Step 7: Update Scratch GUI Configuration

Now you need to update the contract addresses in your Scratch GUI:

1. Open `/packages/scratch-gui/src/lib/auth-manager.js`

2. Find the `TOKEN_CONTRACTS` section (around line 24):
```javascript
this.TOKEN_CONTRACTS = {
    DEGU: '0x0000000000000000000000000000000000000000', // ← UPDATE THIS
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    USDT: '0x0000000000000000000000000000000000000000',
    ETH: null
};
```

3. Replace the DEGU address with your deployed DEGU token address:
```javascript
this.TOKEN_CONTRACTS = {
    DEGU: '0xABCDEF1234567890...', // ← Your DEGU address
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    USDT: '0x0000000000000000000000000000000000000000',
    ETH: null
};
```

4. Find the `BETTING_CONTRACT` section (around line 32):
```javascript
this.BETTING_CONTRACT = '0x0000000000000000000000000000000000000000'; // ← UPDATE THIS
```

5. Replace with your deployed SimpleBetting address:
```javascript
this.BETTING_CONTRACT = '0x123456789ABCDEF0...'; // ← Your SimpleBetting address
```

6. Save the file.

## Step 8: Mint Initial DEGU Tokens

You'll need some DEGU tokens to test betting games. Mint tokens to your wallet:

1. Go to your DEGU token on Etherscan:
   `https://sepolia.etherscan.io/address/<DEGU_TOKEN_ADDRESS>#writeContract`

2. Click "Connect to Web3" and connect your MetaMask

3. Find the `mint` function and fill in:
   - `to`: Your wallet address
   - `amount`: Number of tokens (e.g., `1000` for 1000 DEGU)

4. Click "Write" and confirm the transaction

5. Wait for confirmation, then check your balance using the `balanceOf` function

## Step 9: Test Integration

Restart your Scratch GUI development server to load the new contract addresses:

```bash
# In the scratch-gui directory
cd packages/scratch-gui
npm start
```

### Test Workflow

1. **Login**: Login with Web3Auth through your web app
2. **Check Balance**: Use the "balance of DEGU" block to check your balance
3. **Transfer Test**: Transfer a small amount of DEGU to another address
4. **Create Game**: Use the "create betting game" block
5. **Join Game**: Have another user join the game
6. **Start Game**: Start the game (creator only)
7. **Select Winner**: Select winner(s) after game completes
8. **Claim Prize**: Winners claim their prizes

### Example Scratch Block Sequence

```
When green flag clicked
  say (join "My wallet: " (my wallet address))
  say (join "DEGU balance: " (balance of DEGU for (my wallet address)))

  // Create a betting game
  create betting game with 100 DEGU bet, 2 to 4 players
  wait 2 seconds
  say "Game created! Share the game ID with friends"
```

## Step 10: Monitor Transactions

You can monitor all transactions on Sepolia Etherscan:
- Your wallet: `https://sepolia.etherscan.io/address/<YOUR_WALLET_ADDRESS>`
- DEGU Token: `https://sepolia.etherscan.io/address/<DEGU_TOKEN_ADDRESS>`
- SimpleBetting: `https://sepolia.etherscan.io/address/<BETTING_CONTRACT_ADDRESS>`

## Mainnet Deployment (Production)

**⚠️ WARNING**: Only deploy to mainnet after thorough testing on Sepolia!

1. Make sure you have enough ETH for gas fees
2. Update `.env` with mainnet RPC URL
3. Deploy:
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

4. Verify contracts on mainnet Etherscan
5. Update `auth-manager.js` production configuration

## Troubleshooting

### "Insufficient funds for intrinsic transaction cost"
- You need more ETH in your wallet for gas fees
- Get Sepolia ETH from: https://sepoliafaucet.com/

### "Nonce too high"
- Reset your MetaMask account: Settings → Advanced → Clear activity tab data

### "Contract verification failed"
- Make sure you're using the exact same compiler version
- Check constructor arguments match deployment

### "Web3 provider not initialized"
- Make sure you're logged in with Web3Auth
- Check that `window.__WEB3_PROVIDER__` is set in browser console

### Transactions not being mined
- Check gas price is sufficient
- Sepolia can be slow during high usage
- Wait up to 5 minutes for confirmation

## Next Steps

1. **Add Liquidity**: See [README.md](./README.md#trading-degu-on-uniswap) for Uniswap integration
2. **Create Games**: Build fun betting games in Scratch using the blockchain blocks
3. **Share**: Share your game IDs with friends to test multiplayer
4. **Monitor**: Watch transactions on Etherscan to see blockchain activity

## Security Best Practices

1. ✅ **NEVER** commit your `.env` file
2. ✅ Use a separate wallet for testing (don't use your main wallet's private key)
3. ✅ Verify contracts on Etherscan for transparency
4. ✅ Test thoroughly on Sepolia before mainnet
5. ✅ Consider a professional audit before mainnet deployment
6. ✅ Keep private keys secure (use hardware wallet for mainnet)
7. ✅ Monitor contract activity regularly

## Support

- **Hardhat docs**: https://hardhat.org/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/contracts
- **Ethers.js**: https://docs.ethers.org/v6/
- **Sepolia Faucet**: https://sepoliafaucet.com/

## Contract Addresses Reference

After deployment, record your addresses here:

### Sepolia Testnet
- **DEGU Token**: `0x...` (Add your address here)
- **SimpleBetting**: `0x...` (Add your address here)
- **Network**: Sepolia (Chain ID: 11155111)
- **Deployment Date**: _________

### Mainnet (when ready)
- **DEGU Token**: `0x...` (Add your address here)
- **SimpleBetting**: `0x...` (Add your address here)
- **Network**: Ethereum Mainnet (Chain ID: 1)
- **Deployment Date**: _________
