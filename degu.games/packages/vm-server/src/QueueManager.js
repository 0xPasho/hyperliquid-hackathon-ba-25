/**
 * QueueManager - Manages waiting queue for games
 *
 * When server is at capacity, games are queued
 */

const EventEmitter = require('events');
const logger = require('./logger');
const config = require('./config');

class QueueManager extends EventEmitter {
    constructor() {
        super();

        // Queue storage: Array of {roomId, projectData, players, addedAt}
        this.queue = [];

        // Max queue size
        this.maxSize = config.maxQueueSize;

        logger.info(`[QueueManager] Initialized with max size: ${this.maxSize}`);
    }

    /**
     * Add a game to the queue
     * @param {string} roomId - Room ID
     * @param {object} projectData - Scratch project data
     * @param {array} players - Player user IDs
     * @returns {number} Position in queue (1-indexed)
     */
    add(roomId, projectData, players) {
        // Check if queue is full
        if (this.queue.length >= this.maxSize) {
            logger.warn(`[QueueManager] Queue full, rejecting room ${roomId}`);
            throw new Error('Queue is full');
        }

        // Check if already in queue
        const existing = this.queue.find(item => item.roomId === roomId);
        if (existing) {
            logger.warn(`[QueueManager] Room ${roomId} already in queue`);
            return this.getPosition(roomId);
        }

        // Add to queue
        const queueItem = {
            roomId,
            projectData,
            players,
            addedAt: Date.now()
        };

        this.queue.push(queueItem);

        const position = this.queue.length;

        logger.info(`[QueueManager] Added room ${roomId} to queue (position: ${position})`);

        this.emit('added', { roomId, position });

        return position;
    }

    /**
     * Remove a game from the queue
     * @param {string} roomId - Room ID
     * @returns {boolean} Success
     */
    remove(roomId) {
        const index = this.queue.findIndex(item => item.roomId === roomId);

        if (index === -1) {
            return false;
        }

        this.queue.splice(index, 1);

        logger.info(`[QueueManager] Removed room ${roomId} from queue`);

        this.emit('removed', { roomId });

        return true;
    }

    /**
     * Get position of a room in queue
     * @param {string} roomId - Room ID
     * @returns {number|null} Position (1-indexed) or null if not in queue
     */
    getPosition(roomId) {
        const index = this.queue.findIndex(item => item.roomId === roomId);

        if (index === -1) {
            return null;
        }

        return index + 1; // 1-indexed
    }

    /**
     * Get next game in queue
     * @returns {object|null} Queue item or null if empty
     */
    getNext() {
        if (this.queue.length === 0) {
            return null;
        }

        return this.queue[0];
    }

    /**
     * Process next game in queue (remove and return it)
     * @returns {object|null} Queue item or null if empty
     */
    processNext() {
        if (this.queue.length === 0) {
            return null;
        }

        const item = this.queue.shift();

        const waitTime = Math.floor((Date.now() - item.addedAt) / 1000);

        logger.info(`[QueueManager] Processing room ${item.roomId} (waited ${waitTime}s)`);

        this.emit('processed', { roomId: item.roomId, waitTime });

        return item;
    }

    /**
     * Get queue length
     * @returns {number}
     */
    getLength() {
        return this.queue.length;
    }

    /**
     * Check if queue is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.queue.length === 0;
    }

    /**
     * Check if queue is full
     * @returns {boolean}
     */
    isFull() {
        return this.queue.length >= this.maxSize;
    }

    /**
     * Get queue statistics
     * @returns {object}
     */
    getStats() {
        if (this.queue.length === 0) {
            return {
                length: 0,
                oldest: null,
                newest: null,
                avgWaitTime: 0
            };
        }

        const now = Date.now();
        const waitTimes = this.queue.map(item => (now - item.addedAt) / 1000);
        const avgWaitTime = waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length;

        return {
            length: this.queue.length,
            oldest: this.queue[0].roomId,
            newest: this.queue[this.queue.length - 1].roomId,
            avgWaitTime: Math.floor(avgWaitTime)
        };
    }

    /**
     * Clear queue (admin only)
     */
    clear() {
        const count = this.queue.length;
        this.queue = [];

        logger.warn(`[QueueManager] Queue cleared (${count} items removed)`);

        this.emit('cleared', { count });
    }
}

module.exports = QueueManager;
