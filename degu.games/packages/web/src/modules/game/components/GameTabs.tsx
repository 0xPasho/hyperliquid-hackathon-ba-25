"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Project } from "@/lib/types";
import { QuickPlay } from "./QuickPlay";
import { AllRooms } from "./AllRooms";
import { GameLeaderboard } from "@/components/game/GameLeaderboard";
import { getRoomsByProject } from "@/lib/room-api";
import { Zap, Grid3x3, Trophy } from "lucide-react";

interface GameTabsProps {
    project: Project;
}

export function GameTabs({ project }: GameTabsProps) {
    const [roomCount, setRoomCount] = useState(0);
    const [activeTab, setActiveTab] = useState("quick-play");

    // Load room count on mount
    useEffect(() => {
        const loadRoomCount = async () => {
            try {
                const result = await getRoomsByProject(project.id);
                if (result.success && result.data) {
                    const roomsArray = Array.isArray(result.data) ? result.data : [];
                    setRoomCount(roomsArray.length);
                }
            } catch (error) {
                console.error("Error loading room count:", error);
            }
        };

        loadRoomCount();
    }, [project.id]);

    return (
        <div className="w-full px-4 sm:px-6 py-6">
            <div className="max-w-7xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Tab List */}
                    <TabsList className="w-full justify-start bg-transparent border-b border-[#2d2d2d] rounded-none h-auto p-0 gap-1">
                        <TabsTrigger
                            value="quick-play"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white text-white/60 hover:text-white/80 rounded-none px-4 sm:px-6 py-3 cursor-pointer flex items-center gap-2 transition-colors border-b-2 border-transparent font-medium text-[13px] sm:text-[14px]"
                        >
                            <Zap className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                            Quick Play
                        </TabsTrigger>
                        <TabsTrigger
                            value="all-rooms"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white text-white/60 hover:text-white/80 rounded-none px-4 sm:px-6 py-3 cursor-pointer flex items-center gap-2 transition-colors border-b-2 border-transparent font-medium text-[13px] sm:text-[14px]"
                        >
                            <Grid3x3 className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                            All Rooms ({roomCount})
                        </TabsTrigger>
                        <TabsTrigger
                            value="leaderboard"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white text-white/60 hover:text-white/80 rounded-none px-4 sm:px-6 py-3 cursor-pointer flex items-center gap-2 transition-colors border-b-2 border-transparent font-medium text-[13px] sm:text-[14px]"
                        >
                            <Trophy className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                            Leaderboard
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab Contents */}
                    <div className="mt-6">
                        <TabsContent value="quick-play" className="mt-0">
                            <QuickPlay project={project} onSwitchToAllRooms={() => setActiveTab("all-rooms")} />
                        </TabsContent>

                        <TabsContent value="all-rooms" className="mt-0">
                            <AllRooms
                                project={project}
                                onRoomCountChange={setRoomCount}
                            />
                        </TabsContent>

                        <TabsContent value="leaderboard" className="mt-0">
                            <GameLeaderboard projectId={project.id} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
