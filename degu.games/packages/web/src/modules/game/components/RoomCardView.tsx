"use client";

import { Room, RoomStatus } from "@/lib/room-api";
import { Project } from "@/lib/types";
import Link from "next/link";

interface RoomCardViewProps {
    rooms: Room[];
    project: Project;
}

export function RoomCardView({ rooms, project }: RoomCardViewProps) {
    const getNetworkName = (chainId?: number) => {
        if (!chainId) return "Free";
        switch (chainId) {
            case 84532: return "Base";
            case 80002: return "Polygon";
            case 421614: return "Arbitrum";
            default: return `Chain ${chainId}`;
        }
    };

    const getStatusBadge = (room: Room) => {
        if (room.status === RoomStatus.PLAYING) {
            return { emoji: "🔴", label: "LIVE NOW", color: "text-red-500" };
        }
        if (room.currentPlayers === room.maxPlayers - 1) {
            return {
                emoji: "🟡",
                label: "1 SPOT LEFT",
                color: "text-yellow-500",
            };
        }
        if (room.status === RoomStatus.WAITING && room.currentPlayers === 0) {
            return { emoji: "🟢", label: "OPEN", color: "text-green-500" };
        }
        return { emoji: "🟢", label: "OPEN", color: "text-green-500" };
    };

    const getActionButton = (room: Room) => {
        if (room.status === RoomStatus.PLAYING) {
            return {
                label: "SPECTATE",
                variant:
                    "bg-gray-600 hover:bg-gray-700 text-white" as const,
            };
        }
        if (room.status === RoomStatus.COMPLETED) {
            return {
                label: "VIEW RESULTS",
                variant:
                    "bg-blue-600 hover:bg-blue-700 text-white" as const,
            };
        }
        return {
            label: "JOIN NOW",
            variant: "bg-[#007AFF] hover:bg-[#0066CC] text-white" as const,
        };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
                const status = getStatusBadge(room);
                const action = getActionButton(room);

                return (
                    <Link
                        key={room.id}
                        href={`/rooms/${room.id}`}
                        className="block"
                    >
                        <div className="bg-[#1c1c1e] rounded-xl p-6 hover:bg-[#2c2c2e] transition-all cursor-pointer border border-[#2d2d2d] hover:border-[#3d3d3d] h-full flex flex-col">
                            {/* Status Header */}
                            <div className="flex items-center justify-between mb-4">
                                <span
                                    className={`text-sm font-bold ${status.color}`}
                                >
                                    {status.emoji} {status.label}
                                </span>
                            </div>

                            {/* Room Name */}
                            <div className="text-white font-semibold mb-1">
                                {room.name}
                            </div>

                            {/* Network and Entry Fee */}
                            <div className="text-gray-400 text-sm mb-4">
                                {getNetworkName(room.chainId)}
                                {room.entryFee && ` • ${room.entryFee} tokens`}
                                {!room.entryFee && " • Free"}
                            </div>

                            {/* Players */}
                            <div className="text-gray-300 text-sm mb-4">
                                Players: {room.currentPlayers}/{room.maxPlayers}
                            </div>

                            {/* Player Names or Status */}
                            <div className="text-gray-500 text-sm mb-6 flex-1 min-h-[20px]">
                                {room.currentPlayers === 0
                                    ? "Waiting for players..."
                                    : `${room.currentPlayers} player(s) joined`}
                            </div>

                            {/* Action Button */}
                            <button
                                className={`w-full py-2.5 rounded-lg font-semibold transition-colors ${action.variant}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Handle action
                                }}
                            >
                                {action.label}
                            </button>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
