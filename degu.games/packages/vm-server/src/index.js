/**
 * VM Server - Main Entry Point
 *
 * Starts HTTP/WebSocket server for server-authoritative Scratch game execution
 */

const http = require('http');
const express = require('express');
const GameInstanceManager = require('./GameInstanceManager');
const createRestAPI = require('./rest-api');
const createWebSocketServer = require('./websocket-server');
const logger = require('./logger');
const config = require('./config');

// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize game instance manager
const gameManager = new GameInstanceManager();

// Setup REST API
const restAPI = createRestAPI(gameManager);
app.use('/api', restAPI);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Degu VM Server',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            rest: '/api',
            websocket: '/game',
            health: '/api/health',
            status: '/api/status'
        }
    });
});

// Setup WebSocket server
const wss = createWebSocketServer(httpServer, gameManager);

// Error handling
app.use((err, req, res, next) => {
    logger.error(`[Server] Unhandled error: ${err.message}`);
    logger.error(err.stack);

    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
const PORT = config.port;

httpServer.listen(PORT, () => {
    logger.info('='.repeat(60));
    logger.info(`🎮 Degu VM Server Started`);
    logger.info('='.repeat(60));
    logger.info(`Port: ${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Max Concurrent Games: ${config.maxConcurrentGames}`);
    logger.info(`Max Queue Size: ${config.maxQueueSize}`);
    logger.info(`State Broadcast: ${config.stateBroadcastFPS} FPS`);
    logger.info(`Input Rate Limit: ${config.inputRateLimit}/sec`);
    logger.info('='.repeat(60));
    logger.info(`REST API: http://localhost:${PORT}/api`);
    logger.info(`WebSocket: ws://localhost:${PORT}/game`);
    logger.info(`Health Check: http://localhost:${PORT}/api/health`);
    logger.info(`Status: http://localhost:${PORT}/api/status`);
    logger.info('='.repeat(60));
});

// Graceful shutdown
const signals = ['SIGTERM', 'SIGINT'];

signals.forEach(signal => {
    process.on(signal, async () => {
        logger.info(`\n[Server] ${signal} received, starting graceful shutdown...`);

        // Stop accepting new connections
        httpServer.close(() => {
            logger.info('[Server] HTTP server closed');
        });

        // Close WebSocket server
        wss.close(() => {
            logger.info('[Server] WebSocket server closed');
        });

        // Cleanup game instances
        await gameManager.shutdown();

        logger.info('[Server] Graceful shutdown complete');
        process.exit(0);
    });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error(`[Server] Uncaught exception: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('[Server] Unhandled promise rejection:', reason);
    process.exit(1);
});

logger.info('[Server] Initialization complete, ready to accept connections');

module.exports = { app, httpServer, wss, gameManager };
