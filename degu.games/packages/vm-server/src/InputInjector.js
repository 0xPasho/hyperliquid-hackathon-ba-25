/**
 * InputInjector - Handles player input injection with rate limiting
 *
 * Features:
 * - Rate limiting per player
 * - Input validation
 * - Support for keyboard and mouse
 */

const logger = require("./logger");
const config = require("./config");

class InputInjector {
    constructor() {
        // Rate limiting: Map<userId, {count, resetAt}>
        this.rateLimits = new Map();

        // Rate limit: inputs per second
        this.rateLimit = config.inputRateLimit;

        // Reset interval (1 second)
        this.resetInterval = 1000;

        logger.info(
            `[InputInjector] Initialized with rate limit: ${this.rateLimit}/sec`
        );
    }

    /**
     * Check rate limit for a user
     * @param {string} userId - User ID
     * @returns {boolean} true if allowed, false if rate limited
     */
    checkRateLimit(userId) {
        // @TODO: Keep as true unless told differently for now, keep the logic too
        return true;
        const now = Date.now();
        const limit = this.rateLimits.get(userId);

        if (!limit) {
            // First input from this user
            this.rateLimits.set(userId, {
                count: 1,
                resetAt: now + this.resetInterval,
            });
            return true;
        }

        // Check if reset time passed
        if (now >= limit.resetAt) {
            // Reset counter
            limit.count = 1;
            limit.resetAt = now + this.resetInterval;
            return true;
        }

        // Check if under limit
        if (limit.count < this.rateLimit) {
            limit.count++;
            return true;
        }

        // Rate limited
        return false;
    }

    /**
     * Inject keyboard input into VM
     * @param {VMInstance} vmInstance - VM instance
     * @param {string} userId - User ID
     * @param {object} input - Input data {action: 'keydown'|'keyup', key: string}
     * @returns {boolean} Success
     */
    injectKeyboard(vmInstance, userId, input) {
        // Validate input
        if (!input.action || !input.key) {
            logger.warn(
                `[InputInjector] Invalid keyboard input from ${userId}`
            );
            return false;
        }

        if (!["keydown", "keyup"].includes(input.action)) {
            logger.warn(
                `[InputInjector] Invalid keyboard action: ${input.action}`
            );
            return false;
        }

        // Check rate limit
        if (!this.checkRateLimit(userId)) {
            logger.warn(`[InputInjector] Rate limited user ${userId}`);
            return false;
        }

        // Inject into VM (pass userId so VM knows which player triggered the input)
        try {
            const isDown = input.action === "keydown";
            vmInstance.injectKeyboard(input.key, isDown, userId);

            logger.debug(
                `[InputInjector] ${vmInstance.roomId}: ${userId.substring(0, 8)} ${input.action} ${input.key}`
            );

            return true;
        } catch (error) {
            logger.error(
                `[InputInjector] Error injecting keyboard: ${error.message}`
            );
            return false;
        }
    }

    /**
     * Inject mouse input into VM
     * @param {VMInstance} vmInstance - VM instance
     * @param {string} userId - User ID
     * @param {object} input - Input data {x, y, isDown}
     * @returns {boolean} Success
     */
    injectMouse(vmInstance, userId, input) {
        // Validate input
        if (typeof input.x !== "number" || typeof input.y !== "number") {
            logger.warn(`[InputInjector] Invalid mouse input from ${userId}`);
            return false;
        }

        // Check rate limit
        if (!this.checkRateLimit(userId)) {
            logger.warn(`[InputInjector] Rate limited user ${userId}`);
            return false;
        }

        // Inject into VM (pass userId so VM knows which player triggered the input)
        try {
            vmInstance.injectMouse(input.x, input.y, input.isDown, userId);

            logger.debug(
                `[InputInjector] ${vmInstance.roomId}: ${userId.substring(0, 8)} mouse (${input.x}, ${input.y})`
            );

            return true;
        } catch (error) {
            logger.error(
                `[InputInjector] Error injecting mouse: ${error.message}`
            );
            return false;
        }
    }

    /**
     * Inject input (auto-detect type)
     * @param {VMInstance} vmInstance - VM instance
     * @param {string} userId - User ID
     * @param {object} input - Input data
     * @returns {boolean} Success
     */
    inject(vmInstance, userId, input) {
        if (!input.type) {
            logger.warn(
                `[InputInjector] No input type specified from ${userId}`
            );
            return false;
        }

        switch (input.type) {
            case "keyboard":
                return this.injectKeyboard(vmInstance, userId, input);

            case "mouse":
                return this.injectMouse(vmInstance, userId, input);

            default:
                logger.warn(
                    `[InputInjector] Unknown input type: ${input.type}`
                );
                return false;
        }
    }

    /**
     * Clear rate limits for a user (on disconnect)
     * @param {string} userId - User ID
     */
    clearRateLimit(userId) {
        this.rateLimits.delete(userId);
    }

    /**
     * Cleanup old rate limit entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for (const [userId, limit] of this.rateLimits.entries()) {
            // Remove if not used in last 5 minutes
            if (now - limit.resetAt > 5 * 60 * 1000) {
                this.rateLimits.delete(userId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(
                `[InputInjector] Cleaned up ${cleaned} stale rate limit entries`
            );
        }
    }

    /**
     * Get statistics
     * @returns {object}
     */
    getStats() {
        return {
            trackedUsers: this.rateLimits.size,
            rateLimit: this.rateLimit,
        };
    }
}

module.exports = InputInjector;
