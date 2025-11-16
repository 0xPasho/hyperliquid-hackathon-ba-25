"use client";

import { useEffect, useState } from "react";
import { Project } from "@/lib/types";
import { getProjectsByUserId } from "@/lib/api";
import { ChevronRight } from "lucide-react";
import { GameDisplayCard } from "@/modules/home/components/GameDisplayCard";
import Link from "next/link";

interface MoreByCreatorProps {
    project: Project;
}

export function MoreByCreator({ project }: MoreByCreatorProps) {
    const [creatorProjects, setCreatorProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCreatorProjects();
    }, [project.userId]);

    const loadCreatorProjects = async () => {
        if (!project.userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const projects = await getProjectsByUserId(project.userId, {
                excludeId: project.id, // Exclude current game
                isPublic: true,
                limit: 6, // Show up to 6 games
            });
            setCreatorProjects(projects);
        } catch (error) {
            console.error("Error loading creator projects:", error);
        } finally {
            setLoading(false);
        }
    };

    // Don't show section if no other games or still loading
    if (loading || creatorProjects.length === 0) {
        return null;
    }

    const creatorName = project.user?.name || "This Creator";

    return (
        <div className="w-full px-6 py-8">
            <div className="max-w-7xl mx-auto border-t border-[#2d2d2d] pt-8">
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-lg font-bold text-white">
                        More by {creatorName}
                    </h2>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {creatorProjects.map((game) => (
                        <GameDisplayCard key={game.id} project={game} />
                    ))}
                </div>

                {/* View All Link - If creator has more games */}
                {creatorProjects.length >= 6 && project.userId && (
                    <div className="mt-6 text-center">
                        <Link
                            href={`/users/${project.userId}`}
                            className="inline-flex items-center gap-2 text-[#007AFF] hover:text-[#0066CC] font-semibold"
                        >
                            View All Games by {creatorName}
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
