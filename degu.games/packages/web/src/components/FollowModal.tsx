"use client";

import { useState, useEffect } from "react";
import { User } from "@/lib/types";
import { fetchFollowers, fetchFollowing } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";

interface FollowModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: "followers" | "following";
    initialCount: number;
}

export function FollowModal({
    isOpen,
    onClose,
    userId,
    type,
    initialCount,
}: FollowModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const limit = 20;

    useEffect(() => {
        if (isOpen) {
            loadUsers(1);
        } else {
            // Reset when modal closes
            setUsers([]);
            setPage(1);
            setTotalPages(1);
            setHasMore(false);
        }
    }, [isOpen, userId, type]);

    const loadUsers = async (pageNum: number) => {
        setLoading(true);
        try {
            const fetchFunction = type === "followers" ? fetchFollowers : fetchFollowing;
            const result = await fetchFunction(userId, pageNum, limit);

            console.log(`${type} response:`, result.data);

            if (pageNum === 1) {
                setUsers(result.data);
            } else {
                setUsers((prev) => [...prev, ...result.data]);
            }

            setPage(result.page);
            setTotalPages(result.totalPages);
            setHasMore(result.page < result.totalPages);
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            loadUsers(page + 1);
        }
    };

    const getUserInitial = (user: User) => {
        return user.name?.charAt(0).toUpperCase() || user.walletAddress?.charAt(0).toUpperCase() || "?";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col bg-[#141414] border-[#2d2d2d]">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl">
                        {type === "followers" ? "Followers" : "Following"}
                        <span className="text-gray-400 ml-2 text-base font-normal">
                            {initialCount}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    {loading && page === 1 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400">
                                No {type === "followers" ? "followers" : "following"} yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/users/${user.id}`}
                                    onClick={onClose}
                                    className="block"
                                >
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors cursor-pointer border border-transparent hover:border-[#2d2d2d]">
                                        <Avatar className="w-12 h-12 flex-shrink-0 border border-[#2d2d2d]">
                                            <AvatarImage
                                                src={user.profileImage || ""}
                                                alt={user.name || "User"}
                                            />
                                            <AvatarFallback className="bg-neutral-800 text-white text-sm font-semibold">
                                                {getUserInitial(user)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-semibold text-white truncate">
                                                    {user.name || "Anonymous"}
                                                </p>
                                                {user.isVerified && (
                                                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            {user.bio && (
                                                <p className="text-sm text-gray-400 truncate mt-0.5">
                                                    {user.bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {hasMore && !loading && (
                        <div className="mt-4 flex justify-center">
                            <Button
                                onClick={loadMore}
                                variant="outline"
                                className="w-full"
                            >
                                Load More
                            </Button>
                        </div>
                    )}

                    {loading && page > 1 && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
