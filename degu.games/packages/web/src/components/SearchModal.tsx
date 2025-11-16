"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Clock, X, TrendingUp } from "lucide-react";
import { Project, User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResults {
    projects: Project[];
    users: User[];
}

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults>({
        projects: [],
        users: [],
    });
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    // Load recent searches from localStorage
    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem("recentSearches");
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
            // Focus input when modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            // Reset when modal closes
            setQuery("");
            setResults({ projects: [], users: [] });
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults({ projects: [], users: [] });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${API_URL}/search?q=${encodeURIComponent(searchQuery)}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    cache: "no-store",
                }
            );

            if (response.ok) {
                const data = await response.json();
                setResults({
                    projects: (data.data?.projects || []).filter(
                        (p: Project) => p.isPublic
                    ),
                    users: data.data?.users || [],
                });
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearchChange = (value: string) => {
        setQuery(value);
        setSelectedIndex(0);

        // Debounce search
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    const saveRecentSearch = (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        const updated = [
            searchQuery,
            ...recentSearches.filter((s) => s !== searchQuery),
        ].slice(0, 5);

        setRecentSearches(updated);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem("recentSearches");
    };

    const handleRecentSearchClick = (search: string) => {
        setQuery(search);
        performSearch(search);
    };

    const handleResultClick = (
        type: "project" | "user",
        id: string,
        title: string
    ) => {
        saveRecentSearch(query);
        onClose();
    };

    // Keyboard navigation
    const allResults = [
        ...results.projects.map((p) => ({ type: "project" as const, item: p })),
        ...results.users.map((u) => ({ type: "user" as const, item: u })),
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    Math.min(prev + 1, allResults.length - 1)
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && allResults[selectedIndex]) {
                e.preventDefault();
                const result = allResults[selectedIndex];
                if (result.type === "project") {
                    window.location.href = `/game/${result.item.id}`;
                } else {
                    window.location.href = `/users/${result.item.id}`;
                }
                saveRecentSearch(query);
                onClose();
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, selectedIndex, allResults, query, onClose]);

    const getUserInitial = (user: User) => {
        return (
            user.name?.charAt(0).toUpperCase() ||
            user.walletAddress?.charAt(0).toUpperCase() ||
            "?"
        );
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[700px] p-0 bg-[#141414] border-[#2d2d2d] max-h-[600px] overflow-hidden fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50">
                    {/* Search Input */}
                    <div className="p-4 border-b border-[#2d2d2d]">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                placeholder="Search Degu.Games"
                                className="w-full bg-transparent text-white placeholder-gray-400 pl-12 pr-4 py-3 focus:outline-none text-lg"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="overflow-y-auto max-h-[500px]">
                        {!query && recentSearches.length > 0 && (
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                        Recent Searches
                                    </h3>
                                    <button
                                        onClick={clearRecentSearches}
                                        className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer uppercase tracking-wider"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {recentSearches.map((search, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                handleRecentSearchClick(search)
                                            }
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left cursor-pointer"
                                        >
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="text-white">
                                                {search}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {query && loading && (
                            <div className="p-8 text-center">
                                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {query &&
                            !loading &&
                            results.projects.length === 0 &&
                            results.users.length === 0 && (
                                <div className="p-8 text-center">
                                    <p className="text-gray-400">
                                        No results found for &ldquo;{query}
                                        &rdquo;
                                    </p>
                                </div>
                            )}

                        {query &&
                            (results.projects.length > 0 ||
                                results.users.length > 0) && (
                                <div className="p-4 space-y-6">
                                    {/* Projects */}
                                    {results.projects.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                                Projects
                                            </h3>
                                            <div className="space-y-1">
                                                {results.projects.map(
                                                    (project, index) => {
                                                        const globalIndex =
                                                            index;
                                                        const isSelected =
                                                            selectedIndex ===
                                                            globalIndex;
                                                        return (
                                                            <Link
                                                                key={project.id}
                                                                href={`/game/${project.id}`}
                                                                onClick={() =>
                                                                    handleResultClick(
                                                                        "project",
                                                                        project.id,
                                                                        project.title
                                                                    )
                                                                }
                                                            >
                                                                <div
                                                                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                                                                        isSelected
                                                                            ? "bg-[#1a1a1a]"
                                                                            : "hover:bg-[#1a1a1a]"
                                                                    }`}
                                                                >
                                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                        <img
                                                                            src={
                                                                                project.thumbnailImage ||
                                                                                project.headerImage ||
                                                                                "/default-project-image.jpg"
                                                                            }
                                                                            alt={
                                                                                project.title
                                                                            }
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-semibold text-white truncate">
                                                                                {
                                                                                    project.title
                                                                                }
                                                                            </p>
                                                                            {project.isVerified && (
                                                                                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-400">
                                                                            by{" "}
                                                                            {project
                                                                                .user
                                                                                ?.name ||
                                                                                "Anonymous"}
                                                                        </p>
                                                                    </div>
                                                                    {project._count && (
                                                                        <div className="text-xs text-gray-500">
                                                                            {
                                                                                project
                                                                                    ._count
                                                                                    .views
                                                                            }{" "}
                                                                            views
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Link>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Users */}
                                    {results.users.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                                Users
                                            </h3>
                                            <div className="space-y-1">
                                                {results.users.map(
                                                    (user, index) => {
                                                        const globalIndex =
                                                            results.projects
                                                                .length + index;
                                                        const isSelected =
                                                            selectedIndex ===
                                                            globalIndex;
                                                        return (
                                                            <Link
                                                                key={user.id}
                                                                href={`/users/${user.id}`}
                                                                onClick={() =>
                                                                    handleResultClick(
                                                                        "user",
                                                                        user.id,
                                                                        user.name ||
                                                                            "Anonymous"
                                                                    )
                                                                }
                                                            >
                                                                <div
                                                                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                                                                        isSelected
                                                                            ? "bg-[#1a1a1a]"
                                                                            : "hover:bg-[#1a1a1a]"
                                                                    }`}
                                                                >
                                                                    <Avatar className="w-12 h-12 flex-shrink-0 border border-[#2d2d2d]">
                                                                        <AvatarImage
                                                                            src={
                                                                                user.profileImage ||
                                                                                ""
                                                                            }
                                                                            alt={
                                                                                user.name ||
                                                                                "User"
                                                                            }
                                                                        />
                                                                        <AvatarFallback className="bg-neutral-800 text-white text-sm font-semibold">
                                                                            {getUserInitial(
                                                                                user
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-semibold text-white truncate">
                                                                                {user.name ||
                                                                                    "Anonymous"}
                                                                            </p>
                                                                            {user.isVerified && (
                                                                                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                            )}
                                                                        </div>
                                                                        {user.bio && (
                                                                            <p className="text-sm text-gray-400 truncate">
                                                                                {
                                                                                    user.bio
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
