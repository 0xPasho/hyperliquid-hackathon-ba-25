/**
 * StateSerializer - Extracts and serializes VM state for broadcasting
 *
 * Optimizations:
 * - Delta encoding (only send changes)
 * - Minimal payload size
 * - Efficient JSON structure
 */

const logger = require('./logger');

class StateSerializer {
    constructor() {
        // Previous states for delta encoding
        // Map<roomId, previousState>
        this.previousStates = new Map();

        logger.info('[StateSerializer] Initialized');
    }

    /**
     * Extract full state from VM
     * @param {VirtualMachine} vm - Scratch VM instance
     * @param {string} roomId - Room ID
     * @returns {object|null} State object
     */
    extractState(vm, roomId) {
        try {
            const targets = vm.runtime.targets;
            const sprites = {};
            const variables = {};

            // Extract sprite data
            targets.forEach((target) => {
                if (target.isStage) {
                    // Stage
                    sprites._stage = {
                        backdrop: target.currentCostume,
                        backdropName: target.sprite.costumes[target.currentCostume]?.name || ''
                    };
                } else {
                    // Sprite
                    sprites[target.sprite.name] = {
                        x: Math.round(target.x * 100) / 100, // Round to 2 decimals
                        y: Math.round(target.y * 100) / 100,
                        direction: Math.round(target.direction),
                        costume: target.currentCostume,
                        visible: target.visible,
                        size: Math.round(target.size),
                        rotationStyle: target.rotationStyle
                    };
                }

                // Extract variables (from all targets)
                Object.keys(target.variables).forEach(varId => {
                    const variable = target.variables[varId];
                    // Use variable name as key
                    variables[variable.name] = variable.value;
                });
            });

            const state = {
                sprites,
                variables,
                timestamp: Date.now()
            };

            return state;

        } catch (error) {
            logger.error(`[StateSerializer] Error extracting state for ${roomId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Get state delta (only changes from previous state)
     * @param {object} currentState - Current state
     * @param {string} roomId - Room ID
     * @returns {object} Delta state or full state if no previous
     */
    getDelta(currentState, roomId) {
        const previousState = this.previousStates.get(roomId);

        // First state, return full
        if (!previousState) {
            this.previousStates.set(roomId, currentState);
            return {
                type: 'full',
                ...currentState
            };
        }

        // Calculate delta
        const delta = {
            type: 'delta',
            timestamp: currentState.timestamp,
            sprites: {},
            variables: {}
        };

        let hasChanges = false;

        // Compare sprites
        Object.keys(currentState.sprites).forEach(spriteName => {
            const current = currentState.sprites[spriteName];
            const previous = previousState.sprites[spriteName];

            if (!previous) {
                // New sprite
                delta.sprites[spriteName] = current;
                hasChanges = true;
            } else {
                // Check for changes
                const changes = {};
                let spriteChanged = false;

                Object.keys(current).forEach(key => {
                    if (current[key] !== previous[key]) {
                        changes[key] = current[key];
                        spriteChanged = true;
                    }
                });

                if (spriteChanged) {
                    delta.sprites[spriteName] = changes;
                    hasChanges = true;
                }
            }
        });

        // Compare variables
        Object.keys(currentState.variables).forEach(varName => {
            const current = currentState.variables[varName];
            const previous = previousState.variables[varName];

            if (current !== previous) {
                delta.variables[varName] = current;
                hasChanges = true;
            }
        });

        // Update previous state
        this.previousStates.set(roomId, currentState);

        // If no changes, return null to skip broadcast
        if (!hasChanges) {
            return null;
        }

        return delta;
    }

    /**
     * Serialize state to JSON string
     * @param {object} state - State object
     * @returns {string} JSON string
     */
    serialize(state) {
        return JSON.stringify(state);
    }

    /**
     * Get serialized state (with delta encoding)
     * @param {VirtualMachine} vm - Scratch VM
     * @param {string} roomId - Room ID
     * @param {boolean} useDelta - Use delta encoding (default: true)
     * @returns {string|null} Serialized state or null if no changes
     */
    getSerializedState(vm, roomId, useDelta = true) {
        const fullState = this.extractState(vm, roomId);

        if (!fullState) {
            return null;
        }

        if (useDelta) {
            const delta = this.getDelta(fullState, roomId);

            if (!delta) {
                return null; // No changes
            }

            return this.serialize(delta);
        } else {
            return this.serialize({
                type: 'full',
                ...fullState
            });
        }
    }

    /**
     * Clear previous state for a room (on game end)
     * @param {string} roomId - Room ID
     */
    clearState(roomId) {
        this.previousStates.delete(roomId);
        logger.debug(`[StateSerializer] Cleared state for ${roomId}`);
    }

    /**
     * Get statistics
     * @returns {object}
     */
    getStats() {
        return {
            trackedRooms: this.previousStates.size
        };
    }
}

module.exports = StateSerializer;
