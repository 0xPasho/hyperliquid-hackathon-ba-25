# Degu VM Server

Server-side Scratch VM execution for secure betting games. The VM server runs game logic authoritatively, preventing client-side manipulation and ensuring fair gameplay.

## Architecture

```
Players (Browsers) → Send inputs only
        ↓
VM Server → Runs game logic
        ↓
Players ← Receive game state
```

**Key Principle:** Server is the source of truth. Players cannot manipulate game state.

## Features

- ✅ Server-authoritative game execution
- ✅ WebSocket real-time communication
- ✅ Input rate limiting (anti-spam)
- ✅ Delta-encoded state broadcasting (bandwidth optimization)
- ✅ Queue management (when at capacity)
- ✅ Automatic cleanup and resource management
- ✅ Health monitoring and statistics

## Installation

```bash
cd packages/vm-server
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Capacity
MAX_CONCURRENT_GAMES=200
MAX_QUEUE_SIZE=1000

# Performance
STATE_BROADCAST_FPS=20
INPUT_RATE_LIMIT=100

# Backend Integration
BACKEND_URL=http://localhost:3000
BACKEND_API_TOKEN=your_backend_token_here

# Authentication
VM_SERVER_TOKEN=your_vm_server_token_here

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/vm-server.log
```

**Important:** `VM_SERVER_TOKEN` must match the token in your backend configuration.

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## API Endpoints

### REST API

**Base URL:** `http://localhost:3001/api`

#### POST /api/request-slot

Request a game slot (start VM or queue).

**Headers:**
```
Authorization: Bearer <BACKEND_API_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "roomId": "abc123",
  "projectId": "project_456",
  "projectData": { /* Scratch project JSON */ },
  "players": ["user1", "user2", "user3", "user4"]
}
```

**Response (Ready):**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "roomId": "abc123",
    "wsUrl": "ws://localhost:3001/game",
    "message": "Game started successfully"
  }
}
```

**Response (Queued):**
```json
{
  "success": true,
  "data": {
    "status": "queued",
    "roomId": "abc123",
    "queuePosition": 5,
    "message": "Game queued at position 5"
  }
}
```

#### GET /api/status

Get server health and capacity.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "online",
    "uptime": 3600,
    "capacity": {
      "activeGames": 45,
      "maxGames": 200,
      "capacityUsed": 22,
      "queueLength": 3,
      "queueMax": 1000
    },
    "stats": {
      "totalGamesStarted": 1250,
      "totalGamesCompleted": 1200,
      "totalGamesFailed": 5
    },
    "memory": {
      "heapUsed": "450 MB",
      "heapTotal": "512 MB",
      "rss": "600 MB"
    }
  }
}
```

#### POST /api/end-game/:roomId

Force end a game (admin only).

**Headers:**
```
Authorization: Bearer <BACKEND_API_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Game abc123 ended successfully"
  }
}
```

### WebSocket API

**URL:** `ws://localhost:3001/game?roomId=<ROOM_ID>&userId=<USER_ID>`

#### Client → Server Messages

**Keyboard Input:**
```json
{
  "type": "keyboard",
  "action": "keydown",
  "key": "space"
}
```

**Mouse Input:**
```json
{
  "type": "mouse",
  "x": 100,
  "y": 200,
  "isDown": true
}
```

#### Server → Client Messages

**Connected:**
```json
{
  "type": "connected",
  "roomId": "abc123",
  "userId": "user1",
  "players": ["user1", "user2", "user3", "user4"],
  "timestamp": 1234567890
}
```

**Game State (Full):**
```json
{
  "type": "full",
  "sprites": {
    "Player1": {
      "x": 45.5,
      "y": 100.2,
      "direction": 90,
      "costume": 0,
      "visible": true,
      "size": 100
    },
    "_stage": {
      "backdrop": 0,
      "backdropName": "backdrop1"
    }
  },
  "variables": {
    "score": 150,
    "timer": 45
  },
  "timestamp": 1234567890
}
```

**Game State (Delta):**
```json
{
  "type": "delta",
  "sprites": {
    "Player1": {
      "x": 46.0,
      "y": 101.5
    }
  },
  "variables": {
    "score": 151
  },
  "timestamp": 1234567891
}
```

**Game Ended:**
```json
{
  "type": "game_ended",
  "winner": "user1",
  "txHash": "0xabc123...",
  "timestamp": 1234567900
}
```

## Usage Example

### 1. Backend Requests Slot

```javascript
const response = await fetch('http://localhost:3001/api/request-slot', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${BACKEND_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roomId: 'room123',
    projectId: 'proj456',
    projectData: scratchProjectJson,
    players: ['user1', 'user2']
  })
});

const { data } = await response.json();
// data.status === 'ready' or 'queued'
// data.wsUrl === 'ws://localhost:3001/game'
```

### 2. Players Connect via WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3001/game?roomId=room123&userId=user1');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'full' || data.type === 'delta') {
    // Update game display
    renderGameState(data);
  } else if (data.type === 'game_ended') {
    // Show winner
    showWinner(data.winner, data.txHash);
  }
};

// Send inputs
document.addEventListener('keydown', (e) => {
  ws.send(JSON.stringify({
    type: 'keyboard',
    action: 'keydown',
    key: e.key
  }));
});
```

### 3. Game Ends

```javascript
// In Scratch game code
when [position] > [100]
  report winner (my user id)
  end game
