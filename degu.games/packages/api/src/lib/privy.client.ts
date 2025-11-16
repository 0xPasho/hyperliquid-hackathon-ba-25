/**
 * Privy Server-Side Client
 *
 * This module initializes the Privy client for server-side token verification.
 * It ensures that authentication tokens from the frontend are legitimate and issued by Privy.
 */

import { PrivyClient } from '@privy-io/server-auth';

// Validate environment variables
if (!process.env.PRIVY_APP_ID) {
    throw new Error('PRIVY_APP_ID environment variable is required');
}

if (!process.env.PRIVY_APP_SECRET) {
    throw new Error('PRIVY_APP_SECRET environment variable is required');
}

// Initialize Privy client for token verification
export const privyClient = new PrivyClient(
    process.env.PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
);

/**
 * Verify a Privy access token and return the user data
 * @param accessToken - The access token from the frontend (Privy.getAccessToken())
 * @returns The verified user data from Privy
 * @throws Error if token is invalid or expired
 */
export async function verifyPrivyToken(accessToken: string) {
    try {
        // Verify the token with Privy's servers
        const claims = await privyClient.verifyAuthToken(accessToken);

        console.log('[Privy] Token verified successfully for user:', claims.userId);

        return claims;
    } catch (error) {
        console.error('[Privy] Token verification failed:', error);
        throw new Error('Invalid or expired authentication token');
    }
}
