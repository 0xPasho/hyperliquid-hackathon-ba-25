/**
 * Privy Configuration
 *
 * Privy provides embedded wallets with social login support.
 * It handles authentication and wallet generation seamlessly.
 */

export const privyConfig = {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    config: {
        // Appearance
        appearance: {
            theme: "dark" as const,
            accentColor: "#6366F1",
            logo: "/logo.png",
        },

        // Login methods
        loginMethods: [
            "wallet",
            "google",
            "twitter",
            "discord",
            "email",
        ] as const,

        // Embedded wallets configuration
        embeddedWallets: {
            requireUserPasswordOnCreate: false,
        },

        // Supported EVM chains
        // Privy supports custom EVM chains
        supportedChains: [
            {
                id: 84532, // Base Sepolia Testnet
                name: "Base Sepolia",
                network: "base-sepolia",
                nativeCurrency: {
                    name: "Ether",
                    symbol: "ETH",
                    decimals: 18,
                },
                rpcUrls: {
                    default: {
                        http: ["https://sepolia.base.org"],
                    },
                    public: {
                        http: ["https://sepolia.base.org"],
                    },
                },
                blockExplorers: {
                    default: {
                        name: "BaseScan",
                        url: "https://sepolia.basescan.org",
                    },
                },
            },
            {
                id: 420420421, // Westend Asset Hub (PolkaVM)
                name: "Westend Asset Hub",
                network: "westend-asset-hub",
                nativeCurrency: {
                    name: "Westend PAS",
                    symbol: "PAS",
                    decimals: 18,
                },
                rpcUrls: {
                    default: {
                        http: ["https://westend-asset-hub-eth-rpc.polkadot.io"],
                    },
                    public: {
                        http: ["https://westend-asset-hub-eth-rpc.polkadot.io"],
                    },
                },
                blockExplorers: {
                    default: {
                        name: "Subscan",
                        url: "https://westend-asset-hub.subscan.io",
                    },
                },
            },
        ],

        // Default chain - Base Sepolia for blockchain gaming
        defaultChain: {
            id: 84532,
            name: "Base Sepolia",
            network: "base-sepolia",
            nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
            },
            rpcUrls: {
                default: {
                    http: ["https://sepolia.base.org"],
                },
                public: {
                    http: ["https://sepolia.base.org"],
                },
            },
            blockExplorers: {
                default: {
                    name: "BaseScan",
                    url: "https://sepolia.basescan.org",
                },
            },
        },
    },
};

/**
 * Helper function to get user's wallet address from Privy
 * Returns null if wallet doesn't exist yet (which is fine for initial login)
 */
export function getWalletAddress(user: any, wallets?: any[]): string | null {
    if (!user) return null;

    // 1. Check wallets array from useWallets() hook (most reliable when available)
    if (wallets && wallets.length > 0) {
        const wallet = wallets[0]; // Use first wallet
        if (wallet?.address) {
            return wallet.address;
        }
    }

    // 2. Check linkedAccounts for embedded_wallet type
    if (user.linkedAccounts && Array.isArray(user.linkedAccounts)) {
        const walletAccount = user.linkedAccounts.find(
            (account: any) => account.type === "wallet" && account.address
        );
        if (walletAccount?.address) {
            return walletAccount.address;
        }
    }

    // 3. No wallet found - this is OK for social login
    // Wallet will be created automatically by Privy or on-demand
    return null;
}

/**
 * Get a unique identifier for the user (use Privy ID, not wallet)
 */
export function getUserId(user: any): string | null {
    return user?.id || null;
}

/**
 * Helper function to get user's email from Privy
 */
export function getUserEmail(user: any): string | null {
    if (!user) return null;

    // Check email in linked accounts
    const emailAccount = user.linkedAccounts?.find(
        (account: any) => account.type === "email"
    );

    return emailAccount?.address || user.email?.address || null;
}

/**
 * Helper function to get user's profile image from Privy
 */
export function getUserProfileImage(user: any): string | null {
    if (!user) return null;

    // Check Google account
    const googleAccount = user.linkedAccounts?.find(
        (account: any) => account.type === "google"
    );
    if (googleAccount?.picture) return googleAccount.picture;

    // Check Twitter account
    const twitterAccount = user.linkedAccounts?.find(
        (account: any) => account.type === "twitter"
    );
    if (twitterAccount?.profile_picture_url)
        return twitterAccount.profile_picture_url;

    // Check Discord account
    const discordAccount = user.linkedAccounts?.find(
        (account: any) => account.type === "discord"
    );
    if (discordAccount?.avatar) return discordAccount.avatar;

    return null;
}

/**
 * Helper function to get user's name from Privy
 */
export function getUserName(user: any): string | null {
    if (!user) return null;

    // Check Google account
    const googleAccount = user.linkedAccounts?.find(
        (account: any) => account.type === "google"
    );
    if (googleAccount?.name) return googleAccount.name;

    // Check Twitter account
    const twitterAccount = user.linkedAccounts?.find(
        (account: any) => account.type === "twitter"
    );
    if (twitterAccount?.name) return twitterAccount.name;

    // Check Discord account
    const discordAccount = user.linkedAccounts?.find(
        (account: any) => account.type === "discord"
    );
    if (discordAccount?.username) return discordAccount.username;

    return null;
}

/**
 * Helper function to get auth provider type from Privy
 */
export function getAuthProvider(user: any): string {
    if (!user) return "unknown";

    // Check which account type was used for authentication
    const linkedAccounts = user.linkedAccounts || [];

    if (linkedAccounts.some((acc: any) => acc.type === "google"))
        return "google";
    if (linkedAccounts.some((acc: any) => acc.type === "twitter"))
        return "twitter";
    if (linkedAccounts.some((acc: any) => acc.type === "discord"))
        return "discord";
    if (linkedAccounts.some((acc: any) => acc.type === "email")) return "email";

    return "wallet";
}
