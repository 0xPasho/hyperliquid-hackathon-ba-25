export interface Project {
    id: string;
    title: string;
    description?: string;
    instructions?: string;
    projectData: Record<string, unknown>;
    tags?: string[];
    websiteUrl?: string;
    twitterUrl?: string;
    discordUrl?: string;
    headerImage?: string;
    thumbnailImage?: string;
    isVerified?: boolean;
    isPublic?: boolean;
    isMultiplayer?: boolean | null;
    minPlayers?: number | null;
    maxPlayers?: number | null;
    gameMode?: number | null; // 0=WinnerTakesAll, 1=FreeForAll, 2=ScoreBased
    createdAt: Date;
    updatedAt: Date;
    userId?: string;
    user?: User;
    _count?: {
        views?: number;
        likes?: number;
        comments?: number;
    };
}

export interface User {
    id: string;
    walletAddress?: string; // Optional - users can link wallet later
    email?: string;
    name?: string;
    bio?: string;
    profileImage?: string;
    headerImage?: string;
    websiteUrl?: string;
    twitterUrl?: string;
    discordUrl?: string;
    telegramUrl?: string;
    authProvider: string;
    privyId?: string; // Privy user ID - primary identifier
    isVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    count?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

export interface AuthResponse {
    user: User;
    token: string;
    expiresIn: string;
}

export interface LoginRequest {
    idToken: string;
    privyUserId: string; // Privy user ID - primary identifier
    walletAddress?: string; // Optional - may not exist for social login
    email?: string;
    name?: string;
    profileImage?: string;
    authProvider: string;
}

export interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    projectId: string;
    userId: string;
    user: User;
}

export interface ProjectStats {
    likeCount: number;
    commentCount: number;
    viewCount: number;
    isLiked: boolean;
}
