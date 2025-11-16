"use client";

import { Room, RoomStatus } from "@/lib/room-api";
import { PlayerList } from "./PlayerList";
import { RoomControls } from "./RoomControls";
import { RoomChat } from "./RoomChat";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface RoomSidebarProps {
    room: Room;
    isHost: boolean;
    isInRoom: boolean;
    currentPlayerIsReady: boolean;
    currentUserId?: string;
    onJoinRoom?: () => Promise<void>;
    onToggleReady: () => Promise<void>;
    onStartGame: () => Promise<void>;
    onLeaveRoom: () => Promise<void>;
    onCancelRoom: () => Promise<void>;
    onCopyLink: () => void;
    copied: boolean;
    lobbyWS?: any; // WebSocket instance
}

export function RoomSidebar({
    room,
    isHost,
    isInRoom,
    currentPlayerIsReady,
    currentUserId,
    onJoinRoom,
    onToggleReady,
    onStartGame,
    onLeaveRoom,
    onCancelRoom,
    onCopyLink,
    copied,
    lobbyWS,
}: RoomSidebarProps) {
    const statusColor = {
        [RoomStatus.WAITING]:
            "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
        [RoomStatus.READY]:
            "bg-green-600/20 text-green-400 border-green-600/30",
        [RoomStatus.PLAYING]:
            "bg-blue-600/20 text-blue-400 border-blue-600/30",
        [RoomStatus.COMPLETED]:
            "bg-gray-600/20 text-gray-400 border-gray-600/30",
        [RoomStatus.CANCELLED]:
            "bg-red-600/20 text-red-400 border-red-600/30",
    };

    const statusText = {
        [RoomStatus.WAITING]: "Waiting",
        [RoomStatus.READY]: "Ready",
        [RoomStatus.PLAYING]: "Playing",
        [RoomStatus.COMPLETED]: "Completed",
        [RoomStatus.CANCELLED]: "Cancelled",
    };

    return (
        <div className="hidden lg:flex lg:flex-col w-[380px] border-l border-[#1A1A1A] bg-black h-full">
            {/* Compact Room Info Header */}
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex-shrink-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-[#E5E5E5] truncate">
                            {room.name}
                        </h2>
                        {room.project && (
                            <p className="text-xs text-[#6B6B6B] truncate">
                                {room.project.title}
                            </p>
                        )}
                    </div>
                    <Badge
                        variant="secondary"
                        className={`${statusColor[room.status]} text-xs flex-shrink-0`}
                    >
                        {statusText[room.status]}
                    </Badge>
                </div>

                {/* Players Count */}
                <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-[#6B6B6B]" />
                    <span className="text-[#8B8B8B]">
                        {room.currentPlayers}/{room.maxPlayers} Players
                    </span>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                {/* Controls - Show for everyone */}
                <div className="p-4 border-b border-[#1A1A1A] flex-shrink-0">
                    <RoomControls
                        room={room}
                        isHost={isHost}
                        isInRoom={isInRoom}
                        currentPlayerIsReady={currentPlayerIsReady}
                        onJoinRoom={onJoinRoom}
                        onToggleReady={onToggleReady}
                        onStartGame={onStartGame}
                        onLeaveRoom={onLeaveRoom}
                        onCancelRoom={onCancelRoom}
                        onCopyLink={onCopyLink}
                        copied={copied}
                    />
                </div>

                {/* Player List */}
                <div className="p-4 border-b border-[#1A1A1A] flex-shrink-0">
                    <h3 className="text-sm font-semibold text-[#E5E5E5] mb-3">
                        Players ({room.currentPlayers}/{room.maxPlayers})
                    </h3>
                    <PlayerList room={room} compact />
                </div>

                {/* Chat - Fixed height with scroll */}
                <div className="flex flex-col flex-shrink-0">
                    <div className="px-4 pt-4 pb-2 flex-shrink-0">
                        <h3 className="text-sm font-semibold text-[#E5E5E5]">
                            Chat
                        </h3>
                    </div>
                    <div className="h-[400px]">
                        <RoomChat
                            roomId={room.id}
                            currentUserId={currentUserId}
                            currentUserName={room.players?.find(p => p.userId === currentUserId)?.user?.name}
                            currentUserAvatar={room.players?.find(p => p.userId === currentUserId)?.user?.profileImage}
                            className="h-full"
                            lobbyWS={lobbyWS}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
