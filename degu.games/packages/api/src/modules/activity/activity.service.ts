import { prisma } from "../../lib/prisma";
import { ActivityType } from "@prisma/client";

export class ActivityService {
    /**
     * Track a user activity
     */
    async trackActivity(
        userId: string,
        type: ActivityType,
        targetId?: string,
        targetType?: string,
        metadata?: any
    ) {
        return prisma.activity.create({
            data: {
                userId,
                type,
                targetId,
                targetType,
                metadata,
            },
        });
    }

    /**
     * Get user activities with pagination
     */
    async getUserActivities(
        userId: string,
        page: number = 1,
        limit: number = 10
    ) {
        const skip = (page - 1) * limit;

        const [activities, total] = await Promise.all([
            prisma.activity.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                            walletAddress: true,
                        },
                    },
                },
            }),
            prisma.activity.count({ where: { userId } }),
        ]);

        return {
            activities,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: page < Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get enriched activities with related data
     */
    async getEnrichedActivities(
        userId: string,
        page: number = 1,
        limit: number = 10
    ) {
        const { activities, pagination } = await this.getUserActivities(
            userId,
            page,
            limit
        );

        // Enrich activities with related data
        const enriched = await Promise.all(
            activities.map(async (activity) => {
                const enrichedActivity: any = { ...activity };

                // Fetch related data based on targetType
                if (activity.targetType === "project" && activity.targetId) {
                    const project = await prisma.project.findUnique({
                        where: { id: activity.targetId },
                        select: {
                            id: true,
                            title: true,
                            thumbnailImage: true,
                        },
                    });
                    enrichedActivity.project = project;
                }

                if (activity.targetType === "user" && activity.targetId) {
                    const targetUser = await prisma.user.findUnique({
                        where: { id: activity.targetId },
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                            walletAddress: true,
                        },
                    });
                    enrichedActivity.targetUser = targetUser;
                }

                if (activity.targetType === "room" && activity.targetId) {
                    const room = await prisma.room.findUnique({
                        where: { id: activity.targetId },
                        select: {
                            id: true,
                            name: true,
                            project: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    });
                    enrichedActivity.room = room;
                }

                return enrichedActivity;
            })
        );

        return {
            activities: enriched,
            pagination,
        };
    }

    /**
     * Get user game activities (wins/losses) with enriched data
     */
    async getUserGameActivities(
        userId: string,
        limit: number = 10,
        offset: number = 0
    ) {
        const [activities, total] = await Promise.all([
            prisma.activity.findMany({
                where: {
                    userId,
                    type: {
                        in: ['WIN_GAME', 'LOSE_GAME', 'COMPLETE_GAME']
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                        },
                    },
                },
            }),
            prisma.activity.count({
                where: {
                    userId,
                    type: {
                        in: ['WIN_GAME', 'LOSE_GAME', 'COMPLETE_GAME']
                    },
                },
            }),
        ]);

        // Enrich with room/project data
        const enriched = await Promise.all(
            activities.map(async (activity) => {
                const enrichedActivity: any = { ...activity };

                if (activity.targetType === "room" && activity.targetId) {
                    const room = await prisma.room.findUnique({
                        where: { id: activity.targetId },
                        select: {
                            id: true,
                            name: true,
                            entryFee: true,
                            tokenAddress: true,
                            tokenSymbol: true,
                            chainId: true,
                            maxPlayers: true,
                            status: true,
                            createdAt: true,
                            project: {
                                select: {
                                    id: true,
                                    title: true,
                                    thumbnailImage: true,
                                },
                            },
                        },
                    });
                    enrichedActivity.room = room;
                }

                return enrichedActivity;
            })
        );

        return {
            activities: enriched,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }

    /**
     * Delete activities older than specified days
     */
    async cleanupOldActivities(days: number = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await prisma.activity.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });

        return result.count;
    }
}

export default new ActivityService();
