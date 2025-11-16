const VM_SERVER_URL = process.env.VM_SERVER_URL || "http://localhost:3002";
const VM_SERVER_TOKEN = process.env.VM_SERVER_TOKEN || "local-dev-token-12345";

interface RequestSlotResponse {
    success: boolean;
    data?: {
        status: "ready" | "queued";
        roomId: string;
        wsUrl?: string;
        queuePosition?: number;
        message: string;
    };
    error?: string;
}

export class VMServerClient {
    private baseUrl: string;
    private token: string;

    constructor() {
        this.baseUrl = VM_SERVER_URL;
        this.token = VM_SERVER_TOKEN;
    }

    /**
     * Request a game slot from VM server
     */
    async requestSlot(
        roomId: string,
        projectId: string,
        projectData: any,
        players: string[]
    ): Promise<RequestSlotResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/request-slot`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.token}`,
                },
                body: JSON.stringify({
                    roomId,
                    projectId,
                    projectData,
                    players,
                }),
            });

            const result = (await response.json()) as RequestSlotResponse;

            if (!response.ok) {
                console.error("[VMServerClient] Request failed:", result);
                return {
                    success: false,
                    error: result.error || `HTTP ${response.status}`,
                };
            }

            return result;
        } catch (error: any) {
            console.error("[VMServerClient] Error:", error);
            return {
                success: false,
                error: error.message || "VM server unavailable",
            };
        }
    }

    /**
     * End a game (admin)
     */
    async endGame(roomId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/end-game/${roomId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });

            const result = (await response.json()) as { success?: boolean; error?: string };

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || "Failed to end game",
                };
            }

            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get VM server status
     */
    async getStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/status`);
            return await response.json();
        } catch (error) {
            return {
                success: false,
                error: "Failed to get status",
            };
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: "GET",
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const vmServerClient = new VMServerClient();
