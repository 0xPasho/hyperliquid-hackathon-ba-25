# Privy Migration Guide

## Overview

This document outlines the migration from Web3Auth to Privy for authentication and wallet management in the Degu.Games platform.

## Why Privy?

Privy offers several advantages over Web3Auth:
- **Better UX**: Seamless embedded wallets with no redirects
- **Simplified Integration**: Cleaner API and better React hooks
- **Enhanced Security**: More secure key management with user-controlled recovery
- **Better Support**: Active development and better documentation
- **Chain Flexibility**: Easier to configure custom chains like PolkaVM

## What Changed

### Dependencies

**Removed:**
- `@web3auth/base`
- `@web3auth/base-provider`
- `@web3auth/ethereum-provider`
- `@web3auth/modal`

**Added:**
- `@privy-io/react-auth` - Client-side authentication SDK
- `@privy-io/server-auth` - Server-side token verification (for future use)

### File Changes

#### New Files

1. **`/src/lib/privy.ts`** - Privy configuration and helper functions
   - Configuration for Westend Asset Hub custom chain
   - Helper functions to extract user data from Privy user object
   - Login method configuration (Google, Twitter, Discord, Email)

2. **`/src/providers/PrivyProviderWrapper.tsx`** - Provider wrapper component
   - Wraps the app with PrivyProvider
   - Configured with custom chain support

#### Modified Files

1. **`/src/contexts/AuthContext.tsx`** - Complete rewrite using Privy hooks
   - Uses `usePrivy()` hook for authentication state
   - Uses `useWallets()` hook for wallet access
   - Implements automatic session restoration
   - Handles private key extraction for blockchain transactions

2. **`/src/app/layout.tsx`** - Added PrivyProvider wrapper
   - Wraps entire app with PrivyProviderWrapper
   - Maintains existing AuthProvider for backward compatibility

#### Removed Files

1. **`/src/lib/web3auth.ts`** - Old Web3Auth configuration
2. **`/src/lib/web3auth-helpers.ts`** - Old helper functions

### Components That Still Work

These components continue to work without changes:
- `/src/hooks/useAuth.ts` - Still exports the same interface
- `/src/components/auth/LoginButton.tsx` - Uses the same `login()` function
- `/src/components/auth/UserProfile.tsx` - Accesses the same user data
- All blockchain API routes - Use authentication tokens, not Web3Auth directly

## Environment Variables

### Required Changes

Update your `.env.local` file:

**Before (Web3Auth):**
```env
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_devnet
```

**After (Privy):**
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

### Getting Your Privy App ID

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new app or select an existing one
3. Go to Settings → Basics
4. Copy your App ID
5. Add whitelisted domains:
   - Development: `http://localhost:3001`
   - Production: Your production URL

## Configuration

### Custom Chain Configuration

Privy has been configured to support the Westend Asset Hub (PolkaVM) chain:

```typescript
{
  id: 420420421,
  name: 'Westend Asset Hub',
  network: 'westend-asset-hub',
  nativeCurrency: {
    name: 'Westend PAS',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Subscan',
      url: 'https://westend-asset-hub.subscan.io',
    },
  },
}
```

### Login Methods

Enabled login methods:
- **Google** - OAuth 2.0
- **Twitter** - OAuth 2.0
- **Discord** - OAuth 2.0
- **Email** - Passwordless email authentication

## Authentication Flow

### Login Flow

1. User clicks "Connect Wallet" button
2. Privy modal opens with login options
3. User selects login method (Google/Twitter/Discord/Email)
4. User authenticates with chosen provider
5. Privy creates embedded wallet automatically
6. Frontend receives Privy user object and access token
7. Frontend syncs with backend:
   - Sends Privy access token to backend
   - Backend verifies token and creates/updates user
   - Backend returns JWT token
8. JWT token stored in localStorage and cookies
9. User is authenticated

### Session Restoration

On page reload:
1. Check for stored JWT token in localStorage
2. Validate token with backend
3. If Privy session exists, restore it
4. If no Privy session, user can re-authenticate

### Logout Flow

1. User clicks logout
2. Frontend calls backend logout endpoint
3. Frontend calls `privyLogout()`
4. Clear localStorage and cookies
5. User redirected to home

## Private Key Management

### Important Security Note

Privy has a different security model than Web3Auth:
- Private keys are encrypted and stored securely
- Users must explicitly consent to export their private key
- Private key export shows a confirmation dialog

### Current Implementation

The `AuthContext` attempts to extract the private key for blockchain transactions:

```typescript
const provider = await embeddedWallet.getEthereumProvider();
const privateKey = await provider.request({
  method: 'eth_private_key'
});
```

