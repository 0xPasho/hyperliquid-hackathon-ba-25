# Scratch GUI - VM Server Integration Guide

This document explains how to integrate the Scratch GUI with the VM server for server-authoritative gameplay.

## Overview

When using server-side VM execution:
1. **Frontend (Scratch GUI)** sends inputs only (no game logic)
2. **VM Server** runs the game logic
3. **Frontend** receives and renders state from server

## Architecture Changes

### Traditional Scratch (Client-Side):
```
Browser → Runs VM → Renders output
```

### Server-Authoritative Scratch:
```
Browser → Sends inputs → VM Server → Runs VM → Broadcasts state → Browser renders
```

## Implementation Steps

### Step 1: Create WebSocket Client

Create `packages/scratch-gui/src/lib/vm-server-client.js`:

```javascript
/**
 * VM Server WebSocket Client
 * Handles connection to VM server for server-authoritative gameplay
 */

class VMServerClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.roomId = null;
        this.userId = null;
        this.onStateUpdate = null;
        this.onGameEnded = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    /**
     * Connect to VM server
     * @param {string} wsUrl - WebSocket URL from backend
     * @param {string} roomId - Room ID
     * @param {string} userId - User ID
     * @param {object} callbacks - Event callbacks
     */
    connect(wsUrl, roomId, userId, callbacks = {}) {
        this.roomId = roomId;
        this.userId = userId;
        this.onStateUpdate = callbacks.onStateUpdate;
        this.onGameEnded = callbacks.onGameEnded;
        this.onConnected = callbacks.onConnected;
        this.onDisconnected = callbacks.onDisconnected;

        const url = `${wsUrl}?roomId=${roomId}&userId=${userId}`;

        console.log('[VMServer] Connecting to:', url);

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('[VMServer] Connected');
            this.connected = true;
            this.reconnectAttempts = 0;

            if (this.onConnected) {
                this.onConnected();
            }
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
            console.error('[VMServer] Error:', error);
        };

        this.ws.onclose = (event) => {
            console.log('[VMServer] Disconnected:', event.code, event.reason);
            this.connected = false;

            if (this.onDisconnected) {
                this.onDisconnected(event.code, event.reason);
            }

            // Attempt reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`[VMServer] Reconnecting... (attempt ${this.reconnectAttempts})`);

                setTimeout(() => {
                    this.connect(wsUrl, roomId, userId, {
                        onStateUpdate: this.onStateUpdate,
                        onGameEnded: this.onGameEnded,
                        onConnected: this.onConnected,
                        onDisconnected: this.onDisconnected
                    });
                }, 1000 * this.reconnectAttempts); // Exponential backoff
            }
        };
    }

    /**
     * Handle incoming message from server
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'connected':
                    console.log('[VMServer] Welcome message:', message);
                    break;

                case 'full':
                case 'delta':
                    // Game state update
                    if (this.onStateUpdate) {
                        this.onStateUpdate(message);
                    }
                    break;

                case 'game_ended':
                    // Game finished
                    console.log('[VMServer] Game ended:', message);
                    if (this.onGameEnded) {
                        this.onGameEnded(message);
                    }
                    break;

                case 'game_starting':
                    console.log('[VMServer] Game starting from queue');
                    break;

                default:
                    console.warn('[VMServer] Unknown message type:', message.type);
            }

        } catch (error) {
            console.error('[VMServer] Error parsing message:', error);
        }
    }

    /**
     * Send keyboard input to server
     * @param {string} key - Key name
     * @param {string} action - 'keydown' or 'keyup'
     */
    sendKeyboardInput(key, action) {
        if (!this.connected) {
            console.warn('[VMServer] Not connected, cannot send input');
            return;
        }

        this.ws.send(JSON.stringify({
            type: 'keyboard',
            action: action,
            key: key,
            timestamp: Date.now()
        }));
    }

    /**
     * Send mouse input to server
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} isDown - Mouse button state
     */
    sendMouseInput(x, y, isDown) {
        if (!this.connected) {
            return;
        }

        this.ws.send(JSON.stringify({
            type: 'mouse',
            x: x,
            y: y,
            isDown: isDown,
            timestamp: Date.now()
        }));
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
        }
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
}

export default VMServerClient;
```

