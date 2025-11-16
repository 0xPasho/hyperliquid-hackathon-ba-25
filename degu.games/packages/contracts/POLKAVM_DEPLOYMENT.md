# PolkaVM Deployment Guide

Complete guide for deploying ERC20 tokens on PolkaVM (Polkadot Asset Hub) and making them tradable on Uniswap V2.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Network Information](#network-information)
4. [Quick Start](#quick-start)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [Making Your Token Tradable](#making-your-token-tradable)
7. [Troubleshooting](#troubleshooting)

## Overview

PolkaVM is Polkadot's RISC-V-based virtual machine that compiles Solidity smart contracts to PolkaVM bytecode. This allows you to deploy standard ERC20 tokens and DeFi protocols (like Uniswap V2) on Polkadot's Asset Hub.

### Key Features

-   ✅ **Solidity Compatible**: Use existing Solidity contracts with minimal changes
-   ✅ **OpenZeppelin Support**: Standard security-audited contracts work out of the box
-   ✅ **Uniswap V2 Deployed**: Full DEX functionality available on PolkaVM
-   ✅ **Ethereum Tooling**: Use MetaMask, Hardhat, Remix - no new tools needed
-   ⚠️ **Early Stage**: PolkaVM is in preview (90% test coverage on Uniswap V2)

## Prerequisites

### Required Tools

1. **Node.js** (v16.0.0 or later)

    ```bash
    node --version
    ```

2. **MetaMask** or **Talisman Wallet**

    - Install browser extension
    - Have a wallet with recovery phrase

3. **PAS Test Tokens** (for testnet)
    - Get from [Polkadot Faucet](https://faucet.polkadot.io/)

### Installation

```bash
cd packages/contracts
npm install
```

### Environment Setup

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Your wallet private key (DO NOT SHARE!)
PRIVATE_KEY=your_private_key_here

# Uniswap V2 Router address on PolkaVM (get from deployment or community)
UNISWAP_V2_ROUTER_POLKAVM=0x...

# Contract addresses (will be filled after deployment)
DEGU_TOKEN_ADDRESS=
LIQUIDITY_MANAGER_ADDRESS=
```

## Network Information

### Testnet (Westend Asset Hub)

-   **Network Name**: Polkadot Asset Hub Testnet
-   **RPC URL**: `https://westend-asset-hub-eth-rpc.polkadot.io`
-   **Chain ID**: `420420421`
-   **Currency**: PAS (Paseo)
-   **Block Explorer**: TBD
-   **Faucet**: https://faucet.polkadot.io/

### Mainnet (Polkadot Asset Hub)

-   **Network Name**: Polkadot Asset Hub
-   **RPC URL**: `https://asset-hub-polkadot-rpc.polkadot.io`
-   **Chain ID**: `1000`
-   **Currency**: DOT
-   **Block Explorer**: TBD

### Add Network to MetaMask

1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Enter the details above
5. Save

## Quick Start

Deploy everything in one go:

```bash
# 1. Deploy token and liquidity manager
npx hardhat run scripts/deploy-polkavm.js --network polkadotAssetHubTestnet

# 2. Update .env with deployed addresses

# 3. Mint initial supply
npx hardhat console --network polkadotAssetHubTestnet
> const token = await ethers.getContractAt("DeguTokenPolkaVM", "YOUR_TOKEN_ADDRESS")
> await token.mint("YOUR_ADDRESS", ethers.parseEther("1000000"))

# 4. Add liquidity to create trading pair
npx hardhat run scripts/add-liquidity-polkavm.js --network polkadotAssetHubTestnet
```

## Step-by-Step Deployment

### Step 1: Deploy DeguTokenPolkaVM

This deploys your ERC20 token contract:

```bash
npx hardhat run scripts/deploy-polkavm.js --network polkadotAssetHubTestnet
```

**Output:**

```
🚀 Starting PolkaVM deployment...
📝 Deploying contracts with account: 0x...
💰 Account balance: 10.5 PAS

📄 Deploying DeguTokenPolkaVM...
✅ DeguTokenPolkaVM deployed to: 0xABC123...
   Name: Degu
   Symbol: DEGU
   Decimals: 18
   Max Supply: 1000000000 DEGU
```

**Save the token address!**

### Step 2: Mint Initial Token Supply

Open Hardhat console:

```bash
npx hardhat console --network polkadotAssetHubTestnet
```

Mint tokens:

```javascript
// Get your deployed token
const tokenAddress = "0xYOUR_TOKEN_ADDRESS";
const DeguToken = await ethers.getContractFactory("DeguTokenPolkaVM");
const token = DeguToken.attach(tokenAddress);

// Mint 1 million tokens to your address
const [deployer] = await ethers.getSigners();
const amount = ethers.parseEther("1000000"); // 1M DEGU
await token.mint(deployer.address, amount);

// Check balance
const balance = await token.balanceOf(deployer.address);
console.log("Balance:", ethers.formatEther(balance), "DEGU");
```

### Step 3: Verify Deployment

Check your token on-chain:

```bash
npx hardhat console --network polkadotAssetHubTestnet
```

```javascript
const token = await ethers.getContractAt(
    "DeguTokenPolkaVM",
    "YOUR_TOKEN_ADDRESS"
);

console.log("Name:", await token.name());
console.log("Symbol:", await token.symbol());
console.log("Total Supply:", ethers.formatEther(await token.totalSupply()));
console.log(
    "Your Balance:",
    ethers.formatEther(await token.balanceOf("YOUR_ADDRESS"))
);
```

## Making Your Token Tradable

### Option 1: Use Existing Uniswap V2 (Recommended)

If Uniswap V2 is already deployed on PolkaVM:

1. **Get the Router address** from the community or official docs
2. **Set it in .env**:
    ```env
    UNISWAP_V2_ROUTER_POLKAVM=0x...
    ```
3. **Deploy LiquidityManager**:
    ```bash
    npx hardhat run scripts/deploy-polkavm.js --network polkadotAssetHubTestnet
    ```
4. **Add liquidity**:
    ```bash
    npx hardhat run scripts/add-liquidity-polkavm.js --network polkadotAssetHubTestnet
    ```

### Option 2: Deploy Your Own Uniswap V2

Follow the [official Polkadot tutorial](https://docs.polkadot.com/tutorials/smart-contracts/demo-aplications/deploying-uniswap-v2/) to deploy Uniswap V2 contracts.

### Step-by-Step: Adding Liquidity

1. **Configure liquidity amounts** in `scripts/add-liquidity-polkavm.js`:

```javascript
const DEGU_AMOUNT = ethers.parseEther("10000"); // 10,000 DEGU
const PAS_AMOUNT = ethers.parseEther("1"); // 1 PAS
const SLIPPAGE_PERCENT = 5; // 5% slippage
```

2. **Run the script**:

```bash
npx hardhat run scripts/add-liquidity-polkavm.js --network polkadotAssetHubTestnet
```

3. **Script will**:
    - Check your balances
    - Approve LiquidityManager to spend tokens
    - Create trading pair (if doesn't exist)
    - Add liquidity
    - Display pair address and reserves

**Output:**

```
💧 Adding liquidity to Uniswap V2 on PolkaVM...
✅ Trading pair exists: 0xDEF456...
📝 Step 1: Approving LiquidityManager to spend DEGU...
✅ Approval confirmed
📝 Step 2: Adding liquidity...
✅ Liquidity added successfully!
🎉 Trading is now live!
   Pair Address: 0xDEF456...
📊 Pair Reserves:
   DEGU: 10000.0
   PAS: 1.0
```

### Step 4: Share Your Token

Once liquidity is added, your token is tradable! Share:

-   **Token Address**: `0xYOUR_TOKEN_ADDRESS`
-   **Pair Address**: `0xYOUR_PAIR_ADDRESS`
-   **Trading Link**: Create a link to Uniswap V2 interface (when available)

## Using the LiquidityManager

The `LiquidityManager` contract simplifies liquidity operations:

### Add Liquidity (Token/PAS)

```javascript
// Get contracts
const liquidityManager = await ethers.getContractAt(
    "LiquidityManager",
    "MANAGER_ADDRESS"
);
const token = await ethers.getContractAt("DeguTokenPolkaVM", "TOKEN_ADDRESS");

// Amounts
const tokenAmount = ethers.parseEther("1000");
const pasAmount = ethers.parseEther("0.1");
const deadline = Math.floor(Date.now() / 1000) + 20 * 60; // 20 min

// Approve
await token.approve(liquidityManager.address, tokenAmount);

// Add liquidity
await liquidityManager.addLiquidityPAS(
    token.address,
    tokenAmount,
    (tokenAmount * 95n) / 100n, // 5% slippage
    (pasAmount * 95n) / 100n,
    deadline,
    { value: pasAmount }
);
```

### Check if Pair Exists

```javascript
const liquidityManager = await ethers.getContractAt(
    "LiquidityManager",
    "MANAGER_ADDRESS"
);
const router = await ethers.getContractAt(
    "IUniswapV2Router02",
    await liquidityManager.router()
);
const weth = await router.WETH();

const pairAddress = await liquidityManager.getPair(tokenAddress, weth);
console.log("Pair:", pairAddress);

const exists = await liquidityManager.pairExists(tokenAddress, weth);
console.log("Exists:", exists);
```

## Contract Addresses

### Your Deployments

After deploying, record your addresses here:

```
Network: Westend Asset Hub (Testnet)
DeguTokenPolkaVM: 0x...
LiquidityManager: 0x...
Uniswap V2 Router: 0x...
Trading Pair (DEGU/PAS): 0x...

Network: Polkadot Asset Hub (Mainnet)
DeguTokenPolkaVM: 0x...
LiquidityManager: 0x...
Uniswap V2 Router: 0x...
Trading Pair (DEGU/DOT): 0x...
```

## Troubleshooting

### "Insufficient PAS balance"

Get test tokens from faucet: https://faucet.polkadot.io/

### "Transaction reverted"

Check:

-   Sufficient PAS for gas
-   Token approval granted
-   Deadline hasn't passed
-   Slippage tolerance adequate

### "Router address not set"

Set `UNISWAP_V2_ROUTER_POLKAVM` in `.env` file

### "Invalid private key"

Ensure your `.env` has:

```env
PRIVATE_KEY=0x1234... # Include 0x prefix
```

### Gas Estimation Failed

PolkaVM has different gas mechanics than EVM. Try:

```javascript
{
    gasLimit: 5000000;
}
```

## Important Notes

⚠️ **Security**

-   Never commit `.env` to git
-   Keep private keys secure
-   Audit contracts before mainnet deployment

⚠️ **PolkaVM Status**

-   Currently in preview/beta
-   Uniswap V2 has 90% test coverage
-   Some EVM features may behave differently
-   Thoroughly test on testnet first

⚠️ **Gas Differences**

-   The 2300 gas stipend doesn't provide reentrancy protection on PolkaVM
-   Smart contract deployment is more expensive than on EVM
-   Always set adequate gas limits

## Resources

-   **Official Docs**: https://docs.polkadot.com/tutorials/smart-contracts/
-   **Polkadot Forum**: https://forum.polkadot.network/
-   **Uniswap V2 Deployment Tutorial**: https://docs.polkadot.com/tutorials/smart-contracts/demo-aplications/deploying-uniswap-v2/
-   **Polkadot Remix IDE**: https://remix.polkadot.io/
-   **Faucet**: https://faucet.polkadot.io/

## Next Steps

1. ✅ Deploy token to testnet
2. ✅ Mint initial supply
3. ✅ Deploy/connect to Uniswap V2
4. ✅ Add liquidity to create pair
5. 🎯 Test trading
6. 🎯 Deploy to mainnet
7. 🎯 Integrate with your application

## Support

For issues or questions:

-   Check [Polkadot Forum](https://forum.polkadot.network/)
-   Review [official documentation](https://docs.polkadot.com/)
-   Search existing GitHub issues

---

**Happy building on PolkaVM! 🚀**
