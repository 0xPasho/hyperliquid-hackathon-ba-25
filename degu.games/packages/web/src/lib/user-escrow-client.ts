/**
 * User Escrow Client - Frontend
 * Handles user wallet interactions with GameEscrow contract via Privy
 */

import { encodeFunctionData, parseUnits, formatUnits } from "viem";
import { CONTRACTS } from "./game-escrow-api";
import gameEscrowABI from "./abis/GameEscrow.json";

const ERC20_ABI = [
    {
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

export interface UserEscrowClient {
    address: string;
    sendTransaction: (params: {
        to: string;
        data: string;
        value?: bigint;
    }) => Promise<string>;
    readContract: (params: {
        address: string;
        abi: any;
        functionName: string;
        args?: any[];
    }) => Promise<any>;
}

/**
 * Check if user has approved USDC spending for GameEscrow
 */
export async function checkUSDCAllowance(
    walletClient: UserEscrowClient,
    userAddress: string,
    requiredAmount: string,
    tokenAddress: string,
    escrowAddress: string
): Promise<{ hasAllowance: boolean; currentAllowance: string }> {
    try {
        const allowance = await walletClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [userAddress, escrowAddress],
        });

        const requiredAmountBigInt = parseUnits(requiredAmount, 6);
        const hasAllowance = BigInt(allowance) >= requiredAmountBigInt;

        return {
            hasAllowance,
            currentAllowance: formatUnits(BigInt(allowance), 6),
        };
    } catch (error) {
        console.error("[UserEscrow] Error checking allowance:", error);
        return { hasAllowance: false, currentAllowance: "0" };
    }
}

/**
 * Check user's USDC balance
 */
export async function checkUSDCBalance(
    walletClient: UserEscrowClient,
    userAddress: string,
    tokenAddress: string
): Promise<string> {
    try {
        console.log("[UserEscrow] Checking balance:", {
            userAddress,
            tokenAddress,
            walletClientAddress: walletClient.address
        });

        const balance = await walletClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [userAddress],
        });

        console.log("[UserEscrow] Raw balance:", balance);
        const formatted = formatUnits(BigInt(balance), 6);
        console.log("[UserEscrow] Formatted balance:", formatted);

        return formatted;
    } catch (error) {
        console.error("[UserEscrow] Error checking balance:", error);
        console.error("[UserEscrow] Error details:", {
            userAddress,
            tokenAddress,
            errorMessage: error instanceof Error ? error.message : String(error)
        });
        return "0";
    }
}

/**
 * Approve USDC spending for GameEscrow (one-time setup)
 */
export async function approveUSDC(
    walletClient: UserEscrowClient,
    amount: string,
    tokenAddress: string,
    escrowAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        console.log("[UserEscrow] Approving USDC...", { amount });

        // Approve a large amount so user doesn't need to approve every time
        const approvalAmount = parseUnits("1000000", 6); // 1M USDC approval

        const data = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [escrowAddress, approvalAmount],
        });

        const txHash = await walletClient.sendTransaction({
            to: tokenAddress,
            data,
        });

        console.log("[UserEscrow] USDC approved, tx:", txHash);

        return {
            success: true,
            txHash,
        };
    } catch (error: any) {
        console.error("[UserEscrow] Approval error:", error);
        return {
            success: false,
            error: error.message || "Failed to approve USDC",
        };
    }
}

/**
 * Join game - User pays entry fee from their wallet
 */
export async function joinGameWithUserWallet(
    walletClient: UserEscrowClient,
    gameId: number,
    escrowAddress: string,
    teamId: number = 0
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        console.log("[UserEscrow] Joining game...", { gameId, teamId });

        const data = encodeFunctionData({
            abi: gameEscrowABI as any,
            functionName: "joinGame",
            args: [BigInt(gameId), BigInt(teamId)],
        });

        const txHash = await walletClient.sendTransaction({
            to: escrowAddress,
            data,
        });

        console.log("[UserEscrow] Joined game, tx:", txHash);

        return {
            success: true,
            txHash,
        };
    } catch (error: any) {
        console.error("[UserEscrow] Join game error:", error);
        return {
            success: false,
            error: error.message || "Failed to join game",
        };
    }
}

/**
 * Complete flow: Check allowance, approve if needed, then join game
 */
export async function payAndJoinGame(
    walletClient: UserEscrowClient,
    userAddress: string,
    gameId: number,
    entryFee: string,
    tokenAddress: string,
    escrowAddress: string,
    teamId: number = 0,
    onProgress?: (step: string) => void
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        // Step 1: Check if user has enough USDC
        onProgress?.("Checking USDC balance...");
        const balance = await checkUSDCBalance(walletClient, userAddress, tokenAddress);
        const balanceNum = parseFloat(balance);
        const entryFeeNum = parseFloat(entryFee);

        if (balanceNum < entryFeeNum) {
            return {
                success: false,
                error: `Insufficient USDC balance. You have ${balance} USDC but need ${entryFee} USDC`,
            };
        }

        // Step 2: Check allowance
        onProgress?.("Checking USDC approval...");
        const { hasAllowance } = await checkUSDCAllowance(
            walletClient,
            userAddress,
            entryFee,
            tokenAddress,
            escrowAddress
        );

        // Step 3: Approve if needed
        if (!hasAllowance) {
            onProgress?.("Approving USDC (one-time)...");
            const approvalResult = await approveUSDC(walletClient, entryFee, tokenAddress, escrowAddress);

            if (!approvalResult.success) {
                return {
                    success: false,
                    error: approvalResult.error,
                };
            }

            // Wait a bit for approval to be mined
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Step 4: Join game (pays entry fee)
        onProgress?.("Paying entry fee and joining game...");
        const joinResult = await joinGameWithUserWallet(
            walletClient,
            gameId,
            escrowAddress,
            teamId
        );

        if (!joinResult.success) {
            return {
                success: false,
                error: joinResult.error,
            };
        }

        return {
            success: true,
            txHash: joinResult.txHash,
        };
    } catch (error: any) {
        console.error("[UserEscrow] Pay and join error:", error);
        return {
            success: false,
            error: error.message || "Failed to pay and join game",
        };
    }
}

/**
 * Cancel game and refund all players (creator only)
 * This is called from the frontend when a user wants to cancel their game
 */
export async function cancelGameAndRefund(
    walletClient: UserEscrowClient,
    gameId: string,
    escrowAddress: string,
    reason: string = "Game cancelled by creator"
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        console.log("[UserEscrow] Cancelling game...", { gameId, reason });

        const data = encodeFunctionData({
            abi: gameEscrowABI as any,
            functionName: "cancelGame",
            args: [BigInt(gameId), reason],
        });

        const txHash = await walletClient.sendTransaction({
            to: escrowAddress,
            data,
        });

        console.log("[UserEscrow] Game cancelled, tx:", txHash);

        return {
            success: true,
            txHash,
        };
    } catch (error: any) {
        console.error("[UserEscrow] Cancel game error:", error);
        return {
            success: false,
            error: error.message || "Failed to cancel game",
        };
    }
}
