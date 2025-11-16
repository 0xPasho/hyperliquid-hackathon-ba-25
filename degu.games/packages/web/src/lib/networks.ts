/**
 * Multi-chain network configuration
 * Supports Base, Polygon, and Arbitrum
 */

export interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    isNative: boolean;
}

export interface NetworkConfig {
    chainId: number;
    name: string;
    shortName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrl: string;
    blockExplorer: string;
    tokens: Token[];
    gameEscrowAddress: string;
}

// Testnet Configuration
export const NETWORKS: Record<string, NetworkConfig> = {
    base: {
        chainId: 84532,
        name: 'Base Sepolia',
        shortName: 'Base',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrl: 'https://sepolia.base.org',
        blockExplorer: 'https://sepolia.basescan.org',
        gameEscrowAddress: '0x90c15373A1db6c75A55CfD3743249D56136Cb86a',
        tokens: [
            {
                symbol: 'ETH',
                name: 'Ethereum',
                address: '0x0000000000000000000000000000000000000000', // Native token
                decimals: 18,
                isNative: true,
            },
            {
                symbol: 'USDC',
                name: 'USD Coin',
                address: '0xE02E0dEa9F850D88E1329550D9FC8D98aF541f55',
                decimals: 6,
                isNative: false,
            },
        ],
    },
    polygon: {
        chainId: 80002,
        name: 'Polygon Amoy',
        shortName: 'Polygon',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        blockExplorer: 'https://amoy.polygonscan.com',
        gameEscrowAddress: '', // TODO: Deploy contract
        tokens: [
            {
                symbol: 'MATIC',
                name: 'Polygon',
                address: '0x0000000000000000000000000000000000000000', // Native token
                decimals: 18,
                isNative: true,
            },
            {
                symbol: 'USDC',
                name: 'USD Coin',
                address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // Polygon Amoy USDC
                decimals: 6,
                isNative: false,
            },
        ],
    },
    arbitrum: {
        chainId: 421614,
        name: 'Arbitrum Sepolia',
        shortName: 'Arbitrum',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        blockExplorer: 'https://sepolia.arbiscan.io',
        gameEscrowAddress: '', // TODO: Deploy contract
        tokens: [
            {
                symbol: 'ETH',
                name: 'Ethereum',
                address: '0x0000000000000000000000000000000000000000', // Native token
                decimals: 18,
                isNative: true,
            },
            {
                symbol: 'USDC',
                name: 'USD Coin',
                address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia USDC
                decimals: 6,
                isNative: false,
            },
        ],
    },
};

// Helper functions
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
    return Object.values(NETWORKS).find(n => n.chainId === chainId);
}

export function getNetworkById(networkId: string): NetworkConfig | undefined {
    return NETWORKS[networkId];
}

export function getTokenByAddress(chainId: number, tokenAddress: string): Token | undefined {
    const network = getNetworkByChainId(chainId);
    if (!network) return undefined;
    return network.tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
}

export const DEFAULT_NETWORK = NETWORKS.base;
export const DEFAULT_CHAIN_ID = DEFAULT_NETWORK.chainId;
