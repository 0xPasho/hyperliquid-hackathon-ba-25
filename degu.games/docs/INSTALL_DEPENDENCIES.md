# Install All Required Dependencies

## Quick Install (Copy and Paste)

Run these commands in order:

### 1. Install Frontend Dependencies

```bash
cd packages/web && npm install @web3auth/modal@^8.12.4 @web3auth/base@^8.12.3 @web3auth/ethereum-provider@^8.12.3 @radix-ui/react-dropdown-menu@^2.1.2 ethers@^6.13.0
```

### 2. Install Backend Dependencies (if needed)

```bash
cd packages/api && npm install
```

### 3. Generate Prisma Client

```bash
cd packages/api && npm run db:generate
```

### 4. Run Database Migration

```bash
cd packages/api && npm run db:migrate
```

When prompted for migration name, enter: `add_web3auth_fields`

---

## Detailed Dependency List

### Frontend (packages/web)

**Web3Auth & Blockchain:**

-   `@web3auth/modal@^8.12.4` - Web3Auth modal SDK
-   `@web3auth/base@^8.12.3` - Web3Auth base package
-   `@web3auth/ethereum-provider@^8.12.3` - Ethereum provider for Web3Auth
-   `ethers@^6.13.0` - Ethereum library for wallet interactions

**UI Components:**

-   `@radix-ui/react-dropdown-menu@^2.1.2` - Dropdown menu primitive (required for UserProfile)

**Already Installed:**

-   `@radix-ui/react-avatar` ✅ (already in package.json)
-   `@radix-ui/react-slot` ✅ (already in package.json)
-   All other shadcn/ui dependencies ✅

### Backend (packages/api)

**Already Installed:**

-   `jsonwebtoken@^9.0.2` ✅ (already in package.json)
-   `@types/jsonwebtoken@^9.0.10` ✅ (already in package.json)
-   `@prisma/client` ✅
-   `prisma` ✅

---

## Verification Steps

After installing, verify everything is working:

### 1. Check Frontend Dependencies

```bash
cd packages/web
npm list @web3auth/modal @web3auth/base @web3auth/ethereum-provider ethers @radix-ui/react-dropdown-menu
```

Should show all packages installed without errors.

### 2. Check Backend Dependencies

```bash
cd packages/api
npm list jsonwebtoken @types/jsonwebtoken
```

Should show both packages installed.

### 3. Verify Prisma Client

```bash
cd packages/api
npm run db:generate
```

Should complete without errors and show "Generated Prisma Client".

### 4. Check TypeScript Compilation

```bash
# Frontend
cd packages/web
npx tsc --noEmit

# Backend
cd packages/api
npx tsc --noEmit
```

Should complete without critical errors (some warnings are okay).

---

## Troubleshooting

### Issue: "Cannot find module '@web3auth/modal'"

**Solution:**

```bash
cd packages/web
rm -rf node_modules package-lock.json
npm install
npm install @web3auth/modal @web3auth/base @web3auth/ethereum-provider ethers
```

### Issue: "Cannot find module '@radix-ui/react-dropdown-menu'"

**Solution:**

```bash
cd packages/web
npm install @radix-ui/react-dropdown-menu
```

### Issue: "Property 'walletAddress' does not exist on type 'User'"

**Solution:**

```bash
cd packages/api
npm run db:generate
```

### Issue: "Prisma Client did not initialize yet"

**Solution:**

```bash
cd packages/api
npm run db:generate
npm run dev
```

### Issue: npm install fails with peer dependency errors

**Solution:**

```bash
cd packages/web
npm install --legacy-peer-deps @web3auth/modal @web3auth/base @web3auth/ethereum-provider ethers @radix-ui/react-dropdown-menu
```

---

## After Installation

Once all dependencies are installed:

1. **Start Backend:**

    ```bash
    cd packages/api
    npm run dev
    ```

2. **Start Frontend (in new terminal):**

    ```bash
    cd packages/web
    npm run dev
    ```

3. **Test Authentication:**
    - Open http://localhost:3001
    - Navigate to a project page
    - Click "Connect Wallet"
    - Login with Google/Twitter/Discord
    - Verify profile appears in header

---

## Package.json Updates

If you want to add these to your package.json manually:

### packages/web/package.json

Add to `dependencies`:

```json
{
    "dependencies": {
        "@web3auth/modal": "^8.12.4",
        "@web3auth/base": "^8.12.3",
        "@web3auth/ethereum-provider": "^8.12.3",
        "@radix-ui/react-dropdown-menu": "^2.1.2",
        "ethers": "^6.13.0"
    }
}
```

Then run:

```bash
cd packages/web && npm install
```

---

## Success Checklist

-   [ ] All npm install commands completed without errors
-   [ ] `npm run db:generate` completed successfully
-   [ ] `npm run db:migrate` created migration
-   [ ] Backend starts without errors (port 3000)
-   [ ] Frontend starts without errors (port 3001)
-   [ ] No TypeScript errors in console
-   [ ] Web3Auth modal appears when clicking "Connect Wallet"
-   [ ] Can login with social provider
-   [ ] User profile appears in header after login
-   [ ] Can logout successfully

---

## Quick Test Command

After installation, test everything at once:

```bash
# Terminal 1 - Backend
cd packages/api && npm run db:generate && npm run db:migrate && npm run dev

# Terminal 2 - Frontend
cd packages/web && npm run dev
```

Then open http://localhost:3001 and test the authentication flow.
