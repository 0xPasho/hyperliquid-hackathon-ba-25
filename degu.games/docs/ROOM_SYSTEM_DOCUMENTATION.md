# Room System Documentation

## Overview

The multiplayer room/lobby system allows multiple instances of the same Scratch game to run simultaneously with different players. Each "room" is essentially a multiplayer session where N players can join and play together, with support for blockchain integration.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│   Frontend      │         │   Backend API    │         │   Database          │
│   (Next.js)     │◄────────┤   (Express)      │◄────────┤   (PostgreSQL)      │
│                 │         │                  │         │                     │
│  - RoomLobby    │         │  - RoomService   │         │  - Room             │
│  - RoomCard     │         │  - RoomController│         │  - RoomPlayer       │
│  - room-api.ts  │         │  - roomRoutes    │         │  - RoomStatus enum  │
└─────────────────┘         └──────────────────┘         └─────────────────────┘
```

## Database Schema

### Room Model

```prisma
model Room {
  id                String      @id @default(cuid())
  name              String      @default("Game Room")
  projectId         String      // Reference to the game/project
  hostId            String      // User who created the room
  maxPlayers        Int         @default(4)
  currentPlayers    Int         @default(1)
  status            RoomStatus  @default(WAITING)
  blockchainGameId  String?     // ID from SimpleBetting contract (optional)
  isPrivate         Boolean     @default(false)
  password          String?     // For private rooms
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  startedAt         DateTime?   // When game started
  completedAt       DateTime?   // When game completed

  project           Project     @relation(fields: [projectId], references: [id])
  host              User        @relation("RoomHost", fields: [hostId], references: [id])
  players           RoomPlayer[]
}
```

### RoomPlayer Model

```prisma
model RoomPlayer {
  id              String    @id @default(cuid())
  roomId          String
  userId          String
  joinedAt        DateTime  @default(now())
  leftAt          DateTime? // Null if still in room
  isReady         Boolean   @default(false)
  walletAddress   String?   // For blockchain games

  room            Room      @relation(fields: [roomId], references: [id])
  user            User      @relation("RoomPlayers", fields: [userId], references: [id])
}
```

### RoomStatus Enum

```prisma
enum RoomStatus {
  WAITING   // Waiting for players to join
  READY     // All players ready, can start
  PLAYING   // Game in progress
  COMPLETED // Game finished
  CANCELLED // Game cancelled
}
```

## API Endpoints

### Room Management

**POST /api/v1/rooms**
- Create a new room
- Body: `{ projectId, hostId, name?, maxPlayers?, isPrivate?, password?, blockchainGameId? }`
- Returns: Room object with project and host details

**GET /api/v1/rooms/:id**
- Get room details
- Returns: Room with all players, project, and host information

**PUT /api/v1/rooms/:id**
- Update room (host only)
- Body: `{ name?, maxPlayers?, status?, blockchainGameId? }`

**DELETE /api/v1/rooms/:id**
- Delete room (host only)
- Body: `{ userId }`

### Room Discovery

**GET /api/v1/rooms/project/:projectId**
- Get all rooms for a specific project
- Query: `includeCompleted=true` (optional)
- Returns: Array of rooms

**GET /api/v1/rooms/active**
- Get all active public rooms (global lobby)
- Query: `limit=50` (optional)
- Returns: Array of active rooms

**GET /api/v1/rooms/blockchain/:gameId**
- Get room by blockchain game ID
- Returns: Room linked to blockchain game

### Player Actions

**POST /api/v1/rooms/:id/join**
- Join a room
- Body: `{ userId, walletAddress?, password? }`
- Returns: RoomPlayer object

**POST /api/v1/rooms/:id/leave**
- Leave a room
- Body: `{ userId }`
- Returns: Success status

**POST /api/v1/rooms/:id/ready**
- Toggle player ready status
- Body: `{ userId }`
- Returns: Updated RoomPlayer
- Auto-updates room status to READY when all players ready

**POST /api/v1/rooms/:id/start**
- Start the game (host only)
- Body: `{ hostId }`
- Returns: Updated room with PLAYING status

**POST /api/v1/rooms/:id/complete**
- Mark game as completed
- Returns: Updated room with COMPLETED status

## Frontend Components

### RoomCard

Displays a single room with:
- Room name and project title
- Host information
- Player count (current/max)
- Status badge (Waiting, Ready, Playing, etc.)
- Lock icon for private rooms
- Blockchain badge if linked to betting contract
- Action buttons (Join, View, Watch)

**Props:**
```typescript
interface RoomCardProps {
    room: Room;
    onJoin?: (roomId: string) => void;
    onView?: (roomId: string) => void;
    currentUserId?: string;
}
```

### RoomLobby

Complete lobby interface with:
- List of all active rooms for a project
- Auto-refresh every 3 seconds
- Create room button
- Manual refresh button
- Grid layout (responsive: 1/2/3 columns)

**Props:**
```typescript
interface RoomLobbyProps {
    projectId: string;
    onRoomClick?: (roomId: string) => void;
}
```

**Features:**
- Real-time updates via polling
- Authentication-gated creation/joining
- Empty state with call-to-action
- Loading states

## Frontend API Helpers

Located in `/packages/web/src/lib/room-api.ts`

### Main Functions

```typescript
// Create a new room
createRoom(data: CreateRoomData, token?: string): Promise<Room>

