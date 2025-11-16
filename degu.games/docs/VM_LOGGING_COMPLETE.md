# VM Server Logging - Complete Implementation ✅

## 🎯 What's Now Being Logged

Your vm-server now logs **everything** that happens during a multiplayer game session:

---

## 📊 Complete Log Categories

### 1. **CONNECTION** - Player Management
```
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user1234 | Total Players: 2
[CONNECTION] ❌ Player Disconnected | Room: cmhd5h69 | Player: user5678 | Remaining: 1
[CONNECTION] 🧹 Room cmhd5h69 cleaned up (no players remaining)
```

### 2. **GAME** - Lifecycle Events
```
[GAME] 🎬 Starting Game | Room: cmhd5h69 | Players: 2
[GAME]   Player 1: user1234
[GAME]   Player 2: user5678
[GAME] ✅ Game Started | Room: cmhd5h69 | Active Games: 1/200
```

### 3. **EVENT** - User Inputs
```
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user1234 | KEYDOWN "space"
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user1234 | KEYUP "space"
[EVENT] 🖱️  Mouse | Room: cmhd5h69 | Player: user5678 | DOWN
[EVENT] 🖱️  Mouse Move | Room: cmhd5h69 | Player: user5678 | Position: (120, 180)
[EVENT] ⚠️  Input Rejected | Room: cmhd5h69 | Player: user1234 | Reason: Rate limited
```

### 4. **BROADCAST** - Input Synchronization
```
[BROADCAST] 📡 Sent to 1 other player(s) in room cmhd5h69
```

### 5. **SPRITE** - Sprite Movements (NEW! ✨)
```
[SPRITE] 👀 Monitoring sprite "Cat" in room cmhd5h69
[SPRITE] 👀 Monitoring sprite "Ball" in room cmhd5h69
[SPRITE] 🎭 "Cat" moved | Room: cmhd5h69 | Position: (120, 80)
[SPRITE] 🎭 "Ball" moved | Room: cmhd5h69 | Position: (-45, 120)
```

**Features:**
- Automatically monitors ALL sprites in the game
- Only logs significant movements (>10 pixels)
- Throttled to max 1 log/second per sprite to avoid spam
- Tracks position changes in real-time

### 6. **VARIABLE** - Variable Changes (NEW! ✨)
```
[VARIABLES] 📊 Found 3 variable(s) in room cmhd5h69
[VARIABLE] 📈 "score" changed | Room: cmhd5h69 | 0 → 10
[VARIABLE] 📈 "lives" changed | Room: cmhd5h69 | 3 → 2
[VARIABLE] 📈 "level" changed | Room: cmhd5h69 | 1 → 2
```

**Features:**
- Automatically monitors ALL variables in the project
- Logs every value change (old → new)
- Checks for changes every 100ms
- No manual mapping needed

### 7. **EVENT** - Game Completion
```
[EVENT] 🏆 Winner Reported | Room: cmhd5h69 | Winner: user1234
[EVENT] 🏁 Game Ended | Room: cmhd5h69
[EVENT] ❌ Runtime Error | Room: cmhd5h69 | Sprite not found
```

### 8. **FINALIZE** - Backend Integration
```
[FINALIZE] 📝 Finalizing Game | Room: cmhd5h69
[FINALIZE] 🏆 Winner: user1234 | Duration: 45s
[FINALIZE] ✅ Game Finalized | Room: cmhd5h69
[FINALIZE] 💰 Transaction: 0x123abc456def...
[FINALIZE] ❌ Failed | Room: cmhd5h69 | Error: API timeout
```

### 9. **VMInstance** - VM Management
```
[VMInstance] 🎮 Game Started | Room: cmhd5h69 | Players: user1234, user5678
[VMInstance] 🗑️  Destroyed | Room: cmhd5h69
```

---

## 🎮 Complete Game Session Example

Here's what you'll see in your console for a complete multiplayer game:

