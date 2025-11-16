"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { createProject } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface NewGameModalProps {
    onClose: () => void;
}

export function NewGameModal({ onClose }: NewGameModalProps) {
    const [title, setTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openInStudio, setOpenInStudio] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const handleCreate = async () => {
        if (!title.trim()) {
            setError("Please enter a title for your game");
            return;
        }

        if (!user) {
            setError("You must be logged in to create a game");
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const project = await createProject({
                title: title.trim(),
                userId: user.id,
                // Don't send projectData - let the API use the default template
            });

            if (openInStudio) {
                // Get the auth token from localStorage
                const token = localStorage.getItem("authToken");

                // Redirect to the scratch-gui editor with the project ID and token
                const editorUrl =
                    process.env.NEXT_PUBLIC_SCRATCH_GUI_URL ||
                    "http://localhost:8601";
                window.location.href = `${editorUrl}/#${project.id}${
                    token ? `?token=${token}` : ""
                }`;
            } else {
                // Redirect to project settings page
                router.push(`/game/${project.id}`);
            }
        } catch (err) {
            console.error("Error creating project:", err);
            setError(
                err instanceof Error ? err.message : "Failed to create project"
            );
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isCreating) {
            handleCreate();
        } else if (e.key === "Escape") {
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px] p-0 bg-[#141414] border-[#2d2d2d] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#2d2d2d]">
                        <h2 className="text-2xl font-bold text-white">
                            Create New Game
                        </h2>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-3">
                        <div>
                            <label
                                htmlFor="game-title"
                                className="block text-sm font-medium text-gray-300 mb-2"
                            >
                                Game Title
                            </label>
                            <input
                                id="game-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter your game title..."
                                className="w-full bg-[#1a1a1a] text-white placeholder-gray-400 px-4 py-2.5 rounded-lg border border-[#2d2d2d] focus:outline-none focus:border-blue-500 transition-colors"
                                autoFocus
                                disabled={isCreating}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="text-sm text-gray-400 pt-1">
                            Your game will be created as a private project.
                        </div>

                        {/* Checkbox */}
                        <div
                            className="flex items-center gap-3 pt-3 pb-2 cursor-pointer group hover:bg-white/[0.03] -mx-2 px-2 py-2 rounded-lg transition-colors"
                            onClick={() => setOpenInStudio(!openInStudio)}
                        >
                            {/* Custom checkbox */}
                            <div
                                className={`
                                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
                                    ${
                                        openInStudio
                                            ? "bg-blue-600 border-blue-600"
                                            : "bg-transparent border-gray-600 hover:border-gray-500"
                                    }
                                `}
                            >
                                {openInStudio && (
                                    <svg
                                        className="w-3.5 h-3.5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="3"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                            </div>

                            {/* Label */}
                            <div className="flex-1">
                                <span className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                                    Open in Studio after creating
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-[#2d2d2d]">
                        <button
                            onClick={onClose}
                            disabled={isCreating}
                            className="px-6 py-2.5 rounded-lg bg-transparent border border-[#2d2d2d] text-white hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isCreating || !title.trim()}
                            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Game"
                            )}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
