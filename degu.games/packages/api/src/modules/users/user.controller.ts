import { Request, Response } from "express";
import userService from "./user.service";
import { uploadFile, validateImageFile } from "../../lib/storage";
import activityService from "../activity/activity.service";
import { ActivityType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        walletAddress: string;
    };
}

class UserController {
    /**
     * GET /api/v1/users/:id
     * Get user by ID
     */
    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const user = await userService.getUserById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                });
            }

            // Don't expose sensitive data
            const { walletAddress, ...safeUser } = user;

            return res.status(200).json({
                success: true,
                data: {
                    ...safeUser,
                    walletAddress: walletAddress
                        ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
                        : null,
                },
            });
        } catch (error) {
            console.error("Error fetching user:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch user",
            });
        }
    }

    /**
     * GET /api/v1/users/:id/projects
     * Get user's projects with pagination
     */
    async getUserProjects(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await userService.getUserProjects(id, page, limit);

            return res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            console.error("Error fetching user projects:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch user projects",
            });
        }
    }

    /**
     * GET /api/v1/users/:id/comments
     * Get user's recent comments
     */
    async getUserComments(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const limit = parseInt(req.query.limit as string) || 10;

            const comments = await userService.getUserComments(id, limit);

            return res.status(200).json({
                success: true,
                data: comments,
            });
        } catch (error) {
            console.error("Error fetching user comments:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch user comments",
            });
        }
    }

    /**
     * GET /api/v1/users/:id/stats
     * Get user statistics
     */
    async getUserStats(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const stats = await userService.getUserStats(id);

            return res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error("Error fetching user stats:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch user stats",
            });
        }
    }

    /**
     * GET /api/v1/users/:id/featured
     * Get user's featured project
     */
    async getUserFeaturedProject(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const project = await userService.getUserFeaturedProject(id);

            return res.status(200).json({
                success: true,
                data: project,
            });
        } catch (error) {
            console.error("Error fetching featured project:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch featured project",
            });
        }
    }

    /**
     * GET /api/v1/users/:id/activity
     * Get user's activity feed
     */
    async getUserActivity(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const limit = parseInt(req.query.limit as string) || 10;

            const activities = await userService.getUserActivity(id, limit);

            return res.status(200).json({
                success: true,
                data: activities,
            });
        } catch (error) {
            console.error("Error fetching user activity:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch user activity",
            });
        }
    }

    /**
     * POST /api/v1/users/:id/follow
     * Follow a user
     */
    async followUser(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const follow = await userService.followUser(req.user.userId, id);

            // Track activity
            await activityService.trackActivity(
                req.user.userId,
                ActivityType.FOLLOW_USER,
                id,
                "user"
            );

            return res.status(200).json({
                success: true,
                data: follow,
            });
        } catch (error) {
            console.error("Error following user:", error);
            return res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to follow user",
            });
        }
    }

    /**
     * DELETE /api/v1/users/:id/follow
     * Unfollow a user
     */
    async unfollowUser(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            await userService.unfollowUser(req.user.userId, id);

            // Track activity
            await activityService.trackActivity(
                req.user.userId,
                ActivityType.UNFOLLOW_USER,
                id,
                "user"
            );

            return res.status(200).json({
                success: true,
                data: { message: "Successfully unfollowed user" },
            });
        } catch (error) {
            console.error("Error unfollowing user:", error);
            return res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to unfollow user",
            });
        }
    }

    /**
     * GET /api/v1/users/:id/follow/status
     * Check if current user is following another user
     */
    async getFollowStatus(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            if (!req.user) {
                return res.status(200).json({
                    success: true,
                    data: { isFollowing: false },
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const isFollowing = await userService.isFollowing(req.user.userId, id);

            return res.status(200).json({
                success: true,
                data: { isFollowing },
            });
        } catch (error) {
            console.error("Error checking follow status:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to check follow status",
            });
        }
    }

    /**
     * GET /api/v1/users/:id/followers
     * Get user's followers
     */
    async getFollowers(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const limit = parseInt(req.query.limit as string) || 20;

            const followers = await userService.getFollowers(id, limit);

            return res.status(200).json({
                success: true,
                data: followers,
            });
        } catch (error) {
            console.error("Error fetching followers:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch followers",
            });
        }
    }

    /**
     * GET /api/v1/users/:id/following
     * Get users that a user is following
     */
    async getFollowing(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const limit = parseInt(req.query.limit as string) || 20;

            const following = await userService.getFollowing(id, limit);

            return res.status(200).json({
                success: true,
                data: following,
            });
        } catch (error) {
            console.error("Error fetching following:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch following",
            });
        }
    }

    /**
     * POST /api/v1/users/:id/view
     * Track a profile view
     */
    async trackProfileView(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { sessionId } = req.body;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: "Session ID is required",
                });
            }

            const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || undefined;

            const view = await userService.trackProfileView(id, sessionId, ipAddress);

            return res.status(200).json({
                success: true,
                data: view,
            });
        } catch (error) {
            console.error("Error tracking profile view:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to track profile view",
            });
        }
    }

    /**
     * GET /api/v1/users/:id/views
     * Get profile view count
     */
    async getProfileViewCount(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            const count = await userService.getProfileViewCount(id);

            return res.status(200).json({
                success: true,
                data: { count },
            });
        } catch (error) {
            console.error("Error fetching profile view count:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch profile view count",
            });
        }
    }

    /**
     * GET /api/v1/users/trending
     * Get trending users
     */
    async getTrendingUsers(req: Request, res: Response) {
        try {
            const timeframe = (req.query.timeframe as "24h" | "7d" | "30d") || "7d";
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : 10;

            const users = await userService.getTrendingUsers(timeframe, limit);

            return res.status(200).json({
                success: true,
                data: users,
                count: users.length,
            });
        } catch (error) {
            console.error("Error fetching trending users:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch trending users",
            });
        }
    }

    /**
     * GET /api/v1/users/popular
     * Get all-time popular users
     */
    async getPopularUsers(req: Request, res: Response) {
        try {
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : 10;

            const users = await userService.getPopularUsers(limit);

            return res.status(200).json({
                success: true,
                data: users,
                count: users.length,
            });
        } catch (error) {
            console.error("Error fetching popular users:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch popular users",
            });
        }
    }

    /**
     * POST /api/v1/users/:id/upload-profile-image
     * Upload profile image for a user
     */
    async uploadProfileImage(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            // Verify user is uploading their own profile image
            if (req.user.userId !== id) {
                return res.status(403).json({
                    success: false,
                    error: "You can only upload your own profile image",
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            // Check if file exists
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: "No file uploaded",
                });
            }

            // Validate file
            const validation = validateImageFile(req.file.mimetype, req.file.size);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.error,
                });
            }

            // Upload to MinIO
            const uploadResult = await uploadFile(
                req.file.buffer,
                req.file.mimetype,
                "profile-images"
            );

            if (!uploadResult.success) {
                console.error("Upload failed:", uploadResult.error);
                return res.status(500).json({
                    success: false,
                    error: uploadResult.error || "Failed to upload profile image",
                });
            }

            // Update user with new profile image
            const user = await userService.updateUser(id, {
                profileImage: uploadResult.url,
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    imageUrl: uploadResult.url,
                    user,
                },
            });
        } catch (error) {
            console.error("Error uploading profile image:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to upload profile image",
            });
        }
    }

    /**
     * POST /api/v1/users/:id/upload-header-image
     * Upload header image for a user
     */
    async uploadHeaderImage(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            // Verify user is uploading their own header image
            if (req.user.userId !== id) {
                return res.status(403).json({
                    success: false,
                    error: "You can only upload your own header image",
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }

            // Check if file exists
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: "No file uploaded",
                });
            }

            // Validate file
            const validation = validateImageFile(req.file.mimetype, req.file.size);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.error,
                });
            }

            // Upload to MinIO
            const uploadResult = await uploadFile(
                req.file.buffer,
                req.file.mimetype,
                "header-images"
            );

            if (!uploadResult.success) {
                console.error("Upload failed:", uploadResult.error);
                return res.status(500).json({
                    success: false,
                    error: uploadResult.error || "Failed to upload header image",
                });
            }

            // Update user with new header image
            const user = await userService.updateUser(id, {
                headerImage: uploadResult.url,
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    imageUrl: uploadResult.url,
                    user,
                },
            });
        } catch (error) {
            console.error("Error uploading header image:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to upload header image",
            });
        }
    }

    /**
     * POST /api/v1/users/save-private-key
     * Save user's private key for blockchain operations (MVP/Hackathon only)
     * WARNING: This is insecure and should only be used for hackathon/MVP
     */
    async savePrivateKey(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { privateKey } = req.body;

            if (!privateKey) {
                return res.status(400).json({
                    success: false,
                    error: "Private key is required",
                });
            }

            const userId = req.user.userId;

            // Ensure temp directory exists
            const tempDir = path.join(__dirname, "../../../temp");
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Save private key to temp file
            const keyPath = path.join(tempDir, `${userId}.key`);
            fs.writeFileSync(keyPath, privateKey, { mode: 0o600 }); // Read/write for owner only

            console.log(`[UserController] ✅ Private key saved for user ${userId}`);

            return res.status(200).json({
                success: true,
                data: { message: "Private key saved successfully" },
            });
        } catch (error) {
            console.error("Error saving private key:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to save private key",
            });
        }
    }
}

export const userController = new UserController();
