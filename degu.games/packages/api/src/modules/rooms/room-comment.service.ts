import { prisma } from "../../lib/prisma";

export class RoomCommentService {
    /**
     * Create a new room comment
     */
    async createComment(roomId: string, userId: string, content: string) {
        return prisma.roomComment.create({
            data: {
                roomId,
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
    }

    /**
     * Get comments for a room with pagination
     */
    async getRoomComments(roomId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [comments, total] = await Promise.all([
            prisma.roomComment.findMany({
                where: { roomId },
                orderBy: { createdAt: "asc" }, // Chronological order for chat
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
            prisma.roomComment.count({ where: { roomId } }),
        ]);

        return {
            comments,
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
     * Delete a comment
     */
    async deleteComment(commentId: string, userId: string) {
        // Verify the comment belongs to the user
        const comment = await prisma.roomComment.findUnique({
            where: { id: commentId },
        });

        if (!comment || comment.userId !== userId) {
            return null;
        }

        return prisma.roomComment.delete({
            where: { id: commentId },
        });
    }

    /**
     * Update a comment
     */
    async updateComment(commentId: string, userId: string, content: string) {
        // Verify the comment belongs to the user
        const comment = await prisma.roomComment.findUnique({
            where: { id: commentId },
        });

        if (!comment || comment.userId !== userId) {
            return null;
        }

        return prisma.roomComment.update({
            where: { id: commentId },
            data: { content },
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
    }
}

export default new RoomCommentService();
