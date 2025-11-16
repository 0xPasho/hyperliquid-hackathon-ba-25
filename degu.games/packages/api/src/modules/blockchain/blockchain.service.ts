import { ethers } from "ethers";
import DeguTokenAbi from "./DeguToken.abi.json";
import SimpleBettingAbi from "./SimpleBetting.abi.json";
import GameEscrowAbi from "../../contracts/abi/GameEscrow.json";
import * as fs from "fs";
import * as path from "path";

/**
 * Blockchain Service - Handles all smart contract interactions
 * MVP/Hackathon: Private keys stored in temp/{userId}.key files
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private baseProvider: ethers.JsonRpcProvider;
  private deguTokenAddress: string;
  private bettingAddress: string;
  private gameEscrowAddress: string;
  private usdcAddress: string;

  constructor() {
    // Westend Asset Hub (PolkaVM) testnet RPC
    const rpcUrl = process.env.POLKAVM_RPC_URL || "https://westend-asset-hub-eth-rpc.polkadot.io";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Base Sepolia testnet RPC
    const baseRpcUrl = process.env.BASE_TESTNET_RPC || "https://sepolia.base.org";
    this.baseProvider = new ethers.JsonRpcProvider(baseRpcUrl);

    // Deployed contract addresses
    this.deguTokenAddress = process.env.DEGU_TOKEN_ADDRESS || "0xFee95Ee1E03bE4832E6F318d94243ee5cbFDc2B4";
    this.bettingAddress = process.env.BETTING_CONTRACT_ADDRESS || "";
    this.gameEscrowAddress = process.env.GAME_ESCROW_ADDRESS || "";
    this.usdcAddress = process.env.USDC_BASE_TESTNET || "0xE02E0dEa9F850D88E1329550D9FC8D98aF541f55";
  }

  /**
   * Read private key from temp file for a user
   * @param userId - User ID
   * @returns Private key string
   */
  private getPrivateKeyFromFile(userId: string): string {
    const tempDir = path.join(__dirname, "../../../temp");
    const keyPath = path.join(tempDir, `${userId}.key`);

    if (!fs.existsSync(keyPath)) {
      throw new Error(`Private key not found for user. Please connect your wallet first.`);
    }

    const privateKey = fs.readFileSync(keyPath, "utf8").trim();

    if (!privateKey) {
      throw new Error(`Invalid private key for user`);
    }

    return privateKey;
  }

  /**
   * Get DeguToken contract instance with signer
   */
  private getDeguContract(privateKey: string): any {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    return new ethers.Contract(this.deguTokenAddress, DeguTokenAbi, wallet);
  }

  /**
   * Get DeguToken contract instance (read-only)
   */
  private getDeguContractReadOnly(): any {
    return new ethers.Contract(this.deguTokenAddress, DeguTokenAbi, this.provider);
  }

  /**
   * Get SimpleBetting contract instance with signer
   */
  private getBettingContract(privateKey: string): any {
    if (!this.bettingAddress) {
      throw new Error("Betting contract address not configured");
    }
    const wallet = new ethers.Wallet(privateKey, this.provider);
    return new ethers.Contract(this.bettingAddress, SimpleBettingAbi, wallet);
  }

  /**
   * Get SimpleBetting contract instance (read-only)
   */
  private getBettingContractReadOnly(): any {
    if (!this.bettingAddress) {
      throw new Error("Betting contract address not configured");
    }
    return new ethers.Contract(this.bettingAddress, SimpleBettingAbi, this.provider);
  }

  /**
   * FAUCET: Claim free tokens (1000 DEGU)
   * @param userId - User ID
   */
  async claimFreeTokens(userId: string) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getDeguContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);

      // Check if can claim
      const [canClaim, timeUntilNext] = await contract.canClaimTokens(wallet.address);

      if (!canClaim) {
        return {
          success: false,
          error: `Must wait ${timeUntilNext} seconds before claiming again`,
          timeUntilNext: Number(timeUntilNext)
        };
      }

      // Get nonce - use "latest" to get confirmed nonce, then check pending
      const latestNonce = await this.provider.getTransactionCount(wallet.address, "latest");
      const pendingNonce = await this.provider.getTransactionCount(wallet.address, "pending");

      // If pending nonce > latest nonce, there's a stuck transaction
      if (pendingNonce > latestNonce) {
        console.log(`[Blockchain] Stuck transaction detected. Latest: ${latestNonce}, Pending: ${pendingNonce}`);
        throw new Error(`You have a pending transaction (nonce ${latestNonce}). Please wait 1-2 minutes for it to confirm or clear, then try again.`);
      }

      const nonce = latestNonce;

      // Get current gas price and add 20% buffer for PolkaVM
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * BigInt(120)) / BigInt(100) : undefined;

      console.log(`[Blockchain] Sending transaction with nonce ${nonce}, gasPrice: ${gasPrice?.toString()}`);

      // Claim tokens with explicit nonce and gas price
      const tx = await contract.claimFreeTokens({
        nonce,
        gasPrice,
        gasLimit: 100000, // Set explicit gas limit for PolkaVM
      });

      console.log(`[Blockchain] Transaction sent: ${tx.hash}`);

      // Wait for transaction confirmation
      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        claimed: "1000 DEGU"
      };
    } catch (error: any) {
      console.error('[Blockchain] Claim error:', error);

      // Handle specific error codes
      if (error.code === "UNKNOWN_ERROR" && error.error) {
        if (error.error.code === 1012) {
          throw new Error("Transaction temporarily banned by the network. This usually means there's a stuck transaction. Wait 2-3 minutes and try again.");
        }
        if (error.error.code === 1013) {
          throw new Error("Transaction already pending. Please wait for it to confirm.");
        }
      }

      throw new Error(`Failed to claim tokens: ${error.message}`);
    }
  }

  /**
   * Check if address can claim tokens
   */
  async canClaimTokens(address: string) {
    try {
      const contract = this.getDeguContractReadOnly();
      const [canClaim, timeUntilNext] = await contract.canClaimTokens(address);

      return {
        canClaim,
        timeUntilNext: Number(timeUntilNext),
        timeUntilNextFormatted: this.formatTime(Number(timeUntilNext))
      };
    } catch (error: any) {
      throw new Error(`Failed to check claim status: ${error.message}`);
    }
  }

  /**
   * Get token balance
   */
  async getBalance(address: string) {
    try {
      const contract = this.getDeguContractReadOnly();
      const balance = await contract.balanceOf(address);

      return {
        address,
        balance: ethers.formatEther(balance),
        balanceWei: balance.toString()
      };
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get token info
   */
  async getTokenInfo() {
    try {
      const contract = this.getDeguContractReadOnly();

      const [name, symbol, decimals, totalSupply, maxSupply, faucetAmount, faucetCooldown] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.MAX_SUPPLY(),
        contract.FAUCET_AMOUNT(),
        contract.FAUCET_COOLDOWN()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatEther(totalSupply),
        maxSupply: ethers.formatEther(maxSupply),
        faucetAmount: ethers.formatEther(faucetAmount),
        faucetCooldown: Number(faucetCooldown),
        faucetCooldownFormatted: this.formatTime(Number(faucetCooldown)),
        contractAddress: this.deguTokenAddress
      };
    } catch (error: any) {
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  /**
   * Transfer tokens
   * @param userId - User ID
   */
  async transfer(userId: string, to: string, amount: string) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getDeguContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const amountWei = ethers.parseEther(amount);

      // Get the latest nonce from the network
      const nonce = await this.provider.getTransactionCount(wallet.address, "pending");

      const tx = await contract.transfer(to, amountWei, { nonce });
      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        to,
        amount
      };
    } catch (error: any) {
      // Handle duplicate transaction error
      if (error.code === "UNKNOWN_ERROR" && error.error?.code === 1013) {
        throw new Error("Transaction already pending. Please wait for it to confirm.");
      }
      throw new Error(`Failed to transfer: ${error.message}`);
    }
  }

  /**
   * Approve spender
   * @param userId - User ID
   */
  async approve(userId: string, spender: string, amount: string) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getDeguContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const amountWei = ethers.parseEther(amount);

      // Get the latest nonce from the network
      const nonce = await this.provider.getTransactionCount(wallet.address, "pending");

      const tx = await contract.approve(spender, amountWei, { nonce });
      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        spender,
        amount
      };
    } catch (error: any) {
      // Handle duplicate transaction error
      if (error.code === "UNKNOWN_ERROR" && error.error?.code === 1013) {
        throw new Error("Transaction already pending. Please wait for it to confirm.");
      }
      throw new Error(`Failed to approve: ${error.message}`);
    }
  }

  /**
   * Get allowance
   */
  async getAllowance(owner: string, spender: string) {
    try {
      const contract = this.getDeguContractReadOnly();
      const allowance = await contract.allowance(owner, spender);

      return {
        owner,
        spender,
        allowance: ethers.formatEther(allowance),
        allowanceWei: allowance.toString()
      };
    } catch (error: any) {
      throw new Error(`Failed to get allowance: ${error.message}`);
    }
  }

  /**
   * Burn tokens
   * @param userId - User ID
   */
  async burn(userId: string, amount: string) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getDeguContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const amountWei = ethers.parseEther(amount);

      // Get the latest nonce from the network
      const nonce = await this.provider.getTransactionCount(wallet.address, "pending");

      const tx = await contract.burn(amountWei, { nonce });
      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        burned: amount
      };
    } catch (error: any) {
      // Handle duplicate transaction error
      if (error.code === "UNKNOWN_ERROR" && error.error?.code === 1013) {
        throw new Error("Transaction already pending. Please wait for it to confirm.");
      }
      throw new Error(`Failed to burn: ${error.message}`);
    }
  }

  /**
   * Get last claim timestamp
   */
  async getLastClaim(address: string) {
    try {
      const contract = this.getDeguContractReadOnly();
      const lastClaim = await contract.lastClaim(address);
      const timestamp = Number(lastClaim);

      return {
        address,
        lastClaimTimestamp: timestamp,
        lastClaimDate: timestamp > 0 ? new Date(timestamp * 1000).toISOString() : "Never claimed"
      };
    } catch (error: any) {
      throw new Error(`Failed to get last claim: ${error.message}`);
    }
  }

  /**
   * Get wallet address from private key
   */
  getAddressFromPrivateKey(privateKey: string): string {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  }

  /**
   * Get native token (WND) balance for gas fees
   */
  async getNativeBalance(address: string) {
    try {
      const balance = await this.provider.getBalance(address);

      return {
        address,
        balance: ethers.formatEther(balance),
        balanceWei: balance.toString(),
        symbol: "WND"
      };
    } catch (error: any) {
      throw new Error(`Failed to get native balance: ${error.message}`);
    }
  }

  /**
   * Helper: Format time in seconds to human readable
   */
  private formatTime(seconds: number): string {
    if (seconds === 0) return "Can claim now";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  // ==================== BETTING CONTRACT METHODS ====================

  /**
   * Create a new betting game
   * @param userId - User ID
   */
  async createBettingGame(
    userId: string,
    tokenAddress: string,
    betAmount: string,
    minPlayers: number,
    maxPlayers: number
  ) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getBettingContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const amountWei = ethers.parseEther(betAmount);

      // Check for stuck transactions (same fix as claimFreeTokens)
      const latestNonce = await this.provider.getTransactionCount(wallet.address, "latest");
      const pendingNonce = await this.provider.getTransactionCount(wallet.address, "pending");

      if (pendingNonce > latestNonce) {
        console.log(`[Blockchain] Stuck transaction detected. Latest: ${latestNonce}, Pending: ${pendingNonce}`);
        throw new Error(`You have a pending transaction (nonce ${latestNonce}). Please wait 1-2 minutes for it to confirm or clear, then try again.`);
      }

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * BigInt(120)) / BigInt(100) : undefined;

      console.log(`[Blockchain] Creating game with nonce ${latestNonce}, gasPrice: ${gasPrice?.toString()}`);

      const tx = await contract.createGame(tokenAddress, amountWei, minPlayers, maxPlayers, {
        nonce: latestNonce,
        gasPrice,
        gasLimit: 200000,
      });

      const receipt = await tx.wait(1);

      // Extract gameId from event
      const event = receipt.logs.find((log: any) => {
        try {
          return contract.interface.parseLog(log)?.name === 'GameCreated';
        } catch {
          return false;
        }
      });

      let gameId = 0;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        gameId = Number(parsed?.args[0] || 0);
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gameId
      };
    } catch (error: any) {
      console.error('[Blockchain] Create game error:', error);

      // Handle specific PolkaVM error codes (same as claimFreeTokens)
      if (error.code === "UNKNOWN_ERROR" && error.error) {
        if (error.error.code === 1012) {
          throw new Error("Transaction temporarily banned by the network. This usually means there's a stuck transaction. Wait 2-3 minutes and try again.");
        }
        if (error.error.code === 1013) {
          throw new Error("Transaction already pending. Please wait for it to confirm.");
        }
      }

      throw new Error(`Failed to create game: ${error.message}`);
    }
  }

  /**
   * Join a betting game
   * @param userId - User ID
   */
  async joinBettingGame(userId: string, gameId: number) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getBettingContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);

      const latestNonce = await this.provider.getTransactionCount(wallet.address, "latest");
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * BigInt(120)) / BigInt(100) : undefined;

      const tx = await contract.joinGame(gameId, {
        nonce: latestNonce,
        gasPrice,
        gasLimit: 200000,
      });

      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error: any) {
      console.error('[Blockchain] Join game error:', error);
      throw new Error(`Failed to join game: ${error.message}`);
    }
  }

  /**
   * Start a betting game (creator only)
   * @param userId - User ID
   */
  async startBettingGame(userId: string, gameId: number) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getBettingContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);

      const latestNonce = await this.provider.getTransactionCount(wallet.address, "latest");
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * BigInt(120)) / BigInt(100) : undefined;

      const tx = await contract.startGame(gameId, {
        nonce: latestNonce,
        gasPrice,
        gasLimit: 150000,
      });

      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error: any) {
      console.error('[Blockchain] Start game error:', error);
      throw new Error(`Failed to start game: ${error.message}`);
    }
  }

  /**
   * Select winners for a betting game (creator only)
   * @param userId - User ID
   */
  async selectWinners(userId: string, gameId: number, winners: string[]) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getBettingContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);

      const latestNonce = await this.provider.getTransactionCount(wallet.address, "latest");
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * BigInt(120)) / BigInt(100) : undefined;

      const tx = await contract.selectWinners(gameId, winners, {
        nonce: latestNonce,
        gasPrice,
        gasLimit: 250000,
      });

      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error: any) {
      console.error('[Blockchain] Select winners error:', error);
      throw new Error(`Failed to select winners: ${error.message}`);
    }
  }

  /**
   * Claim prize from a betting game (winners only)
   * @param userId - User ID
   */
  async claimBettingPrize(userId: string, gameId: number) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getBettingContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);

      const latestNonce = await this.provider.getTransactionCount(wallet.address, "latest");
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * BigInt(120)) / BigInt(100) : undefined;

      const tx = await contract.claimPrize(gameId, {
        nonce: latestNonce,
        gasPrice,
        gasLimit: 200000,
      });

      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error: any) {
      console.error('[Blockchain] Claim prize error:', error);
      throw new Error(`Failed to claim prize: ${error.message}`);
    }
  }

  /**
   * Cancel a betting game (creator only, only if open)
   * @param userId - User ID
   */
  async cancelBettingGame(userId: string, gameId: number) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getBettingContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.provider);

      const latestNonce = await this.provider.getTransactionCount(wallet.address, "latest");
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * BigInt(120)) / BigInt(100) : undefined;

      const tx = await contract.cancelGame(gameId, {
        nonce: latestNonce,
        gasPrice,
        gasLimit: 250000,
      });

      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error: any) {
      console.error('[Blockchain] Cancel game error:', error);
      throw new Error(`Failed to cancel game: ${error.message}`);
    }
  }

  /**
   * Get betting game details
   */
  async getBettingGameDetails(gameId: number) {
    try {
      const contract = this.getBettingContractReadOnly();

      const details = await contract.getGameDetails(gameId);
      const players = await contract.getPlayers(gameId);
      const winners = await contract.getWinners(gameId);

      const statusNames = ['Open', 'InProgress', 'Completed', 'Cancelled'];

      return {
        gameId,
        creator: details[0],
        token: details[1],
        betAmount: ethers.formatEther(details[2]),
        minPlayers: Number(details[3]),
        maxPlayers: Number(details[4]),
        status: statusNames[details[5]] || 'Unknown',
        statusCode: Number(details[5]),
        currentPlayers: Number(details[6]),
        totalPot: ethers.formatEther(details[7]),
        players,
        winners
      };
    } catch (error: any) {
      throw new Error(`Failed to get game details: ${error.message}`);
    }
  }

  /**
   * Check if player has joined a game
   */
  async hasPlayerJoinedGame(gameId: number, playerAddress: string) {
    try {
      const contract = this.getBettingContractReadOnly();
      const hasJoined = await contract.hasPlayerJoined(gameId, playerAddress);

      return { hasJoined };
    } catch (error: any) {
      throw new Error(`Failed to check player status: ${error.message}`);
    }
  }

  /**
   * Check if winner has claimed prize
   */
  async hasWinnerClaimedPrize(gameId: number, winnerAddress: string) {
    try {
      const contract = this.getBettingContractReadOnly();
      const hasClaimed = await contract.hasWinnerClaimed(gameId, winnerAddress);

      return { hasClaimed };
    } catch (error: any) {
      throw new Error(`Failed to check claim status: ${error.message}`);
    }
  }

  /**
   * Get total number of games
   */
  async getTotalBettingGames() {
    try {
      const contract = this.getBettingContractReadOnly();
      const total = await contract.getTotalGames();

      return { totalGames: Number(total) };
    } catch (error: any) {
      throw new Error(`Failed to get total games: ${error.message}`);
    }
  }

  /**
   * Get betting contract address
   */
  getBettingContractAddress(): string {
    return this.bettingAddress;
  }

  // ==================== GAME ESCROW CONTRACT METHODS (BASE TESTNET) ====================

  /**
   * Get GameEscrow contract instance with signer (Base network)
   */
  private getGameEscrowContract(privateKey: string): any {
    if (!this.gameEscrowAddress) {
      throw new Error("GameEscrow contract address not configured");
    }
    const wallet = new ethers.Wallet(privateKey, this.baseProvider);
    return new ethers.Contract(this.gameEscrowAddress, GameEscrowAbi.abi, wallet);
  }

  /**
   * Get GameEscrow contract instance (read-only, Base network)
   */
  private getGameEscrowContractReadOnly(): any {
    if (!this.gameEscrowAddress) {
      throw new Error("GameEscrow contract address not configured");
    }
    return new ethers.Contract(this.gameEscrowAddress, GameEscrowAbi.abi, this.baseProvider);
  }

  /**
   * Get ERC20 token contract instance (for USDC, Base network)
   */
  private getERC20Contract(privateKey: string, tokenAddress: string): any {
    const wallet = new ethers.Wallet(privateKey, this.baseProvider);
    // Standard ERC20 ABI (approve, transfer, balanceOf, allowance)
    const erc20Abi = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)",
      "function allowance(address owner, address spender) external view returns (uint256)",
      "function decimals() external view returns (uint8)",
      "function symbol() external view returns (string)",
      "function name() external view returns (string)"
    ];
    return new ethers.Contract(tokenAddress, erc20Abi, wallet);
  }

  /**
   * Get ERC20 token contract instance (read-only, Base network)
   */
  private getERC20ContractReadOnly(tokenAddress: string): any {
    const erc20Abi = [
      "function balanceOf(address account) external view returns (uint256)",
      "function allowance(address owner, address spender) external view returns (uint256)",
      "function decimals() external view returns (uint8)",
      "function symbol() external view returns (string)",
      "function name() external view returns (string)"
    ];
    return new ethers.Contract(tokenAddress, erc20Abi, this.baseProvider);
  }

  /**
   * Get ERC20 token balance (Base network)
   */
  async getERC20Balance(address: string, tokenAddress: string) {
    try {
      const contract = this.getERC20ContractReadOnly(tokenAddress);
      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol()
      ]);

      return {
        address,
        token: tokenAddress,
        balance: ethers.formatUnits(balance, decimals),
        balanceRaw: balance.toString(),
        decimals: Number(decimals),
        symbol
      };
    } catch (error: any) {
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Approve ERC20 token spending (Base network)
   */
  async approveERC20(userId: string, tokenAddress: string, spender: string, amount: string) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getERC20Contract(privateKey, tokenAddress);
      const wallet = new ethers.Wallet(privateKey, this.baseProvider);

      // Get token decimals
      const decimals = await contract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // Get nonce and gas price
      const nonce = await this.baseProvider.getTransactionCount(wallet.address, "pending");
      const feeData = await this.baseProvider.getFeeData();
      const gasPrice = feeData.gasPrice;

      console.log(`[Blockchain] Approving ${amount} tokens for ${spender}`);

      const tx = await contract.approve(spender, amountWei, {
        nonce,
        gasPrice,
        gasLimit: 100000,
      });

      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        spender,
        amount
      };
    } catch (error: any) {
      console.error('[Blockchain] Approve error:', error);
      throw new Error(`Failed to approve token: ${error.message}`);
    }
  }

  /**
   * Create a new GameEscrow game (Base network)
   */
  async createGameEscrowGame(
    userId: string,
    tokenAddress: string,
    entryFee: string,
    minPlayers: number,
    maxPlayers: number,
    gameMode: number = 0,
    teams: number = 0,
    prizePercentages: number[] = [100]
  ) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getGameEscrowContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.baseProvider);

      // Get token decimals for proper conversion
      const tokenContract = this.getERC20ContractReadOnly(tokenAddress);
      const decimals = await tokenContract.decimals();
      const entryFeeWei = ethers.parseUnits(entryFee, decimals);

      // Get nonce and gas price
      const nonce = await this.baseProvider.getTransactionCount(wallet.address, "pending");
      const feeData = await this.baseProvider.getFeeData();
      const gasPrice = feeData.gasPrice;

      console.log(`[Blockchain] Creating GameEscrow game on Base testnet`);
      console.log(`  - Token: ${tokenAddress}`);
      console.log(`  - Entry Fee: ${entryFee} (${entryFeeWei.toString()} wei)`);
      console.log(`  - Players: ${minPlayers}-${maxPlayers}`);
      console.log(`  - Game Mode: ${gameMode}`);

      // Creator address is 0x0 (msg.sender will be used)
      const creatorAddress = ethers.ZeroAddress;

      const tx = await contract.createGame(
        tokenAddress,
        entryFeeWei,
        minPlayers,
        maxPlayers,
        gameMode,
        teams,
        prizePercentages,
        creatorAddress,
        {
          nonce,
          gasPrice,
          gasLimit: 500000,
        }
      );

      console.log(`[Blockchain] Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait(1);

      // Extract gameId from GameCreated event
      const event = receipt.logs.find((log: any) => {
        try {
          return contract.interface.parseLog(log)?.name === 'GameCreated';
        } catch {
          return false;
        }
      });

      let gameId = 0;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        gameId = Number(parsed?.args[0] || 0);
      }

      console.log(`[Blockchain] GameEscrow game created with ID: ${gameId}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gameId
      };
    } catch (error: any) {
      console.error('[Blockchain] Create GameEscrow game error:', error);
      throw new Error(`Failed to create game: ${error.message}`);
    }
  }

  /**
   * Join a GameEscrow game (Base network)
   * Note: User must have approved token spending before calling this
   */
  async joinGameEscrowGame(userId: string, blockchainGameId: number, teamId: number = 0) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getGameEscrowContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.baseProvider);

      // Get nonce and gas price
      const nonce = await this.baseProvider.getTransactionCount(wallet.address, "pending");
      const feeData = await this.baseProvider.getFeeData();
      const gasPrice = feeData.gasPrice;

      console.log(`[Blockchain] Joining GameEscrow game ${blockchainGameId}`);

      const tx = await contract.joinGame(blockchainGameId, teamId, {
        nonce,
        gasPrice,
        gasLimit: 300000,
      });

      const receipt = await tx.wait(1);

      console.log(`[Blockchain] Successfully joined game ${blockchainGameId}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error: any) {
      console.error('[Blockchain] Join GameEscrow game error:', error);

      // Parse specific contract errors
      if (error.message.includes("GameFull")) {
        throw new Error("Game is full");
      } else if (error.message.includes("PlayerAlreadyJoined")) {
        throw new Error("You have already joined this game");
      } else if (error.message.includes("GameNotWaiting")) {
        throw new Error("Game has already started");
      } else if (error.message.includes("CooldownActive")) {
        throw new Error("Please wait before joining another game");
      }

      throw new Error(`Failed to join game: ${error.message}`);
    }
  }

  /**
   * Get GameEscrow game details (Base network, read-only)
   */
  async getGameEscrowDetails(gameId: number) {
    try {
      const contract = this.getGameEscrowContractReadOnly();
      const game = await contract.getGame(gameId);

      const gameModes = ['WinnerTakesAll', 'TeamBattle', 'FreeForAll', 'ScoreBased'];
      const gameStatuses = ['Waiting', 'Active', 'Finished', 'Cancelled', 'Emergency'];

      // Get token info
      const tokenContract = this.getERC20ContractReadOnly(game.token);
      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);

      return {
        gameId,
        creator: game.creator,
        token: game.token,
        tokenSymbol: symbol,
        entryFee: ethers.formatUnits(game.entryFee, decimals),
        entryFeeRaw: game.entryFee.toString(),
        minPlayers: Number(game.minPlayers),
        maxPlayers: Number(game.maxPlayers),
        currentPlayers: game.players.length,
        gameMode: gameModes[game.gameMode] || 'Unknown',
        gameModeCode: Number(game.gameMode),
        status: gameStatuses[game.status] || 'Unknown',
        statusCode: Number(game.status),
        totalPrizePool: ethers.formatUnits(game.prizePool, decimals),
        totalPrizePoolRaw: game.prizePool.toString(),
        players: game.players,
        teams: Number(game.teams),
        prizePercentages: game.prizePercentages.map((p: any) => Number(p)),
        createdAt: Number(game.createdAt),
        startedAt: Number(game.startedAt)
      };
    } catch (error: any) {
      throw new Error(`Failed to get game details: ${error.message}`);
    }
  }

  /**
   * Get player info in a GameEscrow game
   */
  async getGameEscrowPlayerInfo(gameId: number, playerAddress: string) {
    try {
      const contract = this.getGameEscrowContractReadOnly();
      const playerInfo = await contract.getPlayerInfo(gameId, playerAddress);

      return {
        gameId,
        player: playerAddress,
        isInGame: playerInfo.isInGame,
        hasClaimed: playerInfo.hasClaimed,
        score: Number(playerInfo.score),
        teamId: Number(playerInfo.teamId)
      };
    } catch (error: any) {
      throw new Error(`Failed to get player info: ${error.message}`);
    }
  }

  /**
   * Cancel a GameEscrow game (creator only, only if waiting)
   */
  async cancelGameEscrowGame(userId: string, gameId: number) {
    try {
      const privateKey = this.getPrivateKeyFromFile(userId);
      const contract = this.getGameEscrowContract(privateKey);
      const wallet = new ethers.Wallet(privateKey, this.baseProvider);

      const nonce = await this.baseProvider.getTransactionCount(wallet.address, "pending");
      const feeData = await this.baseProvider.getFeeData();
      const gasPrice = feeData.gasPrice;

      const tx = await contract.cancelGame(gameId, {
        nonce,
        gasPrice,
        gasLimit: 300000,
      });

      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error: any) {
      console.error('[Blockchain] Cancel GameEscrow game error:', error);
      throw new Error(`Failed to cancel game: ${error.message}`);
    }
  }

  /**
   * Report game results (Oracle function - requires ORACLE_ROLE)
   * This should be called from backend with oracle wallet
   */
  async reportGameEscrowResult(
    gameId: number,
    winners: string[],
    scores: number[],
    teamAssignments: number[]
  ) {
    try {
      // For oracle operations, use a dedicated oracle private key from env
      const oracleKey = process.env.ORACLE_PRIVATE_KEY;
      if (!oracleKey) {
        throw new Error("Oracle private key not configured");
      }

      const contract = this.getGameEscrowContract(oracleKey);
      const wallet = new ethers.Wallet(oracleKey, this.baseProvider);

      const nonce = await this.baseProvider.getTransactionCount(wallet.address, "pending");
      const feeData = await this.baseProvider.getFeeData();
      const gasPrice = feeData.gasPrice;

      console.log(`[Blockchain] Oracle reporting game ${gameId} results`);

      const tx = await contract.reportGameResult(gameId, winners, scores, teamAssignments, {
        nonce,
        gasPrice,
        gasLimit: 500000,
      });

      const receipt = await tx.wait(1);

      console.log(`[Blockchain] Game ${gameId} results reported, prizes distributed`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error: any) {
      console.error('[Blockchain] Report game result error:', error);
      throw new Error(`Failed to report game result: ${error.message}`);
    }
  }

  /**
   * Get GameEscrow contract address
   */
  getGameEscrowAddress(): string {
    return this.gameEscrowAddress;
  }

  /**
   * Get USDC contract address (Base testnet)
   */
  getUSDCAddress(): string {
    return this.usdcAddress;
  }
}

export default new BlockchainService();
