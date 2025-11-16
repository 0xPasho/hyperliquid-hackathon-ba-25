import { Request, Response } from "express";
import gameService from "./game.service";

class GameController {
    /**
     * POST /api/v1/game/result
     * Handle game result and distribute prizes
     */
    async reportGameResult(req: Request, res: Response): Promise<void> {
        try {
            const { roomId, winnerUserId, source } = req.body;

            if (!roomId || !winnerUserId) {
                res.status(400).json({
                    success: false,
                    error: "roomId and winnerUserId are required",
                });
                return;
            }

            const result = await gameService.handleGameResult({
                roomId,
                winnerUserId,
                source,
            });

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        transactionHash: result.transactionHash,
                        blockNumber: result.blockNumber,
                        gasUsed: result.gasUsed,
                    },
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error || "Failed to handle game result",
                });
            }
        } catch (error: any) {
            console.error("[GameController] Error reporting game result:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Internal server error",
            });
        }
    }
}

export default new GameController();
