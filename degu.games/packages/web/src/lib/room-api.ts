const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export enum RoomStatus {
    WAITING = "WAITING",
    READY = "READY",
    PLAYING = "PLAYING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
}

export interface Room {
    id: string;
    name: string;
    projectId: string;
    hostId: string;
    maxPlayers: number;
    currentPlayers: number;
    status: RoomStatus;
    blockchainGameId?: string;
    escrowGameId?: number; // New GameEscrow contract game ID
    chainId?: number; // Blockchain network ID (84532=Base, 80002=Polygon, 421614=Arbitrum)
    networkName?: string; // Human-readable network name (Base, Polygon, Arbitrum)
    entryFee?: string; // Entry fee in tokens (if using escrow)
    entryFeeUsd?: string; // Approximate USD value at creation time
    paymentToken?: string; // Token address for payment
    tokenAddress?: string; // Alias for paymentToken
    tokenSymbol?: string; // Token symbol (USDC, ETH, MATIC)
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
    startedAt?: string;
    completedAt?: string;
    vmServerUrl?: string; // WebSocket URL for vm-server
    vmStatus?: string; // VM status: ready, queued, etc.
    vmQueuePosition?: number; // Position in queue if queued
    winnerId?: string | null; // User ID of winner (when game is completed)
    project?: {
        id: string;
        title: string;
        description?: string;
    };
    host?: {
        id: string;
        name?: string;
        walletAddress?: string; // Optional - may not exist for social login
        profileImage?: string;
    };
    players?: RoomPlayer[];
}

export interface RoomPlayer {
    id: string;
    roomId: string;
    userId: string;
    joinedAt: string;
    leftAt?: string;
    isReady: boolean;
    hasPaid?: boolean; // For paid rooms - tracks if player paid entry fee on blockchain
    walletAddress?: string;
    user?: {
        id: string;
        name?: string;
        walletAddress?: string; // Optional - may not exist for social login
        profileImage?: string;
    };
}

export interface CreateRoomData {
    name?: string;
    projectId: string;
    hostId: string;
    maxPlayers?: number;
    isPrivate?: boolean;
    password?: string;
    blockchainGameId?: string;
    escrowGameId?: number; // New GameEscrow contract game ID
    chainId?: number; // Blockchain network ID
    networkName?: string; // Human-readable network name
    entryFee?: string; // Entry fee in tokens
    entryFeeUsd?: string; // Approximate USD value at creation time
    paymentToken?: string; // Token address for payment
    tokenAddress?: string; // Alias for paymentToken
    tokenSymbol?: string; // Token symbol (USDC, ETH, MATIC)
}

/**
 * Prepare blockchain game (before payment)
 * Returns gameId for user to pay
 */
