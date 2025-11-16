/**
 * GameEscrow Contract Client
 *
 * Provides methods to interact with the GameEscrow smart contract
 */

import { ethers } from "ethers";
import { blockchainConfig } from "./config";
import gameEscrowABI from "./gameEscrowABI.json";

export enum GameMode {
    WinnerTakesAll = 0,
    TeamBattle = 1,
    FreeForAll = 2,
    ScoreBased = 3,
}

export enum GameStatus {
    Waiting = 0,
    Active = 1,
    Finished = 2,
    Cancelled = 3,
    Emergency = 4,
}

export interface CreateGameParams {
    paymentToken: string; // ERC20 token address
    mode: GameMode;
    entryFee: string; // In wei
    maxPlayers: number;
    numTeams: number;
    timeLimit: number; // In seconds
    creatorCommission: number; // Basis points (e.g., 500 = 5%)
    platformCommission: number; // Basis points (e.g., 200 = 2%)
}

export interface GameData {
    creator: string;
    token: string;
    mode: GameMode;
    entryFee: string;
    maxPlayers: number;
    numTeams: number;
    status: GameStatus;
    players: string[];
    prizePool: string;
    creatorCommission: number;
    platformCommission: number;
    startTime: number;
    gameHash: string;
}

class GameEscrowClient {
    private provider: ethers.JsonRpcProvider;
    private contract!: ethers.Contract;
    private wallet: ethers.Wallet | null = null;

    constructor() {
        // Setup provider
        this.provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);

        // Setup contract (read-only initially)
        this.contract = new ethers.Contract(
            blockchainConfig.gameEscrowAddress,
            gameEscrowABI,
            this.provider
        );

        // Setup wallet for writing (if private key is available)
        if (blockchainConfig.oraclePrivateKey) {
            this.wallet = new ethers.Wallet(
                blockchainConfig.oraclePrivateKey,
                this.provider
            );
            // Create contract instance with signer for write operations
            this.contract = new ethers.Contract(
                blockchainConfig.gameEscrowAddress,
                gameEscrowABI,
                this.wallet
            );
        }
    }

    /**
     * Create a new game on the blockchain
     */
    async createGame(params: CreateGameParams): Promise<{
        success: boolean;
        gameId?: number;
        txHash?: string;
        error?: string;
    }> {
        try {
            console.log("[GameEscrow] createGame called with params:", params);
            console.log("[GameEscrow] Contract address:", this.contract.target);
            console.log("[GameEscrow] Wallet address:", this.wallet?.address);
            console.log("[GameEscrow] Has createGame function:", typeof this.contract?.createGame);

            if (!this.wallet) {
                return {
                    success: false,
                    error: "Oracle wallet not configured",
                };
            }
            if (!this.contract?.createGame) {
                console.error("[GameEscrow] Contract methods available:", Object.keys(this.contract).filter(k => typeof this.contract[k] === 'function'));
                return {
                    success: false,
                    error: "No create game function found",
                };
            }

            // Convert entry fee to proper units (USDC has 6 decimals)
            const entryFeeWei = ethers.parseUnits(params.entryFee, 6);

            console.log("[GameEscrow] Calling createGame with:", {
                paymentToken: params.paymentToken,
                mode: params.mode,
                entryFee: params.entryFee,
                entryFeeWei: entryFeeWei.toString(),
                maxPlayers: params.maxPlayers,
                numTeams: params.numTeams,
                timeLimit: params.timeLimit,
                creatorCommission: params.creatorCommission,
                platformCommission: params.platformCommission,
            });

            const tx = await this.contract.createGame(
                params.paymentToken,
                params.mode,
                entryFeeWei,
                params.maxPlayers,
                params.numTeams,
                params.timeLimit,
                params.creatorCommission,
                params.platformCommission,
                {
                    gasLimit: blockchainConfig.gasLimit,
                }
            );

            console.log("[GameEscrow] Transaction sent:", tx.hash);

            const receipt = await tx.wait();

            // Find GameCreated event to get the game ID
            const event = receipt.logs.find((log: any) => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed?.name === "GameCreated";
                } catch {
                    return false;
                }
            });

            let gameId: number | undefined;
            if (event) {
                const parsed = this.contract.interface.parseLog(event);
                gameId = Number(parsed?.args[0]); // First argument is gameId
            }

            return {
                success: true,
                gameId,
                txHash: receipt.hash,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to create game on blockchain",
            };
        }
    }

    /**
     * Get game data from the blockchain
     */
    async getGame(
        gameId: number
    ): Promise<{ success: boolean; data?: GameData; error?: string }> {
        try {
            if (!this.contract?.getGame) {
                return {
                    success: false,
                    error: "No getGame function found",
                };
            }
            const game = await this.contract.getGame(gameId);

            return {
                success: true,
                data: {
                    creator: game[0],
                    token: game[1],
                    mode: game[2],
                    entryFee: game[3].toString(),
                    maxPlayers: Number(game[4]),
                    numTeams: Number(game[5]),
                    status: game[6],
                    players: game[7],
                    prizePool: game[8].toString(),
                    creatorCommission: Number(game[9]),
                    platformCommission: Number(game[10]),
                    startTime: Number(game[11]),
                    gameHash: game[12],
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to get game from blockchain",
            };
        }
    }

    /**
     * Report game result and distribute prizes (ORACLE_ROLE only)
     */
    async reportGameResult(
        gameId: number,
        winners: string[]
    ): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
        receipt?: any;
    }> {
        try {
            if (!this.wallet) {
                return {
                    success: false,
                    error: "Oracle wallet not configured",
                };
            }
            if (!this.contract?.reportGameResult) {
                return {
                    success: false,
                    error: "No reportGameResult function found",
                };
            }
            const tx = await this.contract.reportGameResult(gameId, winners, {
                gasLimit: blockchainConfig.gasLimit,
            });

            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash,
                receipt: {
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    status: receipt.status,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error:
                    error.message ||
                    "Failed to report game result on blockchain",
            };
        }
    }

    /**
     * Join a game with entry fee (oracle calls this, contract pulls tokens from oracle wallet)
     * NOTE: The oracle wallet must have approved the tokens to the contract first,
     * or the contract must pull from oracle's balance.
     */
    async joinGame(params: {
        gameId: number;
        teamId: number;
    }): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }> {
        try {
            if (!this.wallet) {
                return {
                    success: false,
                    error: "Oracle wallet not configured",
                };
            }
            if (!this.contract?.joinGame) {
                return {
                    success: false,
                    error: "No joinGame function found",
                };
            }

            console.log("[GameEscrow] Calling joinGame with:", {
                gameId: params.gameId,
                teamId: params.teamId,
                walletAddress: this.wallet.address,
            });

            const tx = await this.contract.joinGame(
                params.gameId,
                params.teamId,
                {
                    gasLimit: blockchainConfig.gasLimit,
                }
            );

            const receipt = await tx.wait();

            console.log("[GameEscrow] Successfully joined game, tx:", receipt.hash);

            return {
                success: true,
                txHash: receipt.hash,
            };
        } catch (error: any) {
            console.error("[GameEscrow] Failed to join game:", error);
            return {
                success: false,
                error: error.message || "Failed to join game",
            };
        }
    }

    /**
     * Get contract address
     */
    getContractAddress(): string {
        return blockchainConfig.gameEscrowAddress;
    }

    /**
     * Get current block number
     */
    async getBlockNumber(): Promise<number> {
        return await this.provider.getBlockNumber();
    }
}

// Export singleton instance
export const gameEscrowClient: any = new GameEscrowClient();
