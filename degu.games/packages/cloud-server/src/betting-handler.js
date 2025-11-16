/**
 * Betting Game Handler for Cloud Variables
 *
 * Watches for room-specific variables:
 * - room_{roomId}_winner: Set when winner(s) are determined
 * - room_{roomId}_ended: Set when game ends
 *
 * When both are set, calls backend API to finalize game and distribute prizes.
 */

const logger = require('./logger');
const fetch = require('node-fetch');
const config = require('./config');

class BettingHandler {
    constructor() {
        // Track game states per room
        // { roomId: { winner: null|string|array, gameEnded: boolean, finalized: boolean, players: Set } }
        this.gameStates = new Map();

        // API configuration
        this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
        this.serverToken = process.env.CLOUD_SERVER_TOKEN || 'cloud_server_token_here';

        logger.info('[Betting] Handler initialized');
        logger.info(`[Betting] API URL: ${this.apiUrl}`);
    }

    /**
     * Handle a variable set event
     * @param {string} roomId - Room ID
     * @param {string} variableName - Variable name
     * @param {string} value - Variable value
     * @param {string} userId - User ID who set the variable
     */
    handleVariableSet(roomId, variableName, value, userId) {
        // Check if this is a betting variable
        const winnerPattern = new RegExp(`^room_(.+)_winner$`);
        const endedPattern = new RegExp(`^room_(.+)_ended$`);

        const winnerMatch = variableName.match(winnerPattern);
        const endedMatch = variableName.match(endedPattern);

        if (winnerMatch) {
            const extractedRoomId = winnerMatch[1];
            this.handleWinnerSet(extractedRoomId, value, userId);
        } else if (endedMatch) {
            const extractedRoomId = endedMatch[1];
            this.handleGameEnded(extractedRoomId, userId);
        }
    }

    /**
     * Handle winner being set
     * @param {string} roomId - Room ID
     * @param {string} value - Winner value (user ID, JSON array, or "NONE")
     * @param {string} userId - User who set the variable
     */
    handleWinnerSet(roomId, value, userId) {
        logger.info(`[Betting] Room ${roomId}: Winner set by ${userId}: ${value}`);

        // Get or create game state
        if (!this.gameStates.has(roomId)) {
            this.gameStates.set(roomId, {
                winner: null,
                gameEnded: false,
                finalized: false,
                players: new Set(),
                setBy: {}
            });
        }

        const state = this.gameStates.get(roomId);

        // Prevent changes if already finalized
        if (state.finalized) {
            logger.warn(`[Betting] Room ${roomId}: Already finalized, ignoring winner change`);
            return;
        }

        // Parse winner value
        if (value === 'NONE' || value === '' || value === 'null') {
            state.winner = [];
            logger.info(`[Betting] Room ${roomId}: No winners (house wins)`);
        } else if (value.startsWith('[') || value.startsWith('{')) {
            // JSON array or object
            try {
                const parsed = JSON.parse(value);
                state.winner = Array.isArray(parsed) ? parsed : [parsed];
                logger.info(`[Betting] Room ${roomId}: Multiple winners: ${state.winner.join(', ')}`);
            } catch (e) {
                logger.error(`[Betting] Room ${roomId}: Failed to parse JSON winners: ${e.message}`);
                state.winner = [value]; // Fallback to single winner
            }
        } else {
            // Single winner
            state.winner = [value];
            logger.info(`[Betting] Room ${roomId}: Single winner: ${value}`);
        }

        state.setBy.winner = userId;

        // Check if we can finalize
        this.checkAndFinalize(roomId);
    }

    /**
     * Handle game ended event
     * @param {string} roomId - Room ID
     * @param {string} userId - User who set the variable
     */
    handleGameEnded(roomId, userId) {
        logger.info(`[Betting] Room ${roomId}: Game ended by ${userId}`);

        // Get or create game state
        if (!this.gameStates.has(roomId)) {
            this.gameStates.set(roomId, {
                winner: null,
                gameEnded: false,
                finalized: false,
                players: new Set(),
                setBy: {}
            });
        }

        const state = this.gameStates.get(roomId);

        // Prevent changes if already finalized
        if (state.finalized) {
            logger.warn(`[Betting] Room ${roomId}: Already finalized, ignoring game end`);
            return;
        }

        state.gameEnded = true;
        state.setBy.ended = userId;

        // Check if we can finalize
        this.checkAndFinalize(roomId);
    }

