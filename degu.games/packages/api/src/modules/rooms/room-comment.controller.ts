import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import roomCommentService from "./room-comment.service";
import activityService from "../activity/activity.service";
import { ActivityType } from "@prisma/client";

class RoomCommentController {
    /**
     * POST /api/v1/rooms/:roomId/comments
     * Create a new room comment
     */
    async createComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            // @ts-ignore - user is added by auth middleware
            const userId = req.user?.userId;
            const { roomId } = req.params;
            const { content } = req.body;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
                return;
            }

            if (!roomId) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            if (!content || content.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    error: "Comment content is required",
                });
                return;
            }

            const comment = await roomCommentService.createComment(roomId, userId, content);

            // Track activity
            await activityService.trackActivity(
                userId,
                ActivityType.COMMENT_ROOM,
                roomId,
                "room",
                {
                    commentId: comment.id,
                    preview: content.substring(0, 100),
                }
            );

            res.status(201).json({
                success: true,
                data: comment,
            });
        } catch (error) {
            console.error("Error creating room comment:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create comment",
            });
        }
    }

    /**
     * GET /api/v1/rooms/:roomId/comments
     * Get comments for a room
     */
    async getRoomComments(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { roomId } = req.params;
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

            if (!roomId) {
                res.status(400).json({
                    success: false,
                    error: "Room ID is required",
                });
                return;
            }

            const result = await roomCommentService.getRoomComments(roomId, page, limit);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            console.error("Error fetching room comments:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch comments",
            });
        }
    }

    /**
     * DELETE /api/v1/rooms/:roomId/comments/:commentId
     * Delete a room comment
     */
    async deleteComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            // @ts-ignore - user is added by auth middleware
            const userId = req.user?.userId;
            const { commentId } = req.params;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
                return;
            }

            if (!commentId) {
                res.status(400).json({
                    success: false,
                    error: "Comment ID is required",
                });
                return;
            }

            const deleted = await roomCommentService.deleteComment(commentId, userId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: "Comment not found or unauthorized",
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Comment deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting room comment:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete comment",
            });
        }
    }

    /**
     * PUT /api/v1/rooms/:roomId/comments/:commentId
     * Update a room comment
     */
    async updateComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            // @ts-ignore - user is added by auth middleware
            const userId = req.user?.userId;
            const { commentId } = req.params;
            const { content } = req.body;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
                return;
            }

            if (!commentId) {
                res.status(400).json({
                    success: false,
                    error: "Comment ID is required",
                });
                return;
            }

            if (!content || content.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    error: "Comment content is required",
                });
                return;
            }

            const updated = await roomCommentService.updateComment(commentId, userId, content);

            if (!updated) {
                res.status(404).json({
                    success: false,
                    error: "Comment not found or unauthorized",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: updated,
            });
        } catch (error) {
            console.error("Error updating room comment:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update comment",
            });
        }
    }
}

export default new RoomCommentController();
