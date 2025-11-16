import { PrismaClient, Project, User } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface SearchResults {
    projects: Array<Project & {
        user?: {
            id: string;
            name: string | null;
            profileImage: string | null;
            walletAddress: string;
        } | null | undefined;
        _count?: {
            views: number;
            likes: number;
            comments: number;
        };
    }>;
    users: Array<User>;
}

class SearchService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    /**
     * Search for projects and users
     * @param query - Search query string
     * @param limit - Maximum results per category (default: 10)
     */
    async search(query: string, limit: number = 10): Promise<SearchResults> {
        if (!query || query.trim().length === 0) {
            return { projects: [], users: [] };
        }

        const searchTerm = query.trim();

        // Search projects and users in parallel
        const [projects, users] = await Promise.all([
            this.searchProjects(searchTerm, limit),
            this.searchUsers(searchTerm, limit),
        ]);

        return { projects, users };
    }

    /**
     * Search projects by title, description, and tags
     */
    private async searchProjects(
        query: string,
        limit: number
    ): Promise<Array<Project & {
        user?: {
            id: string;
            name: string | null;
            profileImage: string | null;
            walletAddress: string;
        } | null | undefined;
        _count?: {
            views: number;
            likes: number;
            comments: number;
        };
    }>> {
        // Search in title, description, and tags (case-insensitive)
        const projects = await this.prisma.project.findMany({
            where: {
                OR: [
                    {
                        title: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                    {
                        description: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                    {
                        tags: {
                            hasSome: [query.toLowerCase()],
                        },
                    },
                ],
            },
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
            orderBy: [
                { updatedAt: "desc" },
            ],
            take: limit,
        });

        return projects as any;
    }

    /**
     * Search users by name, wallet address, and bio
     */
    private async searchUsers(query: string, limit: number): Promise<User[]> {
        const users = await this.prisma.user.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                    {
                        walletAddress: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                    {
                        bio: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                ],
            },
            orderBy: [
                { updatedAt: "desc" },
            ],
            take: limit,
        });

        return users;
    }
}

export default new SearchService();
