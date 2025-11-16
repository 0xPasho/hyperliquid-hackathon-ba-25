# Enhanced Game Validation & Multi-Round Support Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for enhancing the cloud variable system to support:
- ✅ Game project verification (prevent code tampering)
- ✅ Multi-round and tournament games
- ✅ Partial rewards and ranking systems
- ✅ Real-time game state validation
- ✅ Replay verification
- ✅ Server-side anti-cheat measures

## Current Limitations

### 1. **Single-Round Only**
- Games can only finalize once per room
- No support for best-of-3, tournaments, etc.

### 2. **Winner-Takes-All**
- No partial rewards (2nd place, 3rd place)
- No ranking-based prize distribution

### 3. **No Code Verification**
- Players could modify Scratch project to cheat
- No way to verify game hasn't been tampered with

### 4. **Trust-Based Win Detection**
- Cloud server trusts whatever winner is reported
- No validation that winner actually won

### 5. **No Game State Tracking**
- Can't detect impossible state transitions
- Can't replay/verify game outcomes

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  1. Game Registration Phase                                 │
│  ─────────────────────────────────────────────────────────  │
│  Game Creator → Upload Project → Backend Hashes Code        │
│  Backend → Stores: {projectId, codeHash, metadata}          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Game Session Creation                                   │
│  ─────────────────────────────────────────────────────────  │
│  Backend → Creates Room → Links to Verified Project         │
│  Cloud Server → Validates Project Hash                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Gameplay with State Tracking                            │
│  ─────────────────────────────────────────────────────────  │
│  Scratch → Sends State Updates → Cloud Server               │
│  Cloud Server → Validates State Transitions                 │
│  Cloud Server → Detects Anomalies                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Round/Match Completion                                  │
│  ─────────────────────────────────────────────────────────  │
│  Scratch → Reports Round Results (winner/rankings)          │
│  Cloud Server → Validates Against Game State                │
│  Cloud Server → Stores Round Data                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Game Finalization                                       │
│  ─────────────────────────────────────────────────────────  │
│  All Rounds Complete → Cloud Server Aggregates Results      │
│  Cloud Server → Calculates Final Rankings                   │
│  Cloud Server → Calls Backend API with Full Data            │
│  Backend → Validates → Calls Smart Contract                 │
│  Smart Contract → Distributes Prizes Based on Rankings      │
└─────────────────────────────────────────────────────────────┘
```

## Components to Implement

### 1. **Scratch-GUI Enhancements**

#### 1.1 Project Verification System
**File**: `packages/scratch-gui/src/lib/project-verifier.js` (NEW)

```javascript
class ProjectVerifier {
    // Generate hash of project JSON
    async hashProject(projectJson)

    // Send project hash to backend for verification
    async verifyProjectWithBackend(projectId, hash)

    // Check if current project matches registered hash
    async validateProjectIntegrity()
}
```

#### 1.2 Game State Reporting
**File**: `packages/scratch-vm/src/extensions/scratch3_blockchain/index.js`

New blocks:
```javascript
// State tracking blocks
reportGameState(stateData)  // Send periodic state snapshots
reportRoundResult(rankings) // Report results for single round
reportFinalRankings(rankings) // Final game rankings

// Multi-round blocks
startRound(roundNumber)
endRound(roundNumber, rankings)
```

New methods:
```javascript
_sendStateUpdate(stateData)    // Periodic state sync
_validateStateLocally(state)   // Client-side validation
_handleServerValidation(result) // Handle server validation response
```

#### 1.3 Enhanced Cloud Variables
**New Variable Types**:
```javascript
// Project verification
room_{roomId}_project_hash     // Verified project hash

// Multi-round support
room_{roomId}_round_{n}_started
room_{roomId}_round_{n}_rankings
room_{roomId}_round_{n}_ended

// Game state tracking
room_{roomId}_state_{timestamp} // Periodic state snapshots
room_{roomId}_validation_status // Server validation status

// Final results
room_{roomId}_final_rankings    // Aggregated rankings
room_{roomId}_game_mode         // single/best-of-3/tournament
```

### 2. **Cloud Server Enhancements**

#### 2.1 Project Verification Handler
**File**: `packages/cloud-server/src/project-verifier.js` (NEW)

```javascript
class ProjectVerifier {
    constructor() {
        this.verifiedProjects = new Map(); // {roomId: {projectId, hash, metadata}}
    }

