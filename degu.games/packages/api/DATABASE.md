# Database Setup

This project uses PostgreSQL with Prisma ORM.

## Setup

1. **Install PostgreSQL** (if not already installed)
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Or use Docker
   docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
   ```

2. **Create Database**
   ```sql
   createdb outfit_app_db
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and set your DATABASE_URL
   ```

4. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

5. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

## Available Commands

- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Database Schema

Currently includes:
- **User** model with `id`, `createdAt`, `updatedAt`

## Usage

```typescript
import { prisma } from "./lib/prisma";

// Create user
const user = await prisma.user.create({
  data: {}
});

// Find user
const user = await prisma.user.findUnique({
  where: { id: "user_id" }
});
```