"use client";

import { useEffect, useRef } from "react";
import { User } from "@/lib/types";
import { useParams } from "next/navigation";
import { Room } from "@/lib/room-api";

interface GameIframeProps {
    projectId: string;
    user: User | null;
    isAuthenticated: boolean;
    scratchGuiUrl: string;
    className?: string;
    isPlaying?: boolean; // Whether game has started
    room?: Room | null; // Room context for betting/game logic
}

export function GameIframe({
    projectId,
    user,
    isAuthenticated,
    scratchGuiUrl,
    className,
    isPlaying = false,
    room = null,
}: GameIframeProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const params = useParams();
    const roomId = params?.id as string;

    // Auto-focus iframe and send auth token with retry mechanism
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        let retryCount = 0;
        const maxRetries = 5;
        const retryInterval = 500;
        let retryTimer: NodeJS.Timeout | null = null;

        const sendAuthToken = () => {
            if (!isAuthenticated || !user || !iframe.contentWindow) {
                console.log("[GameIframe] Cannot send auth token - not ready");
                return false;
            }

            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("[GameIframe] No auth token found");
                return false;
            }

            try {
                iframe.contentWindow.postMessage(
                    {
                        type: "AUTH_TOKEN",
                        data: {
                            token: token,
                            user: user,
                        },
                    },
                    scratchGuiUrl
                );
                console.log(
                    `[GameIframe] ✅ Sent auth token (attempt ${retryCount + 1})`
                );
                return true;
            } catch (error) {
                console.error("[GameIframe] Error sending auth token:", error);
                return false;
            }
        };

        const handleIframeLoad = () => {
            // Focus the iframe for keyboard events
            setTimeout(() => {
                if (iframe.contentWindow) {
                    iframe.contentWindow.focus();
                }
            }, 100);

            // Send auth token with retries
            const sent = sendAuthToken();
            if (sent) {
                retryCount = 0;
                const sendWithRetry = () => {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        sendAuthToken();
                        retryTimer = setTimeout(sendWithRetry, retryInterval);
                    }
                };
                retryTimer = setTimeout(sendWithRetry, retryInterval);
            }
        };

        if (iframe.contentDocument?.readyState === "complete") {
            handleIframeLoad();
        } else {
            iframe.addEventListener("load", handleIframeLoad);
        }

        return () => {
            iframe.removeEventListener("load", handleIframeLoad);
            if (retryTimer) {
                clearTimeout(retryTimer);
            }
        };
    }, [isAuthenticated, user, scratchGuiUrl]);

    // Send room context when game starts
    useEffect(() => {
        if (!isPlaying || !room || !user) return;

        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;

        // Prepare room context for the game
        const activePlayers = room.players?.filter(p => !p.leftAt) || [];
        const roomContext = {
            roomId: room.id,
            entryFee: parseFloat(room.entryFee || '0'),
            prizePool: parseFloat(room.entryFee || '0') * room.maxPlayers,
            playerCount: activePlayers.length,
            myUserId: user.id,
            players: activePlayers.map(p => ({
                userId: p.userId,
                name: p.user?.name || 'Anonymous',
                isHost: p.userId === room.hostId,
                hasPaid: p.hasPaid || false
            })),
            isPaidRoom: !!(room.blockchainGameId && room.entryFee),
            tokenSymbol: room.tokenSymbol || 'USDC',
            chainId: room.chainId
        };

        console.log('[GameIframe] Sending room context:', roomContext);

        // Send room context to iframe
        const sendRoomContext = () => {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(
                    {
                        type: 'ROOM_CONTEXT',
                        data: roomContext
                    },
                    scratchGuiUrl
                );
                console.log('[GameIframe] ✅ Sent ROOM_CONTEXT message');
            }
        };

        // Try sending immediately and retry a few times
        sendRoomContext();
        const retryTimer = setInterval(sendRoomContext, 1000);

        // Stop retrying after 5 seconds
        const stopTimer = setTimeout(() => {
            clearInterval(retryTimer);
        }, 5000);

        return () => {
            clearInterval(retryTimer);
            clearTimeout(stopTimer);
        };
    }, [isPlaying, room, user, scratchGuiUrl]);

    // Start VM sync when game is playing
    useEffect(() => {
        if (!isPlaying || !roomId || !user || !room) return;

        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;

        // Get VM server URL from room object
        const vmServerUrl = room.vmServerUrl;
        console.log('[GameIframe] Room vmServerUrl:', vmServerUrl);

        if (!vmServerUrl) {
            console.warn('[GameIframe] No VM server URL found in room object');
            console.warn('[GameIframe] Room status:', room.status);
            console.warn('[GameIframe] VM Status:', room.vmStatus);
            return;
        }

        const token = localStorage.getItem("authToken");

        console.log('[GameIframe] Starting VM sync:', {
            roomId,
            userId: user.id,
            vmServerUrl
        });

        // Send message to iframe to start VM sync
        const startSync = () => {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(
                    {
                        type: 'START_VM_SYNC',
                        roomId: roomId,
                        userId: user.id,
                        vmServerUrl: vmServerUrl,
                        token: token
                    },
                    scratchGuiUrl
                );
                console.log('[GameIframe] ✅ Sent START_VM_SYNC message');
            }
        };

        // Try sending immediately and retry a few times
        startSync();
        const retryTimer = setInterval(startSync, 1000);

        // Stop retrying after 5 seconds
        const stopTimer = setTimeout(() => {
            clearInterval(retryTimer);
        }, 5000);

        return () => {
            clearInterval(retryTimer);
            clearTimeout(stopTimer);
        };
    }, [isPlaying, roomId, user, room, scratchGuiUrl]);

    const handleClick = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.focus();
        }
    };

    return (
        <div
            className={className}
            onClick={handleClick}
            title="Click to focus game controls"
        >
            <iframe
                ref={iframeRef}
                src={`${scratchGuiUrl}/player.html#${projectId}`}
                className="w-full h-full border-0"
                title="Game"
                allow="autoplay"
            />
        </div>
    );
}