// Get room details
getRoom(roomId: string): Promise<Room>

// Get rooms for a project
getRoomsByProject(projectId: string, includeCompleted?: boolean): Promise<Room[]>

// Get all active rooms
getActiveRooms(limit?: number): Promise<Room[]>

// Join a room
joinRoom(roomId: string, userId: string, walletAddress?: string, password?: string, token?: string): Promise<RoomPlayer>

// Leave a room
leaveRoom(roomId: string, userId: string, token?: string): Promise<void>

// Toggle ready status
toggleReady(roomId: string, userId: string, token?: string): Promise<RoomPlayer>

// Start game (host only)
startGame(roomId: string, hostId: string, token?: string): Promise<Room>

// Update room
updateRoom(roomId: string, data: UpdateRoomData, token?: string): Promise<Room>

// Delete room (host only)
deleteRoom(roomId: string, userId: string, token?: string): Promise<void>

// Get room by blockchain game ID
getRoomByBlockchainGameId(gameId: string): Promise<Room>

// Poll for updates (real-time-like behavior)
pollRoomUpdates(roomId: string, onUpdate: (room: Room) => void, intervalMs?: number): () => void
```

## Usage Flow

### 1. Player Creates a Room

```typescript
// User clicks "Create Room" on project page
const room = await createRoom({
    projectId: "proj_123",
    hostId: userId,
    maxPlayers: 4,
    isPrivate: false
});

// Room is created with:
// - status: WAITING
// - currentPlayers: 1 (host)
// - Host automatically added as first player (ready)
```

### 2. Other Players Join

```typescript
// Player clicks "Join" on a room card
await joinRoom(roomId, userId, walletAddress);

// Player is added to room
// currentPlayers incremented
// Player status: not ready
```

### 3. Players Get Ready

```typescript
// Each player toggles ready
await toggleReady(roomId, userId);

// When all players ready:
// - Room status auto-updates to READY
// - Host can start game
```

### 4. Host Starts Game

```typescript
// Host clicks "Start Game"
await startGame(roomId, hostId);

// Room status: PLAYING
// startedAt timestamp set
// Game instance launches
```

### 5. Game Completes

```typescript
// Game ends (manually or via blockchain)
await updateRoom(roomId, {
    status: RoomStatus.COMPLETED,
    completedAt: new Date()
});

