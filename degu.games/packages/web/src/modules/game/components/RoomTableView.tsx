"use client";

import { Room, RoomStatus } from "@/lib/room-api";
import { Project } from "@/lib/types";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface RoomTableViewProps {
    rooms: Room[];
    project: Project;
}

type SortField = "network" | "entryFee" | "players" | "status";
type SortDirection = "asc" | "desc";

export function RoomTableView({ rooms, project }: RoomTableViewProps) {
    const [sortField, setSortField] = useState<SortField>("status");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const getNetworkName = (chainId?: number) => {
        if (!chainId) return "Free";
        switch (chainId) {
            case 84532: return "Base";
            case 80002: return "Polygon";
            case 421614: return "Arbitrum";
            default: return `Chain ${chainId}`;
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedRooms = [...rooms].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
            case "network":
                comparison = getNetworkName(a.chainId).localeCompare(getNetworkName(b.chainId));
                break;
            case "entryFee":
                const aFee = a.entryFee ? parseFloat(a.entryFee) : 0;
                const bFee = b.entryFee ? parseFloat(b.entryFee) : 0;
                comparison = aFee - bFee;
                break;
            case "players":
                comparison = a.currentPlayers - b.currentPlayers;
                break;
            case "status":
                comparison = a.status.localeCompare(b.status);
                break;
        }

        return sortDirection === "asc" ? comparison : -comparison;
    });

    const getStatusDisplay = (room: Room) => {
        if (room.status === RoomStatus.PLAYING) {
            return { emoji: "🔴", label: "Live", color: "text-red-500" };
        }
        if (room.currentPlayers === room.maxPlayers - 1) {
            return { emoji: "🟡", label: "1 left", color: "text-yellow-500" };
        }
        if (room.status === RoomStatus.WAITING) {
            return { emoji: "🟢", label: "Open", color: "text-green-500" };
        }
        if (room.status === RoomStatus.COMPLETED) {
            return { emoji: "⚪", label: "Done", color: "text-gray-500" };
        }
        return { emoji: "🟢", label: "New", color: "text-green-500" };
    };

    const getNetworkIcon = (chainId?: number) => {
        const network = getNetworkName(chainId);
        const icons: Record<string, string> = {
            Polygon: "🟣",
            Base: "🔵",
            Ethereum: "⚫",
            Arbitrum: "🔴",
            Free: "🆓",
        };
        return icons[network] || "⚪";
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[#2d2d2d]">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            <button
                                onClick={() => handleSort("network")}
                                className="flex items-center gap-2 hover:text-white transition-colors"
                            >
                                Network
                                <ArrowUpDown className="w-4 h-4" />
                            </button>
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            <button
                                onClick={() => handleSort("entryFee")}
                                className="flex items-center gap-2 hover:text-white transition-colors"
                            >
                                Entry Fee
                                <ArrowUpDown className="w-4 h-4" />
                            </button>
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            <button
                                onClick={() => handleSort("players")}
                                className="flex items-center gap-2 hover:text-white transition-colors"
                            >
                                Players
                                <ArrowUpDown className="w-4 h-4" />
                            </button>
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            Prize
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            <button
                                onClick={() => handleSort("status")}
                                className="flex items-center gap-2 hover:text-white transition-colors"
                            >
                                Status
                                <ArrowUpDown className="w-4 h-4" />
                            </button>
                        </th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRooms.map((room) => {
                        const status = getStatusDisplay(room);
                        const networkIcon = getNetworkIcon(room.chainId);
                        const networkName = getNetworkName(room.chainId);

                        return (
                            <tr
                                key={room.id}
                                className="border-b border-[#1a1a1a] hover:bg-[#1c1c1e] transition-colors"
                            >
                                <td className="py-3 px-4 text-white">
                                    {networkIcon} {networkName}
                                </td>
                                <td className="py-3 px-4 text-white">
                                    {room.entryFee ? `${room.entryFee} tokens` : "Free"}
                                </td>
                                <td className="py-3 px-4 text-white">
                                    {room.currentPlayers}/{room.maxPlayers}
                                </td>
                                <td className="py-3 px-4 text-white">
                                    {room.entryFee
                                        ? `${(parseFloat(room.entryFee) * room.maxPlayers).toFixed(2)} tokens`
                                        : "Free"}
                                </td>
                                <td
                                    className={`py-3 px-4 font-medium ${status.color}`}
                                >
                                    {status.emoji} {status.label}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <Link href={`/rooms/${room.id}`}>
                                        <button className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg font-semibold text-sm transition-colors">
                                            {room.status === RoomStatus.PLAYING
                                                ? "VIEW"
                                                : "JOIN"}
                                        </button>
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
