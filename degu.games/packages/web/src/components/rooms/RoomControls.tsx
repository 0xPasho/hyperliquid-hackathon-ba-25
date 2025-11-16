"use client";

import { Button } from "@/components/ui/button";
import { Room, RoomStatus } from "@/lib/room-api";
import { Play, Check, X, Loader2, Copy } from "lucide-react";
import { useState } from "react";

interface RoomControlsProps {
    room: Room;
    isHost: boolean;
    isInRoom: boolean;
    currentPlayerIsReady: boolean;
    onJoinRoom?: () => Promise<void>;
    onToggleReady: () => Promise<void>;
    onStartGame: () => Promise<void>;
    onLeaveRoom: () => Promise<void>;
    onCancelRoom: () => Promise<void>;
    onCopyLink: () => void;
    copied: boolean;
}

export function RoomControls({
    room,
    isHost,
    isInRoom,
    currentPlayerIsReady,
    onJoinRoom,
    onToggleReady,
    onStartGame,
    onLeaveRoom,
    onCancelRoom,
    onCopyLink,
    copied,
}: RoomControlsProps) {
    const [toggling, setToggling] = useState(false);
    const [starting, setStarting] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [joining, setJoining] = useState(false);

    // Host is alone in the room
    const hostIsAlone = isHost && room.currentPlayers === 1;

    const handleJoinRoom = async () => {
        if (!onJoinRoom) return;
        setJoining(true);
        try {
            await onJoinRoom();
        } finally {
            setJoining(false);
        }
    };

    // Host has other players
    const hostHasOthers = isHost && room.currentPlayers > 1;

    // Can start when:
    // 1. User is host
    // 2. Room is READY (all players marked ready)
    // 3. Room is full (currentPlayers === maxPlayers)
    const canStart =
        isHost &&
        room.status === RoomStatus.READY &&
        room.currentPlayers === room.maxPlayers &&
        room.currentPlayers >= 1; // Allow single player for testing, or >= 2 for multiplayer

    const handleToggleReady = async () => {
        setToggling(true);
        try {
            await onToggleReady();
        } finally {
            setToggling(false);
        }
    };

    const handleStartGame = async () => {
        setStarting(true);
        try {
            await onStartGame();
        } finally {
            setStarting(false);
        }
    };

    const handleLeaveOrCancel = async () => {
        setLeaving(true);
        try {
            // Host alone? Call cancel which triggers blockchain refund
            if (hostIsAlone) {
                await onCancelRoom();
            } else {
                // Regular player or host with others
                await onLeaveRoom();
            }
        } finally {
            setLeaving(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Join Room Button - Show only when not in room */}
            {!isInRoom && onJoinRoom && (
                <Button
                    onClick={handleJoinRoom}
                    disabled={joining || room.currentPlayers >= room.maxPlayers}
                    className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {joining ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Play className="w-4 h-4 mr-2" />
                    )}
                    {room.currentPlayers >= room.maxPlayers ? "Room Full" : "Join Room"}
                </Button>
            )}

            {/* Only show controls below if user is in room */}
            {!isInRoom && <div className="text-center text-sm text-[#8B8B8B] py-2">
                Join the room to access game controls
            </div>}

            {isInRoom && (
            <>
            {/* Copy Link Button */}
            <Button
                onClick={onCopyLink}
                variant="outline"
                className="w-full gap-2 bg-[#1A1A1A] border-[#252525] hover:bg-[#252525] text-[#E5E5E5]"
                size="sm"
            >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy Room Link"}
            </Button>

            {/* Waiting/Ready State Controls */}
            {(room.status === RoomStatus.WAITING ||
                room.status === RoomStatus.READY) && (
                <>
                    {/* Ready Up Button - Show for all players including host */}
                    <Button
                        onClick={handleToggleReady}
                        disabled={toggling}
                        className={`w-full h-11 text-base font-semibold ${
                            currentPlayerIsReady
                                ? "bg-[#1A1A1A] hover:bg-[#252525] text-[#E5E5E5]"
                                : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                    >
                        {toggling ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : currentPlayerIsReady ? (
                            <X className="w-4 h-4 mr-2" />
                        ) : (
                            <Check className="w-4 h-4 mr-2" />
                        )}
                        {currentPlayerIsReady ? "Cancel Ready" : "Ready Up"}
                    </Button>

                    {/* Start Game Button - Only for host, only when can start */}
                    {isHost && canStart && (
                        <Button
                            onClick={handleStartGame}
                            disabled={starting}
                            className="w-full h-11 text-base font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {starting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 mr-2" />
                            )}
                            Start Game
                        </Button>
                    )}
                </>
            )}

            {/* Leave/Cancel Room Button */}
            {(room.status === RoomStatus.WAITING ||
                room.status === RoomStatus.READY) && (
                <>
                    <Button
                        onClick={handleLeaveOrCancel}
                        disabled={leaving || hostHasOthers}
                        variant="outline"
                        className="w-full border-red-600/30 text-red-400 hover:bg-red-600/10 hover:border-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                            hostHasOthers
                                ? "Cannot leave with other players. Wait for game to complete."
                                : undefined
                        }
                    >
                        {leaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : hostIsAlone ? (
                            room.blockchainGameId
                                ? "Cancel Room & Refund"
                                : "Cancel Room"
                        ) : (
                            "Leave Room"
                        )}
                    </Button>
                    {hostHasOthers && (
                        <p className="text-xs text-red-400/70 -mt-2">
                            Host cannot leave while others are in the room
                        </p>
                    )}
                </>
            )}
            </>
            )}
        </div>
    );
}
