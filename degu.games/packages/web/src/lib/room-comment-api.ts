const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export interface RoomComment {
    id: string;
    roomId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name?: string;
        profileImage?: string;
        walletAddress?: string;
    };
}

export interface GetCommentsResponse {
    success: boolean;
    comments?: RoomComment[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
    };
    error?: string;
}

/**
 * Get comments for a room
 */
export async function getRoomComments(
    roomId: string,
    page: number = 1,
    limit: number = 100
): Promise<GetCommentsResponse> {
    try {
        const url = new URL(`${API_URL}/rooms/${roomId}/comments`);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Failed to fetch comments: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to fetch comments",
            };
        }

        return {
            success: true,
            comments: result.comments,
            pagination: result.pagination,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
}

/**
 * Create a new comment
 */
export async function createRoomComment(
    roomId: string,
    content: string,
    token?: string
): Promise<{ success: boolean; data?: RoomComment; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms/${roomId}/comments`, {
            method: "POST",
            headers,
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Failed to create comment: ${response.statusText}`,
            };
        }

        const result = await response.json();

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
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
}

/**
 * Update a comment
 */
export async function updateRoomComment(
    roomId: string,
    commentId: string,
    content: string,
    token?: string
): Promise<{ success: boolean; data?: RoomComment; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `${API_URL}/rooms/${roomId}/comments/${commentId}`,
            {
                method: "PUT",
                headers,
                body: JSON.stringify({ content }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Failed to update comment: ${response.statusText}`,
            };
        }

        const result = await response.json();

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
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
}

/**
 * Delete a comment
 */
export async function deleteRoomComment(
    roomId: string,
    commentId: string,
    token?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `${API_URL}/rooms/${roomId}/comments/${commentId}`,
            {
                method: "DELETE",
                headers,
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Failed to delete comment: ${response.statusText}`,
            };
        }

        const result = await response.json();

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
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
}

/**
 * Poll for new comments (use for real-time-like behavior)
 */
export async function pollRoomComments(
    roomId: string,
    onUpdate: (comments: RoomComment[]) => void,
    intervalMs: number = 3000
): Promise<() => void> {
    let lastCommentId: string | null = null;

    const poll = async () => {
        const result = await getRoomComments(roomId, 1, 100);
        if (result.success && result.comments) {
            // Only trigger update if there are new comments
            const latestCommentId = result.comments[result.comments.length - 1]?.id;
            if (latestCommentId !== lastCommentId) {
                lastCommentId = latestCommentId;
                onUpdate(result.comments);
            }
        }
    };

    const interval = setInterval(poll, intervalMs);
    poll(); // Initial poll

    // Return cleanup function
    return () => clearInterval(interval);
}
