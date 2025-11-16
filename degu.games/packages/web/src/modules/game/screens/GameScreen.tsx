"use client";

import { useEffect, useState } from "react";
import { Project, ProjectStats } from "@/lib/types";
import { AppSidebar } from "@/modules/home/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { GameHeader } from "../components/GameHeader";
import { GameStats } from "../components/GameStats";
import { GameTabs } from "../components/GameTabs";
import { GameDescription } from "../components/GameDescription";
import { MoreByCreator } from "../components/MoreByCreator";
import { getProjectStats, trackView, getOrCreateSessionId } from "@/lib/interactions-api";
import { getProjectRoomStats } from "@/lib/room-api";

interface GameScreenProps {
    project: Project;
}

export function GameScreen({ project }: GameScreenProps) {
    const [stats, setStats] = useState<ProjectStats>({
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        isLiked: false,
    });
    const [totalVolume, setTotalVolume] = useState<number>(0);
    const [totalPlayers, setTotalPlayers] = useState<number>(0);
    const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

    useEffect(() => {
        // Load stats and track view
        const loadStats = async () => {
            setIsLoadingStats(true);
            try {
                // Load project stats
                const statsResult = await getProjectStats(project.id);
                if (statsResult.success && statsResult.data) {
                    setStats(statsResult.data);
                }

                // Track view with session ID
                const sessionId = getOrCreateSessionId();
                await trackView(project.id, sessionId);

                // Load room stats from backend (calculated in database)
                const roomStatsResult = await getProjectRoomStats(project.id);
                if (roomStatsResult.success && roomStatsResult.data) {
                    setTotalVolume(roomStatsResult.data.totalVolume);
                    setTotalPlayers(roomStatsResult.data.totalPlayers);
                }
            } catch (error) {
                console.error("Error loading game stats:", error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        loadStats();
    }, [project.id]);

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="relative flex min-h-screen w-full bg-black">
                <div className="fixed left-0 top-0 bottom-0 z-50 hidden md:block">
                    <AppSidebar />
                </div>
                <div className="flex-1 md:ml-12 overflow-x-hidden">
                    <AppHeader showBack={true} showSearch={false} />

                    <div className="w-full">
                        {/* Game Header */}
                        <GameHeader project={project} />

                        {/* Game Stats - App Store Style */}
                        <GameStats
                            project={project}
                            likeCount={stats.likeCount}
                            viewCount={stats.viewCount}
                            totalVolume={totalVolume}
                            totalPlayers={totalPlayers}
                            isLiked={stats.isLiked}
                            isLoading={isLoadingStats}
                            onLikeChange={(newLikeCount, newIsLiked) => {
                                setStats((prev) => ({
                                    ...prev,
                                    likeCount: newLikeCount,
                                    isLiked: newIsLiked,
                                }));
                            }}
                        />

                        {/* Game Tabs - Quick Play, All Rooms, Leaderboard */}
                        <GameTabs project={project} />

                        {/* Description and Instructions */}
                        <GameDescription project={project} />

                        {/* More by Creator */}
                        <MoreByCreator project={project} />
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}
