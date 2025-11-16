import { Project, ApiResponse, User, Comment } from "./types";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// ApiError class removed - using graceful error handling instead

export async function fetchProject(id: string, token?: string): Promise<Project | null> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/projects/${id}`, {
            method: "GET",
            headers,
            cache: "no-store", // Ensure fresh data
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch project:", errorData.error || response.statusText, errorData);
            return null;
        }

        const result: ApiResponse<Project> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch project:", result.error || "Unknown error");
            return null;
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching project:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function fetchProjects(
    userId?: string,
    page?: number,
    limit?: number,
    token?: string
): Promise<{
    data: Project[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
}> {
    try {
        const url = new URL(`${API_URL}/projects`);
        if (userId) url.searchParams.append("userId", userId);
        if (page) url.searchParams.append("page", page.toString());
        if (limit) url.searchParams.append("limit", limit.toString());

        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers,
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch projects:", errorData.error || response.statusText, errorData);
            return { data: [], count: 0, page: 1, limit: 10, totalPages: 0 };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch projects:", result.error || "Unknown error");
            return { data: [], count: 0, page: 1, limit: 10, totalPages: 0 };
        }

        return {
            data: result.data,
            count: result.count,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    } catch (error) {
        console.error("Error fetching projects:", error instanceof Error ? error.message : "Unknown error");
        return { data: [], count: 0, page: 1, limit: 10, totalPages: 0 };
    }
}

export async function fetchHeroProjects(): Promise<Project[]> {
    try {
        const url = new URL(`${API_URL}/projects/hero`);

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch hero projects:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<Project[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch hero projects:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching hero projects:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

export async function fetchFeaturedProjects(
    limit: number = 3
): Promise<Project[]> {
    try {
        const url = new URL(`${API_URL}/projects/featured`);
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch featured projects:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<Project[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch featured projects:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching featured projects:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

export async function fetchLatestProjects(
    limit: number = 5
): Promise<Project[]> {
    try {
        const url = new URL(`${API_URL}/projects/latest`);
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch latest projects:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<Project[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch latest projects:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching latest projects:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

export async function fetchTrendingProjects(
    timeframe: "24h" | "7d" | "30d" = "7d",
    limit: number = 10
): Promise<Project[]> {
    try {
        const url = new URL(`${API_URL}/projects/trending`);
        url.searchParams.append("timeframe", timeframe);
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch trending projects:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<Project[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch trending projects:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching trending projects:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

export async function fetchPopularProjects(
    limit: number = 10
): Promise<Project[]> {
    try {
        const url = new URL(`${API_URL}/projects/popular`);
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch popular projects:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<Project[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch popular projects:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching popular projects:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

export async function createProject(data: {
    title?: string;
    userId?: string;
    projectData?: Record<string, unknown>;
}): Promise<Project | null> {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to create project:", errorData.error || response.statusText, errorData);
            return null;
        }

        const result: ApiResponse<Project> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to create project:", result.error || "Unknown error");
            return null;
        }

        return result.data;
    } catch (error) {
        console.error("Error creating project:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function uploadProjectHeaderImage(
    projectId: string,
    file: File,
    token?: string
): Promise<{ imageUrl: string; project: Project } | null> {
    try {
        const formData = new FormData();
        formData.append("image", file);

        const headers: HeadersInit = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
            `${API_URL}/projects/${projectId}/upload-header`,
            {
                method: "POST",
                headers,
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to upload header image:", errorData.error || response.statusText, errorData);
            return null;
        }

        const result: ApiResponse<{ imageUrl: string; project: Project }> =
            await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to upload header image:", result.error || "Unknown error");
            return null;
        }

        return result.data;
    } catch (error) {
        console.error("Error uploading header image:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function uploadProjectThumbnailImage(
    projectId: string,
    file: File,
    token?: string
): Promise<{ imageUrl: string; project: Project } | null> {
    try {
        const formData = new FormData();
        formData.append("image", file);

        const headers: HeadersInit = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
            `${API_URL}/projects/${projectId}/upload-thumbnail`,
            {
                method: "POST",
                headers,
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to upload thumbnail image:", errorData.error || response.statusText, errorData);
            return null;
        }

        const result: ApiResponse<{ imageUrl: string; project: Project }> =
            await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to upload thumbnail image:", result.error || "Unknown error");
            return null;
        }

        return result.data;
    } catch (error) {
        console.error("Error uploading thumbnail image:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function uploadUserProfileImage(
    userId: string,
    file: File,
    token: string
): Promise<{ imageUrl: string; user: User } | null> {
    try {
        const formData = new FormData();
        formData.append("image", file);

        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
        };

        const response = await fetch(
            `${API_URL}/users/${userId}/upload-profile-image`,
            {
                method: "POST",
                headers,
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to upload profile image:", errorData.error || response.statusText, errorData);
            return null;
        }

        const result: ApiResponse<{ imageUrl: string; user: User }> =
            await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to upload profile image:", result.error || "Unknown error");
            return null;
        }

        return result.data;
    } catch (error) {
        console.error("Error uploading profile image:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function uploadUserHeaderImage(
    userId: string,
    file: File,
    token: string
): Promise<{ imageUrl: string; user: User } | null> {
    try {
        const formData = new FormData();
        formData.append("image", file);

        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
        };

        const response = await fetch(
            `${API_URL}/users/${userId}/upload-header-image`,
            {
                method: "POST",
                headers,
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to upload header image:", errorData.error || response.statusText, errorData);
            return null;
        }

        const result: ApiResponse<{ imageUrl: string; user: User }> =
            await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to upload header image:", result.error || "Unknown error");
            return null;
        }

        return result.data;
    } catch (error) {
        console.error("Error uploading header image:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function updateProject(
    id: string,
    data: {
        title?: string;
        projectData?: Record<string, unknown>;
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
    },
    token?: string
): Promise<Project | null> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/projects/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to update project:", errorData.error || response.statusText, errorData);
            return null;
        }

        const result: ApiResponse<Project> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to update project:", result.error || "Unknown error");
            return null;
        }

        return result.data;
    } catch (error) {
        console.error("Error updating project:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function deleteProject(id: string): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/projects/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to delete project:", errorData.error || response.statusText, errorData);
            return;
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
            console.error("Failed to delete project:", result.error || "Unknown error");
            return;
        }
    } catch (error) {
        console.error("Error deleting project:", error instanceof Error ? error.message : "Unknown error");
        return;
    }
}

export async function duplicateProject(id: string, token: string): Promise<Project | null> {
    try {
        const response = await fetch(`${API_URL}/projects/${id}/duplicate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (!response.ok) {
            return null;
        }

        const result: ApiResponse<Project> = await response.json();

        if (!result.success || !result.data) {
            return null;
        }

        return result.data;
    } catch (error) {
        console.error("Error duplicating project:", error);
        return null;
    }
}

