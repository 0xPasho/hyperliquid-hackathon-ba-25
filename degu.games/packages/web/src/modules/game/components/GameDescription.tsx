"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface GameDescriptionProps {
    project: Project;
}

export function GameDescription({ project }: GameDescriptionProps) {
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [showFullInstructions, setShowFullInstructions] = useState(false);

    const hasDescription =
        project.description && project.description.trim().length > 0;
    const hasInstructions =
        project.instructions && project.instructions.trim().length > 0;

    const descriptionPreview = project.description?.substring(0, 200) || "";
    const shouldShowDescriptionMore = (project.description?.length || 0) > 200;

    const instructionsPreview = project.instructions?.substring(0, 200) || "";
    const shouldShowInstructionsMore =
        (project.instructions?.length || 0) > 200;

    return (
        <div className="w-full px-6">
            <div className="max-w-7xl mx-auto border-t border-[#2d2d2d] pt-8">
                {/* Description Section */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-2">
                        Description
                    </h3>
                    <div className="prose prose-invert max-w-none">
                        {hasDescription ? (
                            <>
                                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {showFullDescription ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                        >
                                            {project.description}
                                        </ReactMarkdown>
                                    ) : (
                                        <>
                                            {descriptionPreview}
                                            {shouldShowDescriptionMore && "..."}
                                        </>
                                    )}
                                </div>
                                {shouldShowDescriptionMore && (
                                    <button
                                        onClick={() =>
                                            setShowFullDescription(
                                                !showFullDescription
                                            )
                                        }
                                        className="text-[#007AFF] hover:text-[#0066CC] font-semibold mt-2 inline-block"
                                    >
                                        {showFullDescription ? "less" : "more"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-gray-500 leading-relaxed">
                                No description provided
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions Section */}
                <div className="">
                    <h3 className="text-lg font-bold text-white mb-2">
                        How to Play
                    </h3>
                    <div className="prose prose-invert max-w-none">
                        {hasInstructions ? (
                            <>
                                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {showFullInstructions ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                        >
                                            {project.instructions}
                                        </ReactMarkdown>
                                    ) : (
                                        <>
                                            {instructionsPreview}
                                            {shouldShowInstructionsMore &&
                                                "..."}
                                        </>
                                    )}
                                </div>
                                {shouldShowInstructionsMore && (
                                    <button
                                        onClick={() =>
                                            setShowFullInstructions(
                                                !showFullInstructions
                                            )
                                        }
                                        className="text-[#007AFF] hover:text-[#0066CC] font-semibold mt-2 inline-block"
                                    >
                                        {showFullInstructions ? "less" : "more"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-gray-500 leading-relaxed">
                                No instructions provided
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags Section */}
                {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {project.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-[#1c1c1e] text-gray-300 text-sm rounded-full border border-[#2d2d2d]"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
