# Testing Guide - VM Server Architecture

This guide provides comprehensive testing procedures for the server-authoritative Scratch VM architecture.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [Load Testing](#load-testing)
5. [Security Testing](#security-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Automated Test Scripts](#automated-test-scripts)
8. [Monitoring and Validation](#monitoring-and-validation)

---

## Prerequisites

### Required Tools

```bash
# Install testing dependencies
npm install --save-dev jest @types/jest supertest ws artillery autocannon

# Install monitoring tools
npm install --save-dev clinic node-clinic

# Install security testing tools
npm install --save-dev eslint-plugin-security snyk
```

### Test Environment Setup

1. **Start VM Server (Development Mode)**
```bash
cd packages/vm-server
cp .env.example .env
# Configure with test values
npm install
npm run dev
```

2. **Start Backend API (Test Mode)**
```bash
cd packages/api
npm run test:start
```

3. **Test Project Data**
Create `packages/vm-server/test-data/simple-game.json` with a minimal Scratch project for testing.

---

## Unit Testing

### 1. VMInstance Tests

**File**: `packages/vm-server/src/__tests__/VMInstance.test.js`

```javascript
const VMInstance = require('../VMInstance');
const testProject = require('../../test-data/simple-game.json');

describe('VMInstance', () => {
    let vmInstance;

    beforeEach(() => {
        vmInstance = new VMInstance(
            'test-room-123',
            testProject,
            ['user1', 'user2']
        );
    });

    afterEach(async () => {
        await vmInstance.destroy();
    });

    test('should initialize with correct room ID', () => {
        expect(vmInstance.roomId).toBe('test-room-123');
        expect(vmInstance.players).toEqual(['user1', 'user2']);
    });

    test('should load project data', async () => {
        await vmInstance.start();
        expect(vmInstance.vm.runtime.targets.length).toBeGreaterThan(0);
    });

    test('should inject keyboard input', async () => {
        await vmInstance.start();
        const spy = jest.spyOn(vmInstance.vm.runtime.ioDevices.keyboard, 'postData');

        vmInstance.injectKeyboard('space', true);

        expect(spy).toHaveBeenCalledWith({
            key: 'space',
            isDown: true
        });
    });

    test('should extract game state', async () => {
        await vmInstance.start();
        const state = vmInstance.getState();

        expect(state).toHaveProperty('sprites');
        expect(state).toHaveProperty('variables');
        expect(state).toHaveProperty('timestamp');
    });

    test('should emit winner_reported event', (done) => {
        vmInstance.on('winner_reported', (data) => {
            expect(data.userId).toBe('user1');
            done();
        });

        // Simulate winner report from VM
        vmInstance.vm.runtime.emit('REPORT_WINNER', {
            userId: 'user1',
            roomId: 'test-room-123'
        });
    });

    test('should emit game_ended event', (done) => {
        vmInstance.on('game_ended', (data) => {
            expect(data.roomId).toBe('test-room-123');
            done();
        });

        vmInstance.vm.runtime.emit('GAME_ENDED', {
            roomId: 'test-room-123'
        });
    });

    test('should finalize only when both winner and ended', (done) => {
        let finalizeCount = 0;

        vmInstance.on('finalize', () => {
            finalizeCount++;
            expect(finalizeCount).toBe(1);
            done();
        });

        // Report winner first
        vmInstance.vm.runtime.emit('REPORT_WINNER', {
            userId: 'user1',
            roomId: 'test-room-123'
        });

        // Should not finalize yet
        expect(finalizeCount).toBe(0);

        // Now end game
        vmInstance.vm.runtime.emit('GAME_ENDED', {
            roomId: 'test-room-123'
        });

        // Should finalize exactly once
    });

    test('should not finalize twice', (done) => {
        let finalizeCount = 0;

        vmInstance.on('finalize', () => {
            finalizeCount++;
        });

        // Report winner and end game
        vmInstance.vm.runtime.emit('REPORT_WINNER', {
            userId: 'user1',
            roomId: 'test-room-123'
        });
        vmInstance.vm.runtime.emit('GAME_ENDED', {
            roomId: 'test-room-123'
        });

        setTimeout(() => {
            expect(finalizeCount).toBe(1);
            done();
        }, 100);
    });
});
```

**Run tests:**
```bash
cd packages/vm-server
npm test -- VMInstance.test.js
```

### 2. GameInstanceManager Tests

**File**: `packages/vm-server/src/__tests__/GameInstanceManager.test.js`

```javascript
const GameInstanceManager = require('../GameInstanceManager');
const testProject = require('../../test-data/simple-game.json');

describe('GameInstanceManager', () => {
    let manager;

    beforeEach(() => {
        manager = new GameInstanceManager();
    });

    afterEach(() => {
        manager.shutdown();
    });

    test('should start game when capacity available', async () => {
        const result = await manager.startGame(
            'room-1',
            testProject,
            ['user1', 'user2']
        );

        expect(result.status).toBe('started');
        expect(manager.runningGames.has('room-1')).toBe(true);
    });

    test('should queue game when at capacity', async () => {
        // Fill capacity (assuming MAX_CONCURRENT_GAMES = 2 for testing)
        manager.maxConcurrentGames = 2;

        await manager.startGame('room-1', testProject, ['user1', 'user2']);
        await manager.startGame('room-2', testProject, ['user3', 'user4']);

        // Third game should queue
        const result = await manager.startGame('room-3', testProject, ['user5', 'user6']);

        expect(result.status).toBe('queued');
        expect(result.position).toBe(1);
    });

    test('should process queue when game ends', async () => {
        manager.maxConcurrentGames = 1;

        await manager.startGame('room-1', testProject, ['user1', 'user2']);
        await manager.startGame('room-2', testProject, ['user3', 'user4']);

        // End first game
        await manager.endGame('room-1');

        // Wait for queue processing
        await new Promise(resolve => setTimeout(resolve, 100));

        // Second game should now be running
        expect(manager.runningGames.has('room-2')).toBe(true);
    });

    test('should handle multiple winners', async () => {
        const result = await manager.startGame(
            'room-multi',
            testProject,
            ['user1', 'user2', 'user3']
        );

        const vm = result.vm;

        // Simulate multiple winners
        vm.vm.runtime.emit('REPORT_WINNER', {
            userId: ['user1', 'user2'],
            roomId: 'room-multi'
        });

        expect(vm.winner).toEqual(['user1', 'user2']);
    });

    test('should handle no winners', async () => {
        const result = await manager.startGame(
            'room-no-winner',
            testProject,
            ['user1', 'user2']
        );

        const vm = result.vm;

        // Simulate no winners
        vm.vm.runtime.emit('REPORT_WINNER', {
            userId: [],
            roomId: 'room-no-winner'
        });

        expect(vm.winner).toEqual([]);
    });

    test('should get correct statistics', async () => {
        await manager.startGame('room-1', testProject, ['user1', 'user2']);
        await manager.startGame('room-2', testProject, ['user3', 'user4']);

        const stats = manager.getStats();

        expect(stats.activeGames).toBe(2);
        expect(stats.totalGamesStarted).toBe(2);
    });
});
```

### 3. StateSerializer Tests

**File**: `packages/vm-server/src/__tests__/StateSerializer.test.js`

```javascript
const StateSerializer = require('../StateSerializer');

describe('StateSerializer', () => {
    let serializer;

    beforeEach(() => {
        serializer = new StateSerializer();
    });

    test('should return full state on first call', () => {
        const state = {
            sprites: {
                Cat: { x: 0, y: 0, direction: 90 }
            },
            variables: { score: 0 },
            timestamp: Date.now()
        };

        const result = serializer.getDelta(state, 'room-1');

        expect(result.type).toBe('full');
        expect(result.sprites.Cat).toEqual({ x: 0, y: 0, direction: 90 });
    });

    test('should return delta on subsequent calls', () => {
        const state1 = {
            sprites: {
                Cat: { x: 0, y: 0, direction: 90 }
            },
            variables: { score: 0 },
            timestamp: Date.now()
        };

        serializer.getDelta(state1, 'room-1');

        const state2 = {
            sprites: {
                Cat: { x: 10, y: 0, direction: 90 }
            },
            variables: { score: 0 },
            timestamp: Date.now()
        };

        const result = serializer.getDelta(state2, 'room-1');

        expect(result.type).toBe('delta');
        expect(result.sprites.Cat).toEqual({ x: 10 }); // Only changed value
    });

    test('should return null when no changes', () => {
        const state = {
            sprites: {
                Cat: { x: 0, y: 0, direction: 90 }
            },
            variables: { score: 0 },
            timestamp: Date.now()
        };

        serializer.getDelta(state, 'room-1');

        const result = serializer.getDelta(state, 'room-1');

        expect(result).toBeNull();
    });

    test('should handle multiple rooms independently', () => {
        const state1 = {
            sprites: { Cat: { x: 0 } },
            variables: {},
            timestamp: Date.now()
        };

        const state2 = {
            sprites: { Cat: { x: 10 } },
            variables: {},
            timestamp: Date.now()
        };

        serializer.getDelta(state1, 'room-1');
        serializer.getDelta(state2, 'room-2');

        expect(serializer.previousStates.size).toBe(2);
    });
});
```

### 4. InputInjector Tests

**File**: `packages/vm-server/src/__tests__/InputInjector.test.js`

```javascript
const InputInjector = require('../InputInjector');

describe('InputInjector', () => {
    let injector;

    beforeEach(() => {
        injector = new InputInjector();
    });

    test('should allow inputs within rate limit', () => {
        const result = injector.checkRateLimit('user1', 'room1');
        expect(result).toBe(true);
    });

    test('should reject inputs exceeding rate limit', () => {
        // Simulate 101 inputs in quick succession
        for (let i = 0; i < 101; i++) {
            injector.checkRateLimit('user1', 'room1');
        }

        const result = injector.checkRateLimit('user1', 'room1');
        expect(result).toBe(false);
    });

    test('should reset rate limit after time window', (done) => {
        // Fill rate limit
        for (let i = 0; i < 100; i++) {
            injector.checkRateLimit('user1', 'room1');
        }

        // Should be blocked
        expect(injector.checkRateLimit('user1', 'room1')).toBe(false);

        // Wait for reset (1 second window)
        setTimeout(() => {
            expect(injector.checkRateLimit('user1', 'room1')).toBe(true);
            done();
        }, 1100);
    });

    test('should track users independently', () => {
        // Fill user1's limit
        for (let i = 0; i < 100; i++) {
            injector.checkRateLimit('user1', 'room1');
        }

        // user2 should still be allowed
        expect(injector.checkRateLimit('user2', 'room1')).toBe(true);
    });
});
```

**Run all unit tests:**
```bash
cd packages/vm-server
npm test
```

---

## Integration Testing

### 1. Full Game Flow Test

**File**: `packages/vm-server/src/__tests__/integration/full-game.test.js`

```javascript
const request = require('supertest');
const WebSocket = require('ws');
const app = require('../../index');
const testProject = require('../../../test-data/simple-game.json');

describe('Full Game Flow Integration', () => {
    let server;
    let wsClient1;
    let wsClient2;

    beforeAll((done) => {
        server = app.listen(3002, done);
    });

    afterAll((done) => {
        server.close(done);
    });

    test('complete game lifecycle', async () => {
        // 1. Backend requests slot
        const slotResponse = await request(server)
            .post('/api/request-slot')
            .set('Authorization', 'Bearer test-token')
            .send({
                roomId: 'integration-room-1',
                projectId: 'test-project',
                projectData: testProject,
                players: ['user1', 'user2']
            });

        expect(slotResponse.status).toBe(200);
        expect(slotResponse.body.success).toBe(true);
        expect(slotResponse.body.data.status).toBe('ready');

        const wsUrl = slotResponse.body.data.wsUrl;

        // 2. Players connect via WebSocket
        wsClient1 = new WebSocket(`${wsUrl}?roomId=integration-room-1&userId=user1`);
        wsClient2 = new WebSocket(`${wsUrl}?roomId=integration-room-1&userId=user2`);

        await Promise.all([
            new Promise(resolve => wsClient1.on('open', resolve)),
            new Promise(resolve => wsClient2.on('open', resolve))
        ]);

        // 3. Receive initial state
        const initialState = await new Promise((resolve) => {
            wsClient1.once('message', (data) => {
                resolve(JSON.parse(data));
            });
        });

        expect(initialState.type).toBe('full');
        expect(initialState.sprites).toBeDefined();

        // 4. Send player inputs
        wsClient1.send(JSON.stringify({
            type: 'keyboard',
            action: 'keydown',
            key: 'space'
        }));

        // 5. Receive state updates
        let stateUpdateReceived = false;
        wsClient2.once('message', (data) => {
            const update = JSON.parse(data);
            if (update.type === 'delta' || update.type === 'full') {
                stateUpdateReceived = true;
            }
        });

        await new Promise(resolve => setTimeout(resolve, 100));
        expect(stateUpdateReceived).toBe(true);

        // 6. Cleanup
        wsClient1.close();
        wsClient2.close();
    }, 10000);
});
```

### 2. Backend Integration Test

**File**: `packages/api/src/__tests__/integration/vm-server.test.ts`

```typescript
import request from 'supertest';
import app from '../../app';
import vmServerClient from '../../lib/vm-server-client';

describe('Backend VM Server Integration', () => {
    beforeAll(() => {
        // Ensure VM server is running
        process.env.VM_SERVER_URL = 'http://localhost:3001';
        process.env.VM_SERVER_TOKEN = 'test-token';
    });

    test('should create room and request VM slot', async () => {
        const response = await request(app)
            .post('/api/game/create-room')
            .set('Authorization', 'Bearer user-token')
            .send({
                projectId: 'test-project-123',
                players: ['user1', 'user2'],
                betAmount: 10
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.roomId).toBeDefined();
        expect(response.body.data.status).toMatch(/ready|queued/);
    });

    test('should receive winner report from VM server', async () => {
        // Simulate VM server calling report-result
        const response = await request(app)
            .post('/api/game/report-result')
            .set('Authorization', 'Bearer test-token')
            .set('X-VM-Server', 'true')
            .send({
                roomId: 'test-room-123',
                winnerUserId: 'user1',
                source: 'vm_server',
                metadata: {
                    duration: 120
                }
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.transactionHash).toBeDefined();
    });

    test('should reject duplicate finalization', async () => {
        const roomId = 'duplicate-test-room';

        // First call should succeed
        const response1 = await request(app)
            .post('/api/game/report-result')
            .set('Authorization', 'Bearer test-token')
            .set('X-VM-Server', 'true')
            .send({
                roomId,
                winnerUserId: 'user1',
                source: 'vm_server'
            });

        expect(response1.status).toBe(200);

        // Second call should fail
        const response2 = await request(app)
            .post('/api/game/report-result')
            .set('Authorization', 'Bearer test-token')
            .set('X-VM-Server', 'true')
            .send({
                roomId,
                winnerUserId: 'user1',
                source: 'vm_server'
            });

        expect(response2.status).toBe(400);
        expect(response2.body.error).toContain('already finalized');
    });

    test('should validate winner is in room', async () => {
        const response = await request(app)
            .post('/api/game/report-result')
            .set('Authorization', 'Bearer test-token')
            .set('X-VM-Server', 'true')
            .send({
                roomId: 'test-room-123',
                winnerUserId: 'user999', // Not in room
                source: 'vm_server'
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('not a player');
    });
});
```

**Run integration tests:**
```bash
# Start VM server in test mode
cd packages/vm-server
npm run test:start &

# Run integration tests
cd packages/api
npm run test:integration
```

---

## Load Testing

### 1. Capacity Test with Artillery

**File**: `packages/vm-server/test/load/capacity-test.yml`

```yaml
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 5  # 5 games per second
      name: "Ramp up"
    - duration: 120
      arrivalRate: 10  # 10 games per second
      name: "Sustained load"
    - duration: 60
      arrivalRate: 2
      name: "Ramp down"
  defaults:
    headers:
      Authorization: "Bearer test-token"

scenarios:
  - name: "Create game room"
    flow:
      - post:
          url: "/api/request-slot"
          json:
            roomId: "load-test-{{ $randomString() }}"
            projectId: "test-project"
            projectData: "{{ $processEnvironment.TEST_PROJECT_DATA }}"
            players: ["user1", "user2"]
      - think: 2
```

**Run capacity test:**
```bash
cd packages/vm-server
export TEST_PROJECT_DATA=$(cat test-data/simple-game.json)
artillery run test/load/capacity-test.yml
```

**Expected results:**
- 200 concurrent games should maintain <100ms response time
- Queue should activate above capacity
- Memory usage should stay below 28GB

### 2. WebSocket Load Test

**File**: `packages/vm-server/test/load/websocket-load.js`

```javascript
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

async function loadTestWebSocket(concurrentGames, duration) {
    const results = {
        connected: 0,
        failed: 0,
        messagesReceived: 0,
        avgLatency: 0
    };

    const latencies = [];
    const connections = [];

    // Create concurrent game connections
    for (let i = 0; i < concurrentGames; i++) {
        const roomId = `load-test-${i}`;

        // Create room first
        const response = await fetch('http://localhost:3001/api/request-slot', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roomId,
                projectId: 'test-project',
                projectData: require('../test-data/simple-game.json'),
                players: ['user1', 'user2']
            })
        });

        const data = await response.json();

        if (data.success && data.data.status === 'ready') {
            const ws = new WebSocket(`${data.data.wsUrl}?roomId=${roomId}&userId=user1`);

            ws.on('open', () => {
                results.connected++;
            });

            ws.on('error', () => {
                results.failed++;
            });

            ws.on('message', (data) => {
                const received = Date.now();
                const msg = JSON.parse(data);
                const latency = received - msg.timestamp;
                latencies.push(latency);
                results.messagesReceived++;
            });

            connections.push(ws);
        }
    }

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, duration));

    // Calculate results
    results.avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    // Cleanup
    connections.forEach(ws => ws.close());

    return results;
}

// Run test
loadTestWebSocket(50, 60000).then(results => {
    console.log('Load Test Results:');
    console.log(`Connected: ${results.connected}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Messages Received: ${results.messagesReceived}`);
    console.log(`Average Latency: ${results.avgLatency.toFixed(2)}ms`);
});
```

**Run WebSocket load test:**
```bash
node packages/vm-server/test/load/websocket-load.js
```

### 3. Benchmark with Autocannon

```bash
# Install autocannon
npm install -g autocannon

# Benchmark slot request endpoint
autocannon -c 100 -d 30 -m POST \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -b '{"roomId":"bench-test","projectId":"test","projectData":{},"players":["user1"]}' \
  http://localhost:3001/api/request-slot

# Benchmark status endpoint
autocannon -c 100 -d 30 http://localhost:3001/api/status
```

**Expected benchmarks:**
- Slot request: >500 req/sec
- Status endpoint: >2000 req/sec
- WebSocket connections: >1000 concurrent

---

## Security Testing

### 1. Authentication Tests

```bash
# Test missing token
curl -X POST http://localhost:3001/api/request-slot \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test","projectId":"test","projectData":{},"players":[]}'
# Expected: 401 Unauthorized

# Test invalid token
curl -X POST http://localhost:3001/api/request-slot \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test","projectId":"test","projectData":{},"players":[]}'
# Expected: 401 Unauthorized

# Test valid token
curl -X POST http://localhost:3001/api/request-slot \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test","projectId":"test","projectData":{},"players":[]}'
# Expected: 200 OK
```

### 2. Rate Limiting Tests

```javascript
// Test input rate limiting
const ws = new WebSocket('ws://localhost:3001/game?roomId=test&userId=user1');

ws.on('open', () => {
    // Send 150 inputs rapidly (exceeds 100/sec limit)
    for (let i = 0; i < 150; i++) {
        ws.send(JSON.stringify({
            type: 'keyboard',
            action: 'keydown',
            key: 'space'
        }));
    }
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'error' && msg.error === 'rate_limit_exceeded') {
        console.log('✅ Rate limiting working correctly');
    }
});
```

### 3. Injection Attack Tests

```bash
# Test SQL injection in roomId
curl -X POST http://localhost:3001/api/request-slot \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"'; DROP TABLE games; --","projectId":"test","projectData":{},"players":[]}'
# Expected: Should be sanitized, no SQL executed

# Test XSS in player names
curl -X POST http://localhost:3001/api/request-slot \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test","projectId":"test","projectData":{},"players":["<script>alert(1)</script>"]}'
# Expected: Should be escaped

# Test code injection in project data
curl -X POST http://localhost:3001/api/request-slot \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test","projectId":"test","projectData":{"eval":"console.log(process.env)"},"players":[]}'
# Expected: Should not execute arbitrary code
```

### 4. VM Server Authentication Test

```bash
# Test missing X-VM-Server header
curl -X POST http://localhost:3000/api/game/report-result \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test","winnerUserId":"user1","source":"vm_server"}'
# Expected: 401 Unauthorized

# Test with correct headers
curl -X POST http://localhost:3000/api/game/report-result \
  -H "Authorization: Bearer test-token" \
  -H "X-VM-Server: true" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test","winnerUserId":"user1","source":"vm_server"}'
# Expected: Should process (if room exists)
```

### 5. Security Audit

```bash
# Run npm audit
cd packages/vm-server
npm audit

cd packages/api
npm audit

# Run Snyk scan
snyk test packages/vm-server
snyk test packages/api

# Run ESLint security plugin
npm install eslint-plugin-security --save-dev
eslint --plugin security packages/vm-server/src
```

---

## End-to-End Testing

### Complete User Journey Test

**File**: `packages/vm-server/test/e2e/complete-journey.test.js`

```javascript
const request = require('supertest');
const WebSocket = require('ws');
const backendApp = require('../../../api/src/app');
const vmServerApp = require('../../src/index');

describe('Complete E2E User Journey', () => {
    let backend;
    let vmServer;

    beforeAll((done) => {
        backend = backendApp.listen(3000, () => {
            vmServer = vmServerApp.listen(3001, done);
        });
    });

    afterAll((done) => {
        backend.close(() => {
            vmServer.close(done);
        });
    });

    test('full betting game lifecycle', async () => {
        console.log('\n🎮 Starting E2E Test: Full Betting Game\n');

        // Step 1: User creates room via backend
        console.log('1️⃣  User creates game room...');
        const createRoomRes = await request(backend)
            .post('/api/game/create-room')
            .set('Authorization', 'Bearer user-token')
            .send({
                projectId: 'e2e-test-project',
                players: ['alice', 'bob'],
                betAmount: 10
            });

        expect(createRoomRes.status).toBe(200);
        const { roomId, wsUrl, status } = createRoomRes.body.data;
        console.log(`   ✅ Room created: ${roomId}`);
        console.log(`   Status: ${status}`);

        // Step 2: Players connect to WebSocket
        console.log('\n2️⃣  Players connecting to game...');
        const alice = new WebSocket(`${wsUrl}?roomId=${roomId}&userId=alice`);
        const bob = new WebSocket(`${wsUrl}?roomId=${roomId}&userId=bob`);

        await Promise.all([
            new Promise(resolve => alice.on('open', resolve)),
            new Promise(resolve => bob.on('open', resolve))
        ]);
        console.log('   ✅ Alice connected');
        console.log('   ✅ Bob connected');

        // Step 3: Receive initial game state
        console.log('\n3️⃣  Receiving initial game state...');
        const aliceState = await new Promise(resolve => {
            alice.once('message', data => resolve(JSON.parse(data)));
        });
        expect(aliceState.type).toBe('full');
        console.log('   ✅ Alice received initial state');

        // Step 4: Players send inputs
        console.log('\n4️⃣  Players sending game inputs...');
        alice.send(JSON.stringify({
            type: 'keyboard',
            action: 'keydown',
            key: 'space'
        }));
        bob.send(JSON.stringify({
            type: 'keyboard',
            action: 'keydown',
            key: 'right'
        }));
        console.log('   ✅ Inputs sent');

        // Step 5: Receive state updates
        console.log('\n5️⃣  Receiving state updates...');
        let updateCount = 0;
        const updatePromise = new Promise(resolve => {
            alice.on('message', data => {
                const msg = JSON.parse(data);
                if (msg.type === 'delta' || msg.type === 'full') {
                    updateCount++;
                    if (updateCount >= 5) resolve();
                }
            });
        });

        await Promise.race([
            updatePromise,
            new Promise(resolve => setTimeout(resolve, 2000))
        ]);
        console.log(`   ✅ Received ${updateCount} state updates`);

        // Step 6: Simulate game ending with winner
        console.log('\n6️⃣  Game ending with winner...');
        // Trigger REPORT_WINNER and GAME_ENDED from VM
        // (This would normally happen via Scratch blocks)

        // Step 7: Backend receives result callback
        console.log('\n7️⃣  Waiting for result callback...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 8: Check final room status
        console.log('\n8️⃣  Checking final room status...');
        const roomStatusRes = await request(backend)
            .get(`/api/game/room/${roomId}`)
            .set('Authorization', 'Bearer user-token');

        expect(roomStatusRes.status).toBe(200);
        console.log(`   Status: ${roomStatusRes.body.data.status}`);
        console.log(`   Finalized: ${roomStatusRes.body.data.finalized}`);

        // Cleanup
        alice.close();
        bob.close();

        console.log('\n✅ E2E Test Complete\n');
    }, 30000);
});
```

**Run E2E test:**
```bash
npm run test:e2e
```

---

## Automated Test Scripts

### Daily Test Suite

**File**: `scripts/run-daily-tests.sh`

```bash
#!/bin/bash

echo "🚀 Running Daily Test Suite"
echo "=============================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

FAILED=0

# 1. Unit Tests
echo -e "\n📦 Running Unit Tests..."
cd packages/vm-server
npm test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    FAILED=1
fi

# 2. Integration Tests
echo -e "\n🔗 Running Integration Tests..."
cd ../api
npm run test:integration
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Integration tests passed${NC}"
else
    echo -e "${RED}❌ Integration tests failed${NC}"
    FAILED=1
fi

# 3. Security Audit
echo -e "\n🔒 Running Security Audit..."
npm audit --audit-level=moderate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Security audit passed${NC}"
else
    echo -e "${RED}❌ Security vulnerabilities found${NC}"
    FAILED=1
fi

# 4. Load Test
echo -e "\n⚡ Running Load Test (30s)..."
cd ../vm-server
artillery run test/load/capacity-test.yml --duration 30
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Load test passed${NC}"
else
    echo -e "${RED}❌ Load test failed${NC}"
    FAILED=1
fi

# 5. E2E Test
echo -e "\n🎮 Running E2E Test..."
npm run test:e2e
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ E2E test passed${NC}"
else
    echo -e "${RED}❌ E2E test failed${NC}"
    FAILED=1
fi

echo -e "\n=============================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
```

**Make executable and run:**
```bash
chmod +x scripts/run-daily-tests.sh
./scripts/run-daily-tests.sh
```

### Pre-Deployment Test

**File**: `scripts/pre-deploy-check.sh`

```bash
#!/bin/bash

echo "🚢 Pre-Deployment Checklist"
echo "=============================="

CHECKS_PASSED=0
CHECKS_TOTAL=0

check() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo "❌ $2"
    fi
}

# Check 1: All tests pass
npm test > /dev/null 2>&1
check $? "All unit tests pass"

# Check 2: No security vulnerabilities
npm audit --audit-level=high > /dev/null 2>&1
check $? "No high security vulnerabilities"

# Check 3: Environment variables set
[ -n "$VM_SERVER_TOKEN" ]
check $? "VM_SERVER_TOKEN is set"

[ -n "$BACKEND_URL" ]
check $? "BACKEND_URL is set"

# Check 4: Backend is reachable
curl -s "$BACKEND_URL/api/health" > /dev/null
check $? "Backend is reachable"

# Check 5: Database connection works
npm run db:check > /dev/null 2>&1
check $? "Database connection works"

# Check 6: Capacity test passes
artillery run test/load/capacity-test.yml --duration 10 > /dev/null 2>&1
check $? "Capacity test passes"

echo "=============================="
echo "$CHECKS_PASSED/$CHECKS_TOTAL checks passed"

if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo "✅ Ready for deployment"
    exit 0
else
    echo "❌ Fix issues before deploying"
    exit 1
fi
```

---

## Monitoring and Validation

### 1. Performance Monitoring

```bash
# Monitor CPU and memory during load test
npx clinic doctor -- node src/index.js

# Profile for bottlenecks
npx clinic flame -- node src/index.js

# Check for memory leaks
npx clinic bubbleprof -- node src/index.js
```

### 2. Log Analysis

```bash
# Monitor logs in real-time
tail -f packages/vm-server/logs/combined.log

# Search for errors
grep "ERROR" packages/vm-server/logs/combined.log

# Count games by status
grep "Game finalized" packages/vm-server/logs/combined.log | wc -l
grep "Game failed" packages/vm-server/logs/combined.log | wc -l
```

### 3. Metrics Collection

**File**: `packages/vm-server/src/metrics.js`

```javascript
class Metrics {
    constructor() {
        this.data = {
            gamesStarted: 0,
            gamesCompleted: 0,
            gamesFailed: 0,
            totalInputs: 0,
            totalStatesBroadcast: 0,
            avgGameDuration: 0
        };
    }

    recordGameStart() {
        this.data.gamesStarted++;
    }

    recordGameComplete(duration) {
        this.data.gamesCompleted++;
        this.data.avgGameDuration =
            (this.data.avgGameDuration * (this.data.gamesCompleted - 1) + duration)
            / this.data.gamesCompleted;
    }

    getSnapshot() {
        return {
            ...this.data,
            timestamp: Date.now()
        };
    }
}

module.exports = new Metrics();
```

### 4. Health Check Validation

```bash
# Automated health check script
while true; do
    STATUS=$(curl -s http://localhost:3001/api/health | jq -r '.status')
    if [ "$STATUS" != "ok" ]; then
        echo "⚠️  ALERT: VM Server unhealthy"
        # Send alert notification
    fi
    sleep 60
done
```

---

## Test Checklist

Before deploying to production, ensure:

- [ ] All unit tests pass (100% for critical components)
- [ ] Integration tests pass
- [ ] Load test handles expected capacity (200 concurrent games)
- [ ] Security tests pass (no auth bypass, no injection)
- [ ] E2E test completes successfully
- [ ] No security vulnerabilities (npm audit)
- [ ] Performance benchmarks meet targets
- [ ] Memory usage stays below 28GB under load
- [ ] Latency stays below 100ms average
- [ ] Queue system activates correctly at capacity
- [ ] Winner determination is tamper-proof
- [ ] Duplicate finalization is prevented
- [ ] Rate limiting works correctly
- [ ] WebSocket reconnection works
- [ ] Graceful shutdown works
- [ ] Logs are properly formatted and stored

---

## Troubleshooting Common Test Failures

### Test times out
- Increase timeout in test config
- Check if services are running
- Verify network connectivity

### WebSocket connection fails
- Check if VM server is running
- Verify room was created first
- Check authentication token

### Load test fails
- Reduce concurrent connections
- Check server resources (CPU/memory)
- Verify test data is valid

### Integration test fails
- Ensure all services are started
- Check environment variables
- Verify database is seeded

### Security test passes incorrectly
- Verify test is actually checking the vulnerability
- Check if mock/test mode is bypassing auth
- Review test assertions

---

## Continuous Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd packages/vm-server && npm install
          cd ../api && npm install

      - name: Run unit tests
        run: |
          cd packages/vm-server && npm test

      - name: Run security audit
        run: |
          cd packages/vm-server && npm audit --audit-level=moderate

      - name: Run integration tests
        run: |
          cd packages/api && npm run test:integration
```

---

## Summary

This testing guide provides comprehensive coverage of:
- **Unit tests** for individual components
- **Integration tests** for system interactions
- **Load tests** for capacity validation
- **Security tests** for vulnerability checking
- **E2E tests** for complete user journeys
- **Monitoring** for production validation

All tests should be run before deployment and integrated into your CI/CD pipeline.
