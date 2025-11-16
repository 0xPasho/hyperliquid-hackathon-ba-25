import { Request, Response } from "express";
import { interactionService } from "./interaction.service";
import activityService from "../activity/activity.service";
import { ActivityType } from "@prisma/client";

export class InteractionController {
    async getComments(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            const comments = await interactionService.getComments(projectId);

            res.json({
                success: true,
                data: comments,
            });
        } catch (error: any) {
            console.error("Error getting comments:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to get comments",
            });
        }
    }

    async createComment(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;
            const { content } = req.body;
            const userId = (req as any).user?.userId;

            if (!projectId) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: "User not authenticated",
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

            const comment = await interactionService.createComment(
                projectId,
                userId,
                content.trim()
            );

            // Track activity
            await activityService.trackActivity(
                userId,
                ActivityType.COMMENT_PROJECT,
                projectId,
                "project",
                {
                    commentId: comment.id,
                    preview: content.trim().substring(0, 100),
                }
            );

            res.json({
                success: true,
                data: comment,
            });
        } catch (error: any) {
            console.error("Error creating comment:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to create comment",
            });
        }
    }

    async deleteComment(req: Request, res: Response): Promise<void> {
        try {
            const { commentId } = req.params;
            const userId = (req as any).user?.userId;

            if (!commentId) {
                res.status(400).json({
                    success: false,
                    error: "Comment ID is required",
                });
                return;
            }

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
                return;
            }

            await interactionService.deleteComment(commentId, userId);

            res.json({
                success: true,
                message: "Comment deleted successfully",
            });
        } catch (error: any) {
            console.error("Error deleting comment:", error);
            res.status(error.message.includes("Unauthorized") ? 403 : 500).json({
                success: false,
                error: error.message || "Failed to delete comment",
            });
        }
    }

    async toggleLike(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;
            const userId = (req as any).user?.userId;

            if (!projectId) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
                return;
            }

            const result = await interactionService.toggleLike(projectId, userId);

            // Track activity only if liked (not unliked)
            if (result.liked) {
                await activityService.trackActivity(
                    userId,
                    ActivityType.LIKE_PROJECT,
                    projectId,
                    "project"
                );
            }

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error("Error toggling like:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to toggle like",
            });
        }
    }

    async trackView(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;
            const { sessionId } = req.body;

            if (!projectId) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: "Session ID is required",
                });
                return;
            }

            const ipAddress =
                req.headers["x-forwarded-for"] || req.socket.remoteAddress;

            const result = await interactionService.trackView(
                projectId,
                sessionId,
                typeof ipAddress === "string" ? ipAddress : undefined
            );

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error("Error tracking view:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to track view",
            });
        }
    }

    async getProjectStats(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;
            const userId = (req as any).user?.userId;

            if (!projectId) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            const stats = await interactionService.getProjectStats(
                projectId,
                userId
            );

            res.json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            console.error("Error getting project stats:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to get project stats",
            });
        }
    }
}

export const interactionController = new InteractionController();