export async function getProjectsByUserId(
    userId: string,
    params?: {
        excludeId?: string;
        isPublic?: boolean;
        limit?: number;
    }
): Promise<Project[]> {
    try {
        const queryParams = new URLSearchParams();
        if (params?.excludeId) queryParams.append("excludeId", params.excludeId);
        if (params?.isPublic !== undefined) queryParams.append("isPublic", String(params.isPublic));
        if (params?.limit) queryParams.append("limit", String(params.limit));

        const url = `${API_URL}/users/${userId}/projects${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch user projects:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<Project[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch user projects:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching user projects:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

// User API Functions

export async function fetchUser(id: string): Promise<User | null> {
    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch user:", errorData.error || response.statusText, errorData);
            return null;
        }

        const result: ApiResponse<User> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch user:", result.error || "Unknown error");
            return null;
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching user:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function fetchUserProjects(
    userId: string,
    page?: number,
    limit?: number,
    token?: string
): Promise<{
    data: Project[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
}> {
    try {
        const url = new URL(`${API_URL}/users/${userId}/projects`);
        if (page) url.searchParams.append("page", page.toString());
        if (limit) url.searchParams.append("limit", limit.toString());

        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers,
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch user projects:", errorData.error || response.statusText, errorData);
            return { data: [], count: 0, page: 1, limit: 10, totalPages: 0 };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch user projects:", result.error || "Unknown error");
            return { data: [], count: 0, page: 1, limit: 10, totalPages: 0 };
        }

        return {
            data: result.data,
            count: result.count,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    } catch (error) {
        console.error("Error fetching user projects:", error instanceof Error ? error.message : "Unknown error");
        return { data: [], count: 0, page: 1, limit: 10, totalPages: 0 };
    }
}

export async function fetchUserComments(
    userId: string,
    limit?: number
): Promise<Comment[]> {
    try {
        const url = new URL(`${API_URL}/users/${userId}/comments`);
        if (limit) url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch user comments:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<Comment[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch user comments:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching user comments:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

export async function fetchUserStats(userId: string): Promise<{
    projectCount: number;
    followerCount: number;
    followingCount: number;
    totalEarnings?: number;
}> {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/stats`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch user stats:", errorData.error || response.statusText, errorData);
            return { projectCount: 0, followerCount: 0, followingCount: 0, totalEarnings: 0 };
        }

        const result: ApiResponse<{
            projectCount: number;
            followerCount: number;
            followingCount: number;
            totalEarnings?: number;
        }> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch user stats:", result.error || "Unknown error");
            return { projectCount: 0, followerCount: 0, followingCount: 0, totalEarnings: 0 };
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching user stats:", error instanceof Error ? error.message : "Unknown error");
        return { projectCount: 0, followerCount: 0, followingCount: 0, totalEarnings: 0 };
    }
}

