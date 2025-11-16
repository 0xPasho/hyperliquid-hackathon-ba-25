"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDistance } from "date-fns";
import {
    Globe,
    Copy,
    Check,
    Share,
    MoreHorizontal,
    Settings,
    UserPlus,
    UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Project } from "@/lib/types";
import { AppSidebar } from "@/modules/home/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ProfileHeader } from "@/components/layout/ProfileHeader";
import Link from "next/link";
import {
    fetchUser,
    fetchUserProjects,
    fetchUserStats,
    followUser,
    unfollowUser,
    checkFollowStatus,
    trackProfileView,
    getProfileViewCount,
    fetchUserGameActivities,
} from "@/lib/api";
import { FaDiscord, FaTwitter, FaTelegram } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { FollowModal } from "@/components/FollowModal";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { toast } from "sonner";

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser, isAuthenticated } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [stats, setStats] = useState({
        projectCount: 0,
        followerCount: 0,
        followingCount: 0,
        totalEarnings: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("created");
    const [copied, setCopied] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [viewCount, setViewCount] = useState(0);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [gameActivities, setGameActivities] = useState<any[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityOffset, setActivityOffset] = useState(0);
    const [hasMoreActivities, setHasMoreActivities] = useState(true);

    const isOwnProfile = isAuthenticated && currentUser?.id === params.id;

    useEffect(() => {
        async function loadUserData() {
            try {
                setLoading(true);
                setError(null);
                const userId = params.id as string;

                // Validate user ID
                if (!userId || userId === "undefined" || userId === "null") {
                    setError("Invalid user ID");
                    setLoading(false);
                    return;
                }

                const token = localStorage.getItem("authToken");

                const [userData, projectsData, statsData, viewCountData] =
                    await Promise.all([
                        fetchUser(userId),
                        fetchUserProjects(userId, 1, 20, token || undefined),
                        fetchUserStats(userId),
                        getProfileViewCount(userId),
                    ]);

                setUser(userData);
                setProjects(projectsData.data);
                setStats(statsData);
                setViewCount(viewCountData);

                // Check follow status if authenticated and not own profile
                if (isAuthenticated && !isOwnProfile && currentUser) {
                    const token = localStorage.getItem("authToken");
                    if (token) {
                        const followStatus = await checkFollowStatus(
                            userId,
                            token
                        );
                        setIsFollowing(followStatus);
                    }
                }

                // Track profile view (only if not own profile)
                if (!isOwnProfile) {
                    // Generate or get session ID from localStorage
                    let sessionId = localStorage.getItem("sessionId");
                    if (!sessionId) {
                        sessionId = `session_${Date.now()}_${Math.random()
                            .toString(36)
                            .substring(7)}`;
                        localStorage.setItem("sessionId", sessionId);
                    }

                    // Track the view
                    await trackProfileView(userId, sessionId);

                    // Refresh view count after tracking
                    const newViewCount = await getProfileViewCount(userId);
                    setViewCount(newViewCount);
                }
            } catch (err) {
                console.error("Error loading user data:", err);
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "Failed to load user profile";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }

        if (params.id) {
            loadUserData();
        }
    }, [params.id, isAuthenticated, isOwnProfile, currentUser]);

    const handleCopyAddress = () => {
        if (user?.walletAddress) {
            // Copy the full wallet address (not truncated)
            const fullAddress = user.walletAddress;
            navigator.clipboard.writeText(fullAddress);
            toast.success("Wallet address copied!");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShareProfile = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: user?.name || "User Profile",
                    text: `Check out ${user?.name || "this user"}'s profile!`,
                    url: window.location.href,
                })
                .catch((err) => console.error("Error sharing:", err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handleFollowToggle = async () => {
        if (!isAuthenticated || !user) return;

        const token = localStorage.getItem("authToken");
        if (!token) return;

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(user.id, token);
                setIsFollowing(false);
                setStats((prev) => ({
                    ...prev,
                    followerCount: prev.followerCount - 1,
                }));
            } else {
                await followUser(user.id, token);
                setIsFollowing(true);
                setStats((prev) => ({
                    ...prev,
                    followerCount: prev.followerCount + 1,
                }));
            }
        } catch (err) {
            console.error("Error toggling follow:", err);
        } finally {
            setFollowLoading(false);
        }
    };

    // Load game activities when activity tab is active
    useEffect(() => {
        async function loadActivities() {
            if (
                activeTab === "activity" &&
                user &&
                gameActivities.length === 0 &&
                !activityLoading
            ) {
                setActivityLoading(true);
                try {
                    const result = await fetchUserGameActivities(
                        user.id,
                        10,
                        0
                    );
                    setGameActivities(result.activities);
                    setHasMoreActivities(result.pagination.hasMore);
                    setActivityOffset(10);
                } catch (error) {
                    console.error("Error loading activities:", error);
                } finally {
                    setActivityLoading(false);
                }
            }
        }

        loadActivities();
    }, [activeTab, user]);

    // Load more activities
    const loadMoreActivities = async () => {
        if (!user || activityLoading) return;

        setActivityLoading(true);
        try {
            const result = await fetchUserGameActivities(
                user.id,
                10,
                activityOffset
            );
            setGameActivities((prev) => [...prev, ...result.activities]);
            setHasMoreActivities(result.pagination.hasMore);
            setActivityOffset((prev) => prev + 10);
        } catch (error) {
            console.error("Error loading more activities:", error);
        } finally {
            setActivityLoading(false);
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (loading) {
        return (
            <SidebarProvider defaultOpen={false}>
                <div className="flex min-h-screen w-full bg-background">
                    <AppSidebar />
                    <SidebarInset className="flex-1">
                        {/* Banner Skeleton */}
                        <div className="relative h-[350px] bg-gray-700 animate-pulse">
                            <ProfileHeader showBack={true} backPath="/" />
                        </div>

                        {/* Profile Section Skeleton */}
                        <div className="w-full">
                            <div className="max-w-[1280px] mx-auto px-6 min-w-0">
                                {/* Avatar Skeleton */}
                                <div className="relative -mt-20 mb-4">
                                    <div className="w-[140px] h-[140px] rounded-full bg-gray-700 animate-pulse border-[6px] border-background" />
                                </div>

                                {/* User Info and Actions Skeleton */}
                                <div className="flex items-start justify-between mb-6 flex-wrap gap-4 w-full">
                                    <div className="flex-1 min-w-0 max-w-full">
                                        {/* Name Skeleton */}
                                        <div className="h-10 w-64 bg-gray-700 rounded animate-pulse mb-3" />

                                        {/* Wallet and Join Date Skeleton */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-5 w-40 bg-gray-700 rounded animate-pulse" />
                                            <div className="h-5 w-32 bg-gray-700 rounded animate-pulse" />
                                        </div>

                                        {/* Bio Skeleton */}
                                        <div className="space-y-2 mb-4">
                                            <div className="h-4 w-full max-w-xl bg-gray-700 rounded animate-pulse" />
                                            <div className="h-4 w-3/4 max-w-lg bg-gray-700 rounded animate-pulse" />
                                        </div>

                                        {/* Social Links Skeleton */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse" />
                                            <div className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse" />
                                            <div className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse" />
                                        </div>
                                    </div>

                                    {/* Action Buttons Skeleton */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse" />
                                        <div className="h-10 w-32 rounded-lg bg-gray-700 animate-pulse" />
                                    </div>
                                </div>

                                {/* Stats Bar Skeleton */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 pb-8 border-b border-border w-full">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i}>
                                            <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mb-2" />
                                            <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
                                        </div>
                                    ))}
                                </div>

                                {/* Tabs Navigation Skeleton */}
                                <div className="flex items-center gap-8 mb-8 border-b border-border w-full pb-4">
                                    <div className="h-6 w-24 bg-gray-700 rounded animate-pulse" />
                                    <div className="h-6 w-24 bg-gray-700 rounded animate-pulse" />
                                </div>

                                {/* Projects Grid Skeleton */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-12">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                        <div key={i} className="space-y-3">
                                            {/* Thumbnail Skeleton */}
                                            <div className="relative aspect-square bg-gray-700 animate-pulse rounded-xl" />
                                            {/* Title Skeleton */}
                                            <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
                                            {/* Creator Skeleton */}
                                            <div className="h-3 w-3/4 bg-gray-700 rounded animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    if (error || !user) {
        return (
            <SidebarProvider defaultOpen={false}>
                <div className="flex min-h-screen w-full bg-background">
                    <AppSidebar />
                    <SidebarInset className="flex-1">
                        {/* Banner with overlayed header for error state */}
                        <div className="relative h-[200px] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
                            <ProfileHeader showBack={true} backPath="/" />
                        </div>
                        <div className="container mx-auto px-4 py-8 max-w-7xl">
                            <div className="bg-card border border-border rounded-lg p-8 text-center">
                                <h2 className="text-2xl font-bold text-foreground mb-4">
                                    User Not Found
                                </h2>
                                <p className="text-muted-foreground">
                                    {error || "This user does not exist."}
                                </p>
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    const userInitial = user.name
        ? user.name.charAt(0).toUpperCase()
        : user.walletAddress?.charAt(0).toUpperCase() || "?";

    const tabs = [
        { id: "created", label: "Created", count: stats.projectCount },
        { id: "activity", label: "Activity" },
    ];

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />
                <SidebarInset className="flex-1">
                    {/* Banner with overlayed header */}
                    <div className="relative h-[350px] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
                        {user.headerImage && (
                            <img
                                src={user.headerImage}
                                alt="Profile header"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

                        {/* Overlay Header */}
                        <ProfileHeader showBack={true} backPath="/" />
                    </div>

                    {/* Profile Section */}
                    <div className="w-full">
                        <div className="max-w-[1280px] mx-auto px-6 min-w-0">
                            {/* Avatar overlapping banner */}
                            <div className="relative -mt-20 mb-4">
                                <Avatar className="w-[140px] h-[140px] border-[6px] border-background bg-card ring-2 ring-background/50">
                                    <AvatarImage
                                        src={user.profileImage || ""}
                                        alt="User avatar"
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white text-4xl font-bold">
                                        {userInitial}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            {/* User Info and Actions */}
                            <div className="flex items-start justify-between mb-6 flex-wrap gap-4 w-full">
                                <div className="flex-1 min-w-0 max-w-full">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h1 className="text-4xl font-bold text-foreground">
                                            {user.name || "Anonymous User"}
                                        </h1>
                                        {user.isVerified && (
                                            <VerifiedBadge size="lg" />
                                        )}
                                    </div>

                                    {/* Wallet Address and Join Date */}
                                    <div className="flex items-center gap-3 mb-4">
                                        {user.walletAddress && (
                                            <button
                                                onClick={handleCopyAddress}
                                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
                                            >
                                                <span className="text-sm font-mono">
                                                    {truncateAddress(
                                                        user.walletAddress
                                                    )}
                                                </span>
                                                {copied ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4 group-hover:text-foreground" />
                                                )}
                                            </button>
                                        )}
                                        <span className="text-muted-foreground text-sm">
                                            Joined{" "}
                                            {formatDistance(
                                                new Date(user.createdAt),
                                                new Date(),
                                                { addSuffix: true }
                                            )}
                                        </span>
                                    </div>

                                    {/* Bio */}
                                    {user.bio && (
                                        <p className="text-sm text-muted-foreground max-w-2xl mb-4">
                                            {user.bio}
                                        </p>
                                    )}

                                    {/* Social Links */}
                                    <div className="flex items-center gap-2">
                                        {user.websiteUrl && (
                                            <a
                                                href={user.websiteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                                title="Website"
                                            >
                                                <Globe className="w-5 h-5 text-muted-foreground" />
                                            </a>
                                        )}
                                        {user.twitterUrl && (
                                            <a
                                                href={user.twitterUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                                title="Twitter"
                                            >
                                                <FaTwitter className="w-5 h-5 text-muted-foreground" />
                                            </a>
                                        )}
                                        {user.discordUrl && (
                                            <a
                                                href={user.discordUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                                title="Discord"
                                            >
                                                <FaDiscord className="w-5 h-5 text-muted-foreground" />
                                            </a>
                                        )}
                                        {user.telegramUrl && (
                                            <a
                                                href={user.telegramUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                                title="Telegram"
                                            >
                                                <FaTelegram className="w-5 h-5 text-muted-foreground" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-lg"
                                        onClick={handleShareProfile}
                                        title="Share profile"
                                    >
                                        <Share className="w-4 h-4" />
                                    </Button>
                                    {isOwnProfile ? (
                                        <Button
                                            variant="outline"
                                            className="rounded-lg"
                                            onClick={() =>
                                                router.push(
                                                    `/users/${user.id}/edit`
                                                )
                                            }
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Edit Profile
                                        </Button>
                                    ) : (
                                        <Button
                                            variant={
                                                isFollowing
                                                    ? "outline"
                                                    : "default"
                                            }
                                            className="rounded-lg"
                                            onClick={handleFollowToggle}
                                            disabled={
                                                followLoading ||
                                                !isAuthenticated
                                            }
                                        >
                                            {isFollowing ? (
                                                <>
                                                    <UserMinus className="w-4 h-4 mr-2" />
                                                    Unfollow
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Follow
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Stats Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 pb-8 border-b border-border w-full">
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                                        Projects
                                    </div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {stats.projectCount}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFollowersModal(true)}
                                    className="text-left hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer"
                                >
                                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                                        Followers
                                    </div>
                                    <div className="text-2xl font-bold text-foreground hover:text-blue-400 transition-colors">
                                        {stats.followerCount}
                                    </div>
                                </button>
                                <button
                                    onClick={() => setShowFollowingModal(true)}
                                    className="text-left hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer"
                                >
                                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                                        Following
                                    </div>
                                    <div className="text-2xl font-bold text-foreground hover:text-blue-400 transition-colors">
                                        {stats.followingCount}
                                    </div>
                                </button>
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                                        Total Views
                                    </div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {viewCount.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                                        All Time Earnings
                                    </div>
                                    <div className="text-2xl font-bold text-foreground">
                                        ${(stats.totalEarnings || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex items-center gap-8 mb-8 border-b border-border w-full">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-4 text-sm font-medium transition-colors relative cursor-pointer ${
                                            activeTab === tab.id
                                                ? "text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {tab.label}
                                        {tab.count !== undefined && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {tab.count}
                                            </span>
                                        )}
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Projects Grid */}
                            {activeTab === "created" && (
                                <div className="w-full">
                                    {projects.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                                <svg
                                                    className="w-12 h-12 text-muted-foreground"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                                    />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                                No projects yet
                                            </h3>
                                            <p className="text-muted-foreground">
                                                This user hasn&apos;t created
                                                any projects.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-12">
                                            {projects.map((project) => (
                                                <Link
                                                    key={project.id}
                                                    href={`/game/${project.id}`}
                                                >
                                                    <div className="group cursor-pointer">
                                                        {/* Project Thumbnail 
                                                        className="absolute inset-0 "
                                                        */}
                                                        <div className="relative aspect-square bg-gradient-to-b from-black/40 via-black/20 to-black/60 rounded-xl overflow-hidden mb-3">
                                                            <img
                                                                src={
                                                                    project.thumbnailImage ||
                                                                    project.headerImage ||
                                                                    "/default-project-image.jpg"
                                                                }
                                                                alt={
                                                                    project.title
                                                                }
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                                                        </div>

                                                        {/* Project Info */}
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1">
                                                                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                                    {
                                                                        project.title
                                                                    }
                                                                </h3>
                                                                {project.isVerified && (
                                                                    <VerifiedBadge size="sm" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <span>by</span>
                                                                <span className="font-medium">
                                                                    {user.name ||
                                                                        "Anonymous"}
                                                                </span>
                                                                {user.isVerified && (
                                                                    <VerifiedBadge size="sm" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Activity Tab */}
                            {activeTab === "activity" && (
                                <div className="w-full space-y-4">
                                    {activityLoading &&
                                    gameActivities.length === 0 ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : gameActivities.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground">
                                                No game activity yet
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {gameActivities.map(
                                                    (activity) => (
                                                        <div
                                                            key={activity.id}
                                                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-4 flex-1">
                                                                {/* Win/Loss Indicator */}
                                                                <div
                                                                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                                                        activity.type ===
                                                                        "WIN_GAME"
                                                                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                                                            : activity.type ===
                                                                              "LOSE_GAME"
                                                                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                                                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                                    }`}
                                                                >
                                                                    {activity.type ===
                                                                    "WIN_GAME" ? (
                                                                        <svg
                                                                            className="w-5 h-5"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M5 13l4 4L19 7"
                                                                            />
                                                                        </svg>
                                                                    ) : activity.type ===
                                                                      "LOSE_GAME" ? (
                                                                        <svg
                                                                            className="w-5 h-5"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M6 18L18 6M6 6l12 12"
                                                                            />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg
                                                                            className="w-5 h-5"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                </div>

                                                                {/* Game Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-medium">
                                                                            {activity.type ===
                                                                            "WIN_GAME"
                                                                                ? "Won"
                                                                                : activity.type ===
                                                                                  "LOSE_GAME"
                                                                                ? "Lost"
                                                                                : "Completed"}
                                                                        </span>
                                                                        {activity
                                                                            .room
                                                                            ?.project && (
                                                                            <Link
                                                                                href={`/game/${activity.room.project.id}`}
                                                                                className="text-primary hover:underline truncate"
                                                                            >
                                                                                {
                                                                                    activity
                                                                                        .room
                                                                                        .project
                                                                                        .title
                                                                                }
                                                                            </Link>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                        {activity
                                                                            .room
                                                                            ?.entryFee && (
                                                                            <span className="font-medium">
                                                                                {
                                                                                    activity
                                                                                        .room
                                                                                        .entryFee
                                                                                }{" "}
                                                                                {activity
                                                                                    .room
                                                                                    .tokenSymbol || "tokens"}
                                                                            </span>
                                                                        )}
                                                                        <span>
                                                                            •
                                                                        </span>
                                                                        <span>
                                                                            {formatDistance(
                                                                                new Date(
                                                                                    activity.createdAt
                                                                                ),
                                                                                new Date(),
                                                                                {
                                                                                    addSuffix:
                                                                                        true,
                                                                                }
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Game Thumbnail */}
                                                            {activity.room
                                                                ?.project
                                                                ?.thumbnailImage && (
                                                                <img
                                                                    src={
                                                                        activity
                                                                            .room
                                                                            .project
                                                                            .thumbnailImage
                                                                    }
                                                                    alt={
                                                                        activity
                                                                            .room
                                                                            .project
                                                                            .title
                                                                    }
                                                                    className="w-12 h-12 rounded object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            {/* View More Button */}
                                            {hasMoreActivities && (
                                                <div className="flex justify-center pt-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={
                                                            loadMoreActivities
                                                        }
                                                        disabled={
                                                            activityLoading
                                                        }
                                                    >
                                                        {activityLoading
                                                            ? "Loading..."
                                                            : "View More"}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </SidebarInset>
            </div>

            {/* Modals */}
            {user && (
                <>
                    <FollowModal
                        isOpen={showFollowersModal}
                        onClose={() => setShowFollowersModal(false)}
                        userId={user.id}
                        type="followers"
                        initialCount={stats.followerCount}
                    />
                    <FollowModal
                        isOpen={showFollowingModal}
                        onClose={() => setShowFollowingModal(false)}
                        userId={user.id}
                        type="following"
                        initialCount={stats.followingCount}
                    />
                </>
            )}
        </SidebarProvider>
    );
}