    // Verify project hash with backend
    async verifyProject(roomId, projectId, projectHash)

    // Check if room is using verified project
    isProjectVerified(roomId)

    // Get project metadata (game mode, rounds, rules)
    getProjectMetadata(roomId)
}
```

#### 2.2 Game State Validator
**File**: `packages/cloud-server/src/state-validator.js` (NEW)

```javascript
class StateValidator {
    constructor() {
        this.gameStates = new Map(); // {roomId: [state1, state2, ...]}
        this.validationRules = new Map(); // {projectId: rules}
    }

    // Receive and store state update
    recordStateUpdate(roomId, userId, stateData, timestamp)

    // Validate state transition is legal
    validateStateTransition(roomId, previousState, newState)

    // Detect anomalies (impossible scores, teleportation, etc.)
    detectAnomalies(roomId, stateHistory)

    // Validate final results against state history
    validateResults(roomId, reportedRankings)
}
```

#### 2.3 Multi-Round Handler
**File**: `packages/cloud-server/src/round-manager.js` (NEW)

```javascript
class RoundManager {
    constructor() {
        this.rounds = new Map(); // {roomId: {currentRound, rounds: [], gameMode}}
    }

    // Handle round start
    handleRoundStart(roomId, roundNumber)

    // Handle round end with rankings
    handleRoundEnd(roomId, roundNumber, rankings)

    // Check if all rounds complete
    isGameComplete(roomId)

    // Calculate final rankings from all rounds
    calculateFinalRankings(roomId)

    // Support different game modes
    // - single: One round, winner takes all
    // - best-of-N: First to win N/2+1 rounds
    // - tournament: Bracket-style elimination
    // - ranked: Points across all rounds
}
```

#### 2.4 Enhanced Betting Handler
**File**: `packages/cloud-server/src/betting-handler.js` (MODIFIED)

```javascript
class BettingHandler {
    // New: Support rankings instead of just winner
    handleRankingsSet(roomId, rankings, userId)

    // New: Validate rankings against state history
    async validateAndFinalizeRankings(roomId, rankings)

    // New: Call backend with full game data
    async finalizeGame(roomId, {
        rankings,
        rounds,
        stateHistory,
        validationProof
    })
}
```

### 3. **Backend API Enhancements**

#### 3.1 Project Registration
**Endpoint**: `POST /api/game/register-project`

```javascript
{
    projectId: string,        // Scratch project ID
    projectJson: object,      // Full project JSON
    metadata: {
        name: string,
        gameMode: 'single' | 'best-of-3' | 'tournament' | 'ranked',
        maxRounds: number,
        maxPlayers: number,
        rankingMethod: 'winner-only' | 'top-3' | 'all-players',
        prizeDistribution: [70, 20, 10], // Percentages for 1st, 2nd, 3rd
        validationRules: {
            maxScore: number,
            maxSpeed: number,
            // ... game-specific rules
        }
    }
}

Response:
{
    success: true,
    data: {
        projectId: string,
        projectHash: string,     // SHA-256 hash of project JSON
        verificationToken: string,
        metadata: object
    }
}
```

#### 3.2 Project Verification
**Endpoint**: `GET /api/game/verify-project/:projectId`

```javascript
Response:
{
    success: true,
    data: {
        projectId: string,
        projectHash: string,
        verified: boolean,
        metadata: object,
        createdAt: timestamp,
        approvalStatus: 'pending' | 'approved' | 'rejected'
    }
}
```

#### 3.3 Enhanced Game Result Reporting
**Endpoint**: `POST /api/game/report-result` (MODIFIED)

```javascript
{
    roomId: string,
    projectId: string,
    projectHash: string,        // Verify against registered hash

    // New: Support rankings instead of just winners
    rankings: [
        { userId: string, rank: 1, score: 100, metadata: {...} },
        { userId: string, rank: 2, score: 80, metadata: {...} },
        { userId: string, rank: 3, score: 60, metadata: {...} }
    ],

    // New: Multi-round data
    rounds: [
        { roundNumber: 1, rankings: [...], timestamp: ... },
        { roundNumber: 2, rankings: [...], timestamp: ... }
    ],

    // New: Validation data
    validation: {
        stateHistoryHash: string,  // Hash of game state history
        anomaliesDetected: boolean,
        validationPassed: boolean,
        validatorSignature: string  // Cloud server signature
    },

    source: 'cloud_server',
    metadata: {
        setBy: {...},
        finalizedAt: timestamp,
        playerCount: number,
        duration: number
    }
}

