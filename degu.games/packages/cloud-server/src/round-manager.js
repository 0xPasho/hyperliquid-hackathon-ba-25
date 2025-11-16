/**
 * Round Manager
 *
 * Manages multi-round games including:
 * - Best-of-N games
 * - Tournament brackets
 * - Ranked/points-based games
 * - Single-round games (backward compatible)
 */

const logger = require('./logger');

class RoundManager {
    constructor() {
        // Track rounds per room
        // {
        //   roomId: {
        //     gameMode: 'single' | 'best-of-3' | 'best-of-5' | 'tournament' | 'ranked',
        //     maxRounds: number,
        //     currentRound: number,
        //     rounds: [
        //       {
        //         roundNumber: number,
        //         rankings: [{userId, rank, score, metadata}],
        //         startedAt: timestamp,
        //         endedAt: timestamp,
        //         duration: number
        //       }
        //     ],
        //     players: Set,
        //     finalRankings: null | array
        //   }
        // }
        this.gameRounds = new Map();

        logger.info('[RoundManager] Initialized');
    }

    /**
     * Initialize a game with rounds configuration
     * @param {string} roomId - Room ID
     * @param {object} config - Game configuration
     */
    initializeGame(roomId, config = {}) {
        const {
            gameMode = 'single',
            maxRounds = 1,
            rankingMethod = 'winner-only',
            prizeDistribution = [100]
        } = config;

        const gameData = {
            gameMode,
            maxRounds,
            currentRound: 0,
            rounds: [],
            players: new Set(),
            finalRankings: null,
            rankingMethod,
            prizeDistribution,
            startedAt: null,
            endedAt: null
        };

        this.gameRounds.set(roomId, gameData);

        logger.info(`[RoundManager] Room ${roomId}: Game initialized`);
        logger.info(`[RoundManager] Room ${roomId}: Mode=${gameMode}, MaxRounds=${maxRounds}`);

        return gameData;
    }

    /**
     * Add player to game
     * @param {string} roomId - Room ID
     * @param {string} userId - User ID
     */
    addPlayer(roomId, userId) {
        const game = this.gameRounds.get(roomId);
        if (game) {
            game.players.add(userId);
            logger.debug(`[RoundManager] Room ${roomId}: Player ${userId} added (total: ${game.players.size})`);
        }
    }

    /**
     * Remove player from game
     * @param {string} roomId - Room ID
     * @param {string} userId - User ID
     */
    removePlayer(roomId, userId) {
        const game = this.gameRounds.get(roomId);
        if (game) {
            game.players.delete(userId);
            logger.debug(`[RoundManager] Room ${roomId}: Player ${userId} removed (total: ${game.players.size})`);
        }
    }

    /**
     * Start a round
     * @param {string} roomId - Room ID
     * @param {number} roundNumber - Round number (optional, auto-increments if not provided)
     * @returns {object} Round data
     */
    startRound(roomId, roundNumber = null) {
        const game = this.gameRounds.get(roomId);
        if (!game) {
            logger.error(`[RoundManager] Room ${roomId}: Game not initialized`);
            return null;
        }

        if (game.finalRankings) {
            logger.warn(`[RoundManager] Room ${roomId}: Game already finalized`);
            return null;
        }

        // Auto-increment round number if not provided
        if (roundNumber === null) {
            roundNumber = game.currentRound + 1;
        }

        // Check if round already exists
        const existingRound = game.rounds.find(r => r.roundNumber === roundNumber);
        if (existingRound) {
            logger.warn(`[RoundManager] Room ${roomId}: Round ${roundNumber} already started`);
            return existingRound;
        }

        // Check max rounds
        if (roundNumber > game.maxRounds) {
            logger.error(`[RoundManager] Room ${roomId}: Round ${roundNumber} exceeds max rounds ${game.maxRounds}`);
            return null;
        }

        const round = {
            roundNumber,
            rankings: null,
            startedAt: Date.now(),
            endedAt: null,
            duration: null
        };

        game.rounds.push(round);
        game.currentRound = roundNumber;

        if (!game.startedAt) {
            game.startedAt = Date.now();
        }

        logger.info(`[RoundManager] Room ${roomId}: Round ${roundNumber} started`);

        return round;
    }

