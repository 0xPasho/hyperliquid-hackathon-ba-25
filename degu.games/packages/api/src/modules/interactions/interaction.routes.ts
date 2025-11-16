import { Router } from "express";
import { interactionController } from "./interaction.controller";
import {
    authMiddleware,
    optionalAuthMiddleware,
} from "../../middleware/auth.middleware";

const router = Router();

// Comments
router.get(
    "/projects/:projectId/comments",
    interactionController.getComments.bind(interactionController)
);
router.post(
    "/projects/:projectId/comments",
    authMiddleware,
    interactionController.createComment.bind(interactionController)
);
router.delete(
    "/comments/:commentId",
    authMiddleware,
    interactionController.deleteComment.bind(interactionController)
);

// Likes
router.post(
    "/projects/:projectId/like",
    authMiddleware,
    interactionController.toggleLike.bind(interactionController)
);

// Views
router.post(
    "/projects/:projectId/view",
    interactionController.trackView.bind(interactionController)
);

// Stats (with optional auth to check if user liked)
router.get(
    "/projects/:projectId/stats",
    optionalAuthMiddleware,
    interactionController.getProjectStats.bind(interactionController)
);

export default router;
