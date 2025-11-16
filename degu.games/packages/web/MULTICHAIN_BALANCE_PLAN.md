# Multi-Chain Balance Display Implementation Plan

## 📋 Overview

**Goal**: Display user's token balances across multiple blockchain networks (Base, Polygon, Arbitrum) in the top navigation bar with a select picker showing network logo, balance amount, and USD equivalent.

## 🎯 Requirements

1. **Multi-Chain Support**:
   - Base Sepolia (ETH, USDC)
   - Polygon Amoy (MATIC, USDC)
   - Arbitrum Sepolia (ETH, USDC)

2. **Display Information**:
   - Network logo/icon
   - Native token balance (e.g., "1.5 ETH")
   - USD equivalent (e.g., "$3,450.00")
   - Total portfolio value across all chains

3. **User Experience**:
   - Dropdown/select picker in header
   - Auto-refresh every 30 seconds
   - Loading states
   - Error handling
   - Responsive design

## 🏗️ Architecture

### Phase 1: Balance Fetching (`useMultiChainBalances` Hook)

**File**: `/hooks/useMultiChainBalances.ts`

**Responsibilities**:
- Fetch native token balances via JSON-RPC (`eth_getBalance`)
- Fetch ERC20 token balances (USDC) via contract calls
- Aggregate balances from all supported networks
- Auto-refresh every 30 seconds
- Handle loading and error states

**Data Structure**:
```typescript
interface TokenBalance {
  symbol: string;
  name: string;
  balance: string; // Formatted balance (e.g., "1.5")
  balanceRaw: bigint; // Raw balance
  decimals: number;
  isNative: boolean;
  usdValue?: number; // Optional USD value
}

interface NetworkBalance {
  chainId: number;
  networkName: string;
  shortName: string;
  nativeSymbol: string;
  balances: TokenBalance[];
  totalUsdValue: number;
}

interface MultiChainBalances {
  networks: NetworkBalance[];
  totalPortfolioValue: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}
```

**Implementation Details**:
- Use `ethers.js` JsonRpcProvider for RPC calls
- For native tokens: `provider.getBalance(address)`
- For ERC20 tokens: Call `balanceOf(address)` function
- Use `useMemo` to calculate total portfolio value
- Use `useEffect` with interval for auto-refresh
- Implement proper cleanup on unmount

### Phase 2: Price Fetching (`lib/crypto-prices.ts`)

**File**: `/lib/crypto-prices.ts`

**Responsibilities**:
- Fetch USD prices for ETH, MATIC, USDC
- Use CoinGecko free API (no key required)
- Cache prices (5-minute cache)
- Handle API failures gracefully

**API Endpoint**:
```
https://api.coingecko.com/api/v3/simple/price?ids=ethereum,matic-network,usd-coin&vs_currencies=usd
```

**Functions**:
```typescript
async function getCryptoPrices(): Promise<Record<string, number>>
function getCachedPrice(symbol: string): number | null
```

### Phase 3: Network Balance Selector Component

**File**: `/components/wallet/NetworkBalanceSelector.tsx`

**UI Design**:

```
┌──────────────────────────────────────┐
│ [Logo] 1.5 ETH  ($3,450.00)    [▼]  │
└──────────────────────────────────────┘
           ↓ (when clicked)
┌──────────────────────────────────────┐
│ Total Portfolio: $8,234.50           │
├──────────────────────────────────────┤
│ [Base]    1.5 ETH    $3,450.00      │
│           500 USDC   $500.00        │
├──────────────────────────────────────┤
│ [Polygon] 2000 MATIC $1,840.00      │
│           1000 USDC  $1,000.00      │
├──────────────────────────────────────┤
│ [Arbitrum] 0.5 ETH   $1,150.00      │
│            294 USDC  $294.50        │
└──────────────────────────────────────┘
```

