"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLobbyWebSocket } from "@/hooks/useLobbyWebSocket";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Room,
    RoomStatus,
    getRoom,
    joinRoom,
    leaveRoom,
    cancelRoom,
    toggleReady,
    startGame,
} from "@/lib/room-api";
import { RoomHeader } from "@/components/rooms/RoomHeader";
import { GameInfoSheet } from "@/components/rooms/GameInfoSheet";
import { TutorialSheet } from "@/components/rooms/TutorialSheet";
import { GameIframe } from "@/components/rooms/GameIframe";
import { GameResults } from "@/components/rooms/GameResults";
import { RoomSidebar } from "@/components/rooms/RoomSidebar";
import { RoomChat } from "@/components/rooms/RoomChat";
import { PlayerList } from "@/components/rooms/PlayerList";
import { RoomControls } from "@/components/rooms/RoomControls";
import { JoinRoomDialog } from "@/components/rooms/JoinRoomDialog";
import { AppSidebar } from "@/modules/home/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const SCRATCH_GUI_URL =
    process.env.NEXT_PUBLIC_SCRATCH_GUI_URL || "http://localhost:8601";

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [winnerId, setWinnerId] = useState<string | null>(null);

    // Bottom sheet states
    const [showGameInfo, setShowGameInfo] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Mobile sheet states
    const [showMobilePlayers, setShowMobilePlayers] = useState(false);

    // Join room dialog
    const [showJoinDialog, setShowJoinDialog] = useState(false);

    const roomId = params.id as string;
    const isHost = user?.id === room?.hostId;
    const currentPlayer = room?.players?.find((p) => p.userId === user?.id);
    const isInRoom = !!currentPlayer;

    // Initialize WebSocket
    const lobbyWS = useLobbyWebSocket(isAuthenticated);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated && !loading) {
            localStorage.setItem("returnUrl", window.location.pathname);
            router.push("/");
        }
    }, [isAuthenticated, loading, router]);

    // Load room initially
    useEffect(() => {
        async function loadRoom() {
            const result = await getRoom(roomId);
            if (result.success && result.data) {
                setRoom(result.data);
                setError(null);
            } else {
                setError(result.error || "Failed to load room");
            }
            setLoading(false);
        }

        if (isAuthenticated) {
            loadRoom();
        }
    }, [roomId, isAuthenticated]);

    // Subscribe to WebSocket updates for this room
    useEffect(() => {
        if (!lobbyWS.isConnected || !roomId) return;

        // Subscribe to this specific room's updates
        lobbyWS.subscribeToRoom(roomId);

        // Listen for room events - use WebSocket data directly (no API polling)
        const unsubscribeUpdated = lobbyWS.on("room_updated", (updatedRoom: Room) => {
            if (updatedRoom.id === roomId) {
                setRoom(updatedRoom);
            }
        });

        const unsubscribePlayerJoined = lobbyWS.on("player_joined", ({ roomId: eventRoomId, room: updatedRoom }) => {
            if (eventRoomId === roomId) {
                setRoom(updatedRoom);
            }
        });

        const unsubscribePlayerLeft = lobbyWS.on("player_left", ({ roomId: eventRoomId, room: updatedRoom }) => {
            if (eventRoomId === roomId) {
                setRoom(updatedRoom);
            }
        });

        const unsubscribePlayerReady = lobbyWS.on("player_ready", ({ roomId: eventRoomId, room: updatedRoom }) => {
            if (eventRoomId === roomId) {
                setRoom(updatedRoom);
            }
        });

        const unsubscribeGameStarted = lobbyWS.on("game_started", ({ roomId: eventRoomId, room: updatedRoom }) => {
            if (eventRoomId === roomId) {
                setRoom(updatedRoom);
            }
        });

        const unsubscribeGameEnded = lobbyWS.on("game_ended", ({ roomId: eventRoomId, room: updatedRoom, winner }) => {
            if (eventRoomId === roomId) {
                setRoom(updatedRoom);
                if (winner) {
                    setWinnerId(winner);
                }
            }
        });

        const unsubscribeDeleted = lobbyWS.on("room_deleted", (deletedRoomId: string) => {
            if (deletedRoomId === roomId) {
                // Room was deleted, redirect back
                alert("Room has been closed");
                router.push("/");
            }
        });

        return () => {
            lobbyWS.unsubscribeFromRoom(roomId);
            unsubscribeUpdated();
            unsubscribePlayerJoined();
            unsubscribePlayerLeft();
            unsubscribePlayerReady();
            unsubscribeGameStarted();
            unsubscribeGameEnded();
            unsubscribeDeleted();
        };
    }, [lobbyWS.isConnected, roomId, router]);

    // Handlers
    const handleBack = () => {
        if (room?.projectId) {
            router.push(`/game/${room.projectId}`);
        } else {
            router.push("/");
        }
    };

    const handleToggleSound = () => {
        setSoundEnabled(!soundEnabled);
        // TODO: Send message to iframe to toggle sound
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleReady = async () => {
        if (!user) return;
        const token = localStorage.getItem("authToken");
        const result = await toggleReady(roomId, user.id, token || undefined);
        if (!result.success) {
            alert(result.error || "Failed to toggle ready status");
            return;
        }

        // WebSocket will update room state automatically
    };

    const handleJoinRoom = () => {
        if (!user) return;

        // Check if room is full
        if (room && room.currentPlayers >= room.maxPlayers) {
            alert("Room is full");
            return;
        }

        // Open join dialog which will handle payment if needed
        setShowJoinDialog(true);
    };

    const handleJoinSuccess = async () => {
        // WebSocket will update room state automatically
        console.log("[Room] Successfully joined room, WebSocket will sync...");
    };

    const handleStartGame = async () => {
        if (!user || !isHost) return;

        const token = localStorage.getItem("authToken");

        // Start the game and get VM server info
        const result = await startGame(roomId, user.id, token || undefined);

        console.log("[Room] startGame result:", result);

        if (!result.success || !result.data) {
            alert(result.error || "Failed to start game");
            return;
        }

        console.log("[Room] VM Status:", result.data.vmStatus);
        console.log("[Room] VM Server URL:", result.data.vmServerUrl);

        if (result.data.vmStatus === "ready" && result.data.vmServerUrl) {
            // Game started successfully - room status will update to PLAYING
            // UI will automatically show the game iframe
            console.log(
                "[Room] Game started, VM server ready:",
                result.data.vmServerUrl
            );

            // WebSocket will update room state with vmServerUrl automatically
        } else if (result.data.vmStatus === "queued") {
            // Game is queued
            alert(
                `Game queued at position ${
                    result.data.vmQueuePosition || "unknown"
                }. Please wait...`
            );
        } else {
            alert("Unknown VM server status");
        }
    };

    const handleLeaveRoom = async () => {
        if (!user) return;

        const confirmMessage = isHost
            ? "As the host, leaving will cancel the game for all players. Continue?"
            : "Are you sure you want to leave this room?";

        if (!confirm(confirmMessage)) return;

        const token = localStorage.getItem("authToken");
        const result = await leaveRoom(roomId, user.id, token || undefined);
        if (!result.success) {
            alert(result.error || "Failed to leave room");
            return;
        }
        handleBack();
    };

    const handleCancelRoom = async () => {
        if (!user) return;

        const confirmMessage = room?.blockchainGameId
            ? "Cancel room and refund all players? This will process a blockchain refund transaction."
            : "Are you sure you want to cancel this room?";

        if (!confirm(confirmMessage)) return;

        const token = localStorage.getItem("authToken");

        // First, mark room as cancelled in database
        const result = await cancelRoom(
            roomId,
            user.id,
            "Cancelled by host",
            token || undefined
        );
        if (!result.success) {
            alert(result.error || "Failed to cancel room");
            return;
        }

        // For blockchain games, the user will need to call cancelGameAndRefund from their wallet
        // This is handled in the user-escrow-client.ts cancelGameAndRefund function
        // TODO: Integrate with Privy wallet to call blockchain refund
        if (room?.blockchainGameId) {
            console.log(
                "[Room] Blockchain refund needs to be processed for game:",
                room.blockchainGameId
            );
            // The cancelGameAndRefund function from user-escrow-client.ts should be called here
            // Example: await cancelGameAndRefund(walletClient, room.blockchainGameId);
        }

        handleBack();
    };

    // Loading state with skeleton
    if (loading) {
        return (
            <SidebarProvider defaultOpen={false}>
                <div className="relative flex min-h-screen w-full bg-black">
                    {/* Sidebar */}
                    <div className="fixed left-0 top-0 bottom-0 z-50 hidden md:block">
                        <AppSidebar />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 md:ml-12 flex flex-col overflow-hidden">
                        {/* Top Navigation Bar Skeleton */}
                        <div className="h-14 bg-[#0F0F0F] border-b border-[#1A1A1A] px-4 flex items-center gap-4">
                            <Skeleton className="w-8 h-8 rounded-md bg-[#1A1A1A]" />
                            <div className="flex-1">
                                <Skeleton className="w-48 h-4 mb-2 bg-[#1A1A1A]" />
                                <Skeleton className="w-32 h-3 bg-[#1A1A1A]" />
                            </div>
                            <Skeleton className="w-8 h-8 rounded-md bg-[#1A1A1A]" />
                            <Skeleton className="w-8 h-8 rounded-md bg-[#1A1A1A]" />
                            <Skeleton className="w-8 h-8 rounded-md bg-[#1A1A1A]" />
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Game Area Skeleton */}
                            <div className="flex-1 flex flex-col lg:border-r lg:border-[#1A1A1A]">
                                <div className="flex-1 relative bg-[#0F0F0F] p-8">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center max-w-md w-full space-y-6">
                                            <Skeleton className="w-20 h-20 rounded-full mx-auto bg-[#1A1A1A]" />
                                            <Skeleton className="w-48 h-6 mx-auto bg-[#1A1A1A]" />
                                            <Skeleton className="w-64 h-4 mx-auto bg-[#1A1A1A]" />

                                            {/* Player Status Card Skeleton */}
                                            <div className="bg-[#1A1A1A] rounded-lg p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Skeleton className="w-16 h-3 bg-[#2A2A2A]" />
                                                    <Skeleton className="w-12 h-4 bg-[#2A2A2A]" />
                                                </div>
                                                <Skeleton className="w-32 h-4 bg-[#2A2A2A]" />
                                            </div>

                                            {/* Game Info Card Skeleton */}
                                            <div className="bg-[#1A1A1A] rounded-lg p-4 space-y-2">
                                                <Skeleton className="w-40 h-4 bg-[#2A2A2A]" />
                                                <Skeleton className="w-full h-3 bg-[#2A2A2A]" />
                                                <Skeleton className="w-3/4 h-3 bg-[#2A2A2A]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Chat Skeleton */}
                                <div className="lg:hidden h-[200px] border-t border-[#1A1A1A] bg-black p-4 space-y-3">
                                    <Skeleton className="w-32 h-4 bg-[#1A1A1A]" />
                                    <div className="space-y-2">
                                        <Skeleton className="w-3/4 h-10 bg-[#1A1A1A]" />
                                        <Skeleton className="w-2/3 h-10 ml-auto bg-[#1A1A1A]" />
                                        <Skeleton className="w-4/5 h-10 bg-[#1A1A1A]" />
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Sidebar Skeleton */}
                            <div className="hidden lg:flex lg:w-[380px] flex-col bg-[#0F0F0F] border-l border-[#1A1A1A]">
                                {/* Players Section */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                    <Skeleton className="w-24 h-5 mb-4 bg-[#1A1A1A]" />
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A]"
                                        >
                                            <Skeleton className="w-10 h-10 rounded-full bg-[#2A2A2A]" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="w-24 h-4 bg-[#2A2A2A]" />
                                                <Skeleton className="w-16 h-3 bg-[#2A2A2A]" />
                                            </div>
                                            <Skeleton className="w-6 h-6 rounded-full bg-[#2A2A2A]" />
                                        </div>
                                    ))}
                                </div>

                                {/* Controls Section */}
                                <div className="border-t border-[#1A1A1A] p-4 space-y-3">
                                    <Skeleton className="w-full h-10 rounded-lg bg-[#1A1A1A]" />
                                    <Skeleton className="w-full h-10 rounded-lg bg-[#1A1A1A]" />
                                    <Skeleton className="w-full h-8 rounded-lg bg-[#1A1A1A]" />
                                </div>

                                {/* Chat Section */}
                                <div className="border-t border-[#1A1A1A] p-4 h-[300px] space-y-3">
                                    <Skeleton className="w-20 h-4 bg-[#1A1A1A]" />
                                    <div className="space-y-2">
                                        <Skeleton className="w-3/4 h-10 bg-[#1A1A1A]" />
                                        <Skeleton className="w-2/3 h-10 ml-auto bg-[#1A1A1A]" />
                                        <Skeleton className="w-4/5 h-10 bg-[#1A1A1A]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarProvider>
        );
    }

    // Room not found or error
    if (!room) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[#E5E5E5] text-xl mb-4">
                        {error || "Room not found"}
                    </p>
                    {error && (
                        <p className="text-red-500 mb-4 text-sm">{error}</p>
                    )}
                    <button
                        onClick={handleBack}
                        className="text-blue-400 hover:text-blue-300"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="relative flex min-h-screen w-full bg-black">
                {/* Sidebar */}
                <div className="fixed left-0 top-0 bottom-0 z-50 hidden md:block">
                    <AppSidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 md:ml-12 flex flex-col overflow-hidden">
                    {/* Room Header */}
                    <RoomHeader
                        title={room.name}
                        subtitle={room.project?.title}
                        onBack={handleBack}
                        onGameInfo={() => setShowGameInfo(true)}
                        onToggleSound={handleToggleSound}
                        onViewTutorial={() => setShowTutorial(true)}
                    />

                    {/* Main Content Area */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Game Area - Full screen on mobile, left panel on desktop */}
                        <div className="flex-1 flex flex-col lg:border-r lg:border-[#1A1A1A] overflow-hidden">
                            {/* Game Preview / Waiting State */}
                            <div className="flex-1 relative bg-[#0F0F0F]">
                                {room.status === "COMPLETED" ? (
                                    // Game completed - show results
                                    <GameResults room={room} winnerId={winnerId || room.winnerId} />
                                ) : room.status === "PLAYING" ? (
                                    // Game is running - show game iframe
                                    <GameIframe
                                        projectId={room.projectId}
                                        user={user}
                                        isAuthenticated={isAuthenticated}
                                        scratchGuiUrl={SCRATCH_GUI_URL}
                                        className="absolute inset-0 w-full h-full"
                                        isPlaying={true}
                                        room={room}
                                    />
                                ) : (
                                    // Waiting state - show player readiness
                                    <div className="absolute inset-0 flex items-center justify-center p-8">
                                        <div className="text-center max-w-md">
                                            <div className="mb-6">
                                                <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4">
                                                    <svg
                                                        className="w-10 h-10 text-[#4B4B4B]"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                </div>
                                                <h2 className="text-2xl font-bold text-[#E5E5E5] mb-2">
                                                    Waiting to Start
                                                </h2>
                                                <p className="text-[#8B8B8B] mb-6">
                                                    {room.status === "WAITING"
                                                        ? "Players need to mark themselves as ready"
                                                        : "All players are ready! Host can start the game"}
                                                </p>
                                            </div>

                                            {/* Player Status */}
                                            <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[#8B8B8B] text-sm">
                                                        Players
                                                    </span>
                                                    <span className="text-[#E5E5E5] font-semibold">
                                                        {room.currentPlayers}/
                                                        {room.maxPlayers}
                                                    </span>
                                                </div>
                                                {room.status === "READY" && (
                                                    <div className="flex items-center gap-2 text-green-400 text-sm">
                                                        <Check className="w-4 h-4" />
                                                        <span>
                                                            All players ready!
                                                        </span>
                                                    </div>
                                                )}
                                                {room.status === "WAITING" && (
                                                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>
                                                            Waiting for
                                                            players...
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Game Info */}
                                            <div className="text-left bg-[#1A1A1A] rounded-lg p-4">
                                                <h3 className="text-[#E5E5E5] font-semibold mb-2">
                                                    {room.project?.title ||
                                                        "Game"}
                                                </h3>
                                                {room.project?.description && (
                                                    <p className="text-[#8B8B8B] text-sm">
                                                        {
                                                            room.project
                                                                .description
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile-only: Action Controls - Always Visible */}
                            <div className="lg:hidden border-t border-[#1A1A1A] bg-black p-4">
                                <RoomControls
                                    room={room}
                                    isHost={isHost}
                                    isInRoom={isInRoom}
                                    currentPlayerIsReady={
                                        currentPlayer?.isReady || false
                                    }
                                    onJoinRoom={handleJoinRoom}
                                    onToggleReady={handleToggleReady}
                                    onStartGame={handleStartGame}
                                    onLeaveRoom={handleLeaveRoom}
                                    onCancelRoom={handleCancelRoom}
                                    onCopyLink={handleCopyLink}
                                    copied={copied}
                                />
                            </div>

                            {/* Mobile-only: Players Section (collapsible) */}
                            <div className="lg:hidden border-t border-[#1A1A1A] bg-black">
                                <button
                                    onClick={() =>
                                        setShowMobilePlayers(!showMobilePlayers)
                                    }
                                    className="w-full px-4 py-3 flex items-center justify-between text-[#E5E5E5] hover:bg-[#0F0F0F]"
                                >
                                    <span className="font-semibold">
                                        Players ({room.currentPlayers}/
                                        {room.maxPlayers})
                                    </span>
                                    <svg
                                        className={`w-5 h-5 transition-transform ${
                                            showMobilePlayers
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {showMobilePlayers && (
                                    <div className="px-4 pb-4 max-h-[300px] overflow-y-auto">
                                        <PlayerList room={room} />
                                    </div>
                                )}
                            </div>

                            {/* Mobile-only: Chat at bottom */}
                            <div className="lg:hidden flex-shrink-0">
                                <RoomChat
                                    roomId={room.id}
                                    currentUserId={user?.id}
                                    currentUserName={user?.name}
                                    currentUserAvatar={user?.profileImage}
                                    lobbyWS={lobbyWS}
                                />
                            </div>
                        </div>

                        {/* Desktop-only: Right Sidebar */}
                        <RoomSidebar
                            room={room}
                            isHost={isHost}
                            isInRoom={isInRoom}
                            currentPlayerIsReady={
                                currentPlayer?.isReady || false
                            }
                            currentUserId={user?.id}
                            onJoinRoom={handleJoinRoom}
                            onToggleReady={handleToggleReady}
                            onStartGame={handleStartGame}
                            onLeaveRoom={handleLeaveRoom}
                            onCancelRoom={handleCancelRoom}
                            onCopyLink={handleCopyLink}
                            copied={copied}
                            lobbyWS={lobbyWS}
                        />
                    </div>

                    {/* Bottom Sheets */}
                    <GameInfoSheet
                        open={showGameInfo}
                        onOpenChange={setShowGameInfo}
                        room={room}
                    />

                    <TutorialSheet
                        open={showTutorial}
                        onOpenChange={setShowTutorial}
                        room={room}
                    />

                    {/* Join Room Dialog (with payment) */}
                    {room && user && !isInRoom && (
                        <JoinRoomDialog
                            open={showJoinDialog}
                            onOpenChange={setShowJoinDialog}
                            room={room}
                            userId={user.id}
                            walletAddress={user.walletAddress}
                            onJoinSuccess={handleJoinSuccess}
                        />
                    )}
                </div>
            </div>
        </SidebarProvider>
    );
}
