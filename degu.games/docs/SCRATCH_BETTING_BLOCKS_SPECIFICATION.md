# Scratch Betting Blocks - Technical Specification

## Document Purpose
This document defines the **complete specification** for Scratch blocks that enable betting/gaming integration with the Degu platform's smart contracts. Use this as the source of truth for implementation.

**Last Updated**: 2025-10-28
**Status**: Ready for Implementation
**Target**: Scratch-GUI Integration with GameEscrow.sol

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Block Specifications](#block-specifications)
4. [Smart Contract Integration](#smart-contract-integration)
5. [Example Implementations](#example-implementations)
6. [Backend Integration](#backend-integration)
7. [Edge Cases & Error Handling](#edge-cases--error-handling)
8. [Implementation Checklist](#implementation-checklist)

---

## System Overview

### Core Principle
**Games handle gameplay. Backend handles money.**

Games use minimal blocks to:
- Read room/betting context (entry fee, prize pool, players)
- Report game results (who won)
- Let backend verify and trigger smart contract payouts

### Key Constraints
- ✅ No blockchain logic in Scratch
- ✅ No wallet management in games
- ✅ No custom prize percentages (contract splits equally)
- ✅ No team logic (MVP - free-for-all only)
- ✅ Auto-start games (no "ready check" or "is game started")

### Economic Model

```
Player Payment (e.g., 5 USDC per player)
  ↓
Split on entry:
├─ 10% → Platform (Degu)
├─ 0-10% → Game Creator (set at game creation)
└─ 80-90% → Prize Pool (held in smart contract escrow)
  ↓
Game finishes, winners determined
  ↓
Contract splits prize pool equally among all winners
```

**Example:**
```
4 players × 5 USDC = 20 USDC total
├─ Platform: 2 USDC (10%)
├─ Creator: 2 USDC (10%)
└─ Prize Pool: 16 USDC (80%)
    └─ Winner(s) split this amount
```

---

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    WEB APPLICATION                       │
│  - User creates room                                    │
│  - Sets entry fee (≥ game minimum)                     │
│  - Players join and pay                                 │
│  - Smart contract holds funds in escrow                 │
└──────────────────┬──────────────────────────────────────┘
                   │ Launches game with room data
                   ↓
┌─────────────────────────────────────────────────────────┐
│              SCRATCH GAME (scratch-gui)                  │
│  - Reads room context via blocks                        │
│  - Players compete                                       │
│  - Game reports winner(s) via blocks                    │
└──────────────────┬──────────────────────────────────────┘
                   │ Sends result
                   ↓
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js API)                   │
│  - Receives game result                                 │
│  - Verifies legitimacy (anti-cheat)                     │
│  - Maps player indices → wallet addresses              │
│  - Calls smart contract                                 │
└──────────────────┬──────────────────────────────────────┘
                   │ Triggers payout
                   ↓
┌─────────────────────────────────────────────────────────┐
│         SMART CONTRACT (GameEscrow.sol)                  │
│  - Validates winners are actual players                 │
│  - Calculates fees (creator + platform)                │
│  - Splits prize pool equally among winners              │
│  - Transfers funds to player balances                   │
└─────────────────────────────────────────────────────────┘
```

---

## Block Specifications

### Category 1: Sensing Blocks (Read-Only)

**Purpose:** Allow games to read room/betting context for display and logic.

#### Block 1.1: Room Player Count
```javascript
(room player count)
```
- **Returns:** Number (e.g., `4`)
- **Description:** Total number of players in the room
- **Use Case:** Check how many players are competing
- **Example:**
  ```scratch
  say (join "Players: " (room player count)) for 2 seconds
  ```

---

#### Block 1.2: Room Entry Fee
```javascript
(room entry fee)
```
- **Returns:** Number (e.g., `5`)
- **Description:** Entry fee each player paid (in USDC)
- **Use Case:** Display stakes to players
- **Example:**
  ```scratch
  say (join "Entry: " (room entry fee) " USDC") for 2 seconds
  ```

---

#### Block 1.3: Room Prize Pool
```javascript
(room prize pool)
```
- **Returns:** Number (e.g., `16`)
- **Description:** Total prize pool available to winners (after fees)
- **Formula:** `(playerCount × entryFee) - creatorFee - platformFee`
- **Use Case:** Show potential winnings
- **Example:**
  ```scratch
  say (join "Prize: " (room prize pool) " USDC") for 2 seconds
  ```

---

#### Block 1.4: Room ID
```javascript
(room id)
```
- **Returns:** Text (e.g., `"abc123"`)
- **Description:** Unique identifier for this game room
- **Use Case:** Backend tracking, debugging
- **Example:**
  ```scratch
  // Mostly for internal use, not displayed to players
  broadcast (join "room:" (room id))
  ```

---

#### Block 1.5: Room Time Remaining
```javascript
(room time remaining)
```
- **Returns:** Number in seconds (e.g., `120`)
- **Special Value:** `0` if no time limit
- **Description:** Seconds remaining before game times out
- **Use Case:** Display countdown, implement time-based mechanics
- **Example:**
  ```scratch
  say (join "Time: " (room time remaining) "s") for 1 seconds
  ```

---

#### Block 1.6: Room Players
```javascript
(room players)
```
- **Returns:** List of strings (e.g., `["Alice", "Bob", "Carol", "Dave"]`)
- **Description:** Ordered list of player usernames
- **Index:** Player 1 is at index 1, Player 2 at index 2, etc.
- **Use Case:** Display player names, iterate over players
- **Example:**
  ```scratch
  for each [player v] in (room players)
    say (join "Welcome " (player)) for 1 seconds
  end
  ```

---

#### Block 1.7: My Player Index
```javascript
(my player index)
```
- **Returns:** Number (1 to maxPlayers, e.g., `2`)
- **Description:** This player's position in the room
- **Use Case:** Assign positions, colors, spawn points
- **Example:**
  ```scratch
  if <(my player index) = (1)> then
    go to x: (-100) y: (0)
    set [color v] to [red]
  end
  if <(my player index) = (2)> then
    go to x: (100) y: (0)
    set [color v] to [blue]
  end
  ```

---

#### Block 1.8: Player Username
```javascript
(player (1) username)
```
- **Parameter:** Player index (number)
- **Returns:** Text (e.g., `"Alice"`)
- **Description:** Get username of specific player
- **Use Case:** Display player names, show who won
- **Example:**
  ```scratch
  say (join (player (1) username) " is in the lead!") for 2 seconds
  ```

---

#### Block 1.9: Is Time Expired?
```javascript
<is time expired?>
```
- **Returns:** Boolean (`true` or `false`)
- **Description:** Check if time limit has been reached
- **Use Case:** End game on timeout, trigger sudden death
- **Example:**
  ```scratch
  if <is time expired?> then
    // Find player with highest score and declare winner
    report winner (playerWithHighestScore)
    end game
  end
  ```

---

### Category 2: Event Blocks (Write/Action)

**Purpose:** Allow games to report results and control game state.

#### Block 2.1: Report Winner (Single)
```javascript
report winner (playerIndex)
```
- **Parameter:** Player index (number, 1-maxPlayers)
- **Description:** Declare a single winner
- **Backend Action:** Sends winner's wallet address to smart contract
- **Contract Behavior:** Winner receives 100% of prize pool
- **Use Case:** Racing games, battle royale, high score competitions
- **Example:**
  ```scratch
  when <I cross finish line?>
    report winner (my player index)
    end game
    say "You won!" for 3 seconds
    stop [all]
  end
  ```

---

#### Block 2.2: Report Winners (Multiple)
```javascript
report winners [list of indices]
```
- **Parameter:** List of player indices (e.g., `[1, 3, 4]`)
- **Description:** Declare multiple winners who split prize equally
- **Backend Action:** Sends multiple wallet addresses to smart contract
- **Contract Behavior:** Prize pool divided equally among all winners
- **Use Case:** Co-op games, top 3 finishers, survival games
- **Example:**
  ```scratch
  // Top 3 finishers split prize
  report winners [finishOrder]
  end game
  ```
  ```scratch
  // Survivors split prize
  set [survivors v] to []
  for each [i v] in (1) to (room player count)
    if <player (i) is alive?> then
      add (i) to [survivors v]
    end
  end
  report winners (survivors)
  end game
  ```

---

#### Block 2.3: Report No Winners (Optional)
```javascript
report no winners
```
- **Description:** Declare that no players won (house wins)
- **Backend Action:** Does NOT call smart contract's `reportGameResult`
- **Contract Behavior:** Prize pool remains (becomes platform revenue)
- **Use Case:** Boss defeats all players, impossible challenge
- **Example:**
  ```scratch
  if <all players died> then
    report no winners
    end game
    say "Boss wins! Better luck next time." for 3 seconds
  end
  ```

**Note:** This block is **optional** for MVP. Can be added in Phase 2.

---

#### Block 2.4: End Game
```javascript
end game
```
- **Description:** Signal that game session is complete
- **Backend Action:** Marks game as finished in database
- **Use Case:** Always called after reporting winner(s)
- **Example:**
  ```scratch
  report winner (1)
  end game  // ← Always pair these
  stop [all]
  ```

---

## Smart Contract Integration

### Contract: GameEscrow.sol

**Location:** `packages/contracts/contracts/GameEscrow.sol`

### Relevant Contract Functions

#### Oracle Calls This After Backend Verification
```solidity
function reportGameResult(
    uint256 gameId,
    address[] calldata winners  // Array of winner wallet addresses
) external onlyRole(ORACLE_ROLE)
```

**What it does:**
1. Validates game is active
2. Validates winners are actual players in the game
3. Calculates fee distributions:
   - Creator commission (0-10%)
   - Platform commission (10%)
   - Remaining amount = prize pool
4. **Splits prize pool equally** among all winners:
   ```solidity
   uint256 amountPerWinner = winnerAmount / winners.length;
   for (uint256 i = 0; i < winners.length; i++) {
       playerBalances[winners[i]][token] += amountPerWinner;
   }
   ```

### Mapping: Scratch → Backend → Contract

```javascript
// Scratch reports (player indices):
report winner (2)  // Player 2 won

// Backend receives:
{
  roomId: 'abc123',
  winners: [2]  // indices
}

// Backend maps to wallets:
const room = await db.rooms.findById('abc123');
const player2 = room.players[2 - 1];  // 0-indexed array
const winnerWallets = [player2.walletAddress];  // ['0xBBB...']

// Backend calls contract:
await gameEscrow.reportGameResult(
  room.onchainGameId,    // uint256
  ['0xBBB...']           // address[]
);

// Contract distributes:
// Player 2 receives 100% of prize pool to their balance
```

---

## Example Implementations

### Example 1: Winner Takes All (Racing)

```scratch
when green flag clicked
  // Show betting info
  say (join "Prize: " (room prize pool) " USDC") for 2 seconds
  say "First to finish wins!" for 2 seconds

  // Assign starting positions based on player index
  set x to ((-150) + ((my player index) * 100))
  go to x: (x) y: (0)

  // Race logic
  forever
    if <key [right arrow v] pressed?> then
      change x by (5)
    end

    // Check if I won
    if <(x position) > (200)> then
      report winner (my player index)
      end game
      say (join "You won " (room prize pool) " USDC!") for 5 seconds
      stop [all]
    end
  end
```

**Payout:**
```
4 players × 5 USDC = 20 USDC
├─ Creator: 2 USDC
├─ Platform: 2 USDC
└─ Winner: 16 USDC
```

---

### Example 2: Battle Royale (Last Alive)

```scratch
when green flag clicked
  set [playersAlive v] to (room player count)
  set [myHealth v] to [100]

  forever
    // Combat logic...
    if <touching [bullet v]?> then
      change [myHealth v] by (-25)
    end

    // I died
    if <(myHealth) < (1)> then
      hide
      change [playersAlive v] by (-1)
      broadcast [player died v]
      stop [this script]
    end

    // I'm last alive = I win
    if <<(playersAlive) = (1)> and <(myHealth) > (0)>> then
      report winner (my player index)
      end game
      say "VICTORY!" for 5 seconds
      stop [all]
    end
  end
```

---

### Example 3: Co-op Survival (Multiple Winners)

```scratch
when green flag clicked
  set [wave v] to [0]
  set [survivors v] to []

  // Survive 10 waves
  repeat (10)
    change [wave v] by (1)
    say (join "Wave " (wave)) for 1 seconds

    broadcast [spawn zombies v]
    wait until <(zombie count) = (0)>
  end

  // Build list of survivors
  for each [playerIndex v] in (1) to (room player count)
    if <player (playerIndex) health > 0?> then
      add (playerIndex) to [survivors v]
    end
  end

  // Winners split prize
  if <(length of [survivors v]) > (0)> then
    report winners (survivors)
    say (join (length of [survivors v]) " survivors split " (room prize pool) " USDC!") for 3 seconds
  else
    report no winners
    say "Everyone died!" for 3 seconds
  end

  end game
  stop [all]
```

**Payout (3 survivors):**
```
4 players × 5 USDC = 20 USDC
├─ Creator: 2 USDC
├─ Platform: 2 USDC
└─ Prize (16 USDC) split 3 ways:
    ├─ Survivor 1: 5.33 USDC
    ├─ Survivor 2: 5.33 USDC
    └─ Survivor 3: 5.34 USDC
```

---

### Example 4: Top 3 Split Prize

```scratch
when green flag clicked
  set [finishOrder v] to []

  forever
    // Each player tracks if they finish
    when I cross finish line
      if <not <(finishOrder) contains (my player index)>> then
        add (my player index) to [finishOrder v]
      end
    end

    // Once 3 players finish, end game
    if <(length of [finishOrder v]) = (3)> then
      report winners (finishOrder)
      end game

      if <(finishOrder) contains (my player index)> then
        say "Top 3! You won!" for 3 seconds
      else
        say "Better luck next time!" for 2 seconds
      end

      stop [all]
    end
  end
```

**Payout:**
```
4 players × 10 USDC = 40 USDC
├─ Creator: 4 USDC
├─ Platform: 4 USDC
└─ Prize (32 USDC) split 3 ways:
    ├─ 1st place: 10.67 USDC
    ├─ 2nd place: 10.67 USDC
    └─ 3rd place: 10.66 USDC
```

**Note:** All 3 get equal amounts (not ranked percentages).

---

### Example 5: Time-Limited High Score

```scratch
when green flag clicked
  set [myScore v] to [0]

  // Show time remaining
  forever
    say (join "Time: " (room time remaining)) for 0.5 seconds
  end

  // Gameplay loop
  forever
    // Score points...
    when scored
      change [myScore v] by (10)
    end

    // Time expired - determine winner
    if <is time expired?> then
      // Broadcast scores to all players
      broadcast (join "score:" (myScore))

      // Wait for all scores
      wait (2) seconds

      // Highest score wins (pseudo-code)
      if <(myScore) = (highest score)> then
        report winner (my player index)
        end game
        stop [all]
      end
    end
  end
```

---

## Backend Integration

### Game Launch Flow

#### 1. Room Created (Web App)
```javascript
// User creates room via web UI
const room = await createRoom({
  gameId: 'space-race-123',
  entryFee: 5,  // USDC
  maxPlayers: 4
});

// Players join and pay
for (const player of players) {
  await joinRoom(room.id, player.wallet);
  // Smart contract receives payment
}
```

#### 2. Game Launches
```javascript
// Once room is full, redirect to game
const gameUrl = `${GAME_BASE_URL}?` + new URLSearchParams({
  roomId: room.id,
  players: JSON.stringify(room.players.map(p => p.username)),
  playerWallets: JSON.stringify(room.players.map(p => p.walletAddress)),
  myIndex: player.indexInRoom.toString(),
  entryFee: room.entryFee.toString(),
  prizePool: room.prizePool.toString(),
  timeLimit: room.timeLimit?.toString() || '0'
});

window.location.href = gameUrl;
```

#### 3. Scratch Reads Data
```javascript
// In scratch-gui initialization
const params = new URLSearchParams(window.location.search);

const roomContext = {
  roomId: params.get('roomId'),
  players: JSON.parse(params.get('players')),
  playerWallets: JSON.parse(params.get('playerWallets')),
  myIndex: parseInt(params.get('myIndex')),
  entryFee: parseFloat(params.get('entryFee')),
  prizePool: parseFloat(params.get('prizePool')),
  timeLimit: parseInt(params.get('timeLimit'))
};

// Expose to Scratch blocks
window.deguRoomContext = roomContext;
```

---

### Winner Reporting Flow

#### 1. Scratch Reports Winner(s)
```javascript
// Scratch block executes: report winner (2)

// Internal implementation calls:
window.deguReportWinner([2]);  // Array of player indices

// Or multiple: report winners [1, 2, 3]
window.deguReportWinner([1, 2, 3]);
```

#### 2. Send to Backend
```javascript
// scratch-gui sends WebSocket or HTTP POST
const result = {
  event: 'game_finished',
  roomId: window.deguRoomContext.roomId,
  winners: [2],  // Player indices
  timestamp: Date.now()
};

await fetch('/api/rooms/report-winner', {
  method: 'POST',
  body: JSON.stringify(result)
});
```

#### 3. Backend Validates
```javascript
// Backend receives result
app.post('/api/rooms/report-winner', async (req, res) => {
  const { roomId, winners, timestamp } = req.body;

  // 1. Get room data
  const room = await db.rooms.findById(roomId);
  if (!room) throw new Error('Room not found');
  if (room.status !== 'playing') throw new Error('Game not active');

  // 2. Validate winner indices
  for (const index of winners) {
    if (index < 1 || index > room.players.length) {
      throw new Error(`Invalid player index: ${index}`);
    }
  }

  // 3. Anti-cheat: Verify game events (optional but recommended)
  const eventsValid = await verifyGameEvents(roomId, winners);
  if (!eventsValid) {
    throw new Error('Suspicious game activity detected');
  }

  // 4. Map indices to wallet addresses
  const winnerWallets = winners.map(index =>
    room.players[index - 1].walletAddress
  );

  // 5. Call smart contract
  const tx = await gameEscrow.reportGameResult(
    room.onchainGameId,
    winnerWallets
  );
  await tx.wait();

  // 6. Update database
  await db.rooms.update(roomId, {
    status: 'finished',
    winners: winners,
    payoutTx: tx.hash,
    finishedAt: new Date()
  });

  res.json({ success: true, txHash: tx.hash });
});
```

---

### Block Implementation (Scratch Extension)

#### Sensing Block Example
```javascript
// In scratch-blocks/blocks_vertical/sensing.js

{
  "type": "degu_room_prize_pool",
  "message0": "room prize pool",
  "output": "Number",
  "colour": 230,
  "tooltip": "Get the prize pool amount in USDC",
  "helpUrl": ""
}

// In scratch-vm/src/extensions/scratch3_degu/index.js

getRoomPrizePool() {
  return window.deguRoomContext?.prizePool || 0;
}
```

#### Event Block Example
```javascript
// In scratch-blocks/blocks_vertical/event.js

{
  "type": "degu_report_winner",
  "message0": "report winner %1",
  "args0": [
    {
      "type": "input_value",
      "name": "PLAYER_INDEX",
      "check": "Number"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 330,
  "tooltip": "Report single winner by player index",
  "helpUrl": ""
}

// In scratch-vm/src/extensions/scratch3_degu/index.js

reportWinner(args) {
  const playerIndex = Cast.toNumber(args.PLAYER_INDEX);

  if (typeof window.deguReportWinner === 'function') {
    window.deguReportWinner([playerIndex]);
  } else {
    console.error('Degu betting system not initialized');
  }
}
```

---

## Edge Cases & Error Handling

### 1. No Winner Reported

**Scenario:** Game doesn't call `report winner` or `report winners`

**Backend Handling:**
```javascript
// Set timeout when game starts
const gameTimeout = setTimeout(() => {
  if (room.status === 'playing') {
    // Game didn't finish properly
    await handleGameTimeout(room.id);
  }
}, room.timeLimit + 60000); // Time limit + 1 minute grace

async function handleGameTimeout(roomId) {
  const room = await db.rooms.findById(roomId);

  // Call contract timeout function
  await gameEscrow.reportGameTimeout(room.onchainGameId);

  // Update database (contract refunds all players)
  await db.rooms.update(roomId, {
    status: 'timeout',
    refunded: true
  });
}
```

---

### 2. Invalid Player Index

**Scenario:** Game reports `report winner (99)` but only 4 players exist

**Backend Validation:**
```javascript
// Validate before calling contract
if (index < 1 || index > room.players.length) {
  throw new Error(`Invalid player index: ${index}. Room has ${room.players.length} players.`);
}
```

---

### 3. Empty Winners Array

**Scenario:** Game reports `report winners []`

**Backend Handling:**
```javascript
if (winners.length === 0) {
  // Option A: Treat as "no winners" (house wins)
  await db.rooms.update(roomId, {
    status: 'finished',
    winners: [],
    houseWin: true
  });
  // Don't call reportGameResult - fees already collected

  // Option B: Reject and refund
  throw new Error('At least one winner required');
}
```

---

### 4. Duplicate Winners

**Scenario:** Game reports `report winners [1, 1, 2]`

**Backend Validation:**
```javascript
const uniqueWinners = [...new Set(winners)];
if (uniqueWinners.length !== winners.length) {
  throw new Error('Duplicate winners not allowed');
}
```

---

### 5. All Players Win

**Scenario:** Game reports `report winners [1, 2, 3, 4]` (all 4 players)

**Contract Behavior:**
```
Prize pool: 16 USDC
Winners: 4
Amount per winner: 16 / 4 = 4 USDC

Result:
├─ Player 1: 4 USDC
├─ Player 2: 4 USDC
├─ Player 3: 4 USDC
└─ Player 4: 4 USDC

Net result: Each paid 5 USDC, got 4 back = -1 USDC loss
(Fees: 2 USDC creator + 2 USDC platform = 4 USDC total fees / 4 players = 1 USDC per player)
```

**This is valid!** Co-op games where everyone wins together.

---

### 6. Game Crashes Mid-Play

**Scenario:** Browser closes, network disconnects

**Backend Handling:**
```javascript
// Heartbeat system
setInterval(() => {
  socket.emit('heartbeat', { roomId });
}, 5000);

// Server detects disconnect
socket.on('disconnect', () => {
  const room = getActiveRoom(socket.id);
  if (room) {
    // Grace period before canceling
    setTimeout(async () => {
      if (!socket.connected) {
        await cancelGameAndRefund(room.id, 'Player disconnected');
      }
    }, 30000); // 30 second grace period
  }
});
```

---

### 7. Cheating Detection

**Scenario:** Game reports suspicious results

**Anti-Cheat Measures:**
```javascript
async function verifyGameEvents(roomId, winners) {
  const events = await db.gameEvents.find({ roomId });

  // Example checks:
  // 1. Winner must have "crossed finish line" event
  for (const winnerIndex of winners) {
    const playerEvents = events.filter(e => e.playerIndex === winnerIndex);
    const hasFinishEvent = playerEvents.some(e => e.type === 'finish_line_crossed');

    if (!hasFinishEvent) {
      console.error(`Player ${winnerIndex} reported as winner but no finish event`);
      return false;
    }
  }

  // 2. Check timing (did they finish impossibly fast?)
  const winnerEvent = events.find(e => e.playerIndex === winners[0]);
  const timeTaken = winnerEvent.timestamp - room.startTime;

  if (timeTaken < 5000) {  // Less than 5 seconds
    console.error('Impossibly fast completion time');
    return false;
  }

  return true;
}
```

---

## Implementation Checklist

### Phase 1: Core Blocks (MVP)

#### Scratch Blocks Extension
- [ ] Create new extension: `scratch3_degu_betting`
- [ ] Add 9 sensing blocks:
  - [ ] `(room player count)`
  - [ ] `(room entry fee)`
  - [ ] `(room prize pool)`
  - [ ] `(room id)`
  - [ ] `(room time remaining)`
  - [ ] `(room players)`
  - [ ] `(my player index)`
  - [ ] `(player () username)`
  - [ ] `<is time expired?>`
- [ ] Add 3 event blocks:
  - [ ] `report winner ()`
  - [ ] `report winners []`
  - [ ] `end game`

#### Backend Integration
- [ ] Create endpoint: `POST /api/rooms/report-winner`
- [ ] Implement winner validation logic
- [ ] Implement player index → wallet mapping
- [ ] Integrate with GameEscrow.sol contract
- [ ] Add timeout handling
- [ ] Add disconnect handling

#### Frontend (Scratch GUI)
- [ ] Parse URL parameters on game load
- [ ] Expose `window.deguRoomContext` object
- [ ] Implement `window.deguReportWinner()` function
- [ ] Add WebSocket or HTTP client for result reporting
- [ ] Handle game end UI/redirect

#### Testing
- [ ] Test single winner payout
- [ ] Test multiple winners (equal split)
- [ ] Test all players win scenario
- [ ] Test timeout/refund flow
- [ ] Test validation (invalid indices, etc.)

---

### Phase 2: Advanced Features (Post-MVP)

- [ ] Add `report no winners` block
- [ ] Add game event logging (for anti-cheat)
- [ ] Add practice mode (non-betting)
- [ ] Add `<is betting room?>` block
- [ ] Implement comprehensive anti-cheat system
- [ ] Add player reputation/rating system
- [ ] Add tournament support

---

## Testing Scenarios

### Scenario 1: Simple Race (Winner Takes All)
```
Setup:
- 4 players join room
- Entry fee: 5 USDC
- Prize pool: 16 USDC

Test Flow:
1. Game launches with room data
2. Player 3 finishes first
3. Game calls: report winner (3)
4. Backend verifies and calls contract
5. Contract pays Player 3: 16 USDC

Expected Result:
✓ Player 3 balance increases by 16 USDC
✓ Creator receives 2 USDC
✓ Platform receives 2 USDC
✓ Room status = 'finished'
```

---

### Scenario 2: Co-op Game (Multiple Winners)
```
Setup:
- 4 players join room
- Entry fee: 10 USDC
- Prize pool: 32 USDC

Test Flow:
1. Players fight boss together
2. 2 players die, 2 survive
3. Game calls: report winners [1, 4]
4. Backend verifies and calls contract
5. Contract splits: 32 / 2 = 16 USDC each

Expected Result:
✓ Player 1 receives 16 USDC
✓ Player 4 receives 16 USDC
✓ Players 2 & 3 receive nothing
```

---

### Scenario 3: Game Timeout
```
Setup:
- 4 players join room
- Time limit: 5 minutes
- Game starts but doesn't finish

Test Flow:
1. Game launches
2. 5 minutes pass
3. No winner reported
4. Backend detects timeout
5. Calls: gameEscrow.reportGameTimeout()
6. Contract refunds all players

Expected Result:
✓ All players refunded 10 USDC each
✓ Room status = 'timeout'
```

---

### Scenario 4: Invalid Winner Index
```
Setup:
- 4 players in room
- Game reports: report winner (99)

Test Flow:
1. Backend receives winner index 99
2. Validation fails (only 4 players exist)
3. Throws error
4. Game is canceled/refunded

Expected Result:
✓ Error logged
✓ Transaction NOT sent to contract
✓ Game canceled and players refunded
```

---

## Security Considerations

### 1. Always Validate on Backend
❌ **Never trust client-side reporting directly**
```javascript
// BAD - Don't do this
socket.on('winner', async (data) => {
  await gameEscrow.reportGameResult(data.gameId, data.winners);
});
```

✅ **Always validate first**
```javascript
// GOOD
socket.on('winner', async (data) => {
  const isValid = await validateGameResult(data);
  if (!isValid) {
    await refundGame(data.gameId);
    return;
  }
  await gameEscrow.reportGameResult(data.gameId, data.winners);
});
```

---

### 2. Rate Limiting
```javascript
// Prevent spam/DOS
const rateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 5,  // 5 game results per minute per IP
  message: 'Too many game results submitted'
});

app.post('/api/rooms/report-winner', rateLimit, handler);
```

---

### 3. Oracle Role Security
```solidity
// Only backend with ORACLE_ROLE can report results
function reportGameResult(...) external onlyRole(ORACLE_ROLE) {
  // ...
}
```

Ensure backend wallet private key is:
- Stored in environment variables (never committed)
- Encrypted at rest
- Rotated periodically
- Has limited permissions (only ORACLE_ROLE, not ADMIN_ROLE)

---

### 4. Reentrancy Protection
Already implemented in GameEscrow.sol:
```solidity
contract GameEscrow is ReentrancyGuard {
  function reportGameResult(...) nonReentrant { ... }
}
```

---

## Glossary

**Room**: A game instance where players join, pay entry fee, and compete

**Player Index**: Position in room (1-4), used for game logic

**Prize Pool**: Total amount available to winners (after fees)

**Winner(s)**: Player(s) who receive payout from prize pool

**Oracle**: Backend service with permission to report game results to smart contract

**Entry Fee**: Amount each player pays to join (in USDC)

**Creator Commission**: Percentage (0-10%) game creator earns per room

**Platform Commission**: Percentage (10%) Degu platform earns per room

---

## References

- **Smart Contract**: `packages/contracts/contracts/GameEscrow.sol`
- **Canvas Dimensions**: `CANVAS_DIMENSIONS_TECHNICAL_GUIDE.md`
- **Scratch VM**: `packages/scratch-vm/`
- **Scratch GUI**: `packages/scratch-gui/`

---

## Questions or Issues?

If implementing and you encounter:
- Unclear specifications
- Missing edge cases
- Technical blockers

Refer back to this document as the source of truth, or update it with new findings.

---

**End of Specification**
