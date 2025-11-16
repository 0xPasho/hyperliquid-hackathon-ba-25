# Final Architecture Decisions - Secure Winner Reporting System

**Date:** 2025-10-29
**Status:** Final Architecture Selected
**Decision:** Server-Authoritative Game Execution with State Broadcasting

---

## Executive Summary

After extensive security analysis, we determined that **client-side game execution cannot be made secure** for betting games. The final architecture uses **server-side Scratch VM execution** where the server is the authoritative source of truth, and clients only send inputs and receive rendered state.

---

## The Core Problem

**Goal:** Allow Scratch games with real money betting where winner determination is tamper-proof.

**Challenge:** Any client-side code can be modified by malicious players to:
- Report false winners
- Fake game state (positions, scores, coins)
- Inject winning conditions via browser console
- Run modified game engines

**Bottom Line:** If game logic runs on player's computer, player controls it.

---

## Security Vulnerabilities Discovered

### ❌ Vulnerability 1: Cloud Variable Manipulation

**Original Approach:**
```
Player runs game locally → Sets cloud variable "winner" → Cloud server trusts it
```

**Attack:**
```javascript
// Browser console injection
vm.runtime.ext_blockchain.reportWinner({USERID: "attacker_id"});
vm.runtime.ext_blockchain.endGame();
// Stole the prize!
```

**Why it fails:** Any player can set cloud variables directly.

---

### ❌ Vulnerability 2: Direct WebSocket Manipulation

**Attack:**
```javascript
// Player inspects WebSocket protocol
ws.send(JSON.stringify({
    method: 'set',
    name: 'room_abc123_winner',
    value: 'attacker_id'
}));
```

**Why it fails:** WebSocket messages can be crafted by anyone.

---

### ❌ Vulnerability 3: Modified Client

**Attack:**
- Download Scratch VM source code
- Modify to auto-win
- Run locally with modified code
- Server has no way to detect modification

**Why it fails:** No client-side validation can prevent code modification.

---

### ❌ Vulnerability 4: Headers/Tokens Don't Help

**Why this doesn't work:**
- Special headers? → Modified client copies headers
- Auth tokens? → Modified client extracts and reuses
- Origin checks? → Easily spoofed
- Code signing? → Player runs signed version with runtime modifications

**Fundamental truth:** Any client-side check can be bypassed.

---

### ❌ Vulnerability 5: State Reporting Validation

**Approach Considered:**
```
Players report positions/scores → Server validates "impossible" values
```

**Attack:**
```javascript
// Attacker just reports realistic increments
setInterval(() => {
    reportPosition(currentPos += 2); // Looks legitimate!
}, 100);
```

**Why it fails:**
- Server doesn't know game rules
- Can't distinguish legitimate vs fake increments
- Collusion: All players agree on fake winner

---

### ❌ Vulnerability 6: AI Code Validation Only

**Approach Considered:**
- AI reviews game code for cheats before approval
- Trust approved games

**Why it fails:**
- AI can miss obfuscated exploits
- Doesn't prevent runtime console injection
- Doesn't prevent modified client execution
- Players can still hack verified games

---

### ❌ Vulnerability 7: Consensus Voting

**Approach Considered:**
- Require 75% of players to agree on winner
- Democratic validation

**Why it fails:**
- Colluding players can vote for fake winner
- Losers might not vote (poor UX)
- Deadlocks if players disconnect
- Still vulnerable to coordinated attacks

---

## Solutions Considered

### Option 1: Trust + Manual Approval ⚠️
- **Security:** Low (relies on honesty)
- **Cost:** Free
- **Verdict:** ❌ Not acceptable for real money

### Option 2: Consensus Voting ⚠️
- **Security:** Medium-Low (vulnerable to collusion)
- **Cost:** Low
- **Verdict:** ❌ Poor UX, not secure enough

### Option 3: Client-Side + State Validation ⚠️
- **Security:** Low (fake state reports)
- **Cost:** Low
- **Verdict:** ❌ Fundamentally insecure

