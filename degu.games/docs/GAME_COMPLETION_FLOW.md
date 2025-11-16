# Game Completion & Blockchain Flow

## 🏁 What Happens When Game Finishes

### 1. Winner Detection (In Scratch Code)
```scratch
when [game_over]
  report winner [userId]  ← Your custom block
```

Server VM executes this → Emits `REPORT_WINNER` event

---

### 2. Game End Detection
```scratch
when [time_up] or [condition_met]
  end game  ← Your custom block
```

Server VM executes this → Emits `GAME_ENDED` event

---

### 3. Automatic Finalization

**Once BOTH events fire:**
- Winner is set ✅
- Game ended flag is set ✅
- Finalization starts automatically

---

### 4. Backend API Call

Server sends to your backend:
```json
{
  "roomId": "cmhd5h69n0007xc15w5hsxqpx",
  "winnerUserId": "user1234567890abcdef",
  "source": "vm_server",
  "metadata": {
    "duration": 45,
    "players": ["user1234...", "user5678..."],
    "finalizedAt": 1730261234567
  }
}
```

---

### 5. Blockchain Transaction

Backend:
1. Verifies winner
2. Creates blockchain transaction
3. Distributes winnings
4. Returns transaction hash

---

### 6. Logging & Storage

**Console logs:**
```
============================================================
[FINALIZE] 🏁 GAME COMPLETED | Room: cmhd5h69
============================================================
[FINALIZE] 🏆 Winner: user1234567890abcdef
[FINALIZE] 👥 Players: user1234567890abcdef, user5678901234abcdef
[FINALIZE] ⏱️  Duration: 45s
[FINALIZE] 🕐 Started: 2024-10-30T14:23:10.123Z
[FINALIZE] 🕑 Ended: 2024-10-30T14:23:55.456Z
[FINALIZE] 🕒 Finalized: 2024-10-30T14:23:56.789Z
============================================================

[FINALIZE] 💰 BLOCKCHAIN TRANSACTION
[FINALIZE]   Status: success
[FINALIZE]   TX Hash: 0x123abc456def789...
[FINALIZE]   Block: 12345678
[FINALIZE]   Gas Used: 65432
[FINALIZE] ✅ Game Finalized Successfully | Room: cmhd5h69
[FINALIZE] 📄 Saved to: /vm-server/logs/game-results-2024-10-30.jsonl
```

**File storage:**
```
vm-server/logs/game-results-2024-10-30.jsonl
```

Each game = one JSON line:
```json
{"roomId":"cmhd5h69...","winner":"user1234...","players":["user1234...","user5678..."],"duration":45,"startedAt":1730261234567,"endedAt":1730261789012,"finalizedAt":1730261890345,"txHash":"0x123abc...","blockchainStatus":"success","blockNumber":12345678,"gasUsed":65432,"startedAtISO":"2024-10-30T14:23:10.123Z","endedAtISO":"2024-10-30T14:23:55.456Z","finalizedAtISO":"2024-10-30T14:23:56.789Z"}
```

---

## 📊 Complete Timeline

```
T+0s    : Game starts
T+0s    : Players connect
T+1s-45s: Gameplay (inputs, sprites moving, variables changing)
T+45s   : Winner condition met → REPORT_WINNER event
T+45s   : Game end condition met → GAME_ENDED event
T+45s   : Finalization starts automatically
T+45.1s : Backend API called
T+45.5s : Blockchain transaction created
T+46s   : Transaction confirmed
T+46s   : Logs written to file
T+46s   : VM cleaned up
```

---

## 📁 Where to Find Logs

**Console:** Real-time in vm-server terminal

**Files:** `packages/vm-server/logs/game-results-YYYY-MM-DD.jsonl`

**Format:** JSON Lines (one game per line, easy to parse)

---

## 🔍 Log File Details

Each entry contains:
- `roomId` - Full room ID
- `winner` - Full winner user ID
- `players` - Array of all player IDs
- `duration` - Game duration in seconds
- `startedAt` - Unix timestamp (ms)
- `endedAt` - Unix timestamp (ms)
- `finalizedAt` - Unix timestamp (ms)
- `startedAtISO` - ISO 8601 datetime
- `endedAtISO` - ISO 8601 datetime
- `finalizedAtISO` - ISO 8601 datetime
- `txHash` - Blockchain transaction hash
- `blockchainStatus` - Transaction status
- `blockNumber` - Block number (if available)
- `gasUsed` - Gas used (if available)

---

## 💡 Reading Log Files

**View today's games:**
```bash
cat logs/game-results-2024-10-30.jsonl
```

**Count completed games:**
```bash
wc -l logs/game-results-2024-10-30.jsonl
```

**Parse with jq:**
```bash
cat logs/game-results-2024-10-30.jsonl | jq .
```

**Filter by winner:**
```bash
grep "user1234" logs/game-results-2024-10-30.jsonl
```

---

## ✅ What You Get

1. **Real-time console logs** with all details
2. **Permanent file storage** of all completed games
3. **Complete timestamps** (start, end, finalized)
4. **Blockchain transaction details** (hash, block, gas)
5. **Player information** (all participants + winner)
6. **Game duration** calculation

**Every completed game is logged with full details!** 🎮💰