// Room status: COMPLETED
// Can view stats/results
```

## Blockchain Integration

### Linking Room to Betting Contract

When creating a room with blockchain betting:

```typescript
// 1. Create blockchain betting game first
const gameResult = await authManager.createBettingGame('DEGU', 100, 2, 4);
const blockchainGameId = gameResult.gameId;

// 2. Create room with blockchain game ID
const room = await createRoom({
    projectId: "proj_123",
    hostId: userId,
    maxPlayers: 4,
    blockchainGameId: blockchainGameId // Link to blockchain
});

// 3. Players join room AND blockchain game
await joinRoom(roomId, userId, walletAddress);
await authManager.joinBettingGame(blockchainGameId, 'DEGU', betAmount);

// 4. Start both
await startGame(roomId, hostId);
await authManager.startBettingGame(blockchainGameId);

// 5. Complete and distribute prizes
// Game logic determines winners
const winners = [winnerAddress1, winnerAddress2];
await authManager.selectBettingWinners(blockchainGameId, winners);

// Winners claim
await authManager.claimBettingPrize(blockchainGameId);

// Mark room as completed
await updateRoom(roomId, { status: RoomStatus.COMPLETED });
```

### Finding Room by Blockchain Game

```typescript
// If you have a blockchain game ID, find its room
const room = await getRoomByBlockchainGameId(blockchainGameId);

// Use this to:
// - Show room details in blockchain UI
// - Allow players to rejoin after disconnect
// - Link blockchain events to room state
```

## Real-Time Updates

### Polling Strategy

The RoomLobby component uses polling (every 3 seconds) to simulate real-time updates:

```typescript
useEffect(() => {
    loadRooms(); // Initial load

    // Poll every 3 seconds
    const interval = setInterval(loadRooms, 3000);

    return () => clearInterval(interval); // Cleanup
}, [projectId]);
```

### Custom Polling

For individual room updates:

```typescript
const cleanup = await pollRoomUpdates(
    roomId,
    (updatedRoom) => {
        console.log('Room updated:', updatedRoom);
        setRoom(updatedRoom);
    },
    2000 // Poll every 2 seconds
);

// Cleanup when done
cleanup();
```

### Future: WebSocket Support

For true real-time updates, consider adding WebSocket support:

```typescript
// Socket.io or native WebSockets
socket.on('room:updated', (room) => {
    setRoom(room);
});

socket.on('player:joined', (player) => {
    updatePlayers(player);
});

socket.on('game:started', (roomId) => {
    navigateToGame(roomId);
});
```

## Security Considerations

### Room Access

- **Public Rooms**: Anyone can join (no password)
- **Private Rooms**: Require password to join
- **Host Controls**: Only host can start, update, or delete room
- **Player Limits**: Enforced at API level (maxPlayers check)

### Authentication

- All write operations require authentication token
- Read operations (viewing rooms) are public
- User ID verified against JWT token

### Blockchain Security

- Wallet addresses stored for verification
- Blockchain game IDs are immutable once set
- Cannot modify blockchain game ID after room creation
- All blockchain transactions require user signature

## Cleanup & Maintenance

### Automatic Cleanup

The `cleanupOldRooms()` service method removes old completed/cancelled rooms:

```typescript
// Run daily via cron job
await roomService.cleanupOldRooms(7); // Delete rooms older than 7 days
```

### Manual Cleanup

Players can leave rooms:
```typescript
await leaveRoom(roomId, userId);

