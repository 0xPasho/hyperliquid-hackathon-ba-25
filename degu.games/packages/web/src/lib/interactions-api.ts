import { Comment, ProjectStats, ApiResponse } from "./types";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Helper function to get auth token
function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken"); // Changed from "token" to "authToken"
}

// Comments
export async function getComments(
    projectId: string
): Promise<{ success: boolean; data?: Comment[]; error?: string }> {
    try {
        const response = await fetch(
            `${API_URL}/interactions/projects/${projectId}/comments`,
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
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to fetch comments: ${response.statusText}`,
            };
        }

        const result: ApiResponse<Comment[]> = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No comments data returned",
            };
        }

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
        };
    }
}

export async function createComment(
    projectId: string,
    content: string
): Promise<{ success: boolean; data?: Comment; error?: string }> {
    try {
        const token = getAuthToken();
        if (!token) {
            return {
                success: false,
                error: "You must be logged in to create a comment",
            };
        }

        const response = await fetch(
            `${API_URL}/interactions/projects/${projectId}/comments`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to create comment: ${response.statusText}`,
            };
        }

        const result: ApiResponse<Comment> = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No comment data returned",
            };
        }

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
        };
    }
}

export async function deleteComment(
    commentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const token = getAuthToken();
        if (!token) {
            return {
                success: false,
                error: "You must be logged in to delete a comment",
            };
        }

        const response = await fetch(
            `${API_URL}/interactions/comments/${commentId}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to delete comment: ${response.statusText}`,
            };
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to delete comment",
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
        };
    }
}

// Likes
export async function toggleLike(
    projectId: string
): Promise<{ success: boolean; data?: { liked: boolean }; error?: string }> {
    try {
        const token = getAuthToken();
        if (!token) {
            return {
                success: false,
                error: "You must be logged in to like a project",
            };
        }

        const response = await fetch(
            `${API_URL}/interactions/projects/${projectId}/like`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to toggle like: ${response.statusText}`,
            };
        }

        const result: ApiResponse<{ liked: boolean }> = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No like data returned",
            };
        }

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
        };
    }
}

// Views
export async function trackView(
    projectId: string,
    sessionId: string
): Promise<{ success: boolean; data?: { counted: boolean }; error?: string }> {
    try {
        const response = await fetch(
            `${API_URL}/interactions/projects/${projectId}/view`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sessionId }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to track view: ${response.statusText}`,
            };
        }

        const result: ApiResponse<{ counted: boolean }> = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No view data returned",
            };
        }

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
        };
    }
}

// Stats
export async function getProjectStats(
    projectId: string
): Promise<{ success: boolean; data?: ProjectStats; error?: string }> {
    try {
        const token = getAuthToken();
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
            `${API_URL}/interactions/projects/${projectId}/stats`,
            {
                method: "GET",
                headers,
                cache: "no-store",
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to fetch project stats: ${response.statusText}`,
            };
        }

        const result: ApiResponse<ProjectStats> = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No stats data returned",
            };
        }

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
        };
    }
}

// Helper to generate/get session ID for view tracking
export function getOrCreateSessionId(): string {
    if (typeof window === "undefined") return "";

    const SESSION_KEY = "scratch_session_id";
    let sessionId = sessionStorage.getItem(SESSION_KEY);

    if (!sessionId) {
        // Generate a new session ID
        sessionId = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 15)}`;
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    return sessionId;
}
