import { Router } from "express";
import activityController from "./activity.controller";
import { optionalAuthMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Get current user's activities (requires auth)
router.get("/me", optionalAuthMiddleware, activityController.getMyActivities.bind(activityController));

// Get specific user's activities (public)
router.get("/user/:userId", activityController.getUserActivities.bind(activityController));

// Get specific user's game activities (wins/losses)
router.get("/user/:userId/games", activityController.getUserGameActivities.bind(activityController));

export default router;
