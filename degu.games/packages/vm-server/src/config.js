/**
 * Configuration Module
 *
 * Centralized configuration from environment variables
 */

require('dotenv').config();

const config = {
    // Server
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Capacity
    maxConcurrentGames: parseInt(process.env.MAX_CONCURRENT_GAMES || '200'),
    maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE || '1000'),

    // Performance
    stateBroadcastFPS: parseInt(process.env.STATE_BROADCAST_FPS || '20'),
    inputRateLimit: parseInt(process.env.INPUT_RATE_LIMIT || '100'),

    // Backend Integration
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3000/api/v1',
    vmServerToken: process.env.VM_SERVER_TOKEN || '',

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || './logs/vm-server.log',

    // Project Storage
    projectStoragePath: process.env.PROJECT_STORAGE_PATH || './projects',
    projectApiUrl: process.env.PROJECT_API_URL || null,

    // Computed values
    get stateBroadcastInterval() {
        return Math.floor(1000 / this.stateBroadcastFPS);
    },

    // Validation
    validate() {
        const errors = [];

        if (!this.vmServerToken) {
            errors.push('VM_SERVER_TOKEN is required');
        }

        if (this.maxConcurrentGames < 1) {
            errors.push('MAX_CONCURRENT_GAMES must be >= 1');
        }

        if (this.maxQueueSize < 0) {
            errors.push('MAX_QUEUE_SIZE must be >= 0');
        }

        if (this.stateBroadcastFPS < 1 || this.stateBroadcastFPS > 60) {
            errors.push('STATE_BROADCAST_FPS must be between 1 and 60');
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
    }
};

// Validate on load
config.validate();

module.exports = config;