    /**
     * End a round with rankings
     * @param {string} roomId - Room ID
     * @param {number} roundNumber - Round number
     * @param {array} rankings - Rankings [{userId, rank, score, metadata}]
     * @param {string} setBy - User who set the rankings
     * @returns {boolean} Success
     */
    endRound(roomId, roundNumber, rankings, setBy) {
        const game = this.gameRounds.get(roomId);
        if (!game) {
            logger.error(`[RoundManager] Room ${roomId}: Game not initialized`);
            return false;
        }

        const round = game.rounds.find(r => r.roundNumber === roundNumber);
        if (!round) {
            logger.error(`[RoundManager] Room ${roomId}: Round ${roundNumber} not found`);
            return false;
        }

        if (round.endedAt) {
            logger.warn(`[RoundManager] Room ${roomId}: Round ${roundNumber} already ended`);
            return false;
        }

        // Validate rankings
        if (!this._validateRankings(rankings, game.players)) {
            logger.error(`[RoundManager] Room ${roomId}: Invalid rankings for round ${roundNumber}`);
            return false;
        }

        round.rankings = rankings;
        round.endedAt = Date.now();
        round.duration = Math.floor((round.endedAt - round.startedAt) / 1000); // seconds
        round.setBy = setBy;

        logger.info(`[RoundManager] Room ${roomId}: Round ${roundNumber} ended`);
        logger.info(`[RoundManager] Room ${roomId}: Duration: ${round.duration}s`);
        logger.info(`[RoundManager] Room ${roomId}: Rankings: ${JSON.stringify(rankings.slice(0, 3))}`);

        return true;
    }

    /**
     * Check if game is complete
     * @param {string} roomId - Room ID
     * @returns {boolean}
     */
    isGameComplete(roomId) {
        const game = this.gameRounds.get(roomId);
        if (!game) {
            return false;
        }

        // Check based on game mode
        switch (game.gameMode) {
            case 'single':
                return game.rounds.length === 1 && game.rounds[0].endedAt !== null;

            case 'best-of-3':
            case 'best-of-5':
            case 'best-of-7': {
                const neededWins = Math.ceil(game.maxRounds / 2);
                const winCounts = this._countWins(game.rounds);
                const maxWins = Math.max(...Object.values(winCounts));
                return maxWins >= neededWins;
            }

            case 'ranked':
            case 'tournament':
                // All rounds must be completed
                return game.rounds.length === game.maxRounds &&
                       game.rounds.every(r => r.endedAt !== null);

            default:
                logger.warn(`[RoundManager] Unknown game mode: ${game.gameMode}`);
                return false;
        }
    }

    /**
     * Calculate final rankings
     * @param {string} roomId - Room ID
     * @returns {array|null} Final rankings
     */
    calculateFinalRankings(roomId) {
        const game = this.gameRounds.get(roomId);
        if (!game) {
            logger.error(`[RoundManager] Room ${roomId}: Game not initialized`);
            return null;
        }

        if (!this.isGameComplete(roomId)) {
            logger.warn(`[RoundManager] Room ${roomId}: Game not complete yet`);
            return null;
        }

        if (game.finalRankings) {
            logger.debug(`[RoundManager] Room ${roomId}: Returning cached final rankings`);
            return game.finalRankings;
        }

        let finalRankings;

        switch (game.gameMode) {
            case 'single':
                // Use rankings from the single round
                finalRankings = game.rounds[0].rankings;
                break;

            case 'best-of-3':
            case 'best-of-5':
            case 'best-of-7':
                // Rank by number of round wins
                finalRankings = this._calculateBestOfRankings(game);
                break;

            case 'ranked':
                // Aggregate scores/points across all rounds
                finalRankings = this._calculateRankedRankings(game);
                break;

            case 'tournament':
                // Use last round rankings (finals)
                finalRankings = game.rounds[game.rounds.length - 1].rankings;
                break;

            default:
                logger.error(`[RoundManager] Room ${roomId}: Unknown game mode: ${game.gameMode}`);
                return null;
        }

        game.finalRankings = finalRankings;
        game.endedAt = Date.now();

        logger.info(`[RoundManager] Room ${roomId}: Final rankings calculated`);
        logger.info(`[RoundManager] Room ${roomId}: Winners: ${JSON.stringify(finalRankings.slice(0, 3))}`);

        return finalRankings;
    }

    /**
     * Get game data for a room
     * @param {string} roomId - Room ID
     * @returns {object|null}
     */
    getGameData(roomId) {
        return this.gameRounds.get(roomId) || null;
    }

