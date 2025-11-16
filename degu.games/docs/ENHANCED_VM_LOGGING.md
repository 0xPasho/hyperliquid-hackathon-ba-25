# Enhanced VM Logging - Game State Tracking

## 🎯 New Logging Added

Beyond just inputs, we now log **everything that happens in the game**:

---

## 📊 New Log Types

### 1. **SPRITE Logs** - Sprite movements
```
[SPRITE] 👀 Monitoring sprite "Cat" in room cmhd5h69
[SPRITE] 👀 Monitoring sprite "Ball" in room cmhd5h69
[SPRITE] 🎭 "Cat" moved | Room: cmhd5h69 | Position: (120, 80)
[SPRITE] 🎭 "Ball" moved | Room: cmhd5h69 | Position: (-45, 120)
```

**What it tracks:**
- All sprites being monitored
- Position changes (when moved >10 pixels)
- Only logs significant movements (throttled to 1/second to avoid spam)

---

### 2. **VARIABLE Logs** - Variable changes
```
[VARIABLES] 📊 Found 3 variable(s) in room cmhd5h69
[VARIABLE] 📈 "score" changed | Room: cmhd5h69 | 0 → 10
[VARIABLE] 📈 "lives" changed | Room: cmhd5h69 | 3 → 2
[VARIABLE] 📈 "level" changed | Room: cmhd5h69 | 1 → 2
```

**What it tracks:**
- All variables in the project
- Every value change (old → new)
- Updates checked every 100ms

---

## 🎮 Complete Game Session Example

```bash
# Game initialization
[GAME] 🎬 Starting Game | Room: cmhd5h69 | Players: 2
[VMInstance] 🎮 Game Started | Room: cmhd5h69 | Players: user1234, user5678

# Sprite setup
[SPRITE] 👀 Monitoring sprite "Cat" in room cmhd5h69
[SPRITE] 👀 Monitoring sprite "Ball" in room cmhd5h69
[SPRITE] 👀 Monitoring sprite "Enemy" in room cmhd5h69

# Variables setup
[VARIABLES] 📊 Found 3 variable(s) in room cmhd5h69

# Players connect
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user1234 | Total Players: 1
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user5678 | Total Players: 2

# Gameplay - Player 1 presses right arrow
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user1234 | KEYDOWN "ArrowRight"
[BROADCAST] 📡 Sent to 1 other player(s)

# Cat sprite moves (because of the input)
[SPRITE] 🎭 "Cat" moved | Room: cmhd5h69 | Position: (50, 0)

# Score increases
[VARIABLE] 📈 "score" changed | Room: cmhd5h69 | 0 → 10

# Player 2 presses space
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user5678 | KEYDOWN "space"
[BROADCAST] 📡 Sent to 1 other player(s)

# Ball sprite moves
[SPRITE] 🎭 "Ball" moved | Room: cmhd5h69 | Position: (100, 120)

# Collision detected, lives decrease
[VARIABLE] 📈 "lives" changed | Room: cmhd5h69 | 3 → 2

# Enemy sprite moves
[SPRITE] 🎭 "Enemy" moved | Room: cmhd5h69 | Position: (-80, 60)

# Game completes
[EVENT] 🏆 Winner Reported | Room: cmhd5h69 | Winner: user1234
[EVENT] 🏁 Game Ended | Room: cmhd5h69

# Finalization
[FINALIZE] 📝 Finalizing Game | Room: cmhd5h69
[FINALIZE] 🏆 Winner: user1234 | Duration: 45s
[FINALIZE] ✅ Game Finalized | Room: cmhd5h69
[FINALIZE] 💰 Transaction: 0x123abc...

# Cleanup
[VMInstance] 🗑️  Destroyed | Room: cmhd5h69
[CONNECTION] ❌ Player Disconnected | Room: cmhd5h69 | Player: user1234
```

---

## 🔍 What You Can Now See

### ✅ Inputs → Actions → Results
You can now trace the complete chain:

