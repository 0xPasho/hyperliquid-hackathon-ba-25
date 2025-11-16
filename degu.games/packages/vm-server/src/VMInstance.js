/**
 * VMInstance - Wrapper for a single Scratch VM
 *
 * Manages lifecycle of one game instance
 */

const EventEmitter = require('events');
const VirtualMachine = require('scratch-vm');
const {ScratchStorage} = require('scratch-storage');
const HeadlessRenderer = require('./HeadlessRenderer');
const logger = require('./logger');

class VMInstance extends EventEmitter {
    constructor(roomId, projectData, players) {
        super();

        this.roomId = roomId;
        this.projectData = projectData;
        this.players = players;

        // VM instance
        this.vm = new VirtualMachine();

        // Game state
        this.winner = null;
        this.ended = false;
        this.startedAt = Date.now();
        this.endedAt = null;

        // Runtime loop
        this.runtimeInterval = null;

        // Setup VM
        this._setupVM();

        logger.info(`[VMInstance] ${roomId}: Created for ${players.length} players`);
    }

    /**
     * Setup VM and load project
     */
    async _setupVM() {
        try {
            // Stub out Web Worker API for Node.js environment
            // This prevents extensions from crashing when they try to use Workers
            global.Worker = class MockWorker {
                constructor() {
                    logger.warn(`[VMInstance] ${this.roomId}: Worker constructor called but stubbed (Node.js environment)`);
                }
                postMessage() {}
                terminate() {}
                addEventListener() {}
                removeEventListener() {}
            };
            logger.info(`[VMInstance] ${this.roomId}: Worker API stubbed for headless mode`);

            // Setup window object for browser-like environment (needed by extensions)
            if (!global.window) {
                global.window = {};
            }

            // Set room context for blockchain extension
            global.window.roomContext = {
                roomId: this.roomId,
                entryFee: 0, // Server doesn't need to know entry fee
                prizePool: 0, // Server doesn't need to know prize pool
                playerCount: this.players.length,
                myUserId: null, // Server has no "my" user
                players: this.players.map(playerId => ({
                    userId: playerId,
                    name: playerId.substring(0, 8), // Short ID as name
                    isHost: false,
                    hasPaid: true // Assume all paid if game started
                })),
                isPaidRoom: false, // Not relevant for server
                tokenSymbol: 'USDC',
                chainId: null
            };

            logger.info(`[VMInstance] ${this.roomId}: Room context set for ${this.players.length} players`);
            logger.info(`[VMInstance] ${this.roomId}: Players: ${this.players.map(p => p.substring(0, 8)).join(', ')}`);

            // Create and attach headless renderer (required for loading SVG costumes)
            const renderer = new HeadlessRenderer();
            this.vm.attachRenderer(renderer);
            logger.info(`[VMInstance] ${this.roomId}: Headless renderer attached`);

            // Create and attach storage (required for loading sprite costumes/assets)
            const storage = new ScratchStorage();
            this.vm.attachStorage(storage);
            logger.info(`[VMInstance] ${this.roomId}: Storage attached`);

            // Setup VM event listeners
            this._setupEventListeners();

            // Load project
            await this.vm.loadProject(this.projectData);

            // Start VM
            this.vm.start();

            // Start runtime loop (30 FPS - executes Scratch blocks)
            this._startRuntimeLoop();

            logger.info(`[VMInstance] ${this.roomId}: Project loaded and VM running at 30 FPS`);

            this.emit('ready');
        } catch (error) {
            logger.error(`[VMInstance] ${this.roomId}: Failed to setup VM: ${error.message}`);
            this.emit('error', error);
        }
    }

    /**
     * Setup event listeners for VM runtime events
     */
    _setupEventListeners() {
        const shortRoom = this.roomId.substring(0, 8);

        // Winner reported
        this.vm.runtime.on('REPORT_WINNER', (data) => {
            logger.info(`[EVENT] 🏆 Winner Reported | Room: ${shortRoom} | Winner: ${data.userId.substring(0, 8)}`);
            this.winner = data.userId;
            this.emit('winner_reported', data);
            this._checkFinalize();
        });

        // Game ended
        this.vm.runtime.on('GAME_ENDED', (data) => {
            logger.info(`[EVENT] 🏁 Game Ended | Room: ${shortRoom}`);
            this.ended = true;
            this.endedAt = Date.now();
            this.emit('game_ended', data);
            this._checkFinalize();
        });

        // Runtime errors
        this.vm.runtime.on('RUNTIME_ERROR', (error) => {
            logger.error(`[EVENT] ❌ Runtime Error | Room: ${shortRoom} | ${error.message}`);
            this.emit('runtime_error', error);
        });

        // Log sprite movements and state changes
        this._setupSpriteMonitoring();

        // Log variable changes
        this._setupVariableMonitoring();

        // Log when project starts
        logger.info(`[VMInstance] 🎮 Game Started | Room: ${shortRoom} | Players: ${this.players.join(', ').substring(0, 40)}`);
    }

