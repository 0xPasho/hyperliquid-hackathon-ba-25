#!/usr/bin/env npx tsx
/**
 * Check USDC balance for users in database and mint if needed
 *
 * This script:
 * 1. Connects to the database
 * 2. Finds all users with wallet addresses
 * 3. Checks their USDC balance on Base Sepolia
 * 4. Mints USDC if balance is below threshold
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

// MockERC20 ABI (just the functions we need)
const MockERC20ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function mint(address to, uint256 amount) returns (bool)"
];

const USDC_ADDRESS = '0xE02E0dEa9F850D88E1329550D9FC8D98aF541f55';
const RPC_URL = 'https://sepolia.base.org';
const CHAIN_ID = 84532; // Base Sepolia
const MIN_BALANCE = 10; // Mint if user has less than 10 USDC
const MINT_AMOUNT = 100; // Mint 100 USDC when needed

async function main() {
    // Initialize Prisma client
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Checking database for users with wallet addresses...\n');

        // Find all users with wallet addresses
        const users = await prisma.user.findMany({
            where: {
                walletAddress: {
                    not: null
                }
            },
            select: {
                id: true,
                name: true,
                walletAddress: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (users.length === 0) {
            console.log('❌ No users with wallet addresses found in database');
            process.exit(0);
        }

        console.log(`✅ Found ${users.length} user(s) with wallet addresses:\n`);

        // Get private key for minting
        const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || process.env.ORACLE_PRIVATE_KEY;

        if (!privateKey) {
            console.error('❌ Error: PRIVATE_KEY, DEPLOYER_PRIVATE_KEY, or ORACLE_PRIVATE_KEY not found in environment');
            console.log('\nPlease set one of these environment variables with the deployer private key:');
            console.log('  export PRIVATE_KEY=your_private_key');
            console.log('  # or');
            console.log('  export DEPLOYER_PRIVATE_KEY=your_private_key');
            console.log('  # or');
            console.log('  export ORACLE_PRIVATE_KEY=your_private_key');
            process.exit(1);
        }

        // Connect to blockchain
        const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
        const wallet = new ethers.Wallet(privateKey, provider);
        const usdcContract = new ethers.Contract(USDC_ADDRESS, MockERC20ABI, wallet);
        const decimals = await usdcContract.decimals();

        console.log(`🔑 Using deployer wallet: ${wallet.address}\n`);

        // Check each user's balance
        for (const user of users) {
            const walletAddress = user.walletAddress!;
            console.log(`👤 User: ${user.name || 'Anonymous'} (${user.id})`);
            console.log(`   Wallet: ${walletAddress}`);

            // Check USDC balance
            const balance = await usdcContract.balanceOf(walletAddress);
            const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));

            console.log(`   💰 Current USDC balance: ${balanceFormatted.toFixed(2)} USDC`);

            // Mint if balance is below threshold
            if (balanceFormatted < MIN_BALANCE) {
                console.log(`   ⚠️  Balance below ${MIN_BALANCE} USDC threshold`);
                console.log(`   🔄 Minting ${MINT_AMOUNT} USDC...`);

                try {
                    const mintAmount = ethers.parseUnits(MINT_AMOUNT.toString(), decimals);
                    const tx = await usdcContract.mint(walletAddress, mintAmount);

                    console.log(`   📝 Transaction hash: ${tx.hash}`);
                    console.log(`   ⏳ Waiting for confirmation...`);

                    const receipt = await tx.wait();

                    const newBalance = await usdcContract.balanceOf(walletAddress);
                    const newBalanceFormatted = parseFloat(ethers.formatUnits(newBalance, decimals));

                    console.log(`   ✅ Minted! Block: ${receipt.blockNumber}`);
                    console.log(`   💰 New balance: ${newBalanceFormatted.toFixed(2)} USDC`);
                    console.log(`   🔗 View on BaseScan: https://sepolia.basescan.org/tx/${tx.hash}`);
                } catch (error: any) {
                    console.error(`   ❌ Error minting tokens: ${error.message}`);
                }
            } else {
                console.log(`   ✅ Balance sufficient (>= ${MIN_BALANCE} USDC)`);
            }

            console.log(''); // Empty line between users
        }

        console.log('✅ Done checking all users!');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