### Option 4: Headless Browser Viewer ⚠️
- **Security:** Medium (sees game but can't prevent rigged logic)
- **Cost:** High ($200-500/month)
- **Verdict:** ❌ Expensive and still vulnerable

### Option 5: Server-Side VM Execution ✅
- **Security:** High (server is source of truth)
- **Cost:** Low-Medium ($10-50/month)
- **Verdict:** ✅ **SELECTED**

---

## ✅ Final Architecture: Server-Authoritative Game Execution

### Core Principle

**Server runs the game. Clients are dumb terminals.**

```
Player Browsers → Send ONLY inputs (keypresses, clicks)
        ↓
Server Scratch VM → Runs game logic, computes ALL state
        ↓
Server → Broadcasts game state to all clients
        ↓
Player Browsers → Render what server tells them
```

### Why This Is Secure

✅ **Server runs verified game code** - Players can't modify it
✅ **Server computes all state** - Players can't fake positions/scores
✅ **Server determines winner** - No client-side winner reporting
✅ **Clients only render** - Can't affect game outcome
✅ **Single source of truth** - Server's VM is authoritative

### What Players CAN'T Do Anymore

❌ Modify game code (doesn't run on their machine)
❌ Fake positions/scores (server computes these)
❌ Report false winners (server decides winner)
❌ Console injection (affects only their view, not game state)
❌ Modified clients (server doesn't trust client state)

---

## Technical Architecture

### Components

**1. Backend API** (Existing)
- Handles room creation requests
- Checks VM server capacity
- Manages betting/escrow
- Calls smart contracts

**2. VM Server** (NEW - To Build)
- Runs Scratch VM instances
- Manages game lifecycle
- Routes player inputs to VMs
- Broadcasts state to players

**3. Client Browsers** (Modified)
- Send inputs to VM server
- Receive and render state
- Display game visuals only

### Infrastructure

**Server:** Hetzner dedicated 32GB RAM
**Cost:** $20-40/month
**Capacity:** 200-300 concurrent game instances
**Your Load:** 50 games/hour peak = ~5 concurrent = Well within capacity

### VM Server Architecture

```javascript
// Core structure
class GameInstanceManager {
  runningGames: Map<roomId, VirtualMachine>
  maxConcurrentGames: 200
  waitingQueue: Array<roomId>

  canStartGame() → boolean
  startGame(roomId, projectCode) → VM
  endGame(roomId) → void
  getVM(roomId) → VM
}

// Two services in VM server
1. REST API - Room slot management
   POST /request-slot → { status: "ready" | "queued" }

2. WebSocket Server - Player input/state broadcasting
   ws://vm-server.com?roomId=X
```

### Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│ Step 1: Room Creation                                    │
└──────────────────────────────────────────────────────────┘
Backend API → POST /request-slot to VM Server
VM Server → Check capacity (< 200 games?)
  Yes → Start VM instance, return "ready"
  No → Add to queue, return "queued" + position

┌──────────────────────────────────────────────────────────┐
│ Step 2: Players Connect                                  │
└──────────────────────────────────────────────────────────┘
Player 1 → ws://vm-server?roomId=abc123&userId=user1
Player 2 → ws://vm-server?roomId=abc123&userId=user2
Player 3 → ws://vm-server?roomId=abc123&userId=user3
Player 4 → ws://vm-server?roomId=abc123&userId=user4

All connected to SAME VM instance

┌──────────────────────────────────────────────────────────┐
│ Step 3: Game Execution                                   │
└──────────────────────────────────────────────────────────┘
Player 1 → Presses space → WS message: {key: "space", action: "keydown"}
VM Server → Injects into VM: runtime.ioDevices.keyboard.postData({key: "space"})
VM → Executes game logic → Updates sprite positions, scores, etc.
VM Server → Broadcasts state to all 4 players:
  {
    sprites: { player1: {x: 45, y: 100}, player2: {x: 78, y: 95} },
    score: 150,
    timer: 45
  }
Players → Render received state

┌──────────────────────────────────────────────────────────┐
│ Step 4: Winner Determination                             │
└──────────────────────────────────────────────────────────┘
VM → Reaches win condition in game code
VM → Emits event: runtime.emit('GAME_ENDED', {winner: 'user1'})
VM Server → Calls Backend API: POST /game/report-result
Backend → Validates → Calls smart contract → Distributes prize
VM Server → Cleanup: endGame(roomId), process queue

┌──────────────────────────────────────────────────────────┐
│ Step 5: Cleanup & Queue Processing                       │
└──────────────────────────────────────────────────────────┘
VM Server → Destroy VM instance → Free RAM
VM Server → Check queue → Start next waiting game if any
```

---

## Technical Specifications

### VM Instances

**Per Instance:**
- RAM: 50-100MB
- CPU: ~20% of 1 core
- Startup Time: 1-3 seconds to load project
- Lifetime: ~5 minutes average

**Server Capacity (32GB Hetzner):**
- Theoretical Max: 320 instances (100MB each)
- Practical Max: 200 instances (accounting for OS, overhead)
- Your Peak Load: 5 instances
- Headroom: 40x your current needs

### State Broadcasting

**Update Frequency:** 20 FPS (every 50ms)
**State Size:** ~5KB per update
**Per Player Bandwidth:** 5KB × 20fps = 100KB/sec
**Per Game (4 players):** 400KB/sec

**Game Duration:** 5 minutes average
**Data Per Game:** 400KB/sec × 300sec = 120MB

**Your Volume:**
- 50 games/hour peak
- 50 × 120MB = 6GB/hour
- Daily (8 peak hours): ~50GB/day
- Monthly: ~1.5TB/month

**Hetzner Bandwidth:** 20TB included → **Well within limits ($0 overage)**

### Input Latency

**Player presses key → Sees result:**
- Input sent to server: 10-30ms (ping)
- Server processes: 1-5ms
- State broadcast: 10-30ms (ping)
- Client renders: 16ms (60fps)

**Total Latency:** 40-80ms (acceptable for most games)

**Optimization:** Predictive client-side rendering (optional later)

---

## Cost Analysis

### Infrastructure Costs

**Hetzner Dedicated Server (32GB RAM):**
- Monthly: $40/month
- Bandwidth: 20TB included
- Handles: 200 concurrent games

**Your Current Scale:**
- 50 games/hour peak
- ~5 concurrent games
- Bandwidth: 1.5TB/month
- **Cost: $40/month total**

**At 10x Scale (500 games/hour):**
- ~50 concurrent games
- Still 1 server handles it
- **Cost: $40/month** (same!)

**At 100x Scale (5000 games/hour):**
- ~400 concurrent games
- Need 2 servers
- **Cost: $80/month**

### Cost Per Game

**Current Scale:**
- $40/month ÷ 30 days ÷ 50 games/hour ÷ 8 hours = **$0.003 per game**
- Essentially free per game

**Comparison to Alternatives:**
- AWS Fargate: $0.001-0.003 per game (similar)
- Headless Browser: $0.01-0.05 per game (10x more expensive)
- Manual Review: Impossible to scale

### Revenue Breakeven

**If you take 5% commission:**
- Need $800/month in bet volume to break even
- $800 ÷ 5% = $16,000 total bets
- At $10 avg bet = 1,600 bets/month
- = 53 bets/day
- **Easily achievable**

---

## Implementation Checklist

### Phase 1: VM Server Core (Week 1)

- [ ] Create new service: `packages/vm-server/`
- [ ] Install dependencies: `scratch-vm`, `ws`, `express`
- [ ] Implement `GameInstanceManager` class
  - [ ] `startGame()` - Load project, initialize VM
  - [ ] `endGame()` - Cleanup, free resources
  - [ ] `getVM()` - Retrieve VM by roomId
  - [ ] Capacity checking
  - [ ] Queue management
- [ ] Implement REST API
  - [ ] `POST /request-slot` - Request game slot
  - [ ] `GET /status` - Server health/capacity
  - [ ] `POST /end-game` - Force end game (admin)
- [ ] Implement WebSocket Server
  - [ ] Player connection handling
  - [ ] Room-based connection grouping
  - [ ] Input message routing
  - [ ] State broadcasting
- [ ] Add VM event listeners
  - [ ] `GAME_ENDED` event
  - [ ] `REPORT_WINNER` event
  - [ ] Auto-cleanup on game end

### Phase 2: Scratch VM Integration (Week 1-2)

- [ ] Modify scratch-vm betting extension
  - [ ] Remove direct cloud variable setting for winner/ended
  - [ ] Add `runtime.emit('GAME_ENDED', {winner})`
  - [ ] Add `runtime.emit('REPORT_WINNER', {userId})`
- [ ] Test VM input injection
  - [ ] Keyboard events
  - [ ] Mouse events
  - [ ] Touch events (mobile)
- [ ] Test state extraction
  - [ ] Sprite positions
  - [ ] Variables
  - [ ] Costumes/visibility
- [ ] Optimize state serialization
  - [ ] Delta encoding (only changes)
  - [ ] Binary format (Protocol Buffers?)
  - [ ] Compression

### Phase 3: Backend Integration (Week 2)

- [ ] Update backend API
  - [ ] Add VM server URL config
  - [ ] Implement room creation flow
    - [ ] Request slot from VM server
    - [ ] Handle "queued" status
    - [ ] Store VM server assignment
  - [ ] Add webhook endpoint for VM server
    - [ ] Receive game end notifications
    - [ ] Validate signature/auth
    - [ ] Trigger prize distribution
- [ ] Database schema updates
  - [ ] Add `vm_server_assigned` column
  - [ ] Add `vm_slot_status` (ready/queued)
  - [ ] Add `queue_position` column
- [ ] Update smart contract integration
  - [ ] Ensure only backend can call contract
  - [ ] Add additional validation

### Phase 4: Frontend Updates (Week 2-3)

- [ ] Modify scratch-gui
  - [ ] Remove local game execution for betting games
  - [ ] Implement WebSocket client for VM server
  - [ ] Send input events instead of running locally
  - [ ] Receive and render state updates
  - [ ] Add "Connecting to game server..." UI
  - [ ] Add "Queued - Position: X" UI
  - [ ] Handle reconnection logic
- [ ] Add lag compensation (optional)
  - [ ] Predict local state
  - [ ] Reconcile with server state
  - [ ] Smooth interpolation

### Phase 5: Testing & Deployment (Week 3-4)

- [ ] Unit tests
  - [ ] GameInstanceManager
  - [ ] Input routing
  - [ ] State broadcasting
- [ ] Integration tests
  - [ ] Full game flow (4 players)
  - [ ] Queue system
  - [ ] Capacity limits
  - [ ] Cleanup after game end
- [ ] Load testing
  - [ ] 50 concurrent games
  - [ ] 200 concurrent games (max capacity)
  - [ ] Queue processing
  - [ ] Memory leak detection
- [ ] Security testing
  - [ ] Verify client can't inject winner
  - [ ] Verify modified client doesn't affect server
  - [ ] Test DoS protection
- [ ] Deploy to staging
  - [ ] Hetzner server setup
  - [ ] Monitoring (CPU, RAM, bandwidth)
  - [ ] Logging (game events, errors)
- [ ] Production deployment
  - [ ] DNS setup
  - [ ] SSL certificates
  - [ ] Health checks
  - [ ] Alerts

---

## Security Guarantees

### ✅ What This Architecture Prevents

**1. Winner Manipulation**
- ❌ Player reports false winner
- ✅ Server determines winner from verified game logic

**2. State Manipulation**
- ❌ Player fakes position/score
- ✅ Server computes all state

**3. Code Tampering**
- ❌ Player modifies game code
- ✅ Server runs verified code only

**4. Console Injection**
- ❌ Player uses browser console to cheat
- ✅ Console only affects local view, not server state

**5. Modified Clients**
- ❌ Player runs custom game client
- ✅ Server ignores client state, only accepts inputs

**6. Replay Attacks**
- ❌ Player replays winning input sequence
- ✅ Server maintains game timeline, inputs timestamped

**7. Race Conditions**
- ❌ Two players claim simultaneous win
- ✅ Server has single authoritative timeline

**8. Collusion**
- ❌ All players agree on fake winner
- ✅ Server determines winner independently

### ⚠️ Remaining Risks

**1. DDoS on VM Server**
- Attack: Flood server with connection requests
- Mitigation: Rate limiting, queue caps, cloud DDoS protection

**2. Rigged Game Logic**
- Attack: Game creator codes unfair advantage
- Mitigation: AI + manual review before approval, community reporting

**3. Server Compromise**
- Attack: Hacker gains access to VM server
- Mitigation: Standard security practices, minimal permissions, monitoring

**4. Network Issues**
- Risk: Server latency affects gameplay
- Mitigation: Multiple geographic servers (future), reconnection logic

### Security Level: HIGH ✅

This architecture provides **cryptographically strong guarantees** that:
- Winner determination cannot be manipulated by players
- Game state is authoritative and tamper-proof
- Only verified game code executes
- All actions are auditable

---

## Monitoring & Observability

### Key Metrics

**VM Server Health:**
- Active games count
- Queue length
- Memory usage
- CPU usage
- Bandwidth usage

**Game Metrics:**
- Average game duration
- Games started per hour
- Games completed per hour
- Queue wait time
- Player latency (ping)

**Error Tracking:**
- VM crashes
- Failed game starts
- Disconnections
- State broadcast errors

### Alerts

**Critical:**
- VM server down
- Memory > 90%
- Queue > 100 games
- Error rate > 5%

**Warning:**
- Memory > 70%
- Queue > 50 games
- Average latency > 100ms

### Logging

**What to Log:**
- Game start/end events
- Winner determinations
- Player connections/disconnections
- Input events (for replay/debugging)
- State snapshots (periodic)
- Errors and exceptions

**Retention:**
- Real-time logs: 7 days
- Game replays: 30 days
- Audit trail: Permanent

---

## Migration Plan

### Phase 1: Parallel Systems (Week 1-2)
- Old system (cloud variables) still active
- New system (VM server) deployed
- Only testing games use new system
- Validate functionality

### Phase 2: Gradual Rollout (Week 3-4)
- 10% of new games use VM server
- Monitor performance, errors
- Fix issues found
- Increase to 50%

### Phase 3: Full Migration (Week 5)
- 100% of new games use VM server
- Old cloud variable system deprecated
- Monitoring for issues
- Quick rollback plan ready

### Phase 4: Cleanup (Week 6+)
- Remove old cloud variable winner reporting code
- Update documentation
- Archive old system

---

## Future Enhancements

### Phase 2 Features (After MVP)

**1. Multiple Winners**
- Support prize splits
- Ranking-based distributions
- Co-op games

**2. Tournament Support**
- Multi-round games
- Bracket systems
- Leaderboards

**3. Geographic Distribution**
- Multiple VM servers (US, EU, Asia)
- Route players to nearest server
- Reduce latency

**4. Spectator Mode**
- Watch live games
- Replay past games
- Streaming integration

**5. Advanced Anti-Cheat**
- ML-based anomaly detection
- Behavioral analysis
- Pattern recognition

### Optimization Opportunities

**1. Predictive Client Rendering**
- Client predicts next frame
- Reconciles with server
- Reduces perceived latency

**2. State Compression**
- Binary Protocol Buffers
- Delta encoding
- Reduce bandwidth by 60-70%

**3. VM Pooling**
- Pre-warm VMs with popular games
- Instant game start
- Better UX

**4. Horizontal Scaling**
- Multiple VM servers
- Load balancer
- Auto-scaling based on demand

---

## FAQ

### Q: What if server goes down?

**A:** Implement redundancy:
- Health checks every 10 seconds
- Automatic failover to backup server
- Queue preserved during failover
- Players reconnect automatically

### Q: Can players still cheat somehow?

**A:** Only if:
- They hack the server itself (standard security risk)
- Game logic is rigged (prevented by code review)
- Server has bugs (testing minimizes this)

Server-side execution is as secure as online banking.

### Q: What about input lag?

**A:** 40-80ms total latency is acceptable for:
- Racing games
- Puzzle games
- Turn-based games
- Most Scratch games

Not ideal for:
- Fighting games (need <16ms)
- Rhythm games (need <20ms)

(These aren't typical betting games anyway)

### Q: Is this overkill for small scale?

**A:** No:
- $40/month is cheap
- Security is critical for real money
- Scales to 40x your current volume
- One-time implementation cost

### Q: Can we start with cheaper option?

**A:** No secure alternative exists:
- Client-side = hackable
- Manual review = doesn't scale
- Consensus = vulnerable to collusion

This is the minimum viable secure architecture.

---

## Decision Rationale

### Why Not Client-Side?

**Every client-side approach we analyzed had critical vulnerabilities:**

1. Cloud variables → Directly manipulatable
2. State validation → Fake state reports
3. Consensus voting → Collusion attacks
4. Headers/tokens → Bypassable
5. Code signing → Runtime modification
6. AI validation → Doesn't prevent runtime hacks

**Fundamental issue:** Code on player's machine is controlled by player.

### Why Server-Side Is The Only Option?

**Simple truth:** For real money games, you need a trusted referee.

**Analogies:**
- Casino: House runs the game, not players
- Online poker: Server shuffles deck, not clients
- Stock exchange: Exchange matches orders, not traders

**No legitimate betting platform lets clients be authoritative.**

### Why This Specific Architecture?

**Compared to alternatives:**

| Approach | Security | Cost | Latency | Verdict |
|----------|----------|------|---------|---------|
| Client-side | ❌ Low | ✅ Free | ✅ 0ms | ❌ Insecure |
| Headless browser | ⚠️ Medium | ❌ High | ⚠️ 100ms+ | ❌ Expensive |
| Server VM | ✅ High | ✅ Low | ✅ 40-80ms | ✅ **Best** |
| AWS Lambda | ✅ High | ⚠️ Medium | ✅ 50-100ms | ⚠️ Variable cost |

**Server VM on dedicated hardware wins on all metrics.**

---

## Conclusion

After thorough analysis of security vulnerabilities and cost trade-offs, **server-authoritative game execution is the only viable architecture** for a betting platform.

### Key Takeaways

✅ **Security:** High - server is cryptographic source of truth
✅ **Cost:** Low - $40/month for 50 games/hour
✅ **Scalability:** Excellent - handles 40x current load
✅ **Performance:** Good - 40-80ms latency acceptable
✅ **Implementation:** Moderate - 3-4 weeks

### Next Steps

1. **Approve this architecture** ✓ (if accepted)
2. **Begin Phase 1 implementation** (VM server core)
3. **Set up Hetzner server** (infrastructure)
4. **Develop in parallel** (backend, frontend, VM server)
5. **Test thoroughly** (security, performance, load)
6. **Deploy to staging** (validate with real games)
7. **Production launch** (gradual rollout)

### Success Criteria

**Security:** Zero successful cheating attempts in testing
**Performance:** <100ms average latency, 99% uptime
**Cost:** <$50/month for projected load
**UX:** <3 second game start time

---

**This architecture provides the security guarantees needed for real-money betting while remaining cost-effective and performant.**

**Status:** ✅ Ready for implementation

**Estimated Timeline:** 3-4 weeks to production-ready MVP

**Risk Level:** Low (proven architecture, well-understood technology)

---

*Document Version: 1.0*
*Last Updated: 2025-10-29*
*Owner: Engineering Team*
