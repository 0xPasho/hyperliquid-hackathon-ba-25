/**
 * Lobby WebSocket Server
 * Handles real-time updates for room lobby (room list, player joins, ready status, etc.)
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { verifyToken, JwtPayload } from "../utils/jwt";

// Extended socket with user info
interface AuthenticatedSocket extends Socket {
    userId?: string;
    walletAddress?: string;
}

// Event types for type safety
export interface LobbyEvents {
    // Client -> Server
    subscribe_rooms: () => void;
    subscribe_room: (roomId: string) => void;
    unsubscribe_room: (roomId: string) => void;
    send_chat_message: (data: { roomId: string; message: string }) => void;

    // Server -> Client
    room_created: (room: any) => void;
    room_updated: (room: any) => void;
    room_deleted: (roomId: string) => void;
    player_joined: (data: { roomId: string; room: any }) => void;
    player_left: (data: { roomId: string; room: any }) => void;
    player_ready: (data: { roomId: string; room: any }) => void;
    game_started: (data: { roomId: string; room: any }) => void;
    game_ended: (data: { roomId: string; room: any; winner?: string }) => void;
    chat_message: (data: { roomId: string; comment: any }) => void;
}

class LobbyWebSocketServer {
    private io: SocketIOServer | null = null;

    /**
     * Initialize WebSocket server
     */
    initialize(httpServer: HTTPServer): void {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.CORS_ALLOWED_ORIGINS
                    ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
                    : [
                          "http://localhost:3001",
                          "http://localhost:8601",
                          "http://localhost:8602",
                      ],
                credentials: true,
                methods: ["GET", "POST"],
            },
            path: "/socket.io/lobby/",
        });

        // Authentication middleware
        this.io.use((socket: AuthenticatedSocket, next) => {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            try {
                const decoded = verifyToken(token);
                socket.userId = decoded.userId;
                socket.walletAddress = decoded.walletAddress;
                next();
            } catch (error) {
                console.error("[LobbyWS] Authentication failed:", error);
                next(new Error("Invalid token"));
            }
        });

        // Connection handler
        this.io.on("connection", (socket: AuthenticatedSocket) => {
            console.log(
                `[LobbyWS] ✅ Client connected: ${socket.id} (user: ${socket.userId?.substring(0, 8)})`
            );

            // Subscribe to all rooms list
            socket.on("subscribe_rooms", () => {
                socket.join("rooms-list");
                console.log(
                    `[LobbyWS] User ${socket.userId?.substring(0, 8)} subscribed to rooms list`
                );
            });

            // Subscribe to specific room updates
            socket.on("subscribe_room", (roomId: string) => {
                socket.join(`room:${roomId}`);
                console.log(
                    `[LobbyWS] User ${socket.userId?.substring(0, 8)} subscribed to room ${roomId.substring(0, 8)}`
                );
            });

            // Unsubscribe from room
            socket.on("unsubscribe_room", (roomId: string) => {
                socket.leave(`room:${roomId}`);
                console.log(
                    `[LobbyWS] User ${socket.userId?.substring(0, 8)} unsubscribed from room ${roomId.substring(0, 8)}`
                );
            });

            // Send chat message
            socket.on("send_chat_message", async (data: { roomId: string; message: string }) => {
                try {
                    const { roomId, message } = data;

                    // Create comment in database
                    const { prisma } = await import("../lib/prisma");
                    const comment = await prisma.roomComment.create({
                        data: {
                            roomId,
                            userId: socket.userId!,
                            content: message,
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    profileImage: true,
                                },
                            },
                        },
                    });

                    console.log(
                        `[LobbyWS] Chat message from ${socket.userId?.substring(0, 8)} in room ${roomId.substring(0, 8)}`
                    );

                    // Broadcast to all clients in the room
                    this.chatMessage(roomId, comment);
                } catch (error: any) {
                    console.error("[LobbyWS] Failed to save chat message:", error);
                    socket.emit("error", { message: "Failed to send message" });
                }
            });

            // Disconnect handler
            socket.on("disconnect", () => {
                console.log(
                    `[LobbyWS] ❌ Client disconnected: ${socket.id} (user: ${socket.userId?.substring(0, 8)})`
                );
            });
        });

        console.log("[LobbyWS] 🚀 Lobby WebSocket server initialized");
    }

    /**
     * Emit event to all clients subscribed to rooms list
     */
    emitToRoomsList(event: string, data: any): void {
        if (!this.io) return;
        this.io.to("rooms-list").emit(event, data);
    }

    /**
     * Emit event to all clients subscribed to a specific room
     */
    emitToRoom(roomId: string, event: string, data: any): void {
        if (!this.io) return;
        this.io.to(`room:${roomId}`).emit(event, data);
    }

    /**
     * Room event emitters (called by room service)
     */

    roomCreated(room: any): void {
        console.log(`[LobbyWS] 📢 Room created: ${room.id.substring(0, 8)}`);
        this.emitToRoomsList("room_created", room);
    }

    roomUpdated(room: any): void {
        console.log(`[LobbyWS] 📢 Room updated: ${room.id.substring(0, 8)}`);
        this.emitToRoomsList("room_updated", room);
        this.emitToRoom(room.id, "room_updated", room);
    }

    roomDeleted(roomId: string): void {
        console.log(`[LobbyWS] 📢 Room deleted: ${roomId.substring(0, 8)}`);
        this.emitToRoomsList("room_deleted", roomId);
        this.emitToRoom(roomId, "room_deleted", roomId);
    }

    playerJoined(roomId: string, room: any): void {
        console.log(
            `[LobbyWS] 📢 Player joined room: ${roomId.substring(0, 8)}`
        );
        this.emitToRoomsList("player_joined", { roomId, room });
        this.emitToRoom(roomId, "player_joined", { roomId, room });
    }

    playerLeft(roomId: string, room: any): void {
        console.log(
            `[LobbyWS] 📢 Player left room: ${roomId.substring(0, 8)}`
        );
        this.emitToRoomsList("player_left", { roomId, room });
        this.emitToRoom(roomId, "player_left", { roomId, room });
    }

    playerReady(roomId: string, room: any): void {
        console.log(
            `[LobbyWS] 📢 Player ready status changed: ${roomId.substring(0, 8)}`
        );
        this.emitToRoom(roomId, "player_ready", { roomId, room });
    }

    gameStarted(roomId: string, room: any): void {
        console.log(`[LobbyWS] 📢 Game started: ${roomId.substring(0, 8)}`);
        this.emitToRoomsList("game_started", { roomId, room });
        this.emitToRoom(roomId, "game_started", { roomId, room });
    }

    gameEnded(roomId: string, room: any, winner?: string): void {
        console.log(
            `[LobbyWS] 📢 Game ended: ${roomId.substring(0, 8)} - Winner: ${winner?.substring(0, 8) || "N/A"}`
        );
        this.emitToRoomsList("game_ended", { roomId, room, winner });
        this.emitToRoom(roomId, "game_ended", { roomId, room, winner });
    }

    chatMessage(roomId: string, comment: any): void {
        console.log(`[LobbyWS] 📢 Chat message in room: ${roomId.substring(0, 8)}`);
        this.emitToRoom(roomId, "chat_message", { roomId, comment });
    }

    /**
     * Get Socket.IO server instance
     */
    getIO(): SocketIOServer | null {
        return this.io;
    }
}

// Singleton instance
export const lobbyWebSocket = new LobbyWebSocketServer();