    /**
     * Setup monitoring for sprite movements and events
     */
    _setupSpriteMonitoring() {
        const shortRoom = this.roomId.substring(0, 8);
        let lastLogTime = 0;
        const LOG_INTERVAL = 1000; // Log at most once per second to avoid spam

        // Monitor sprite targets
        this.vm.runtime.targets.forEach((target, index) => {
            if (target.isStage) return; // Skip stage

            const spriteName = target.sprite.name;
            let lastX = target.x;
            let lastY = target.y;

            // Override the setXY method to log movements
            const originalSetXY = target.setXY.bind(target);
            target.setXY = (x, y, force) => {
                const result = originalSetXY(x, y, force);

                // Only log significant movements (to avoid spam)
                const moved = Math.abs(x - lastX) > 10 || Math.abs(y - lastY) > 10;
                const now = Date.now();

                if (moved && now - lastLogTime > LOG_INTERVAL) {
                    logger.debug(`[SPRITE] 🎭 "${spriteName}" moved | Room: ${shortRoom} | Position: (${Math.round(x)}, ${Math.round(y)})`);
                    lastX = x;
                    lastY = y;
                    lastLogTime = now;
                }

                return result;
            };

            // Log when sprite is clicked (if using click events)
            logger.debug(`[SPRITE] 👀 Monitoring sprite "${spriteName}" in room ${shortRoom}`);
        });
    }

    /**
     * Setup monitoring for variable changes
     */
    _setupVariableMonitoring() {
        const shortRoom = this.roomId.substring(0, 8);

        // Get all variables from stage
        const stage = this.vm.runtime.getTargetForStage();
        if (!stage) return;

        const variables = stage.variables;

        // Log initial variables
        logger.info(`[VARIABLES] 📊 Found ${Object.keys(variables).length} variable(s) in room ${shortRoom}`);

        // Create a proxy to watch variable changes
        Object.keys(variables).forEach(varId => {
            const variable = variables[varId];
            const varName = variable.name;
            let lastValue = variable.value;

            // Check for changes periodically
            const checkInterval = setInterval(() => {
                if (variable.value !== lastValue) {
                    logger.info(`[VARIABLE] 📈 "${varName}" changed | Room: ${shortRoom} | ${lastValue} → ${variable.value}`);
                    lastValue = variable.value;
                }
            }, 100); // Check every 100ms

            // Store interval for cleanup
            if (!this._variableIntervals) this._variableIntervals = [];
            this._variableIntervals.push(checkInterval);
        });
    }

    /**
     * Start the runtime loop to execute Scratch blocks
     * This is the "game loop" that makes everything run
     */
    _startRuntimeLoop() {
        const FPS = 30; // 30 frames per second
        const FRAME_TIME = 1000 / FPS;

        this.runtimeInterval = setInterval(() => {
            try {
                // Step the VM (executes all Scratch blocks for one frame)
                this.vm.runtime._step();
            } catch (error) {
                logger.error(`[VMInstance] ${this.roomId}: Runtime step error: ${error.message}`);
            }
        }, FRAME_TIME);

        logger.info(`[VMInstance] ${this.roomId}: Runtime loop started at ${FPS} FPS`);
    }

    /**
     * Cleanup and stop VM
     */
    destroy() {
        try {
            // Stop runtime loop (game loop)
            if (this.runtimeInterval) {
                clearInterval(this.runtimeInterval);
                this.runtimeInterval = null;
            }

            // Clear variable monitoring intervals
            if (this._variableIntervals) {
                this._variableIntervals.forEach(interval => clearInterval(interval));
                this._variableIntervals = [];
            }

            // Stop VM
            if (this.vm) {
                this.vm.stopAll();
                this.vm.runtime.dispose();
            }

            // Clear room context from global window
            if (global.window && global.window.roomContext && global.window.roomContext.roomId === this.roomId) {
                global.window.roomContext = null;
                logger.info(`[VMInstance] ${this.roomId.substring(0, 8)}: Cleared room context`);
            }

            // Remove all event listeners
            this.removeAllListeners();

            logger.info(`[VMInstance] 🗑️  Destroyed | Room: ${this.roomId.substring(0, 8)}`);
        } catch (error) {
            logger.error(`[VMInstance] ${this.roomId}: Error during destroy: ${error.message}`);
        }
    }

