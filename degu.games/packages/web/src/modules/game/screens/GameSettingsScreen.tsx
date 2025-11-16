"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import { AppSidebar } from "@/modules/home/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, X, Link as LinkIcon, Plus, XCircle, ImageIcon, AlertCircle, Gamepad2 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { Switch } from "@/components/ui/switch";

interface GameSettingsScreenProps {
    project: Project;
    onSave: (data: {
        title: string;
        description: string;
        instructions: string;
        tags: string[];
        websiteUrl: string;
        twitterUrl: string;
        discordUrl: string;
        isPublic: boolean;
        isMultiplayer: boolean | null;
        minPlayers: number | null;
        maxPlayers: number | null;
        gameMode: number | null;
    }) => Promise<void>;
    onCancel: () => void;
    onHeaderImageUpload: (file: File) => Promise<void>;
    onThumbnailImageUpload: (file: File) => Promise<void>;
}

export function GameSettingsScreen({
    project,
    onSave,
    onCancel,
    onHeaderImageUpload,
    onThumbnailImageUpload,
}: GameSettingsScreenProps) {
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description || "");
    const [instructions, setInstructions] = useState(project.instructions || "");
    const [tags, setTags] = useState<string[]>(project.tags || []);
    const [websiteUrl, setWebsiteUrl] = useState(project.websiteUrl || "");
    const [twitterUrl, setTwitterUrl] = useState(project.twitterUrl || "");
    const [discordUrl, setDiscordUrl] = useState(project.discordUrl || "");
    const [isPublic, setIsPublic] = useState(project.isPublic || false);
    const [isMultiplayer, setIsMultiplayer] = useState<boolean | null>(project.isMultiplayer ?? null);
    const [minPlayers, setMinPlayers] = useState<number | null>(project.minPlayers ?? null);
    const [maxPlayers, setMaxPlayers] = useState<number | null>(project.maxPlayers ?? null);
    const [gameMode, setGameMode] = useState<number | null>(project.gameMode ?? 0);
    const [saving, setSaving] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [titleError, setTitleError] = useState<string | null>(null);

    // Check if project can be published
    const multiplayerValid = isMultiplayer === null ? false : (isMultiplayer === false || (minPlayers !== null && maxPlayers !== null && minPlayers >= 2 && maxPlayers >= 2 && minPlayers <= maxPlayers));
    const canPublish = !!(title && description && (project.headerImage || project.thumbnailImage) && multiplayerValid);

    // Validate ASCII-only title
    const handleTitleChange = (value: string) => {
        const isAsciiOnly = /^[\x00-\x7F]*$/.test(value);

        if (!isAsciiOnly) {
            setTitleError("Title can only contain ASCII characters (no emojis or special unicode characters)");
            const asciiOnly = value.replace(/[^\x00-\x7F]/g, '');
            setTitle(asciiOnly);
        } else {
            setTitleError(null);
            setTitle(value);
        }
    };

    const handlePublicToggle = (checked: boolean) => {
        if (checked && !canPublish) {
            const missingItems = [];
            if (!title) missingItems.push("• A title");
            if (!description) missingItems.push("• A description");
            if (!project.headerImage && !project.thumbnailImage) missingItems.push("• At least one image (header or thumbnail)");
            if (isMultiplayer === null) missingItems.push("• Multiplayer selection (yes or no)");
            if (isMultiplayer === true) {
                if (minPlayers === null || minPlayers < 2) missingItems.push("• Minimum players (at least 2)");
                if (maxPlayers === null || maxPlayers < 2) missingItems.push("• Maximum players (at least 2)");
                if (minPlayers !== null && maxPlayers !== null && minPlayers > maxPlayers) missingItems.push("• Min players must be ≤ max players");
            }
            alert("To make your project public, you need to add:\n" + missingItems.join("\n"));
            return;
        }
        setIsPublic(checked);
    };

    const handleAddTag = () => {
        const trimmedTag = tagInput.trim();
        if (trimmedTag && tags.length < 10 && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleSave = async () => {
        // Validate required fields if trying to make public
        if (isPublic) {
            if (!title) {
                alert("Title is required to make the project public");
                return;
            }
            if (!description) {
                alert("Description is required to make the project public");
                return;
            }
            if (!project.headerImage && !project.thumbnailImage) {
                alert("At least one image (header or thumbnail) is required to make the project public");
                return;
            }
            if (isMultiplayer === null) {
                alert("Please select whether this is a multiplayer game");
                return;
            }
            if (isMultiplayer === true) {
                if (minPlayers === null || minPlayers < 2) {
                    alert("Minimum players must be at least 2 for multiplayer games");
                    return;
                }
                if (maxPlayers === null || maxPlayers < 2) {
                    alert("Maximum players must be at least 2 for multiplayer games");
                    return;
                }
                if (minPlayers > maxPlayers) {
                    alert("Minimum players cannot be greater than maximum players");
                    return;
                }
            }
        }

        setSaving(true);
        try {
            await onSave({
                title,
                description,
                instructions,
                tags,
                websiteUrl,
                twitterUrl,
                discordUrl,
                isPublic,
                isMultiplayer,
                minPlayers,
                maxPlayers,
                gameMode,
            });
        } catch (error) {
            alert("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="relative flex min-h-screen w-full bg-black">
                <div className="fixed left-0 top-0 bottom-0 z-50 hidden md:block">
                    <AppSidebar />
                </div>
                <div className="flex-1 md:ml-12 overflow-x-hidden">
                    <AppHeader showBack={true} showSearch={false} />

                    <div className="w-full px-6 py-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="space-y-6">
                                {/* Header with Save/Cancel */}
                                <div className="flex items-center justify-between pb-4 border-b border-[#2d2d2d]">
                                    <h2 className="text-2xl font-bold text-white">
                                        Game Settings
                                    </h2>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={onCancel}
                                            variant="outline"
                                            className="text-sm"
                                            disabled={saving}
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                            disabled={saving}
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {saving ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Public/Private Toggle */}
                                <div className="bg-[#1c1c1e] border border-[#2d2d2d] rounded-lg p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-base font-semibold text-white">
                                                    {isPublic ? "Public Project" : "Private Project"}
                                                </h3>
                                                {!canPublish && (
                                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                {isPublic
                                                    ? "Your project is visible to everyone and appears in search results."
                                                    : "Your project is only visible to you. Complete the requirements below to make it public."
                                                }
                                            </p>
                                            {!canPublish && (
                                                <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                                                    <p className="text-sm text-amber-200 font-medium mb-2">
                                                        Required to publish:
                                                    </p>
                                                    <ul className="text-xs text-amber-300/80 space-y-1">
                                                        {!title && <li>• Add a project title</li>}
                                                        {!description && <li>• Add a description</li>}
                                                        {!project.headerImage && !project.thumbnailImage && <li>• Upload at least one image (header or thumbnail)</li>}
                                                        {isMultiplayer === null && <li>• Select if this is a multiplayer game</li>}
                                                        {isMultiplayer === true && (minPlayers === null || minPlayers < 2) && <li>• Set minimum players (at least 2)</li>}
                                                        {isMultiplayer === true && (maxPlayers === null || maxPlayers < 2) && <li>• Set maximum players (at least 2)</li>}
                                                        {isMultiplayer === true && minPlayers !== null && maxPlayers !== null && minPlayers > maxPlayers && <li>• Min players must be ≤ max players</li>}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        <Switch
                                            checked={isPublic}
                                            onCheckedChange={handlePublicToggle}
                                            className="flex-shrink-0"
                                        />
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Title
                                        <span className="text-gray-400 font-normal text-xs ml-2">
                                            (ASCII characters only)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        className={`w-full bg-[#1c1c1e] text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 border ${
                                            titleError
                                                ? "border-red-500 focus:ring-red-500"
                                                : "border-[#2d2d2d] focus:ring-blue-500"
                                        }`}
                                        placeholder="Project title..."
                                    />
                                    {titleError && (
                                        <p className="text-xs text-red-400 mt-1">
                                            {titleError}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Description
                                        <span className="text-gray-400 font-normal ml-2">
                                            (Markdown supported)
                                        </span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-[#1c1c1e] text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[#2d2d2d] resize-none"
                                        rows={8}
                                        placeholder="Write description here..."
                                    />
                                </div>

                                {/* Instructions */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Instructions
                                        <span className="text-gray-400 font-normal ml-2">
                                            (Markdown supported)
                                        </span>
                                    </label>
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        className="w-full bg-[#1c1c1e] text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[#2d2d2d] resize-none"
                                        rows={10}
                                        placeholder="Write instructions here..."
                                    />
                                </div>

                                {/* Images Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" />
                                        Project Images
                                    </h3>

                                    <div className="space-y-4">
                                        <ImageUpload
                                            currentImage={project.headerImage}
                                            onUpload={onHeaderImageUpload}
                                            aspectRatio="16:9"
                                            label="Header Image (Horizontal)"
                                            maxSize={10}
                                        />

                                        <ImageUpload
                                            currentImage={project.thumbnailImage}
                                            onUpload={onThumbnailImageUpload}
                                            aspectRatio="4:3"
                                            label="Thumbnail Image"
                                            maxSize={10}
                                        />
                                    </div>

                                    <p className="text-xs text-gray-400">
                                        Header image will be displayed at the top of your project page.
                                        Thumbnail will be used in project cards and previews.
                                    </p>
                                </div>

                                {/* Tags */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Tags
                                            <span className="text-gray-400 font-normal ml-2">
                                                (Up to 10 tags)
                                            </span>
                                        </label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleTagInputKeyDown}
                                                className="flex-1 bg-[#1c1c1e] text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[#2d2d2d]"
                                                placeholder="Add a tag..."
                                                disabled={tags.length >= 10}
                                            />
                                            <Button
                                                onClick={handleAddTag}
                                                disabled={!tagInput.trim() || tags.length >= 10}
                                                variant="outline"
                                                className="px-4"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map((tag, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-sm px-3 py-1 flex items-center gap-2"
                                                    >
                                                        {tag}
                                                        <button
                                                            onClick={() => handleRemoveTag(tag)}
                                                            className="hover:text-blue-300 transition-colors"
                                                        >
                                                            <XCircle className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            {tags.length}/10 tags used
                                        </p>
                                    </div>
                                </div>

                                {/* Multiplayer Settings */}
                                <div className="space-y-4 pt-4 border-t border-[#2d2d2d]">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Gamepad2 className="w-5 h-5" />
                                        Multiplayer Settings
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Is this a multiplayer game?
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setIsMultiplayer(true)}
                                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                                    isMultiplayer === true
                                                        ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                                        : "border-[#2d2d2d] bg-[#1c1c1e] text-gray-400 hover:border-gray-400"
                                                }`}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsMultiplayer(false)}
                                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                                    isMultiplayer === false
                                                        ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                                        : "border-[#2d2d2d] bg-[#1c1c1e] text-gray-400 hover:border-gray-400"
                                                }`}
                                            >
                                                No
                                            </button>
                                        </div>
                                        {isMultiplayer === null && (
                                            <p className="text-xs text-amber-400 mt-2">
                                                Please select whether this is a multiplayer game
                                            </p>
                                        )}
                                    </div>

                                    {isMultiplayer === true && (
                                        <div className="space-y-4 bg-[#1c1c1e]/50 border border-[#2d2d2d] rounded-lg p-4">
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">
                                                    Minimum Players
                                                    <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    value={minPlayers ?? ""}
                                                    onChange={(e) => setMinPlayers(e.target.value ? parseInt(e.target.value) : null)}
                                                    className="w-full bg-[#1c1c1e] text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[#2d2d2d]"
                                                    placeholder="e.g. 2"
                                                />
                                                {minPlayers !== null && minPlayers < 2 && (
                                                    <p className="text-xs text-red-400 mt-1">
                                                        Minimum players must be at least 2
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">
                                                    Maximum Players
                                                    <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    value={maxPlayers ?? ""}
                                                    onChange={(e) => setMaxPlayers(e.target.value ? parseInt(e.target.value) : null)}
                                                    className="w-full bg-[#1c1c1e] text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[#2d2d2d]"
                                                    placeholder="e.g. 8"
                                                />
                                                {maxPlayers !== null && maxPlayers < 2 && (
                                                    <p className="text-xs text-red-400 mt-1">
                                                        Maximum players must be at least 2
                                                    </p>
                                                )}
                                                {minPlayers !== null && maxPlayers !== null && minPlayers > maxPlayers && (
                                                    <p className="text-xs text-red-400 mt-1">
                                                        Maximum players must be greater than or equal to minimum players
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-white mb-3">
                                                    Game Mode (for paid rooms)
                                                </label>
                                                <div className="space-y-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setGameMode(0)}
                                                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                                                            gameMode === 0 || gameMode === null
                                                                ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                                                : "border-[#2d2d2d] bg-[#1c1c1e] text-gray-400 hover:border-gray-400"
                                                        }`}
                                                    >
                                                        <div className="font-medium">Winner Takes All</div>
                                                        <div className="text-xs opacity-75">Single winner gets entire prize pool</div>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGameMode(1)}
                                                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                                                            gameMode === 1
                                                                ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                                                : "border-[#2d2d2d] bg-[#1c1c1e] text-gray-400 hover:border-gray-400"
                                                        }`}
                                                    >
                                                        <div className="font-medium">Free For All (Top 3)</div>
                                                        <div className="text-xs opacity-75">Top 3 players share the prize pool</div>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGameMode(2)}
                                                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                                                            gameMode === 2
                                                                ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                                                : "border-[#2d2d2d] bg-[#1c1c1e] text-gray-400 hover:border-gray-400"
                                                        }`}
                                                    >
                                                        <div className="font-medium">Score Based</div>
                                                        <div className="text-xs opacity-75">Winners determined by score thresholds</div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Social Links */}
                                <div className="space-y-4 pt-4 border-t border-[#2d2d2d]">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <LinkIcon className="w-5 h-5" />
                                        Social Links
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Website URL
                                        </label>
                                        <input
                                            type="url"
                                            value={websiteUrl}
                                            onChange={(e) => setWebsiteUrl(e.target.value)}
                                            className="w-full bg-[#1c1c1e] text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[#2d2d2d]"
                                            placeholder="https://your-website.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Twitter/X URL
                                        </label>
                                        <input
                                            type="url"
                                            value={twitterUrl}
                                            onChange={(e) => setTwitterUrl(e.target.value)}
                                            className="w-full bg-[#1c1c1e] text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[#2d2d2d]"
                                            placeholder="https://twitter.com/username"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Discord Invite URL
                                        </label>
                                        <input
                                            type="url"
                                            value={discordUrl}
                                            onChange={(e) => setDiscordUrl(e.target.value)}
                                            className="w-full bg-[#1c1c1e] text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[#2d2d2d]"
                                            placeholder="https://discord.gg/invite-code"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}
