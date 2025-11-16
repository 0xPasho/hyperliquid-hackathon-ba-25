import { Router } from "express";
import projectController from "./project.controller";
import multer from "multer";
import { optionalAuthMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

// Create a new project (with optional auth to assign userId)
router.post("/", optionalAuthMiddleware, projectController.createProject.bind(projectController));

// Get hero slider projects (must be before /:id)
router.get("/hero", projectController.getHeroProjects.bind(projectController));

// Get featured projects (must be before /:id)
router.get("/featured", projectController.getFeaturedProjects.bind(projectController));

// Get latest projects (must be before /:id)
router.get("/latest", projectController.getLatestProjects.bind(projectController));

// Get trending projects (must be before /:id)
router.get("/trending", projectController.getTrendingProjects.bind(projectController));

// Get popular projects (must be before /:id)
router.get("/popular", projectController.getPopularProjects.bind(projectController));

// Get all projects (optionally filter by userId via query param)
router.get("/", optionalAuthMiddleware, projectController.listProjects.bind(projectController));

// Get a specific project by ID
router.get("/:id", optionalAuthMiddleware, projectController.getProject.bind(projectController));

// Update a project
router.put("/:id", optionalAuthMiddleware, projectController.updateProject.bind(projectController));

// Upload header image
router.post(
    "/:id/upload-header",
    optionalAuthMiddleware,
    upload.single("image"),
    projectController.uploadHeaderImage.bind(projectController)
);

// Upload thumbnail image
router.post(
    "/:id/upload-thumbnail",
    optionalAuthMiddleware,
    upload.single("image"),
    projectController.uploadThumbnailImage.bind(projectController)
);

// Duplicate a project
router.post("/:id/duplicate", optionalAuthMiddleware, projectController.duplicateProject.bind(projectController));

// Get project leaderboard
router.get("/:id/leaderboard", projectController.getProjectLeaderboard.bind(projectController));

// Delete a project
router.delete("/:id", optionalAuthMiddleware, projectController.deleteProject.bind(projectController));

export default router;
