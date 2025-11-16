import { PrismaClient, Room, RoomStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { vmServerClient } from "../../lib/vm-server-client";
import { gameEscrowClient, GameMode } from "../../lib/blockchain/gameEscrow";
import { ethers } from "ethers";
import { lobbyWebSocket } from "../../lib/lobby.websocket";

export interface CreateRoomDto {
    name?: string;
    projectId: string;
    hostId: string;
    maxPlayers?: number;
    isPrivate?: boolean;
    password?: string;
    // Blockchain configuration (optional - for paid games)
    blockchainGameId?: string; // If user already paid, pass gameId here
    chainId?: number; // Blockchain network ID
    networkName?: string; // Human-readable network name
    tokenAddress?: string; // ERC20 token address
    tokenSymbol?: string; // Token symbol (USDC, ETH, MATIC)
    entryFee?: string; // Entry fee in token units
    entryFeeUsd?: string; // Approximate USD value at creation time
    gameMode?: number;
    teams?: number;
    prizePercentages?: number[];
}

export interface UpdateRoomDto {
    name?: string;
    maxPlayers?: number;
    status?: RoomStatus;
    blockchainGameId?: string;
    startedAt?: Date;
    completedAt?: Date;
    winnerId?: string | null;
    vmServerUrl?: string;
    vmQueuePosition?: number;
    vmStatus?: string;
}

export interface JoinRoomDto {
    roomId: string;
    userId: string;
    walletAddress?: string;
    password?: string;
    seatNumber?: number; // Optional seat selection
    hasPaid?: boolean; // Set to true if player already paid on-chain before joining
}

class RoomService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    /**
     * Prepare blockchain game WITHOUT creating room in DB
     * Returns gameId for frontend to use for payment
     * Room will be created AFTER user pays
     */
    async prepareBlockchainGame(data: {
        tokenAddress: string;
        entryFee: string;
        gameMode: number;
        maxPlayers: number;
        teams?: number;
    }) {
        console.log("[RoomService] Preparing blockchain game...", data);

        const bcResult = await gameEscrowClient.createGame({
            paymentToken: data.tokenAddress,
            mode: data.gameMode,
            entryFee: data.entryFee,
            maxPlayers: data.maxPlayers,
            numTeams: data.teams || 0,
            timeLimit: 3600, // 1 hour default
            creatorCommission: 0, // 0% for now
            platformCommission: 200, // 2%
        });

        if (bcResult.success && bcResult.gameId !== undefined) {
            console.log(
                `[RoomService] ✅ Blockchain game created: ${bcResult.gameId}`
            );
            return {
                success: true,
                gameId: bcResult.gameId.toString(),
            };
        } else {
            console.error(
                `[RoomService] Failed to create blockchain game: ${bcResult.error}`
            );
            return {
                success: false,
                error: bcResult.error || "Failed to create blockchain game",
            };
        }
    }

    /**
     * Create a new game room (no payment required at creation)
     */
    async createRoom(data: CreateRoomDto): Promise<Room> {
        // Check if project exists
        const project = await this.prisma.project.findUnique({
            where: { id: data.projectId },
        });

        if (!project) {
            throw new Error("Project not found");
        }

        // Create the room (blockchain game will be created when creator pays)
        const room = await this.prisma.room.create({
            data: {
                name: data.name || `${project.title} - Game Room`,
                projectId: data.projectId,
                hostId: data.hostId,
                maxPlayers: data.maxPlayers || 4,
                currentPlayers: 1,
                isPrivate: data.isPrivate || false,
                password: data.password,
                status: RoomStatus.WAITING,
                blockchainGameId: data.blockchainGameId,
                // Store blockchain configuration with network and currency details
                chainId: data.chainId,
                networkName: data.networkName,
                tokenAddress: data.tokenAddress,
                tokenSymbol: data.tokenSymbol,
                entryFee: data.entryFee,
                entryFeeUsd: data.entryFeeUsd,
                gameMode: data.gameMode,
                teams: data.teams,
                prizePercentages: data.prizePercentages || [100],
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                host: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true,
                    },
                },
            },
        });

        // Add host as first player
        // If blockchainGameId is provided in advance, host has already paid on-chain
        const hostHasPaid = !!(data.blockchainGameId && data.entryFee);
        await this.prisma.roomPlayer.create({
            data: {
                roomId: room.id,
                userId: data.hostId,
                isReady: true, // Host is automatically ready when creating room
                hasPaid: hostHasPaid,
                paidAt: hostHasPaid ? new Date() : null,
            },
        });

        // If room has entry fee, handle blockchain game
        let updatedRoom = room;
        if (data.entryFee && data.tokenAddress) {
            // If blockchainGameId is provided, user has already paid via /prepare flow
            if (data.blockchainGameId) {
                updatedRoom = await this.prisma.room.update({
                    where: { id: room.id },
                    data: { blockchainGameId: data.blockchainGameId },
                    include: {
                        project: { select: { id: true, title: true } },
                        host: {
                            select: {
                                id: true,
                                name: true,
                                walletAddress: true,
                            },
                        },
                    },
                });

                console.log(
                    `[RoomService] ✅ Room created with existing blockchain game ${data.blockchainGameId}`
                );
            } else {
                // No blockchainGameId provided - paid rooms MUST use /prepare flow first
                throw new Error(
                    "Paid rooms require blockchainGameId. Use /api/v1/rooms/prepare endpoint first, then pay, then create room."
                );
            }
        }

        // Check if all players are ready and update room status
        // (For a newly created room with just the host, if host is ready, room should be READY)
        const allPlayers = await this.prisma.roomPlayer.findMany({
            where: {
                roomId: updatedRoom.id,
                leftAt: null,
            },
        });

        const allReady = allPlayers.every((p) => p.isReady);

        // Support single-player games (minimum 1 player)
        if (allReady && updatedRoom.currentPlayers >= 1) {
            // Auto-update room status to READY
            updatedRoom = await this.prisma.room.update({
                where: { id: updatedRoom.id },
                data: { status: RoomStatus.READY },
                include: {
                    project: { select: { id: true, title: true } },
                    host: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true,
                        },
                    },
                },
            });
        }

        // Emit WebSocket event for room created
        const roomWithPlayers = await this.getRoomById(updatedRoom.id);
        if (roomWithPlayers) {
            lobbyWebSocket.roomCreated(roomWithPlayers);
        }

        return updatedRoom;
    }

    /**
     * Get a room by ID with all details
     */
    async getRoomById(id: string) {
        return this.prisma.room.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        projectData: true,
                    },
                },
                host: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true,
                        profileImage: true,
                    },
                },
                players: {
                    where: {
                        leftAt: null, // Only active players
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                walletAddress: true,
                                profileImage: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: "asc",
                    },
                },
            },
        });
    }

    /**
     * List all rooms for a project
     */
    async getRoomsByProject(
        projectId: string,
        includeCompleted: boolean = false
    ) {
        const statusFilter = includeCompleted
            ? {}
            : {
                  status: {
                      in: [
                          RoomStatus.WAITING,
                          RoomStatus.READY,
                          RoomStatus.PLAYING,
                      ],
                  },
              };

        return this.prisma.room.findMany({
            where: {
                projectId,
                ...statusFilter,
            },
            include: {
                host: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true,
                    },
                },
                players: {
                    where: {
                        leftAt: null,
                    },
                    select: {
                        id: true,
                        userId: true,
                        isReady: true,
                    },
                },
            },
            orderBy: [
                { status: "asc" }, // WAITING first
                { createdAt: "desc" },
            ],
        });
    }

    /**
     * Get project statistics (total volume and total players)
     * Calculated directly in the database for efficiency
     */
    async getProjectStats(projectId: string) {
        // Get all rooms for the project
        const rooms = await this.prisma.room.findMany({
            where: {
                projectId,
            },
            select: {
                entryFeeUsd: true,
                currentPlayers: true,
            },
        });

        // Calculate total volume: sum of (entryFeeUsd * currentPlayers) for all rooms
        const totalVolume = rooms.reduce((sum, room) => {
            if (room.entryFeeUsd && room.currentPlayers > 0) {
                const entryFeeUsd = parseFloat(room.entryFeeUsd);
                const roomVolume = entryFeeUsd * room.currentPlayers;
                return sum + roomVolume;
            }
            return sum;
        }, 0);

        // Calculate total players: sum of currentPlayers for all rooms
        const totalPlayers = rooms.reduce((sum, room) => {
            return sum + room.currentPlayers;
        }, 0);

        return {
            totalVolume: Math.round(totalVolume),
            totalPlayers,
        };
    }

    /**
     * List all active rooms (global lobby)
     */
    async getActiveRooms(limit: number = 50) {
        return this.prisma.room.findMany({
            where: {
                status: {
                    in: [
                        RoomStatus.WAITING,
                        RoomStatus.READY,
                        RoomStatus.PLAYING,
                    ],
                },
                isPrivate: false,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                host: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                players: {
                    where: {
                        leftAt: null,
                    },
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            take: limit,
        });
    }

    /**
     * Pay entry fee for a room
     * When creator pays: creates blockchain escrow game
     * When other players pay: joins the existing escrow game
     */
    async payRoomEntry(roomId: string, userId: string, blockchainService: any) {
        const room = await this.getRoomById(roomId);

        if (!room) {
            throw new Error("Room not found");
        }

        // Check if user is in the room
        const player = await this.prisma.roomPlayer.findFirst({
            where: {
                roomId,
                userId,
                leftAt: null,
            },
        });

        if (!player) {
            throw new Error("You must join the room before paying");
        }

        if (player.hasPaid) {
            throw new Error("You have already paid for this room");
        }

        // Check if room has payment configuration
        if (!room.tokenAddress || !room.entryFee) {
            throw new Error("This room does not require payment");
        }

        let blockchainResult;

        // If this is the creator paying, create the escrow game
        if (userId === room.hostId) {
            console.log(`[RoomService] Creator paying - creating escrow game`);

            // Create the blockchain escrow game
            blockchainResult = await blockchainService.createGameEscrowGame(
                userId,
                room.tokenAddress,
                room.entryFee,
                2, // minPlayers (at least 2)
                room.maxPlayers,
                room.gameMode || 0,
                room.teams || 0,
                room.prizePercentages || [100]
            );

            if (!blockchainResult.success) {
                throw new Error(
                    `Failed to create escrow game: ${blockchainResult.error}`
                );
            }

            // Update room with blockchain game ID
            await this.prisma.room.update({
                where: { id: roomId },
                data: {
                    blockchainGameId: blockchainResult.gameId.toString(),
                },
            });

            console.log(
                `[RoomService] Escrow game created with ID: ${blockchainResult.gameId}`
            );
        } else {
            // Other players join the existing escrow game
            if (!room.blockchainGameId) {
                throw new Error(
                    "The game creator must pay first to create the escrow"
                );
            }

            console.log(
                `[RoomService] Player joining escrow game ${room.blockchainGameId}`
            );

            blockchainResult = await blockchainService.joinGameEscrowGame(
                userId,
                parseInt(room.blockchainGameId),
                0 // teamId (default to 0, can be customized later)
            );

            if (!blockchainResult.success) {
                throw new Error(
                    `Failed to join escrow game: ${blockchainResult.error}`
                );
            }
        }

        // Mark player as paid
        const updatedPlayer = await this.prisma.roomPlayer.update({
            where: { id: player.id },
            data: {
                hasPaid: true,
                paidAt: new Date(),
            },
        });

        return {
            success: true,
            player: updatedPlayer,
            blockchainTransaction: blockchainResult,
        };
    }

    /**
     * Join a room
     */
    async joinRoom(data: JoinRoomDto) {
        const room = await this.getRoomById(data.roomId);

        if (!room) {
            throw new Error("Room not found");
        }

        // Check if room is full
        if (room.currentPlayers >= room.maxPlayers) {
            throw new Error("Room is full");
        }

        // Check password for private rooms
        if (room.isPrivate && room.password !== data.password) {
            throw new Error("Invalid password");
        }

        // Check if player has any record in this room (active or previously left)
        const existingPlayer = await this.prisma.roomPlayer.findFirst({
            where: {
                roomId: data.roomId,
                userId: data.userId,
            },
        });

        // If player is currently active in room, reject
        if (existingPlayer && !existingPlayer.leftAt) {
            throw new Error("You are already in this room");
        }

        // Validate seat number if provided
        if (data.seatNumber !== undefined) {
            // Check if seat is already taken
            const seatTaken = await this.prisma.roomPlayer.findFirst({
                where: {
                    roomId: data.roomId,
                    seatNumber: data.seatNumber,
                    leftAt: null,
                },
            });

            if (seatTaken) {
                throw new Error(`Seat ${data.seatNumber} is already taken`);
            }

            // Validate seat number is within bounds
            if (data.seatNumber < 0 || data.seatNumber >= room.maxPlayers) {
                throw new Error(
                    `Invalid seat number. Must be between 0 and ${
                        room.maxPlayers - 1
                    }`
                );
            }
        }

        let player;
        if (existingPlayer) {
            // Player is rejoining - update existing record
            // Update hasPaid if provided (they may have paid on-chain before rejoining)
            const updateData: any = {
                walletAddress: data.walletAddress,
                seatNumber: data.seatNumber,
                isReady: true, // Players are automatically ready when joining
                leftAt: null, // Mark as active again
            };

            // If hasPaid is provided, update it (and paidAt timestamp)
            if (data.hasPaid !== undefined) {
                updateData.hasPaid = data.hasPaid;
                updateData.paidAt = data.hasPaid
                    ? new Date()
                    : existingPlayer.paidAt;
                console.log(
                    `[JoinRoom] Updating rejoining player ${data.userId} with hasPaid=${data.hasPaid}`
                );
            } else {
                console.log(
                    `[JoinRoom] Rejoining player ${data.userId} - keeping existing hasPaid=${existingPlayer.hasPaid}`
                );
            }

            player = await this.prisma.roomPlayer.update({
                where: { id: existingPlayer.id },
                data: updateData,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true,
                        },
                    },
                },
            });
        } else {
            // New player - create record
            console.log(
                `[JoinRoom] Creating new player ${data.userId} with hasPaid=${
                    data.hasPaid ?? false
                }`
            );
            player = await this.prisma.roomPlayer.create({
                data: {
                    roomId: data.roomId,
                    userId: data.userId,
                    walletAddress: data.walletAddress,
                    seatNumber: data.seatNumber,
                    isReady: true, // Players are automatically ready when joining
                    hasPaid: data.hasPaid ?? false, // Use provided value or default to false
                    paidAt: data.hasPaid ? new Date() : null, // Set paidAt if already paid
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true,
                        },
                    },
                },
            });
        }

        // Update room player count
        await this.prisma.room.update({
            where: { id: data.roomId },
            data: {
                currentPlayers: {
                    increment: 1,
                },
            },
        });

        // NOTE: Player must pay entry fee from their own wallet via frontend
        console.log(
            `[RoomService] ✅ Player joined room. ${
                room.entryFee
                    ? "Player will pay entry fee from their wallet."
                    : ""
            }`
        );

        // Check if all players are ready and update room status
        const allPlayers = await this.prisma.roomPlayer.findMany({
            where: {
                roomId: data.roomId,
                leftAt: null,
            },
        });

        const allReady = allPlayers.every((p) => p.isReady);
        const updatedRoom = await this.getRoomById(data.roomId);

        // Support single-player games (minimum 1 player)
        if (allReady && updatedRoom && updatedRoom.currentPlayers >= 1) {
            // Auto-update room status to READY
            await this.updateRoom(data.roomId, { status: RoomStatus.READY });
        }

        // Emit WebSocket event for player joined
        const finalRoom = await this.getRoomById(data.roomId);
        if (finalRoom) {
            lobbyWebSocket.playerJoined(data.roomId, finalRoom);
            lobbyWebSocket.roomUpdated(finalRoom);
        }

        return player;
    }

    /**
     * Leave a room
     * - If host leaves alone (currentPlayers == 1): Cancel room and refund via blockchain
     * - If host leaves with others: Error - not allowed
     * - If regular player leaves: Leave room (note: blockchain refund requires contract update)
     */
    async leaveRoom(roomId: string, userId: string) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
        });

        if (!room) {
            throw new Error("Room not found");
        }

        // CONSTRAINT: Cannot leave if game is ongoing (READY or PLAYING status)
        if (
            room.status === RoomStatus.READY ||
            room.status === RoomStatus.PLAYING
        ) {
            throw new Error(
                "Cannot leave room while game is ongoing. Please wait until the game is finished."
            );
        }

        const player = await this.prisma.roomPlayer.findFirst({
            where: {
                roomId,
                userId,
                leftAt: null,
            },
        });

        if (!player) {
            throw new Error("You are not in this room");
        }

        const isHost = userId === room.hostId;

        // HOST LOGIC: Only allow leaving if they're alone
        if (isHost) {
            if (room.currentPlayers > 1) {
                throw new Error(
                    "Cannot leave room with other players. Cancel the room instead to refund everyone."
                );
            }

            // Host is alone - proceed with automatic cancellation
            console.log(
                `[RoomService] Host leaving alone, cancelling room ${roomId}`
            );

            // If it's a paid room with blockchain game, cancel it on blockchain
            if (room.blockchainGameId) {
                console.log(
                    `[RoomService] Cancelling blockchain game ${room.blockchainGameId}`
                );
                // Note: Blockchain cancellation is handled from frontend with user's wallet
                // Backend just marks room as cancelled
                // The cancelGame smart contract function will refund the host
            }

            // Mark player as left
            await this.prisma.roomPlayer.update({
                where: { id: player.id },
                data: { leftAt: new Date() },
            });

            // Update room status and player count
            await this.prisma.room.update({
                where: { id: roomId },
                data: {
                    status: RoomStatus.CANCELLED,
                    currentPlayers: 0,
                },
            });

            // Emit WebSocket event for room deleted/cancelled
            lobbyWebSocket.roomDeleted(roomId);

            return {
                success: true,
                cancelled: true,
                message:
                    "Room cancelled successfully. Refund will be processed via blockchain.",
            };
        }

        // REGULAR PLAYER LOGIC
        // Mark player as left
        await this.prisma.roomPlayer.update({
            where: { id: player.id },
            data: {
                leftAt: new Date(),
            },
        });

        // Update room player count
        const updatedRoom = await this.prisma.room.update({
            where: { id: roomId },
            data: {
                currentPlayers: {
                    decrement: 1,
                },
            },
        });

        // If room is now empty, cancel it
        if (updatedRoom.currentPlayers === 0) {
            await this.updateRoom(roomId, { status: RoomStatus.CANCELLED });
            lobbyWebSocket.roomDeleted(roomId);
        } else {
            // Emit WebSocket event for player left
            const refreshedRoom = await this.getRoomById(roomId);
            if (refreshedRoom) {
                lobbyWebSocket.playerLeft(roomId, refreshedRoom);
                lobbyWebSocket.roomUpdated(refreshedRoom);
            }
        }

        return {
            success: true,
            message: room.blockchainGameId
                ? "Left room. Note: Entry fee refund requires blockchain transaction."
                : "Left room successfully.",
        };
    }

    /**
     * Cancel a room (host only, when alone)
     * Triggers blockchain cancellation which refunds all players
     */
    async cancelRoom(
        roomId: string,
        userId: string,
        reason: string = "Cancelled by host"
    ) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
        });

        if (!room) {
            throw new Error("Room not found");
        }

        // Only host can cancel
        if (room.hostId !== userId) {
            throw new Error("Only the host can cancel the room");
        }

        // Can only cancel if alone or before game starts
        if (room.currentPlayers > 1) {
            throw new Error("Cannot cancel room with other players");
        }

        if (
            room.status === RoomStatus.PLAYING ||
            room.status === RoomStatus.COMPLETED
        ) {
            throw new Error(
                "Cannot cancel a game that has already started or completed"
            );
        }

        console.log(
            `[RoomService] Cancelling room ${roomId}. Blockchain game: ${room.blockchainGameId}`
        );

        // Update room status to cancelled
        const updatedRoom = await this.prisma.room.update({
            where: { id: roomId },
            data: {
                status: RoomStatus.CANCELLED,
            },
        });

        return {
            room: updatedRoom,
            message: room.blockchainGameId
                ? "Room cancelled. Blockchain cancellation will trigger refunds."
                : "Room cancelled successfully.",
        };
    }

    /**
     * Toggle player ready status
     */
    async toggleReady(roomId: string, userId: string) {
        const player = await this.prisma.roomPlayer.findFirst({
            where: {
                roomId,
                userId,
                leftAt: null,
            },
        });

        if (!player) {
            throw new Error("You are not in this room");
        }

        const updated = await this.prisma.roomPlayer.update({
            where: { id: player.id },
            data: {
                isReady: !player.isReady,
            },
        });

        // Check if all players are ready
        const allPlayers = await this.prisma.roomPlayer.findMany({
            where: {
                roomId,
                leftAt: null,
            },
        });

        const allReady = allPlayers.every((p) => p.isReady);
        const room = await this.getRoomById(roomId);

        // Support single-player games (minimum 1 player)
        if (allReady && room && room.currentPlayers >= 1) {
            // Auto-update room status to READY
            await this.updateRoom(roomId, { status: RoomStatus.READY });
        } else if (room && room.status === RoomStatus.READY) {
            // If someone became unready, move back to WAITING
            await this.updateRoom(roomId, { status: RoomStatus.WAITING });
        }

        // Emit WebSocket event for player ready status change
        const refreshedRoom = await this.getRoomById(roomId);
        if (refreshedRoom) {
            lobbyWebSocket.playerReady(roomId, refreshedRoom);
            lobbyWebSocket.roomUpdated(refreshedRoom);
        }

        return updated;
    }

    /**
     * Update room details
     */
    async updateRoom(id: string, data: UpdateRoomDto): Promise<Room | null> {
        const existing = await this.getRoomById(id);
        if (!existing) {
            return null;
        }

        return this.prisma.room.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.maxPlayers && { maxPlayers: data.maxPlayers }),
                ...(data.status && { status: data.status }),
                ...(data.blockchainGameId !== undefined && {
                    blockchainGameId: data.blockchainGameId,
                }),
                ...(data.startedAt && { startedAt: data.startedAt }),
                ...(data.completedAt && { completedAt: data.completedAt }),
                ...(data.vmServerUrl !== undefined && {
                    vmServerUrl: data.vmServerUrl,
                }),
                ...(data.vmQueuePosition !== undefined && {
                    vmQueuePosition: data.vmQueuePosition,
                }),
                ...(data.vmStatus !== undefined && { vmStatus: data.vmStatus }),
            },
        });
    }

    /**
     * Start a game (host only)
     */
    async startGame(roomId: string, hostId: string) {
        const room = await this.getRoomById(roomId);

        if (!room) {
            throw new Error("Room not found");
        }

        if (room.hostId !== hostId) {
            throw new Error("Only the host can start the game");
        }

        // Require at least 1 player (allow single-player games)
        if (room.currentPlayers < 1) {
            throw new Error("Need at least 1 player to start");
        }

        if (room.status !== RoomStatus.READY) {
            throw new Error("Room is not ready to start");
        }

        if (!room.project?.projectData) {
            throw new Error("Project data not found");
        }

        // For paid rooms, ensure all players have deposited their entry fees on-chain
        // if (room.blockchainGameId) {
        //     const activePlayers = room.players.filter((p) => !p.leftAt);
        //     const unpaidPlayers = activePlayers.filter((p) => !p.hasPaid);

        //     if (unpaidPlayers.length > 0) {
        //         const unpaidNames = unpaidPlayers
        //             .map((p) => p.user?.name || p.userId)
        //             .join(", ");
        //         throw new Error(
        //             `Cannot start game: ${unpaidPlayers.length} player(s) have not paid entry fee yet: ${unpaidNames}. ` +
        //                 `All players must deposit tokens to the escrow contract before the game can start.`
        //         );
        //     }

        //     console.log(
        //         `[RoomService] ✅ All ${activePlayers.length} players have paid entry fees on-chain`
        //     );
        // }

        // Request VM slot from VM server
        console.log(`[RoomService] Requesting VM slot for room ${roomId}`);

        // Get list of active player user IDs
        const playerIds = room.players
            .filter((p) => !p.leftAt) // Only active players
            .map((p) => p.userId);

        // Request slot from VM server
        const vmResult = await vmServerClient.requestSlot(
            roomId,
            room.projectId,
            room.project.projectData,
            playerIds
        );

        if (!vmResult.success) {
            throw new Error(`Failed to request VM slot: ${vmResult.error}`);
        }

        console.log(
            `[RoomService] VM slot ${vmResult.data?.status}: ${vmResult.data?.message}`
        );

        // Update room with VM info and start game
        const updatedRoom = await this.updateRoom(roomId, {
            status:
                vmResult.data?.status === "queued"
                    ? RoomStatus.WAITING
                    : RoomStatus.PLAYING,
            startedAt:
                vmResult.data?.status === "ready" ? new Date() : undefined,
            vmServerUrl: vmResult.data?.wsUrl,
            vmQueuePosition: vmResult.data?.queuePosition,
            vmStatus: vmResult.data?.status,
        });

        // Emit WebSocket event for game started
        const refreshedRoom = await this.getRoomById(roomId);
        if (refreshedRoom) {
            lobbyWebSocket.gameStarted(roomId, refreshedRoom);
        }

        // Return room with VM server info
        return {
            ...updatedRoom,
            vmServerUrl: vmResult.data?.wsUrl,
            vmStatus: vmResult.data?.status,
            vmQueuePosition: vmResult.data?.queuePosition,
        };
    }

    /**
     * Complete a game
     */
    async completeGame(roomId: string, winnerId?: string) {
        const result = await this.updateRoom(roomId, {
            status: RoomStatus.COMPLETED,
            completedAt: new Date(),
            winnerId: winnerId || null,
        });

        // Emit WebSocket event for game ended
        const refreshedRoom = await this.getRoomById(roomId);
        if (refreshedRoom) {
            lobbyWebSocket.gameEnded(roomId, refreshedRoom, winnerId);
        }

        return result;
    }

    /**
     * Delete a room (host only, or system cleanup)
     */
    async deleteRoom(id: string, userId?: string): Promise<boolean> {
        const room = await this.getRoomById(id);

        if (!room) {
            return false;
        }

        // If userId provided, check if user is host
        if (userId && room.hostId !== userId) {
            throw new Error("Only the host can delete the room");
        }

        await this.prisma.room.delete({
            where: { id },
        });

        return true;
    }

    /**
     * Get rooms by blockchain game ID
     */
    async getRoomByBlockchainGameId(blockchainGameId: string) {
        return this.prisma.room.findFirst({
            where: { blockchainGameId },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                host: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true,
                    },
                },
                players: {
                    where: {
                        leftAt: null,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                walletAddress: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Clean up old completed/cancelled rooms (run periodically)
     */
    async cleanupOldRooms(daysOld: number = 7): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.prisma.room.deleteMany({
            where: {
                status: {
                    in: [RoomStatus.COMPLETED, RoomStatus.CANCELLED],
                },
                updatedAt: {
                    lt: cutoffDate,
                },
            },
        });

        return result.count;
    }
}

export default new RoomService();
