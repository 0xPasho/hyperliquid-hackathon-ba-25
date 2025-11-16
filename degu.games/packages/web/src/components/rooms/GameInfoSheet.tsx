"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Room } from "@/lib/room-api";
import { Users, Crown, Hash, Calendar, DollarSign } from "lucide-react";

interface GameInfoSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: Room;
}

export function GameInfoSheet({ open, onOpenChange, room }: GameInfoSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto bg-[#0A0A0A] border-t border-[#1A1A1A]">
                <div className="px-4">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-xl">Game Info</SheetTitle>
                        <SheetDescription className="text-[#6B6B6B]">
                            Room details and configuration
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-2 pb-4">
                    {/* Room & Game Names */}
                    <div className="space-y-2">
                        <div className="bg-[#0F0F0F] rounded-lg p-3 border border-[#252525]">
                            <p className="text-xs text-[#8B8B8B] mb-1 uppercase tracking-wide">
                                Room Name
                            </p>
                            <p className="text-base text-white font-semibold">{room.name}</p>
                        </div>

                        {room.project && (
                            <div className="bg-[#0F0F0F] rounded-lg p-3 border border-[#252525]">
                                <p className="text-xs text-[#8B8B8B] mb-1 uppercase tracking-wide">
                                    Game
                                </p>
                                <p className="text-base text-white font-semibold">
                                    {room.project.title}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Users className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-[#A0A0A0] font-medium">
                                    Players
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {room.currentPlayers}/{room.maxPlayers}
                            </p>
                        </div>

                        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Crown className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs text-[#A0A0A0] font-medium">
                                    Host
                                </span>
                            </div>
                            <p className="text-base font-bold text-white truncate">
                                {room.host?.name || "Unknown"}
                            </p>
                        </div>
                    </div>

                    {/* Details List */}
                    <div className="space-y-2">
                        <div className="bg-[#0F0F0F] rounded-lg p-3 border border-[#252525] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-[#6B6B6B]" />
                                <span className="text-sm text-[#A0A0A0] font-medium">
                                    Room ID
                                </span>
                            </div>
                            <span className="text-sm text-white font-mono font-semibold">
                                {room.id.slice(0, 8)}...
                            </span>
                        </div>

                        <div className="bg-[#0F0F0F] rounded-lg p-3 border border-[#252525] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#6B6B6B]" />
                                <span className="text-sm text-[#A0A0A0] font-medium">
                                    Created
                                </span>
                            </div>
                            <span className="text-sm text-white font-semibold">
                                {new Date(room.createdAt).toLocaleString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </span>
                        </div>

                        {room.entryFee && (
                            <div className="bg-[#0F0F0F] rounded-lg p-3 border border-[#252525] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-[#A0A0A0] font-medium">
                                        Entry Fee
                                    </span>
                                </div>
                                <span className="text-sm text-green-400 font-bold">
                                    {room.entryFee} USDC
                                </span>
                            </div>
                        )}

                        {room.blockchainGameId && (
                            <div className="bg-[#0F0F0F] rounded-lg p-3 border border-[#252525] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-[#A0A0A0] font-medium">
                                        Blockchain Game
                                    </span>
                                </div>
                                <span className="text-sm text-blue-400 font-bold">
                                    #{room.blockchainGameId}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
