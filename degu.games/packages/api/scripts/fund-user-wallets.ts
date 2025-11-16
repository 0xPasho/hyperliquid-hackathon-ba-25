#!/usr/bin/env npx tsx
/**
 * Fund user wallets with ETH for gas on Base Sepolia
 *
 * This script:
 * 1. Connects to the database
 * 2. Finds all users with wallet addresses
 * 3. Checks their ETH balance on Base Sepolia
 * 4. Sends ETH if balance is below threshold
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const RPC_URL = 'https://sepolia.base.org';
const CHAIN_ID = 84532; // Base Sepolia
const MIN_ETH_BALANCE = 0.001; // Send if user has less than 0.001 ETH
const ETH_TO_SEND = 0.01; // Send 0.01 ETH when needed

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

        // Get private key for funding
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

        console.log(`🔑 Using deployer wallet: ${wallet.address}\n`);

        // Check deployer's ETH balance
        const deployerBalance = await provider.getBalance(wallet.address);
        const deployerBalanceEth = parseFloat(ethers.formatEther(deployerBalance));

        console.log(`💰 Deployer ETH balance: ${deployerBalanceEth.toFixed(6)} ETH\n`);

        if (deployerBalanceEth < ETH_TO_SEND * users.length) {
            console.error(`❌ Deployer doesn't have enough ETH to fund all users`);
            console.error(`   Need at least: ${(ETH_TO_SEND * users.length).toFixed(6)} ETH`);
            console.error(`   Have: ${deployerBalanceEth.toFixed(6)} ETH`);
            process.exit(1);
        }

        // Check each user's balance
        for (const user of users) {
            const walletAddress = user.walletAddress!;
            console.log(`👤 User: ${user.name || 'Anonymous'} (${user.id})`);
            console.log(`   Wallet: ${walletAddress}`);

            // Check ETH balance
            const balance = await provider.getBalance(walletAddress);
            const balanceEth = parseFloat(ethers.formatEther(balance));

            console.log(`   💰 Current ETH balance: ${balanceEth.toFixed(6)} ETH`);

            // Send ETH if balance is below threshold
            if (balanceEth < MIN_ETH_BALANCE) {
                console.log(`   ⚠️  Balance below ${MIN_ETH_BALANCE} ETH threshold`);
                console.log(`   🔄 Sending ${ETH_TO_SEND} ETH...`);

                try {
                    const tx = await wallet.sendTransaction({
                        to: walletAddress,
                        value: ethers.parseEther(ETH_TO_SEND.toString())
                    });

                    console.log(`   📝 Transaction hash: ${tx.hash}`);
                    console.log(`   ⏳ Waiting for confirmation...`);

                    const receipt = await tx.wait();

                    const newBalance = await provider.getBalance(walletAddress);
                    const newBalanceEth = parseFloat(ethers.formatEther(newBalance));

                    console.log(`   ✅ Sent! Block: ${receipt?.blockNumber}`);
                    console.log(`   💰 New balance: ${newBalanceEth.toFixed(6)} ETH`);
                    console.log(`   🔗 View on BaseScan: https://sepolia.basescan.org/tx/${tx.hash}`);
                } catch (error: any) {
                    console.error(`   ❌ Error sending ETH: ${error.message}`);
                }
            } else {
                console.log(`   ✅ Balance sufficient (>= ${MIN_ETH_BALANCE} ETH)`);
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
