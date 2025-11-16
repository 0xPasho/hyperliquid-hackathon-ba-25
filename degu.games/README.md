# DEGU — Code-Free Competitive GameFi Platform

## Live Link

[degu.games](https://degu.games)

## The Problem: The GameFi Creation Gap

The $100+ billion gaming industry lacks a decentralized engine for User-Generated Content (UGC) in the GameFi space. Developers and creators face three critical barriers:

**Technical Barrier**: Creating a simple, on-chain betting game requires months of Solidity/smart contract development and costly audits (often $10,000+). Most creators lack the technical expertise to build provably fair blockchain games.

**Trust Barrier**: Existing online betting relies on centralized, opaque logic. Players demand verifiable fairness that blockchain was meant to provide, but current platforms fail to deliver transparency.

**Monetization Barrier**: There is no easy way for casual creators to launch an economic model instantly and capture value from their game's activity without building complex infrastructure.

## Proposed Solution: DEGU — The Scratch-meets-Polymarket Platform

DEGU transforms game development into a simple, drag-and-drop process for the Web3 era. We enable **Code-Free Creation of Provably Fair Betting Mini-Games**, democratizing GameFi creation and moving it beyond corporate studios to embrace the creativity of individual users.

### The DEGU Core Loop

1. **Create**: Users design competitive, short-form mini-games (e.g., reaction time tests, speed puzzles, multiplayer challenges) using a massive asset library and visual Block Logic Editor powered by Scratch.

2. **Monetize**: Creators set the rules, determine the pot structure, and define custom commission percentages on all wagers (pump.fun model), becoming the "house" of their own game.

3. **Bet & Compete**: Players enter games by placing crypto wagers, betting on their own skill or on specific players to win competitions.

4. **Verify**: Game outcomes are instantly processed on-chain using transparent, decentralized seed logic (similar to Stake.com), guaranteeing **Provable Fairness** to all participants.

## Innovation: The Unstoppable Trio

DEGU stands out by merging three powerful concepts:

-   **UGC + GameFi**: Democratizing GameFi creation, empowering anyone to become a game creator without coding knowledge.
-   **Decentralized Economics**: Instant monetization for creators through custom commission models tied to game activity.
-   **Verifiable Integrity**: Eliminating trust requirements by settling game outcomes with transparent, on-chain logic, making the platform censorship-resistant and inherently fair.

## Technologies

### Core Stack

-   **Next.js 14** - App routing, server-side rendering, and API routes
-   **Scratch VM & GUI** - Visual block-based game logic editor (forked and enhanced)
-   **React 18** - Component-based UI architecture
-   **TypeScript** - Fully typed solution for reliability and maintainability
-   **Tailwind CSS** & **Shadcn/ui** - Modern, responsive UI component design
-   **Prisma** - Type-safe database ORM with PostgreSQL

### Blockchain & Web3

-   **Web3Auth** - Seamless social login with embedded wallet integration
-   **Ethers.js v6** - Ethereum blockchain interaction
-   **Smart Contracts** - Custom Solidity contracts for provably fair game logic
-   **IPFS** - Decentralized storage for game assets

### Backend & Infrastructure

-   **Express.js** - RESTful API server
-   **PostgreSQL** - Relational database for user data and game metadata
-   **WebSockets** - Real-time multiplayer synchronization
-   **JWT** - Secure authentication and session management

## Characteristics of This Solution

✅ **Zero-Code Game Creation** - Visual block-based editor for building complex game logic
✅ **Provably Fair Gaming** - On-chain verification of all game outcomes
✅ **Instant Monetization** - Creators earn commissions from player wagers
✅ **Social Authentication** - Google OAuth via Web3Auth for seamless onboarding
✅ **Embedded Wallets** - Non-custodial wallets managed through Web3Auth
✅ **Multiplayer Support** - Real-time room-based competitive gameplay
✅ **Responsive Design** - Mobile-friendly interface with modern UI/UX
✅ **Scalable Architecture** - Monorepo structure for maintainable codebase
✅ **Blockchain Agnostic** - Deployable to multiple EVM-compatible chains
✅ **Asset Library** - Extensive collection of sprites, sounds, and backdrops
✅ **Project Sharing** - Community-driven game discovery and remixing
✅ **Analytics Dashboard** - Track game performance and earnings

## Monorepo Structure

```
/packages
  /scratch-gui      - Visual editor UI (buttons, menus, drag-and-drop interface)
  /scratch-vm       - Virtual machine that executes game logic
  /scratch-render   - Canvas rendering engine for sprites and backdrops
  /scratch-svg-renderer - SVG processing for vector graphics
  /web              - Next.js platform (landing, marketplace, user profiles)
  /api              - Express backend (authentication, game state, database)
  /contracts        - Solidity smart contracts for on-chain game logic
  /cloud-server     - WebSocket server for multiplayer synchronization
```

## Prerequisites

-   **Node.js** v18+ and npm/pnpm/yarn
-   **PostgreSQL** database (local or hosted)
-   **Web3Auth** client credentials ([get here](https://dashboard.web3auth.io/))
-   **Blockchain RPC endpoint** (Alchemy, Infura, or self-hosted)

## Quick Start

### 1. Clone the Repository

```bash
git clone git@github.com:0xPasho/degu.games.git
cd scratch-editor
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all package dependencies
npm run install:all
```

### 3. Configure Environment Variables

#### API Package (`packages/api/.env`)

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/degu_db?schema=public"

# Server
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:8601,http://localhost:8602

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars_change_in_production
JWT_EXPIRES_IN=7d

# Web3Auth Configuration
WEB3AUTH_CLIENT_ID=your_web3auth_client_id
WEB3AUTH_CLIENT_SECRET=your_web3auth_client_secret
WEB3AUTH_JWKS_ENDPOINT=https://api-auth.web3auth.io/.well-known/jwks.json

# Optional: AI Features
FAL_KEY=your_fal_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
REMOVE_BG_API_KEY=your_remove_bg_api_key_here
```

#### Web Package (`packages/web/.env.local`)

```bash
# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_devnet

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Scratch GUI Configuration
NEXT_PUBLIC_SCRATCH_GUI_URL=http://localhost:8601
```

### 4. Set Up Database

```bash
cd packages/api
npx prisma generate
npx prisma db push
```

### 5. Run Development Servers

**Option A: Run all services (recommended)**

```bash
# From root directory
npm run dev:all
```

**Option B: Run individually**

```bash
# Terminal 1 - API Server
cd packages/api
npm run dev

# Terminal 2 - Web Platform
cd packages/web
npm run dev

# Terminal 3 - Scratch GUI
cd packages/scratch-gui
npm start
```

### 6. Access the Platform

-   **Web Platform**: [http://localhost:3001](http://localhost:3001)
-   **Scratch Editor**: [http://localhost:8601](http://localhost:8601)
-   **API Docs**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)

## Key Routes

### Web Platform (`packages/web`)

-   **/** - Landing page showcasing DEGU features
-   **/explore** - Browse community-created games
-   **/projects/:id** - View and play individual games
-   **/projects/:id/edit** - Edit game settings (owner only)
-   **/rooms/:id** - Multiplayer game lobby
-   **/users/:id** - User profile and portfolio
-   **/users/:id/edit** - Edit user profile (owner only)
-   **/settings** - Account settings and wallet management

### API Endpoints (`packages/api`)

-   **POST /api/v1/auth/login** - Web3Auth authentication
-   **GET /api/v1/auth/me** - Get current user
-   **GET /api/v1/projects** - List public games
-   **POST /api/v1/projects** - Create new game
-   **PUT /api/v1/projects/:id** - Update game
-   **GET /api/v1/rooms** - List active game rooms
-   **POST /api/v1/rooms** - Create multiplayer room
-   **POST /api/v1/rooms/:id/join** - Join game room
-   **POST /api/v1/blockchain/create-game** - Deploy game to blockchain
-   **POST /api/v1/blockchain/join-game** - Place wager on blockchain

## Building for Production

### 1. Build All Packages

```bash
# From root directory
npm run build:all
```

### 2. Production Environment Variables

Update your environment variables for production:

```bash
# API Package
DATABASE_URL=your_production_database_url
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://degu.games,https://editor.degu.games

# Web Package
NEXT_PUBLIC_API_URL=https://api.degu.games/api/v1
NEXT_PUBLIC_SCRATCH_GUI_URL=https://editor.degu.games
```

### 3. Deploy

**Recommended Deployment Stack:**

-   **Web Platform**: Vercel or Netlify
-   **API Server**: Railway, Render, or AWS EC2
-   **Database**: Supabase, Neon, or AWS RDS
-   **Scratch GUI**: Vercel or Cloudflare Pages
-   **Smart Contracts**: Ethereum, Polygon, or Base

## Development Workflow

### Running Tests

```bash
# Run all tests
npm run test

# Run specific package tests
cd packages/api && npm test
cd packages/web && npm test
```

### Database Migrations

```bash
cd packages/api
npx prisma migrate dev --name your_migration_name
npx prisma generate
```

### Linting & Formatting

```bash
# Lint all packages
npm run lint

# Format code
npm run format
```

## Smart Contract Deployment

```bash
cd packages/contracts

# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Architecture Highlights

### Authentication Flow

1. User signs in with Google via Web3Auth
2. Web3Auth creates embedded, non-custodial wallet
3. Backend validates JWT token from Web3Auth
4. Private key stored securely in backend for blockchain transactions

### Game Creation Flow

1. User creates game in Scratch visual editor
2. Game data saved to PostgreSQL with metadata
3. Creator publishes game to blockchain (optional)
4. Smart contract deploys with custom commission settings
5. Game appears in community marketplace

### Multiplayer Flow

1. Player creates room for specific game
2. Other players join via room link
3. WebSocket server synchronizes game state
4. Players place wagers through smart contract
5. Game executes with provably fair randomness
6. Winners automatically receive payouts on-chain

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built on top of the amazing [Scratch](https://scratch.mit.edu/) project by the Lifelong Kindergarten Group at MIT Media Lab.

## Support

-   **Documentation**: [docs.degu.games](https://docs.degu.games)
-   **Discord**: [discord.gg/degu](https://discord.gg/degu)
-   **Twitter**: [@degugames](https://twitter.com/degugames)
-   **Email**: support@degu.games

---

**DEGU is building the GameFi infrastructure for the next million creators.**
_Democratizing game creation. Monetizing creativity. Verifying fairness._
