"use client";

import { useEffect, useState } from "react";

interface GameCountdownProps {
    onComplete: () => void;
}

export function GameCountdown({ onComplete }: GameCountdownProps) {
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count === 0) {
            onComplete();
            return;
        }

        const timer = setTimeout(() => {
            setCount(count - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [count, onComplete]);

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-white mb-4 animate-pulse">
                    {count || "GO!"}
                </h1>
                <p className="text-2xl text-gray-300">
                    {count ? "Starting game in..." : "Game starting!"}
                </p>
            </div>
        </div>
    );
}
