/**
 * Game Service
 * Handles game-related operations including result reporting and prize distribution
 */

import { gameEscrowClient } from "../../lib/blockchain/gameEscrow";
import roomService from "../rooms/room.service";
import { ActivityService } from "../activity/activity.service";

const activityService = new ActivityService();

export interface GameResultDto {
    roomId: string;
    winnerUserId: string;
    source?: string;
}

export interface GameResultResponse {
    success: boolean;
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: string;
    error?: string;
}

class GameService {
    /**
     * Handle game result and distribute prizes
     * Called by VM server when a game ends
     */
    async handleGameResult(data: GameResultDto): Promise<GameResultResponse> {
        try {
            const room = await roomService.getRoomById(data.roomId);

            if (!room) {
                return { success: false, error: "Room not found" };
            }

            // Get winner's wallet address
            const winner = room.players?.find(p => p.userId === data.winnerUserId);
            const winnerWallet = winner?.user?.walletAddress;

            if (!winnerWallet) {
                return { success: false, error: "Winner wallet address not found" };
            }

            // If room has blockchain game, distribute prizes
            if (room.blockchainGameId) {
                const gameId = parseInt(room.blockchainGameId);

                console.log(`[GameService] Distributing prizes for game ${gameId} to winner ${winnerWallet}`);

                const result = await gameEscrowClient.reportGameResult(gameId, [winnerWallet]);

                if (result.success) {
                    console.log(`[GameService] Prizes distributed for game ${gameId}, tx: ${result.txHash}`);

                    // Mark room as completed with winner
                    await roomService.completeGame(data.roomId, data.winnerUserId);

                    // Log WIN_GAME activity for winner (for earnings tracking)
                    // Use roomId as targetId so the room/project data can be enriched
                    try {
                        await activityService.trackActivity(
                            data.winnerUserId,
                            'WIN_GAME',
                            data.roomId,
                            'room',
                            {
                                projectId: room.projectId,
                                gameId: gameId,
                                txHash: result.txHash,
                                prizeAmount: room.entryFee,
                                tokenSymbol: room.tokenSymbol,
                            }
                        );
                        console.log(`[GameService] ✅ Logged WIN_GAME activity for user ${data.winnerUserId.substring(0, 8)} on room ${data.roomId.substring(0, 8)}`);
                    } catch (activityError: any) {
                        console.error(`[GameService] ⚠️  Failed to log WIN_GAME activity:`, activityError.message);
                        // Don't fail the entire operation if activity logging fails
                    }

                    // Log LOSE_GAME activity for all other players (losers)
                    const loserIds = room.players
                        ?.filter(p => p.userId !== data.winnerUserId)
                        .map(p => p.userId) || [];

                    for (const loserId of loserIds) {
                        try {
                            await activityService.trackActivity(
                                loserId,
                                'LOSE_GAME',
                                data.roomId,
                                'room',
                                {
                                    projectId: room.projectId,
                                    gameId: gameId,
                                    txHash: result.txHash,
                                    tokenSymbol: room.tokenSymbol,
                                }
                            );
                            console.log(`[GameService] ✅ Logged LOSE_GAME activity for user ${loserId.substring(0, 8)} on room ${data.roomId.substring(0, 8)}`);
                        } catch (activityError: any) {
                            console.error(`[GameService] ⚠️  Failed to log LOSE_GAME activity:`, activityError.message);
                        }
                    }

                    return {
                        success: true,
                        transactionHash: result.txHash,
                        blockNumber: result.receipt?.blockNumber,
                        gasUsed: result.receipt?.gasUsed,
                    };
                } else {
                    console.error(`[GameService] Failed to distribute prizes: ${result.error}`);
                    return { success: false, error: result.error };
                }
            }

            // No blockchain game, just mark as completed with winner
            await roomService.completeGame(data.roomId, data.winnerUserId);
            return { success: true };
        } catch (error: any) {
            console.error(`[GameService] Error handling game result:`, error);
            return {
                success: false,
                error: error.message || "Failed to handle game result",
            };
        }
    }
}

export default new GameService();
