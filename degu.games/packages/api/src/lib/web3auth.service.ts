/**
 * Privy Wallet Service - Manages backend wallet operations
 *
 * IMPORTANT: This service accesses private keys ONLY on the backend.
 * Private keys are stored securely and NEVER sent to the frontend.
 *
 * Privy allows embedded wallets where private keys can be exported
 * and stored on the backend for server-side transaction signing.
 */

import { prisma } from './prisma';

export class PrivyWalletService {
    /**
     * Get private key for a user from database
     *
     * The private key is stored in the database (encrypted) after the user
     * consents to export it from their Privy embedded wallet.
     *
     * @param userId - User ID from JWT auth token
     * @returns Private key for signing transactions
     */
    async getPrivateKeyForUser(userId: string): Promise<string> {
        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                walletAddress: true,
                privyId: true,
                authProvider: true
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.privyId) {
            throw new Error('No Privy session found for user. Please log in again.');
        }

        // TODO: Retrieve encrypted private key from secure storage
        // For hackathon MVP: Private keys are stored in temp files
        // For production: Use KMS or hardware wallet solution

        throw new Error(
            'Private key retrieval not yet implemented. ' +
            'For production, integrate with KMS or secure key storage. ' +
            'For MVP: Private keys should be saved via /users/save-private-key endpoint'
        );
    }

    /**
     * Save user's private key (from Privy embedded wallet export)
     * @param userId - User ID
     * @param privateKey - Exported private key from Privy
     */
    async savePrivateKey(userId: string, privateKey: string): Promise<void> {
        // TODO: Implement secure key storage
        // For MVP: Store in temp file
        // For production: Use KMS (AWS KMS, Google Cloud KMS, etc.)

        console.log('[PrivyWalletService] Private key save requested for user:', userId);
        // Implementation should be in users controller/service
    }

    /**
     * Validate Privy session is still active
     * @param userId - User ID
     * @returns True if session is valid
     */
    async validateSession(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { privyId: true }
        });

        return !!user?.privyId;
    }

    /**
     * Clear Privy session (on logout)
     * @param userId - User ID
     */
    async clearSession(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { privyId: null }
        });
    }
}

export const privyWalletService = new PrivyWalletService();
