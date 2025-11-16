/**
 * GameEscrow API Client
 *
 * Integrates with the GameEscrow smart contract for managing
 * multiplayer game payments with escrow functionality.
 */

import GameEscrowABI from './abis/GameEscrow.json';
import ERC20ABI from './abis/MockERC20.json';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

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

// Contract configuration
const GAME_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_GAME_ESCROW_ADDRESS || '0xe9F14E333Ad13a9a28c6722c41f6a91A0e009A4f';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0xE02E0dEa9F850D88E1329550D9FC8D98aF541f55'; // Base Sepolia USDC
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532'); // Base Sepolia

export enum GameMode {
    WinnerTakesAll = 0,
    TeamBattle = 1,
    FreeForAll = 2,
    ScoreBased = 3
}

export interface GameEscrowData {
    gameId: number;
    creator: string;
    paymentToken: string;
    mode: GameMode;
    entryFee: string;
    maxPlayers: number;
    numTeams: number;
    timeLimit: number;
    startTime: number;
    createdAt: number;
    status: number; // 0=Waiting, 1=Active, 2=Finished, 3=Cancelled, 4=Emergency
    players: string[];
    prizePool: string;
    creatorCommission: string;
    platformCommission: string;
    payoutComplete: boolean;
}

export interface CreateEscrowGameParams {
    tokenAddress: string;
    entryFee: string;
    minPlayers: number;
    maxPlayers: number;
    mode: GameMode;
    teams?: number;
    prizePercentages?: number[];
}

export interface JoinEscrowGameParams {
    gameId: number;
    teamId?: number;
}

/**
 * Create a new escrow game on-chain
 */
export async function createEscrowGame(
    params: CreateEscrowGameParams
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[GameEscrow API] Creating escrow game...', params);

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch(`${API_URL}/blockchain/game-escrow/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify(params)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[GameEscrow API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to create escrow game'
            };
        }

        console.log('[GameEscrow API] ✅ Escrow game created successfully');
        return result;

    } catch (error) {
        console.error('[GameEscrow API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Join an existing escrow game
 */
export async function joinEscrowGame(
    params: JoinEscrowGameParams
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[GameEscrow API] Joining escrow game...', params);

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch(`${API_URL}/blockchain/game-escrow/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify(params)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[GameEscrow API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to join escrow game'
            };
        }

        console.log('[GameEscrow API] ✅ Joined escrow game successfully');
        return result;

    } catch (error) {
        console.error('[GameEscrow API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Report game results (oracle only)
 */
export async function reportGameResult(
    gameId: number,
    winners: string[],
    scores: number[],
    teamAssignments: number[]
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[GameEscrow API] Reporting game result...', { gameId, winners, scores });

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch(`${API_URL}/blockchain/game-escrow/report-result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ gameId, winners, scores, teamAssignments })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[GameEscrow API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to report game result'
            };
        }

        console.log('[GameEscrow API] ✅ Game result reported successfully');
        return result;

    } catch (error) {
        console.error('[GameEscrow API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Cancel an escrow game (creator only, before it starts)
 */
export async function cancelEscrowGame(
    gameId: number
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[GameEscrow API] Cancelling escrow game...', gameId);

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch(`${API_URL}/blockchain/game-escrow/cancel`, {
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
            console.error('[GameEscrow API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to cancel escrow game'
            };
        }

        console.log('[GameEscrow API] ✅ Escrow game cancelled successfully');
        return result;

    } catch (error) {
        console.error('[GameEscrow API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get escrow game details
 */
export async function getEscrowGameDetails(
    gameId: number
): Promise<{ success: boolean; data?: GameEscrowData; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/blockchain/game-escrow/${gameId}`);
        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.error || 'Failed to fetch game details'
            };
        }

        return result;

    } catch (error) {
        console.error('[GameEscrow API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get player info in a game
 */
export async function getPlayerInfo(
    gameId: number,
    playerAddress: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/blockchain/game-escrow/player-info?gameId=${gameId}&playerAddress=${playerAddress}`);
        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.error || 'Failed to fetch player info'
            };
        }

        return result;

    } catch (error) {
        console.error('[GameEscrow API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Check if user needs to approve token spending
 */
export async function checkTokenAllowance(
    userAddress: string,
    tokenAddress: string,
    amount: string
): Promise<{ success: boolean; needsApproval: boolean; error?: string }> {
    try {
        const response = await fetch(
            `${API_URL}/blockchain/allowance?owner=${userAddress}&spender=${tokenAddress}&amount=${amount}`
        );
        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                needsApproval: true,
                error: result.error || 'Failed to check allowance'
            };
        }

        return result;

    } catch (error) {
        console.error('[GameEscrow API] Error:', error);
        return {
            success: false,
            needsApproval: true,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Approve token spending for GameEscrow contract
 */
export async function approveTokenForEscrow(
    tokenAddress: string,
    amount: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        console.log('[GameEscrow API] Approving token spending...', { tokenAddress, amount });

        const authToken = getAuthToken();
        if (!authToken) {
            throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch(`${API_URL}/blockchain/erc20-approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ tokenAddress, amount })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[GameEscrow API] API error:', result);
            return {
                success: false,
                error: result.error || 'Failed to approve token'
            };
        }

        console.log('[GameEscrow API] ✅ Token approved successfully');
        return result;

    } catch (error) {
        console.error('[GameEscrow API] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Export contract addresses and config
export const CONTRACTS = {
    GAME_ESCROW_ADDRESS,
    USDC_ADDRESS,
    CHAIN_ID
};

// Export ABIs
export { GameEscrowABI, ERC20ABI };

// Export the module for external use (Scratch GUI, test page, etc.)
if (typeof window !== 'undefined') {
    (window as any).GameEscrowAPI = {
        createEscrowGame,
        joinEscrowGame,
        reportGameResult,
        cancelEscrowGame,
        getEscrowGameDetails,
        getPlayerInfo,
        checkTokenAllowance,
        approveTokenForEscrow,
        CONTRACTS,
        GameMode
    };
}
