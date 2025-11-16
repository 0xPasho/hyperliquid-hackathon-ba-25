"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { User } from "@/lib/types";
import {
    getWalletAddress,
    getUserEmail,
    getUserProfileImage,
    getUserName,
    getAuthProvider,
} from "@/lib/privy";
import {
    loginUser,
    getCurrentUser,
    logoutUser as apiLogout,
    AuthApiError,
} from "@/lib/auth-api";
import { setCookie, deleteCookie } from "@/lib/cookies";

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Privy hooks
    const {
        ready,
        authenticated,
        user: privyUser,
        login: privyLogin,
        logout: privyLogout,
        getAccessToken,
        createWallet,
    } = usePrivy();

    const { wallets } = useWallets();

    // Initialize and restore session
    useEffect(() => {
        const init = async () => {
            try {
                // Wait for Privy to be ready
                if (!ready) {
                    return;
                }

                // Check if user has a stored token
                const storedToken = localStorage.getItem("authToken");
                if (storedToken) {
                    setToken(storedToken);
                    const result = await getCurrentUser(storedToken);
                    if (result.success && result.data) {
                        setUser(result.data);
                        setIsAuthenticated(true);
                    } else {
                        // Token is invalid or request failed
                        console.error("Error fetching user:", result.error);
                        localStorage.removeItem("authToken");
                        setToken(null);
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                }

                // If Privy user is authenticated but we don't have backend session,
                // try to restore the session
                if (authenticated && privyUser && !storedToken) {
                    console.log(
                        "[AuthContext] Privy user authenticated, restoring backend session..."
                    );
                    await syncBackendAuth();
                }
            } catch (error) {
                console.error("Error initializing auth:", error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [ready, authenticated, privyUser]);

    // Sync Privy authentication with backend
    const syncBackendAuth = useCallback(async () => {
        try {
            if (!privyUser) {
                console.log("[AuthContext] No Privy user to sync");
                return;
            }

            console.log("[AuthContext] Syncing Privy user with backend...");

            // Get Privy user ID (primary identifier)
            const privyUserId = privyUser.id;

            // Get wallet address (may be null for new users)
            const walletAddress = getWalletAddress(privyUser, wallets);

            console.log("[AuthContext] User identifiers:", {
                privyUserId,
                walletAddress: walletAddress || "(none - will be linked later)",
            });

            // Get access token from Privy (this is the JWT we can verify on backend)
            const accessToken = await getAccessToken();
            if (!accessToken) {
                console.error("No access token available");
                return;
            }

            // Get user info from Privy
            const email = getUserEmail(privyUser);
            const name = getUserName(privyUser);
            const profileImage = getUserProfileImage(privyUser);
            const authProvider = getAuthProvider(privyUser);

            console.log("[AuthContext] User info:", {
                email,
                name,
                authProvider,
            });

            // Login to backend with Privy access token
            // Backend will use privyUserId as primary identifier
            // Wallet address is optional and can be linked later
            const result = await loginUser({
                idToken: accessToken,
                privyUserId,
                walletAddress: walletAddress || undefined,
                email: email || undefined,
                name: name || undefined,
                profileImage: profileImage || undefined,
                authProvider,
            });

            if (!result.success || !result.data) {
                console.error("[AuthContext] Error syncing backend auth:", result.error);
                return;
            }

            // Store token
            localStorage.setItem("authToken", result.data.token);
            setCookie("authToken", result.data.token);
            setToken(result.data.token);
            setUser(result.data.user);
            setIsAuthenticated(true);

            console.log("[AuthContext] ✅ Backend session synced successfully");
        } catch (error) {
            console.error("[AuthContext] Error syncing backend auth:", error);
        }
    }, [privyUser, wallets, getAccessToken]);

    const login = useCallback(async () => {
        try {
            setLoading(true);

            // If already authenticated with backend and Privy, just return
            if (token && user && authenticated) {
                console.log("[AuthContext] Already authenticated");
                return;
            }

            // If authenticated with Privy but not backend, sync
            if (authenticated && privyUser) {
                console.log(
                    "[AuthContext] Privy authenticated, syncing backend..."
                );
                await syncBackendAuth();
                return;
            }

            // Otherwise, show Privy login modal
            console.log("[AuthContext] Starting Privy login...");
            privyLogin();

            // Wait for authentication to complete
            // The effect will handle syncing with backend
        } catch (error) {
            console.error("Login error:", error);
        } finally {
            setLoading(false);
        }
    }, [token, user, authenticated, privyUser, privyLogin, syncBackendAuth]);

    // Watch for Privy authentication changes and sync with backend
    useEffect(() => {
        if (authenticated && privyUser && ready && !token) {
            console.log(
                "[AuthContext] Privy authentication detected, creating wallet and syncing..."
            );

            const setupUser = async () => {
                try {
                    // Check if user already has a wallet
                    if (wallets.length === 0) {
                        console.log(
                            "[AuthContext] No wallet found, creating embedded wallet on Base Sepolia..."
                        );

                        // Create wallet for the user on Base Sepolia chain
                        // await createWallet({ chainId: 84532 }); // Base Sepolia

                        console.log(
                            "[AuthContext] ✅ Wallet created successfully on Base Sepolia"
                        );

                        // Wait a bit for wallet to be fully initialized
                        await new Promise((resolve) =>
                            setTimeout(resolve, 2000)
                        );
                    } else {
                        console.log(
                            "[AuthContext] Wallet already exists:",
                            wallets[0].address
                        );
                    }

                    // Now sync with backend (wallet should exist)
                    await syncBackendAuth();
                } catch (error) {
                    console.error(
                        "[AuthContext] Error setting up user:",
                        error
                    );
                    // Still try to sync even if wallet creation failed
                    await syncBackendAuth().catch((syncError) => {
                        console.error(
                            "[AuthContext] Failed to sync backend auth:",
                            syncError
                        );
                    });
                }
            };

            setupUser();
        }
    }, [authenticated, privyUser, ready, token, syncBackendAuth, createWallet]);

    // Watch for wallet creation and update backend when wallet appears
    useEffect(() => {
        if (!authenticated || !privyUser || !token) return;

        console.log(
            "[AuthContext] Wallet check - wallets array:",
            wallets.length,
            "wallets"
        );

        const walletAddress = getWalletAddress(privyUser, wallets);
        console.log("[AuthContext] Current wallet address:", walletAddress);
        console.log(
            "[AuthContext] User wallet address in DB:",
            user?.walletAddress
        );

        // If wallet exists and user doesn't have it in backend yet, update
        if (walletAddress && user && !user.walletAddress) {
            console.log(
                "[AuthContext] ✅ Wallet created! Updating backend with address:",
                walletAddress
            );

            // Resync to update wallet address in backend
            syncBackendAuth()
                .then(async () => {
                    console.log(
                        "[AuthContext] ✅ Backend updated with wallet address"
                    );

                    // Refresh user data to confirm wallet was saved
                    const result = await getCurrentUser(token);
                    if (result.success && result.data) {
                        setUser(result.data);
                        console.log(
                            "[AuthContext] ✅ User data refreshed, wallet in DB:",
                            result.data.walletAddress
                        );
                    } else {
                        console.error(
                            "[AuthContext] Error refreshing user:",
                            result.error
                        );
                    }
                })
                .catch((error) => {
                    console.error(
                        "[AuthContext] Failed to update wallet address:",
                        error
                    );
                });
        }
    }, [wallets, authenticated, privyUser, token, user, syncBackendAuth]);

    const logout = useCallback(async () => {
        try {
            setLoading(true);

            // Logout from backend
            if (token) {
                const result = await apiLogout(token);
                if (!result.success) {
                    console.error("Error logging out from backend:", result.error);
                }
            }

            // Logout from Privy
            await privyLogout();

            // Clear local state
            localStorage.removeItem("authToken");
            deleteCookie("authToken");
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    }, [token, privyLogout]);

    const refreshUser = useCallback(async () => {
        if (!token) return;

        const result = await getCurrentUser(token);
        if (result.success && result.data) {
            setUser(result.data);
        } else {
            console.error("Error refreshing user:", result.error);
            // If token is invalid, logout
            await logout();
        }
    }, [token, logout]);

    const value: AuthContextType = {
        user,
        token,
        loading: loading || !ready,
        isAuthenticated,
        login,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
