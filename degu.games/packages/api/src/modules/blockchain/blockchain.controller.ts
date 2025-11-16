import { Request, Response } from "express";
import blockchainService from "./blockchain.service";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        walletAddress: string;
    };
}

export class BlockchainController {
    /**
     * Get token balance
     */
    async getBalance(req: Request, res: Response) {
        try {
            const { address } = req.params;

            if (!address) {
                return res.status(400).json({
                    success: false,
                    error: "Address is required",
                });
            }

            const result = await blockchainService.getBalance(address);
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get balance error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get token info
     */
    async getTokenInfo(req: Request, res: Response) {
        try {
            const result = await blockchainService.getTokenInfo();
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get token info error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Check if can claim tokens
     */
    async canClaimTokens(req: Request, res: Response) {
        try {
            const { address } = req.params;

            if (!address) {
                return res.status(400).json({
                    success: false,
                    error: "Address is required",
                });
            }

            const result = await blockchainService.canClaimTokens(address);
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Can claim tokens error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Claim free tokens
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async claimFreeTokens(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const result = await blockchainService.claimFreeTokens(req.user.userId);
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Claim free tokens error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Transfer tokens
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async transfer(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { to, amount } = req.body;

            if (!to || !amount) {
                return res.status(400).json({
                    success: false,
                    error: "Recipient address and amount are required",
                });
            }

            const result = await blockchainService.transfer(req.user.userId, to, amount);
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Transfer error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Approve spender
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async approve(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { spender, amount } = req.body;

            if (!spender || !amount) {
                return res.status(400).json({
                    success: false,
                    error: "Spender address and amount are required",
                });
            }

            const result = await blockchainService.approve(
                req.user.userId,
                spender,
                amount
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Approve error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get allowance
     */
    async getAllowance(req: Request, res: Response) {
        try {
            const { owner, spender } = req.query;

            if (!owner || !spender) {
                return res.status(400).json({
                    success: false,
                    error: "Owner and spender addresses are required",
                });
            }

            const result = await blockchainService.getAllowance(
                owner as string,
                spender as string
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get allowance error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Burn tokens
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async burn(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { amount } = req.body;

            if (!amount) {
                return res.status(400).json({
                    success: false,
                    error: "Amount is required",
                });
            }

            const result = await blockchainService.burn(req.user.userId, amount);
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Burn error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get last claim timestamp
     */
    async getLastClaim(req: Request, res: Response) {
        try {
            const { address } = req.params;

            if (!address) {
                return res.status(400).json({
                    success: false,
                    error: "Address is required",
                });
            }

            const result = await blockchainService.getLastClaim(address);
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get last claim error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get native token (WND) balance for gas fees
     */
    async getNativeBalance(req: Request, res: Response) {
        try {
            const { address } = req.params;

            if (!address) {
                return res.status(400).json({
                    success: false,
                    error: "Address is required",
                });
            }

            const result = await blockchainService.getNativeBalance(address);
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get native balance error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // ==================== BETTING CONTRACT METHODS ====================

    /**
     * Create a new betting game
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async createBettingGame(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { tokenAddress, betAmount, minPlayers, maxPlayers } = req.body;

            if (!tokenAddress || !betAmount || !minPlayers || !maxPlayers) {
                return res.status(400).json({
                    success: false,
                    error: "All fields are required (tokenAddress, betAmount, minPlayers, maxPlayers)",
                });
            }

            const result = await blockchainService.createBettingGame(
                req.user.userId,
                tokenAddress,
                betAmount,
                minPlayers,
                maxPlayers
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Create betting game error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Join a betting game
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async joinBettingGame(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { gameId } = req.body;

            if (gameId === undefined) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID is required",
                });
            }

            const result = await blockchainService.joinBettingGame(
                req.user.userId,
                gameId
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Join betting game error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Start a betting game
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async startBettingGame(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { gameId } = req.body;

            if (gameId === undefined) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID is required",
                });
            }

            const result = await blockchainService.startBettingGame(
                req.user.userId,
                gameId
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Start betting game error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Select winners for a betting game
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async selectWinners(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { gameId, winners } = req.body;

            if (gameId === undefined || !winners || !Array.isArray(winners)) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID and winners array are required",
                });
            }

            const result = await blockchainService.selectWinners(
                req.user.userId,
                gameId,
                winners
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Select winners error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Claim prize from a betting game
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async claimBettingPrize(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { gameId } = req.body;

            if (gameId === undefined) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID is required",
                });
            }

            const result = await blockchainService.claimBettingPrize(
                req.user.userId,
                gameId
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Claim betting prize error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Cancel a betting game
     * Uses private key from temp file (MVP/Hackathon only)
     */
    async cancelBettingGame(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { gameId } = req.body;

            if (gameId === undefined) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID is required",
                });
            }

            const result = await blockchainService.cancelBettingGame(
                req.user.userId,
                gameId
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Cancel betting game error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get betting game details
     */
    async getBettingGameDetails(req: Request, res: Response) {
        try {
            const { gameId } = req.params;

            if (!gameId) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID is required",
                });
            }

            const result = await blockchainService.getBettingGameDetails(
                Number(gameId)
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get betting game details error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Check if player has joined a game
     */
    async hasPlayerJoinedGame(req: Request, res: Response) {
        try {
            const { gameId, address } = req.query;

            if (!gameId || !address) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID and address are required",
                });
            }

            const result = await blockchainService.hasPlayerJoinedGame(
                Number(gameId),
                address as string
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Check player joined error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get total number of betting games
     */
    async getTotalBettingGames(req: Request, res: Response) {
        try {
            const result = await blockchainService.getTotalBettingGames();
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get total betting games error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get betting contract address
     */
    async getBettingContractAddress(req: Request, res: Response) {
        try {
            const address = blockchainService.getBettingContractAddress();
            return res.json({ success: true, data: { address } });
        } catch (error: any) {
            console.error("Get betting contract address error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // ==================== GAME ESCROW CONTRACT METHODS (BASE TESTNET) ====================

    /**
     * Get ERC20 token balance (Base testnet)
     */
    async getERC20Balance(req: Request, res: Response) {
        try {
            const { address, token } = req.query;

            if (!address || !token) {
                return res.status(400).json({
                    success: false,
                    error: "Address and token address are required",
                });
            }

            const result = await blockchainService.getERC20Balance(
                address as string,
                token as string
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get ERC20 balance error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Approve ERC20 token spending (Base testnet)
     */
    async approveERC20(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { tokenAddress, spender, amount } = req.body;

            if (!tokenAddress || !spender || !amount) {
                return res.status(400).json({
                    success: false,
                    error: "Token address, spender address, and amount are required",
                });
            }

            const result = await blockchainService.approveERC20(
                req.user.userId,
                tokenAddress,
                spender,
                amount
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Approve ERC20 error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Create a GameEscrow game (Base testnet)
     */
    async createGameEscrowGame(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const {
                tokenAddress,
                entryFee,
                minPlayers,
                maxPlayers,
                gameMode = 0,
                teams = 0,
                prizePercentages = [100],
            } = req.body;

            if (!tokenAddress || !entryFee || !minPlayers || !maxPlayers) {
                return res.status(400).json({
                    success: false,
                    error: "Token address, entry fee, minPlayers, and maxPlayers are required",
                });
            }

            const result = await blockchainService.createGameEscrowGame(
                req.user.userId,
                tokenAddress,
                entryFee,
                minPlayers,
                maxPlayers,
                gameMode,
                teams,
                prizePercentages
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Create GameEscrow game error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Join a GameEscrow game (Base testnet)
     */
    async joinGameEscrowGame(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { blockchainGameId, teamId = 0 } = req.body;

            if (blockchainGameId === undefined) {
                return res.status(400).json({
                    success: false,
                    error: "Blockchain game ID is required",
                });
            }

            const result = await blockchainService.joinGameEscrowGame(
                req.user.userId,
                Number(blockchainGameId),
                teamId
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Join GameEscrow game error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get GameEscrow game details (Base testnet)
     */
    async getGameEscrowDetails(req: Request, res: Response) {
        try {
            const { gameId } = req.params;

            if (!gameId) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID is required",
                });
            }

            const result = await blockchainService.getGameEscrowDetails(
                Number(gameId)
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get GameEscrow details error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get player info in a GameEscrow game
     */
    async getGameEscrowPlayerInfo(req: Request, res: Response) {
        try {
            const { gameId, address } = req.query;

            if (!gameId || !address) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID and address are required",
                });
            }

            const result = await blockchainService.getGameEscrowPlayerInfo(
                Number(gameId),
                address as string
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Get GameEscrow player info error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Cancel a GameEscrow game
     */
    async cancelGameEscrowGame(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { gameId } = req.body;

            if (gameId === undefined) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID is required",
                });
            }

            const result = await blockchainService.cancelGameEscrowGame(
                req.user.userId,
                Number(gameId)
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Cancel GameEscrow game error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Report game results (Oracle - requires ORACLE_ROLE)
     */
    async reportGameEscrowResult(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }

            const { gameId, winners, scores, teamAssignments } = req.body;

            if (gameId === undefined || !winners || !scores || !teamAssignments) {
                return res.status(400).json({
                    success: false,
                    error: "Game ID, winners, scores, and team assignments are required",
                });
            }

            const result = await blockchainService.reportGameEscrowResult(
                Number(gameId),
                winners,
                scores,
                teamAssignments
            );
            return res.json({ success: true, data: result });
        } catch (error: any) {
            console.error("Report GameEscrow result error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get GameEscrow contract address
     */
    async getGameEscrowAddress(req: Request, res: Response) {
        try {
            const address = blockchainService.getGameEscrowAddress();
            return res.json({ success: true, data: { address } });
        } catch (error: any) {
            console.error("Get GameEscrow address error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get USDC contract address (Base testnet)
     */
    async getUSDCAddress(req: Request, res: Response) {
        try {
            const address = blockchainService.getUSDCAddress();
            return res.json({ success: true, data: { address } });
        } catch (error: any) {
            console.error("Get USDC address error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
}

export default new BlockchainController();
