/**
 * Blockchain API Client
 *
 * This client calls Next.js API routes which forward to the backend.
 * Private keys are read from backend temp files, never sent from the frontend.
 */

/**
 * Get auth token from cookies or localStorage
 */
function getAuthToken(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    // Try localStorage first
    const token = localStorage.getItem('authToken');
    if (token) return token;

    // Fallback to cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'authToken') {
            return value;
        }
    }

    return null;
}

/**
 * Claim free DEGU tokens from faucet
 */
export async function claimFreeTokens(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Claiming free tokens...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/claim', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to claim tokens'
            };
        }

        console.log('[Blockchain API] ✅ Tokens claimed successfully');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Transfer DEGU tokens to another address
 */
export async function transfer(
    to: string,
    amount: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Transferring tokens...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ to, amount })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to transfer tokens'
            };
        }

        console.log('[Blockchain API] ✅ Transfer successful');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Approve spender to use tokens
 */
export async function approve(
    spender: string,
    amount: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Approving spender...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ spender, amount })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to approve spender'
            };
        }

        console.log('[Blockchain API] ✅ Approval successful');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Burn DEGU tokens
 */
export async function burn(
    amount: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Burning tokens...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/burn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ amount })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to burn tokens'
            };
        }

        console.log('[Blockchain API] ✅ Tokens burned successfully');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Create a betting game
 */
export async function createBettingGame(
    tokenAddress: string,
    betAmount: string,
    minPlayers: number,
    maxPlayers: number
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Creating betting game...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/create-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({
                tokenAddress,
                betAmount,
                minPlayers,
                maxPlayers
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to create game'
            };
        }

        console.log('[Blockchain API] ✅ Game created successfully');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Join a betting game
 */
export async function joinBettingGame(
    gameId: number
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Joining betting game...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/join-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ gameId })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to join game'
            };
        }

        console.log('[Blockchain API] ✅ Joined game successfully');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Start a betting game (creator only)
 */
export async function startBettingGame(
    gameId: number
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Starting betting game...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/start-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ gameId })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to start game'
            };
        }

        console.log('[Blockchain API] ✅ Game started successfully');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Select winners for a betting game (creator only)
 */
export async function selectWinners(
    gameId: number,
    winners: string[]
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Selecting winners...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/select-winners', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ gameId, winners })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to select winners'
            };
        }

        console.log('[Blockchain API] ✅ Winners selected successfully');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Claim prize from a betting game (winners only)
 */
export async function claimBettingPrize(
    gameId: number
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Claiming prize...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/claim-prize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ gameId })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to claim prize'
            };
        }

        console.log('[Blockchain API] ✅ Prize claimed successfully');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Cancel a betting game (creator only, only if open)
 */
export async function cancelBettingGame(
    gameId: number
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[Blockchain API] Cancelling game...');

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch('/api/blockchain/cancel-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ gameId })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Blockchain API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to cancel game'
            };
        }

        console.log('[Blockchain API] ✅ Game cancelled successfully');
        return result;

    } catch (error) {
        console.error('[Blockchain API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get token balance (DEGU)
 */
export async function getTokenBalance(address: string): Promise<any> {
    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${BACKEND_API_URL}/blockchain/balance/${address}`);
    const result = await response.json();
    return result.data;
}

/**
 * Get native balance (WND for gas)
 */
export async function getNativeBalance(address: string): Promise<any> {
    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${BACKEND_API_URL}/blockchain/native-balance/${address}`);
    const result = await response.json();
    return result.data;
}

/**
 * Check if can claim tokens
 */
export async function canClaimTokens(address: string): Promise<any> {
    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${BACKEND_API_URL}/blockchain/can-claim/${address}`);
    const result = await response.json();
    return result.data;
}

/**
 * Get token info
 */
export async function getTokenInfo(): Promise<any> {
    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${BACKEND_API_URL}/blockchain/token-info`);
    const result = await response.json();
    return result.data;
}

/**
 * Get allowance
 */
export async function getAllowance(owner: string, spender: string): Promise<any> {
    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${BACKEND_API_URL}/blockchain/allowance?owner=${owner}&spender=${spender}`);
    const result = await response.json();
    return result.data;
}

/**
 * Get betting game details
 */
export async function getBettingGameDetails(gameId: number): Promise<any> {
    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${BACKEND_API_URL}/blockchain/betting/game/${gameId}`);
    const result = await response.json();
    return result.data;
}

/**
 * Get total betting games
 */
export async function getTotalBettingGames(): Promise<any> {
    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${BACKEND_API_URL}/blockchain/betting/total-games`);
    const result = await response.json();
    return result.data;
}

/**
 * Get balance (alias for compatibility)
 */
export async function getBalance(address: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const result = await getTokenBalance(address);
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Export the module for external use (Scratch GUI, test page, etc.)
if (typeof window !== 'undefined') {
    (window as any).BlockchainAPI = {
        // Write operations
        claimFreeTokens,
        transfer,
        approve,
        burn,
        createBettingGame,
        joinBettingGame,
        startBettingGame,
        selectWinners,
        claimBettingPrize,
        cancelBettingGame,
        // Read operations
        getBalance,
        getTokenBalance,
        getNativeBalance,
        canClaimTokens,
        getTokenInfo,
        getAllowance,
        getBettingGameDetails,
        getTotalBettingGames
    };
}
