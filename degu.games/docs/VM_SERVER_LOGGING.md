# VM Server Logging Guide

## 📊 Enhanced Logging Added

Comprehensive logging has been added to track all events in the vm-server.

---

## 🎯 Log Categories

### 1. **CONNECTION Logs** - Player connections
```
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user1234 | Total Players: 1
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user5678 | Total Players: 2
[CONNECTION] ❌ Player Disconnected | Room: cmhd5h69 | Player: user1234 | Remaining: 1
[CONNECTION] 🧹 Room cmhd5h69 cleaned up (no players remaining)
```

**What it tracks:**
- Player WebSocket connections
- Player disconnections
- Room cleanup when empty

---

### 2. **GAME Logs** - Game lifecycle
```
[GAME] 🎬 Starting Game | Room: cmhd5h69 | Players: 2
[GAME]   Player 1: user1234
[GAME]   Player 2: user5678
[GAME] ✅ Game Started | Room: cmhd5h69 | Active Games: 1/200
[GAME] ❌ Failed to Start | Room: cmhd5h69 | Error: Project load failed
```

**What it tracks:**
- Game creation
- Player list
- Active game count
- Start failures

---

### 3. **EVENT Logs** - Game events
```
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user1234 | KEYDOWN "space"
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user1234 | KEYUP "space"
[EVENT] 🖱️  Mouse | Room: cmhd5h69 | Player: user5678 | DOWN
[EVENT] 🖱️  Mouse Move | Room: cmhd5h69 | Player: user5678 | Position: (120, 180)
[EVENT] ⚠️  Input Rejected | Room: cmhd5h69 | Player: user1234 | Reason: Rate limited
[EVENT] 🏆 Winner Reported | Room: cmhd5h69 | Winner: user1234
[EVENT] 🏁 Game Ended | Room: cmhd5h69
[EVENT] ❌ Runtime Error | Room: cmhd5h69 | Sprite not found
```

**What it tracks:**
- All keyboard inputs (keydown/keyup)
- Mouse clicks and movements
- Rejected inputs (rate limiting)
- Winner detection
- Game completion
- Runtime errors

---

### 4. **BROADCAST Logs** - Input synchronization
```
[BROADCAST] 📡 Sent to 1 other player(s) in room cmhd5h69
```

**What it tracks:**
- Input broadcasting to other players
- Number of recipients

---

### 5. **FINALIZE Logs** - Game completion
```
[FINALIZE] 📝 Finalizing Game | Room: cmhd5h69
[FINALIZE] 🏆 Winner: user1234 | Duration: 45s
[FINALIZE] ✅ Game Finalized | Room: cmhd5h69
[FINALIZE] 💰 Transaction: 0x123abc...
[FINALIZE] ❌ Failed | Room: cmhd5h69 | Error: API timeout
```

**What it tracks:**
- Game finalization process
- Winner information
- Game duration
- Blockchain transaction hash
- Backend API errors

---

### 6. **VMInstance Logs** - VM lifecycle
```
[VMInstance] 🎮 Game Started | Room: cmhd5h69 | Players: user1234, user5678
```

**What it tracks:**
- VM initialization
- Player list at start

---

## 📋 Example Game Session

Here's what you'll see in the console for a complete game:

