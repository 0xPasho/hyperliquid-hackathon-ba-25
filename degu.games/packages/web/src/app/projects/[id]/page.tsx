"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Play,
    Gamepad2,
    MessageCircle,
    MoreHorizontal,
    ChevronDown,
    ChevronUp,
    Globe,
    Heart,
    Copy,
    Eye,
    Trash2,
    Pencil,
    Settings,
    FileText,
    Info,
    Grid3x3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDistance } from "date-fns";
import { Project, Comment, ProjectStats } from "@/lib/types";
import {
    fetchProject,
    updateProject,
    uploadProjectHeaderImage,
    getProjectsByUserId,
    uploadProjectThumbnailImage,
} from "@/lib/api";
import {
    getComments,
    createComment,
    deleteComment,
    toggleLike,
    trackView,
    getProjectStats,
    getOrCreateSessionId,
} from "@/lib/interactions-api";
import { AppSidebar } from "@/modules/home/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { FaDiscord, FaTwitter } from "react-icons/fa";
import { ProfileHeader } from "@/components/layout/ProfileHeader";
import { useAuth } from "@/hooks/useAuth";
import { EditMode } from "./edit-mode";
import { RoomLobby } from "@/components/rooms/RoomLobby";
import {
    getRoomsByProject,
    createRoom,
    joinRoom,
    RoomStatus,
    Room,
} from "@/lib/room-api";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { GameLeaderboard } from "@/components/game/GameLeaderboard";

