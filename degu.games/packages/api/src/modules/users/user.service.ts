import { PrismaClient, User } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface UserStats {
    projectCount: number;
    followerCount: number;
    followingCount: number;
    totalEarnings?: number;
}

class UserService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    /**
     * Get a user by ID with basic info
     */
    async getUserById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    /**
     * Get a user by wallet address
     */
    async getUserByWallet(walletAddress: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { walletAddress: walletAddress.toLowerCase() },
        });
    }

    /**
     * Update a user
     */
    async updateUser(
        id: string,
        data: {
            name?: string;
            bio?: string;
            profileImage?: string;
            headerImage?: string;
            websiteUrl?: string;
            twitterUrl?: string;
            discordUrl?: string;
            telegramUrl?: string;
        }
    ): Promise<User | null> {
        // Check if user exists first
        const existing = await this.getUserById(id);
        if (!existing) {
            return null;
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.bio !== undefined && { bio: data.bio }),
                ...(data.profileImage !== undefined && {
                    profileImage: data.profileImage,
                }),
                ...(data.headerImage !== undefined && {
                    headerImage: data.headerImage,
                }),
                ...(data.websiteUrl !== undefined && {
                    websiteUrl: data.websiteUrl,
                }),
                ...(data.twitterUrl !== undefined && {
                    twitterUrl: data.twitterUrl,
                }),
                ...(data.discordUrl !== undefined && {
                    discordUrl: data.discordUrl,
                }),
                ...(data.telegramUrl !== undefined && {
                    telegramUrl: data.telegramUrl,
                }),
            },
        });
    }

    /**
     * Get user's projects
     */
    async getUserProjects(
        userId: string,
        page: number = 1,
        limit: number = 20
    ) {
        const skip = (page - 1) * limit;

        const [data, count] = await Promise.all([
            this.prisma.project.findMany({
                where: { userId },
                orderBy: { updatedAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true,
                            profileImage: true,
                        },
                    },
                },
            }),
            this.prisma.project.count({ where: { userId } }),
        ]);

        return {
            data,
            count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        };
    }

    /**
     * Get user's recent comments
     */
    async getUserComments(userId: string, limit: number = 10) {
        return this.prisma.comment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                    },
                },
            },
        });
    }

    /**
     * Get user stats (project count, followers, following, total earnings)
     */
    async getUserStats(userId: string): Promise<UserStats> {
        const [projectCount, followerCount, followingCount, totalEarnings] = await Promise.all([
            this.prisma.project.count({
                where: { userId },
            }),
            this.prisma.follow.count({
                where: { followingId: userId },
            }),
            this.prisma.follow.count({
                where: { followerId: userId },
            }),
            this.getUserTotalEarnings(userId),
        ]);

        return {
            projectCount,
            followerCount,
            followingCount,
            totalEarnings,
        };
    }

    /**
     * Get user's featured project (most recent or manually selected)
     */
    async getUserFeaturedProject(userId: string) {
        // For now, return the most recently updated project
        return this.prisma.project.findFirst({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                    },
                },
            },
        });
    }

    /**
     * Get user activity feed
     * This includes project creations, comments, likes, etc.
     */
    async getUserActivity(userId: string, limit: number = 10) {
        // Get recent comments and projects as activity
        const [recentComments, recentProjects] = await Promise.all([
            this.prisma.comment.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: limit,
                include: {
                    project: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            }),
            this.prisma.project.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: limit,
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                },
            }),
        ]);

        // Combine and sort activities by date
        const activities = [
            ...recentComments.map((comment) => ({
                type: "comment" as const,
                id: comment.id,
                createdAt: comment.createdAt,
                content: comment.content,
                project: comment.project,
            })),
            ...recentProjects.map((project) => ({
                type: "project" as const,
                id: project.id,
                createdAt: project.createdAt,
                title: project.title,
            })),
        ].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        return activities.slice(0, limit);
    }

    /**
     * Follow a user
     */
    async followUser(followerId: string, followingId: string) {
        // Prevent self-follow
        if (followerId === followingId) {
            throw new Error("Cannot follow yourself");
        }

        // Check if already following
        const existingFollow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (existingFollow) {
            throw new Error("Already following this user");
        }

        return this.prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        });
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(followerId: string, followingId: string) {
        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (!follow) {
            throw new Error("Not following this user");
        }

        return this.prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
    }

    /**
     * Check if a user is following another user
     */
    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        return !!follow;
    }

    /**
     * Get user's followers
     */
    async getFollowers(userId: string, limit: number = 20) {
        return this.prisma.follow.findMany({
            where: { followingId: userId },
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        walletAddress: true,
                    },
                },
            },
        });
    }

    /**
     * Get users that a user is following
     */
    async getFollowing(userId: string, limit: number = 20) {
        return this.prisma.follow.findMany({
            where: { followerId: userId },
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        walletAddress: true,
                    },
                },
            },
        });
    }

    /**
     * Track a profile view
     */
    async trackProfileView(userId: string, sessionId: string, ipAddress?: string) {
        // Check if this session already viewed this profile
        const existingView = await this.prisma.profileView.findUnique({
            where: {
                userId_sessionId: {
                    userId,
                    sessionId,
                },
            },
        });

        if (existingView) {
            // Already viewed by this session, don't count again
            return null;
        }

        return this.prisma.profileView.create({
            data: {
                userId,
                sessionId,
                ipAddress,
            },
        });
    }

    /**
     * Get profile view count
     */
    async getProfileViewCount(userId: string): Promise<number> {
        return this.prisma.profileView.count({
            where: { userId },
        });
    }

    /**
     * Get trending users based on recent activity
     * Trending score = (profileViews * 1) + (newFollowers * 10) + (projectActivity * 5)
     */
    async getTrendingUsers(
        timeframe: "24h" | "7d" | "30d" = "7d",
        limit: number = 10
    ) {
        const now = new Date();
        let startDate: Date;

        switch (timeframe) {
            case "24h":
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case "7d":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "30d":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }

        // Get users with their recent activity
        const users = await this.prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        profileViews: {
                            where: {
                                createdAt: { gte: startDate },
                            },
                        },
                        followers: {
                            where: {
                                createdAt: { gte: startDate },
                            },
                        },
                        projects: {
                            where: {
                                createdAt: { gte: startDate },
                            },
                        },
                    },
                },
            },
        });

        // Calculate trending scores
        const usersWithScores = users
            .map((user) => ({
                id: user.id,
                name: user.name,
                profileImage: user.profileImage,
                walletAddress: user.walletAddress,
                bio: user.bio,
                trendingScore:
                    user._count.profileViews * 1 +
                    user._count.followers * 10 +
                    user._count.projects * 5,
            }))
            .filter((user) => user.trendingScore > 0)
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, limit);

        return usersWithScores;
    }

    /**
     * Get all-time most popular users
     */
    async getPopularUsers(limit: number = 10) {
        const users = await this.prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        profileViews: true,
                        followers: true,
                        projects: true,
                    },
                },
            },
        });

        // Calculate popularity scores
        const usersWithScores = users
            .map((user) => ({
                id: user.id,
                name: user.name,
                profileImage: user.profileImage,
                walletAddress: user.walletAddress,
                bio: user.bio,
                popularityScore:
                    user._count.profileViews * 1 +
                    user._count.followers * 10 +
                    user._count.projects * 5,
            }))
            .filter((user) => user.popularityScore > 0)
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, limit);

        return usersWithScores;
    }

    /**
     * Calculate total earnings from won games
     * Earnings = sum of prizes from all WIN_GAME activities
     */
    async getUserTotalEarnings(userId: string): Promise<number> {
        // Find all WIN_GAME activities for the user
        const winActivities = await this.prisma.activity.findMany({
            where: {
                userId,
                type: 'WIN_GAME',
            },
        });

        if (winActivities.length === 0) {
            return 0;
        }

        // Get all unique room IDs
        const roomIds = winActivities
            .map(activity => activity.targetId)
            .filter((id): id is string => id !== null);

        if (roomIds.length === 0) {
            return 0;
        }

        // Fetch all rooms
        const rooms = await this.prisma.room.findMany({
            where: {
                id: { in: roomIds },
            },
            select: {
                id: true,
                entryFeeUsd: true,
                currentPlayers: true,
                gameMode: true,
            },
        });

        // Calculate total earnings
        let totalEarnings = 0;

        for (const room of rooms) {
            if (room.entryFeeUsd && room.currentPlayers > 0) {
                const entryFeeUsd = parseFloat(room.entryFeeUsd);
                // Total pot = entry fee * number of players
                const totalPot = entryFeeUsd * room.currentPlayers;

                // For winner-takes-all mode (gameMode 0) or undefined, winner gets entire pot
                // For other modes, we'll use simplified calculation
                // TODO: Implement proper prize distribution based on gameMode
                totalEarnings += totalPot;
            }
        }

        return Math.round(totalEarnings);
    }
}

export default new UserService();
