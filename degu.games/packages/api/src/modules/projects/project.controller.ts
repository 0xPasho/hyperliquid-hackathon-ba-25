import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import projectService from "./project.service";
import { uploadFile, validateImageFile } from "../../lib/storage";
import multer from "multer";

class ProjectController {
    /**
     * POST /api/v1/projects
     * Create a new project
     */
    async createProject(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { title, userId, projectData } = req.body;
            // @ts-ignore - user is added by auth middleware (optional)
            const authenticatedUserId = req.user?.userId;

            console.log('[Project Controller] Create project request:');
            console.log('  - Body userId:', userId);
            console.log('  - Authenticated userId:', authenticatedUserId);
            console.log('  - req.user:', req.user);

            // Use authenticated userId if available, otherwise use provided userId
            const finalUserId = authenticatedUserId || userId;
            console.log('  - Final userId:', finalUserId);

            const project = await projectService.createProject({
                title,
                userId: finalUserId,
                projectData,
            });

            res.status(201).json({
                success: true,
                data: project,
            });
        } catch (error) {
            console.error("Error creating project:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create project",
            });
        }
    }

    /**
     * GET /api/v1/projects/:id
     * Get a project by ID
     */
    async getProject(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            // @ts-ignore - user is added by auth middleware
            const requestingUserId = req.user?.userId;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            const project = await projectService.getProjectById(id, requestingUserId);

            if (!project) {
                res.status(404).json({
                    success: false,
                    error: "Project not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: project,
            });
        } catch (error) {
            console.error("Error fetching project:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch project",
            });
        }
    }

    /**
     * PUT /api/v1/projects/:id
     * Update a project
     */
    async updateProject(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            // @ts-ignore - user is added by auth middleware
            const requestingUserId = req.user?.userId;
            const {
                title,
                projectData,
                description,
                instructions,
                tags,
                websiteUrl,
                twitterUrl,
                discordUrl,
                isPublic,
                isMultiplayer,
                minPlayers,
                maxPlayers,
                gameMode,
                headerImage,
                thumbnailImage,
            } = req.body;

            console.log('[Project Controller] Update project request:');
            console.log('  - Project ID:', id);
            console.log('  - Multiplayer data:', { isMultiplayer, minPlayers, maxPlayers, gameMode });

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            // Validate tags if provided
            if (tags !== undefined) {
                if (!Array.isArray(tags)) {
                    res.status(400).json({
                        success: false,
                        error: "Tags must be an array",
                    });
                    return;
                }
                if (tags.length > 10) {
                    res.status(400).json({
                        success: false,
                        error: "Maximum 10 tags allowed",
                    });
                    return;
                }
                // Validate each tag
                for (const tag of tags) {
                    if (typeof tag !== "string" || tag.trim().length === 0) {
                        res.status(400).json({
                            success: false,
                            error: "All tags must be non-empty strings",
                        });
                        return;
                    }
                }
            }

            const project = await projectService.updateProject(id, {
                title,
                projectData,
                description,
                instructions,
                tags,
                websiteUrl,
                twitterUrl,
                discordUrl,
                headerImage,
                thumbnailImage,
                isPublic,
                isMultiplayer,
                minPlayers,
                maxPlayers,
                gameMode,
            }, requestingUserId);

            if (!project) {
                res.status(404).json({
                    success: false,
                    error: "Project not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: project,
            });
        } catch (error) {
            console.error("Error updating project:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update project",
            });
        }
    }

    /**
     * DELETE /api/v1/projects/:id
     * Delete a project
     */
    async deleteProject(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            const deleted = await projectService.deleteProject(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: "Project not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Project deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting project:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete project",
            });
        }
    }

    /**
     * GET /api/v1/projects
     * List all projects (optionally filter by userId)
     */
    async listProjects(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId, page, limit } = req.query;
            // @ts-ignore - user is added by auth middleware
            const requestingUserId = req.user?.userId;

            const pageNum = page ? parseInt(page as string) : 1;
            const limitNum = limit ? parseInt(limit as string) : 20;

            const result = await projectService.listProjectsPaginated(
                userId as string | undefined,
                pageNum,
                limitNum,
                requestingUserId
            );

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            console.error("Error listing projects:", error);
            res.status(500).json({
                success: false,
                error: "Failed to list projects",
            });
        }
    }

    /**
     * GET /api/v1/projects/hero
     * Get hero slider projects (hardcoded featured games)
     */
    async getHeroProjects(req: AuthRequest, res: Response): Promise<void> {
        try {
            const projects = await projectService.getHeroProjects();

            res.status(200).json({
                success: true,
                data: projects,
                count: projects.length,
            });
        } catch (error) {
            console.error("Error fetching hero projects:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch hero projects",
            });
        }
    }

    /**
     * GET /api/v1/projects/featured
     * Get featured projects
     */
    async getFeaturedProjects(req: AuthRequest, res: Response): Promise<void> {
        try {
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : 3;
            const projects = await projectService.getFeaturedProjects(limit);

            res.status(200).json({
                success: true,
                data: projects,
                count: projects.length,
            });
        } catch (error) {
            console.error("Error fetching featured projects:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch featured projects",
            });
        }
    }

    /**
     * GET /api/v1/projects/latest
     * Get latest projects
     */
    async getLatestProjects(req: AuthRequest, res: Response): Promise<void> {
        try {
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : 5;
            const projects = await projectService.getLatestProjects(limit);

            res.status(200).json({
                success: true,
                data: projects,
                count: projects.length,
            });
        } catch (error) {
            console.error("Error fetching latest projects:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch latest projects",
            });
        }
    }

    /**
     * GET /api/v1/projects/trending
     * Get trending projects
     */
    async getTrendingProjects(req: AuthRequest, res: Response): Promise<void> {
        try {
            const timeframe = (req.query.timeframe as "24h" | "7d" | "30d") || "7d";
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : 10;

            const projects = await projectService.getTrendingProjects(timeframe, limit);

            res.status(200).json({
                success: true,
                data: projects,
                count: projects.length,
            });
        } catch (error) {
            console.error("Error fetching trending projects:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch trending projects",
            });
        }
    }

    /**
     * GET /api/v1/projects/popular
     * Get all-time popular projects
     */
    async getPopularProjects(req: AuthRequest, res: Response): Promise<void> {
        try {
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : 10;

            const projects = await projectService.getPopularProjects(limit);

            res.status(200).json({
                success: true,
                data: projects,
                count: projects.length,
            });
        } catch (error) {
            console.error("Error fetching popular projects:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch popular projects",
            });
        }
    }

    /**
     * POST /api/v1/projects/:id/upload-header
     * Upload header image for a project
     */
    async uploadHeaderImage(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            // @ts-ignore - user is added by auth middleware
            const requestingUserId = req.user?.userId;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            // Check if file exists
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: "No file uploaded",
                });
                return;
            }

            // Validate file
            const validation = validateImageFile(req.file.mimetype, req.file.size);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: validation.error,
                });
                return;
            }

            // Upload to MinIO
            const uploadResult = await uploadFile(
                req.file.buffer,
                req.file.mimetype,
                "headers"
            );

            if (!uploadResult.success) {
                console.error("Upload failed:", uploadResult.error);
                res.status(500).json({
                    success: false,
                    error: uploadResult.error || "Failed to upload header image",
                });
                return;
            }

            // Update project with new header image
            const project = await projectService.updateProject(id, {
                headerImage: uploadResult.url,
            }, requestingUserId);

            if (!project) {
                res.status(404).json({
                    success: false,
                    error: "Project not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    imageUrl: uploadResult.url,
                    project,
                },
            });
        } catch (error) {
            console.error("Error uploading header image:", error);
            res.status(500).json({
                success: false,
                error: "Failed to upload header image",
            });
        }
    }

    /**
     * POST /api/v1/projects/:id/upload-thumbnail
     * Upload thumbnail image for a project
     */
    async uploadThumbnailImage(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            // @ts-ignore - user is added by auth middleware
            const requestingUserId = req.user?.userId;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            // Check if file exists
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: "No file uploaded",
                });
                return;
            }

            // Validate file
            const validation = validateImageFile(req.file.mimetype, req.file.size);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: validation.error,
                });
                return;
            }

            // Upload to MinIO
            const uploadResult = await uploadFile(
                req.file.buffer,
                req.file.mimetype,
                "thumbnails"
            );

            if (!uploadResult.success) {
                console.error("Upload failed:", uploadResult.error);
                res.status(500).json({
                    success: false,
                    error: uploadResult.error || "Failed to upload thumbnail image",
                });
                return;
            }

            // Update project with new thumbnail image
            const project = await projectService.updateProject(id, {
                thumbnailImage: uploadResult.url,
            }, requestingUserId);

            if (!project) {
                res.status(404).json({
                    success: false,
                    error: "Project not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    imageUrl: uploadResult.url,
                    project,
                },
            });
        } catch (error) {
            console.error("Error uploading thumbnail image:", error);
            res.status(500).json({
                success: false,
                error: "Failed to upload thumbnail image",
            });
        }
    }

    /**
     * POST /api/v1/projects/:id/duplicate
     * Duplicate a project
     */
    async duplicateProject(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            // @ts-ignore - user is added by auth middleware
            const requestingUserId = req.user?.userId;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            if (!requestingUserId) {
                res.status(401).json({
                    success: false,
                    error: "Authentication required",
                });
                return;
            }

            const duplicate = await projectService.duplicateProject(id, requestingUserId);

            if (!duplicate) {
                res.status(404).json({
                    success: false,
                    error: "Project not found",
                });
                return;
            }

            res.status(201).json({
                success: true,
                data: duplicate,
            });
        } catch (error) {
            console.error("Error duplicating project:", error);
            res.status(500).json({
                success: false,
                error: "Failed to duplicate project",
            });
        }
    }

    /**
     * GET /api/v1/projects/:id/leaderboard
     * Get leaderboard for a specific project/game
     */
    async getProjectLeaderboard(req: AuthRequest, res: Response): Promise<void> {
        try {
            const projectId = req.params.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            if (!projectId) {
                res.status(400).json({
                    success: false,
                    error: "Project ID is required",
                });
                return;
            }

            const leaderboard = await projectService.getProjectLeaderboard(
                projectId,
                page,
                limit
            );

            res.status(200).json({
                success: true,
                ...leaderboard,
            });
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch leaderboard",
            });
        }
    }
}

export default new ProjectController();
