"use client";

import { useRouter } from "next/navigation";
import { Room, RoomStatus } from "@/lib/room-api";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoomCardProps {
    room: Room;
    onJoin?: (roomId: string) => void;
    onView?: (roomId: string) => void;
    currentUserId?: string;
}

export function RoomCard({ room, onJoin, onView, currentUserId }: RoomCardProps) {
    const router = useRouter();
    const isHost = currentUserId === room.hostId;
    const isFull = room.currentPlayers >= room.maxPlayers;
    const isWaiting = room.status === RoomStatus.WAITING;
    const isPlaying = room.status === RoomStatus.PLAYING;
    const canJoin = isWaiting && !isFull && !isHost;

    const handleClick = () => {
        router.push(`/rooms/${room.id}`);
    };

    // Calculate prize pool (entry fee * max players)
    const prizePool = room.entryFee && room.maxPlayers
        ? (parseFloat(room.entryFee) * room.maxPlayers).toFixed(2)
        : null;

    // Status badge styles
    const getStatusStyle = () => {
        switch (room.status) {
            case RoomStatus.WAITING:
                return "bg-[#8B6914]/20 text-[#FDB022] border-[#8B6914]/30";
            case RoomStatus.PLAYING:
                return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case RoomStatus.COMPLETED:
                return "bg-[#6B6B6B]/20 text-[#8B8B8B] border-[#6B6B6B]/30";
            default:
                return "bg-[#6B6B6B]/20 text-[#8B8B8B] border-[#6B6B6B]/30";
        }
    };

    const getStatusText = () => {
        if (isFull && isWaiting) return "Full";
        switch (room.status) {
            case RoomStatus.WAITING:
                return "Waiting";
            case RoomStatus.PLAYING:
                return "Playing";
            case RoomStatus.COMPLETED:
                return "Ended";
            default:
                return "Closed";
        }
    };

    return (
        <div
            onClick={handleClick}
            className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-5 hover:border-[#252525] hover:bg-[#141414] transition-all duration-150 cursor-pointer group"
        >
            {/* Entry Fee & Prize Pool - Most Important */}
            <div className="mb-4">
                {room.entryFee ? (
                    <>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl font-semibold text-[#E5E5E5]">
                                {room.entryFee} USDC
                            </span>
                            <span className="text-sm text-[#6B6B6B]">entry</span>
                        </div>
                        {prizePool && (
                            <div className="flex items-baseline gap-2">
                                <span className="text-base font-medium text-[#10B981]">
                                    {prizePool} USDC
                                </span>
                                <span className="text-xs text-[#6B6B6B]">prize pool</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-xl font-semibold text-[#E5E5E5]">
                        Free Play
                    </div>
                )}
            </div>

            {/* Players & Status - Secondary Info */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 text-[#E5E5E5]">
                    <Users className="w-4 h-4 text-[#8B8B8B]" />
                    <span className="text-sm font-medium">
                        {room.currentPlayers}/{room.maxPlayers}
                    </span>
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusStyle()}`}>
                    {getStatusText()}
                </div>
            </div>

            {/* Host - Least Important */}
            {room.host && (
                <div className="text-xs text-[#6B6B6B] mb-4">
                    Host: <span className="text-[#8B8B8B]">{room.host.name || "Anonymous"}</span>
                </div>
            )}

            {/* Action Button */}
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    if (canJoin && onJoin) {
                        onJoin(room.id);
                    } else {
                        handleClick();
                    }
                }}
                className={`w-full ${
                    canJoin
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-[#1A1A1A] hover:bg-[#252525] text-[#E5E5E5] border border-[#252525]"
                }`}
                size="sm"
            >
                {canJoin ? "Join Room" : isHost ? "Manage Room" : "View Room"}
            </Button>
        </div>
    );
}
