/**
 * WebSocket Server - Real-time game I/O
 *
 * Responsibilities:
 * - Player connections
 * - Input routing to VMs
 * - State broadcasting to players
 * - Room-based connection management
 */

const WebSocket = require('ws');
const url = require('url');
const logger = require('./logger');
const config = require('./config');
const StateSerializer = require('./StateSerializer');
const InputInjector = require('./InputInjector');

/**
 * Create WebSocket server
 * @param {http.Server} httpServer - HTTP server
 * @param {GameInstanceManager} gameManager - Game instance manager
 * @returns {WebSocket.Server}
 */
function createWebSocketServer(httpServer, gameManager) {
    const wss = new WebSocket.Server({
        server: httpServer,
        path: '/game'
    });

    // Room connections: Map<roomId, Set<{ws, userId}>>
    const roomConnections = new Map();

    // State serializer
    const stateSerializer = new StateSerializer();

    // Input injector
    const inputInjector = new InputInjector();

    // Broadcasting intervals: Map<roomId, intervalId>
    const broadcastIntervals = new Map();

    logger.info('[WebSocket] Server initialized');

    /**
     * Parse connection URL
     * @param {string} reqUrl - Request URL
     * @returns {{roomId: string, userId: string}|null}
     */
    function parseConnectionUrl(reqUrl) {
        try {
            const parsed = url.parse(reqUrl, true);
            const { roomId, userId } = parsed.query;

            if (!roomId || !userId) {
                return null;
            }

            return { roomId, userId };
        } catch (error) {
            logger.error(`[WebSocket] Error parsing URL: ${error.message}`);
            return null;
        }
    }

    /**
     * Add connection to room
     */
    function addConnection(roomId, ws, userId) {
        if (!roomConnections.has(roomId)) {
            roomConnections.set(roomId, new Set());
        }

        roomConnections.get(roomId).add({ ws, userId });

        const shortRoomId = roomId.substring(0, 8);
        const shortUserId = userId.substring(0, 8);
        const playerCount = roomConnections.get(roomId).size;

        logger.info(`[CONNECTION] ✅ Player Connected | Room: ${shortRoomId} | Player: ${shortUserId} | Total Players: ${playerCount}`);
    }

    /**
     * Remove connection from room
     */
    function removeConnection(roomId, ws, userId) {
        const connections = roomConnections.get(roomId);

        if (!connections) {
            return;
        }

        // Find and remove connection
        for (const conn of connections) {
            if (conn.ws === ws) {
                connections.delete(conn);
                break;
            }
        }

        const shortRoomId = roomId.substring(0, 8);
        const shortUserId = userId.substring(0, 8);

        logger.info(`[CONNECTION] ❌ Player Disconnected | Room: ${shortRoomId} | Player: ${shortUserId} | Remaining: ${connections.size}`);

        // Cleanup if no connections left
        if (connections.size === 0) {
            roomConnections.delete(roomId);
            stopBroadcasting(roomId);
            logger.info(`[CONNECTION] 🧹 Room ${shortRoomId} cleaned up (no players remaining)`);
        }

        // Clear rate limit
        inputInjector.clearRateLimit(userId);
    }

    /**
     * Broadcast state to all players in a room
     */
    function broadcastState(roomId) {
        const vm = gameManager.getVM(roomId);

        if (!vm) {
            return;
        }

        const connections = roomConnections.get(roomId);

        if (!connections || connections.size === 0) {
            return;
        }

        // Get serialized state (with delta encoding)
        const stateJson = stateSerializer.getSerializedState(vm.vm, roomId, true);

        if (!stateJson) {
            // No changes, skip broadcast
            return;
        }

        // Broadcast to all connections
        let sent = 0;
        let failed = 0;

        for (const conn of connections) {
            if (conn.ws.readyState === WebSocket.OPEN) {
                try {
                    conn.ws.send(stateJson);
                    sent++;
                } catch (error) {
                    logger.error(`[WebSocket] Error sending to ${conn.userId}: ${error.message}`);
                    failed++;
                }
            }
        }

        if (failed > 0) {
            logger.warn(`[WebSocket] ${roomId}: Broadcast sent to ${sent}, failed: ${failed}`);
        }
    }

    /**
     * Start broadcasting for a room
     */
    function startBroadcasting(roomId) {
        if (broadcastIntervals.has(roomId)) {
            return; // Already broadcasting
        }

        const interval = setInterval(() => {
            broadcastState(roomId);
        }, config.stateBroadcastInterval);

        broadcastIntervals.set(roomId, interval);

        logger.info(`[WebSocket] ${roomId}: Started broadcasting at ${config.stateBroadcastFPS} FPS`);
    }

    /**
     * Stop broadcasting for a room
     */
    function stopBroadcasting(roomId) {
        const interval = broadcastIntervals.get(roomId);

        if (interval) {
            clearInterval(interval);
            broadcastIntervals.delete(roomId);
            stateSerializer.clearState(roomId);

            logger.info(`[WebSocket] ${roomId}: Stopped broadcasting`);
        }
    }

    /**
     * Handle player input message
     */
    function handleInputMessage(roomId, userId, message) {
        const vm = gameManager.getVM(roomId);

        if (!vm) {
            logger.warn(`[WebSocket] Input for non-existent room: ${roomId}`);
            return;
        }

        try {
            const data = JSON.parse(message);

            if (!data.type) {
                logger.warn(`[WebSocket] Invalid input message from ${userId}`);
                return;
            }

            // Log the input event
            const shortUserId = userId.substring(0, 8);
            if (data.type === 'keyboard') {
                logger.info(`[EVENT] 🎹 Keyboard | Room: ${roomId.substring(0, 8)} | Player: ${shortUserId} | ${data.action.toUpperCase()} "${data.key}"`);
            } else if (data.type === 'mouse') {
                if (data.action === 'move') {
                    logger.debug(`[EVENT] 🖱️  Mouse Move | Room: ${roomId.substring(0, 8)} | Player: ${shortUserId} | Position: (${data.x}, ${data.y})`);
                } else {
                    logger.info(`[EVENT] 🖱️  Mouse | Room: ${roomId.substring(0, 8)} | Player: ${shortUserId} | ${data.action.toUpperCase()}`);
                }
            }

            // Inject input into server VM
            const success = inputInjector.inject(vm, userId, data);

            if (!success) {
                logger.warn(`[EVENT] ⚠️  Input Rejected | Room: ${roomId.substring(0, 8)} | Player: ${shortUserId} | Reason: Rate limited or invalid`);
                return; // Rate limited or invalid input
            }

            // Broadcast input to all OTHER players in the room
            const connections = roomConnections.get(roomId);
            const playerCount = connections ? connections.size : 0;
            broadcastInputToRoom(roomId, userId, data);

            if (playerCount > 1) {
                logger.debug(`[BROADCAST] 📡 Sent to ${playerCount - 1} other player(s) in room ${roomId.substring(0, 8)}`);
            }

        } catch (error) {
            logger.error(`[WebSocket] Error handling input: ${error.message}`);
        }
    }

    /**
     * Broadcast player input to all other players in the room
     */
    function broadcastInputToRoom(roomId, senderId, inputData) {
        const connections = roomConnections.get(roomId);

        if (!connections) {
            return;
        }

        const message = JSON.stringify({
            type: 'player_input',
            playerId: senderId,
            input: inputData
        });

        // Send to everyone EXCEPT the sender
        for (const conn of connections) {
            if (conn.userId !== senderId && conn.ws.readyState === WebSocket.OPEN) {
                try {
                    conn.ws.send(message);
                } catch (error) {
                    logger.error(`[WebSocket] Error broadcasting input to ${conn.userId}: ${error.message}`);
                }
            }
        }
    }

    /**
     * Broadcast message to all players in room
     */
    function broadcastMessage(roomId, message) {
        const connections = roomConnections.get(roomId);

        if (!connections) {
            return;
        }

        const messageStr = JSON.stringify(message);

        for (const conn of connections) {
            if (conn.ws.readyState === WebSocket.OPEN) {
                try {
                    conn.ws.send(messageStr);
                } catch (error) {
                    logger.error(`[WebSocket] Error broadcasting message: ${error.message}`);
                }
            }
        }
    }

    /**
     * Setup event listeners for game manager
     */
    gameManager.on('game_finalized', ({ roomId, winner, txHash }) => {
        logger.info(`[WebSocket] Broadcasting game result for ${roomId}`);

        broadcastMessage(roomId, {
            type: 'game_ended',
            winner: winner,
            txHash: txHash,
            timestamp: Date.now()
        });

        // Stop broadcasting after short delay
        setTimeout(() => {
            stopBroadcasting(roomId);
        }, 2000);
    });

    gameManager.on('game_started', ({ roomId }) => {
        logger.info(`[WebSocket] Game started: ${roomId}`);
    });

    gameManager.on('queue_processed', ({ roomId }) => {
        // Notify players that game is starting
        broadcastMessage(roomId, {
            type: 'game_starting',
            roomId: roomId,
            timestamp: Date.now()
        });
    });

    /**
     * Handle WebSocket connections
     */
    wss.on('connection', (ws, req) => {
        // Parse connection parameters
        const params = parseConnectionUrl(req.url);

        if (!params) {
            logger.warn('[WebSocket] Connection rejected: Invalid URL parameters');
            ws.close(4000, 'Invalid URL parameters. Required: roomId, userId');
            return;
        }

        const { roomId, userId } = params;

        // Check if game exists
        const vm = gameManager.getVM(roomId);

        if (!vm) {
            logger.warn(`[WebSocket] Connection rejected: Room ${roomId} not found`);
            ws.close(4004, 'Room not found or not started');
            return;
        }

        // Add connection
        addConnection(roomId, ws, userId);

        // Start broadcasting if first connection
        if (roomConnections.get(roomId).size === 1) {
            startBroadcasting(roomId);
        }

        // Send project data first (needed for client rendering)
        ws.send(JSON.stringify({
            type: 'project_data',
            projectData: vm.projectData,
            timestamp: Date.now()
        }));

        // Send initial full state
        const initialState = stateSerializer.getSerializedState(vm.vm, roomId, false);
        if (initialState) {
            ws.send(initialState);
        }

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            roomId: roomId,
            userId: userId,
            players: vm.players,
            timestamp: Date.now()
        }));

        // Handle messages
        ws.on('message', (message) => {
            handleInputMessage(roomId, userId, message.toString());
        });

        // Handle errors
        ws.on('error', (error) => {
            logger.error(`[WebSocket] ${roomId}: Error from ${userId}: ${error.message}`);
        });

        // Handle disconnect
        ws.on('close', (code, reason) => {
            logger.info(`[WebSocket] ${roomId}: ${userId} disconnected (code: ${code})`);
            removeConnection(roomId, ws, userId);
        });
    });

    /**
     * Cleanup on server shutdown
     */
    wss.on('close', () => {
        logger.info('[WebSocket] Server closing, cleaning up...');

        // Stop all broadcasting
        for (const roomId of broadcastIntervals.keys()) {
            stopBroadcasting(roomId);
        }

        // Close all connections
        for (const connections of roomConnections.values()) {
            for (const conn of connections) {
                conn.ws.close(1001, 'Server shutting down');
            }
        }

        roomConnections.clear();

        logger.info('[WebSocket] Cleanup complete');
    });

    // Periodic cleanup of stale rate limits
    setInterval(() => {
        inputInjector.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes

    return wss;
}

module.exports = createWebSocketServer;
