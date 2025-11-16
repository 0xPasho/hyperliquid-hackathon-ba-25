"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Loader2,
    Globe,
    User as UserIcon,
    X,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AppSidebar } from "@/modules/home/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchUser,
    uploadUserProfileImage,
    uploadUserHeaderImage,
} from "@/lib/api";
import { updateUserProfile } from "@/lib/auth-api";
import { FaDiscord, FaTwitter, FaTelegram } from "react-icons/fa";
import { ImageUpload } from "@/components/ImageUpload";

// Generate array of default avatar paths
const DEFAULT_AVATARS = Array.from(
    { length: 71 },
    (_, i) => `/default-images/avatar-${i + 1}.png`
);

export default function EditProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unauthorized, setUnauthorized] = useState(false);
    const [showDefaultAvatars, setShowDefaultAvatars] = useState(false);
    const [selectingAvatar, setSelectingAvatar] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        profileImage: "",
        headerImage: "",
        websiteUrl: "",
        twitterUrl: "",
        discordUrl: "",
        telegramUrl: "",
    });

    useEffect(() => {
        async function loadUser() {
            try {
                // Check if user is authenticated
                if (!isAuthenticated) {
                    // Store return URL and redirect to home
                    const currentPath = window.location.pathname;
                    localStorage.setItem("returnUrl", currentPath);
                    router.push("/");
                    return;
                }

                // Check if user is viewing their own profile
                if (currentUser?.id !== params.id) {
                    setUnauthorized(true);
                    setLoading(false);
                    return;
                }

                const userData = await fetchUser(params.id as string);
                setFormData({
                    name: userData.name || "",
                    bio: userData.bio || "",
                    profileImage: userData.profileImage || "",
                    headerImage: userData.headerImage || "",
                    websiteUrl: userData.websiteUrl || "",
                    twitterUrl: userData.twitterUrl || "",
                    discordUrl: userData.discordUrl || "",
                    telegramUrl: userData.telegramUrl || "",
                });
                setLoading(false);
            } catch (err) {
                console.error("Error loading user:", err);
                setError("Failed to load user profile");
                setLoading(false);
            }
        }

        loadUser();
    }, [params.id, currentUser, isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const token = localStorage.getItem("authToken");
        if (!token) {
            setError("No auth token found. Please log in again.");
            setSaving(false);
            return;
        }

        const result = await updateUserProfile(token, formData);
        setSaving(false);

        if (!result.success) {
            setError(result.error || "Failed to update profile. Please try again.");
            return;
        }

        // Redirect back to profile page
        router.push(`/users/${params.id}`);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleProfileImageUpload = async (file: File) => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("No auth token found");
                alert("No auth token found. Please log in again.");
                return;
            }

            const result = await uploadUserProfileImage(
                params.id as string,
                file,
                token
            );

            // Update form data with new image URL
            setFormData({
                ...formData,
                profileImage: result.imageUrl,
            });
        } catch (error) {
            console.error("Error uploading profile image:", error);
            alert("Failed to upload profile image");
        }
    };

    const handleHeaderImageUpload = async (file: File) => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("No auth token found");
                alert("No auth token found. Please log in again.");
                return;
            }

            const result = await uploadUserHeaderImage(
                params.id as string,
                file,
                token
            );

            // Update form data with new image URL
            setFormData({
                ...formData,
                headerImage: result.imageUrl,
            });
        } catch (error) {
            console.error("Error uploading header image:", error);
            alert("Failed to upload header image");
        }
    };

    const handleSelectDefaultAvatar = async (avatarPath: string) => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        setSelectingAvatar(true);
        const result = await updateUserProfile(token, { profileImage: avatarPath });
        setSelectingAvatar(false);

        if (!result.success) {
            setError(result.error || "Failed to select avatar");
            return;
        }

        setFormData({
            ...formData,
            profileImage: avatarPath,
        });
        setShowDefaultAvatars(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (unauthorized) {
        return (
            <SidebarProvider defaultOpen={false}>
                <div className="flex min-h-screen w-full bg-background">
                    <AppSidebar />
                    <SidebarInset className="flex-1">
                        <AppHeader
                            showBack={true}
                            showSearch={false}
                            backPath={`/users/${params.id}`}
                        />
                        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
                            <div className="max-w-md w-full mx-auto px-6">
                                <div className="bg-card border border-border rounded-lg p-8 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <X className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground mb-2">
                                        Access Denied
                                    </h2>
                                    <p className="text-muted-foreground mb-6">
                                        You don't have permission to edit this
                                        profile. You can only edit your own
                                        profile.
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <Button
                                            variant="outline"
                                            onClick={() => router.back()}
                                            className="rounded-lg"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Go Back
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                router.push(
                                                    `/users/${params.id}`
                                                )
                                            }
                                            className="rounded-lg"
                                        >
                                            View Profile
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    const userInitial = formData.name
        ? formData.name.charAt(0).toUpperCase()
        : currentUser?.walletAddress?.charAt(0).toUpperCase() || "?";

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />
                <SidebarInset className="flex-1">
                    <AppHeader showBack={true} showSearch={true} backPath={`/users/${params.id}`} />

                    <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-foreground">
                                Edit Profile
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Update your profile information and social links
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Profile Picture */}
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">
                                    Profile Picture
                                </Label>
                                <div className="max-w-xs">
                                    <ImageUpload
                                        currentImage={formData.profileImage}
                                        onUpload={handleProfileImageUpload}
                                        aspectRatio="1:1"
                                        label=""
                                        maxSize={10}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Upload a profile picture to personalize your
                                    account
                                </p>

                                {/* Default Avatars Selector */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Or choose from default avatars
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setShowDefaultAvatars(
                                                    !showDefaultAvatars
                                                )
                                            }
                                        >
                                            {showDefaultAvatars
                                                ? "Hide"
                                                : "Show"}{" "}
                                            Avatars
                                        </Button>
                                    </div>

                                    {showDefaultAvatars && (
                                        <div className="border border-border rounded-lg p-4 bg-[#0F0F0F]">
                                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-96 overflow-y-auto">
                                                {DEFAULT_AVATARS.map(
                                                    (avatarPath, index) => {
                                                        const isSelected =
                                                            formData.profileImage ===
                                                            avatarPath;
                                                        return (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onClick={() =>
                                                                    handleSelectDefaultAvatar(
                                                                        avatarPath
                                                                    )
                                                                }
                                                                disabled={
                                                                    selectingAvatar
                                                                }
                                                                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                                                    isSelected
                                                                        ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-background"
                                                                        : "border-transparent hover:border-[#3B3B3B]"
                                                                }`}
                                                                title={`Avatar ${
                                                                    index + 1
                                                                }`}
                                                            >
                                                                <div className="relative w-full h-full">
                                                                    <img
                                                                        src={
                                                                            avatarPath
                                                                        }
                                                                        alt={`Avatar ${
                                                                            index +
                                                                            1
                                                                        }`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {isSelected && (
                                                                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                                            <Check className="w-6 h-6 text-blue-500" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                            {selectingAvatar && (
                                                <div className="flex items-center justify-center mt-3 text-sm text-[#8B8B8B]">
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    Updating avatar...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Header Image */}
                            <div className="space-y-4 pt-6 border-t border-border">
                                <Label className="text-base font-semibold">
                                    Profile Header
                                </Label>
                                <div className="max-w-2xl">
                                    <ImageUpload
                                        currentImage={formData.headerImage}
                                        onUpload={handleHeaderImageUpload}
                                        aspectRatio="3:1"
                                        label=""
                                        maxSize={10}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Upload a banner image for your profile
                                    header. If no image is uploaded, a gradient
                                    will be used as the default.
                                </p>
                            </div>

                            {/* Basic Information */}
                            <div className="space-y-4 pt-6 border-t border-border">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <UserIcon className="w-5 h-5" />
                                    Basic Information
                                </h3>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your display name"
                                        maxLength={50}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This is how others will see you on the
                                        platform
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Tell us about yourself..."
                                        rows={4}
                                        maxLength={500}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {formData.bio.length}/500 characters
                                    </p>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="space-y-4 pt-6 border-t border-border">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Social Links
                                </h3>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="websiteUrl"
                                        className="flex items-center gap-2"
                                    >
                                        <Globe className="w-4 h-4" />
                                        Website
                                    </Label>
                                    <Input
                                        id="websiteUrl"
                                        name="websiteUrl"
                                        type="url"
                                        value={formData.websiteUrl}
                                        onChange={handleChange}
                                        placeholder="https://yourwebsite.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="twitterUrl"
                                        className="flex items-center gap-2"
                                    >
                                        <FaTwitter className="w-4 h-4" />
                                        Twitter / X
                                    </Label>
                                    <Input
                                        id="twitterUrl"
                                        name="twitterUrl"
                                        type="url"
                                        value={formData.twitterUrl}
                                        onChange={handleChange}
                                        placeholder="https://twitter.com/username"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="discordUrl"
                                        className="flex items-center gap-2"
                                    >
                                        <FaDiscord className="w-4 h-4" />
                                        Discord
                                    </Label>
                                    <Input
                                        id="discordUrl"
                                        name="discordUrl"
                                        type="url"
                                        value={formData.discordUrl}
                                        onChange={handleChange}
                                        placeholder="https://discord.gg/invite"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="telegramUrl"
                                        className="flex items-center gap-2"
                                    >
                                        <FaTelegram className="w-4 h-4" />
                                        Telegram
                                    </Label>
                                    <Input
                                        id="telegramUrl"
                                        name="telegramUrl"
                                        type="url"
                                        value={formData.telegramUrl}
                                        onChange={handleChange}
                                        placeholder="https://t.me/username"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={saving}
                                    className="rounded-lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-primary hover:bg-primary/90"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>Save Changes</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