Response:
{
    success: true,
    data: {
        transactionHash: string,
        rankings: [...],
        prizeDistribution: [
            { userId: string, walletAddress: string, amount: string },
            ...
        ]
    }
}
```

#### 3.4 State History Storage
**Endpoint**: `POST /api/game/store-state-history`

```javascript
{
    roomId: string,
    stateHistory: [
        { timestamp: number, userId: string, state: {...} },
        ...
    ],
    stateHistoryHash: string
}
```

### 4. **Database Schema Changes**

#### 4.1 New Table: `verified_projects`
```sql
CREATE TABLE verified_projects (
    id UUID PRIMARY KEY,
    project_id VARCHAR(255) UNIQUE NOT NULL,
    project_hash VARCHAR(64) NOT NULL,  -- SHA-256
    creator_user_id UUID REFERENCES users(id),

    -- Project metadata
    name VARCHAR(255),
    description TEXT,
    game_mode VARCHAR(50), -- single, best-of-3, tournament, ranked
    max_rounds INTEGER,
    max_players INTEGER,
    ranking_method VARCHAR(50),
    prize_distribution JSONB, -- [70, 20, 10]
    validation_rules JSONB,

    -- Verification status
    approval_status VARCHAR(50), -- pending, approved, rejected
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project_id ON verified_projects(project_id);
CREATE INDEX idx_project_hash ON verified_projects(project_hash);
```

#### 4.2 Modify Table: `game_rooms`
```sql
ALTER TABLE game_rooms ADD COLUMN verified_project_id UUID REFERENCES verified_projects(id);
ALTER TABLE game_rooms ADD COLUMN game_mode VARCHAR(50);
ALTER TABLE game_rooms ADD COLUMN current_round INTEGER DEFAULT 1;
ALTER TABLE game_rooms ADD COLUMN max_rounds INTEGER DEFAULT 1;
```

#### 4.3 New Table: `game_rounds`
```sql
CREATE TABLE game_rounds (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES game_rooms(id),
    round_number INTEGER NOT NULL,

    -- Round data
    rankings JSONB NOT NULL, -- [{userId, rank, score, metadata}]
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration INTEGER, -- seconds

    -- Validation
    state_history_hash VARCHAR(64),
    validation_passed BOOLEAN,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_room_rounds ON game_rounds(room_id, round_number);
```

#### 4.4 New Table: `game_state_history`
```sql
CREATE TABLE game_state_history (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES game_rooms(id),
    round_number INTEGER,
    user_id UUID REFERENCES users(id),

    -- State data
    timestamp BIGINT NOT NULL,
    state_data JSONB NOT NULL,
    state_hash VARCHAR(64),

    -- Validation
    validated BOOLEAN DEFAULT false,
    anomaly_detected BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_state_history_room ON game_state_history(room_id, timestamp);
```

#### 4.5 Modify Table: `game_results`
```sql
ALTER TABLE game_results ADD COLUMN rankings JSONB; -- Full rankings data
ALTER TABLE game_results ADD COLUMN rounds JSONB; -- All round data
ALTER TABLE game_results ADD COLUMN validation_data JSONB; -- Validation info
ALTER TABLE game_results ADD COLUMN state_history_hash VARCHAR(64);
```

## Implementation Phases

### Phase 1: Project Verification System (Week 1)

**Day 1-2: Backend**
- [ ] Create `verified_projects` table
- [ ] Implement `POST /api/game/register-project` endpoint
- [ ] Implement `GET /api/game/verify-project/:projectId` endpoint
- [ ] Create project hashing utility
- [ ] Add admin approval workflow

**Day 3-4: Scratch-GUI**
- [ ] Create `project-verifier.js` utility
- [ ] Add project hash generation on load
- [ ] Add verification check before game start
- [ ] Show verification status in UI

**Day 5-6: Cloud Server**
- [ ] Create `project-verifier.js` handler
- [ ] Verify project hash on room creation
- [ ] Reject unverified projects (if enabled)
- [ ] Cache verified project metadata

**Day 7: Testing & Documentation**
- [ ] Test full verification flow
- [ ] Document verification process
- [ ] Create admin guide

### Phase 2: Multi-Round Support (Week 2)

**Day 1-2: Backend**
- [ ] Create `game_rounds` table
- [ ] Modify `game_rooms` table
- [ ] Update result reporting endpoint
- [ ] Add round aggregation logic

**Day 3-4: Cloud Server**
- [ ] Create `round-manager.js`
- [ ] Handle round start/end events
- [ ] Implement game mode logic (best-of-3, etc.)
- [ ] Calculate final rankings

**Day 5-6: Scratch Extension**
- [ ] Add round management blocks
- [ ] Implement round state tracking
- [ ] Add round result reporting
- [ ] Update cloud variable patterns

**Day 7: Testing**
- [ ] Test single round games (backward compatibility)
- [ ] Test best-of-3 games
- [ ] Test tournament brackets
- [ ] Test ranked/points games

### Phase 3: Ranking & Partial Rewards (Week 3)

**Day 1-2: Backend**
- [ ] Update prize distribution logic
- [ ] Support configurable prize splits
- [ ] Add ranking validation
- [ ] Update smart contract calls

**Day 3-4: Cloud Server**
- [ ] Modify betting handler for rankings
- [ ] Validate ranking data
- [ ] Support different ranking methods
- [ ] Calculate partial rewards

**Day 5-6: Scratch Extension**
- [ ] Add ranking reporting blocks
- [ ] Support score-based rankings
- [ ] Support metadata in rankings
- [ ] Update final result reporting

**Day 7: Testing**
- [ ] Test winner-only distribution
- [ ] Test top-3 distribution
- [ ] Test all-players distribution
- [ ] Verify prize calculations

### Phase 4: State Validation (Week 4)

**Day 1-2: Backend**
- [ ] Create `game_state_history` table
- [ ] Implement state storage endpoint
- [ ] Add state validation utilities
- [ ] Create anomaly detection rules

**Day 3-4: Cloud Server**
- [ ] Create `state-validator.js`
- [ ] Implement state transition validation
- [ ] Add anomaly detection
- [ ] Validate results against state

**Day 5-6: Scratch Extension**
- [ ] Add automatic state reporting
- [ ] Implement state snapshot logic
- [ ] Add validation feedback
- [ ] Handle validation failures

**Day 7: Testing & Tuning**
- [ ] Test state validation accuracy
- [ ] Tune anomaly detection thresholds
- [ ] Test with various game types
- [ ] Performance optimization

## Security Model

### 1. **Project Verification Layer**
```
Game Creator → Submits Project → Backend Hashes → Admin Approves
                                        ↓
                              Verified Hash Stored
                                        ↓
Game Start → Cloud Server Verifies Hash → Reject if Mismatch
```

### 2. **State Validation Layer**
```
Player Action → State Update → Cloud Server → Validate Transition
                                     ↓
                              Valid? → Allow
                              Invalid? → Flag/Reject
```

### 3. **Result Validation Layer**
```
Reported Rankings → Cloud Server → Check Against State History
                                          ↓
                                   Valid? → Finalize
                                   Invalid? → Reject + Alert
```

### 4. **Multi-Signature Finalization** (Optional)
```
Cloud Server → Generates Validation Proof
             → Signs Result Data
             → Backend Verifies Signature
             → Only Then Calls Smart Contract
```

## Anti-Cheat Measures

### 1. **Code Tampering Prevention**
- SHA-256 hash of project JSON
- Verify hash before allowing betting
- Re-verify hash on game start
- Detect modifications mid-game

### 2. **State Manipulation Detection**
- Track all state changes with timestamps
- Validate state transitions are legal
- Detect impossible values (speed, score, position)
- Cross-reference player states

### 3. **Result Fabrication Prevention**
- Compare reported results with state history
- Require state snapshots throughout game
- Validate rankings are consistent with scores
- Multiple validation layers (client, server, backend)

### 4. **Timing Attack Prevention**
- Timestamp all events
- Detect unrealistic completion times
- Validate action sequences
- Rate limit state updates

### 5. **Consensus Validation** (Future)
- Require multiple players to agree on result
- Use Byzantine fault tolerance
- Weighted voting based on state consistency

## Configuration Options

### Environment Variables

**Backend**:
```bash
# Project verification
REQUIRE_PROJECT_VERIFICATION=true
PROJECT_APPROVAL_REQUIRED=true
AUTO_APPROVE_TRUSTED_CREATORS=false

# State validation
ENABLE_STATE_VALIDATION=true
STATE_VALIDATION_STRICT=false  # Reject on anomaly vs warn
STATE_SNAPSHOT_INTERVAL=5000   # ms

# Multi-round
ENABLE_MULTI_ROUND=true
MAX_ROUNDS_PER_GAME=10
```

**Cloud Server**:
```bash
# Verification
VERIFY_PROJECTS=true
CACHE_PROJECT_METADATA=true

# Validation
VALIDATE_STATE_TRANSITIONS=true
ANOMALY_DETECTION_ENABLED=true
ANOMALY_THRESHOLD=0.8

# Performance
STATE_HISTORY_MAX_SIZE=1000
CLEANUP_STATE_HISTORY_AFTER=3600000  # 1 hour
```

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/game/register-project` | Register and hash a game project |
| GET | `/api/game/verify-project/:id` | Get project verification status |
| PATCH | `/api/game/approve-project/:id` | Admin: Approve project |
| POST | `/api/game/report-result` | Report final game results (enhanced) |
| POST | `/api/game/store-state-history` | Store game state snapshots |
| GET | `/api/game/state-history/:roomId` | Retrieve state history |
| POST | `/api/game/validate-result` | Validate result against state |

## Testing Strategy

### Unit Tests
- [ ] Project hash generation
- [ ] State transition validation
- [ ] Ranking calculation
- [ ] Prize distribution math

### Integration Tests
- [ ] End-to-end verification flow
- [ ] Multi-round game completion
- [ ] State validation pipeline
- [ ] Result finalization

### Security Tests
- [ ] Modified project detection
- [ ] Invalid state transitions
- [ ] Fabricated results
- [ ] Timing attacks

### Performance Tests
- [ ] 100 concurrent games
- [ ] State history with 1000+ updates
- [ ] Large tournament (64 players)
- [ ] Database query optimization

## Success Metrics

### Security
- [ ] 0% false positives on valid games
- [ ] 100% detection of modified projects
- [ ] >95% detection of state anomalies
- [ ] <1% false rejections

### Performance
- [ ] <100ms state validation latency
- [ ] <500ms result finalization
- [ ] Support 1000+ concurrent games
- [ ] <50MB RAM per game

### Reliability
- [ ] 99.9% uptime
- [ ] Zero prize distribution errors
- [ ] Automatic failover on validation errors
- [ ] Complete audit trail

## Migration Plan

### Backward Compatibility
- [ ] Existing single-round games work unchanged
- [ ] Optional project verification (can enable later)
- [ ] Graceful degradation if validation disabled
- [ ] Legacy API endpoints still supported

### Deployment Steps
1. Deploy database migrations
2. Deploy backend with feature flags OFF
3. Deploy cloud server with validation disabled
4. Deploy scratch-gui updates
5. Enable features gradually per game
6. Monitor for issues
7. Full rollout after 1 week testing

## Future Enhancements

### Phase 5: Advanced Features
- [ ] Replay system (watch games after completion)
- [ ] Spectator mode with live state
- [ ] Leaderboards and seasons
- [ ] Automated matchmaking
- [ ] ELO rating system
- [ ] Anti-smurf detection

### Phase 6: Machine Learning
- [ ] ML-based anomaly detection
- [ ] Automatic cheat pattern recognition
- [ ] Predictive validation
- [ ] Adaptive difficulty

## Conclusion

This implementation plan provides a comprehensive, production-ready system for secure, verified, multi-round betting games with full state validation and anti-cheat measures.

**Estimated Total Implementation Time**: 4-5 weeks

**Team Requirements**:
- 2 backend developers
- 1 cloud server developer
- 1 frontend/Scratch developer
- 1 QA engineer
- 1 DevOps engineer

**Key Benefits**:
✅ Prevents code tampering and cheating
✅ Supports complex game modes
✅ Fair prize distribution
✅ Complete audit trail
✅ Production-ready security
✅ Scalable architecture
