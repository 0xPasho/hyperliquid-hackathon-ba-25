import { prisma } from "../../lib/prisma";
import { generateToken } from "../../utils/jwt";
import { generateRandomUsername } from "../../utils/username-generator";

export interface LoginData {
    idToken: string;
    privyUserId: string; // Privy user ID - primary identifier
    walletAddress?: string | null; // Optional - may not exist for social login
    email?: string | null;
    name?: string | null;
    profileImage?: string | null;
    authProvider: string;
}

export class AuthService {
    /**
     * Get a random default profile image
     */
    private getRandomDefaultAvatar(): string {
        const avatarCount = 71; // We have avatar-1.png through avatar-71.png
        const randomNum = Math.floor(Math.random() * avatarCount) + 1;
        return `/default-images/avatar-${randomNum}.png`;
    }

    async login(data: LoginData) {
        const { idToken, privyUserId, walletAddress, email, name, profileImage, authProvider } = data;

        // Check if user exists by Privy ID (primary identifier)
        let user = await prisma.user.findUnique({
            where: { privyId: privyUserId },
        });

        if (user) {
            // Generate username if user doesn't have one and none is provided
            const updatedName = name || user.name || generateRandomUsername();

            // Update existing user with latest info
            user = await prisma.user.update({
                where: { privyId: privyUserId },
                data: {
                    email: email || user.email,
                    name: updatedName,
                    profileImage: profileImage || user.profileImage,
                    authProvider,
                    // Update wallet address if provided (user may have linked wallet)
                    walletAddress: walletAddress ? walletAddress.toLowerCase() : user.walletAddress,
                    updatedAt: new Date(),
                },
            });
        } else {
            // Generate random username if no name provided
            const username = name ?? generateRandomUsername();

            // Create new user with random default avatar if no profile image provided
            user = await prisma.user.create({
                data: {
                    privyId: privyUserId, // Privy user ID - primary identifier
                    walletAddress: walletAddress ? walletAddress.toLowerCase() : null,
                    email: email ?? null,
                    name: username,
                    profileImage: profileImage ?? this.getRandomDefaultAvatar(),
                    authProvider,
                },
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            walletAddress: user.walletAddress || privyUserId, // Use Privy ID if no wallet
        });

        return {
            user,
            token,
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "30d",
        };
    }

    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    async getUserByWallet(walletAddress: string) {
        const user = await prisma.user.findUnique({
            where: { walletAddress: walletAddress.toLowerCase() },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    async updateProfile(
        userId: string,
        data: {
            name?: string;
            bio?: string;
            profileImage?: string;
            headerImage?: string;
            websiteUrl?: string;
            twitterUrl?: string;
            discordUrl?: string;
            telegramUrl?: string;
        }
    ) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });

        return user;
    }

    async logout(userId: string) {
        // Optional: Implement token blacklist or session management
        // For now, just return success
        return { success: true };
    }
}

export const authService = new AuthService();
