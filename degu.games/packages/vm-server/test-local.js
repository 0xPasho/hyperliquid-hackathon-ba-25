/**
 * Local Testing Script
 *
 * Quick test of VM server functionality
 * Run with: node test-local.js
 */

const fetch = require('node-fetch');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const VM_SERVER_URL = process.env.VM_SERVER_URL || 'http://localhost:3001';
const VM_SERVER_TOKEN = process.env.VM_SERVER_TOKEN || 'local-dev-token-12345';

async function testGameFlow() {
    console.log('🎮 Testing Local VM Server');
    console.log('===========================\n');

    try {
        // Step 1: Health Check
        console.log('1️⃣  Health Check...');
        const healthRes = await fetch(`${VM_SERVER_URL}/api/health`);
        const health = await healthRes.json();

        if (health.success) {
            console.log('   ✅ VM Server is healthy\n');
        } else {
            console.error('   ❌ VM Server is unhealthy');
            return;
        }

        // Step 2: Load test project
        console.log('2️⃣  Loading test project...');
        const projectPath = path.join(__dirname, 'test-data', 'simple-game.json');

        if (!fs.existsSync(projectPath)) {
            console.error('   ❌ Test project not found at:', projectPath);
            console.log('   Create test-data/simple-game.json first');
            return;
        }

        const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
        console.log('   ✅ Test project loaded\n');

        // Step 3: Request game slot
        console.log('3️⃣  Requesting game slot...');
        const roomId = `test-room-${Date.now()}`;

        const slotRes = await fetch(`${VM_SERVER_URL}/api/request-slot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VM_SERVER_TOKEN}`
            },
            body: JSON.stringify({
                roomId: roomId,
                projectId: 'test-project',
                projectData: projectData,
                players: ['alice', 'bob']
            })
        });

        const slotResult = await slotRes.json();

        if (!slotResult.success) {
            console.error('   ❌ Failed to request slot:', slotResult.error);
            return;
        }

        console.log('   ✅ Slot requested successfully');
        console.log('   Room ID:', roomId);
        console.log('   Status:', slotResult.data.status);

        if (slotResult.data.queuePosition) {
            console.log('   Queue Position:', slotResult.data.queuePosition);
        }
        console.log();

        // Step 4: Connect via WebSocket
        console.log('4️⃣  Connecting to WebSocket...');
        const wsUrl = slotResult.data.wsUrl || VM_SERVER_URL.replace('http', 'ws') + '/game';
        const ws = new WebSocket(`${wsUrl}?roomId=${roomId}&userId=alice`);

        let stateReceived = false;
        let inputSent = false;

        ws.on('open', () => {
            console.log('   ✅ WebSocket connected\n');

            // Step 5: Send input
            console.log('5️⃣  Sending keyboard input (space key)...');
            ws.send(JSON.stringify({
                type: 'keyboard',
                action: 'keydown',
                key: 'space'
            }));
            inputSent = true;
            console.log('   ✅ Input sent\n');
        });

        ws.on('message', (data) => {
            if (!stateReceived) {
                console.log('6️⃣  Receiving state updates...');
                stateReceived = true;
            }

            const message = JSON.parse(data);

            if (message.type === 'full') {
                console.log('   ✅ Full state received');
                console.log('   Sprites:', Object.keys(message.sprites || {}).join(', '));
                console.log('   Variables:', Object.keys(message.variables || {}).join(', '));
            } else if (message.type === 'delta') {
                console.log('   📊 Delta update received');
            } else if (message.type === 'error') {
                console.error('   ❌ Error:', message.error);
            }
        });

        ws.on('error', (error) => {
            console.error('   ❌ WebSocket error:', error.message);
        });

        ws.on('close', () => {
            console.log('\n🔌 WebSocket closed');
        });

        // Keep connection alive for 5 seconds to receive updates
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Cleanup
        console.log('\n7️⃣  Cleaning up...');
        ws.close();

        // Check final status
        const statusRes = await fetch(`${VM_SERVER_URL}/api/status`);
        const status = await statusRes.json();

        if (status.success) {
            console.log('   ✅ Cleanup complete');
            console.log('\n📊 Server Status:');
            console.log('   Active Games:', status.data.capacity.activeGames);
            console.log('   Queue Length:', status.data.capacity.queueLength);
            console.log('   Games Started:', status.data.stats.totalGamesStarted);
        }

        console.log('\n✅ Test Complete!\n');
        console.log('===========================');
        console.log('All systems operational ✨');
        console.log('===========================\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        console.error('\nMake sure VM server is running:');
        console.error('  cd packages/vm-server');
        console.error('  npm run dev\n');
        process.exit(1);
    }
}

// Run test
testGameFlow();
