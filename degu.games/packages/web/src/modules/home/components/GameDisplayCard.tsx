"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Project } from "@/lib/types";

interface GameDisplayCardProps {
    project: Project;
    variant?: "default" | "compact";
}

export function GameDisplayCard({
    project,
    variant = "default",
}: GameDisplayCardProps) {
    const displayTitle = project.title;
    const displaySubtitle =
        project.description || project.user?.name || "Play now";
    const thumbnailUrl =
        project.thumbnailImage ||
        project.headerImage ||
        "/default-project-image.jpg";

    return (
        <Link href={`/game/${project.id}`} className="block">
            <div className="group cursor-pointer transition-all hover:bg-[#1c1c1e]/40 rounded-2xl">
                <div className="flex items-center gap-4 p-3">
                    {/* App Icon - Larger size like App Store */}
                    <div className="flex-shrink-0">
                        <div className="w-[64px] h-[64px] rounded-2xl overflow-hidden">
                            <img
                                src={thumbnailUrl}
                                alt={displayTitle}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold text-white mb-0.5 truncate">
                            {displayTitle}
                        </h3>
                        <p className="text-[13px] text-gray-400 truncate">
                            {displaySubtitle}
                        </p>
                    </div>

                    {/* View Button - App Store style */}
                    <button className="flex-shrink-0 px-3 py-1.5 text-[15px] font-semibold text-[#007AFF] bg-[#1c1c1e] group-hover:bg-[#2c2c2e] rounded-full transition-all">
                        View
                    </button>
                </div>
            </div>
        </Link>
    );
}
