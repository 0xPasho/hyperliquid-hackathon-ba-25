/**
 * Blockchain Configuration
 *
 * Environment Variables Required:
 * - BLOCKCHAIN_RPC_URL: RPC endpoint for the blockchain network
 * - GAME_ESCROW_CONTRACT_ADDRESS: Deployed GameEscrow contract address
 * - ORACLE_PRIVATE_KEY: Private key for the oracle account (used to report game results)
 */

export const blockchainConfig = {
    // RPC URL for Base Sepolia (or other network)
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || process.env.BASE_TESTNET_RPC || 'https://sepolia.base.org',

    // Game Escrow contract address
    gameEscrowAddress: process.env.GAME_ESCROW_CONTRACT_ADDRESS || process.env.GAME_ESCROW_ADDRESS || '0x90c15373A1db6c75A55CfD3743249D56136Cb86a', // Base Sepolia

    // Oracle wallet private key (for signing transactions)
    oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY || '',

    // Chain ID
    chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '84532'), // Base Sepolia

    // Gas settings
    gasLimit: 500000,
    maxFeePerGas: null, // Let ethers estimate
    maxPriorityFeePerGas: null, // Let ethers estimate
};

// Validate configuration on startup
export function validateBlockchainConfig(): void {
    const errors: string[] = [];

    if (!blockchainConfig.rpcUrl) {
        errors.push('BLOCKCHAIN_RPC_URL is required');
    }

    if (!blockchainConfig.gameEscrowAddress || blockchainConfig.gameEscrowAddress === '0x90c15373A1db6c75A55CfD3743249D56136Cb86a') {
        console.warn('⚠️  GAME_ESCROW_CONTRACT_ADDRESS not set - using default Base Sepolia address');
    }

    if (!blockchainConfig.oraclePrivateKey) {
        console.warn('⚠️  ORACLE_PRIVATE_KEY not set - blockchain transactions will fail');
    }

    if (errors.length > 0) {
        throw new Error(`Blockchain configuration errors:\n${errors.join('\n')}`);
    }
}