export async function prepareBlockchainGame(
    data: {
        tokenAddress: string;
        entryFee: string;
        gameMode: number;
        maxPlayers: number;
        teams?: number;
        chainId?: number;
    },
    token?: string
): Promise<{ success: boolean; gameId?: string; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms/prepare`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to prepare blockchain game: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.gameId) {
            return {
                success: false,
                error: result.error || "No gameId returned",
            };
        }

        return { success: true, gameId: result.gameId };
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

/**
 * Create a new room
 */
export async function createRoom(
    data: CreateRoomData,
    token?: string
): Promise<{ success: boolean; data?: Room; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to create room: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No room data returned",
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

/**
 * Get a room by ID
 */
export async function getRoom(
    roomId: string
): Promise<{ success: boolean; data?: Room; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/rooms/${roomId}`, {
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to fetch room: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No room data returned",
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

/**
 * Get all rooms for a project
 */
export async function getRoomsByProject(
    projectId: string,
    options?: {
        includeCompleted?: boolean;
        stakes?: "all" | "high" | "medium" | "low";
        chainId?: number | "all";
        orderBy?: "createdAt" | "entryFee";
        orderDirection?: "asc" | "desc";
    }
): Promise<{ success: boolean; data?: Room[]; error?: string }> {
    try {
        const url = new URL(`${API_URL}/rooms/project/${projectId}`);

        if (options?.includeCompleted) {
            url.searchParams.append("includeCompleted", "true");
        }

        if (options?.stakes && options.stakes !== "all") {
            url.searchParams.append("stakes", options.stakes);
        }

        if (options?.chainId && options.chainId !== "all") {
            url.searchParams.append("chainId", options.chainId.toString());
        }

        if (options?.orderBy) {
            url.searchParams.append("orderBy", options.orderBy);
        }

        if (options?.orderDirection) {
            url.searchParams.append("orderDirection", options.orderDirection);
        }

        const response = await fetch(url.toString(), {
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to fetch rooms: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No rooms data returned",
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

/**
 * Get project statistics (total volume and total players)
 * Calculated in the backend for efficiency
 */
export async function getProjectRoomStats(
    projectId: string
): Promise<{
    success: boolean;
    data?: { totalVolume: number; totalPlayers: number };
    error?: string;
}> {
    try {
        const response = await fetch(
            `${API_URL}/rooms/project/${projectId}/stats`,
            {
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

        const result = await response.json();

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

/**
 * Get all active rooms (global lobby)
 */
export async function getActiveRooms(
    limit: number = 50
): Promise<{ success: boolean; data?: Room[]; error?: string }> {
    try {
        const url = new URL(`${API_URL}/rooms/active`);
        url.searchParams.append("limit", limit.toString());

        const response = await fetch(url.toString(), {
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to fetch active rooms: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No rooms data returned",
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

/**
 * Join a room
 */
export async function joinRoom(
    roomId: string,
    userId: string,
    walletAddress?: string,
    password?: string,
    token?: string,
    hasPaid?: boolean
): Promise<{ success: boolean; data?: RoomPlayer; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms/${roomId}/join`, {
            method: "POST",
            headers,
            body: JSON.stringify({ userId, walletAddress, password, hasPaid }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to join room: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No player data returned",
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

/**
 * Leave a room
 */
export async function leaveRoom(
    roomId: string,
    userId: string,
    token?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms/${roomId}/leave`, {
            method: "POST",
            headers,
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to leave room: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to leave room",
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

/**
 * Cancel a room (host only, when alone)
 * This will mark the room as cancelled in the database
 * For blockchain games, you must also call cancelGameAndRefund from user-escrow-client.ts
 */
export async function cancelRoom(
    roomId: string,
    userId: string,
    reason?: string,
    token?: string
): Promise<{
    success: boolean;
    data?: Room;
    message?: string;
    error?: string;
}> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms/${roomId}/cancel`, {
            method: "POST",
            headers,
            body: JSON.stringify({ userId, reason }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to cancel room: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to cancel room",
            };
        }

        return {
            success: true,
            data: result.data,
            message: result.message,
        };
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

/**
 * Toggle ready status
 */
export async function toggleReady(
    roomId: string,
    userId: string,
    token?: string
): Promise<{ success: boolean; data?: RoomPlayer; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms/${roomId}/ready`, {
            method: "POST",
            headers,
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to toggle ready: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No player data returned",
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

/**
 * Start a game (host only)
 */
export async function startGame(
    roomId: string,
    hostId: string,
    token?: string
): Promise<{
    success: boolean;
    data?: {
        room: Room;
        vmServerUrl?: string;
        vmStatus?: string;
        vmQueuePosition?: number;
    };
    error?: string;
}> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms/${roomId}/start`, {
            method: "POST",
            headers,
            body: JSON.stringify({ hostId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to start game: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No game data returned",
            };
        }

        return {
            success: true,
            data: {
                room: result.data,
                vmServerUrl: result.data.vmServerUrl,
                vmStatus: result.data.vmStatus,
                vmQueuePosition: result.data.vmQueuePosition,
            },
        };
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

/**
 * Update a room
 */
export async function updateRoom(
    roomId: string,
    data: {
        name?: string;
        maxPlayers?: number;
        status?: RoomStatus;
        blockchainGameId?: string;
        escrowGameId?: number;
        entryFee?: string;
        paymentToken?: string;
    },
    token?: string
): Promise<{ success: boolean; data?: Room; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms/${roomId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to update room: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No room data returned",
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

/**
 * Delete a room (host only)
 */
export async function deleteRoom(
    roomId: string,
    userId: string,
    token?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/rooms/${roomId}`, {
            method: "DELETE",
            headers,
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to delete room: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to delete room",
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

/**
 * Get room by blockchain game ID
 */
export async function getRoomByBlockchainGameId(
    gameId: string
): Promise<{ success: boolean; data?: Room; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/rooms/blockchain/${gameId}`, {
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error:
                    errorData.error ||
                    `Failed to fetch room by blockchain game ID: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No room data returned",
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

/**
 * Poll for room updates (use for real-time-like behavior)
 */
export async function pollRoomUpdates(
    roomId: string,
    onUpdate: (room: Room) => void,
    intervalMs: number = 2000
): Promise<() => void> {
    const poll = async () => {
        const result = await getRoom(roomId);
        if (result.success && result.data) {
            onUpdate(result.data);
        }
    };

    const interval = setInterval(poll, intervalMs);
    poll(); // Initial poll

    // Return cleanup function
    return () => clearInterval(interval);
}
