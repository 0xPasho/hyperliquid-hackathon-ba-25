"use client";

import { useState, useEffect } from "react";
import { fetchProjectLeaderboard, LeaderboardEntry } from "@/lib/api";
import Link from "next/link";

interface GameLeaderboardProps {
    projectId: string;
}

export function GameLeaderboard({ projectId }: GameLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const LIMIT = 10;

    useEffect(() => {
        loadLeaderboard(currentPage);
    }, [projectId, currentPage]);

    const loadLeaderboard = async (page: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetchProjectLeaderboard(projectId, page, LIMIT);
            setLeaderboard(response.data);
            setTotalPages(response.pagination.totalPages);
        } catch (err) {
            setError("Failed to load leaderboard");
            console.error("Error loading leaderboard:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return "🥇";
            case 2:
                return "🥈";
            case 3:
                return "🥉";
            default:
                return null;
        }
    };

    const getWinRateColor = (winRate: number): string => {
        if (winRate >= 80) return "#10B981"; // Green
        if (winRate >= 60) return "#F59E0B"; // Orange/Yellow
        return "#EF4444"; // Red
    };

    const getRankTextColor = (rank: number): string => {
        switch (rank) {
            case 1:
                return "#FFD700"; // Gold
            case 2:
                return "#C0C0C0"; // Silver
            case 3:
                return "#CD7F32"; // Bronze
            default:
                return "rgba(255, 255, 255, 0.70)";
        }
    };

    if (isLoading && leaderboard.length === 0) {
        return <LeaderboardSkeleton />;
    }

    if (error) {
        return (
            <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-md p-8 text-center">
                <p className="text-sm text-red-400">{error}</p>
            </div>
        );
    }

    if (!isLoading && leaderboard.length === 0) {
        return (
            <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-md p-8 text-center">
                <h3 className="text-lg font-bold text-[#E5E5E5] mb-2">
                    No Players Yet
                </h3>
                <p className="text-sm text-[#8B8B8B]">
                    Be the first to play and make it to the leaderboard!
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] border border-[#1A1A1A] rounded-md overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#1A1A1A]">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Rank
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Player
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Earnings
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Wins
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Win Rate
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Losses
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry) => {
                            const badge = getRankBadge(entry.rank);
                            const rankColor = getRankTextColor(entry.rank);
                            const winRateColor = getWinRateColor(Number(entry.winRate) || 0);

                            return (
                                <tr
                                    key={entry.userId}
                                    className="border-b border-[#1A1A1A] hover:bg-[#141414] transition-colors"
                                >
                                    {/* Rank */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {badge && (
                                                <span className="text-lg">{badge}</span>
                                            )}
                                            <span
                                                className="text-sm font-bold font-mono"
                                                style={{ color: rankColor }}
                                            >
                                                {entry.rank}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Player */}
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/users/${entry.userId}`}
                                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                        >
                                            {entry.avatar ? (
                                                <img
                                                    src={entry.avatar}
                                                    alt={entry.username}
                                                    className="w-8 h-8 rounded-full border border-[#2d2d2d]"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-[#2d2d2d]">
                                                    <span className="text-white text-xs font-bold">
                                                        {entry.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-[#E5E5E5]">
                                                {entry.username}
                                            </span>
                                        </Link>
                                    </td>

                                    {/* Earnings */}
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-sm font-bold font-mono text-green-400">
                                            ${(Number(entry.totalEarnings) || 0).toFixed(2)}
                                        </span>
                                    </td>

                                    {/* Wins */}
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-sm font-bold font-mono text-[#E5E5E5]">
                                            {entry.wins}
                                        </span>
                                    </td>

                                    {/* Win Rate */}
                                    <td className="px-4 py-3 text-right">
                                        <span
                                            className="text-sm font-bold font-mono"
                                            style={{ color: winRateColor }}
                                        >
                                            {(Number(entry.winRate) || 0).toFixed(1)}%
                                        </span>
                                    </td>

                                    {/* Losses */}
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-sm font-mono text-[#8B8B8B]">
                                            {entry.losses}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-[#1A1A1A] flex items-center justify-between">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-[#E5E5E5] bg-[#1A1A1A] rounded hover:bg-[#2d2d2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Previous
                    </button>

                    <span className="text-sm text-[#8B8B8B]">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-[#E5E5E5] bg-[#1A1A1A] rounded hover:bg-[#2d2d2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Loading indicator for page changes */}
            {isLoading && leaderboard.length > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}

function LeaderboardSkeleton() {
    return (
        <div className="bg-[#0a0a0a] border border-[#1A1A1A] rounded-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#1A1A1A]">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Rank
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Player
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Earnings
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Wins
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Win Rate
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">
                                Losses
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <tr key={i} className="border-b border-[#1A1A1A] animate-pulse">
                                <td className="px-4 py-3">
                                    <div className="w-8 h-4 bg-[#1A1A1A] rounded"></div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#1A1A1A] rounded-full"></div>
                                        <div className="w-24 h-4 bg-[#1A1A1A] rounded"></div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="w-16 h-4 bg-[#1A1A1A] rounded ml-auto"></div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="w-12 h-4 bg-[#1A1A1A] rounded ml-auto"></div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="w-16 h-4 bg-[#1A1A1A] rounded ml-auto"></div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="w-12 h-4 bg-[#1A1A1A] rounded ml-auto"></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
