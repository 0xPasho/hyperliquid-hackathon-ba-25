# Free Token Faucet - Quick Guide

## ✅ What You Have Now

**DeguToken.sol** with built-in free faucet:
- Anyone can claim **1,000 DEGU** per hour
- No verification, no buying required
- Simple one-click "Mint" button

## 🚀 Deploy Token

```bash
cd packages/contracts

# Local testing
npx hardhat run scripts/deploy-simple.js --network localhost

# Testnet
npx hardhat run scripts/deploy-simple.js --network sepolia

# PolkaVM Testnet
npx hardhat run scripts/deploy-simple.js --network polkadotAssetHubTestnet
```

## 🎮 How It Works

### For Players:
1. Click "Mint" button → Get 1,000 DEGU
2. Wait 1 hour → Can claim again
3. Use DEGU to join games
4. Winners get losers' tokens

### Settings (in contract):
```solidity
FAUCET_AMOUNT = 1000 DEGU      // Amount per claim
FAUCET_COOLDOWN = 1 hour       // Time between claims
MAX_SUPPLY = 100 million DEGU  // Total cap
```

## 💻 Frontend Integration

### 1. Check If User Can Claim

```javascript
// ethers.js v6
const deguToken = new ethers.Contract(tokenAddress, abi, signer);

const [canClaim, timeUntilNext] = await deguToken.canClaimTokens(userAddress);

if (canClaim) {
  // Show "Mint" button enabled
} else {
  // Show "Mint" button disabled with countdown
  console.log("Wait", timeUntilNext, "seconds");
}
```

### 2. Claim Free Tokens

```javascript
const tx = await deguToken.claimFreeTokens();
await tx.wait(); // Wait for confirmation

console.log("Claimed 1000 DEGU!");
```

### 3. Check Balance

```javascript
const balance = await deguToken.balanceOf(userAddress);
console.log("Balance:", ethers.formatEther(balance), "DEGU");
```

### 4. Listen for Claims

```javascript
deguToken.on("TokensClaimed", (user, amount) => {
  console.log(user, "claimed", ethers.formatEther(amount), "DEGU");
  // Update UI
});
```

## 🎨 Example Button Component

```jsx
// React example
function MintButton({ address, tokenContract }) {
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkClaim = async () => {
      const [can, time] = await tokenContract.canClaimTokens(address);
      setCanClaim(can);
      setTimeLeft(time);
    };
    checkClaim();
    const interval = setInterval(checkClaim, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [address]);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const tx = await tokenContract.claimFreeTokens();
      await tx.wait();
      alert("Claimed 1000 DEGU!");
    } catch (error) {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  if (!canClaim) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return (
      <button disabled>
        Wait {minutes}m {seconds}s
      </button>
    );
  }

  return (
    <button onClick={handleClaim} disabled={loading}>
      {loading ? "Claiming..." : "🎁 Mint 1000 DEGU"}
    </button>
  );
}
```

## 🔧 Customize Settings

Want different amounts or cooldowns? Edit `DeguToken.sol`:

```solidity
// Line 25-26
uint256 public constant FAUCET_AMOUNT = 5000 * 10**18;  // 5000 DEGU
uint256 public constant FAUCET_COOLDOWN = 30 minutes;   // Every 30 min
```

Then recompile:
```bash
npx hardhat compile
```

## 📝 Contract Functions

### `claimFreeTokens()`
- Claims free tokens for msg.sender
- Reverts if cooldown not elapsed
- Emits `TokensClaimed` event

### `canClaimTokens(address user)` (view)
- Returns: `(bool canClaim, uint256 timeUntilNext)`
- Check before showing mint button

### `lastClaim(address)` (view)
- Returns timestamp of last claim
- Public mapping, anyone can check

## ⚠️ Important Notes

### Cooldown Enforcement
- **Per address**: Each wallet has its own cooldown
- **Cannot bypass**: Enforced by smart contract timestamp
- **First claim**: Always works (no previous claim)

### Supply Management
- Max supply: 100M DEGU
- Faucet stops when max supply reached
- Owner can mint additional tokens if needed

### Gas Costs
- Claiming costs gas (paid by claimer)
- Testnet: Free gas
- Mainnet: ~0.001 ETH per claim

## 🎯 Game Integration

Players need DEGU to bet in SimpleBetting contract:

```javascript
// 1. Player claims free DEGU
await deguToken.claimFreeTokens();

// 2. Player approves SimpleBetting to spend DEGU
await deguToken.approve(simpleBettingAddress, betAmount);

// 3. Player joins game
await simpleBetting.joinGame(gameId);
```

## 🔗 Next Steps

1. ✅ Deploy DeguToken with faucet
2. ✅ Add "Mint" button to your frontend
3. ✅ Deploy SimpleBetting contract (uses DEGU)
4. ✅ Let players claim tokens and play!

---

**No buying, no verification, just mint and play! 🚀**
