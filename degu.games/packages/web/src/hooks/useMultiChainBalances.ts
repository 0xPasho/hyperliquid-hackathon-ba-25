"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { NETWORKS } from "@/lib/networks";
import { getCryptoPrices, calculateUsdValue } from "@/lib/crypto-prices";

/**
 * Token balance with USD value
 */
export interface TokenBalance {
    symbol: string;
    name: string;
    balance: string; // Formatted balance (e.g., "1.5")
    balanceRaw: bigint; // Raw balance
    decimals: number;
    isNative: boolean;
    usdValue?: number; // Optional USD value
}

/**
 * Network balance with all tokens
 */
export interface NetworkBalance {
    chainId: number;
    networkName: string;
    shortName: string;
    nativeSymbol: string;
    balances: TokenBalance[];
    totalUsdValue: number;
}

/**
 * Multi-chain balances hook return type
 */
export interface MultiChainBalances {
    networks: NetworkBalance[];
    totalPortfolioValue: number;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

// ERC20 ABI for balance calls
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
];

/**
 * Fetch balance for a single token
 */
async function fetchTokenBalance(
    provider: ethers.JsonRpcProvider,
    tokenAddress: string,
    walletAddress: string,
    decimals: number,
    isNative: boolean
): Promise<bigint> {
    try {
        if (isNative) {
            // Fetch native token balance
            return await provider.getBalance(walletAddress);
        } else {
            // Fetch ERC20 token balance
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            return await contract.balanceOf(walletAddress);
        }
    } catch (error) {
        console.error(`Error fetching token balance for ${tokenAddress}:`, error);
        return BigInt(0);
    }
}

/**
 * Format balance from raw bigint to decimal string
 */
function formatBalance(balanceRaw: bigint, decimals: number): string {
    const formatted = ethers.formatUnits(balanceRaw, decimals);
    return formatted;
}

/**
 * Fetch balances for all tokens on a single network
 */
async function fetchNetworkBalances(
    networkId: string,
    walletAddress: string,
    prices: Record<string, number>
): Promise<NetworkBalance> {
    const network = NETWORKS[networkId];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    // Fetch all token balances in parallel
    const balancePromises = network.tokens.map(async (token) => {
        const balanceRaw = await fetchTokenBalance(
            provider,
            token.address,
            walletAddress,
            token.decimals,
            token.isNative
        );

        const balance = formatBalance(balanceRaw, token.decimals);
        const usdValue = calculateUsdValue(balance, token.symbol, prices);

        return {
            symbol: token.symbol,
            name: token.name,
            balance,
            balanceRaw,
            decimals: token.decimals,
            isNative: token.isNative,
            usdValue,
        } as TokenBalance;
    });

    const balances = await Promise.all(balancePromises);

    // Calculate total USD value for this network
    const totalUsdValue = balances.reduce((sum, b) => sum + (b.usdValue || 0), 0);

    return {
        chainId: network.chainId,
        networkName: network.name,
        shortName: network.shortName,
        nativeSymbol: network.nativeCurrency.symbol,
        balances,
        totalUsdValue,
    };
}

/**
 * Hook to fetch multi-chain balances
 */
export function useMultiChainBalances(): MultiChainBalances {
    const { wallets } = useWallets();
    const [networks, setNetworks] = useState<NetworkBalance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const walletAddress = wallets[0]?.address;

    // Fetch balances for all networks
    const fetchBalances = useCallback(async () => {
        if (!walletAddress) {
            setIsLoading(false);
            setError("No wallet connected");
            setNetworks([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch USD prices first
            const prices = await getCryptoPrices();

            // Fetch balances from all networks in parallel
            const networkIds = Object.keys(NETWORKS);
            const networkBalances = await Promise.all(
                networkIds.map((networkId) =>
                    fetchNetworkBalances(networkId, walletAddress, prices)
                )
            );

            setNetworks(networkBalances);
        } catch (err) {
            console.error("Error fetching multi-chain balances:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch balances");
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress]);

    // Initial fetch and auto-refresh
    useEffect(() => {
        fetchBalances();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchBalances();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchBalances, refreshTrigger]);

    // Calculate total portfolio value
    const totalPortfolioValue = useMemo(() => {
        return networks.reduce((sum, network) => sum + network.totalUsdValue, 0);
    }, [networks]);

    // Manual refresh function
    const refresh = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
    }, []);

    return {
        networks,
        totalPortfolioValue,
        isLoading,
        error,
        refresh,
    };
}
