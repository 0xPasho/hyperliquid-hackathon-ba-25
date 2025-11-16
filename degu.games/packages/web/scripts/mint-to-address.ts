#!/usr/bin/env npx tsx
import { ethers } from 'ethers';
import MockERC20ABI from '../src/lib/abis/MockERC20.json';

const USDC_ADDRESS = '0xE02E0dEa9F850D88E1329550D9FC8D98aF541f55';
const RPC_URL = 'https://sepolia.base.org';
const TARGET_ADDRESS = '0x59f1624aba1d1e7a7caeca364a5e8a48bb4a816b';
const MINT_AMOUNT = '100';

async function main() {
    const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error('PRIVATE_KEY not set');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, MockERC20ABI, wallet);

    console.log(`Minting ${MINT_AMOUNT} USDC to ${TARGET_ADDRESS}...`);

    const tx = await usdc.mint(TARGET_ADDRESS, ethers.parseUnits(MINT_AMOUNT, 6));
    console.log(`TX: ${tx.hash}`);

    await tx.wait();

    const balance = await usdc.balanceOf(TARGET_ADDRESS);
    console.log(`✅ New balance: ${ethers.formatUnits(balance, 6)} USDC`);
}

main();