    /**
     * Remove game data (cleanup)
     * @param {string} roomId - Room ID
     */
    removeGame(roomId) {
        this.gameRounds.delete(roomId);
        logger.debug(`[RoundManager] Room ${roomId}: Game data removed`);
    }

    /**
     * Validate rankings data
     * @private
     */
    _validateRankings(rankings, players) {
        if (!Array.isArray(rankings)) {
            logger.error('[RoundManager] Rankings must be an array');
            return false;
        }

        if (rankings.length === 0) {
            logger.error('[RoundManager] Rankings cannot be empty');
            return false;
        }

        // Check structure
        for (const ranking of rankings) {
            if (!ranking.userId || ranking.rank === undefined) {
                logger.error('[RoundManager] Invalid ranking structure:', ranking);
                return false;
            }

            // Verify user is in the game
            if (!players.has(ranking.userId)) {
                logger.warn(`[RoundManager] User ${ranking.userId} not in player list`);
                // Allow but warn - player might have disconnected
            }
        }

        // Check ranks are sequential starting from 1
        const ranks = rankings.map(r => r.rank).sort((a, b) => a - b);
        for (let i = 0; i < ranks.length; i++) {
            if (ranks[i] !== i + 1) {
                // Allow ties (same rank)
                if (i > 0 && ranks[i] === ranks[i - 1]) {
                    continue;
                }
                logger.error(`[RoundManager] Ranks must be sequential, found: ${ranks}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Count round wins per player
     * @private
     */
    _countWins(rounds) {
        const winCounts = {};

        for (const round of rounds) {
            if (!round.rankings || round.rankings.length === 0) {
                continue;
            }

            // Winner is rank 1
            const winner = round.rankings.find(r => r.rank === 1);
            if (winner) {
                winCounts[winner.userId] = (winCounts[winner.userId] || 0) + 1;
            }
        }

        return winCounts;
    }

    /**
     * Calculate rankings for best-of-N games
     * @private
     */
    _calculateBestOfRankings(game) {
        const winCounts = this._countWins(game.rounds);

        // Convert to rankings array
        const rankings = Object.entries(winCounts).map(([userId, wins]) => ({
            userId,
            rank: 0, // Will be set below
            score: wins,
            metadata: { roundWins: wins }
        }));

        // Sort by wins (descending)
        rankings.sort((a, b) => b.score - a.score);

        // Assign ranks
        let currentRank = 1;
        for (let i = 0; i < rankings.length; i++) {
            if (i > 0 && rankings[i].score < rankings[i - 1].score) {
                currentRank = i + 1;
            }
            rankings[i].rank = currentRank;
        }

        return rankings;
    }

    /**
     * Calculate rankings for ranked/points games
     * @private
     */
    _calculateRankedRankings(game) {
        const playerScores = {};

        // Aggregate scores across all rounds
        for (const round of game.rounds) {
            if (!round.rankings) {
                continue;
            }

            for (const ranking of round.rankings) {
                if (!playerScores[ranking.userId]) {
                    playerScores[ranking.userId] = 0;
                }
                playerScores[ranking.userId] += ranking.score || 0;
            }
        }

        // Convert to rankings array
        const rankings = Object.entries(playerScores).map(([userId, totalScore]) => ({
            userId,
            rank: 0,
            score: totalScore,
            metadata: { totalScore, roundsPlayed: game.rounds.length }
        }));

        // Sort by total score (descending)
        rankings.sort((a, b) => b.score - a.score);

        // Assign ranks
        let currentRank = 1;
        for (let i = 0; i < rankings.length; i++) {
            if (i > 0 && rankings[i].score < rankings[i - 1].score) {
                currentRank = i + 1;
            }
            rankings[i].rank = currentRank;
        }

        return rankings;
    }

    /**
     * Get statistics
     * @returns {object}
     */
    getStats() {
        return {
            activeGames: this.gameRounds.size,
            gamesByMode: this._getGamesByMode()
        };
    }

    /**
     * Get games grouped by mode
     * @private
     */
    _getGamesByMode() {
        const modeCount = {};

        for (const game of this.gameRounds.values()) {
            modeCount[game.gameMode] = (modeCount[game.gameMode] || 0) + 1;
        }

        return modeCount;
    }
}

// Create singleton instance
const roundManager = new RoundManager();

module.exports = roundManager;