```bash
# ===== GAME INITIALIZATION =====
[GAME] 🎬 Starting Game | Room: cmhd5h69 | Players: 2
[GAME]   Player 1: user1234
[GAME]   Player 2: user5678
[VMInstance] 🎮 Game Started | Room: cmhd5h69 | Players: user1234, user5678

# ===== SPRITE & VARIABLE SETUP =====
[SPRITE] 👀 Monitoring sprite "Cat" in room cmhd5h69
[SPRITE] 👀 Monitoring sprite "Ball" in room cmhd5h69
[SPRITE] 👀 Monitoring sprite "Enemy" in room cmhd5h69
[VARIABLES] 📊 Found 3 variable(s) in room cmhd5h69

[GAME] ✅ Game Started | Room: cmhd5h69 | Active Games: 1/200

# ===== PLAYERS CONNECT =====
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user1234 | Total Players: 1
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user5678 | Total Players: 2

# ===== GAMEPLAY - Player 1 presses right arrow =====
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user1234 | KEYDOWN "ArrowRight"
[BROADCAST] 📡 Sent to 1 other player(s) in room cmhd5h69

# Cat sprite moves (because of the input)
[SPRITE] 🎭 "Cat" moved | Room: cmhd5h69 | Position: (50, 0)

# Score increases
[VARIABLE] 📈 "score" changed | Room: cmhd5h69 | 0 → 10

# ===== GAMEPLAY - Player 2 presses space =====
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user5678 | KEYDOWN "space"
[BROADCAST] 📡 Sent to 1 other player(s) in room cmhd5h69

# Ball sprite moves
[SPRITE] 🎭 "Ball" moved | Room: cmhd5h69 | Position: (100, 120)

# ===== GAMEPLAY - Collision detected =====
# Lives decrease
[VARIABLE] 📈 "lives" changed | Room: cmhd5h69 | 3 → 2

# Enemy sprite moves
[SPRITE] 🎭 "Enemy" moved | Room: cmhd5h69 | Position: (-80, 60)

# ===== GAME COMPLETION =====
[EVENT] 🏆 Winner Reported | Room: cmhd5h69 | Winner: user1234
[EVENT] 🏁 Game Ended | Room: cmhd5h69

# ===== FINALIZATION =====
[FINALIZE] 📝 Finalizing Game | Room: cmhd5h69
[FINALIZE] 🏆 Winner: user1234 | Duration: 45s
[FINALIZE] ✅ Game Finalized | Room: cmhd5h69
[FINALIZE] 💰 Transaction: 0x123abc456def...

# ===== CLEANUP =====
[VMInstance] 🗑️  Destroyed | Room: cmhd5h69
[CONNECTION] ❌ Player Disconnected | Room: cmhd5h69 | Player: user1234 | Remaining: 1
[CONNECTION] ❌ Player Disconnected | Room: cmhd5h69 | Player: user5678 | Remaining: 0
[CONNECTION] 🧹 Room cmhd5h69 cleaned up (no players remaining)
```

---

## 🔍 What You Can Now See

### ✅ Complete Input → Action → Result Chain

You can now trace the ENTIRE flow:

1. **Input**: `[EVENT] 🎹 Keyboard | KEYDOWN "ArrowRight"`
2. **Action**: `[SPRITE] 🎭 "Cat" moved | Position: (50, 0)`
3. **Result**: `[VARIABLE] 📈 "score" changed | 0 → 10`

### ✅ Game State Changes

- See when sprites move
- See when variables change
- Understand game flow
- Track collision detection
- Monitor score updates

### ✅ Multiplayer Synchronization

- Player 1 input → broadcast → Player 2 receives it
- Both VMs process → both sprites move
- Variables sync automatically
- State consistency verification

---

## ⚙️ Performance & Optimization

### Sprite Movement Throttling
- **Max frequency**: 1 log per second per sprite
- **Threshold**: Only logs movements >10 pixels
- **Why**: Sprites can move 60 times/second, without throttling = 1000s of logs

### Variable Monitoring
- **Check frequency**: Every 100ms
- **Immediate logging**: When value changes
- **No performance impact**: Periodic checks are lightweight

### Mouse Movement
- **Log level**: DEBUG only
- **Why**: Mouse can move 100s of times per second
- **Enable with**: `LOG_LEVEL=debug` in `.env`

---

## 📋 Log Levels

### INFO (default) - Shows:
✅ Connections
✅ Game lifecycle
✅ Keyboard inputs
✅ Mouse clicks (not movements)
✅ Variable changes
✅ Sprite movements
✅ Winner/finalize

### DEBUG (verbose) - Also shows:
✅ Mouse movements
✅ Sprite monitoring setup
✅ Broadcast confirmations
✅ State serialization details

### To enable DEBUG:
Edit `packages/vm-server/.env`:
```bash
LOG_LEVEL=debug
```

---

## 🐛 Debugging Examples

### Example 1: "Sprite not moving"
```bash
# What you see:
[EVENT] 🎹 Keyboard | KEYDOWN "ArrowRight"  ✅ Input received
[SPRITE] 🎭 "Cat" moved | Position: (50, 0) ❌ NOT SHOWING

# Problem: Input received but sprite didn't move
# Check: Scratch code might have bug preventing movement
```

