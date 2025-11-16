"use client";

import { Project } from "@/lib/types";
import { Settings, Share, Play, Code } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface GameHeaderProps {
    project: Project;
}

export function GameHeader({ project }: GameHeaderProps) {
    const { user } = useAuth();
    const thumbnailUrl =
        project.thumbnailImage ||
        project.headerImage ||
        "/default-project-image.jpg";
    const backgroundImage = project.headerImage || project.thumbnailImage;

    const SCRATCH_GUI_URL =
        process.env.NEXT_PUBLIC_SCRATCH_GUI_URL || "http://localhost:8601";

    const handleShare = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: project.title,
                    text: project.description || `Check out ${project.title}!`,
                    url: window.location.href,
                })
                .catch((err) => console.error("Error sharing:", err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handleQuickPlay = () => {
        // Scroll to the tabs section (Quick Play tab)
        const tabsSection = document.querySelector('[role="tablist"]');
        if (tabsSection) {
            tabsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const handleEditInStudio = () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("Please login first to edit projects");
            return;
        }

        // Pass BOTH token (for session) AND project ID (to load the correct project)
        const editorUrl = `${SCRATCH_GUI_URL}/?token=${encodeURIComponent(
            token
        )}#${project.id}`;
        const editorWindow = window.open(editorUrl, "_blank");

        // Send auth data via postMessage
        if (editorWindow && user) {
            // Send auth token and user data to editor
            let retryCount = 0;
            const maxRetries = 10;
            const retryInterval = 500;

            const sendAuthToken = () => {
                if (editorWindow.closed) {
                    console.log("[Editor] Window closed, stopping token sends");
                    return;
                }

                try {
                    editorWindow.postMessage(
                        {
                            type: "AUTH_TOKEN",
                            data: {
                                token: token,
                                user: user,
                            },
                        },
                        SCRATCH_GUI_URL
                    );
                    console.log(
                        `[Editor] ✅ Sent auth token to editor window (attempt ${
                            retryCount + 1
                        })`
                    );

                    retryCount++;
                    if (retryCount < maxRetries) {
                        setTimeout(sendAuthToken, retryInterval);
                    } else {
                        console.log(
                            "[Editor] Finished sending auth token retries"
                        );
                    }
                } catch (error) {
                    console.error("[Editor] Error sending auth token:", error);
                }
            };

            // Start sending after a short delay to let the window load
            setTimeout(sendAuthToken, 500);
        }
    };

    return (
        <div className="relative w-full h-auto min-h-[320px] sm:h-[285px] overflow-hidden">
            {/* Background Image - No Blur */}
            {backgroundImage ? (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${backgroundImage})`,
                        }}
                    />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
                </>
            ) : (
                // Fallback gradient when no header image
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
            )}

            {/* Content */}
            <div className="relative h-full w-full px-4 sm:px-6 py-6 sm:py-0 flex items-center">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full max-w-7xl mx-auto">
                    {/* Game Icon - Responsive size */}
                    <div className="flex-shrink-0">
                        <div className="w-[120px] h-[120px] sm:w-[194px] sm:h-[194px] rounded-[28px] sm:rounded-[38px] overflow-hidden shadow-2xl">
                            <img
                                src={thumbnailUrl}
                                alt={project.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                        {/* Title */}
                        <h1 className="text-[24px] sm:text-[34px] font-bold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                            {project.title}
                        </h1>

                        {/* Author */}
                        {project.user && project.userId && (
                            <div className="flex items-center justify-center sm:justify-start gap-1 text-white/70 text-sm sm:text-base pt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                <span>By</span>
                                <Link
                                    href={`/users/${project.userId}`}
                                    className="text-[#007AFF] hover:text-[#0066CC] transition-colors"
                                >
                                    {project.user.name}
                                </Link>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                            <button
                                onClick={handleQuickPlay}
                                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2 bg-[#007AFF]/80 hover:bg-[#007AFF] backdrop-blur-sm text-white text-[12px] sm:text-[13px] rounded-full transition-all duration-200 font-semibold shadow-lg shadow-[#007AFF]/20"
                            >
                                <Play
                                    className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]"
                                    fill="white"
                                />
                                Quick Play
                            </button>

                            <button
                                onClick={handleShare}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[12px] sm:text-[13px] rounded-full transition-all duration-200 font-semibold"
                            >
                                <Share className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
                                Share
                            </button>

                            {user?.id === project.userId && (
                                <>
                                    <button
                                        onClick={handleEditInStudio}
                                        className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 bg-purple-600/20 hover:bg-purple-600/30 backdrop-blur-sm text-white text-[12px] sm:text-[13px] rounded-full transition-all duration-200 font-semibold border border-purple-500/50 hover:border-purple-500/70 shadow-lg shadow-purple-500/10"
                                    >
                                        <Code className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
                                        Edit in Game Studio
                                    </button>

                                    <Link href={`/game/${project.id}/settings`}>
                                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[12px] sm:text-[13px] rounded-full transition-all duration-200 font-semibold">
                                            <Settings className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
                                            Settings
                                        </button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