const SCRATCH_GUI_URL =
    process.env.NEXT_PUBLIC_SCRATCH_GUI_URL || "http://localhost:8601";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFullInstructions, setShowFullInstructions] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [copied, setCopied] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [stats, setStats] = useState<ProjectStats>({
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        isLiked: false,
    });
    const [creatorProjects, setCreatorProjects] = useState<Project[]>([]);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedInstructions, setEditedInstructions] = useState("");
    const [editedDescription, setEditedDescription] = useState("");
    const [editedTags, setEditedTags] = useState<string[]>([]);
    const [editedWebsiteUrl, setEditedWebsiteUrl] = useState("");
    const [editedTwitterUrl, setEditedTwitterUrl] = useState("");
    const [editedDiscordUrl, setEditedDiscordUrl] = useState("");
    const [editedIsPublic, setEditedIsPublic] = useState(false);
    const [editedIsMultiplayer, setEditedIsMultiplayer] = useState<
        boolean | null
    >(null);
    const [editedMinPlayers, setEditedMinPlayers] = useState<number | null>(
        null
    );
    const [editedMaxPlayers, setEditedMaxPlayers] = useState<number | null>(
        null
    );
    const [editedGameMode, setEditedGameMode] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLike = async () => {
        if (!isAuthenticated) {
            alert("Please log in to like this project");
            return;
        }

        const result = await toggleLike(params.id as string);
        if (!result.success || !result.data) {
            alert(result.error || "Failed to like project. Please try again.");
            return;
        }

        setStats((prev) => ({
            ...prev,
            isLiked: result.data.liked,
            likeCount: result.data.liked
                ? prev.likeCount + 1
                : prev.likeCount - 1,
        }));
    };

    const handlePostComment = async () => {
        if (!isAuthenticated) {
            alert("Please log in to comment");
            return;
        }

        if (!commentText.trim()) return;

        setSubmittingComment(true);
        const result = await createComment(
            params.id as string,
            commentText.trim()
        );
        setSubmittingComment(false);

        if (!result.success || !result.data) {
            alert(result.error || "Failed to post comment. Please try again.");
            return;
        }

        setComments((prev) => [result.data, ...prev]);
        setStats((prev) => ({
            ...prev,
            commentCount: prev.commentCount + 1,
        }));
        setCommentText("");
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        const result = await deleteComment(commentId);
        if (!result.success) {
            alert(
                result.error || "Failed to delete comment. Please try again."
            );
            return;
        }

        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setStats((prev) => ({
            ...prev,
            commentCount: prev.commentCount - 1,
        }));
    };

    const handleEnterEditMode = () => {
        if (!project) return;

        // Authorization check - only project owner can edit
        if (!isAuthenticated) {
            // Store return URL and redirect to home
            const currentPath = window.location.pathname;
            localStorage.setItem("returnUrl", currentPath);
            router.push("/");
            return;
        }

        if (user?.id !== project.userId) {
            alert(
                "You don't have permission to edit this project. Only the project owner can make changes."
            );
            return;
        }

        setEditedTitle(project.title);
        setEditedInstructions(project.instructions || "");
        setEditedDescription(project.description || "");
        setEditedTags(project.tags || []);
        setEditedWebsiteUrl(project.websiteUrl || "");
        setEditedTwitterUrl(project.twitterUrl || "");
        setEditedDiscordUrl(project.discordUrl || "");
        setEditedIsPublic(project.isPublic || false);
        setEditedIsMultiplayer(project.isMultiplayer ?? null);
        setEditedMinPlayers(project.minPlayers ?? null);
        setEditedMaxPlayers(project.maxPlayers ?? null);
        // Default to WinnerTakesAll (0) if no game mode is set
        setEditedGameMode(project.gameMode ?? 0);
        setIsEditMode(true);
    };

    const handleSaveEdits = async () => {
        if (!project) return;

        // Authorization check - only project owner can save
        if (!isAuthenticated || user?.id !== project.userId) {
            alert("You don't have permission to edit this project.");
            setIsEditMode(false);
            return;
        }

        // Validate required fields if trying to make public
        if (editedIsPublic) {
            if (!editedTitle) {
                alert("Title is required to make the project public");
                return;
            }
            if (!editedDescription) {
                alert("Description is required to make the project public");
                return;
            }
            if (!project.headerImage && !project.thumbnailImage) {
                alert(
                    "At least one image (header or thumbnail) is required to make the project public"
                );
                return;
            }
            // Validate multiplayer settings
            if (editedIsMultiplayer === null) {
                alert("Please select whether this is a multiplayer game");
                return;
            }
            if (editedIsMultiplayer === true) {
                if (editedMinPlayers === null || editedMinPlayers < 2) {
                    alert(
                        "Minimum players must be at least 2 for multiplayer games"
                    );
                    return;
                }
                if (editedMaxPlayers === null || editedMaxPlayers < 2) {
                    alert(
                        "Maximum players must be at least 2 for multiplayer games"
                    );
                    return;
                }
                if (editedMinPlayers > editedMaxPlayers) {
                    alert(
                        "Minimum players cannot be greater than maximum players"
                    );
                    return;
                }
            }
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("authToken");
            const updatedProject = await updateProject(
                project.id,
                {
                    title: editedTitle,
                    instructions: editedInstructions,
                    description: editedDescription,
                    tags: editedTags,
                    websiteUrl: editedWebsiteUrl,
                    twitterUrl: editedTwitterUrl,
                    discordUrl: editedDiscordUrl,
                    isPublic: editedIsPublic,
                    isMultiplayer: editedIsMultiplayer,
                    minPlayers:
                        editedIsMultiplayer === true ? editedMinPlayers : null,
                    maxPlayers:
                        editedIsMultiplayer === true ? editedMaxPlayers : null,
                    gameMode: editedGameMode, // Always save gameMode
                },
                token || undefined
            );

            setProject(updatedProject);
            setIsEditMode(false);
        } catch (error) {
            console.error("Error saving edits:", error);
            alert("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
    };

    const handleHeaderImageUpload = async (file: File) => {
        if (!project) return;

        try {
            const token = localStorage.getItem("authToken");
            const result = await uploadProjectHeaderImage(
                project.id,
                file,
                token || undefined
            );
            // Update the local project state with the new image URL
            setProject(result.project);
        } catch (error) {
            console.error("Error uploading header image:", error);
            alert("Failed to upload header image");
        }
    };

    const handleThumbnailImageUpload = async (file: File) => {
        if (!project) return;

        try {
            const token = localStorage.getItem("authToken");
            const result = await uploadProjectThumbnailImage(
                project.id,
                file,
                token || undefined
            );
            // Update the local project state with the new image URL
            setProject(result.project);
        } catch (error) {
            console.error("Error uploading thumbnail image:", error);
            alert("Failed to upload thumbnail image");
        }
    };

    const handlePlayGame = async () => {
        if (!isAuthenticated || !user) {
            alert("Please log in to play");
            return;
        }

        if (!project) return;

        // Get all active rooms for this project
        const roomsResult = await getRoomsByProject(project.id, false);
        if (!roomsResult.success || !roomsResult.data) {
            alert(roomsResult.error || "Failed to load rooms");
            return;
        }

        const activeRooms = roomsResult.data.filter((r) =>
            [RoomStatus.WAITING, RoomStatus.READY, RoomStatus.PLAYING].includes(
                r.status
            )
        );

        // Check if user already has a room (as host)
        const userRoom = activeRooms.find((r) => r.hostId === user.id);
        if (userRoom) {
            // Send user to their own room
            router.push(`/rooms/${userRoom.id}`);
            return;
        }

        // Check if user is already in a room as a player
        const playerRoom = activeRooms.find((r) =>
            r.players?.some((p) => p.userId === user.id)
        );
        if (playerRoom) {
            // Send user to the room they're already in
            router.push(`/rooms/${playerRoom.id}`);
            return;
        }

        // Find the best room to join (one with the most players but not full)
        const joinableRooms = activeRooms.filter(
            (r) =>
                r.status === RoomStatus.WAITING &&
                r.currentPlayers < r.maxPlayers
        );

        if (joinableRooms.length > 0) {
            // Sort by most players (closest to being full)
            const bestRoom = joinableRooms.sort(
                (a, b) => b.currentPlayers - a.currentPlayers
            )[0];

            // Join the best room
            const token = localStorage.getItem("authToken");
            const joinResult = await joinRoom(
                bestRoom.id,
                user.id,
                user.walletAddress,
                undefined,
                token || undefined
            );

            if (!joinResult.success) {
                alert(joinResult.error || "Failed to join room");
                return;
            }

            // Navigate to the room
            router.push(`/rooms/${bestRoom.id}`);
            return;
        }

        // No available rooms, create a new one
        const token = localStorage.getItem("authToken");
        const newRoomResult = await createRoom(
            {
                projectId: project.id,
                hostId: user.id,
                maxPlayers: 1,
            },
            token || undefined
        );

        if (!newRoomResult.success || !newRoomResult.data) {
            alert(newRoomResult.error || "Failed to create room");
            return;
        }

        // Navigate to the new room
        router.push(`/rooms/${newRoomResult.data.id}`);
    };

    useEffect(() => {
        async function loadProjectData() {
            try {
                const projectId = params.id as string;
                const token = localStorage.getItem("authToken");

                // Load project, comments, and stats in parallel
                const [projectData, commentsResult, statsResult] =
                    await Promise.all([
                        fetchProject(projectId, token || undefined),
                        getComments(projectId),
                        getProjectStats(projectId),
                    ]);

                setProject(projectData);

                if (commentsResult.success && commentsResult.data) {
                    setComments(commentsResult.data);
                }

                if (statsResult.success && statsResult.data) {
                    setStats(statsResult.data);
                }

                // Load other projects from the same creator
                if (projectData.userId) {
                    try {
                        const otherProjects = await getProjectsByUserId(
                            projectData.userId,
                            {
                                excludeId: projectId,
                                isPublic: true,
                                limit: 6,
                            }
                        );
                        setCreatorProjects(otherProjects);
                    } catch (error) {
                        console.error("Error loading creator projects:", error);
                    }
                }

                // Track view (with anti-spam protection via session ID)
                const sessionId = getOrCreateSessionId();
                await trackView(projectId, sessionId);
            } catch (error) {
                console.error("Error loading project:", error);
            } finally {
                setLoading(false);
            }
        }
        loadProjectData();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!project) {
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
                                    Project Not Found
                                </h2>
                                <p className="text-muted-foreground">
                                    This project does not exist or has been
                                    removed.
                                </p>
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    const instructions = project.instructions || "No instructions added";
    const description =
        project.description ||
        "An exciting minigame built with Degu.Games blocks.";

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex min-h-screen w-full bg-background">
                {/* Sidebar */}
                <AppSidebar />

                {/* Main Content */}
                <SidebarInset className="flex-1 relative">
                    {/* Full-width Header - spans both panels */}
                    <div className="absolute top-0 left-0 right-0 z-50">
                        <ProfileHeader showBack={true} backPath="/" />
                    </div>

                    {/* Content - Two distinct panels */}
                    <div className="flex flex-col lg:flex-row h-auto lg:h-screen">
                        {/* Left Panel - Image (100vh, centered) */}
                        <div className="w-full lg:w-[45%] bg-card border-b lg:border-b-0 lg:border-r border-border flex items-center justify-center p-4 sm:p-8 min-h-[400px] lg:min-h-0 relative pt-16 lg:pt-0">
                            <div className="w-full max-w-[500px] aspect-square">
                                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
                                    {/* Background Image (thumbnail or header) */}
                                    <div className="absolute inset-0">
                                        <img
                                            src={
                                                project.thumbnailImage ||
                                                project.headerImage ||
                                                "/default-project-image.jpg"
                                            }
                                            alt={project.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button
                                            onClick={handlePlayGame}
                                            disabled={!isAuthenticated}
                                            className="w-20 h-20 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-transform group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Play
                                                className="w-10 h-10 text-white ml-1 group-hover:scale-110 transition-transform"
                                                fill="white"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Info (scrollable) */}
                        <div className="flex-1 bg-background overflow-y-auto relative">
                            {/* Banner - Desktop only (no header, it's at top level) */}
                            <div className="hidden lg:block relative h-[280px] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
                                {project.headerImage && (
                                    <img
                                        src={project.headerImage}
                                        alt="Project header"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}
                                {/* Gradient overlay that fades to background */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
                            </div>

                            <div className="max-w-[800px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-4 relative lg:-mt-24 z-10">
                                {isEditMode ? (
                                    <EditMode
                                        title={editedTitle}
                                        description={editedDescription}
                                        instructions={editedInstructions}
                                        tags={editedTags}
                                        websiteUrl={editedWebsiteUrl}
                                        twitterUrl={editedTwitterUrl}
                                        discordUrl={editedDiscordUrl}
                                        headerImage={project.headerImage}
                                        thumbnailImage={project.thumbnailImage}
                                        isPublic={editedIsPublic}
                                        isMultiplayer={editedIsMultiplayer}
                                        minPlayers={editedMinPlayers}
                                        maxPlayers={editedMaxPlayers}
                                        gameMode={editedGameMode}
                                        onTitleChange={setEditedTitle}
                                        onDescriptionChange={
                                            setEditedDescription
                                        }
                                        onInstructionsChange={
                                            setEditedInstructions
                                        }
                                        onTagsChange={setEditedTags}
                                        onWebsiteUrlChange={setEditedWebsiteUrl}
                                        onTwitterUrlChange={setEditedTwitterUrl}
                                        onDiscordUrlChange={setEditedDiscordUrl}
                                        onIsPublicChange={setEditedIsPublic}
                                        onIsMultiplayerChange={
                                            setEditedIsMultiplayer
                                        }
                                        onMinPlayersChange={setEditedMinPlayers}
                                        onMaxPlayersChange={setEditedMaxPlayers}
                                        onGameModeChange={setEditedGameMode}
                                        onHeaderImageUpload={
                                            handleHeaderImageUpload
                                        }
                                        onThumbnailImageUpload={
                                            handleThumbnailImageUpload
                                        }
                                        onSave={handleSaveEdits}
                                        onCancel={handleCancelEdit}
                                        saving={saving}
                                    />
                                ) : (
                                    <>
                                        <div className="space-y-0">
                                            {/* Title Row with Edit Button */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground break-words">
                                                        {project.title}
                                                    </h1>
                                                    {project.isVerified && (
                                                        <VerifiedBadge size="lg" />
                                                    )}
                                                </div>
                                                {user?.id ===
                                                    project.userId && (
                                                    <Button
                                                        onClick={
                                                            handleEnterEditMode
                                                        }
                                                        variant="outline"
                                                        className="flex-shrink-0"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        Settings
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Created By + Icons Row */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex itCreated byems-center gap-1 sm:gap-3 text-sm sm:text-base">
                                                    <span className="text-muted-foreground">
                                                        Created by
                                                    </span>
                                                    {project.userId ? (
                                                        <div className="flex items-center gap-1">
                                                            <Link
                                                                href={`/users/${project.userId}`}
                                                                className="text-foreground font-medium hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                {project.user
                                                                    ?.name ||
                                                                    "Anonymous Creator"}
                                                            </Link>
                                                            {project.user
                                                                ?.isVerified && (
                                                                <VerifiedBadge size="sm" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-foreground font-medium">
                                                            {project.user
                                                                ?.name ||
                                                                "Anonymous Creator"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {project.websiteUrl && (
                                                        <a
                                                            href={
                                                                project.websiteUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                                                        >
                                                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground hover:text-foreground" />
                                                        </a>
                                                    )}
                                                    {project.discordUrl && (
                                                        <a
                                                            href={
                                                                project.discordUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                                                        >
                                                            <FaDiscord className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground hover:text-foreground" />
                                                        </a>
                                                    )}
                                                    {project.twitterUrl && (
                                                        <a
                                                            href={
                                                                project.twitterUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                                                        >
                                                            <FaTwitter className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground hover:text-foreground" />
                                                        </a>
                                                    )}
                                                    {/* Separator */}
                                                    <div className="h-6 w-px bg-border mx-1" />
                                                    <button
                                                        onClick={handleCopyUrl}
                                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                                                        title={
                                                            copied
                                                                ? "Copied!"
                                                                : "Copy link"
                                                        }
                                                    >
                                                        <Copy
                                                            className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                                                copied
                                                                    ? "text-blue-400"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            }`}
                                                        />
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={handleLike}
                                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                                                            title={
                                                                stats.isLiked
                                                                    ? "Unlike"
                                                                    : "Like"
                                                            }
                                                        >
                                                            <Heart
                                                                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                                                    stats.isLiked
                                                                        ? "fill-red-500 text-red-500"
                                                                        : "text-muted-foreground hover:text-foreground"
                                                                }`}
                                                            />
                                                        </button>
                                                        {stats.likeCount >
                                                            0 && (
                                                            <span className="text-sm text-muted-foreground">
                                                                {
                                                                    stats.likeCount
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Views Count */}
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                                                        {stats.viewCount >
                                                            0 && (
                                                            <span className="text-sm text-muted-foreground">
                                                                {
                                                                    stats.viewCount
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handlePlayGame}
                                                disabled={!isAuthenticated}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 sm:h-12 text-sm sm:text-base rounded-lg font-semibold"
                                            >
                                                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                                Play Game
                                            </Button>
                                            {user?.id === project.userId && (
                                                <Button
                                                    onClick={() => {
                                                        const token =
                                                            localStorage.getItem(
                                                                "authToken"
                                                            );
                                                        if (!token) {
                                                            alert(
                                                                "Please login first to edit projects"
                                                            );
                                                            return;
                                                        }

                                                        // Pass BOTH token (for session) AND project ID (to load the correct project)
                                                        const editorUrl = `${SCRATCH_GUI_URL}/?token=${encodeURIComponent(
                                                            token
                                                        )}#${project.id}`;
                                                        const editorWindow =
                                                            window.open(
                                                                editorUrl,
                                                                "_blank"
                                                            );

                                                        // Send auth data via postMessage
                                                        if (
                                                            editorWindow &&
                                                            user
                                                        ) {
                                                            // Send auth token and user data to editor
                                                            let retryCount = 0;
                                                            const maxRetries = 10;
                                                            const retryInterval = 500;

                                                            const sendAuthToken =
                                                                () => {
                                                                    if (
                                                                        editorWindow.closed
                                                                    ) {
                                                                        console.log(
                                                                            "[Editor] Window closed, stopping token sends"
                                                                        );
                                                                        return;
                                                                    }

                                                                    try {
                                                                        editorWindow.postMessage(
                                                                            {
                                                                                type: "AUTH_TOKEN",
                                                                                data: {
                                                                                    token: token,
                                                                                    user: user,
                                                                                },
                                                                            },
                                                                            SCRATCH_GUI_URL
                                                                        );
                                                                        console.log(
                                                                            `[Editor] ✅ Sent auth token to editor window (attempt ${
                                                                                retryCount +
                                                                                1
                                                                            })`
                                                                        );

                                                                        retryCount++;
                                                                        if (
                                                                            retryCount <
                                                                            maxRetries
                                                                        ) {
                                                                            setTimeout(
                                                                                sendAuthToken,
                                                                                retryInterval
                                                                            );
                                                                        } else {
                                                                            console.log(
                                                                                "[Editor] Finished sending auth token retries"
                                                                            );
                                                                        }
                                                                    } catch (error) {
                                                                        console.error(
                                                                            "[Editor] Error sending auth token:",
                                                                            error
                                                                        );
                                                                    }
                                                                };

                                                            // Start sending after a short delay to let the window load
                                                            setTimeout(
                                                                sendAuthToken,
                                                                500
                                                            );
                                                        }
                                                    }}
                                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-11 sm:h-12 text-sm sm:text-base rounded-lg font-semibold"
                                                >
                                                    <Pencil className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                                    Edit in Game Studio
                                                </Button>
                                            )}
                                        </div>

                                        {/* OpenSea-Style Tabs - Ultra Compact */}
                                        <div className="border-t border-[#1A1A1A] pt-5 mt-5">
                                            <Tabs
                                                defaultValue="details"
                                                className="w-full"
                                            >
                                                {/* Tab List */}
                                                <TabsList className="w-full justify-start">
                                                    <TabsTrigger value="details">
                                                        Details
                                                    </TabsTrigger>
                                                    <TabsTrigger value="leaderboard">
                                                        Leaderboard
                                                    </TabsTrigger>
                                                </TabsList>

                                                {/* Details Tab Content */}
                                                <TabsContent
                                                    value="details"
                                                    className="space-y-3"
                                                >
                                                    <Accordion
                                                        type="multiple"
                                                        defaultValue={["rooms"]}
                                                    >
                                                        {/* Rooms Panel */}
                                                        <AccordionItem value="rooms">
                                                            <AccordionTrigger>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded flex items-center justify-center bg-[#1A1A1A]">
                                                                        <Gamepad2 className="w-4 h-4" />
                                                                    </div>
                                                                    <span>
                                                                        Rooms
                                                                    </span>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <RoomLobby
                                                                    projectId={
                                                                        project.id
                                                                    }
                                                                    gameMode={
                                                                        project.gameMode
                                                                    }
                                                                    maxPlayers={
                                                                        project.maxPlayers
                                                                    }
                                                                />
                                                            </AccordionContent>
                                                        </AccordionItem>

                                                        {/* About Panel */}
                                                        <AccordionItem value="about">
                                                            <AccordionTrigger>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded flex items-center justify-center bg-[#1A1A1A]">
                                                                        <Info className="w-4 h-4" />
                                                                    </div>
                                                                    <span>
                                                                        About
                                                                    </span>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                {/* About Title */}
                                                                <b className="text-md font-semibold text-[#E5E5E5] mb-1">
                                                                    About{" "}
                                                                    {
                                                                        project.title
                                                                    }
                                                                </b>

                                                                {/* Description */}
                                                                <div className="prose prose-invert prose-sm max-w-none break-words [&>p]:text-[#8B8B8B] [&>p]:text-sm [&>p]:leading-normal [&>p]:mb-2.5 [&>h1]:text-[#E5E5E5] [&>h2]:text-[#E5E5E5] [&>h3]:text-[#E5E5E5] mb-2">
                                                                    <ReactMarkdown
                                                                        remarkPlugins={[
                                                                            remarkGfm,
                                                                        ]}
                                                                    >
                                                                        {
                                                                            description
                                                                        }
                                                                    </ReactMarkdown>
                                                                </div>

                                                                {project.tags &&
                                                                    project.tags
                                                                        .length >
                                                                        0 && (
                                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                                            {project.tags.map(
                                                                                (
                                                                                    tag,
                                                                                    index
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#1A1A1A] text-[#E5E5E5] border border-[#252525]"
                                                                                    >
                                                                                        {
                                                                                            tag
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                {/* Separator and Created Date */}
                                                                <div className="pt-3 border-t border-[#1A1A1A]">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-medium text-[#8B8B8B]">
                                                                            Created
                                                                        </span>
                                                                        <span className="text-xs text-[#6B6B6B]">
                                                                            {formatDistance(
                                                                                new Date(
                                                                                    project.createdAt
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
                                                            </AccordionContent>
                                                        </AccordionItem>

                                                        {/* Instructions Panel */}
                                                        <AccordionItem value="instructions">
                                                            <AccordionTrigger>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded flex items-center justify-center bg-[#1A1A1A]">
                                                                        <FileText className="w-4 h-4" />
                                                                    </div>
                                                                    <span>
                                                                        Instructions
                                                                    </span>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="prose prose-invert prose-sm max-w-none break-words [&>p]:text-[#8B8B8B] [&>p]:text-sm [&>p]:leading-normal [&>p]:mb-2.5 [&>h1]:text-[#E5E5E5] [&>h2]:text-[#E5E5E5] [&>h3]:text-[#E5E5E5]">
                                                                    <ReactMarkdown
                                                                        remarkPlugins={[
                                                                            remarkGfm,
                                                                        ]}
                                                                    >
                                                                        {
                                                                            instructions
                                                                        }
                                                                    </ReactMarkdown>
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>

                                                        {/* More from this creator Panel */}
                                                        {creatorProjects.length >
                                                            0 && (
                                                            <AccordionItem value="more-from-creator">
                                                                <AccordionTrigger>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded flex items-center justify-center bg-[#1A1A1A]">
                                                                            <Grid3x3 className="w-4 h-4" />
                                                                        </div>
                                                                        <span>
                                                                            More
                                                                            from
                                                                            this
                                                                            creator
                                                                        </span>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                                        {creatorProjects.map(
                                                                            (
                                                                                p
                                                                            ) => (
                                                                                <Link
                                                                                    key={
                                                                                        p.id
                                                                                    }
                                                                                    href={`/game/${p.id}`}
                                                                                    className="group block"
                                                                                >
                                                                                    <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-md overflow-hidden hover:border-[#252525] transition-colors duration-150">
                                                                                        <div className="aspect-video relative">
                                                                                            {p.thumbnailImage ? (
                                                                                                <img
                                                                                                    src={
                                                                                                        p.thumbnailImage
                                                                                                    }
                                                                                                    alt={
                                                                                                        p.title
                                                                                                    }
                                                                                                    className="w-full h-full object-cover"
                                                                                                />
                                                                                            ) : (
                                                                                                <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="p-2.5">
                                                                                            <h3 className="font-semibold text-sm text-[#E5E5E5] group-hover:text-blue-400 transition-colors line-clamp-1">
                                                                                                {
                                                                                                    p.title
                                                                                                }
                                                                                            </h3>
                                                                                            {p.description && (
                                                                                                <p className="text-xs text-[#8B8B8B] mt-1 line-clamp-2">
                                                                                                    {
                                                                                                        p.description
                                                                                                    }
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </Link>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        )}
                                                    </Accordion>
                                                </TabsContent>

                                                {/* Leaderboard Tab Content */}
                                                <TabsContent value="leaderboard">
                                                    <GameLeaderboard
                                                        projectId={project.id}
                                                    />
                                                </TabsContent>
                                            </Tabs>
                                        </div>

                                        {/* Comments */}
                                        <div className="border-t border-[#1A1A1A] pt-5 mt-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <MessageCircle className="w-4 h-4 text-[#E5E5E5]" />
                                                <h2 className="text-base font-semibold text-[#E5E5E5]">
                                                    Comments (
                                                    {stats.commentCount})
                                                </h2>
                                            </div>

                                            <div className="mb-4">
                                                <textarea
                                                    placeholder={
                                                        isAuthenticated
                                                            ? "Add a comment..."
                                                            : "Log in to comment..."
                                                    }
                                                    value={commentText}
                                                    onChange={(e) =>
                                                        setCommentText(
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={!isAuthenticated}
                                                    className="w-full bg-[#0F0F0F] text-[#E5E5E5] placeholder-[#6B6B6B] rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-[#1A1A1A] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                    rows={3}
                                                />
                                                {commentText.trim() &&
                                                    isAuthenticated && (
                                                        <div className="flex justify-end">
                                                            <Button
                                                                onClick={
                                                                    handlePostComment
                                                                }
                                                                disabled={
                                                                    submittingComment
                                                                }
                                                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
                                                            >
                                                                {submittingComment
                                                                    ? "Posting..."
                                                                    : "Post Comment"}
                                                            </Button>
                                                        </div>
                                                    )}
                                            </div>

                                            <div className="mt-4 space-y-4">
                                                {comments.length === 0 ? (
                                                    <p className="text-[#6B6B6B] text-center py-6 text-sm">
                                                        No comments yet. Be the
                                                        first to comment!
                                                    </p>
                                                ) : (
                                                    comments.map((comment) => (
                                                        <div
                                                            key={comment.id}
                                                            className="flex items-start gap-3 py-3"
                                                        >
                                                            {comment.user
                                                                .profileImage ? (
                                                                <img
                                                                    src={
                                                                        comment
                                                                            .user
                                                                            .profileImage
                                                                    }
                                                                    alt={
                                                                        comment
                                                                            .user
                                                                            .name ||
                                                                        "User"
                                                                    }
                                                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                                                    {comment.user.name?.[0]?.toUpperCase() ||
                                                                        "A"}
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-3 mb-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[#E5E5E5] font-semibold text-sm">
                                                                                {comment
                                                                                    .user
                                                                                    .name ||
                                                                                    "Anonymous"}
                                                                            </span>
                                                                            {comment
                                                                                .user
                                                                                .isVerified && (
                                                                                <VerifiedBadge size="sm" />
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[#6B6B6B] text-xs">
                                                                            {formatDistance(
                                                                                new Date(
                                                                                    comment.createdAt
                                                                                ),
                                                                                new Date(),
                                                                                {
                                                                                    addSuffix:
                                                                                        true,
                                                                                }
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    {user?.id ===
                                                                        comment.userId && (
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteComment(
                                                                                    comment.id
                                                                                )
                                                                            }
                                                                            className="text-[#6B6B6B] hover:text-red-400 transition-colors flex-shrink-0 cursor-pointer"
                                                                            title="Delete comment"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <p className="text-[#E5E5E5] text-sm break-words mt-1">
                                                                    {
                                                                        comment.content
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