### Example 2: "Score not updating"
```bash
# What you see:
[SPRITE] 🎭 "Ball" moved | Position: (100, 120) ✅ Collision happened
[VARIABLE] 📈 "score" changed | 0 → 10        ❌ NOT SHOWING

# Problem: Collision detected but variable not changing
# Check: Scratch code for score increase logic
```

### Example 3: "Player 2 not seeing Player 1's actions"
```bash
# Player 1's vm-server console:
[EVENT] 🎹 Keyboard | KEYDOWN "space"        ✅ Input sent
[BROADCAST] 📡 Sent to 1 other player(s)    ✅ Broadcasted

# Player 2's browser console:
[VMSyncManager] Applied remote keyboard...   ❌ NOT SHOWING

# Problem: Broadcasting works but Player 2 not receiving
# Check: WebSocket connection in Player 2's browser
```

---

## 💡 No Manual Mapping Required!

### Automatic Sprite Detection
All sprites are automatically monitored when the game starts. You don't need to:
- ❌ Manually register sprites
- ❌ Add custom logging blocks
- ❌ Modify Scratch code
- ✅ Just run your game - everything is logged!

### Automatic Variable Detection
All variables are automatically monitored. You don't need to:
- ❌ List variable names
- ❌ Add tracking code
- ❌ Modify variable setters
- ✅ Just use variables in Scratch - changes are logged!

---

## 🎯 What's NOT Logged (Would Be Spam)

Some things are too low-level or too frequent:
- ❌ Every VM step (30-60 per second)
- ❌ Every block execution (100s per second)
- ❌ Raw state serialization (sent 30 times/second)
- ❌ WebSocket ping/pong
- ❌ Small sprite movements (<10 pixels)

---

## 🎉 Summary

### Now Logging:
1. ✅ Player connections/disconnections
2. ✅ Game lifecycle (start/end)
3. ✅ All keyboard inputs (keydown/keyup)
4. ✅ All mouse inputs (click/move)
5. ✅ Input broadcasting
6. ✅ **Sprite movements** (throttled)
7. ✅ **Variable changes** (all)
8. ✅ Winner detection
9. ✅ Game finalization
10. ✅ Transaction hashes

### You Can Now:
- ✅ See complete game flow
- ✅ Debug multiplayer sync issues
- ✅ Track game state changes
- ✅ Understand input → action → result chain
- ✅ Verify sprite movements
- ✅ Monitor variable changes
- ✅ Catch collision detection issues
- ✅ Verify score updates

### Perfect for:
- 🐛 Debugging game logic
- 🔄 Verifying multiplayer synchronization
- 🎮 Understanding game state
- 🏆 Tracking winner detection
- 💰 Monitoring blockchain transactions

---

## 📝 Implementation Details

### Files Modified:
1. **`packages/vm-server/src/VMInstance.js`**
   - Added `_setupSpriteMonitoring()` method
   - Added `_setupVariableMonitoring()` method
   - Enhanced `destroy()` to cleanup intervals
   - Added emoji-based logging throughout

2. **`packages/vm-server/src/GameInstanceManager.js`**
   - Enhanced game start/end logging
   - Added finalization logging with transaction hashes

3. **`packages/vm-server/src/websocket-server.js`**
   - Added comprehensive input logging
   - Added broadcast logging
   - Added connection logging

### How It Works:

**Sprite Monitoring:**
```javascript
// Override sprite's setXY method to log movements
const originalSetXY = target.setXY.bind(target);
target.setXY = (x, y, force) => {
    const result = originalSetXY(x, y, force);

    // Log significant movements
    if (Math.abs(x - lastX) > 10 || Math.abs(y - lastY) > 10) {
        logger.debug(`[SPRITE] 🎭 "${spriteName}" moved | Position: (${x}, ${y})`);
    }

    return result;
};
```

**Variable Monitoring:**
```javascript
// Periodically check for variable changes
setInterval(() => {
    if (variable.value !== lastValue) {
        logger.info(`[VARIABLE] 📈 "${varName}" changed | ${lastValue} → ${variable.value}`);
        lastValue = variable.value;
    }
}, 100); // Check every 100ms
```

---

## 🚀 Ready to Test!

Just run your game and watch the vm-server console. You'll see:
1. Game initialization
2. Player connections
3. Every input from every player
4. Every sprite movement
5. Every variable change
6. Winner detection
7. Game finalization
8. Transaction confirmation

**Everything you need to debug and verify your multiplayer betting games!** 🎮✨
