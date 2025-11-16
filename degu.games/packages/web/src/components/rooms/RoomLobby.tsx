"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Room,
    getRoomsByProject,
    joinRoom,
    RoomStatus,
    getRoom,
} from "@/lib/room-api";
import { RoomCard } from "./RoomCard";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinRoomDialog } from "./JoinRoomDialog";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLobbyWebSocket } from "@/hooks/useLobbyWebSocket";

interface RoomLobbyProps {
    projectId: string;
    gameMode?: number | null; // Game mode from project settings
    maxPlayers?: number | null; // Max players from project settings
    onRoomClick?: (roomId: string) => void;
}

export function RoomLobby({
    projectId,
    gameMode,
    maxPlayers,
    onRoomClick,
}: RoomLobbyProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinDialog, setShowJoinDialog] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    // Initialize WebSocket
    const lobbyWS = useLobbyWebSocket(isAuthenticated);

    const loadRooms = async () => {
        const result = await getRoomsByProject(projectId);
        if (result.success && result.data) {
            setRooms(result.data);
            setError(null);
        } else {
            setError(result.error || "Failed to load rooms");
        }
        setLoading(false);
    };

    useEffect(() => {
        // Initial load
        loadRooms();
    }, [projectId]);

    // Subscribe to WebSocket updates
    useEffect(() => {
        if (!lobbyWS.isConnected) return;

        // Subscribe to rooms list updates
        lobbyWS.subscribeToRoomsList();

        // Listen for room events
        const unsubscribeCreated = lobbyWS.on("room_created", (room: Room) => {
            // Only add if it's for this project
            if (room.projectId === projectId) {
                setRooms((prev) => [room, ...prev]);
            }
        });

        const unsubscribeUpdated = lobbyWS.on("room_updated", (room: Room) => {
            // Only update if it's for this project
            if (room.projectId === projectId) {
                setRooms((prev) =>
                    prev.map((r) => (r.id === room.id ? room : r))
                );
            }
        });

        const unsubscribeDeleted = lobbyWS.on("room_deleted", (roomId: string) => {
            setRooms((prev) => prev.filter((r) => r.id !== roomId));
        });

        const unsubscribeStarted = lobbyWS.on("game_started", ({ roomId }) => {
            // Reload room data to get updated status
            loadRooms();
        });

        const unsubscribeEnded = lobbyWS.on("game_ended", ({ roomId }) => {
            // Reload room data to get updated status
            loadRooms();
        });

        return () => {
            unsubscribeCreated();
            unsubscribeUpdated();
            unsubscribeDeleted();
            unsubscribeStarted();
            unsubscribeEnded();
        };
    }, [lobbyWS.isConnected, projectId]);

    const handleCreateRoom = () => {
        if (!isAuthenticated || !user) {
            alert("Please log in to create a room");
            return;
        }

        // Check if user already has an active room (as host)
        const hasActiveRoom = rooms.some(
            (room) =>
                room.hostId === user.id &&
                [
                    RoomStatus.WAITING,
                    RoomStatus.READY,
                    RoomStatus.PLAYING,
                ].includes(room.status)
        );

        if (hasActiveRoom) {
            alert(
                "You already have an active room. Please complete or cancel it before creating a new one."
            );
            return;
        }

        setShowCreateModal(true);
    };

    const handleRoomCreated = (roomId: string) => {
        loadRooms();
        router.push(`/rooms/${roomId}`);
    };

    const handleJoinRoom = async (roomId: string) => {
        if (!isAuthenticated || !user) {
            alert("Please log in to join a room");
            return;
        }

        // Fetch the full room details
        const roomResult = await getRoom(roomId);
        if (!roomResult.success || !roomResult.data) {
            alert(roomResult.error || "Failed to fetch room details");
            return;
        }

        const room = roomResult.data;

        // If it's a paid room, show the join dialog
        if (room.escrowGameId && room.entryFee) {
            setSelectedRoom(room);
            setShowJoinDialog(true);
        } else {
            // Free room - join directly
            const token = localStorage.getItem("authToken");
            const joinResult = await joinRoom(
                roomId,
                user.id,
                user.walletAddress,
                undefined,
                token || undefined
            );

            if (!joinResult.success) {
                alert(joinResult.error || "Failed to join room");
                return;
            }

            // Refresh rooms to show updated player count
            await loadRooms();

            // Navigate to the room page
            router.push(`/rooms/${roomId}`);
        }
    };

    const handleJoinSuccess = async () => {
        if (!user || !selectedRoom) return;

        // Join the room in the database
        const token = localStorage.getItem("authToken");
        const result = await joinRoom(
            selectedRoom.id,
            user.id,
            user.walletAddress,
            undefined,
            token || undefined
        );

        if (!result.success) {
            alert(result.error || "Failed to join room");
            return;
        }

        // Refresh rooms
        await loadRooms();

        // Navigate to the room page
        router.push(`/rooms/${selectedRoom.id}`);
    };

    const activeRooms = rooms.filter((r) =>
        [RoomStatus.WAITING, RoomStatus.READY, RoomStatus.PLAYING].includes(
            r.status
        )
    );

    // Check if current user has an active room
    const userHasActiveRoom = user
        ? activeRooms.some(
              (room) =>
                  room.hostId === user.id &&
                  [
                      RoomStatus.WAITING,
                      RoomStatus.READY,
                      RoomStatus.PLAYING,
                  ].includes(room.status)
          )
        : false;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={loadRooms}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        Game Lobbies
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {activeRooms.length} active{" "}
                        {activeRooms.length === 1 ? "room" : "rooms"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={loadRooms}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                        onClick={handleCreateRoom}
                        disabled={!isAuthenticated || userHasActiveRoom}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                        size="sm"
                        title={
                            userHasActiveRoom
                                ? "You already have an active room"
                                : undefined
                        }
                    >
                        <Plus className="w-4 h-4" />
                        {userHasActiveRoom ? "Already Hosting" : "Create Room"}
                    </Button>
                </div>
            </div>

            {activeRooms.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                    <p className="text-muted-foreground mb-4">
                        No active rooms. Be the first to create one!
                    </p>
                    <Button
                        onClick={handleCreateRoom}
                        disabled={!isAuthenticated || userHasActiveRoom}
                        className="bg-blue-600 hover:bg-blue-700"
                        title={
                            userHasActiveRoom
                                ? "You already have an active room"
                                : undefined
                        }
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {userHasActiveRoom ? "Already Hosting" : "Create Room"}
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeRooms.map((room) => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            currentUserId={user?.id}
                            onJoin={handleJoinRoom}
                            onView={onRoomClick}
                        />
                    ))}
                </div>
            )}

            <CreateRoomModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                projectId={projectId}
                hostId={user?.id || ""}
                gameMode={gameMode ?? undefined}
                maxPlayers={maxPlayers ?? undefined}
                onRoomCreated={handleRoomCreated}
            />

            {selectedRoom && (
                <JoinRoomDialog
                    open={showJoinDialog}
                    onOpenChange={setShowJoinDialog}
                    room={selectedRoom}
                    onJoinSuccess={handleJoinSuccess}
                />
            )}
        </div>
    );
}
