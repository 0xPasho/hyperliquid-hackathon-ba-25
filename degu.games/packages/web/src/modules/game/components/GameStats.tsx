"use client";

import { Project } from "@/lib/types";
import { Heart, Eye, Users, Trophy, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { toggleLike } from "@/lib/interactions-api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface GameStatsProps {
    project: Project;
    likeCount: number;
    viewCount: number;
    totalVolume: number;
    totalPlayers: number;
    isLiked: boolean;
    isLoading?: boolean;
    onLikeChange: (newLikeCount: number, newIsLiked: boolean) => void;
}

const GAME_MODE_LABELS: Record<number, string> = {
    0: "Winner Takes All",
    1: "Team Battle",
    2: "Free For All",
    3: "Score Based",
};

export function GameStats({
    project,
    likeCount,
    viewCount,
    totalVolume,
    totalPlayers,
    isLiked,
    isLoading = false,
    onLikeChange,
}: GameStatsProps) {
    const { isAuthenticated } = useAuth();
    const gameMode = GAME_MODE_LABELS[project.gameMode ?? 0] || "Multiplayer";

    const handleLike = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to like this game");
            return;
        }

        try {
            const result = await toggleLike(project.id);
            if (result.success && result.data) {
                const newLikeCount = result.data.liked
                    ? likeCount + 1
                    : likeCount - 1;
                onLikeChange(newLikeCount, result.data.liked);
            } else {
                toast.error(result.error || "Failed to like game");
            }
        } catch (error) {
            toast.error("Failed to like game");
        }
    };

    if (isLoading) {
        return (
            <div className="w-full bg-black/40 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                        {/* LIKES - Skeleton */}
                        <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                                LIKES
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-600 rounded animate-pulse" />
                                <div className="h-4 w-12 bg-gray-600 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* VIEWS - Skeleton */}
                        <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                                VIEWS
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-600 rounded animate-pulse" />
                                <div className="h-4 w-12 bg-gray-600 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* TOTAL VOLUME - Skeleton */}
                        <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                                TOTAL VOLUME
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-600 rounded animate-pulse" />
                                <div className="h-4 w-12 bg-gray-600 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* PLAYERS - Skeleton */}
                        <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                                PLAYERS
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-600 rounded animate-pulse" />
                                <div className="h-4 w-12 bg-gray-600 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* CATEGORY - Skeleton */}
                        <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                                CATEGORY
                            </div>
                            <div className="h-4 w-24 bg-gray-600 rounded animate-pulse" />
                        </div>

                        {/* DEVELOPER - Skeleton */}
                        <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                                DEVELOPER
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 bg-gray-600 rounded animate-pulse flex-shrink-0" />
                                <div className="h-4 w-20 bg-gray-600 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-black/40 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                    {/* LIKES */}
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                            LIKES
                        </div>
                        <button
                            onClick={handleLike}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <Heart
                                className={`w-4 h-4 transition-colors ${
                                    isLiked
                                        ? "text-red-500 fill-red-500"
                                        : "text-white/50 group-hover:text-white/70"
                                }`}
                            />
                            <div className="text-sm font-medium text-white">
                                {likeCount.toLocaleString()}
                            </div>
                        </button>
                    </div>

                    {/* VIEWS */}
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                            VIEWS
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-white" />
                            <div className="text-sm font-medium text-white">
                                {viewCount.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* TOTAL VOLUME */}
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                            TOTAL VOLUME
                        </div>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-white" />
                            <div className="text-sm font-medium text-white">
                                ${totalVolume.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* TOTAL PLAYERS */}
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                            PLAYERS
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-white" />
                            <div className="text-sm font-medium text-white">
                                {totalPlayers}
                            </div>
                        </div>
                    </div>

                    {/* CATEGORY (Game Mode) */}
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                            CATEGORY
                        </div>
                        <div className="text-sm font-medium text-white/90">
                            {gameMode}
                        </div>
                    </div>

                    {/* DEVELOPER */}
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                            DEVELOPER
                        </div>
                        {project.userId ? (
                            <Link
                                href={`/users/${project.userId}`}
                                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 cursor-pointer truncate"
                            >
                                <UserIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">
                                    {project.user?.name || "Anonymous"}
                                </span>
                            </Link>
                        ) : (
                            <div className="text-sm font-medium text-white/70">
                                Anonymous
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