export async function fetchUserFeaturedProject(
    userId: string
): Promise<Project | null> {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/featured`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch featured project:", errorData.error || response.statusText, errorData);
            return null;
        }

        const result: ApiResponse<Project | null> = await response.json();

        if (!result.success) {
            console.error("Failed to fetch featured project:", result.error || "Unknown error");
            return null;
        }

        return result.data || null;
    } catch (error) {
        console.error("Error fetching featured project:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

export async function fetchUserActivity(
    userId: string,
    limit?: number
): Promise<{ type: string; createdAt: Date; project?: { id: string; title: string }; id?: string; title?: string }[]> {
    try {
        const url = new URL(`${API_URL}/users/${userId}/activity`);
        if (limit) url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch user activity:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<{ type: string; createdAt: Date; project?: { id: string; title: string }; id?: string; title?: string }[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch user activity:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching user activity:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

// Follow/Unfollow API Functions

export async function followUser(userId: string, token: string): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/follow`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to follow user:", errorData.error || response.statusText, errorData);
            return;
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
            console.error("Failed to follow user:", result.error || "Unknown error");
            return;
        }
    } catch (error) {
        console.error("Error following user:", error instanceof Error ? error.message : "Unknown error");
        return;
    }
}

export async function unfollowUser(userId: string, token: string): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/follow`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to unfollow user:", errorData.error || response.statusText, errorData);
            return;
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
            console.error("Failed to unfollow user:", result.error || "Unknown error");
            return;
        }
    } catch (error) {
        console.error("Error unfollowing user:", error instanceof Error ? error.message : "Unknown error");
        return;
    }
}

export async function checkFollowStatus(userId: string, token?: string): Promise<boolean> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/users/${userId}/follow/status`, {
            method: "GET",
            headers,
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to check follow status:", errorData.error || response.statusText, errorData);
            return false;
        }

        const result: ApiResponse<{ isFollowing: boolean }> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to check follow status:", result.error || "Unknown error");
            return false;
        }

        return result.data.isFollowing;
    } catch (error) {
        console.error("Error checking follow status:", error instanceof Error ? error.message : "Unknown error");
        return false;
    }
}

// Trending/Popular Users API Functions

export async function fetchTrendingUsers(
    timeframe: "24h" | "7d" | "30d" = "7d",
    limit: number = 10
): Promise<User[]> {
    try {
        const url = new URL(`${API_URL}/users/trending`);
        url.searchParams.append("timeframe", timeframe);
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch trending users:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<User[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch trending users:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching trending users:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

export async function fetchPopularUsers(
    limit: number = 10
): Promise<User[]> {
    try {
        const url = new URL(`${API_URL}/users/popular`);
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch popular users:", errorData.error || response.statusText, errorData);
            return [];
        }

        const result: ApiResponse<User[]> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch popular users:", result.error || "Unknown error");
            return [];
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching popular users:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
}

// Profile View Tracking API Functions

export async function trackProfileView(userId: string, sessionId: string): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/view`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to track profile view:", errorData.error || response.statusText, errorData);
            return;
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
            console.error("Failed to track profile view:", result.error || "Unknown error");
            return;
        }
    } catch (error) {
        console.error("Error tracking profile view:", error instanceof Error ? error.message : "Unknown error");
        return;
    }
}

export async function getProfileViewCount(userId: string): Promise<number> {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/views`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to get profile view count:", errorData.error || response.statusText, errorData);
            return 0;
        }

        const result: ApiResponse<{ count: number }> = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to get profile view count:", result.error || "Unknown error");
            return 0;
        }

        return result.data.count;
    } catch (error) {
        console.error("Error getting profile view count:", error instanceof Error ? error.message : "Unknown error");
        return 0;
    }
}