### Step 2: Integrate with Room Context

Modify `packages/scratch-gui/src/lib/room-context.js` (or similar):

```javascript
import VMServerClient from './vm-server-client';

/**
 * Initialize room for server-side gameplay
 */
export async function initializeServerRoom(roomId, userId) {
    // 1. Get room info from backend
    const response = await fetch(`/api/game/room/${roomId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    const { data } = await response.json();

    // 2. Check if VM is ready
    if (data.status !== 'ready') {
        // Show queue UI
        return {
            status: data.status,
            queuePosition: data.queuePosition,
            wsUrl: null
        };
    }

    // 3. Connect to VM server
    const vmClient = new VMServerClient();

    vmClient.connect(data.wsUrl, roomId, userId, {
        onStateUpdate: (state) => {
            // Update local VM to match server state
            updateLocalVMState(state);
        },
        onGameEnded: (result) => {
            // Show game results
            showGameResults(result.winner, result.txHash);
        },
        onConnected: () => {
            console.log('Connected to game server');
            // Start capturing inputs
            startInputCapture(vmClient);
        },
        onDisconnected: (code, reason) => {
            console.log('Disconnected from game server');
            // Show reconnection UI
        }
    });

    return {
        status: 'connected',
        vmClient: vmClient
    };
}
```

### Step 3: Input Capture

Create `packages/scratch-gui/src/lib/input-capture.js`:

```javascript
/**
 * Capture and forward inputs to VM server
 */

export function startInputCapture(vmClient) {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        vmClient.sendKeyboardInput(e.key, 'keydown');
    });

    document.addEventListener('keyup', (e) => {
        vmClient.sendKeyboardInput(e.key, 'keyup');
    });

    // Mouse events on canvas
    const canvas = document.querySelector('canvas');

    if (canvas) {
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            vmClient.sendMouseInput(x, y, true);
        });

        canvas.addEventListener('mouseup', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            vmClient.sendMouseInput(x, y, false);
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // Send mouse position updates (throttled)
            vmClient.sendMouseInput(x, y, false);
        });
    }
}

export function stopInputCapture() {
    // Remove event listeners
    // Implementation depends on your event handling approach
}
```

### Step 4: State Rendering

Create `packages/scratch-gui/src/lib/state-renderer.js`:

```javascript
/**
 * Update local VM state from server
 * This is called when receiving state updates from VM server
 */

export function updateLocalVMState(state) {
    const vm = window.vm; // Or however you access the VM instance

    if (!vm) {
        console.warn('[StateRenderer] VM not available');
        return;
    }

    try {
        if (state.type === 'full') {
            // Full state update - replace everything
            updateFullState(vm, state);
        } else if (state.type === 'delta') {
            // Delta update - only update changes
            updateDeltaState(vm, state);
        }
    } catch (error) {
        console.error('[StateRenderer] Error updating state:', error);
    }
}

function updateFullState(vm, state) {
    const targets = vm.runtime.targets;

    // Update sprites
    targets.forEach((target) => {
        if (target.isStage && state.sprites._stage) {
            // Update stage
            target.currentCostume = state.sprites._stage.backdrop;
        } else if (state.sprites[target.sprite.name]) {
            // Update sprite
            const spriteState = state.sprites[target.sprite.name];
            target.setXY(spriteState.x, spriteState.y);
            target.setDirection(spriteState.direction);
            target.setCostume(spriteState.costume);
            target.setVisible(spriteState.visible);
            target.setSize(spriteState.size);
        }
    });

    // Update variables
    Object.keys(state.variables).forEach(varName => {
        // Find variable and update value
        const stage = vm.runtime.getTargetForStage();
        Object.keys(stage.variables).forEach(varId => {
            const variable = stage.variables[varId];
            if (variable.name === varName) {
                variable.value = state.variables[varName];
            }
        });
    });
}

