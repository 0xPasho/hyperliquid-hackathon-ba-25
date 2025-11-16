import { PrismaClient, Project } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import defaultProjectTemplate from "../../templates/default-project.json";

export interface CreateProjectDto {
    title?: string;
    userId?: string;
    projectData?: any;
}

export interface UpdateProjectDto {
    title?: string;
    projectData?: any;
    description?: string;
    instructions?: string;
    tags?: string[];
    websiteUrl?: string;
    twitterUrl?: string;
    discordUrl?: string;
    headerImage?: string;
    thumbnailImage?: string;
    isPublic?: boolean;
    isMultiplayer?: boolean | null;
    minPlayers?: number | null;
    maxPlayers?: number | null;
    gameMode?: number | null;
}

class ProjectService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    /**
     * Create a new project with default Scratch template
     */
    async createProject(data: CreateProjectDto): Promise<Project> {
        const projectData = data.projectData || defaultProjectTemplate;

        return this.prisma.project.create({
            data: {
                title: data.title || "Untitled",
                projectData: projectData as any,
                ...(data.userId && { userId: data.userId }),
            },
        });
    }

    /**
     * Get a project by ID
     * If requestingUserId is provided, private projects can be accessed by their owner
     */
    async getProjectById(id: string, requestingUserId?: string): Promise<Project | null> {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        // If project doesn't exist, return null
        if (!project) return null;

        // If project is public, everyone can see it
        if (project.isPublic) return project;

        // If project has no owner (userId is null), allow access for editing
        if (project.userId === null) return project;

        // If project is private, only the owner can see it
        if (requestingUserId && project.userId === requestingUserId) {
            return project;
        }

        // Project is private and user is not the owner
        return null;
    }

    /**
     * Update a project
     * If requestingUserId is provided, allows updating private projects owned by that user
     */
    async updateProject(
        id: string,
        data: UpdateProjectDto,
        requestingUserId?: string
    ): Promise<Project | null> {
        // Check if project exists and user has permission to access it
        const existing = await this.getProjectById(id, requestingUserId);
        if (!existing) {
            return null;
        }

        // Authorization check: Only the owner can update the project (or if no owner exists)
        if (existing.userId !== null && requestingUserId && existing.userId !== requestingUserId) {
            return null; // User is not the owner
        }

        return this.prisma.project.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.projectData && {
                    projectData: data.projectData as any,
                }),
                ...(data.description !== undefined && {
                    description: data.description,
                }),
                ...(data.instructions !== undefined && {
                    instructions: data.instructions,
                }),
                ...(data.tags !== undefined && { tags: data.tags }),
                ...(data.websiteUrl !== undefined && {
                    websiteUrl: data.websiteUrl,
                }),
                ...(data.twitterUrl !== undefined && {
                    twitterUrl: data.twitterUrl,
                }),
                ...(data.discordUrl !== undefined && {
                    discordUrl: data.discordUrl,
                }),
                ...(data.headerImage !== undefined && {
                    headerImage: data.headerImage,
                }),
                ...(data.thumbnailImage !== undefined && {
                    thumbnailImage: data.thumbnailImage,
                }),
                ...(data.isPublic !== undefined && {
                    isPublic: data.isPublic,
                }),
                ...(data.isMultiplayer !== undefined && {
                    isMultiplayer: data.isMultiplayer,
                }),
                ...(data.minPlayers !== undefined && {
                    minPlayers: data.minPlayers,
                }),
                ...(data.maxPlayers !== undefined && {
                    maxPlayers: data.maxPlayers,
                }),
                ...(data.gameMode !== undefined && {
                    gameMode: data.gameMode,
                }),
            },
            include: {
                user: true,
            },
        });
    }

    /**
     * Delete a project
     */
    async deleteProject(id: string): Promise<boolean> {
        try {
            await this.prisma.project.delete({
                where: { id },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * List all projects (with optional userId filter)
     * If requestingUserId is provided, private projects owned by that user are included
     */
    async listProjects(userId?: string, requestingUserId?: string): Promise<Project[]> {
        const includeConfig = {
            user: true,
            _count: {
                select: {
                    views: true,
                    likes: true,
                    comments: true,
                },
            },
        };

        // If requesting a specific user's projects
        if (userId) {
            // If the requesting user is the owner, show all their projects
            if (requestingUserId === userId) {
                return this.prisma.project.findMany({
                    where: { userId },
                    orderBy: { updatedAt: "desc" },
                    include: includeConfig,
                });
            }
            // Otherwise, only show public projects
            return this.prisma.project.findMany({
                where: { userId, isPublic: true },
                orderBy: { updatedAt: "desc" },
                include: includeConfig,
            });
        }

        // If no userId filter, only show public projects
        return this.prisma.project.findMany({
            where: { isPublic: true },
            orderBy: { updatedAt: "desc" },
            include: includeConfig,
        });
    }

    /**
     * List projects with pagination
     * If requestingUserId is provided, private projects owned by that user are included
     */
    async listProjectsPaginated(
        userId?: string,
        page: number = 1,
        limit: number = 20,
        requestingUserId?: string
    ): Promise<{
        data: Project[];
        count: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;

        // Build where clause based on userId and requestingUserId
        let where: any = {};

        if (userId) {
            // If the requesting user is the owner, show all their projects
            if (requestingUserId === userId) {
                where = { userId };
            } else {
                // Otherwise, only show public projects
                where = { userId, isPublic: true };
            }
        } else {
            // If no userId filter, only show public projects
            where = { isPublic: true };
        }

        const [data, count] = await Promise.all([
            this.prisma.project.findMany({
                where,
                orderBy: { updatedAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: true,
                    _count: {
                        select: {
                            views: true,
                            likes: true,
                            comments: true,
                        },
                    },
                },
            }),
            this.prisma.project.count({ where }),
        ]);

        return {
            data,
            count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        };
    }

    /**
     * Get hero slider projects (hardcoded featured game IDs)
     * These are the 4 games we want to showcase in the main hero slider
     */
    async getHeroProjects(): Promise<any[]> {
        // TODO: Replace these with your actual featured game IDs
        // These IDs should be manually curated games you want to feature
        const HERO_PROJECT_IDS: string[] = [
            // Add your 4 featured game IDs here
            // Example: "clx1234567890abcdef", "clx0987654321fedcba", etc.
        ];

        // If no IDs configured, fall back to trending projects
        if (HERO_PROJECT_IDS.length === 0) {
            const trending = await this.getTrendingProjects("7d", 4);
            return trending;
        }

        // Fetch the specific projects by their IDs
        const projects = await this.prisma.project.findMany({
            where: {
                id: { in: HERO_PROJECT_IDS },
                isPublic: true,
            },
            include: {
                user: true,
                _count: {
                    select: {
                        views: true,
                        likes: true,
                        comments: true,
                    },
                },
            },
        });

        // Return projects in the same order as HERO_PROJECT_IDS
        const orderedProjects = HERO_PROJECT_IDS
            .map(id => projects.find(p => p.id === id))
            .filter(p => p !== undefined);

        return orderedProjects;
    }

    /**
     * Get featured projects (most recently updated, public only)
     */
    async getFeaturedProjects(limit: number = 3): Promise<Project[]> {
        return this.prisma.project.findMany({
            where: { isPublic: true },
            orderBy: { updatedAt: "desc" },
            take: limit,
            include: {
                user: true,
                _count: {
                    select: {
                        views: true,
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
    }

    /**
     * Get latest projects (public only)
     */
    async getLatestProjects(limit: number = 5): Promise<Project[]> {
        return this.prisma.project.findMany({
            where: { isPublic: true },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                user: true,
                _count: {
                    select: {
                        views: true,
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
    }

    /**
     * Get trending projects based on recent activity
     * Trending score = (viewsWeight * recentViews) + (likesWeight * recentLikes) + (commentsWeight * recentComments)
     */
    async getTrendingProjects(
        timeframe: "24h" | "7d" | "30d" = "7d",
        limit: number = 10
    ): Promise<Array<Project & { trendingScore: number }>> {
        const now = new Date();
        let startDate: Date;

        switch (timeframe) {
            case "24h":
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case "7d":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "30d":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }

        // Get projects with their recent activity counts (public only)
        const projects = await this.prisma.project.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        walletAddress: true,
                    },
                },
                _count: {
                    select: {
                        views: {
                            where: {
                                createdAt: { gte: startDate },
                            },
                        },
                        likes: {
                            where: {
                                createdAt: { gte: startDate },
                            },
                        },
                        comments: {
                            where: {
                                createdAt: { gte: startDate },
                            },
                        },
                    },
                },
            },
            where: {
                isPublic: true,
                createdAt: { gte: startDate }, // Only consider recent projects
            },
        });

        // Calculate trending scores (views: 1x, likes: 5x, comments: 10x)
        const projectsWithScores = projects
            .map((project) => ({
                ...project,
                trendingScore:
                    project._count.views * 1 +
                    project._count.likes * 5 +
                    project._count.comments * 10,
            }))
            .filter((project) => project.trendingScore > 0)
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, limit);

        return projectsWithScores as Array<Project & { trendingScore: number }>;
    }

    /**
     * Get all-time most popular projects (public only)
     */
    async getPopularProjects(limit: number = 10): Promise<Array<Project & { popularityScore: number }>> {
        const projects = await this.prisma.project.findMany({
            where: { isPublic: true },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        walletAddress: true,
                    },
                },
                _count: {
                    select: {
                        views: true,
                        likes: true,
                        comments: true,
                    },
                },
            },
        });

        // Calculate popularity scores
        const projectsWithScores = projects
            .map((project) => ({
                ...project,
                popularityScore:
                    project._count.views * 1 +
                    project._count.likes * 5 +
                    project._count.comments * 10,
            }))
            .filter((project) => project.popularityScore > 0)
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, limit);

        return projectsWithScores as Array<Project & { popularityScore: number }>;
    }

    /**
     * Duplicate a project
     * Creates a copy of the project with a new owner
     */
    async duplicateProject(id: string, newUserId: string): Promise<Project | null> {
        // Fetch the original project
        const original = await this.prisma.project.findUnique({
            where: { id },
        });

        if (!original) {
            return null;
        }

        // Create the duplicate with the same projectData but new owner
        return this.prisma.project.create({
            data: {
                title: `Copy of ${original.title}`,
                description: original.description,
                projectData: original.projectData as any,
                userId: newUserId,
                isMultiplayer: original.isMultiplayer,
                minPlayers: original.minPlayers,
                maxPlayers: original.maxPlayers,
                gameMode: original.gameMode,
                thumbnailImage: original.thumbnailImage,
                headerImage: original.headerImage,
                isPublic: false, // Duplicates start as private
                // Tags, URLs, and other metadata are not copied
                // Stats (views, likes, comments) are automatically 0 for new projects
            },
            include: {
                user: true,
            },
        });
    }

    /**
     * Get leaderboard for a specific project/game
     * Shows players ranked by total earnings (prize money won)
     */
    async getProjectLeaderboard(
        projectId: string,
        page: number = 1,
        limit: number = 10
    ) {
        const offset = (page - 1) * limit;

        // Query to get win/loss stats AND total earnings per user for this project
        // Handles both new activities (targetId = projectId) and old activities (targetId = roomId)
        const leaderboardData = await this.prisma.$queryRaw<
            Array<{
                userId: string;
                username: string | null;
                profileImage: string | null;
                wins: bigint;
                losses: bigint;
                winRate: number | null;
                totalEarnings: number | null;
            }>
        >`
            SELECT
                u.id as "userId",
                u.name as "username",
                u."profileImage" as "profileImage",
                COUNT(CASE WHEN a.type = 'WIN_GAME' THEN 1 END) as wins,
                COUNT(CASE WHEN a.type = 'LOSE_GAME' THEN 1 END) as losses,
                ROUND(
                    COUNT(CASE WHEN a.type = 'WIN_GAME' THEN 1 END)::numeric /
                    NULLIF(COUNT(*)::numeric, 0) * 100,
                    1
                ) as "winRate",
                COALESCE(
                    SUM(
                        CASE
                            WHEN a.type = 'WIN_GAME' AND a.metadata->>'prizeAmount' IS NOT NULL
                            THEN (a.metadata->>'prizeAmount')::numeric
                            ELSE 0
                        END
                    ),
                    0
                ) as "totalEarnings"
            FROM activities a
            JOIN users u ON a."userId" = u.id
            LEFT JOIN rooms r ON a."targetId" = r.id AND a."targetType" = 'room'
            WHERE (
                (a."targetId" = ${projectId} AND a."targetType" = 'project')
                OR (r."projectId" = ${projectId} AND a."targetType" = 'room')
            )
            AND a.type IN ('WIN_GAME', 'LOSE_GAME')
            GROUP BY u.id, u.name, u."profileImage"
            HAVING COUNT(*) > 0
            ORDER BY "totalEarnings" DESC, wins DESC, "winRate" DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `;

        // Get total count for pagination
        const totalResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(DISTINCT a."userId") as count
            FROM activities a
            LEFT JOIN rooms r ON a."targetId" = r.id AND a."targetType" = 'room'
            WHERE (
                (a."targetId" = ${projectId} AND a."targetType" = 'project')
                OR (r."projectId" = ${projectId} AND a."targetType" = 'room')
            )
            AND a.type IN ('WIN_GAME', 'LOSE_GAME')
        `;

        const total = Number(totalResult[0]?.count || 0);

        // Format leaderboard with rank and earnings
        const leaderboard = leaderboardData.map((entry, index) => ({
            rank: offset + index + 1,
            userId: entry.userId,
            username: entry.username || "Anonymous",
            avatar: entry.profileImage,
            wins: Number(entry.wins),
            losses: Number(entry.losses),
            winRate: entry.winRate || 0,
            totalEarnings: Number(entry.totalEarnings || 0),
        }));

        return {
            data: leaderboard,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export default new ProjectService();