    /**
     * Check if game can be finalized (both winner and ended are set)
     */
    _checkFinalize() {
        if (this.winner !== null && this.ended && !this.finalized) {
            this.finalized = true;

            const duration = Math.floor((this.endedAt - this.startedAt) / 1000);

            logger.info(`[VMInstance] ${this.roomId}: Game ready to finalize`);
            logger.info(`[VMInstance] ${this.roomId}: Winner: ${this.winner}, Duration: ${duration}s`);

            this.emit('finalize', {
                roomId: this.roomId,
                winner: this.winner,
                duration: duration,
                players: this.players
            });
        }
    }

    /**
     * Inject keyboard input
     * @param {string} key - Key name (e.g., 'space', 'a')
     * @param {boolean} isDown - true for keydown, false for keyup
     * @param {string} userId - User ID of player who pressed the key
     */
    injectKeyboard(key, isDown, userId) {
        try {
            // Store which player triggered this input (for "my user id" block)
            if (userId && global.window && global.window.roomContext) {
                global.window.roomContext.currentPlayerId = userId;
                global.window.roomContext.myUserId = userId; // Also set myUserId for compatibility

                const shortRoom = this.roomId.substring(0, 8);
                const shortUser = userId.substring(0, 8);
                logger.info(`[VMInstance] 🎯 ${shortRoom}: Set current player to ${shortUser} (full: ${userId})`);
            } else {
                logger.warn(`[VMInstance] ${this.roomId.substring(0, 8)}: Cannot set current player - userId=${userId}, window=${!!global.window}, roomContext=${!!(global.window && global.window.roomContext)}`);
            }

            this.vm.runtime.ioDevices.keyboard.postData({
                key: key,
                isDown: isDown
            });
        } catch (error) {
            logger.error(`[VMInstance] ${this.roomId}: Failed to inject keyboard: ${error.message}`);
        }
    }

    /**
     * Inject mouse input
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} isDown - Mouse button state
     * @param {string} userId - User ID of player who moved/clicked the mouse
     */
    injectMouse(x, y, isDown, userId) {
        try {
            // Store which player triggered this input (for "my user id" block)
            if (userId && global.window && global.window.roomContext) {
                global.window.roomContext.currentPlayerId = userId;
                global.window.roomContext.myUserId = userId; // Also set myUserId for compatibility
            }

            this.vm.runtime.ioDevices.mouse.postData({
                x: x,
                y: y,
                isDown: isDown
            });
        } catch (error) {
            logger.error(`[VMInstance] ${this.roomId}: Failed to inject mouse: ${error.message}`);
        }
    }

    /**
     * Get current game state for broadcasting
     * @returns {object} Game state
     */
    getState() {
        try {
            const targets = this.vm.runtime.targets;
            const sprites = {};
            const variables = {};

            // Extract sprite data
            targets.forEach((target, index) => {
                if (target.isStage) {
                    // Stage backdrop
                    sprites.stage = {
                        backdrop: target.currentCostume
                    };
                } else {
                    // Sprite
                    sprites[target.sprite.name] = {
                        x: target.x,
                        y: target.y,
                        direction: target.direction,
                        costume: target.currentCostume,
                        visible: target.visible,
                        size: target.size
                    };
                }

                // Extract variables
                Object.keys(target.variables).forEach(varId => {
                    const variable = target.variables[varId];
                    variables[variable.name] = variable.value;
                });
            });

            return {
                sprites,
                variables,
                timestamp: Date.now()
            };
        } catch (error) {
            logger.error(`[VMInstance] ${this.roomId}: Failed to get state: ${error.message}`);
            return null;
        }
    }

    /**
     * Get game info
     * @returns {object}
     */
    getInfo() {
        return {
            roomId: this.roomId,
            players: this.players,
            winner: this.winner,
            ended: this.ended,
            finalized: this.finalized,
            startedAt: this.startedAt,
            endedAt: this.endedAt,
            duration: this.endedAt ? Math.floor((this.endedAt - this.startedAt) / 1000) : null
        };
    }
}

module.exports = VMInstance;
