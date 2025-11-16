/**
 * VM Sync Manager
 *
 * Connects the Scratch VM to the vm-server for multiplayer synchronization
 * - Sends local inputs to vm-server
 * - Receives and applies remote player inputs
 * - Server determines winner
 */

class VMSyncManager {
    constructor(vm) {
        this.vm = vm;
        this.ws = null;
        this.roomId = null;
        this.userId = null;
        this.connected = false;
        this.inputQueue = [];

        console.log('[VMSyncManager] Initialized');
    }

    /**
     * Connect to VM server for multiplayer sync
     */
    connect(roomId, userId, vmServerUrl, token) {
        if (this.ws) {
            console.log('[VMSyncManager] Already connected, disconnecting first');
            this.disconnect();
        }

        this.roomId = roomId;
        this.userId = userId;

        const wsUrl = `${vmServerUrl}?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}`;
        console.log('[VMSyncManager] Connecting to:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('[VMSyncManager] Connected to VM server');
            this.connected = true;

            // Flush queued inputs
            while (this.inputQueue.length > 0) {
                const input = this.inputQueue.shift();
                this.sendInput(input);
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleServerMessage(message);
            } catch (error) {
                console.error('[VMSyncManager] Failed to parse message:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('[VMSyncManager] WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('[VMSyncManager] Disconnected from VM server');
            this.connected = false;
        };

        // Hook into VM input devices
        this.setupInputHooks();
    }

    /**
     * Disconnect from VM server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.inputQueue = [];

        // Remove event listeners
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler, true);
            this.keyDownHandler = null;
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler, true);
            this.keyUpHandler = null;
        }
    }

    /**
     * Handle messages from VM server
     */
    handleServerMessage(message) {
        switch (message.type) {
            case 'player_input':
                // Apply remote player's input to local VM
                this.applyRemoteInput(message.playerId, message.input);
                break;

            case 'game_ended':
                console.log('[VMSyncManager] Game ended, winner:', message.winner);
                // Notify parent window
                if (window.parent !== window) {
                    window.parent.postMessage({
                        type: 'GAME_ENDED',
                        winner: message.winner,
                        txHash: message.txHash
                    }, '*');
                }
                break;

            case 'connected':
                console.log('[VMSyncManager] Connection confirmed');
                break;

            default:
                console.log('[VMSyncManager] Unknown message type:', message.type);
        }
    }

    /**
     * Apply remote player's input to local VM
     */
    applyRemoteInput(playerId, input) {
        if (!this.vm) return;

        try {
            if (input.type === 'keyboard') {
                const isDown = input.action === 'keydown';
                const scratchKey = this.mapKeyToScratch(input.key);
                this.vm.runtime.ioDevices.keyboard.postData({
                    key: scratchKey,
                    isDown: isDown
                });
                console.log(`[VMSyncManager] Applied remote keyboard: ${playerId} ${input.action} ${scratchKey} (from ${input.key})`);
            }

            if (input.type === 'mouse') {
                if (input.action === 'move' && input.x !== undefined && input.y !== undefined) {
                    this.vm.runtime.ioDevices.mouse.postData({
                        x: input.x,
                        y: input.y
                    });
                } else if (input.action === 'down' || input.action === 'up') {
                    this.vm.runtime.ioDevices.mouse.postData({
                        isDown: input.action === 'down'
                    });
                }
            }
        } catch (error) {
            console.error('[VMSyncManager] Error applying remote input:', error);
        }
    }

    /**
     * Map browser key names to Scratch key names
     * Scratch expects specific names for special keys
     */
    mapKeyToScratch(key) {
        const keyMap = {
            ' ': 'space',
            'ArrowLeft': 'left arrow',
            'ArrowRight': 'right arrow',
            'ArrowUp': 'up arrow',
            'ArrowDown': 'down arrow',
            'Enter': 'enter'
        };

        // Return mapped key or original key (converted to lowercase for letters)
        return keyMap[key] || key.toLowerCase();
    }

    /**
     * Setup hooks to intercept local inputs and send to server
     */
    setupInputHooks() {
        // Hook keyboard events on document (captures all key presses)
        const handleKeyDown = (e) => {
            const scratchKey = this.mapKeyToScratch(e.key);
            console.log('[VMSyncManager] Captured keydown:', e.key, '-> Scratch key:', scratchKey);
            this.sendInput({
                type: 'keyboard',
                action: 'keydown',
                key: scratchKey
            });
        };

        const handleKeyUp = (e) => {
            const scratchKey = this.mapKeyToScratch(e.key);
            console.log('[VMSyncManager] Captured keyup:', e.key, '-> Scratch key:', scratchKey);
            this.sendInput({
                type: 'keyboard',
                action: 'keyup',
                key: scratchKey
            });
        };

        // Use capture phase to intercept before Scratch's handlers
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('keyup', handleKeyUp, true);

        // Store handlers for cleanup
        this.keyDownHandler = handleKeyDown;
        this.keyUpHandler = handleKeyUp;

        console.log('[VMSyncManager] Input hooks installed on document');
    }

    /**
     * Send input to VM server
     */
    sendInput(input) {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // Queue input if not connected yet
            this.inputQueue.push(input);
            return;
        }

        try {
            this.ws.send(JSON.stringify(input));
        } catch (error) {
            console.error('[VMSyncManager] Failed to send input:', error);
        }
    }

    /**
     * Get connection status
     */
    isConnected() {
        return this.connected;
    }
}

export default VMSyncManager;