1. **Input**: `[EVENT] 🎹 Keyboard | KEYDOWN "ArrowRight"`
2. **Action**: `[SPRITE] 🎭 "Cat" moved | Position: (50, 0)`
3. **Result**: `[VARIABLE] 📈 "score" changed | 0 → 10`

### ✅ Game State Changes
- See when sprites move
- See when variables change
- Understand game flow

### ✅ Multiplayer Sync
- Player 1 input → broadcast → Player 2 sees it
- Both VMs process → both sprites move
- Variables sync automatically

---

## ⚙️ Performance Notes

### Throttling
- **Sprite movements**: Max 1 log/second per sprite
- **Only significant moves**: >10 pixel movement
- **Variable checks**: Every 100ms

### Why Throttle?
- Sprites can move 60 times per second
- Without throttling = 1000s of logs
- With throttling = clear, readable logs

---

## 🐛 Debugging Examples

### Example 1: "Sprite not moving"
```bash
# Look for these logs:
[EVENT] 🎹 Keyboard | KEYDOWN "ArrowRight"  ✅ Input received
[SPRITE] 🎭 "Cat" moved | Position: (50, 0) ❌ NOT SHOWING

# Problem: Input received but sprite didn't move
# Check: Scratch code might have bug
```

### Example 2: "Score not updating"
```bash
# Look for:
[SPRITE] 🎭 "Ball" moved | Position: (100, 120) ✅ Collision happened
[VARIABLE] 📈 "score" changed | 0 → 10        ❌ NOT SHOWING

# Problem: Collision detected but variable not changing
# Check: Scratch code for score increase
```

### Example 3: "Player 2 not seeing Player 1's actions"
```bash
# Player 1's console:
[EVENT] 🎹 Keyboard | KEYDOWN "space"        ✅ Input sent
[BROADCAST] 📡 Sent to 1 other player(s)    ✅ Broadcasted

# Player 2's console (browser):
[VMSyncManager] Applied remote keyboard...   ❌ NOT SHOWING

# Problem: Broadcasting works but Player 2 not receiving
# Check: WebSocket connection in Player 2's browser
```

---

## 📊 Log Levels

### INFO (default) - Shows:
- ✅ Connections
- ✅ Game lifecycle
- ✅ Inputs
- ✅ Variable changes
- ✅ Winner/finalize

### DEBUG (verbose) - Also shows:
- ✅ All sprite monitoring setup
- ✅ Mouse movements
- ✅ Sprite movements
- ✅ Broadcast confirmations

### To enable DEBUG:
Edit `packages/vm-server/.env`:
```bash
LOG_LEVEL=debug
```

---

## 🎯 What's Still NOT Logged

Some things are too low-level or too frequent to log:

### ❌ Not Logged (Would be spam):
- Every VM step (30-60 per second)
- Every block execution (100s per second)
- Raw state serialization
- WebSocket ping/pong

### ✅ But You CAN See:
- Sprite movements (throttled)
- Variable changes (immediate)
- All user inputs (immediate)
- Game events (immediate)

---

## 💡 Tips

### Want to see specific events?
You can add custom blocks in Scratch that trigger events:
```scratch
when I receive [log_event]
report winner [player1] // This will show in logs!
```

### Want to log specific variables?
All variables are automatically monitored. Just use them in Scratch:
```scratch
set [myVariable] to (10)  // This will log automatically!
```

### Want to see sprite clicks?
Currently not logged, but you can add:
- Click blocks trigger inputs
- Inputs are already logged
- So you see: `[EVENT] 🖱️  Mouse | DOWN`

---

## 🎉 Summary

**Now Logging:**
1. ✅ Player inputs (keyboard/mouse)
2. ✅ Input broadcasting
3. ✅ Sprite movements (throttled)
4. ✅ Variable changes (all)
5. ✅ Game lifecycle
6. ✅ Winner detection
7. ✅ Finalization

**You can now:**
- See complete game flow
- Debug multiplayer sync issues
- Track game state changes
- Understand input → action → result chain

**Perfect for debugging game logic and multiplayer synchronization!** 🎮🔍
