# DeguToken Contract Test Endpoints

API endpoints for interacting with the deployed DeguToken contract at `0xFee95Ee1E03bE4832E6F318d94243ee5cbFDc2B4`

Base URL: `http://localhost:3000/api/v1/test`

## 🚰 Faucet Endpoints

### 1. Claim Free Tokens

Claim 1000 free DEGU tokens (once per hour)

```bash
POST /api/v1/test/claim-tokens
Content-Type: application/json

{
  "privateKey": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "transactionHash": "0x...",
  "blockNumber": 12345,
  "gasUsed": "50000",
  "claimed": "1000 DEGU"
}
```

**Error (cooldown not elapsed):**
```json
{
  "success": false,
  "error": "Must wait 3600 seconds before claiming again",
  "timeUntilNext": 3600
}
```

### 2. Check If Can Claim

Check if an address can claim tokens now

```bash
GET /api/v1/test/can-claim/:address
```

**Example:**
```bash
GET /api/v1/test/can-claim/0x1234...
```

**Response:**
```json
{
  "success": true,
  "canClaim": true,
  "timeUntilNext": 0,
  "timeUntilNextFormatted": "Can claim now"
}
```

### 3. Get Last Claim

Get the last time an address claimed tokens

```bash
GET /api/v1/test/last-claim/:address
```

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "lastClaimTimestamp": 1234567890,
  "lastClaimDate": "2024-10-13T12:34:56.000Z"
}
```

---

## 📊 Token Information

### 4. Get Token Info

Get token contract details

```bash
GET /api/v1/test/token-info
```

**Response:**
```json
{
  "success": true,
  "name": "Degu Token",
  "symbol": "DEGU",
  "decimals": 18,
  "totalSupply": "10000000.0",
  "maxSupply": "100000000.0",
  "faucetAmount": "1000.0",
  "faucetCooldown": 3600,
  "faucetCooldownFormatted": "1h 0m 0s",
  "contractAddress": "0xFee95Ee1E03bE4832E6F318d94243ee5cbFDc2B4"
}
```

### 5. Get Balance

Get DEGU token balance for an address

```bash
GET /api/v1/test/balance/:address
```

**Example:**
```bash
GET /api/v1/test/balance/0x1234...
```

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "balance": "1000.0",
  "balanceWei": "1000000000000000000000"
}
```

---

## 💸 ERC20 Operations

### 6. Transfer Tokens

Transfer DEGU tokens to another address

```bash
POST /api/v1/test/transfer
Content-Type: application/json

{
  "privateKey": "0x...",
  "to": "0x...",
  "amount": "100"
}
```

**Response:**
```json
{
  "success": true,
  "from": "0x...",
  "transactionHash": "0x...",
  "blockNumber": 12345,
  "gasUsed": "45000",
  "to": "0x...",
  "amount": "100"
}
```

### 7. Approve Spender

Approve another address to spend your tokens (needed for games!)

```bash
POST /api/v1/test/approve
Content-Type: application/json

{
  "privateKey": "0x...",
  "spender": "0x...",
  "amount": "1000"
}
```

**Response:**
```json
{
  "success": true,
  "owner": "0x...",
  "transactionHash": "0x...",
  "blockNumber": 12345,
  "gasUsed": "45000",
  "spender": "0x...",
  "amount": "1000"
}
```

### 8. Get Allowance

Check how much a spender is allowed to spend

```bash
GET /api/v1/test/allowance/:owner/:spender
```

**Example:**
```bash
GET /api/v1/test/allowance/0xowner.../0xspender...
```

**Response:**
```json
{
  "success": true,
  "owner": "0x...",
  "spender": "0x...",
  "allowance": "1000.0",
  "allowanceWei": "1000000000000000000000"
}
```

### 9. Burn Tokens

Permanently burn (destroy) tokens

```bash
POST /api/v1/test/burn
Content-Type: application/json

{
  "privateKey": "0x...",
  "amount": "10"
}
```

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "transactionHash": "0x...",
  "blockNumber": 12345,
  "gasUsed": "40000",
  "burned": "10"
}
```

---

## 🔧 Utility

### 10. Get Address from Private Key

Convert private key to wallet address (utility)

```bash
POST /api/v1/test/address-from-key
Content-Type: application/json

{
  "privateKey": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "address": "0x..."
}
```

---

## 📝 Frontend Integration Example

### Claim Tokens Button

```javascript
// React/Next.js example
async function claimTokens(privateKey) {
  try {
    const response = await fetch('http://localhost:3000/api/v1/test/claim-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privateKey })
    });

    const data = await response.json();

    if (data.success) {
      alert(`Claimed ${data.claimed}! TX: ${data.transactionHash}`);
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    alert('Failed to claim tokens');
  }
}
```

### Check Balance

```javascript
async function getBalance(address) {
  const response = await fetch(`http://localhost:3000/api/v1/test/balance/${address}`);
  const data = await response.json();

  if (data.success) {
    console.log(`Balance: ${data.balance} DEGU`);
  }
}
```

### Check If Can Claim (for button state)

```javascript
async function canClaim(address) {
  const response = await fetch(`http://localhost:3000/api/v1/test/can-claim/${address}`);
  const data = await response.json();

  if (data.canClaim) {
    // Enable button
    return true;
  } else {
    // Show countdown: data.timeUntilNextFormatted
    return false;
  }
}
```

---

## ⚠️ Important Notes

### Private Key Security

**NEVER expose private keys in production!**

These endpoints are for **testing only**. In production:
1. Use Web3Auth on the frontend
2. Sign transactions client-side
3. Never send private keys to backend

### Web3Auth Integration

For production, use Web3Auth from the frontend:

```javascript
import { web3auth } from '@/lib/web3auth';
import { ethers } from 'ethers';

// Get user's wallet from Web3Auth
const provider = await web3auth.connect();
const ethersProvider = new ethers.BrowserProvider(provider);
const signer = await ethersProvider.getSigner();

// Interact with contract
const contract = new ethers.Contract(tokenAddress, abi, signer);
await contract.claimFreeTokens();
```

### Gas Fees

All transactions require ETH for gas on Sepolia testnet:
- Get testnet ETH: https://sepoliafaucet.com/
- Transactions cost ~0.001-0.003 ETH

---

## 🧪 Testing Flow

1. **Get testnet ETH** → https://sepoliafaucet.com/
2. **Claim tokens** → `POST /test/claim-tokens`
3. **Check balance** → `GET /test/balance/:address`
4. **Transfer tokens** → `POST /test/transfer`
5. **Approve SimpleBetting** → `POST /test/approve`
6. **Join game** → (use SimpleBetting contract)

---

## 🔗 Contract Details

- **Contract Address**: `0xFee95Ee1E03bE4832E6F318d94243ee5cbFDc2B4`
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Faucet Amount**: 1000 DEGU per claim
- **Cooldown**: 1 hour
- **Max Supply**: 100 million DEGU

---

## 📖 Full ERC20 Functionality Covered

✅ **Faucet**: claimFreeTokens(), canClaimTokens()
✅ **Info**: name(), symbol(), decimals(), totalSupply()
✅ **Balance**: balanceOf()
✅ **Transfer**: transfer()
✅ **Approval**: approve(), allowance()
✅ **Burn**: burn()

All standard ERC20 interactions are available through these endpoints!