// Followers/Following API Functions with Pagination

export async function fetchFollowers(
    userId: string,
    page: number = 1,
    limit: number = 20
): Promise<{
    data: User[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
}> {
    try {
        const url = new URL(`${API_URL}/users/${userId}/followers`);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch followers:", errorData.error || response.statusText, errorData);
            return { data: [], count: 0, page: 1, limit: 20, totalPages: 0 };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch followers:", result.error || "Unknown error");
            return { data: [], count: 0, page: 1, limit: 20, totalPages: 0 };
        }

        // Map the data to extract user objects if nested
        const users = result.data.map((item: any) => {
            // If the data has a 'follower' property, use that (it contains the user data)
            if (item.follower) {
                return item.follower;
            }
            // Otherwise assume it's already a user object
            return item;
        });

        return {
            data: users,
            count: result.count,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    } catch (error) {
        console.error("Error fetching followers:", error instanceof Error ? error.message : "Unknown error");
        return { data: [], count: 0, page: 1, limit: 20, totalPages: 0 };
    }
}

export async function fetchFollowing(
    userId: string,
    page: number = 1,
    limit: number = 20
): Promise<{
    data: User[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
}> {
    try {
        const url = new URL(`${API_URL}/users/${userId}/following`);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch following:", errorData.error || response.statusText, errorData);
            return { data: [], count: 0, page: 1, limit: 20, totalPages: 0 };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            console.error("Failed to fetch following:", result.error || "Unknown error");
            return { data: [], count: 0, page: 1, limit: 20, totalPages: 0 };
        }

        // Map the data to extract user objects if nested
        const users = result.data.map((item: any) => {
            // If the data has a 'following' property, use that (it contains the user data)
            if (item.following) {
                return item.following;
            }
            // Otherwise assume it's already a user object
            return item;
        });

        return {
            data: users,
            count: result.count,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    } catch (error) {
        console.error("Error fetching following:", error instanceof Error ? error.message : "Unknown error");
        return { data: [], count: 0, page: 1, limit: 20, totalPages: 0 };
    }
}


// Fetch user game activities (wins/losses)
export async function fetchUserGameActivities(
    userId: string,
    limit: number = 10,
    offset: number = 0
): Promise<{ activities: any[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }> {
    try {
        const response = await fetch(
            `${API_URL}/activity/user/${userId}/games?limit=${limit}&offset=${offset}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            return { activities: [], pagination: { total: 0, limit, offset, hasMore: false } };
        }
    } catch (error) {
        console.error("Error fetching game activities:", error instanceof Error ? error.message : "Unknown error");
        return { activities: [], pagination: { total: 0, limit, offset, hasMore: false } };
    }
}

// Fetch project leaderboard
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatar: string | null;
    wins: number;
    losses: number;
    winRate: number;
    totalEarnings: number;
}

export interface LeaderboardResponse {
    data: LeaderboardEntry[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export async function fetchProjectLeaderboard(
    projectId: string,
    page: number = 1,
    limit: number = 10
): Promise<LeaderboardResponse> {
    try {
        const response = await fetch(
            `${API_URL}/projects/${projectId}/leaderboard?page=${page}&limit=${limit}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to fetch leaderboard:", errorData.error || response.statusText);
            return {
                data: [],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
            };
        }

        const result = await response.json();

        if (!result.success) {
            console.error("Failed to fetch leaderboard:", result.error || "Unknown error");
            return {
                data: [],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
            };
        }

        return {
            data: result.data,
            pagination: result.pagination,
        };
    } catch (error) {
        console.error("Error fetching leaderboard:", error instanceof Error ? error.message : "Unknown error");
        return {
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
        };
    }
}
