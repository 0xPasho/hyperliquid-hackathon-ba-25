# PolkaVM Smart Contracts

Solidity smart contracts for deploying ERC20 tokens on Polkadot's Asset Hub using PolkaVM.

## 📁 Structure

```
contracts/
├── polkavm/
│   ├── DeguTokenPolkaVM.sol           # ERC20 token for PolkaVM
│   ├── LiquidityManager.sol           # Helper for Uniswap V2 liquidity
│   └── interfaces/
│       ├── IUniswapV2Router02.sol     # Uniswap V2 Router interface
│       ├── IUniswapV2Factory.sol      # Uniswap V2 Factory interface
│       └── IUniswapV2Pair.sol         # Uniswap V2 Pair interface
├── scripts/
│   ├── deploy-polkavm.js              # Deployment script
│   └── add-liquidity-polkavm.js       # Liquidity management script
├── POLKAVM_DEPLOYMENT.md              # Full deployment guide
├── POLKAVM_QUICKSTART.md              # 5-minute quick start
└── hardhat.config.js                  # Network configuration
```

## 🚀 Quick Start

```bash
# 1. Setup
npm install
cp .env.example .env
# Edit .env with your PRIVATE_KEY

# 2. Deploy to testnet
npx hardhat run scripts/deploy-polkavm.js --network polkadotAssetHubTestnet

# 3. Add liquidity (after minting tokens)
npx hardhat run scripts/add-liquidity-polkavm.js --network polkadotAssetHubTestnet
```

👉 **[Full Quick Start Guide](./POLKAVM_QUICKSTART.md)**

## 📚 Documentation

-   **[Quick Start (5 min)](./POLKAVM_QUICKSTART.md)** - Get started fast
-   **[Full Deployment Guide](./POLKAVM_DEPLOYMENT.md)** - Complete documentation
-   **[Polkadot Docs](https://docs.polkadot.com/)** - Official documentation

## 🎯 What You Get

### DeguTokenPolkaVM

Standard ERC20 token with:

-   ✅ Minting capability (owner only)
-   ✅ Burning capability
-   ✅ Max supply cap (1B tokens)
-   ✅ OpenZeppelin security standards
-   ✅ PolkaVM optimized

### LiquidityManager

Helper contract for Uniswap V2:

-   ✅ Simplified liquidity addition
-   ✅ Support for token/token pairs
-   ✅ Support for token/PAS (native) pairs
-   ✅ Automatic refunds for unused tokens
-   ✅ Emergency recovery functions

### Uniswap V2 Interfaces

Ready-to-use interfaces for:

-   ✅ Trading (swap tokens)
-   ✅ Liquidity provision
-   ✅ Pair creation
-   ✅ Price queries

## 🌐 Networks

### Testnet (Westend Asset Hub)

```
RPC: https://westend-asset-hub-eth-rpc.polkadot.io
Chain ID: 420420421
Native Token: PAS
Faucet: https://faucet.polkadot.io/
```

### Mainnet (Polkadot Asset Hub)

```
RPC: https://asset-hub-polkadot-rpc.polkadot.io
Chain ID: 1000
Native Token: DOT
```

## 🛠 Development

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy Locally

```bash
npx hardhat node                    # Terminal 1
npx hardhat run scripts/deploy-polkavm.js --network localhost  # Terminal 2
```

### Open Console

```bash
npx hardhat console --network polkadotAssetHubTestnet
```

## 📋 Pre-Deployment Checklist

-   [ ] Node.js v16+ installed
-   [ ] MetaMask configured with Polkadot network
-   [ ] PAS tokens in wallet (from faucet)
-   [ ] `.env` file configured with PRIVATE_KEY
-   [ ] Uniswap V2 Router address known (for liquidity)

## 🔄 Deployment Flow

```
1. Deploy DeguTokenPolkaVM
   ↓
2. Mint initial token supply
   ↓
3. Deploy LiquidityManager (if using Uniswap)
   ↓
4. Approve LiquidityManager to spend tokens
   ↓
5. Add liquidity to create trading pair
   ↓
6. Token is now tradable! 🎉
```

## 📝 Example Usage

### Deploy Token

```javascript
const DeguToken = await ethers.getContractFactory("DeguTokenPolkaVM");
const token = await DeguToken.deploy(deployerAddress);
await token.waitForDeployment();
```

### Mint Tokens

```javascript
await token.mint(recipientAddress, ethers.parseEther("1000000"));
```

### Add Liquidity

```javascript
const liquidityManager = await ethers.getContractAt(
    "LiquidityManager",
    managerAddress
);

await token.approve(managerAddress, tokenAmount);

await liquidityManager.addLiquidityPAS(
    tokenAddress,
    tokenAmount,
    minTokenAmount,
    minPasAmount,
    deadline,
    { value: pasAmount }
);
```

## ⚠️ Important Notes

### Security

-   🔒 Never commit `.env` file to git
-   🔒 Keep private keys secure
-   🔒 Audit contracts before mainnet deployment
-   🔒 Test thoroughly on testnet first

### PolkaVM Specifics

-   🎯 Currently in preview/beta stage
-   🎯 Uniswap V2 has 90% test coverage on PolkaVM
-   🎯 Some EVM features behave differently
-   🎯 Gas mechanics differ from standard EVM
-   🎯 Always set adequate gas limits

### Gas Differences

-   The 2300 gas stipend doesn't provide reentrancy protection
-   Contract deployment is more expensive than EVM
-   Recommend using `{ gasLimit: 5000000 }` for complex transactions

## 🔗 Resources

-   [Polkadot Developer Docs](https://docs.polkadot.com/)
-   [PolkaVM Overview](https://docs.polkadot.com/polkadot-protocol/smart-contract-basics/)
-   [Uniswap V2 on PolkaVM Tutorial](https://docs.polkadot.com/tutorials/smart-contracts/demo-aplications/deploying-uniswap-v2/)
-   [Polkadot Forum](https://forum.polkadot.network/)
-   [Polkadot Remix IDE](https://remix.polkadot.io/)

## 🤝 Support

Need help? Check:

1. [POLKAVM_DEPLOYMENT.md](./POLKAVM_DEPLOYMENT.md) - Full guide
2. [Troubleshooting section](./POLKAVM_DEPLOYMENT.md#troubleshooting)
3. [Polkadot Forum](https://forum.polkadot.network/)

## 📊 Contract Verification

After deployment, verify your contracts:

```bash
npx hardhat verify --network polkadotAssetHubTestnet CONTRACT_ADDRESS "CONSTRUCTOR_ARGS"
```

_(Note: Verification may not be supported yet on PolkaVM block explorers)_

## 🎯 Next Steps

1. ✅ Deploy token to testnet → [Quick Start](./POLKAVM_QUICKSTART.md)
2. 📖 Read full guide → [Deployment Guide](./POLKAVM_DEPLOYMENT.md)
3. 🧪 Test your deployment
4. 🚀 Deploy to mainnet
5. 🔗 Integrate with your dApp

---

**Built for Polkadot 2.0 with ❤️**