**Component Structure**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    {/* Selected network summary */}
    <NetworkLogo /> {balance} {symbol} (${usdValue})
  </DropdownMenuTrigger>

  <DropdownMenuContent>
    {/* Total portfolio value */}
    <div>Total: ${totalValue}</div>

    {/* Each network */}
    {networks.map(network => (
      <NetworkBalanceItem
        network={network}
        balances={network.balances}
        totalUsdValue={network.totalUsdValue}
      />
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

**Features**:
- Click to expand dropdown
- Show all networks and their balances
- Highlight selected/active network
- Display total portfolio value at top
- Loading skeleton states
- Error messages

**Styling**:
- Match existing header design
- Dark theme with subtle borders
- Hover states for interactivity
- Compact but readable font sizes
- Network logos from `simple-icons` or custom SVGs

### Phase 4: Header Integration

**File**: `/components/layout/AppHeader.tsx`

**Integration Point**:
- Add between search bar (left) and auth buttons (right)
- Line ~95, before `{isAuthenticated ? <UserProfile /> : <LoginButton />}`

**Layout**:
```tsx
<div className="flex items-center gap-3">
  {isAuthenticated && <NetworkBalanceSelector />}
  {isAuthenticated ? <UserProfile /> : <LoginButton />}
</div>
```

**Responsive Behavior**:
- Desktop: Full display with USD values
- Tablet: Abbreviated format
- Mobile: Icon only with balance (hide USD)

## 🔧 Technical Implementation Details

### 1. RPC Configuration

Use existing network configurations from `/lib/networks.ts`:
- Base Sepolia: `https://sepolia.base.org`
- Polygon Amoy: `https://rpc-amoy.polygon.technology`
- Arbitrum Sepolia: `https://sepolia-rollup.arbitrum.io/rpc`

### 2. ERC20 ABI (for balance calls)

Minimal ABI needed:
```typescript
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
```

### 3. Wallet Address Retrieval

Use Privy's `useWallets()` hook:
```typescript
import { useWallets } from '@privy-io/react-auth';

const { wallets } = useWallets();
const address = wallets[0]?.address;
```

### 4. Error Handling

- Network errors: Show cached balances or "Unable to fetch"
- Price API errors: Show balances without USD values
- No wallet: Don't render component

### 5. Performance Optimizations

- Debounce refresh calls
- Cache RPC responses (30-second cache)
- Lazy load prices only when dropdown opens
- Use `useMemo` for expensive calculations
- Implement request deduplication

## 📁 File Structure

```
packages/web/src/
├── hooks/
│   └── useMultiChainBalances.ts         [NEW]
├── lib/
│   ├── crypto-prices.ts                 [NEW]
│   └── networks.ts                      [EXISTING]
├── components/
│   ├── wallet/
│   │   ├── NetworkBalanceSelector.tsx   [NEW]
│   │   └── NetworkBalanceItem.tsx       [NEW]
│   └── layout/
│       └── AppHeader.tsx                [MODIFY]
```

## 🎨 UI/UX Specifications

### Colors & Styling

**Dropdown Trigger**:
- Background: `#0F0F0F` (match search bar)
- Border: `#1A1A1A`
- Hover: `#141414`
- Text: `#E5E5E5`
- Secondary text (USD): `#6B6B6B`

**Dropdown Content**:
- Background: `#141414`
- Border: `#2d2d2d`
- Item hover: `#1a1a1a`
- Dividers: `#2d2d2d`

**Network Logos**:
- Size: 20x20px (trigger), 24x24px (dropdown)
- Border radius: 50% (circular)
- Border: 1px solid `#2d2d2d`

### Typography

- Balance amount: `text-sm font-medium`
- USD value: `text-xs text-gray-400`
- Network name: `text-sm font-medium`
- Total portfolio: `text-base font-bold`

### Spacing

- Gap between logo and text: 8px (`gap-2`)
- Gap between items: 4px (`gap-1`)
- Padding in dropdown: 12px (`p-3`)
- Item padding: 8px (`p-2`)

## 🧪 Testing Plan

### Manual Testing

1. **Balance Fetching**:
   - ✅ Balances load on mount
   - ✅ Auto-refresh works every 30s
   - ✅ Manual refresh works
   - ✅ Handles no balance (shows 0)

2. **USD Conversion**:
   - ✅ Prices fetch correctly
   - ✅ Calculations are accurate
   - ✅ Total portfolio value is correct

3. **UI Interactions**:
   - ✅ Dropdown opens/closes
   - ✅ Shows all networks
   - ✅ Loading states display
   - ✅ Error states display

4. **Responsive Design**:
   - ✅ Works on desktop
   - ✅ Works on tablet
   - ✅ Works on mobile

### Edge Cases

- ⚠️ No wallet connected
- ⚠️ Network RPC failure
- ⚠️ Price API failure
- ⚠️ Very large balances (formatting)
- ⚠️ Very small balances (precision)
- ⚠️ Zero balances across all chains

## 📝 Implementation Checklist

### Phase 1: Backend/Hooks
- [ ] Create `crypto-prices.ts` utility
- [ ] Create `useMultiChainBalances` hook
- [ ] Test balance fetching with real wallet
- [ ] Test USD price conversion

### Phase 2: Components
- [ ] Create `NetworkBalanceItem` component
- [ ] Create `NetworkBalanceSelector` component
- [ ] Add loading states
- [ ] Add error states
- [ ] Style components

### Phase 3: Integration
- [ ] Add to `AppHeader.tsx`
- [ ] Test responsive behavior
- [ ] Test with/without authentication
- [ ] Verify auto-refresh works

### Phase 4: Polish
- [ ] Add network logos/icons
- [ ] Optimize performance
- [ ] Add proper TypeScript types
- [ ] Handle edge cases
- [ ] Final testing

## 🚀 Future Enhancements

1. **Additional Networks**:
   - Westend Asset Hub support
   - Mainnet networks when ready

2. **Additional Tokens**:
   - Support for more ERC20 tokens
   - Token allowlist/preference system

3. **Advanced Features**:
   - Transaction history
   - Send/receive tokens
   - Network switching
   - Portfolio charts
   - Export CSV

4. **Performance**:
   - WebSocket for real-time updates
   - Background sync with Service Worker
   - IndexedDB caching

## 📚 Dependencies

**Existing**:
- `ethers` (v6.x) - Already installed
- `@privy-io/react-auth` - Already installed
- Shadcn UI components - Already installed

**May Need**:
- Network icons (use simple-icons or create custom SVGs)

## ⚡ Performance Targets

- Initial load: < 2 seconds
- Refresh: < 1 second
- Dropdown open: < 100ms
- No layout shift on load
- Smooth animations (60fps)

---

**Implementation Start Date**: 2025-01-XX
**Estimated Completion**: 2-3 hours
**Priority**: High
**Assignee**: Claude Code
