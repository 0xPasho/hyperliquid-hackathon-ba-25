"use client";

import { useEffect, useState } from "react";

interface VMGameClientProps {
    roomId: string;
    userId: string;
    vmServerUrl?: string;
    onWinnerDetermined?: (winnerId: string) => void;
    onError?: (error: string) => void;
}

export function VMGameClient({
    roomId,
    userId,
    vmServerUrl = "ws://localhost:3002/game",
}: VMGameClientProps) {
    const [iframeUrl, setIframeUrl] = useState<string>("");

    useEffect(() => {
        // Get auth token from localStorage
        const token = localStorage.getItem("authToken");

        // Build iframe URL with query params
        const scratchGuiUrl = process.env.NEXT_PUBLIC_SCRATCH_GUI_URL || "http://localhost:8601";

        const params = new URLSearchParams({
            roomId,
            userId,
            vmServerUrl,
            ...(token && { token }),
        });

        const url = `${scratchGuiUrl}/vm-player.html?${params.toString()}`;
        setIframeUrl(url);

        console.log("[VMGameClient] Loading VM player iframe:", url);
    }, [roomId, userId, vmServerUrl]);

    if (!iframeUrl) {
        return (
            <div className="relative w-full h-full bg-[#1A1A1A] rounded-lg overflow-hidden flex items-center justify-center">
                <p className="text-[#8B8B8B]">Initializing game...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-[#1A1A1A] rounded-lg overflow-hidden">
            <iframe
                src={iframeUrl}
                className="w-full h-full border-none"
                title="Game Stream"
                allow="fullscreen"
            />
        </div>
    );
}