function updateDeltaState(vm, state) {
    const targets = vm.runtime.targets;

    // Update only changed sprites
    Object.keys(state.sprites).forEach(spriteName => {
        const spriteState = state.sprites[spriteName];

        const target = targets.find(t =>
            (t.isStage && spriteName === '_stage') ||
            (!t.isStage && t.sprite.name === spriteName)
        );

        if (!target) return;

        // Update only provided properties
        if ('x' in spriteState && 'y' in spriteState) {
            target.setXY(spriteState.x, spriteState.y);
        }
        if ('direction' in spriteState) {
            target.setDirection(spriteState.direction);
        }
        if ('costume' in spriteState) {
            target.setCostume(spriteState.costume);
        }
        if ('visible' in spriteState) {
            target.setVisible(spriteState.visible);
        }
        if ('size' in spriteState) {
            target.setSize(spriteState.size);
        }
    });

    // Update changed variables
    Object.keys(state.variables).forEach(varName => {
        const stage = vm.runtime.getTargetForStage();
        Object.keys(stage.variables).forEach(varId => {
            const variable = stage.variables[varId];
            if (variable.name === varName) {
                variable.value = state.variables[varName];
            }
        });
    });
}
```

### Step 5: UI Components

Create React components for server mode:

**ConnectionStatus Component:**
```jsx
import React from 'react';

const ConnectionStatus = ({ connected, latency }) => (
    <div className="connection-status">
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
        </div>
        {connected && latency && (
            <div className="latency">
                Ping: {latency}ms
            </div>
        )}
    </div>
);

export default ConnectionStatus;
```

**QueueStatus Component:**
```jsx
import React, { useState, useEffect } from 'react';