```bash
# Game starts
[GAME] 🎬 Starting Game | Room: cmhd5h69 | Players: 2
[GAME]   Player 1: user1234
[GAME]   Player 2: user5678
[VMInstance] 🎮 Game Started | Room: cmhd5h69 | Players: user1234, user5678
[GAME] ✅ Game Started | Room: cmhd5h69 | Active Games: 1/200

# Players connect
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user1234 | Total Players: 1
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user5678 | Total Players: 2

# Gameplay - Player 1 presses space
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user1234 | KEYDOWN "space"
[BROADCAST] 📡 Sent to 1 other player(s) in room cmhd5h69

# Gameplay - Player 2 clicks mouse
[EVENT] 🖱️  Mouse | Room: cmhd5h69 | Player: user5678 | DOWN
[BROADCAST] 📡 Sent to 1 other player(s) in room cmhd5h69

# Gameplay - Player 1 moves
[EVENT] 🖱️  Mouse Move | Room: cmhd5h69 | Player: user1234 | Position: (240, 180)
[BROADCAST] 📡 Sent to 1 other player(s) in room cmhd5h69

# Game completes
[EVENT] 🏆 Winner Reported | Room: cmhd5h69 | Winner: user1234
[EVENT] 🏁 Game Ended | Room: cmhd5h69

# Finalization
[FINALIZE] 📝 Finalizing Game | Room: cmhd5h69
[FINALIZE] 🏆 Winner: user1234 | Duration: 45s
[FINALIZE] ✅ Game Finalized | Room: cmhd5h69
[FINALIZE] 💰 Transaction: 0x123abc456def...

# Cleanup
[CONNECTION] ❌ Player Disconnected | Room: cmhd5h69 | Player: user1234 | Remaining: 1
[CONNECTION] ❌ Player Disconnected | Room: cmhd5h69 | Player: user5678 | Remaining: 0
[CONNECTION] 🧹 Room cmhd5h69 cleaned up (no players remaining)
```

---

## 🔍 Log Levels

### INFO (default)
- Connection events
- Game lifecycle
- Keyboard/mouse events
- Winner detection
- Finalization

### DEBUG (verbose)
- Mouse movements (can be noisy)
- Broadcast confirmations
- State serialization

### WARN
- Input rejections (rate limiting)
- Invalid inputs
- Missing rooms

### ERROR
- Game start failures
- Finalization errors
- Runtime errors
- API errors

---

## ⚙️ Configuration

To change log level, edit `packages/vm-server/.env`:

```bash
# Show everything (including debug)
LOG_LEVEL=debug

# Show only important events (default)
LOG_LEVEL=info

# Show only warnings and errors
LOG_LEVEL=warn
```

---

## 🎯 What to Look For

### ✅ Normal Operation
```
[CONNECTION] ✅ Player Connected
[EVENT] 🎹 Keyboard | KEYDOWN
[BROADCAST] 📡 Sent to X players
[EVENT] 🏆 Winner Reported
[FINALIZE] ✅ Game Finalized
```

### ⚠️ Rate Limiting (Expected)
```
[EVENT] ⚠️  Input Rejected | Reason: Rate limited
```
This is normal if players spam inputs too fast.

### ❌ Problems
```
[GAME] ❌ Failed to Start | Error: ...
[EVENT] ❌ Runtime Error | ...
[FINALIZE] ❌ Failed | Error: ...
```

---

## 🐛 Debugging Tips

### No inputs showing?
Check for:
```
[CONNECTION] ✅ Player Connected
```
If not showing, WebSocket isn't connecting.

### Inputs not broadcasting?
Look for:
```
[BROADCAST] 📡 Sent to X players
```
Should show after each input event.

### Winner not detected?
Check for:
```
[EVENT] 🏆 Winner Reported
[EVENT] 🏁 Game Ended
```
Both must fire for finalization.

### Finalization failing?
Look at:
```
[FINALIZE] ❌ Failed | Error: ...
```
Shows exact error from backend API.

---

## 📊 Emoji Legend

- 🎬 Starting/Creating
- ✅ Success
- ❌ Error/Failed
- ⚠️  Warning/Rejected
- 🎹 Keyboard Input
- 🖱️  Mouse Input
- 📡 Broadcasting
- 🏆 Winner
- 🏁 Game End
- 💰 Transaction/Payment
- 🧹 Cleanup
- 🎮 Game Instance
- 📝 Finalizing

---

## 🎯 Summary

**All major events are now logged with:**
- Clear categories ([GAME], [EVENT], [FINALIZE], etc.)
- Emojis for quick visual scanning
- Shortened IDs (first 8 chars) for readability
- Player counts and durations
- Success/failure status

**You can now easily track:**
1. When players connect/disconnect
2. Every keyboard and mouse input
3. Input broadcasting to other players
4. Winner detection and game end
5. Complete finalization process
6. Any errors or rejections

**Perfect for debugging and monitoring multiplayer games!** 🎮📊
