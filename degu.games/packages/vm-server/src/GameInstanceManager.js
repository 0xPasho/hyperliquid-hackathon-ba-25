/**
 * GameInstanceManager - Manages all running game VM instances
 *
 * Core responsibilities:
 * - Start/stop VM instances
 * - Capacity management
 * - Queue integration
 * - Finalization handling
 */

const EventEmitter = require('events');
const VMInstance = require('./VMInstance');
const QueueManager = require('./QueueManager');
const logger = require('./logger');
const config = require('./config');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class GameInstanceManager extends EventEmitter {
    constructor() {
        super();

        // Running games: Map<roomId, VMInstance>
        this.runningGames = new Map();

        // Queue manager
        this.queueManager = new QueueManager();

        // Capacity
        this.maxConcurrentGames = config.maxConcurrentGames;

        // Statistics
        this.stats = {
            totalGamesStarted: 0,
            totalGamesCompleted: 0,
            totalGamesFailed: 0
        };

        // Setup queue event listeners
        this._setupQueueListeners();

        logger.info(`[GameInstanceManager] Initialized`);
        logger.info(`[GameInstanceManager] Max concurrent games: ${this.maxConcurrentGames}`);
    }

    /**
     * Setup queue event listeners
     */
    _setupQueueListeners() {
        this.queueManager.on('processed', ({ roomId }) => {
            logger.info(`[GameInstanceManager] Queue processed: ${roomId}`);
        });
    }

    /**
     * Check if can start a new game
     * @returns {boolean}
     */
    canStartGame() {
        return this.runningGames.size < this.maxConcurrentGames;
    }

    /**
     * Start a game
     * @param {string} roomId - Room ID
     * @param {object} projectData - Scratch project JSON
     * @param {array} players - Player user IDs
     * @returns {Promise<{status: string, vm?: VMInstance, position?: number}>}
     */
    async startGame(roomId, projectData, players) {
        // Check if already running
        if (this.runningGames.has(roomId)) {
            logger.warn(`[GameInstanceManager] Room ${roomId} already running`);
            return {
                status: 'running',
                vm: this.runningGames.get(roomId)
            };
        }

        // Check capacity
        if (!this.canStartGame()) {
            logger.info(`[GameInstanceManager] At capacity, queueing room ${roomId}`);

            try {
                const position = this.queueManager.add(roomId, projectData, players);
                return {
                    status: 'queued',
                    position: position
                };
            } catch (error) {
                logger.error(`[GameInstanceManager] Failed to queue room ${roomId}: ${error.message}`);
                return {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Start VM
        try {
            const shortRoomId = roomId.substring(0, 8);
            logger.info(`[GAME] 🎬 Starting Game | Room: ${shortRoomId} | Players: ${players.length}`);
            players.forEach((playerId, index) => {
                logger.info(`[GAME]   Player ${index + 1}: ${playerId.substring(0, 8)}`);
            });

            const vmInstance = new VMInstance(roomId, projectData, players);

            // Setup VM event listeners
            this._setupVMListeners(vmInstance);

            // Store
            this.runningGames.set(roomId, vmInstance);

            // Update stats
            this.stats.totalGamesStarted++;

            logger.info(`[GAME] ✅ Game Started | Room: ${shortRoomId} | Active Games: ${this.runningGames.size}/${this.maxConcurrentGames}`);

            this.emit('game_started', { roomId, players });

            return {
                status: 'started',
                vm: vmInstance
            };
        } catch (error) {
            const shortRoomId = roomId.substring(0, 8);
            logger.error(`[GAME] ❌ Failed to Start | Room: ${shortRoomId} | Error: ${error.message}`);
            this.stats.totalGamesFailed++;

            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Setup event listeners for a VM instance
     * @param {VMInstance} vmInstance
     */
    _setupVMListeners(vmInstance) {
        // Game ready to finalize
        vmInstance.on('finalize', async (data) => {
            await this.finalizeGame(data.roomId);
        });

        // Runtime error
        vmInstance.on('runtime_error', (error) => {
            logger.error(`[GameInstanceManager] Runtime error in ${vmInstance.roomId}: ${error.message}`);
            // Could add auto-cleanup on critical errors
        });

        // VM error
        vmInstance.on('error', (error) => {
            logger.error(`[GameInstanceManager] VM error in ${vmInstance.roomId}: ${error.message}`);
            this.endGame(vmInstance.roomId);
        });
    }

    /**
     * Finalize a game (call backend API)
     * @param {string} roomId - Room ID
     */
    async finalizeGame(roomId) {
        const vm = this.runningGames.get(roomId);

        if (!vm) {
            logger.error(`[GameInstanceManager] Cannot finalize ${roomId}: VM not found`);
            return;
        }

        const shortRoomId = roomId.substring(0, 8);

        try {
            // Get game info
            const gameInfo = vm.getInfo();
            const finalizationTime = new Date().toISOString();

            // Log complete game summary
            logger.info(`\n${'='.repeat(60)}`);
            logger.info(`[FINALIZE] 🏁 GAME COMPLETED | Room: ${shortRoomId}`);
            logger.info(`${'='.repeat(60)}`);
            logger.info(`[FINALIZE] 🏆 Winner: ${gameInfo.winner}`);
            logger.info(`[FINALIZE] 👥 Players: ${gameInfo.players.join(', ')}`);
            logger.info(`[FINALIZE] ⏱️  Duration: ${gameInfo.duration}s`);
            logger.info(`[FINALIZE] 🕐 Started: ${new Date(gameInfo.startedAt).toISOString()}`);
            logger.info(`[FINALIZE] 🕑 Ended: ${new Date(gameInfo.endedAt).toISOString()}`);
            logger.info(`[FINALIZE] 🕒 Finalized: ${finalizationTime}`);
            logger.info(`${'='.repeat(60)}`);

            // Call backend API
            const response = await fetch(`${config.backendUrl}/api/v1/game/result`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VM-Server': 'true'
                },
                body: JSON.stringify({
                    roomId: roomId,
                    winnerUserId: gameInfo.winner,
                    source: 'vm_server'
                }),
                timeout: 30000
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`Backend API error: ${response.status} - ${responseText}`);
            }

            const result = JSON.parse(responseText);
            const txHash = result.data?.transactionHash || 'N/A';
            const blockchainStatus = result.data?.status || 'unknown';

            // Log blockchain transaction details
            logger.info(`\n[FINALIZE] 💰 BLOCKCHAIN TRANSACTION`);
            logger.info(`[FINALIZE]   Status: ${blockchainStatus}`);
            logger.info(`[FINALIZE]   TX Hash: ${txHash}`);
            if (result.data?.blockNumber) {
                logger.info(`[FINALIZE]   Block: ${result.data.blockNumber}`);
            }
            if (result.data?.gasUsed) {
                logger.info(`[FINALIZE]   Gas Used: ${result.data.gasUsed}`);
            }
            logger.info(`[FINALIZE] ✅ Game Finalized Successfully | Room: ${shortRoomId}`);

            // Write to game results log file
            this._writeGameResultToFile({
                roomId,
                winner: gameInfo.winner,
                players: gameInfo.players,
                duration: gameInfo.duration,
                startedAt: gameInfo.startedAt,
                endedAt: gameInfo.endedAt,
                finalizedAt: Date.now(),
                txHash: txHash,
                blockchainStatus: blockchainStatus,
                blockNumber: result.data?.blockNumber,
                gasUsed: result.data?.gasUsed
            });

            this.emit('game_finalized', {
                roomId,
                winner: gameInfo.winner,
                txHash: txHash
            });

            // Update stats
            this.stats.totalGamesCompleted++;

            // Cleanup
            await this.endGame(roomId);

        } catch (error) {
            logger.error(`[FINALIZE] ❌ Failed | Room: ${shortRoomId} | Error: ${error.message}`);
            this.stats.totalGamesFailed++;

            this.emit('finalize_error', {
                roomId,
                error: error.message
            });

            // Still cleanup even on error
            await this.endGame(roomId);
        }
    }

    /**
     * End a game and cleanup
     * @param {string} roomId - Room ID
     */
    async endGame(roomId) {
        const vm = this.runningGames.get(roomId);

        if (!vm) {
            logger.warn(`[GameInstanceManager] Cannot end ${roomId}: Not running`);
            return;
        }

        logger.info(`[GameInstanceManager] Ending game ${roomId}`);

        // Destroy VM
        vm.destroy();

        // Remove from running games
        this.runningGames.delete(roomId);

        logger.info(`[GameInstanceManager] Game ${roomId} ended (${this.runningGames.size}/${this.maxConcurrentGames} active)`);

        this.emit('game_ended', { roomId });

        // Process queue
        await this.processQueue();
    }

    /**
     * Process queue (start next waiting game)
     */
    async processQueue() {
        if (this.queueManager.isEmpty()) {
            return;
        }

        if (!this.canStartGame()) {
            return;
        }

        const next = this.queueManager.processNext();

        if (next) {
            logger.info(`[GameInstanceManager] Processing queued game: ${next.roomId}`);

            const result = await this.startGame(next.roomId, next.projectData, next.players);

            if (result.status === 'started') {
                this.emit('queue_processed', {
                    roomId: next.roomId
                });
            }
        }
    }

    /**
     * Get VM instance for a room
     * @param {string} roomId - Room ID
     * @returns {VMInstance|null}
     */
    getVM(roomId) {
        return this.runningGames.get(roomId) || null;
    }

    /**
     * Get queue position for a room
     * @param {string} roomId - Room ID
     * @returns {number|null}
     */
    getQueuePosition(roomId) {
        return this.queueManager.getPosition(roomId);
    }

    /**
     * Write game result to log file
     * @param {object} gameResult - Complete game result data
     */
    _writeGameResultToFile(gameResult) {
        try {
            const logsDir = path.join(__dirname, '../logs');

            // Create logs directory if it doesn't exist
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            // Create filename with date
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const logFile = path.join(logsDir, `game-results-${date}.jsonl`);

            // Format as JSON line (one game per line)
            const logEntry = JSON.stringify({
                ...gameResult,
                startedAtISO: new Date(gameResult.startedAt).toISOString(),
                endedAtISO: new Date(gameResult.endedAt).toISOString(),
                finalizedAtISO: new Date(gameResult.finalizedAt).toISOString()
            }) + '\n';

            // Append to file (creates if doesn't exist)
            fs.appendFileSync(logFile, logEntry, 'utf8');

            logger.info(`[FINALIZE] 📄 Saved to: ${logFile}`);
        } catch (error) {
            logger.error(`[FINALIZE] ❌ Failed to write log file: ${error.message}`);
        }
    }

    /**
     * Get server statistics
     * @returns {object}
     */
    getStats() {
        return {
            activeGames: this.runningGames.size,
            maxConcurrentGames: this.maxConcurrentGames,
            queueLength: this.queueManager.getLength(),
            queueMax: this.queueManager.maxSize,
            capacityUsed: Math.floor((this.runningGames.size / this.maxConcurrentGames) * 100),
            totalGamesStarted: this.stats.totalGamesStarted,
            totalGamesCompleted: this.stats.totalGamesCompleted,
            totalGamesFailed: this.stats.totalGamesFailed,
            queueStats: this.queueManager.getStats()
        };
    }

    /**
     * Get list of active games
     * @returns {array}
     */
    getActiveGames() {
        const games = [];

        for (const [roomId, vm] of this.runningGames.entries()) {
            games.push(vm.getInfo());
        }

        return games;
    }

    /**
     * Force end a game (admin)
     * @param {string} roomId - Room ID
     */
    async forceEndGame(roomId) {
        logger.warn(`[GameInstanceManager] Force ending game ${roomId}`);
        await this.endGame(roomId);
    }

    /**
     * Cleanup all games (shutdown)
     */
    async shutdown() {
        logger.warn(`[GameInstanceManager] Shutting down, cleaning up ${this.runningGames.size} games`);

        for (const roomId of this.runningGames.keys()) {
            await this.endGame(roomId);
        }

        this.queueManager.clear();

        logger.info(`[GameInstanceManager] Shutdown complete`);
    }
}

module.exports = GameInstanceManager;
