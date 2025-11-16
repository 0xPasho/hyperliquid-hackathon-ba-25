import { Router } from "express";
import { userController } from "./user.controller";
import {
    authMiddleware,
    optionalAuthMiddleware,
} from "../../middleware/auth.middleware";
import multer from "multer";

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

// Get trending users (must be before /:id)
router.get("/trending", userController.getTrendingUsers.bind(userController));

// Get popular users (must be before /:id)
router.get("/popular", userController.getPopularUsers.bind(userController));

// Save private key (requires auth) - Must be before /:id routes
router.post(
    "/save-private-key",
    authMiddleware,
    userController.savePrivateKey.bind(userController)
);

// Get user by ID
router.get("/:id", userController.getUserById.bind(userController));

// Get user's projects
router.get(
    "/:id/projects",
    userController.getUserProjects.bind(userController)
);

// Get user's comments
router.get(
    "/:id/comments",
    userController.getUserComments.bind(userController)
);

// Get user stats
router.get("/:id/stats", userController.getUserStats.bind(userController));

// Get user's featured project
router.get(
    "/:id/featured",
    userController.getUserFeaturedProject.bind(userController)
);

// Get user activity feed
router.get(
    "/:id/activity",
    userController.getUserActivity.bind(userController)
);

// Follow a user (requires auth)
router.post(
    "/:id/follow",
    authMiddleware,
    userController.followUser.bind(userController)
);

// Unfollow a user (requires auth)
router.delete(
    "/:id/follow",
    authMiddleware,
    userController.unfollowUser.bind(userController)
);

// Check follow status (optional auth)
router.get(
    "/:id/follow/status",
    optionalAuthMiddleware,
    userController.getFollowStatus.bind(userController)
);

// Get user's followers
router.get(
    "/:id/followers",
    userController.getFollowers.bind(userController)
);

// Get users that a user is following
router.get(
    "/:id/following",
    userController.getFollowing.bind(userController)
);

// Upload profile image (requires auth)
router.post(
    "/:id/upload-profile-image",
    authMiddleware,
    upload.single("image"),
    userController.uploadProfileImage.bind(userController)
);

// Upload header image (requires auth)
router.post(
    "/:id/upload-header-image",
    authMiddleware,
    upload.single("image"),
    userController.uploadHeaderImage.bind(userController)
);

// Track profile view
router.post("/:id/view", userController.trackProfileView.bind(userController));

// Get profile view count
router.get(
    "/:id/views",
    userController.getProfileViewCount.bind(userController)
);

export default router;
