import { prisma } from "../../lib/prisma";

export class InteractionService {
    // Comments
    async getComments(projectId: string) {
        const comments = await prisma.comment.findMany({
            where: { projectId },
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
            orderBy: { createdAt: "desc" },
        });

        return comments;
    }

    async createComment(projectId: string, userId: string, content: string) {
        const comment = await prisma.comment.create({
            data: {
                projectId,
                userId,
                content,
            },
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
        });

        return comment;
    }

    async deleteComment(commentId: string, userId: string) {
        // Check if comment belongs to user
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new Error("Comment not found");
        }

        if (comment.userId !== userId) {
            throw new Error("Unauthorized to delete this comment");
        }

        await prisma.comment.delete({
            where: { id: commentId },
        });

        return { success: true };
    }

    // Likes
    async getLikeCount(projectId: string) {
        const count = await prisma.like.count({
            where: { projectId },
        });

        return count;
    }

    async isLikedByUser(projectId: string, userId: string) {
        const like = await prisma.like.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });

        return !!like;
    }

    async toggleLike(projectId: string, userId: string) {
        const existingLike = await prisma.like.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });

        if (existingLike) {
            // Unlike
            await prisma.like.delete({
                where: { id: existingLike.id },
            });

            return { liked: false };
        } else {
            // Like
            await prisma.like.create({
                data: {
                    projectId,
                    userId,
                },
            });

            return { liked: true };
        }
    }

    // Views
    async trackView(projectId: string, sessionId: string, ipAddress?: string) {
        // Check if this session already viewed the project
        const existingView = await prisma.view.findUnique({
            where: {
                projectId_sessionId: {
                    projectId,
                    sessionId,
                },
            },
        });

        if (existingView) {
            // Already viewed, don't count again
            return { counted: false };
        }

        try {
            // Create new view and increment counter atomically
            await prisma.$transaction([
                prisma.view.create({
                    data: {
                        projectId,
                        sessionId,
                        ipAddress,
                    },
                }),
                prisma.project.update({
                    where: { id: projectId },
                    data: {
                        viewCount: {
                            increment: 1,
                        },
                    },
                }),
            ]);

            return { counted: true };
        } catch (error: any) {
            // Handle race condition: if unique constraint fails, view was already created
            if (error.code === 'P2002') {
                return { counted: false };
            }
            throw error;
        }
    }

    async getProjectStats(projectId: string, userId?: string) {
        const [likeCount, commentCount, project, isLiked] = await Promise.all([
            prisma.like.count({ where: { projectId } }),
            prisma.comment.count({ where: { projectId } }),
            prisma.project.findUnique({
                where: { id: projectId },
                select: { viewCount: true },
            }),
            userId
                ? this.isLikedByUser(projectId, userId)
                : Promise.resolve(false),
        ]);

        return {
            likeCount,
            commentCount,
            viewCount: project?.viewCount || 0,
            isLiked,
        };
    }
}

export const interactionService = new InteractionService();
