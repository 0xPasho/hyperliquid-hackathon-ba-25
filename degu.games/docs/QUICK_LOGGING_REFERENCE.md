# Quick Logging Reference 🚀

## TL;DR - What's Been Done

✅ **Your vm-server now logs EVERYTHING automatically:**
- Every keyboard/mouse input from every player
- Every sprite movement (when they move >10 pixels)
- Every variable change (score, lives, level, etc.)
- Player connections/disconnections
- Game start/end events
- Winner detection
- Transaction finalization

**No manual mapping needed!** Just run your game and check the vm-server console.

---

## 🎯 Quick Test

1. **Start your vm-server**:
   ```bash
   cd packages/vm-server
   npm start
   ```

2. **Start a game** (2 players)

3. **Watch the console** - you'll see:
   ```
   [GAME] 🎬 Starting Game | Room: cmhd5h69 | Players: 2
   [SPRITE] 👀 Monitoring sprite "Cat" in room cmhd5h69
   [SPRITE] 👀 Monitoring sprite "Ball" in room cmhd5h69
   [VARIABLES] 📊 Found 3 variable(s) in room cmhd5h69
   [CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Player: user1234
   ```

4. **Press keys in the game** - you'll see:
   ```
   [EVENT] 🎹 Keyboard | Room: cmhd5h69 | Player: user1234 | KEYDOWN "space"
   [BROADCAST] 📡 Sent to 1 other player(s)
   ```

5. **Watch sprites move** - you'll see:
   ```
   [SPRITE] 🎭 "Cat" moved | Room: cmhd5h69 | Position: (120, 80)
   ```

6. **Watch variables change** - you'll see:
   ```
   [VARIABLE] 📈 "score" changed | Room: cmhd5h69 | 0 → 10
   [VARIABLE] 📈 "lives" changed | Room: cmhd5h69 | 3 → 2
   ```

---

## 📊 Emoji Legend (Quick Scan)

| Emoji | Category | What It Means |
|-------|----------|---------------|
| 🎬 | GAME | Starting/Creating game |
| ✅ | SUCCESS | Something succeeded |
| ❌ | ERROR | Something failed |
| ⚠️ | WARNING | Rate limited or rejected |
| 🎹 | EVENT | Keyboard input |
| 🖱️ | EVENT | Mouse input |
| 📡 | BROADCAST | Input sent to other players |
| 👀 | SPRITE | Monitoring sprite |
| 🎭 | SPRITE | Sprite moved |
| 📊 | VARIABLES | Variable count |
| 📈 | VARIABLE | Variable changed |
| 🏆 | EVENT | Winner reported |
| 🏁 | EVENT | Game ended |
| 💰 | FINALIZE | Transaction hash |
| 🧹 | CONNECTION | Cleanup |
| 🗑️ | VMInstance | VM destroyed |
| 📝 | FINALIZE | Finalizing game |

---

## 🔧 Control Log Verbosity

### Default (INFO) - Recommended
Shows everything important:
```bash
# In packages/vm-server/.env
LOG_LEVEL=info
```

### Debug (VERBOSE) - For Deep Debugging
Shows EVERYTHING including mouse movements:
```bash
# In packages/vm-server/.env
LOG_LEVEL=debug
```

### Quiet (WARN) - Only Errors/Warnings
Only shows problems:
```bash
# In packages/vm-server/.env
LOG_LEVEL=warn
```

---

## 🐛 Common Debugging Scenarios

### "Player input not working"
Look for:
```
[EVENT] 🎹 Keyboard | KEYDOWN "space"  ← Should appear when key pressed
[BROADCAST] 📡 Sent to X players       ← Should appear right after
```
If missing → Check WebSocket connection

### "Sprite not responding to input"
Look for:
```
[EVENT] 🎹 Keyboard | KEYDOWN "right"  ← Input received ✓
[SPRITE] 🎭 "Cat" moved | Position: X  ← Sprite moved? ✗
```
If sprite didn't move → Check Scratch code logic

### "Score not updating"
Look for:
```
[VARIABLE] 📈 "score" changed | 0 → 10  ← Should appear
```
If missing → Check Scratch variable logic

### "Multiplayer sync issue"
Look for:
```
# Player 1 console (vm-server):
[EVENT] 🎹 Keyboard | Player: user1234 | KEYDOWN "space"
[BROADCAST] 📡 Sent to 1 other player(s)

# Player 2 console (browser):
[VMSyncManager] Applied remote keyboard event: space
```
If Player 2 not receiving → Check WebSocket in browser

---

## 📁 Files Changed

All logging is automatic. These files were enhanced:

1. **`packages/vm-server/src/VMInstance.js`**
   - Sprite movement monitoring
   - Variable change monitoring
   - Game lifecycle logging

2. **`packages/vm-server/src/GameInstanceManager.js`**
   - Game start/end logging
   - Finalization logging

3. **`packages/vm-server/src/websocket-server.js`**
   - Input event logging
   - Connection logging
   - Broadcast logging

---

## 🎉 That's It!

**Everything is automatic.** Just:
1. Run your game
2. Check vm-server console
3. See everything that happens

For complete details, see: **VM_LOGGING_COMPLETE.md**

---

## 💬 Example Output

Here's what a complete game looks like:

```bash
[GAME] 🎬 Starting Game | Room: cmhd5h69 | Players: 2
[SPRITE] 👀 Monitoring sprite "Cat" in room cmhd5h69
[VARIABLES] 📊 Found 3 variable(s) in room cmhd5h69
[CONNECTION] ✅ Player Connected | Room: cmhd5h69 | Total Players: 1
[EVENT] 🎹 Keyboard | Room: cmhd5h69 | KEYDOWN "space"
[SPRITE] 🎭 "Cat" moved | Room: cmhd5h69 | Position: (120, 80)
[VARIABLE] 📈 "score" changed | Room: cmhd5h69 | 0 → 10
[EVENT] 🏆 Winner Reported | Room: cmhd5h69 | Winner: user1234
[FINALIZE] ✅ Game Finalized | Room: cmhd5h69
[FINALIZE] 💰 Transaction: 0x123abc...
```

**Perfect for debugging!** 🚀
