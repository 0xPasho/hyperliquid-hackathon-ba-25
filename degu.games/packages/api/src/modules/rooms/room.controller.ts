import { Request, Response } from "express";
import roomService from "./room.service";
import { RoomStatus } from "@prisma/client";
import blockchainService from "../blockchain/blockchain.service";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        walletAddress: string;
    };
}

class RoomController {
    /**
     * POST /api/v1/rooms/prepare
     * Prepare blockchain game (returns gameId for user to pay)
     */
    async prepareBlockchainGame(req: Request, res: Response): Promise<void> {
        try {
            const { tokenAddress, entryFee, gameMode, maxPlayers, teams } = req.body;

            if (!tokenAddress || !entryFee || gameMode === undefined || !maxPlayers) {
                res.status(400).json({
                    success: false,
                    error: "tokenAddress, entryFee, gameMode, and maxPlayers are required"
                });
                return;
            }

            const result = await roomService.prepareBlockchainGame({
                tokenAddress,
                entryFee,
                gameMode,
                maxPlayers,
                teams
            });

            res.json(result);
        } catch (error: any) {
            console.error("[RoomController] prepareBlockchainGame error:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to prepare blockchain game"
            });
        }
    }

    /**
     * POST /api/v1/rooms
     * Create a new room
     */
    async createRoom(req: Request, res: Response): Promise<void> {
        try {
            const {
                name,
                projectId,
                hostId,
                maxPlayers,
                isPrivate,
                password,
                tokenAddress,
                tokenSymbol,
                entryFee,
                entryFeeUsd,
                chainId,
                networkName,
                gameMode,
                teams,
                prizePercentages,
                blockchainGameId,
            } = req.body;

            console.log("[RoomController] createRoom received data:", {
                tokenAddress,
                tokenSymbol,
                entryFee,
                entryFeeUsd,
                chainId,
                networkName,
                blockchainGameId,
                hasBlockchainGameId: !!blockchainGameId
            });

            if (!projectId || !hostId) {
                res.status(400).json({
                    success: false,
                    error: "projectId and hostId are required",
                });
                return;
            }

            const room = await roomService.createRoom({
                name,
                projectId,
                hostId,
                maxPlayers,
                isPrivate,
                password,
                tokenAddress,
                tokenSymbol,
                entryFee,
                entryFeeUsd,
                chainId,
                networkName,
                gameMode,
                teams,
                prizePercentages,
                blockchainGameId,
            });

            res.status(201).json({
                success: true,
                data: room,
            });
        } catch (error) {
            console.error("Error creating room:", error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to create room",
            });
        }
    }

    /**
     * GET /api/v1/rooms/:id
     * Get a room by ID
     */
    async getRoom(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            const room = await roomService.getRoomById(id);

            if (!room) {
                res.status(404).json({
                    success: false,
                    error: "Room not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: room,
            });
        } catch (error) {
            console.error("Error fetching room:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch room",
            });
        }
    }

    /**
     * GET /api/v1/rooms/project/:projectId
     * Get all rooms for a project
     */
    async getRoomsByProject(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            const includeCompleted = req.query.includeCompleted === "true";

            const rooms = await roomService.getRoomsByProject(
                projectId,
                includeCompleted
            );

            res.status(200).json({
                success: true,
                data: rooms,
                count: rooms.length,
            });
        } catch (error) {
            console.error("Error fetching project rooms:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch rooms",
            });
        }
    }

    /**
     * GET /api/v1/rooms/project/:projectId/stats
     * Get project statistics (total volume and total players)
     */
    async getProjectStats(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            const stats = await roomService.getProjectStats(projectId);

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error("Error fetching project stats:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch project stats",
            });
        }
    }

    /**
     * GET /api/v1/rooms/active
     * Get all active rooms (global lobby)
     */
    async getActiveRooms(req: Request, res: Response): Promise<void> {
        try {
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : 50;

            const rooms = await roomService.getActiveRooms(limit);

            res.status(200).json({
                success: true,
                data: rooms,
                count: rooms.length,
            });
        } catch (error) {
            console.error("Error fetching active rooms:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch active rooms",
            });
        }
    }

    /**
     * POST /api/v1/rooms/:id/join
     * Join a room
     */
    async joinRoom(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { userId, walletAddress, password } = req.body;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: "userId is required",
                });
                return;
            }

            const player = await roomService.joinRoom({
                roomId: id,
                userId,
                walletAddress,
                password,
            });

            res.status(200).json({
                success: true,
                data: player,
            });
        } catch (error) {
            console.error("Error joining room:", error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to join room",
            });
        }
    }

    /**
     * POST /api/v1/rooms/:id/pay
     * Pay entry fee for a room
     * Creates escrow if creator, joins escrow if player
     */
    async payRoomEntry(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
                return;
            }

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            const result = await roomService.payRoomEntry(
                id,
                req.user.userId,
                blockchainService
            );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error("Error paying room entry:", error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to pay room entry",
            });
        }
    }

    /**
     * POST /api/v1/rooms/:id/leave
     * Leave a room
     */
    async leaveRoom(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: "userId is required",
                });
                return;
            }

            const result = await roomService.leaveRoom(id, userId);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error("Error leaving room:", error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to leave room",
            });
        }
    }

    /**
     * POST /api/v1/rooms/:id/ready
     * Toggle player ready status
     */
    async toggleReady(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: "userId is required",
                });
                return;
            }

            const player = await roomService.toggleReady(id, userId);

            res.status(200).json({
                success: true,
                data: player,
            });
        } catch (error) {
            console.error("Error toggling ready:", error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to toggle ready",
            });
        }
    }

    /**
     * PUT /api/v1/rooms/:id
     * Update a room
     */
    async updateRoom(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, maxPlayers, status, blockchainGameId } = req.body;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            const room = await roomService.updateRoom(id, {
                name,
                maxPlayers,
                status,
                blockchainGameId,
            });

            if (!room) {
                res.status(404).json({
                    success: false,
                    error: "Room not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: room,
            });
        } catch (error) {
            console.error("Error updating room:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update room",
            });
        }
    }

    /**
     * POST /api/v1/rooms/:id/start
     * Start a game (host only)
     */
    async startGame(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { hostId } = req.body;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            if (!hostId) {
                res.status(400).json({
                    success: false,
                    error: "hostId is required",
                });
                return;
            }

            const room = await roomService.startGame(id, hostId);

            res.status(200).json({
                success: true,
                data: room,
            });
        } catch (error) {
            console.error("Error starting game:", error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to start game",
            });
        }
    }

    /**
     * POST /api/v1/rooms/:id/complete
     * Complete a game
     */
    async completeGame(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { winnerId } = req.body;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            const room = await roomService.completeGame(id, winnerId);

            res.status(200).json({
                success: true,
                data: room,
            });
        } catch (error) {
            console.error("Error completing game:", error);
            res.status(500).json({
                success: false,
                error: "Failed to complete game",
            });
        }
    }

    /**
     * POST /api/v1/rooms/:id/cancel
     * Cancel a room and refund all players (host only, for paid games)
     */
    async cancelRoom(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { userId, reason } = req.body;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: "userId is required",
                });
                return;
            }

            const result = await roomService.cancelRoom(id, userId, reason);

            res.status(200).json({
                success: true,
                data: result.room,
                message: result.message || "Room cancelled successfully"
            });
        } catch (error) {
            console.error("Error cancelling room:", error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to cancel room",
            });
        }
    }

    /**
     * DELETE /api/v1/rooms/:id
     * Delete a room
     */
    async deleteRoom(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            const deleted = await roomService.deleteRoom(id, userId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: "Room not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Room deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting room:", error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to delete room",
            });
        }
    }

    /**
     * GET /api/v1/rooms/blockchain/:gameId
     * Get room by blockchain game ID
     */
    async getRoomByBlockchainGameId(req: Request, res: Response): Promise<void> {
        try {
            const { gameId } = req.params;

            if (!gameId) {
                res.status(400).json({
                    success: false,
                    error: "Game ID is required",
                });
                return;
            }

            const room = await roomService.getRoomByBlockchainGameId(gameId);

            if (!room) {
                res.status(404).json({
                    success: false,
                    error: "Room not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: room,
            });
        } catch (error) {
            console.error("Error fetching room by blockchain ID:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch room",
            });
        }
    }
}

export default new RoomController();