// If host leaves WAITING room: auto-cancelled
// If last player leaves: auto-cancelled
```

Host can delete room:
```typescript
await deleteRoom(roomId, hostId);
// Removes room and all player records
```

## Error Handling

### Common Errors

**"Room is full"**
- Trying to join when currentPlayers >= maxPlayers
- Solution: Wait for player to leave or join different room

**"Invalid password"**
- Wrong password for private room
- Solution: Get correct password from host

**"You are already in this room"**
- Player tries to join same room twice
- Solution: UI should prevent this

**"Only the host can start the game"**
- Non-host tries to start
- Solution: Only show start button to host

**"Need at least 2 players to start"**
- Host tries to start with only 1 player
- Solution: Disable start until 2+ players

## Best Practices

### For Game Developers

1. **Set Appropriate Player Limits**: Consider game balance (2-4 recommended)
2. **Use Private Rooms for Tournaments**: Password-protect competitive games
3. **Link Blockchain Early**: Create blockchain game before room
4. **Handle Disconnects**: Save game state, allow rejoin
5. **Test with Multiple Accounts**: Verify multiplayer flow

### For Platform Integration

1. **Show Active Room Count**: Display on project page
2. **Highlight Blockchain Rooms**: Special badge for betting games
3. **Filter by Status**: Allow users to filter WAITING vs PLAYING
4. **Room History**: Keep completed games for stats
5. **Leaderboards**: Aggregate room completion data

## File Structure

```
packages/
├── api/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema with Room models
│   └── src/
│       ├── modules/
│       │   └── rooms/
│       │       ├── room.service.ts      # Business logic
│       │       ├── room.controller.ts   # HTTP handlers
│       │       ├── room.routes.ts       # Route definitions
│       │       └── index.ts             # Module exports
│       └── routes/
│           └── index.ts                  # Register room routes
│
└── web/
    ├── src/
    │   ├── lib/
    │   │   └── room-api.ts              # Frontend API helpers
    │   ├── components/
    │   │   └── rooms/
    │   │       ├── RoomCard.tsx          # Room display component
    │   │       └── RoomLobby.tsx         # Lobby container
    │   └── app/
    │       └── projects/
    │           └── [id]/
    │               └── page.tsx          # Project page with lobby
```

## Testing

### Manual Testing Checklist

- [ ] Create room as logged-in user
- [ ] Join room with second account
- [ ] Toggle ready status for both players
- [ ] Start game as host
- [ ] Leave room mid-game
- [ ] Create private room with password
- [ ] Try joining with wrong password
- [ ] Try joining full room
- [ ] Create blockchain-linked room
- [ ] Complete game and verify status updates

### API Testing

```bash
# Create room
curl -X POST http://localhost:3000/api/v1/rooms \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj_123","hostId":"user_456","maxPlayers":4}'

# Get rooms for project
curl http://localhost:3000/api/v1/rooms/project/proj_123

# Join room
curl -X POST http://localhost:3000/api/v1/rooms/room_789/join \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_101"}'

# Start game
curl -X POST http://localhost:3000/api/v1/rooms/room_789/start \
  -H "Content-Type: application/json" \
  -d '{"hostId":"user_456"}'
```

## Future Enhancements

### Planned Features

1. **WebSocket Real-Time Updates**: Replace polling with WebSockets
2. **Spectator Mode**: Allow non-players to watch
3. **Room Chat**: In-lobby text chat
4. **Invite Links**: Generate shareable room URLs
5. **Team Support**: Divide players into teams
6. **Tournaments**: Multi-round bracket system
7. **Room Templates**: Pre-configured room settings
8. **Player Ratings**: ELO-style ranking system
9. **Replay System**: Save and replay completed games
10. **Cross-Project Lobbies**: Global lobby across all games

### Technical Improvements

1. **Database Indexing**: Optimize for large room counts
2. **Caching**: Redis for active rooms
3. **Load Balancing**: Distribute rooms across servers
4. **Rate Limiting**: Prevent room spam
5. **Metrics**: Track room creation, join rates, completion
6. **Admin Tools**: Moderate rooms, ban users
7. **Mobile App**: Native iOS/Android room browsing
8. **Push Notifications**: Alert when room fills up

## Support

For issues or questions:
- Check API logs: `packages/api/logs`
- Verify database: `npx prisma studio`
- Test endpoints: Use Postman or curl
- Frontend debugging: Browser DevTools → Network tab

## License

MIT - Same as parent project
