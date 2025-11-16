import { ApiResponse, AuthResponse, LoginRequest, User } from "./types";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export async function loginUser(data: LoginRequest): Promise<{success: boolean; data?: AuthResponse; error?: string}> {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Login failed: ${response.statusText}`
            };
        }

        const result: ApiResponse<AuthResponse> = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No data returned from login"
            };
        }

        return {success: true, data: result.data};
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred"
        };
    }
}

export async function getCurrentUser(token: string): Promise<{success: boolean; data?: User; error?: string}> {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Failed to get user: ${response.statusText}`
            };
        }

        const result: ApiResponse<User> = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No user data returned"
            };
        }

        return {success: true, data: result.data};
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred"
        };
    }
}

export async function getUserByWallet(walletAddress: string): Promise<{success: boolean; data?: User; error?: string}> {
    try {
        const response = await fetch(
            `${API_URL}/auth/wallet/${walletAddress}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Failed to get user by wallet: ${response.statusText}`
            };
        }

        const result: ApiResponse<User> = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No user data returned"
            };
        }

        return {success: true, data: result.data};
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred"
        };
    }
}

export async function updateUserProfile(
    token: string,
    data: {
        name?: string;
        bio?: string;
        profileImage?: string;
        headerImage?: string;
        websiteUrl?: string;
        twitterUrl?: string;
        discordUrl?: string;
        telegramUrl?: string;
    }
): Promise<{success: boolean; data?: User; error?: string}> {
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Failed to update profile: ${response.statusText}`
            };
        }

        const result: ApiResponse<User> = await response.json();

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "No user data returned"
            };
        }

        return {success: true, data: result.data};
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred"
        };
    }
}

export async function logoutUser(token: string): Promise<{success: boolean; error?: string}> {
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Logout failed: ${response.statusText}`
            };
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Logout request unsuccessful"
            };
        }

        return {success: true};
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred"
        };
    }
}
