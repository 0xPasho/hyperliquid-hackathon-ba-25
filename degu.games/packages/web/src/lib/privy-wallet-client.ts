/**
 * Privy Wallet Client Adapter
 * Converts Privy embedded wallets to viem-compatible wallet clients
 */

import { encodeFunctionData, type Address, type Hex } from "viem";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { getNetworkByChainId } from "./networks";

/**
 * Ensures the wallet is connected to the correct network
 */
async function ensureCorrectNetwork(eip1193Provider: any, targetChainId: number): Promise<void> {
    try {
        // Get current chain ID
        const chainId = await eip1193Provider.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainId, 16);

        const network = getNetworkByChainId(targetChainId);
        if (!network) {
            throw new Error(`Unsupported chain ID: ${targetChainId}`);
        }

        console.log('[WalletClient] Current chain ID:', currentChainId, 'Target:', targetChainId);

        // If already on correct network, return
        if (currentChainId === targetChainId) {
            return;
        }

        console.log('[WalletClient] Switching to chain', targetChainId, network.name);

        // Try to switch network
        try {
            await eip1193Provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${targetChainId.toString(16)}` }],
            });
            console.log('[WalletClient] Successfully switched to chain', targetChainId);
        } catch (switchError: any) {
            // If chain not added, add it
            if (switchError.code === 4902) {
                console.log('[WalletClient] Chain not found, adding it...');
                await eip1193Provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${targetChainId.toString(16)}`,
                        chainName: network.name,
                        nativeCurrency: {
                            name: network.nativeCurrency.name,
                            symbol: network.nativeCurrency.symbol,
                            decimals: network.nativeCurrency.decimals,
                        },
                        rpcUrls: [network.rpcUrl],
                        blockExplorerUrls: [network.blockExplorer],
                    }],
                });
                console.log('[WalletClient] Chain added successfully');
            } else {
                throw switchError;
            }
        }
    } catch (error) {
        console.error('[WalletClient] Error ensuring correct network:', error);
        throw new Error(`Please switch to ${network?.name || 'the correct'} network (Chain ID: ${targetChainId})`);
    }
}

/**
 * Creates a viem-compatible wallet client from a Privy wallet
 * This allows Privy wallets to work with our escrow client functions
 */
export function createWalletClientFromPrivy(privyWallet: ConnectedWallet, chainId?: number) {
    const DEFAULT_CHAIN_ID = 84532; // Base Sepolia
    const targetChainId = chainId || DEFAULT_CHAIN_ID;

    return {
        address: privyWallet.address as Address,

        /**
         * Send a transaction using the Privy wallet
         */
        async sendTransaction(params: {
            to: string;
            data: string;
            value?: bigint;
        }): Promise<string> {
            // Get EIP-1193 provider from Privy wallet
            const eip1193Provider = await privyWallet.getEthereumProvider();

            // Ensure we're on the correct network
            await ensureCorrectNetwork(eip1193Provider, targetChainId);

            // Wrap with ethers
            const provider = new ethers.BrowserProvider(eip1193Provider);
            const signer = await provider.getSigner();

            try {
                // Estimate gas for the transaction
                const gasEstimate = await provider.estimateGas({
                    from: privyWallet.address,
                    to: params.to,
                    data: params.data,
                    value: params.value ? params.value.toString() : undefined,
                });

                console.log('[WalletClient] Estimated gas:', gasEstimate.toString());

                // Add 20% buffer to gas estimate to prevent out of gas errors
                const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

                console.log('[WalletClient] Gas limit with buffer:', gasLimit.toString());

                // Get current gas price
                const feeData = await provider.getFeeData();
                console.log('[WalletClient] Fee data:', {
                    gasPrice: feeData.gasPrice?.toString(),
                    maxFeePerGas: feeData.maxFeePerGas?.toString(),
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
                });

                // Send transaction with proper gas parameters
                const tx = await signer.sendTransaction({
                    to: params.to,
                    data: params.data,
                    value: params.value ? params.value.toString() : undefined,
                    gasLimit: gasLimit,
                    // Use EIP-1559 if available, otherwise use legacy gas price
                    maxFeePerGas: feeData.maxFeePerGas || undefined,
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
                    gasPrice: (!feeData.maxFeePerGas && feeData.gasPrice) ? feeData.gasPrice : undefined,
                });

                console.log('[WalletClient] Transaction sent:', tx.hash);
                return tx.hash as Hex;
            } catch (error: any) {
                console.error('[WalletClient] Transaction error:', error);

                // Parse specific error messages
                if (error.message?.includes('insufficient funds')) {
                    throw new Error('Insufficient funds for gas + transaction amount');
                } else if (error.message?.includes('execution reverted')) {
                    throw new Error('Transaction would fail. Please check: 1) Token balance, 2) Token approval, 3) Game is still open');
                } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                    throw new Error('Cannot estimate gas. Transaction may fail. Check contract state.');
                }

                throw error;
            }
        },

        /**
         * Read from a contract
         */
        async readContract(params: {
            address: string;
            abi: any;
            functionName: string;
            args?: any[];
        }): Promise<any> {
            // Get EIP-1193 provider from Privy wallet
            const eip1193Provider = await privyWallet.getEthereumProvider();

            // Ensure we're on the correct network
            await ensureCorrectNetwork(eip1193Provider, targetChainId);

            // Wrap with ethers (read-only, no signer needed)
            const provider = new ethers.BrowserProvider(eip1193Provider);

            const contract = new ethers.Contract(
                params.address,
                params.abi,
                provider
            );

            return await contract[params.functionName](
                ...(params.args || [])
            );
        },
    };
}