    /**
     * Check if game can be finalized and do so
     * @param {string} roomId - Room ID
     */
    async checkAndFinalize(roomId) {
        const state = this.gameStates.get(roomId);

        if (!state) {
            logger.error(`[Betting] Room ${roomId}: No state found`);
            return;
        }

        // Check if both conditions met
        if (state.winner !== null && state.gameEnded && !state.finalized) {
            logger.info(`[Betting] Room ${roomId}: Both conditions met, finalizing...`);

            // Mark as finalized immediately to prevent duplicate calls
            state.finalized = true;
            state.finalizedAt = Date.now();

            try {
                await this.finalizeGame(roomId, state);
            } catch (error) {
                logger.error(`[Betting] Room ${roomId}: Finalization error: ${error.message}`);
                // Reset finalized flag on error so it can be retried
                state.finalized = false;
            }
        }
    }

    /**
     * Finalize game by calling backend API
     * @param {string} roomId - Room ID
     * @param {object} state - Game state
     */
    async finalizeGame(roomId, state) {
        logger.info(`[Betting] Room ${roomId}: Calling backend API...`);

        const url = `${this.apiUrl}/game/report-result`;

        // Prepare winner user IDs
        let winnerUserIds = [];
        if (Array.isArray(state.winner)) {
            winnerUserIds = state.winner.filter(id => id && id !== 'null');
        }

        const payload = {
            roomId: roomId,
            winnerUserIds: winnerUserIds,
            source: 'cloud_server',
            metadata: {
                setBy: state.setBy,
                finalizedAt: state.finalizedAt,
                playerCount: state.players.size
            }
        };

        logger.info(`[Betting] Room ${roomId}: Payload:`, JSON.stringify(payload, null, 2));

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.serverToken}`,
                    'X-Cloud-Server': 'true'
                },
                body: JSON.stringify(payload),
                timeout: 30000 // 30 second timeout
            });

            const responseText = await response.text();
            logger.info(`[Betting] Room ${roomId}: Response status: ${response.status}`);
            logger.info(`[Betting] Room ${roomId}: Response body: ${responseText}`);

            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${responseText}`);
            }

            const result = JSON.parse(responseText);

            if (result.success) {
                logger.info(`[Betting] Room ${roomId}: ✅ Game finalized successfully`);
                logger.info(`[Betting] Room ${roomId}: Transaction hash: ${result.data?.transactionHash || 'N/A'}`);

                // Store result for broadcast
                state.result = result;

                return result;
            } else {
                throw new Error(`API returned error: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            logger.error(`[Betting] Room ${roomId}: ❌ API call failed: ${error.message}`);
            logger.error(`[Betting] Room ${roomId}: Stack trace: ${error.stack}`);
            throw error;
        }
    }

    /**
     * Add a player to room tracking
     * @param {string} roomId - Room ID
     * @param {string} userId - User ID
     */
    addPlayer(roomId, userId) {
        if (!this.gameStates.has(roomId)) {
            this.gameStates.set(roomId, {
                winner: null,
                gameEnded: false,
                finalized: false,
                players: new Set(),
                setBy: {}
            });
        }

        const state = this.gameStates.get(roomId);
        state.players.add(userId);

        logger.debug(`[Betting] Room ${roomId}: Player ${userId} added (total: ${state.players.size})`);
    }

    /**
     * Remove a player from room tracking
     * @param {string} roomId - Room ID
     * @param {string} userId - User ID
     */
    removePlayer(roomId, userId) {
        const state = this.gameStates.get(roomId);
        if (state) {
            state.players.delete(userId);
            logger.debug(`[Betting] Room ${roomId}: Player ${userId} removed (total: ${state.players.size})`);
        }
    }

    /**
     * Clean up old game states (called periodically)
     * @param {number} maxAge - Maximum age in milliseconds (default 1 hour)
     */
    cleanupOldGames(maxAge = 60 * 60 * 1000) {
        const now = Date.now();
        let cleaned = 0;

        for (const [roomId, state] of this.gameStates.entries()) {
            // Remove if finalized and old enough
            if (state.finalized && state.finalizedAt && (now - state.finalizedAt) > maxAge) {
                this.gameStates.delete(roomId);
                cleaned++;
                logger.debug(`[Betting] Cleaned up old game: ${roomId}`);
            }
        }

        if (cleaned > 0) {
            logger.info(`[Betting] Cleaned up ${cleaned} old game(s)`);
        }
    }

    /**
     * Get game state for debugging
     * @param {string} roomId - Room ID
     * @returns {object|null} Game state
     */
    getGameState(roomId) {
        return this.gameStates.get(roomId) || null;
    }

    /**
     * Get all game states for debugging
     * @returns {Map} All game states
     */
    getAllGameStates() {
        return this.gameStates;
    }
}

// Create singleton instance
const bettingHandler = new BettingHandler();

// Start cleanup interval (every 10 minutes)
setInterval(() => {
    bettingHandler.cleanupOldGames();
}, 10 * 60 * 1000);

module.exports = bettingHandler;
