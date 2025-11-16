"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
    getRoomComments,
    type RoomComment,
} from "@/lib/room-comment-api";
import { useLobbyWebSocket } from "@/hooks/useLobbyWebSocket";

interface Message {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    timestamp: Date;
}

interface RoomChatProps {
    roomId: string;
    currentUserId?: string;
    currentUserName?: string;
    currentUserAvatar?: string;
    className?: string;
    lobbyWS?: ReturnType<typeof useLobbyWebSocket>; // Accept WebSocket instance from parent
}

export function RoomChat({
    roomId,
    currentUserId,
    currentUserName = "Anonymous",
    currentUserAvatar,
    className,
    lobbyWS
}: RoomChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [, setTick] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Helper function to convert RoomComment to Message
    const convertCommentToMessage = (comment: RoomComment): Message => ({
        id: comment.id,
        userId: comment.userId,
        userName: comment.user?.name || "Anonymous",
        userAvatar: comment.user?.profileImage,
        text: comment.content,
        timestamp: new Date(comment.createdAt),
    });

    // Fetch initial comments when component mounts
    useEffect(() => {
        async function fetchComments() {
            setIsLoading(true);
            const result = await getRoomComments(roomId);
            if (result.success && result.comments) {
                const convertedMessages = result.comments.map(convertCommentToMessage);
                setMessages(convertedMessages);
            }
            setIsLoading(false);
        }

        if (roomId) {
            fetchComments();
        }
    }, [roomId]);

    // Listen for new chat messages via WebSocket
    useEffect(() => {
        if (!lobbyWS || !roomId) return;

        const unsubscribe = lobbyWS.on("chat_message", ({ roomId: eventRoomId, comment }) => {
            if (eventRoomId === roomId) {
                const newMessage = convertCommentToMessage(comment);
                setMessages((prev) => {
                    // Avoid duplicates
                    const exists = prev.some((m) => m.id === newMessage.id);
                    if (exists) return prev;
                    return [...prev, newMessage];
                });
            }
        });

        return unsubscribe;
    }, [lobbyWS, roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Update timestamps every 10 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setTick((prev) => prev + 1);
        }, 10000);

        return () => clearInterval(timer);
    }, []);

    const handleSend = async () => {
        if (!input.trim() || !currentUserId || isSending) return;

        const content = input.trim();
        setInput("");
        setIsSending(true);

        try {
            // Send via WebSocket (wait a moment if not connected yet)
            if (lobbyWS) {
                // Give WebSocket a moment to connect if it's initializing
                let attempts = 0;
                while (!lobbyWS.isConnected && attempts < 10) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }

                if (lobbyWS.isConnected) {
                    lobbyWS.sendChatMessage(roomId, content);
                    // WebSocket will broadcast the message back to all clients
                } else {
                    console.error("[RoomChat] WebSocket failed to connect after waiting");
                    setInput(content);
                    alert("Chat connection is not ready. Please refresh the page.");
                }
            } else {
                console.error("[RoomChat] No WebSocket instance provided");
                setInput(content);
                alert("Chat is not available. Please refresh the page.");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setInput(content);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={cn("flex flex-col h-full bg-black", className)}>
            {/* Messages Area - Collapsible on mobile, fixed height on desktop */}
            <div
                className={cn(
                    "flex-1 min-h-0 overflow-y-auto",
                    // Desktop: always visible
                    "hidden lg:block",
                    // Mobile: show when focused, hide when not
                    isFocused && "block max-h-[300px] mb-2"
                )}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-[#6B6B6B] text-sm p-4">
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[#6B6B6B] text-sm p-4">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <div className="space-y-4 p-4">
                        {messages.map((message) => {
                            const timeAgo = formatDistanceToNow(message.timestamp, {
                                addSuffix: false,
                            });

                            // Get user initials for avatar fallback
                            const userInitial = message.userName?.[0]?.toUpperCase() || "?";

                            return (
                                <div key={message.id} className="flex gap-3">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {message.userAvatar ? (
                                            <img
                                                src={message.userAvatar}
                                                alt={message.userName}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center text-white font-semibold text-sm">
                                                {userInitial}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header: Username + Timestamp */}
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-semibold text-[#E5E5E5] text-sm">
                                                {message.userName}
                                            </span>
                                            <span className="text-xs text-[#6B6B6B]">
                                                {timeAgo}
                                            </span>
                                        </div>

                                        {/* Message Text */}
                                        <div className="text-[#E5E5E5] text-sm break-words leading-relaxed">
                                            {message.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area - Always visible */}
            <div className="flex-shrink-0">
                <div className="flex items-center gap-2 p-3 bg-[#0F0F0F] border-t border-[#1A1A1A] lg:border-t-0">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        placeholder={!lobbyWS ? "Connecting..." : lobbyWS.isConnected ? "Say hello..." : "Connecting to chat..."}
                        className="flex-1 bg-[#1A1A1A] border-[#252525] text-[#E5E5E5] placeholder-[#6B6B6B] rounded-full px-4"
                        disabled={!currentUserId || !lobbyWS?.isConnected}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || !currentUserId || isSending || !lobbyWS?.isConnected}
                        className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        title={!lobbyWS?.isConnected ? "Connecting to chat..." : "Send message"}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
