/**
 * useLobbyWebSocket - Hook for real-time lobby updates via WebSocket
 */

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";
import { Room } from "@/lib/room-api";

// Extract base URL (remove /api/v1 suffix if present)
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/api\/v1$/, "");

interface LobbyEvents {
    room_created: (room: Room) => void;
    room_updated: (room: Room) => void;
    room_deleted: (roomId: string) => void;
    player_joined: (data: { roomId: string; room: Room }) => void;
    player_left: (data: { roomId: string; room: Room }) => void;
    player_ready: (data: { roomId: string; room: Room }) => void;
    game_started: (data: { roomId: string; room: Room }) => void;
    game_ended: (data: { roomId: string; room: Room; winner?: string }) => void;
    chat_message: (data: { roomId: string; comment: any }) => void;
}

export function useLobbyWebSocket(enabled: boolean = true) {
    const { token } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

    useEffect(() => {
        if (!enabled || !token) {
            return;
        }

        // Create socket connection
        // Connect to the API server base URL with custom Socket.IO path
        console.log("[LobbyWS] Connecting to:", API_BASE_URL, "with path:", "/socket.io/lobby/");
        const socket = io(API_BASE_URL, {
            path: "/socket.io/lobby/",
            auth: {
                token: token,
            },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        // Connection handlers
        socket.on("connect", () => {
            console.log("[LobbyWS] 🔌 Connected to lobby WebSocket");
            setIsConnected(true);
            setError(null);
        });

        socket.on("disconnect", () => {
            console.log("[LobbyWS] ❌ Disconnected from lobby WebSocket");
            setIsConnected(false);
        });

        socket.on("connect_error", (err) => {
            console.error("[LobbyWS] Connection error:", err.message);
            setError(err.message);
            setIsConnected(false);
        });

        // Event relay - forward all events to registered listeners
        const events: (keyof LobbyEvents)[] = [
            "room_created",
            "room_updated",
            "room_deleted",
            "player_joined",
            "player_left",
            "player_ready",
            "game_started",
            "game_ended",
            "chat_message",
        ];

        events.forEach((event) => {
            socket.on(event, (data: any) => {
                const listeners = listenersRef.current.get(event);
                if (listeners) {
                    listeners.forEach((callback) => callback(data));
                }
            });
        });

        // Cleanup on unmount
        return () => {
            console.log("[LobbyWS] 🔌 Disconnecting from lobby WebSocket");
            socket.disconnect();
            socketRef.current = null;
        };
    }, [enabled, token]);

    /**
     * Subscribe to all rooms list updates
     */
    const subscribeToRoomsList = () => {
        if (socketRef.current?.connected) {
            console.log("[LobbyWS] 📡 Subscribing to rooms list");
            socketRef.current.emit("subscribe_rooms");
        }
    };

    /**
     * Subscribe to specific room updates
     */
    const subscribeToRoom = (roomId: string) => {
        if (socketRef.current?.connected) {
            console.log(`[LobbyWS] 📡 Subscribing to room ${roomId.substring(0, 8)}`);
            socketRef.current.emit("subscribe_room", roomId);
        }
    };

    /**
     * Unsubscribe from specific room updates
     */
    const unsubscribeFromRoom = (roomId: string) => {
        if (socketRef.current?.connected) {
            console.log(`[LobbyWS] 📡 Unsubscribing from room ${roomId.substring(0, 8)}`);
            socketRef.current.emit("unsubscribe_room", roomId);
        }
    };

    /**
     * Register event listener
     */
    const on = <K extends keyof LobbyEvents>(
        event: K,
        callback: LobbyEvents[K]
    ) => {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event)!.add(callback as Function);

        // Return cleanup function
        return () => {
            listenersRef.current.get(event)?.delete(callback as Function);
        };
    };

    /**
     * Unregister event listener
     */
    const off = <K extends keyof LobbyEvents>(
        event: K,
        callback: LobbyEvents[K]
    ) => {
        listenersRef.current.get(event)?.delete(callback as Function);
    };

    /**
     * Send chat message to room
     */
    const sendChatMessage = (roomId: string, message: string) => {
        if (socketRef.current?.connected) {
            console.log(`[LobbyWS] 📨 Sending chat message to room ${roomId.substring(0, 8)}`);
            socketRef.current.emit("send_chat_message", { roomId, message });
        }
    };

    return {
        isConnected,
        error,
        subscribeToRoomsList,
        subscribeToRoom,
        unsubscribeFromRoom,
        on,
        off,
        sendChatMessage,
    };
}
