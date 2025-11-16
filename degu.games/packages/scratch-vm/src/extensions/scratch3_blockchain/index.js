const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const formatMessage = require("format-message");

// Get auth manager dynamically from window
function getAuthManager() {
    if (typeof window !== "undefined" && window.authManager) {
        return window.authManager;
    }
    return null;
}

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
const blockIconURI =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjNTc1RTc1Ij48cGF0aCBkPSJNMjAgNEwxMCAxMGwxMCA2IDEwLTZ6Ii8+PHBhdGggZD0iTTEwIDIybDEwIDZ2OGwtMTAtNnYtOHptMjAgMHYxMGwtMTAgNnYtOGwxMC02eiIvPjwvZz48L3N2Zz4=";

/**
 * Room-based betting blocks for Scratch 3.0
 * Games are created from web/API with room context passed to Scratch
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3BlockchainBlocks {
    constructor(runtime) {
        this.runtime = runtime;

        // Room context passed from backend when game loads
        // Contains all room information and player data
        this._roomContext = {
            roomId: null,
            entryFee: 0,
            prizePool: 0,
            playerCount: 0,
            players: [], // Array of {userId, username}
            myUserId: null,
        };

        // Cloud variable state (hidden from users)
        this._cloudState = {
            winner: null,
            gameEnded: false,
            connected: false,
        };

        // Load room context from URL parameters or window object
        this._loadRoomContext();

        // Connect to cloud variable server if room context exists
        // ONLY in browser environment (not in server-side VM)
        if (this._roomContext.roomId && this._isClientSide()) {
            this._connectToCloudServer();
        } else if (this._roomContext.roomId) {
            console.log("[Betting] Running in server-side VM - skipping cloud server connection");
        }

        // Listen for room context updates via postMessage (browser only)
        if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
            window.addEventListener("message", (event) => {
                if (event.data && event.data.type === "ROOM_CONTEXT") {
                    console.log(
                        "[Betting] Received ROOM_CONTEXT update via postMessage"
                    );
                    // Reload room context - window.roomContext should now be set
                    this._loadRoomContext();

                    // Connect to cloud server if not already connected (client-side only)
                    if (
                        this._roomContext.roomId &&
                        !this._cloudState.connected &&
                        this._isClientSide()
                    ) {
                        this._connectToCloudServer();
                    }
                }
            });
        } else if (typeof window === "undefined") {
            console.log("[Betting] Running in Node.js environment (no postMessage support)");
        }

        // Clean up on disposal
        this.runtime.on("RUNTIME_DISPOSED", () => {
            this._cleanup();
        });
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: "betting",
            name: formatMessage({
                id: "betting.categoryName",
                default: "Betting",
                description: "Label for the betting extension category",
            }),
            blockIconURI: blockIconURI,
            color1: "#9966FF",
            color2: "#774DCB",
            color3: "#774DCB",
            blocks: [
                // === USER INFO BLOCKS ===
                {
                    opcode: "getMyUserId",
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "betting.getMyUserId",
                        default: "my user id",
                        description: "Get current user ID",
                    }),
                },
                {
                    opcode: "getMyUsername",
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "betting.getMyUsername",
                        default: "my username",
                        description: "Get current username",
                    }),
                },

                "---", // Separator

                // === ROOM INFO BLOCKS (SENSING) ===
                {
                    opcode: "getRoomPlayerCount",
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "betting.getRoomPlayerCount",
                        default: "room player count",
                        description: "Number of players in current room",
                    }),
                },
                {
                    opcode: "getRoomEntryFee",
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "betting.getRoomEntryFee",
                        default: "room entry fee",
                        description: "Entry fee for current room (USDC)",
                    }),
                },
                {
                    opcode: "getRoomPrizePool",
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "betting.getRoomPrizePool",
                        default: "room prize pool",
                        description:
                            "Prize pool for current room (USDC after fees)",
                    }),
                },
                {
                    opcode: "getRoomId",
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "betting.getRoomId",
                        default: "room id",
                        description: "Current room ID",
                    }),
                },
                {
                    opcode: "getRoomPlayers",
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "betting.getRoomPlayers",
                        default: "room players",
                        description:
                            "List of player usernames (comma-separated)",
                    }),
                },
                {
                    opcode: "getPlayerUsername",
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "betting.getPlayerUsername",
                        default: "player [USERID] username",
                        description: "Get username for player by user ID",
                    }),
                    arguments: {
                        USERID: {
                            type: ArgumentType.STRING,
                            defaultValue: "",
                        },
                    },
                },

                "---", // Separator

                // === GAME RESULT BLOCKS (EVENTS) ===
                {
                    opcode: "reportWinner",
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: "betting.reportWinner",
                        default: "report winner [USERID]",
                        description: "Report single winner by user ID",
                    }),
                    arguments: {
                        USERID: {
                            type: ArgumentType.STRING,
                            defaultValue: "",
                        },
                    },
                },
                {
                    opcode: "reportWinners",
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: "betting.reportWinners",
                        default: "report winners [USERIDS]",
                        description:
                            "Report multiple winners by user IDs (comma-separated)",
                    }),
                    arguments: {
                        USERIDS: {
                            type: ArgumentType.STRING,
                            defaultValue: "",
                        },
                    },
                },
                {
                    opcode: "reportNoWinners",
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: "betting.reportNoWinners",
                        default: "report no winners",
                        description: "Report that nobody won (house wins)",
                    }),
                },
                {
                    opcode: "endGame",
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: "betting.endGame",
                        default: "end game",
                        description: "End the game session",
                    }),
                },
            ],
            menus: {},
        };
    }

    // ========== HELPER METHODS ==========

    /**
     * Check if running in client-side (browser) vs server-side (Node.js)
     * @returns {boolean} true if client-side, false if server-side
     */
    _isClientSide() {
        // Check if we're in a real browser environment (not JSDOM in VM server)
        // Server-side VM uses JSDOM which provides window/document/navigator
        // but won't have real browser-only APIs like localStorage in same way
        if (typeof window === "undefined") return false;

        // Check for Node.js process (server-side)
        if (typeof process !== "undefined" && process.versions && process.versions.node) {
            return false;
        }

        // Check for JSDOM-specific markers
        if (window.name === "nodejs" || window.constructor.name === "DOMWindow") {
            return false;
        }

        return true;
    }

    /**
     * Load room context from URL parameters or window object
     * Called on initialization to get room data passed from backend
     */
    _loadRoomContext() {
        try {
            console.log("[Betting] Loading room context...");
            console.log("[Betting] window exists:", typeof window !== "undefined");
            console.log("[Betting] window.roomContext exists:", typeof window !== "undefined" && !!window.roomContext);

            // Try to get room context from window (set by backend)
            if (typeof window !== "undefined" && window.roomContext) {
                this._roomContext = {
                    ...this._roomContext,
                    ...window.roomContext,
                };
                console.log(
                    "[Betting] ✅ Room context loaded from window:",
                    this._roomContext
                );
                return;
            }

            // Try to get from URL parameters
            if (typeof window !== "undefined" && window.location) {
                const params = new URLSearchParams(window.location.search);

                if (params.has("roomId")) {
                    this._roomContext.roomId = params.get("roomId");
                    this._roomContext.entryFee = parseFloat(
                        params.get("entryFee") || "0"
                    );
                    this._roomContext.prizePool = parseFloat(
                        params.get("prizePool") || "0"
                    );
                    this._roomContext.playerCount = parseInt(
                        params.get("playerCount") || "0",
                        10
                    );
                    this._roomContext.myUserId = params.get("myUserId") || null;

                    // Parse players array if provided as JSON
                    if (params.has("players")) {
                        try {
                            this._roomContext.players = JSON.parse(
                                params.get("players")
                            );
                        } catch (e) {
                            console.error(
                                "[Betting] Failed to parse players:",
                                e
                            );
                        }
                    }

                    console.log(
                        "[Betting] ✅ Room context loaded from URL:",
                        this._roomContext
                    );
                    return;
                }
            }

            // If we get here, no room context was found
            if (!this._roomContext.roomId) {
                console.warn(
                    "[Betting] ⚠️  No room context found. Game may not function properly."
                );
                console.warn("[Betting] Current context:", this._roomContext);
            }
        } catch (error) {
            console.error("[Betting] Error loading room context:", error);
        }
    }

    /**
     * Call game API endpoint
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request data
     * @returns {Promise<object>} API response
     */
    async _callGameAPI(endpoint, data) {
        const authManager = getAuthManager();

        if (!authManager) {
            throw new Error("Auth manager not available");
        }

        // Get API base URL from auth manager or use default
        const apiBaseUrl =
            authManager.apiBaseUrl || "http://localhost:3000/api";
        const url = `${apiBaseUrl}${endpoint}`;

        console.log(`[Betting] Calling API: ${endpoint}`, data);

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authManager.getToken()}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `API request failed: ${response.statusText} - ${errorText}`
                );
            }

            const result = await response.json();
            console.log(`[Betting] API response:`, result);
            return result;
        } catch (error) {
            console.error(`[Betting] API error:`, error);
            throw error;
        }
    }

    /**
     * Cleanup method
     */
    _cleanup() {
        // Disconnect from cloud server
        if (this._cloudWs && this._cloudWs.readyState === WebSocket.OPEN) {
            this._cloudWs.close();
            console.log("[Betting] Disconnected from cloud server");
        }
        console.log("[Betting] Extension cleaned up");
    }

    /**
     * Connect to cloud variable server
     */
    _connectToCloudServer() {
        // Check if WebSocket is available
        if (typeof WebSocket === "undefined") {
            console.warn(
                "[Betting] WebSocket not available, cloud variables disabled"
            );
            return;
        }

        const cloudServerUrl = "https://localhost:8080";
        //process.env.CLOUD_SERVER_URL || "ws://localhost:8080";
        const url = `${cloudServerUrl}?roomId=${this._roomContext.roomId}&userId=${this._roomContext.myUserId}`;

        console.log("[Betting] Connecting to cloud server:", url);

        try {
            this._cloudWs = new WebSocket(url);

            this._cloudWs.onopen = () => {
                console.log("[Betting] ✅ Connected to cloud server");
                this._cloudState.connected = true;
            };

            this._cloudWs.onmessage = (event) => {
                this._handleCloudMessage(event.data);
            };

            this._cloudWs.onerror = (error) => {
                console.error("[Betting] Cloud server error:", error);
                this._cloudState.connected = false;
            };

            this._cloudWs.onclose = () => {
                console.log("[Betting] Disconnected from cloud server");
                this._cloudState.connected = false;
            };
        } catch (error) {
            console.error(
                "[Betting] Failed to connect to cloud server:",
                error
            );
        }
    }

    /**
     * Handle messages from cloud server
     */
    _handleCloudMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log("[Betting] Cloud message received:", message);

            if (message.type === "game_complete") {
                console.log("[Betting] 🎉 Game completed via cloud server");
                this.runtime.emit("BETTING_GAME_COMPLETED_CLOUD", message);

                // Optionally redirect if URL provided
                if (message.redirectUrl && typeof window !== "undefined") {
                    setTimeout(() => {
                        window.location.href = message.redirectUrl;
                    }, 2000); // 2 second delay to show completion
                }
            }
        } catch (error) {
            console.error("[Betting] Error parsing cloud message:", error);
        }
    }

    /**
     * Set a cloud variable (hidden from users)
     * @param {string} name - Variable name
     * @param {string} value - Variable value
     */
    async _setCloudVariable(name, value) {
        if (!this._cloudState.connected || !this._cloudWs) {
            console.warn("[Betting] Cloud variables not available");
            return false;
        }

        try {
            // Send cloud variable update to server
            this._cloudWs.send(
                JSON.stringify({
                    method: "set",
                    name: name,
                    value: String(value),
                    timestamp: Date.now(),
                })
            );

            console.log(`[Betting] Cloud variable set: ${name} = ${value}`);
            return true;
        } catch (error) {
            console.error("[Betting] Error setting cloud variable:", error);
            return false;
        }
    }

    // ========== USER INFO BLOCK IMPLEMENTATIONS ==========

    /**
     * Get current user ID
     * @returns {string} user ID or empty string
     */
    getMyUserId() {
        console.log("[Betting] 🔍 getMyUserId() called");

        // In browser: use auth manager
        const authManager = getAuthManager();
        if (authManager && authManager.isAuthenticated()) {
            const user = authManager.getUser();
            if (user?.id) {
                console.log("[Betting] ✅ getMyUserId from authManager:", user.id.substring(0, 8));
                return user.id;
            }
        }

        // In server VM: check global.window.roomContext directly (updated during input injection)
        // IMPORTANT: Don't use cached this._roomContext, check global directly!
        if (typeof window !== "undefined" && window.roomContext) {
            console.log("[Betting] Checking window.roomContext - myUserId:", window.roomContext.myUserId ? window.roomContext.myUserId.substring(0, 8) : "null");
            console.log("[Betting] Checking window.roomContext - currentPlayerId:", window.roomContext.currentPlayerId ? window.roomContext.currentPlayerId.substring(0, 8) : "null");

            if (window.roomContext.myUserId) {
                console.log("[Betting] ✅ getMyUserId from window.roomContext.myUserId:", window.roomContext.myUserId.substring(0, 8));
                return window.roomContext.myUserId;
            }
            if (window.roomContext.currentPlayerId) {
                console.log("[Betting] ✅ getMyUserId from window.roomContext.currentPlayerId:", window.roomContext.currentPlayerId.substring(0, 8));
                return window.roomContext.currentPlayerId;
            }
        }

        // Fallback: check cached context
        if (this._roomContext.myUserId) {
            console.log("[Betting] ✅ getMyUserId from cached this._roomContext.myUserId:", this._roomContext.myUserId.substring(0, 8));
            return this._roomContext.myUserId;
        }

        if (this._roomContext.currentPlayerId) {
            console.log("[Betting] ✅ getMyUserId from cached this._roomContext.currentPlayerId:", this._roomContext.currentPlayerId.substring(0, 8));
            return this._roomContext.currentPlayerId;
        }

        console.error("[Betting] ❌ getMyUserId: No user ID available!");
        console.error("[Betting] - authManager:", authManager ? "exists" : "null");
        console.error("[Betting] - authManager.isAuthenticated:", authManager ? authManager.isAuthenticated() : "N/A");
        console.error("[Betting] - window defined:", typeof window !== "undefined");
        console.error("[Betting] - window.roomContext:", typeof window !== "undefined" && window.roomContext ? JSON.stringify(window.roomContext, null, 2) : "null");
        console.error("[Betting] - this._roomContext:", this._roomContext);
        return "";
    }

    /**
     * Get current username
     * @returns {string} username or empty string
     */
    getMyUsername() {
        const authManager = getAuthManager();

        if (!authManager || !authManager.isAuthenticated()) {
            return "";
        }

        const user = authManager.getUser();
        return user?.username || user?.name || "";
    }

    // ========== ROOM INFO BLOCK IMPLEMENTATIONS ==========

    /**
     * Get room player count
     * @returns {number} number of players in room
     */
    getRoomPlayerCount() {
        return this._roomContext.playerCount || 0;
    }

    /**
     * Get room entry fee
     * @returns {number} entry fee in USDC
     */
    getRoomEntryFee() {
        return this._roomContext.entryFee || 0;
    }

    /**
     * Get room prize pool
     * @returns {number} prize pool in USDC (after fees)
     */
    getRoomPrizePool() {
        return this._roomContext.prizePool || 0;
    }

    /**
     * Get room ID
     * @returns {string} room ID
     */
    getRoomId() {
        return this._roomContext.roomId || "";
    }

    /**
     * Get room players list
     * @returns {string} comma-separated list of player usernames
     */
    getRoomPlayers() {
        if (
            !this._roomContext.players ||
            this._roomContext.players.length === 0
        ) {
            return "";
        }

        return this._roomContext.players.map((p) => p.username).join(", ");
    }

    /**
     * Get player username by user ID
     * @param {object} args - block arguments
     * @returns {string} username
     */
    getPlayerUsername(args) {
        const userId = args.USERID;

        if (
            !this._roomContext.players ||
            this._roomContext.players.length === 0
        ) {
            return "";
        }

        // Find player with this user ID
        const player = this._roomContext.players.find(
            (p) => p.userId === userId
        );
        return player ? player.username : "";
    }

    // ========== GAME RESULT BLOCK IMPLEMENTATIONS ==========

    /**
     * Report single winner by user ID
     * @param {object} args - block arguments
     * @returns {Promise}
     */
    async reportWinner(args) {
        const userId = args.USERID;

        const shortRoom = this._roomContext.roomId ? this._roomContext.roomId.substring(0, 8) : 'null';
        const shortUser = userId ? userId.substring(0, 8) : 'null';
        console.log(
            `[Betting] 🏆 Reporting winner: user ${shortUser} (full: ${userId}) in room ${shortRoom}`
        );
        console.log(
            `[Betting] Current context - myUserId: ${this._roomContext.myUserId?.substring(0, 8)}, currentPlayerId: ${this._roomContext.currentPlayerId?.substring(0, 8)}`
        );

        if (!this._roomContext.roomId) {
            console.error("[Betting] ❌ No room context available");
            return;
        }

        if (!userId) {
            console.error("[Betting] ❌ No user ID provided");
            return;
        }

        // EMIT EVENT for server-side VM
        // This is picked up by the VM server instance
        this.runtime.emit("REPORT_WINNER", {
            userId: userId,
            roomId: this._roomContext.roomId,
            timestamp: Date.now(),
        });
        console.log("[Betting] ✅ REPORT_WINNER event emitted");

        // PRIORITY 1: Set cloud variable (hidden from user)
        const cloudSuccess = await this._setCloudVariable(
            `room_${this._roomContext.roomId}_winner`,
            userId
        );

        if (cloudSuccess) {
            console.log("[Betting] ✅ Winner set via cloud variables");
            this._cloudState.winner = userId;

            // Check if game can be finalized (both winner + ended)
            if (this._cloudState.gameEnded) {
                console.log(
                    "[Betting] Game already ended, cloud server will finalize"
                );
            }
            return;
        }

        // SECURITY: Frontend should NEVER call game result APIs
        // Server-side VM will handle REPORT_WINNER event and call API
        console.log("[Betting] Frontend: Winner event emitted (server will handle API call)");
    }

    /**
     * Report multiple winners by user IDs
     * @param {object} args - block arguments
     * @returns {Promise}
     */
    async reportWinners(args) {
        const userIdsString = args.USERIDS;

        // Parse comma-separated user IDs
        const userIds = userIdsString
            .split(",")
            .map((s) => s.trim())
            .filter((id) => id.length > 0);

        console.log(
            `[Betting] Reporting winners: users ${userIds.join(", ")} in room ${
                this._roomContext.roomId
            }`
        );

        if (!this._roomContext.roomId) {
            console.error("[Betting] No room context available");
            return;
        }

        if (userIds.length === 0) {
            console.error("[Betting] No valid user IDs provided");
            return;
        }

        // EMIT EVENT for server-side VM
        this.runtime.emit("REPORT_WINNER", {
            userId: userIds, // Array of user IDs
            roomId: this._roomContext.roomId,
            timestamp: Date.now(),
        });
        console.log(
            "[Betting] ✅ REPORT_WINNER event emitted (multiple winners)"
        );

        // PRIORITY 1: Set cloud variable (hidden from user)
        // Store multiple winners as JSON string
        const cloudSuccess = await this._setCloudVariable(
            `room_${this._roomContext.roomId}_winner`,
            JSON.stringify(userIds)
        );

        if (cloudSuccess) {
            console.log("[Betting] ✅ Winners set via cloud variables");
            this._cloudState.winner = userIds;
            return;
        }

        // SECURITY: Frontend should NEVER call game result APIs
        // Server-side VM will handle REPORT_WINNER event and call API
        console.log("[Betting] Frontend: Winners event emitted (server will handle API call)");
    }

    /**
     * Report no winners (house wins)
     * @returns {Promise}
     */
    async reportNoWinners() {
        console.log(
            `[Betting] Reporting no winners in room ${this._roomContext.roomId}`
        );

        if (!this._roomContext.roomId) {
            console.error("[Betting] No room context available");
            return;
        }

        // EMIT EVENT for server-side VM
        this.runtime.emit("REPORT_WINNER", {
            userId: [], // Empty array = no winners
            roomId: this._roomContext.roomId,
            timestamp: Date.now(),
        });
        console.log("[Betting] ✅ REPORT_WINNER event emitted (no winners)");

        // PRIORITY 1: Set cloud variable (hidden from user)
        // Empty string or special value for no winners
        const cloudSuccess = await this._setCloudVariable(
            `room_${this._roomContext.roomId}_winner`,
            "NONE"
        );

        if (cloudSuccess) {
            console.log("[Betting] ✅ No winners set via cloud variables");
            this._cloudState.winner = [];
            return;
        }

        // SECURITY: Frontend should NEVER call game result APIs
        // Server-side VM will handle REPORT_WINNER event and call API
        console.log("[Betting] Frontend: No winners event emitted (server will handle API call)");
    }

    /**
     * End game session
     * @returns {Promise}
     */
    async endGame() {
        console.log(
            `[Betting] Ending game in room ${this._roomContext.roomId}`
        );

        if (!this._roomContext.roomId) {
            console.error("[Betting] No room context available");
            return;
        }

        // EMIT EVENT for server-side VM
        this.runtime.emit("GAME_ENDED", {
            roomId: this._roomContext.roomId,
            timestamp: Date.now(),
        });
        console.log("[Betting] ✅ GAME_ENDED event emitted");

        // PRIORITY 1: Set cloud variable (hidden from user)
        // This signals cloud server that game has ended
        const cloudSuccess = await this._setCloudVariable(
            `room_${this._roomContext.roomId}_ended`,
            "true"
        );

        if (cloudSuccess) {
            console.log("[Betting] ✅ Game ended via cloud variables");
            this._cloudState.gameEnded = true;

            // Cloud server will finalize if winner already set
            if (this._cloudState.winner) {
                console.log(
                    "[Betting] Winner already set, cloud server will finalize now"
                );
            }

            // Stop runtime
            this.runtime.emit("PROJECT_RUN_STOP");
            return;
        }

        // SECURITY: Frontend should NEVER call game result APIs
        // All game result reporting must happen server-side via GAME_ENDED event
        // Frontend only stops the project and waits for server to handle results
        console.log("[Betting] Stopping project (server handles game end via GAME_ENDED event)");
        this.runtime.emit("PROJECT_RUN_STOP");
    }
}

module.exports = Scratch3BlockchainBlocks;
