/**
 * REST API - HTTP endpoints for VM server management
 *
 * Endpoints:
 * - POST /request-slot - Request a game slot
 * - GET /status - Server health and capacity
 * - POST /end-game/:roomId - Force end a game (admin)
 */

const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const config = require('./config');

/**
 * Create REST API router
 * @param {GameInstanceManager} gameManager - Game instance manager
 * @returns {express.Router}
 */
function createRestAPI(gameManager) {
    const router = express.Router();

    // Middleware
    router.use(cors());
    router.use(express.json());

    /**
     * Authentication middleware - verify requests from backend
     */
    function authenticateBackend(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authorization header required'
            });
        }

        if (token !== config.vmServerToken) {
            return res.status(401).json({
                success: false,
                error: 'Invalid authorization token'
            });
        }

        next();
    }

    /**
     * POST /request-slot
     * Request a game slot (start VM or queue)
     *
     * Body:
     * {
     *   roomId: string,
     *   projectId: string,
     *   projectData: object, // Scratch project JSON
     *   players: string[]    // User IDs
     * }
     */
    router.post('/request-slot', authenticateBackend, async (req, res) => {
        try {
            const { roomId, projectId, projectData, players } = req.body;

            // Validation
            if (!roomId || !projectData || !players) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: roomId, projectData, players'
                });
            }

            if (!Array.isArray(players) || players.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'players must be a non-empty array'
                });
            }

            logger.info(`[REST API] Slot request for room ${roomId} (${players.length} players)`);

            // Start game or queue
            const result = await gameManager.startGame(roomId, projectData, players);

            if (result.status === 'error') {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            // Build WebSocket URL
            const wsProtocol = config.nodeEnv === 'production' ? 'wss' : 'ws';
            const wsHost = req.headers.host || `localhost:${config.port}`;
            const wsUrl = `${wsProtocol}://${wsHost}/game`;

            // Response
            if (result.status === 'started') {
                return res.json({
                    success: true,
                    data: {
                        status: 'ready',
                        roomId: roomId,
                        wsUrl: wsUrl,
                        message: 'Game started successfully'
                    }
                });
            } else if (result.status === 'queued') {
                return res.json({
                    success: true,
                    data: {
                        status: 'queued',
                        roomId: roomId,
                        queuePosition: result.position,
                        message: `Game queued at position ${result.position}`
                    }
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'Unknown result status'
                });
            }

        } catch (error) {
            logger.error(`[REST API] Error in /request-slot: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /status
     * Get server health and capacity
     */
    router.get('/status', (req, res) => {
        try {
            const stats = gameManager.getStats();
            const activeGames = gameManager.getActiveGames();

            const memUsage = process.memoryUsage();

            return res.json({
                success: true,
                data: {
                    status: 'online',
                    version: '1.0.0',
                    uptime: process.uptime(),
                    capacity: {
                        activeGames: stats.activeGames,
                        maxGames: stats.maxConcurrentGames,
                        capacityUsed: stats.capacityUsed,
                        queueLength: stats.queueLength,
                        queueMax: stats.queueMax
                    },
                    stats: {
                        totalGamesStarted: stats.totalGamesStarted,
                        totalGamesCompleted: stats.totalGamesCompleted,
                        totalGamesFailed: stats.totalGamesFailed
                    },
                    memory: {
                        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
                        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
                        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
                    },
                    activeGames: activeGames.map(game => ({
                        roomId: game.roomId,
                        players: game.players.length,
                        duration: game.duration || Math.floor((Date.now() - game.startedAt) / 1000)
                    }))
                }
            });

        } catch (error) {
            logger.error(`[REST API] Error in /status: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /end-game/:roomId
     * Force end a game (admin only)
     */
    router.post('/end-game/:roomId', authenticateBackend, async (req, res) => {
        try {
            const { roomId } = req.params;

            logger.warn(`[REST API] Force ending game ${roomId}`);

            const vm = gameManager.getVM(roomId);

            if (!vm) {
                return res.status(404).json({
                    success: false,
                    error: 'Game not found'
                });
            }

            await gameManager.forceEndGame(roomId);

            return res.json({
                success: true,
                data: {
                    message: `Game ${roomId} ended successfully`
                }
            });

        } catch (error) {
            logger.error(`[REST API] Error in /end-game: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /queue/:roomId
     * Get queue position for a room
     */
    router.get('/queue/:roomId', authenticateBackend, (req, res) => {
        try {
            const { roomId } = req.params;

            const position = gameManager.getQueuePosition(roomId);

            if (position === null) {
                return res.status(404).json({
                    success: false,
                    error: 'Room not in queue'
                });
            }

            return res.json({
                success: true,
                data: {
                    roomId: roomId,
                    position: position
                }
            });

        } catch (error) {
            logger.error(`[REST API] Error in /queue: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /health
     * Simple health check (no auth required)
     */
    router.get('/health', (req, res) => {
        res.json({ success: true, status: 'ok' });
    });

    return router;
}

module.exports = createRestAPI;
