import { Request, Response } from "express";
import { authService } from "./auth.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { verifyPrivyToken } from "../../lib/privy.client";
import { validateLoginRequest } from "./auth.validation";
import { ZodError } from "zod";

export class AuthController {
    async login(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body with Zod
            let validatedData;
            try {
                validatedData = validateLoginRequest(req.body);
            } catch (error) {
                if (error instanceof ZodError) {
                    const errorMessages = error.errors.map(err =>
                        `${err.path.join('.')}: ${err.message}`
                    ).join(', ');
                    console.error('[Auth Controller] Validation failed:', errorMessages);
                    res.status(400).json({
                        success: false,
                        error: `Validation failed: ${errorMessages}`,
                    });
                    return;
                }
                throw error;
            }

            const {
                idToken,
                privyUserId,
                walletAddress,
                email,
                name,
                profileImage,
                authProvider,
            } = validatedData;

            // All fields are validated by Zod schema

            // Verify the Privy token before processing login
            console.log('[Auth Controller] Verifying Privy token...');
            let verifiedClaims;
            try {
                verifiedClaims = await verifyPrivyToken(idToken);
                console.log('[Auth Controller] Token verified successfully');
            } catch (error) {
                console.error('[Auth Controller] Token verification failed:', error);
                res.status(401).json({
                    success: false,
                    error: "Invalid or expired authentication token",
                });
                return;
            }

            // Verify that the token's user ID matches the provided user ID
            if (verifiedClaims.userId !== privyUserId) {
                console.error('[Auth Controller] User ID mismatch:', {
                    provided: privyUserId,
                    verified: verifiedClaims.userId,
                });
                res.status(401).json({
                    success: false,
                    error: "Authentication token does not match provided user ID",
                });
                return;
            }

            // Token is verified, proceed with login using verified data
            const result = await authService.login({
                idToken,
                privyUserId: verifiedClaims.userId, // Use verified user ID
                walletAddress,
                email,
                name,
                profileImage,
                authProvider,
            });

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            });
        }
    }

    async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
                return;
            }

            const user = await authService.getUserById(req.user.userId);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            console.error("Get current user error:", error);
            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            });
        }
    }

    async getUserByWallet(req: Request, res: Response): Promise<void> {
        try {
            const { address } = req.params;

            if (!address) {
                res.status(400).json({
                    success: false,
                    error: "Wallet address is required",
                });
                return;
            }

            const user: any = await authService.getUserByWallet(address);

            // Return only public information
            const publicUser = {
                id: user.id,
                walletAddress: user.walletAddress,
                name: user.name,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
            };

            res.status(200).json({
                success: true,
                data: publicUser,
            });
        } catch (error) {
            if (error instanceof Error && error.message === "User not found") {
                res.status(404).json({
                    success: false,
                    error: "User not found",
                });
                return;
            }

            console.error("Get user by wallet error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }

    async updateProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
                return;
            }

            const {
                name,
                bio,
                profileImage,
                headerImage,
                websiteUrl,
                twitterUrl,
                discordUrl,
                telegramUrl,
            } = req.body;

            const user = await authService.updateProfile(req.user.userId, {
                name,
                bio,
                profileImage,
                headerImage,
                websiteUrl,
                twitterUrl,
                discordUrl,
                telegramUrl,
            });

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            console.error("Update profile error:", error);
            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            });
        }
    }

    async logout(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
                return;
            }

            await authService.logout(req.user.userId);

            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (error) {
            console.error("Logout error:", error);
            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            });
        }
    }
}

export const authController = new AuthController();
