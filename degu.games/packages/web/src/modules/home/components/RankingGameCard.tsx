"use client";

import Link from "next/link";
import { Project } from "@/lib/types";

interface RankingGameCardProps {
    project: Project;
    rank: number;
}

export function RankingGameCard({ project, rank }: RankingGameCardProps) {
    const displayTitle = project.title;
    const displaySubtitle =
        project.description || project.user?.name || "Play now";
    const thumbnailUrl =
        project.thumbnailImage ||
        project.headerImage ||
        "/default-project-image.jpg";
    const backgroundImage = project.headerImage || project.thumbnailImage;

    return (
        <Link href={`/game/${project.id}`} className="block">
            <div className="relative group cursor-pointer rounded-2xl overflow-hidden transition-all">
                {/* Blurred Background Image */}
                {backgroundImage ? (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${backgroundImage})`,
                                filter: "blur(20px)",
                                transform: "scale(1.1)",
                            }}
                        />
                        {/* Dark overlay for text readability */}
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/45 transition-colors" />
                    </>
                ) : (
                    /* Fallback gray background */
                    <div className="absolute inset-0 bg-[#2c2c2e] group-hover:bg-[#1c1c1e]/60 transition-colors" />
                )}

                {/* Card Content */}
                <div className="relative p-6">
                    {/* Rank Number */}
                    <div className="absolute top-4 left-4">
                        <span className="text-5xl font-bold text-white/40">
                            {rank}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col items-center pt-8">
                        {/* App Icon */}
                        <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-lg ring-2 ring-white/10">
                            <img
                                src={thumbnailUrl}
                                alt={displayTitle}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white text-center mb-1 line-clamp-1">
                            {displayTitle}
                        </h3>

                        {/* Subtitle */}
                        <p className="text-sm text-gray-300 text-center mb-4 line-clamp-2 min-h-[40px]">
                            {displaySubtitle}
                        </p>

                        {/* View Button */}
                        <button className="px-4 py-1.5 text-[15px] font-semibold text-[#007AFF] bg-[#1c1c1e] group-hover:bg-[#2c2c2e] rounded-full transition-all">
                            View
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
