/**
 * Script to approve USDC spending for the GameEscrow contract
 * Run this once to allow the oracle wallet to spend USDC on joinGame calls
 */

import { config } from "dotenv";
import { ethers } from "ethers";
import { blockchainConfig } from "../src/lib/blockchain/config";

// Load environment variables
config();

// ERC20 ABI (just the approve function)
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
];

async function approveUSDC() {
    console.log("🔧 Approving USDC for GameEscrow contract...\n");

    // Debug: Check if private key is loaded
    console.log("Private key loaded:", blockchainConfig.oraclePrivateKey ? `yes (length: ${blockchainConfig.oraclePrivateKey.length})` : "no");
    console.log("RPC URL:", blockchainConfig.rpcUrl);

    if (!blockchainConfig.oraclePrivateKey) {
        throw new Error("ORACLE_PRIVATE_KEY not found in environment variables");
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    const wallet = new ethers.Wallet(
        blockchainConfig.oraclePrivateKey,
        provider
    );

    console.log("Oracle Wallet:", wallet.address);
    console.log("GameEscrow Contract:", blockchainConfig.gameEscrowAddress);

    // USDC contract address from env
    const USDC_ADDRESS = process.env.USDC_BASE_TESTNET;
    if (!USDC_ADDRESS) {
        throw new Error("USDC_BASE_TESTNET not set in .env");
    }

    console.log("USDC Token:", USDC_ADDRESS);

    // Create USDC contract instance
    const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        ERC20_ABI,
        wallet
    ) as ethers.Contract & {
        balanceOf: (address: string) => Promise<bigint>;
        allowance: (owner: string, spender: string) => Promise<bigint>;
        approve: (spender: string, amount: bigint) => Promise<any>;
    };

    // Check current balance
    const balance = await usdcContract.balanceOf(wallet.address);
    console.log(
        "\nCurrent USDC Balance:",
        ethers.formatUnits(balance, 6),
        "USDC"
    );

    // Check current allowance
    const currentAllowance = await usdcContract.allowance(
        wallet.address,
        blockchainConfig.gameEscrowAddress
    );
    console.log(
        "Current Allowance:",
        ethers.formatUnits(currentAllowance, 6),
        "USDC"
    );

    // Approve unlimited USDC spending (max uint256)
    const maxUint256 = ethers.MaxUint256;
    console.log("\n⏳ Approving unlimited USDC spending...");

    const tx = await usdcContract.approve(
        blockchainConfig.gameEscrowAddress,
        maxUint256
    );

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log("\n✅ Approval successful!");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Verify new allowance
    const newAllowance = await usdcContract.allowance(
        wallet.address,
        blockchainConfig.gameEscrowAddress
    );
    console.log(
        "\nNew Allowance:",
        ethers.formatUnits(newAllowance, 6),
        "USDC"
    );
    console.log(
        "\n🎉 Oracle wallet can now spend USDC on GameEscrow contract!"
    );
}

approveUSDC()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
