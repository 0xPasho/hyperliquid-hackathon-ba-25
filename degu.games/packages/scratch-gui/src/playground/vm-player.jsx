/**
 * VM Player - Multiplayer Game Streaming Client
 *
 * This component connects to a VM server WebSocket to stream game state
 * for multiplayer games. Unlike the regular player, this doesn't run a local VM.
 * Instead, it receives state updates from the server and renders them.
 *
 * Authentication required: User must be a member of the room to connect.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import queryString from 'query-string';
import authManager from '../lib/auth-manager';
import VirtualMachine from '@scratch/scratch-vm';
import Renderer from '@scratch/scratch-render';
import {ScratchStorage} from 'scratch-storage';

import styles from './vm-player.css';

class VMPlayer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            status: 'initializing', // initializing, authenticating, connecting, connected, error, unauthorized
            errorMessage: '',
            projectLoaded: false,
            queuePosition: null
        };

        this.canvasRef = React.createRef();
        this.ws = null;
        this.vm = null;
        this.renderer = null;

        this.handleMessage = this.handleMessage.bind(this);
        this.connectToVM = this.connectToVM.bind(this);
        this.updateSpriteState = this.updateSpriteState.bind(this);
    }

    async componentDidMount() {
        const { roomId, userId, token, vmServerUrl } = this.props;

        // Validate required params
        if (!roomId || !userId || !vmServerUrl) {
            this.setState({
                status: 'error',
                errorMessage: 'Missing required parameters (roomId, userId, or vmServerUrl)'
            });
            return;
        }

        // Set up VM and Renderer
        this.initializeRenderer();

        // Authenticate user
        this.setState({ status: 'authenticating' });

        try {
            // Set token if provided via URL
            if (token) {
                authManager.token = token;
                authManager.setCookie('authToken', token);
                localStorage.setItem('authToken', token);
            }

            // Initialize auth manager
            await authManager.init();

            if (!authManager.isAuthenticated()) {
                this.setState({
                    status: 'unauthorized',
                    errorMessage: 'You must be logged in to view this game'
                });
                return;
            }

            // Verify user is a room member
            const isRoomMember = await this.verifyRoomMembership(roomId, userId);

            if (!isRoomMember) {
                this.setState({
                    status: 'unauthorized',
                    errorMessage: 'You are not a member of this room'
                });
                return;
            }

            // Connect to VM server
            this.connectToVM(vmServerUrl, roomId, userId);

        } catch (error) {
            console.error('[VMPlayer] Auth error:', error);
            this.setState({
                status: 'error',
                errorMessage: 'Authentication failed: ' + error.message
            });
        }
    }

    componentWillUnmount() {
        // Stop render loop
        this.stopRenderLoop();

        // Clean up WebSocket
        if (this.ws) {
            this.ws.close();
        }

        // Clean up renderer
        if (this.renderer) {
            this.renderer.destroy();
        }

        // Clean up VM
        if (this.vm) {
            this.vm.quit();
        }

        // Clean up storage
        if (this.storage) {
            // Storage doesn't have a destroy method, just clear reference
            this.storage = null;
        }

        // Remove keyboard listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    /**
     * Initialize Scratch VM and Renderer
     */
    initializeRenderer() {
        if (!this.canvasRef.current) return;

        console.log('[VMPlayer] Initializing Scratch VM and Renderer');

        // Create VM
        this.vm = new VirtualMachine();

        // Create and attach storage (needed for loading costume images)
        const assetHost = process.env.ASSET_HOST || 'https://assets.scratch.mit.edu';
        this.storage = new ScratchStorage();
        this.vm.attachStorage(this.storage);

        console.log('[VMPlayer] Storage attached with asset host:', assetHost);

        // Create renderer
        const canvas = this.canvasRef.current;
        this.renderer = new Renderer(canvas);

        // Attach renderer to VM
        this.vm.attachRenderer(this.renderer);

        // Set renderer size to match Scratch stage (480x360)
        this.renderer.resize(480, 360);

        // Draw once to initialize canvas (makes it white instead of black)
        this.renderer.draw();

        console.log('[VMPlayer] VM and Renderer initialized');

        // Start render loop
        this.startRenderLoop();
    }

    /**
     * Start continuous render loop
     */
    startRenderLoop() {
        // Render at 30 FPS
        this.renderInterval = setInterval(() => {
            if (this.renderer && this.state.projectLoaded) {
                this.renderer.draw();
            }
        }, 1000 / 30);
    }

    /**
     * Stop render loop
     */
    stopRenderLoop() {
        if (this.renderInterval) {
            clearInterval(this.renderInterval);
            this.renderInterval = null;
        }
    }

    /**
     * Verify user is a member of the room
     */
    async verifyRoomMembership(roomId, userId) {
        try {
            const apiUrl = process.env.API_URL || 'http://localhost:3000/api/v1';
            const token = authManager.getToken();

            const response = await fetch(`${apiUrl}/rooms/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('[VMPlayer] Failed to fetch room:', response.status);
                return false;
            }

            const data = await response.json();
            const room = data.data || data;

            // Check if user is in the room's players list
            const isMember = room.players?.some(p => p.userId === userId);

            console.log('[VMPlayer] Room membership verified:', isMember);
            return isMember;

        } catch (error) {
            console.error('[VMPlayer] Error verifying room membership:', error);
            return false;
        }
    }

    /**
     * Connect to VM server WebSocket
     */
    connectToVM(vmServerUrl, roomId, userId) {
        this.setState({ status: 'connecting' });

        const wsUrl = `${vmServerUrl}?roomId=${roomId}&userId=${userId}`;
        console.log('[VMPlayer] Connecting to VM server:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('[VMPlayer] Connected to VM server');
            this.setState({ status: 'connected' });
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('[VMPlayer] Failed to parse message:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('[VMPlayer] WebSocket error:', error);
            this.setState({
                status: 'error',
                errorMessage: 'Connection error'
            });
        };

        this.ws.onclose = (event) => {
            console.log('[VMPlayer] Disconnected:', event.code, event.reason);
            if (this.state.status === 'connected') {
                this.setState({
                    status: 'error',
                    errorMessage: 'Connection lost'
                });
            }
        };

        // Set up keyboard listeners
        this.setupInputHandlers();
    }

    /**
     * Handle messages from VM server
     */
    handleMessage(message) {
        switch (message.type) {
            case 'project_data':
                console.log('[VMPlayer] Received project data');
                this.loadProject(message.projectData);
                break;

            case 'full':
            case 'delta':
                // Update sprite positions from server state
                if (this.state.projectLoaded) {
                    this.updateSpriteState(message);
                    // Rendering happens continuously in the render loop
                }
                break;

            case 'player_input':
                // Apply opponent's input to local VM
                if (this.state.projectLoaded) {
                    this.applyRemoteInput(message.playerId, message.input);
                }
                break;

            case 'queued':
                this.setState({ queuePosition: message.position });
                break;

            case 'ready':
                this.setState({ queuePosition: null });
                break;

            case 'game_ended':
                console.log('[VMPlayer] Game ended');
                // Could show game over screen here
                break;

            case 'error':
                console.error('[VMPlayer] Server error:', message.error);
                this.setState({
                    status: 'error',
                    errorMessage: message.error
                });
                break;

            default:
                console.log('[VMPlayer] Unknown message type:', message.type);
        }
    }

    /**
     * Load project into VM
     */
    async loadProject(projectData) {
        if (!this.vm) return;

        try {
            await this.vm.loadProject(projectData);
            this.setState({ projectLoaded: true });
            console.log('[VMPlayer] Project loaded successfully');

            // Start the VM to initialize costumes and renderer
            // The VM will tick but we override state with server updates
            this.vm.start();
            console.log('[VMPlayer] VM started for rendering');

            // Force initial render after project loads
            if (this.renderer) {
                this.renderer.draw();
                console.log('[VMPlayer] Initial render complete');
            }
        } catch (error) {
            console.error('[VMPlayer] Failed to load project:', error);
            this.setState({
                status: 'error',
                errorMessage: 'Failed to load game'
            });
        }
    }

    /**
     * Update sprite states from server message
     */
    updateSpriteState(message) {
        if (!this.vm) return;

        const targets = this.vm.runtime.targets;
        const sprites = message.sprites || {};

        console.log('[VMPlayer] Updating sprite state:', {
            messageType: message.type,
            spriteCount: Object.keys(sprites).length,
            sprites: sprites,
            availableTargets: targets.map(t => ({
                name: t.sprite?.name,
                isStage: t.isStage
            }))
        });

        Object.keys(sprites).forEach((spriteName) => {
            const spriteData = sprites[spriteName];

            // Find target by name
            const target = targets.find((t) =>
                !t.isStage && t.sprite.name === spriteName
            );

            if (!target) {
                console.warn('[VMPlayer] Target not found for sprite:', spriteName);
                return;
            }

            console.log(`[VMPlayer] Updating sprite "${spriteName}":`, spriteData);

            // Update sprite properties
            if (spriteData.x !== undefined) target.x = spriteData.x;
            if (spriteData.y !== undefined) target.y = spriteData.y;
            if (spriteData.direction !== undefined) target.direction = spriteData.direction;
            if (spriteData.visible !== undefined) target.visible = spriteData.visible;
            if (spriteData.size !== undefined) target.size = spriteData.size;
            if (spriteData.costume !== undefined) {
                target.currentCostume = spriteData.costume;
            }
            if (spriteData.rotationStyle !== undefined) {
                target.rotationStyle = spriteData.rotationStyle;
            }
        });
    }

    /**
     * Apply remote player's input to local VM
     */
    applyRemoteInput(playerId, input) {
        if (!this.vm || !this.state.projectLoaded) return;

        try {
            if (input.type === 'keyboard') {
                const isDown = input.action === 'keydown';
                this.vm.runtime.ioDevices.keyboard.postData({
                    key: input.key,
                    isDown: isDown
                });

                console.log(`[VMPlayer] Applied remote keyboard: ${playerId} ${input.action} ${input.key}`);
            }

            if (input.type === 'mouse') {
                if (input.action === 'move' && input.x !== undefined && input.y !== undefined) {
                    this.vm.runtime.ioDevices.mouse.postData({
                        x: input.x,
                        y: input.y
                    });
                    console.log(`[VMPlayer] Applied remote mouse move: ${playerId} (${input.x}, ${input.y})`);
                } else if (input.action === 'down' || input.action === 'up') {
                    this.vm.runtime.ioDevices.mouse.postData({
                        isDown: input.action === 'down'
                    });
                    console.log(`[VMPlayer] Applied remote mouse: ${playerId} ${input.action}`);
                }
            }

        } catch (error) {
            console.error('[VMPlayer] Error applying remote input:', error);
        }
    }

    /**
     * Set up input handlers (keyboard and mouse)
     */
    setupInputHandlers() {
        // Keyboard handlers
        this.handleKeyDown = (e) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'keyboard',
                    action: 'keydown',
                    key: e.key
                }));
            }
        };

        this.handleKeyUp = (e) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'keyboard',
                    action: 'keyup',
                    key: e.key
                }));
            }
        };

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    /**
     * Handle mouse move
     */
    handleMouseMove = (e) => {
        if (this.ws?.readyState !== WebSocket.OPEN) return;

        const canvas = this.canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to Scratch coordinates
        const scratchX = x - 240;
        const scratchY = 180 - y;

        this.ws.send(JSON.stringify({
            type: 'mouse',
            action: 'move',
            x: scratchX,
            y: scratchY
        }));
    };

    /**
     * Handle mouse down
     */
    handleMouseDown = () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'mouse',
                action: 'down'
            }));
        }
    };

    /**
     * Handle mouse up
     */
    handleMouseUp = () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'mouse',
                action: 'up'
            }));
        }
    };

    render() {
        const { status, errorMessage, projectLoaded, queuePosition } = this.state;

        return (
            <div className={styles.container}>
                {/* Connection status overlay */}
                {(!projectLoaded || status !== 'connected') && (
                    <div className={styles.overlay}>
                        <div className={styles.message}>
                            {status === 'initializing' && (
                                <>
                                    <div className={styles.spinner}></div>
                                    <h2>Initializing...</h2>
                                </>
                            )}

                            {status === 'authenticating' && (
                                <>
                                    <div className={styles.spinner}></div>
                                    <h2>Authenticating...</h2>
                                </>
                            )}

                            {status === 'connecting' && (
                                <>
                                    <div className={styles.spinner}></div>
                                    <h2>
                                        {queuePosition !== null
                                            ? `Queue Position: ${queuePosition}`
                                            : projectLoaded
                                            ? 'Connected, waiting for game...'
                                            : 'Loading game...'}
                                    </h2>
                                    <p>Please wait while we set up your game</p>
                                </>
                            )}

                            {status === 'error' && (
                                <>
                                    <div className={styles.errorIcon}>⚠️</div>
                                    <h2>Connection Error</h2>
                                    <p>{errorMessage}</p>
                                </>
                            )}

                            {status === 'unauthorized' && (
                                <>
                                    <div className={styles.errorIcon}>🔒</div>
                                    <h2>Unauthorized</h2>
                                    <p>{errorMessage}</p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Game canvas */}
                <canvas
                    ref={this.canvasRef}
                    width={480}
                    height={360}
                    className={styles.canvas}
                    onMouseMove={this.handleMouseMove}
                    onMouseDown={this.handleMouseDown}
                    onMouseUp={this.handleMouseUp}
                    tabIndex={0}
                />

                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                    <div className={styles.debug}>
                        {status} | Room: {this.props.roomId} | Project: {projectLoaded ? '✓' : '✗'}
                    </div>
                )}
            </div>
        );
    }
}

// Parse query parameters
const queryParams = queryString.parse(window.location.search);

// Render the player
const appTarget = document.createElement('div');
document.body.appendChild(appTarget);

ReactDOM.render(
    <VMPlayer
        roomId={queryParams.roomId}
        userId={queryParams.userId}
        token={queryParams.token}
        vmServerUrl={queryParams.vmServerUrl}
    />,
    appTarget
);