end

// VM emits events → Server detects → Calls backend → Smart contract
```

## Architecture Details

### Components

**GameInstanceManager**
- Manages all running VM instances
- Capacity checking and queue management
- Finalization handling

**VMInstance**
- Wraps single Scratch VM
- Event listeners for winner/end game
- Input injection methods

**QueueManager**
- Handles waiting games when at capacity
- Position tracking
- FIFO processing

**StateSerializer**
- Extracts state from VM
- Delta encoding for bandwidth optimization
- State caching

**InputInjector**
- Routes player inputs to VMs
- Rate limiting (anti-spam)
- Input validation

**WebSocket Server**
- Player connection management
- Real-time state broadcasting
- Room-based message routing

**REST API**
- Slot management
- Health monitoring
- Admin controls

### Data Flow

```
1. Backend → POST /request-slot → VM Server starts VM
2. Players → WebSocket connect → VM Server
3. Player → keypress → WebSocket → InputInjector → VM
4. VM → executes → StateSerializer → WebSocket → All players
5. Game ends → VM emits event → GameManager → Backend API
6. Backend → Smart contract → Prize distribution
```

## Monitoring

### Logs

Logs are written to console and file (if LOG_FILE configured).

**Log Levels:**
- `error` - Errors and failures
- `warn` - Warnings and unusual events
- `info` - General information (default)
- `debug` - Detailed debugging

**Example:**
```
2025-10-29 10:15:30 [INFO] 🎮 Degu VM Server Started
2025-10-29 10:15:45 [INFO] [GameInstanceManager] Started game room123
2025-10-29 10:16:00 [INFO] [WebSocket] room123: Player user1 connected
2025-10-29 10:20:30 [INFO] [VMInstance] room123: Winner reported: user1
2025-10-29 10:20:31 [INFO] [GameInstanceManager] Game room123 finalized successfully
```

### Health Checks

```bash
# Simple health check
curl http://localhost:3001/api/health

# Detailed status
curl http://localhost:3001/api/status
```

### Metrics

Key metrics available in `/api/status`:
- Active games
- Queue length
- Capacity usage
- Total games (started/completed/failed)
- Memory usage
- Uptime

## Troubleshooting

### Issue: Connection Refused

**Cause:** VM server not running
**Solution:**
```bash
# Check if running
lsof -i :3001

# Start server
npm start
```

### Issue: Queue Full

**Cause:** Too many concurrent games
**Solution:**
- Wait for games to finish
- Increase `MAX_CONCURRENT_GAMES` (if resources available)
- Increase `MAX_QUEUE_SIZE` to allow more waiting

### Issue: High Memory Usage

**Cause:** Many concurrent VMs
**Solution:**
- Monitor with `/api/status`
- Each VM uses ~50-100MB
- Reduce `MAX_CONCURRENT_GAMES` if necessary

### Issue: Authentication Failed

**Cause:** Token mismatch
**Solution:**
- Verify `VM_SERVER_TOKEN` matches in both VM server and backend
- Check `Authorization` header format: `Bearer <token>`

## Performance

### Benchmarks

**Single VM:**
- Memory: 50-100MB
- CPU: ~20% of 1 core
- State size: 2-5KB (delta encoded)

**32GB Server Capacity:**
- Theoretical: 320 VMs
- Practical: 200 VMs (with overhead)

**Bandwidth (per game, 4 players):**
- 20 FPS × 5KB × 4 players = 400KB/sec
- 5 min game = 120MB total

### Optimization Tips

1. **Reduce FPS** if latency acceptable
   ```bash
   STATE_BROADCAST_FPS=15
   ```

2. **Lower rate limit** if spam detected
   ```bash
   INPUT_RATE_LIMIT=50
   ```

3. **Monitor memory** regularly
   ```bash
   curl http://localhost:3001/api/status
   ```

## Security

### Built-in Protections

✅ **Input validation** - All inputs validated
✅ **Rate limiting** - 100 inputs/sec per player (configurable)
✅ **Authentication** - Backend must provide valid token
✅ **Server authority** - Clients cannot manipulate state
✅ **Queue limits** - Prevent resource exhaustion

### Best Practices

1. **Use strong tokens**
   ```bash
   # Generate secure token
   openssl rand -hex 32
   ```

2. **Enable HTTPS in production**
   - Use reverse proxy (nginx, caddy)
   - Terminate SSL at proxy

3. **Monitor logs for suspicious activity**
   - High rate limiting events
   - Authentication failures
   - Unusual game patterns

4. **Regular updates**
   - Keep dependencies updated
   - Monitor security advisories

## Development

### Project Structure

```
src/
├── index.js              # Main entry point
├── config.js             # Configuration
├── logger.js             # Winston logger
├── GameInstanceManager.js # VM lifecycle management
├── VMInstance.js         # Single VM wrapper
├── QueueManager.js       # Waiting queue
├── StateSerializer.js    # State extraction/encoding
├── InputInjector.js      # Input handling/rate limiting
├── rest-api.js           # REST endpoints
└── websocket-server.js   # WebSocket server
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Test thoroughly before PR

## License

MIT

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: See `/docs` folder
- Contact: support@degu.games
