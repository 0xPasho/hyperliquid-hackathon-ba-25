#!/usr/bin/env npx tsx
/**
 * Mint USDC tokens to a wallet address on Base Sepolia
 *
 * Usage:
 *   npx tsx scripts/mint-usdc.ts <WALLET_ADDRESS> [AMOUNT]
 *
 * Example:
 *   npx tsx scripts/mint-usdc.ts 0x123...abc 100
 */

import { ethers } from 'ethers';
import MockERC20ABI from '../src/lib/abis/MockERC20.json';

const USDC_ADDRESS = '0xE02E0dEa9F850D88E1329550D9FC8D98aF541f55';
const RPC_URL = 'https://sepolia.base.org';
const CHAIN_ID = 84532; // Base Sepolia

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error('❌ Error: Wallet address is required');
        console.log('\nUsage:');
        console.log('  npx tsx scripts/mint-usdc.ts <WALLET_ADDRESS> [AMOUNT]');
        console.log('\nExample:');
        console.log('  npx tsx scripts/mint-usdc.ts 0x123...abc 100');
        process.exit(1);
    }

    const recipientAddress = args[0];
    const amount = args[1] ? parseFloat(args[1]) : 100; // Default 100 USDC

    // Validate address
    if (!ethers.isAddress(recipientAddress)) {
        console.error('❌ Error: Invalid wallet address');
        process.exit(1);
    }

    // Get private key from environment
    const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

    if (!privateKey) {
        console.error('❌ Error: PRIVATE_KEY or DEPLOYER_PRIVATE_KEY not found in environment');
        console.log('\nPlease set one of these environment variables with the deployer private key:');
        console.log('  export PRIVATE_KEY=your_private_key');
        console.log('  # or');
        console.log('  export DEPLOYER_PRIVATE_KEY=your_private_key');
        process.exit(1);
    }

    console.log('🔄 Minting USDC tokens...');
    console.log(`📍 Network: Base Sepolia (Chain ID: ${CHAIN_ID})`);
    console.log(`💰 USDC Contract: ${USDC_ADDRESS}`);
    console.log(`👛 Recipient: ${recipientAddress}`);
    console.log(`💵 Amount: ${amount} USDC`);
    console.log('');

    try {
        // Connect to Base Sepolia
        const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
        const wallet = new ethers.Wallet(privateKey, provider);

        console.log(`🔑 Using deployer wallet: ${wallet.address}`);

        // Connect to USDC contract
        const usdcContract = new ethers.Contract(USDC_ADDRESS, MockERC20ABI, wallet);

        // Check current balance
        const balanceBefore = await usdcContract.balanceOf(recipientAddress);
        const decimals = await usdcContract.decimals();
        console.log(`📊 Current balance: ${ethers.formatUnits(balanceBefore, decimals)} USDC`);

        // Mint tokens (USDC has 6 decimals)
        const mintAmount = ethers.parseUnits(amount.toString(), decimals);

        console.log('⏳ Sending transaction...');
        const tx = await usdcContract.mint(recipientAddress, mintAmount);

        console.log(`📝 Transaction hash: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');

        const receipt = await tx.wait();

        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

        // Check new balance
        const balanceAfter = await usdcContract.balanceOf(recipientAddress);
        console.log(`📊 New balance: ${ethers.formatUnits(balanceAfter, decimals)} USDC`);

        console.log('');
        console.log('✅ Successfully minted tokens!');
        console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/tx/${tx.hash}`);

    } catch (error: any) {
        console.error('❌ Error minting tokens:', error.message);
        if (error.code === 'CALL_EXCEPTION') {
            console.error('\n💡 This might mean:');
            console.error('  - The deployer wallet doesn\'t have permission to mint');
            console.error('  - The USDC contract address is incorrect');
            console.error('  - The contract doesn\'t have a public mint function');
        }
        process.exit(1);
    }
}

main();