const QueueStatus = ({ roomId, position: initialPosition }) => {
    const [position, setPosition] = useState(initialPosition);

    useEffect(() => {
        // Poll for queue updates
        const interval = setInterval(async () => {
            const response = await fetch(`/api/game/room/${roomId}`);
            const { data } = await response.json();

            if (data.status === 'ready') {
                // Game ready, trigger reload or redirect
                window.location.reload();
            } else {
                setPosition(data.queuePosition);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [roomId]);

    return (
        <div className="queue-status">
            <h3>Game Starting Soon...</h3>
            <p>Position in queue: <strong>{position}</strong></p>
            <div className="loading-spinner" />
        </div>
    );
};

export default QueueStatus;
```

### Step 6: Main Integration

In your main Scratch GUI component:

```jsx
import React, { Component } from 'react';
import VM from 'scratch-vm';
import VMServerClient from '../lib/vm-server-client';
import { updateLocalVMState } from '../lib/state-renderer';
import { startInputCapture } from '../lib/input-capture';
import ConnectionStatus from './connection-status';
import QueueStatus from './queue-status';

class ServerModeGUI extends Component {
    constructor(props) {
        super(props);

        this.state = {
            mode: 'loading', // 'loading', 'queued', 'playing', 'ended'
            connected: false,
            queuePosition: null,
            latency: null
        };

        this.vm = new VM();
        this.vmClient = null;
    }

    async componentDidMount() {
        const { roomId, userId } = this.props;

        // 1. Get room info from backend
        const response = await fetch(`/api/game/room/${roomId}`, {
            headers: {
                'Authorization': `Bearer ${this.props.authToken}`
            }
        });

        const { data } = await response.json();

        if (data.status === 'queued') {
            // Show queue UI
            this.setState({
                mode: 'queued',
                queuePosition: data.queuePosition
            });
            return;
        }

        // 2. Connect to VM server
        this.vmClient = new VMServerClient();

        this.vmClient.connect(data.wsUrl, roomId, userId, {
            onStateUpdate: (state) => {
                updateLocalVMState(state);
                this.updateLatency();
            },
            onGameEnded: (result) => {
                this.handleGameEnded(result);
            },
            onConnected: () => {
                this.setState({ connected: true, mode: 'playing' });
                startInputCapture(this.vmClient);
            },
            onDisconnected: () => {
                this.setState({ connected: false });
            }
        });

        // 3. Load project (for rendering only, not execution)
        await this.vm.loadProject(data.projectData);

        // Expose VM globally for state updates
        window.vm = this.vm;
    }

    componentWillUnmount() {
        if (this.vmClient) {
            this.vmClient.disconnect();
        }
    }

    updateLatency() {
        // Calculate latency based on timestamps
        // Implementation depends on your approach
    }

    handleGameEnded(result) {
        this.setState({ mode: 'ended' });

        // Show results
        // Redirect to results page or show modal
        window.location.href = `/game/results/${result.roomId}`;
    }

    render() {
        const { mode, connected, queuePosition, latency } = this.state;

        if (mode === 'queued') {
            return <QueueStatus roomId={this.props.roomId} position={queuePosition} />;
        }

        return (
            <div className="server-mode-gui">
                <ConnectionStatus connected={connected} latency={latency} />

                {/* Render Scratch stage, blocks, etc. */}
                <div className="stage-wrapper">
                    {/* Your existing Scratch rendering */}
                </div>

                {mode === 'ended' && (
                    <div className="game-ended-overlay">
                        <p>Game Ended. Redirecting...</p>
                    </div>
                )}
            </div>
        );
    }
}

export default ServerModeGUI;
```

## Configuration

Add to `packages/scratch-gui/.env`:

```bash
# VM Server WebSocket URL
REACT_APP_VM_SERVER_WS_URL=ws://localhost:3001/game

# Or production
# REACT_APP_VM_SERVER_WS_URL=wss://vm.degu.games/game
```

## Testing

### 1. Test Room Creation

```javascript
// In browser console
const response = await fetch('/api/game/create-room', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer YOUR_TOKEN`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        projectId: 'test_project',
        players: ['user1', 'user2'],
        betAmount: 10
    })
});

const result = await response.json();
console.log(result);
```

### 2. Test WebSocket Connection

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3001/game?roomId=ROOM_ID&userId=user1');

ws.onmessage = (event) => {
    console.log('Message:', event.data);
};

// Send test input
ws.send(JSON.stringify({
    type: 'keyboard',
    action: 'keydown',
    key: 'space'
}));
```

### 3. Test State Updates

Check console for state broadcast messages and verify sprites update correctly.

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to VM server

**Check:**
- VM server is running: `curl http://localhost:3001/api/health`
- WebSocket URL is correct in `.env`
- Firewall/proxy not blocking WebSocket

### State Not Updating

**Problem:** Receiving state but sprites not moving

**Check:**
- `window.vm` is set correctly
- State renderer is being called
- Sprite names match between client and server

### Input Lag

**Problem:** Inputs feel delayed

**Solutions:**
- Check latency with ping test
- Reduce state broadcast FPS if network is slow
- Implement client-side prediction (advanced)

## Performance Optimization

### 1. Throttle Mouse Events

```javascript
let lastMouseSend = 0;
const MOUSE_THROTTLE = 50; // ms

canvas.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMouseSend < MOUSE_THROTTLE) {
        return; // Skip this event
    }
    lastMouseSend = now;

    // Send mouse position
    vmClient.sendMouseInput(x, y, false);
});
```

### 2. State Update Batching

```javascript
let stateUpdateScheduled = false;

function updateLocalVMState(state) {
    if (stateUpdateScheduled) {
        return; // Skip if already scheduled
    }

    stateUpdateScheduled = true;

    requestAnimationFrame(() => {
        // Apply state update
        applyStateUpdate(state);
        stateUpdateScheduled = false;
    });
}
```

## Next Steps

1. Implement complete integration in Scratch GUI
2. Test with real Scratch projects
3. Add client-side prediction for better UX
4. Add reconnection logic
5. Add offline mode detection
6. Implement spectator mode

## Support

For issues or questions, see:
- `VM_SERVER_IMPLEMENTATION_PLAN.md`
- `FINAL_ARCHITECTURE_DECISIONS.md`
- VM Server README: `packages/vm-server/README.md`
