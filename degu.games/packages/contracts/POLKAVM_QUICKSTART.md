# PolkaVM Quick Start 🚀

Deploy and trade your ERC20 token on Polkadot in 5 minutes!

## Prerequisites

-   Node.js v16+
-   MetaMask wallet
-   PAS test tokens ([get from faucet](https://faucet.polkadot.io/))

## Setup (1 minute)

```bash
# Install dependencies
cd packages/contracts
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your PRIVATE_KEY
```

##Deploy Token (2 minutes)

```bash
# Deploy DeguTokenPolkaVM to testnet
npx hardhat run scripts/deploy-polkavm.js --network polkadotAssetHubTestnet

# Save the token address printed in console
# Example: 0xABC123...
```

## Mint Tokens (1 minute)

```bash
npx hardhat console --network polkadotAssetHubTestnet
```

```javascript
// In console:
const token = await ethers.getContractAt(
    "DeguTokenPolkaVM",
    "YOUR_TOKEN_ADDRESS"
);
const [me] = await ethers.getSigners();
await token.mint(me.address, ethers.parseEther("1000000"));
// ✅ You now have 1M DEGU tokens!
```

## Make It Tradable (1 minute)

```bash
# Update .env with your token address
DEGU_TOKEN_ADDRESS=0xYOUR_TOKEN_ADDRESS
LIQUIDITY_MANAGER_ADDRESS=0xYOUR_MANAGER_ADDRESS
UNISWAP_V2_ROUTER_POLKAVM=0xROUTER_ADDRESS

# Add liquidity to create trading pair
npx hardhat run scripts/add-liquidity-polkavm.js --network polkadotAssetHubTestnet
```

## Done! 🎉

Your token is now:

-   ✅ Deployed on Polkadot
-   ✅ Minted and in your wallet
-   ✅ Trading live on Uniswap V2

## What's Next?

1. **Test Trading**: Try buying/selling your token
2. **Add More Liquidity**: Increase trading volume capacity
3. **Deploy to Mainnet**: Follow same steps on `polkadotAssetHub` network
4. **Integrate**: Connect your dApp to the contracts

## Need Help?

-   📖 [Full Documentation](./POLKAVM_DEPLOYMENT.md)
-   🐛 [Troubleshooting](#troubleshooting)
-   💬 [Polkadot Forum](https://forum.polkadot.network/)

## Key Addresses

```
Network: Westend Asset Hub (Testnet)
RPC: https://westend-asset-hub-eth-rpc.polkadot.io
Chain ID: 420420421

Your Contracts:
- Token: 0x...
- Liquidity Manager: 0x...
- Trading Pair: 0x...
```

## Quick Commands Reference

```bash
# Deploy everything
npx hardhat run scripts/deploy-polkavm.js --network polkadotAssetHubTestnet

# Open console
npx hardhat console --network polkadotAssetHubTestnet

# Add liquidity
npx hardhat run scripts/add-liquidity-polkavm.js --network polkadotAssetHubTestnet

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

## Troubleshooting

### "Insufficient funds"

Get PAS from: https://faucet.polkadot.io/

### "Transaction failed"

-   Check you have PAS for gas
-   Verify token address is correct
-   Ensure you've approved the LiquidityManager

### "Router not found"

Get the Uniswap V2 Router address from the community and add to `.env`:

```env
UNISWAP_V2_ROUTER_POLKAVM=0x...
```

---

**Questions?** Check [POLKAVM_DEPLOYMENT.md](./POLKAVM_DEPLOYMENT.md) for detailed guide.
