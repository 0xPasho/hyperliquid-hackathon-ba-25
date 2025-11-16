import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import activityService from "./activity.service";

class ActivityController {
    /**
     * GET /api/v1/activity/me
     * Get current user's activities
     */
    async getMyActivities(req: AuthRequest, res: Response): Promise<void> {
        try {
            // @ts-ignore - user is added by auth middleware
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
                return;
            }

            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

            const result = await activityService.getEnrichedActivities(userId, page, limit);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            console.error("Error fetching activities:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch activities",
            });
        }
    }

    /**
     * GET /api/v1/activity/user/:userId
     * Get a specific user's activities
     */
    async getUserActivities(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
                return;
            }

            const result = await activityService.getEnrichedActivities(userId, page, limit);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            console.error("Error fetching user activities:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch user activities",
            });
        }
    }

    /**
     * GET /api/v1/activity/user/:userId/games
     * Get a specific user's game activities (wins/losses)
     */
    async getUserGameActivities(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
                return;
            }

            const result = await activityService.getUserGameActivities(userId, limit, offset);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            console.error("Error fetching user game activities:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch user game activities",
            });
        }
    }
}

export default new ActivityController();
