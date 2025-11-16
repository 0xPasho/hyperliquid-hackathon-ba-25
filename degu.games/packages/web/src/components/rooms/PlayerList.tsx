"use client";

import { Room } from "@/lib/room-api";
import { Crown, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface PlayerListProps {
    room: Room;
    compact?: boolean;
}

export function PlayerList({ room, compact = false }: PlayerListProps) {
    if (!room.players || room.players.length === 0) {
        return (
            <div className="text-center py-8 text-[#6B6B6B] text-sm">
                No players yet
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {room.players.map((player, index) => (
                <div
                    key={player.id}
                    className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-3 flex items-center justify-between hover:border-[#252525] transition-colors"
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <Avatar className="w-10 h-10 flex-shrink-0">
                            {player.user?.profileImage && (
                                <AvatarImage
                                    src={player.user.profileImage}
                                    alt={player.user?.name || "Player"}
                                />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white font-semibold">
                                {player.user?.name?.[0]?.toUpperCase() || index + 1}
                            </AvatarFallback>
                        </Avatar>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-[#E5E5E5] text-sm truncate">
                                    {player.user?.name || "Anonymous"}
                                </p>
                                {player.userId === room.hostId && (
                                    <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                                )}
                            </div>
                            {!compact && player.user?.walletAddress && (
                                <p className="text-xs text-[#6B6B6B] truncate">
                                    {player.user.walletAddress.slice(0, 6)}...
                                    {player.user.walletAddress.slice(-4)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Ready Status */}
                    {player.isReady ? (
                        <Badge
                            variant="secondary"
                            className="bg-green-600/20 text-green-400 border-green-600/30 text-xs flex-shrink-0"
                        >
                            <Check className="w-3 h-3 mr-1" />
                            Ready
                        </Badge>
                    ) : (
                        <Badge
                            variant="secondary"
                            className="bg-[#1A1A1A] text-[#6B6B6B] border-[#252525] text-xs flex-shrink-0"
                        >
                            <X className="w-3 h-3 mr-1" />
                            Not Ready
                        </Badge>
                    )}
                </div>
            ))}
        </div>
    );
}
