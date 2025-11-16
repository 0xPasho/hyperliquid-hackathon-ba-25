# Game Leaderboard Implementation Plan

## Overview
Create a leaderboard system that tracks top players for each game, showing who has won the most matches. The leaderboard will be displayed on the game detail page under the "Leaderboard" tab.

## Design Requirements
- Style similar to "LIVE MINTS" table (dark theme, clean rows)
- Pagination: 10 players per page
- Shows rank, player avatar, username, wins, and win rate
- Responsive and interactive

## Backend Implementation

### 1. API Endpoint
**Route**: `GET /api/v1/games/:gameId/leaderboard`

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)

**Response**:
```json
{
  "data": [
    {
      "rank": 1,
      "userId": "user-id",
      "username": "player1",
      "avatar": "avatar-url",
      "wins": 45,
      "losses": 12,
      "winRate": 78.9
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "totalPages": 16
  }
}
```

### 2. Database Query Strategy
- Query `activities` table filtered by:
  - `gameId` (specific game)
  - `activityType` = 'GAME_WIN' or 'GAME_LOSS'
- Group by `userId`
- Count wins and losses
- Calculate win rate
- Order by wins DESC
- Apply pagination

### 3. Controller Method
- `getGameLeaderboard(req, res)`
- Validate gameId
- Parse pagination params
- Execute query with aggregation
- Return formatted response

## Frontend Implementation

### 1. Component Structure
```
GameLeaderboard.tsx
├── LeaderboardTable (main table)
├── LeaderboardRow (individual player row)
└── Pagination (page controls)
```

### 2. Table Columns
1. **Rank**: Position number with styling for top 3
2. **Player**: Avatar + username (clickable to profile)
3. **Wins**: Total wins count
4. **Win Rate**: Percentage with color coding
5. **Losses**: Total losses (optional, can be in tooltip)

### 3. Styling (matching LIVE MINTS)
- Dark background: `#0a0a0a` or similar
- Row hover: Subtle highlight
- Monospace font for numbers
- Gradient or highlight for top 3 players
- Compact spacing
- Clean borders/dividers

### 4. Features
- Loading skeleton
- Empty state ("No players yet")
- Real-time updates (optional)
- Smooth page transitions
- Rank badges for top 3 (🥇🥈🥉)

## File Structure

### Backend
```
packages/api/src/modules/games/
├── games.controller.ts     [MODIFY - add getGameLeaderboard]
├── games.service.ts        [MODIFY - add getGameLeaderboard]
└── games.routes.ts         [MODIFY - add route]
```

### Frontend
```
packages/web/src/
├── components/game/
│   ├── GameLeaderboard.tsx     [NEW]
│   └── LeaderboardSkeleton.tsx [NEW]
└── lib/
    └── api.ts                   [MODIFY - add fetchGameLeaderboard]
```

## Implementation Steps

### Phase 1: Backend (API)
1. ✅ Create leaderboard query in games.service.ts
2. ✅ Add controller method in games.controller.ts
3. ✅ Register route in games.routes.ts
4. ✅ Test endpoint with sample data

### Phase 2: Frontend (UI)
1. ✅ Create GameLeaderboard component
2. ✅ Create LeaderboardSkeleton for loading state
3. ✅ Implement pagination controls
4. ✅ Style matching LIVE MINTS table
5. ✅ Add to game detail page

### Phase 3: Polish
1. ✅ Add rank badges for top 3
2. ✅ Implement hover effects
3. ✅ Add empty state
4. ✅ Test pagination
5. ✅ Responsive design

## Data Flow
1. User navigates to game detail page → "Leaderboard" tab
2. Frontend fetches `/api/v1/games/:gameId/leaderboard?page=1&limit=10`
3. Backend queries activities, aggregates wins/losses
4. Returns ranked player list with pagination info
5. Frontend renders table with data
6. User clicks pagination → Fetch new page → Update table

## Example Query Logic (Prisma)
```typescript
// Count wins and losses per player for a game
const leaderboard = await prisma.$queryRaw`
  SELECT
    u.id as "userId",
    u.username,
    u."profilePicture" as avatar,
    COUNT(CASE WHEN a."activityType" = 'GAME_WIN' THEN 1 END) as wins,
    COUNT(CASE WHEN a."activityType" = 'GAME_LOSS' THEN 1 END) as losses,
    ROUND(
      COUNT(CASE WHEN a."activityType" = 'GAME_WIN' THEN 1 END)::numeric /
      NULLIF(COUNT(*)::numeric, 0) * 100,
      1
    ) as "winRate"
  FROM activities a
  JOIN users u ON a."userId" = u.id
  WHERE a."gameId" = ${gameId}
    AND a."activityType" IN ('GAME_WIN', 'GAME_LOSS')
  GROUP BY u.id, u.username, u."profilePicture"
  ORDER BY wins DESC
  LIMIT ${limit}
  OFFSET ${offset}
`;
```

## UI/UX Details

### Table Layout
```
┌──────────────────────────────────────────────────────────┐
│ RANK    PLAYER           WINS    WIN RATE    LOSSES      │
├──────────────────────────────────────────────────────────┤
│ 🥇 1    [👤] player1      45      78.9%       12        │
│ 🥈 2    [👤] player2      38      82.6%       8         │
│ 🥉 3    [👤] player3      35      77.8%       10        │
│    4    [👤] player4      28      70.0%       12        │
│    5    [👤] player5      24      66.7%       12        │
│    ...                                                   │
└──────────────────────────────────────────────────────────┘
         [← Previous]  Page 1 of 16  [Next →]
```

### Color Coding
- Top 1: Gold accent (#FFD700)
- Top 2-3: Silver/Bronze accent
- Win rate >= 80%: Green
- Win rate 60-79%: Yellow/Orange
- Win rate < 60%: Red

## Edge Cases
1. No games played yet → Show empty state
2. Only 1 page of data → Hide pagination
3. User clicks on player → Navigate to profile
4. Same win count → Secondary sort by win rate
5. Deleted users → Show "Deleted User"

## Performance Considerations
- Index on `activities.gameId` and `activities.activityType`
- Cache leaderboard data (5-minute cache)
- Limit max page to prevent excessive queries
- Use COUNT aggregation efficiently

---

**Estimated Time**: 2-3 hours
**Priority**: High
**Dependencies**: Game activities must be properly recorded
