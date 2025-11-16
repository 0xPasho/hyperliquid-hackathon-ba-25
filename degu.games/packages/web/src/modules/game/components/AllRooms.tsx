"use client";

import { useEffect, useState } from "react";
import { Project } from "@/lib/types";
import { Room, getRoomsByProject } from "@/lib/room-api";
import { RoomCardView } from "./RoomCardView";
import { RoomTableView } from "./RoomTableView";
import { Grid3x3, List } from "lucide-react";

interface AllRoomsProps {
    project: Project;
    onRoomCountChange?: (count: number) => void;
}

type ViewMode = "card" | "table";
type StakesFilter = "all" | "high" | "medium" | "low";
type ChainFilter = number | "all";
type OrderBy = "createdAt" | "entryFee";

export function AllRooms({ project, onRoomCountChange }: AllRoomsProps) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [stakesFilter, setStakesFilter] = useState<StakesFilter>("all");
    const [chainFilter, setChainFilter] = useState<ChainFilter>("all");
    const [orderBy, setOrderBy] = useState<OrderBy>("createdAt");

    useEffect(() => {
        loadRooms();
    }, [project.id, stakesFilter, chainFilter, orderBy]);

    const loadRooms = async () => {
        try {
            setLoading(true);
            const result = await getRoomsByProject(project.id, {
                stakes: stakesFilter,
                chainId: chainFilter,
                orderBy: orderBy,
                orderDirection: "desc", // Most recent first, or highest price first
            });

            if (result.success && result.data) {
                const roomsArray = Array.isArray(result.data) ? result.data : [];
                setRooms(roomsArray);
                onRoomCountChange?.(roomsArray.length);
            } else {
                console.error("Error loading rooms:", result.error);
                setRooms([]);
                onRoomCountChange?.(0);
            }
        } catch (error) {
            console.error("Error loading rooms:", error);
            setRooms([]);
            onRoomCountChange?.(0);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-400">Loading rooms...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters and View Toggle */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Small Select Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Stakes Filter */}
                    <select
                        value={stakesFilter}
                        onChange={(e) => setStakesFilter(e.target.value as StakesFilter)}
                        className="px-3 py-1 text-xs font-medium bg-[#1c1c1e] text-gray-300 border border-[#2d2d2d] rounded-full hover:border-[#3d3d3d] focus:outline-none focus:border-[#007AFF] transition-colors cursor-pointer"
                    >
                        <option value="all">All Stakes</option>
                        <option value="high">High Stakes</option>
                        <option value="medium">Medium Stakes</option>
                        <option value="low">Low Stakes</option>
                    </select>

                    {/* Network Filter */}
                    <select
                        value={chainFilter}
                        onChange={(e) => setChainFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                        className="px-3 py-1 text-xs font-medium bg-[#1c1c1e] text-gray-300 border border-[#2d2d2d] rounded-full hover:border-[#3d3d3d] focus:outline-none focus:border-[#007AFF] transition-colors cursor-pointer"
                    >
                        <option value="all">All Networks</option>
                        <option value="84532">Base</option>
                        <option value="80002">Polygon</option>
                        <option value="421614">Arbitrum</option>
                    </select>

                    {/* Order By Filter */}
                    <select
                        value={orderBy}
                        onChange={(e) => setOrderBy(e.target.value as OrderBy)}
                        className="px-3 py-1 text-xs font-medium bg-[#1c1c1e] text-gray-300 border border-[#2d2d2d] rounded-full hover:border-[#3d3d3d] focus:outline-none focus:border-[#007AFF] transition-colors cursor-pointer"
                    >
                        <option value="createdAt">Latest</option>
                        <option value="entryFee">Price</option>
                    </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-[#1c1c1e] rounded-lg p-1">
                    <button
                        onClick={() => setViewMode("card")}
                        className={`px-3 py-1.5 rounded-md transition-colors ${
                            viewMode === "card"
                                ? "bg-[#2c2c2e] text-white"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`px-3 py-1.5 rounded-md transition-colors ${
                            viewMode === "table"
                                ? "bg-[#2c2c2e] text-white"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Room Display */}
            {rooms.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-2">
                        <p className="text-gray-400">No rooms found</p>
                        <p className="text-sm text-gray-500">
                            Be the first to create one!
                        </p>
                    </div>
                </div>
            ) : viewMode === "card" ? (
                <RoomCardView rooms={rooms} project={project} />
            ) : (
                <RoomTableView rooms={rooms} project={project} />
            )}
        </div>
    );
}