**Note:** This will show a user consent dialog. Consider these alternatives:
1. Use Privy's wallet for signing transactions directly (recommended)
2. Request private key export only when needed
3. Implement server-side transaction signing for better security

## Migration Checklist

- [x] Install Privy SDK packages
- [x] Create Privy configuration file
- [x] Update root layout with PrivyProvider
- [x] Rewrite AuthContext using Privy hooks
- [x] Remove Web3Auth dependencies
- [x] Delete old Web3Auth files
- [ ] **Update environment variables in all environments**
- [ ] **Test login flow with all providers**
- [ ] **Test session restoration**
- [ ] **Test blockchain transactions**
- [ ] **Update CI/CD pipelines with new env vars**
- [ ] **Update deployment documentation**

## Testing Guide

### Local Testing

1. **Setup Environment:**
   ```bash
   cd packages/web
   cp .env.example .env.local
   # Add your NEXT_PUBLIC_PRIVY_APP_ID
   yarn dev
   ```

2. **Test Login Flow:**
   - Click "Connect Wallet"
   - Try logging in with Google
   - Try logging in with Twitter
   - Try logging in with Discord
   - Try logging in with Email
   - Verify wallet address is displayed
   - Verify user profile shows correct info

3. **Test Session Restoration:**
   - Log in
   - Refresh the page
   - Verify you're still logged in
   - Close browser
   - Reopen and navigate to site
   - Verify session is restored

4. **Test Blockchain Transactions:**
   - Go to `/test` page
   - Verify wallet balance is displayed
   - Try claiming tokens
   - Try transferring tokens
   - Verify transactions complete successfully

5. **Test Logout:**
   - Click logout
   - Verify you're logged out
   - Verify localStorage is cleared
   - Verify you can't access protected routes

### Production Testing

Before deploying to production:
1. Test on staging environment first
2. Verify all login methods work
3. Check that existing users can still log in
4. Monitor error logs for any authentication failures
5. Have a rollback plan ready

## Known Issues & Limitations

### Private Key Export

**Issue:** Privy shows a user consent dialog for private key export.

**Impact:** Users will see an unexpected popup when first logging in.

**Solutions:**
1. **Recommended:** Refactor to use Privy's wallet for signing instead of extracting keys
2. Request private key only when needed for blockchain operations
3. Add user education about why we need the private key

### Scratch GUI Integration

**Issue:** The Scratch GUI integration (in `/app/projects/[id]/page.tsx`) still references Web3Auth provider.

**Current Code:**
```typescript
const provider = (window as any).__WEB3_PROVIDER__;
```

**Required Action:** Update this code to work with Privy's wallet provider.

### Backward Compatibility

**Issue:** Existing sessions from Web3Auth are not compatible with Privy.

**Impact:** All users will need to re-authenticate after the migration.

**Mitigation:**
- Display a clear message to users about re-authentication
- Ensure all user data is preserved in the database
- Consider implementing a grace period for transition

## Rollback Plan

If issues arise after deployment:

1. **Immediate Rollback:**
   ```bash
   git revert <commit-hash>
   yarn install
   # Restore Web3Auth environment variables
   yarn build
   yarn start
   ```

2. **Database Impact:**
   - User accounts remain unchanged
   - Wallet addresses remain the same
   - No data migration needed for rollback

3. **Communication:**
   - Notify users of temporary authentication issues
   - Provide ETA for resolution
   - Keep status page updated

## Future Improvements

1. **Server-Side Token Verification:**
   - Implement `@privy-io/server-auth` for backend token verification
   - Add middleware to validate Privy tokens on protected routes

2. **Wallet Abstraction:**
   - Create a wallet service layer
   - Abstract away Privy-specific code
   - Make it easier to switch providers in the future

3. **Enhanced Security:**
   - Implement transaction signing on the backend
   - Remove need for private key export
   - Use Privy's delegated signing features

4. **Multi-Wallet Support:**
   - Allow users to connect external wallets
   - Support WalletConnect
   - Support Metamask and other browser wallets

5. **Analytics:**
   - Track login method usage
   - Monitor authentication failures
   - Track wallet creation success rate

## Support & Resources

- **Privy Documentation:** https://docs.privy.io/
- **Privy Dashboard:** https://dashboard.privy.io/
- **Privy Support:** support@privy.io
- **Internal Documentation:** `/docs/WEB3AUTH_IMPLEMENTATION.md` (outdated, needs update)

## Questions?

If you have questions about this migration, please contact:
- Engineering Team: [Your team contact]
- DevOps: [Your DevOps contact]

---

**Migration Date:** [Current Date]
**Migration By:** Claude Code Assistant
**Review Required By:** [Team Lead]
