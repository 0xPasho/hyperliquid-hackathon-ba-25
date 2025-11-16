"use client";

import { Room } from "@/lib/room-api";
import { Trophy, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface GameResultsProps {
    room: Room;
    winnerId?: string | null;
}

export function GameResults({ room, winnerId }: GameResultsProps) {
    const [show, setShow] = useState(false);

    // Get winner info
    const winner = room.players?.find((p) => p.userId === winnerId);
    const winnerName = winner?.user?.name || winner?.userId?.substring(0, 8) || "Unknown Player";
    const winnerImage = winner?.user?.profileImage;

    // Calculate prize pool
    const prizeAmount = room.prizePool || (parseFloat(room.entryFee || "0") * room.maxPlayers).toString();

    // Debug logging
    useEffect(() => {
        console.log("[GameResults] Winner ID:", winnerId);
        console.log("[GameResults] Players:", room.players);
        console.log("[GameResults] Found winner:", winner);
        console.log("[GameResults] Winner name:", winnerName);
        console.log("[GameResults] Prize amount:", prizeAmount);
    }, [winnerId, room.players, winner, winnerName, prizeAmount]);

    // Trigger animation after mount
    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F]">
            <div
                className={`text-center max-w-2xl transition-all duration-1000 transform ${
                    show
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 translate-y-4"
                }`}
            >
                {/* Trophy Icon with Glow */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
                    </div>
                    <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl">
                        <Trophy className="w-12 h-12 text-white" />
                    </div>
                </div>

                {/* Winner Announcement */}
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 mb-4 animate-pulse">
                    Victory!
                </h1>

                {/* Winner Info */}
                <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-yellow-500/20">
                    {/* Winner Avatar */}
                    <div className="mb-6">
                        {winnerImage ? (
                            <img
                                src={winnerImage}
                                alt={winnerName}
                                className="w-24 h-24 rounded-full mx-auto border-4 border-yellow-500 shadow-xl"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full mx-auto border-4 border-yellow-500 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 flex items-center justify-center">
                                <span className="text-3xl font-bold text-yellow-500">
                                    {winnerName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Winner Name */}
                    <h2 className="text-3xl font-bold text-[#E5E5E5] mb-2">
                        {winnerName}
                    </h2>
                    <p className="text-yellow-500 text-lg font-semibold flex items-center justify-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-500" />
                        Winner
                        <Star className="w-5 h-5 fill-yellow-500" />
                    </p>
                </div>

                {/* Prize Pool Info (if applicable) */}
                {room.entryFee && parseFloat(room.entryFee) > 0 && (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                        <p className="text-[#8B8B8B] text-sm mb-1">
                            Prize Won
                        </p>
                        <p className="text-2xl font-bold text-green-400">
                            {parseFloat(prizeAmount).toFixed(2)} {room.tokenSymbol || "USDC"}
                        </p>
                        <p className="text-[#8B8B8B] text-xs mt-1">
                            Winnings distributed automatically
                        </p>
                    </div>
                )}

                {/* Confetti Effect (CSS Animation) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}px`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${3 + Math.random() * 2}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes confetti {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                .animate-confetti {
                    animation: confetti linear infinite;
                }
            `}</style>
        </div>
    );
}
