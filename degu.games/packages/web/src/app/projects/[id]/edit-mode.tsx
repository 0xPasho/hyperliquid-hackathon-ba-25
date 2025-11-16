import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, X, Link as LinkIcon, Plus, XCircle, ImageIcon, AlertCircle, Gamepad2 } from "lucide-react";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { Switch } from "@/components/ui/switch";

interface EditModeProps {
    title: string;
    description: string;
    instructions: string;
    tags: string[];
    websiteUrl: string;
    twitterUrl: string;
    discordUrl: string;
    headerImage?: string;
    thumbnailImage?: string;
    isPublic: boolean;
    isMultiplayer: boolean | null;
    minPlayers: number | null;
    maxPlayers: number | null;
    gameMode: number | null; // 0=WinnerTakesAll, 1=FreeForAll, 2=ScoreBased
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onInstructionsChange: (value: string) => void;
    onTagsChange: (value: string[]) => void;
    onWebsiteUrlChange: (value: string) => void;
    onTwitterUrlChange: (value: string) => void;
    onDiscordUrlChange: (value: string) => void;
    onIsPublicChange: (value: boolean) => void;
    onIsMultiplayerChange: (value: boolean | null) => void;
    onMinPlayersChange: (value: number | null) => void;
    onMaxPlayersChange: (value: number | null) => void;
    onGameModeChange: (value: number | null) => void;
    onHeaderImageUpload: (file: File) => Promise<void>;
    onThumbnailImageUpload: (file: File) => Promise<void>;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
}

export function EditMode({
    title,
    description,
    instructions,
    tags,
    websiteUrl,
    twitterUrl,
    discordUrl,
    headerImage,
    thumbnailImage,
    isPublic,
    isMultiplayer,
    minPlayers,
    maxPlayers,
    gameMode,
    onTitleChange,
    onDescriptionChange,
    onInstructionsChange,
    onTagsChange,
    onWebsiteUrlChange,
    onTwitterUrlChange,
    onDiscordUrlChange,
    onIsPublicChange,
    onIsMultiplayerChange,
    onMinPlayersChange,
    onMaxPlayersChange,
    onGameModeChange,
    onHeaderImageUpload,
    onThumbnailImageUpload,
    onSave,
    onCancel,
    saving,
}: EditModeProps) {
    const [tagInput, setTagInput] = useState("");
    const [titleError, setTitleError] = useState<string | null>(null);

    // Check if project can be published (has all required fields)
    const multiplayerValid = isMultiplayer === null ? false : (isMultiplayer === false || (minPlayers !== null && maxPlayers !== null && minPlayers >= 2 && maxPlayers >= 2 && minPlayers <= maxPlayers));
    const canPublish = !!(title && description && (headerImage || thumbnailImage) && multiplayerValid);

    // Validate that title contains only ASCII characters
    const handleTitleChange = (value: string) => {
        // Check if the string contains only ASCII characters (0-127)
        const isAsciiOnly = /^[\x00-\x7F]*$/.test(value);

        if (!isAsciiOnly) {
            setTitleError("Title can only contain ASCII characters (no emojis or special unicode characters)");
            // Filter out non-ASCII characters
            const asciiOnly = value.replace(/[^\x00-\x7F]/g, '');
            onTitleChange(asciiOnly);
        } else {
            setTitleError(null);
            onTitleChange(value);
        }
    };

    const handlePublicToggle = (checked: boolean) => {
        if (checked && !canPublish) {
            const missingItems = [];
            if (!title) missingItems.push("• A title");
            if (!description) missingItems.push("• A description");
            if (!headerImage && !thumbnailImage) missingItems.push("• At least one image (header or thumbnail)");
            if (isMultiplayer === null) missingItems.push("• Multiplayer selection (yes or no)");
            if (isMultiplayer === true) {
                if (minPlayers === null || minPlayers < 2) missingItems.push("• Minimum players (at least 2)");
                if (maxPlayers === null || maxPlayers < 2) missingItems.push("• Maximum players (at least 2)");
                if (minPlayers !== null && maxPlayers !== null && minPlayers > maxPlayers) missingItems.push("• Min players must be ≤ max players");
            }
            alert("To make your project public, you need to add:\n" + missingItems.join("\n"));
            return;
        }
        onIsPublicChange(checked);
    };

    const handleAddTag = () => {
        const trimmedTag = tagInput.trim();
        if (trimmedTag && tags.length < 10 && !tags.includes(trimmedTag)) {
            onTagsChange([...tags, trimmedTag]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onTagsChange(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleTagInputKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };
    return (
        <div className="space-y-6">
            {/* Header with Save/Cancel */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
                <h2 className="text-2xl font-bold text-foreground">
                    Edit Project
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
                        onClick={onSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        disabled={saving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Public/Private Toggle */}
            <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-base font-semibold text-foreground">
                                {isPublic ? "Public Project" : "Private Project"}
                            </h3>
                            {!canPublish && (
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
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
                                    {!headerImage && !thumbnailImage && <li>• Upload at least one image (header or thumbnail)</li>}
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
                <label className="block text-sm font-medium text-foreground mb-2">
                    Title
                    <span className="text-muted-foreground font-normal text-xs ml-2">
                        (ASCII characters only)
                    </span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className={`w-full bg-card text-foreground placeholder-muted-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-2 border ${
                        titleError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-border focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                    <span className="text-muted-foreground font-normal ml-2">
                        (Markdown supported)
                    </span>
                </label>
                <textarea
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    className="w-full bg-card text-foreground placeholder-muted-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-border resize-none"
                    rows={8}
                    placeholder="Write description here..."
                />
            </div>

            {/* Instructions */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Instructions
                    <span className="text-muted-foreground font-normal ml-2">
                        (Markdown supported)
                    </span>
                </label>
                <textarea
                    value={instructions}
                    onChange={(e) => onInstructionsChange(e.target.value)}
                    className="w-full bg-card text-foreground placeholder-muted-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-border resize-none"
                    rows={10}
                    placeholder="Write instructions here..."
                />
            </div>

            {/* Images Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Project Images
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageUpload
                        currentImage={headerImage}
                        onUpload={onHeaderImageUpload}
                        aspectRatio="16:9"
                        label="Header Image (Horizontal)"
                        maxSize={10}
                    />

                    <ImageUpload
                        currentImage={thumbnailImage}
                        onUpload={onThumbnailImageUpload}
                        aspectRatio="4:3"
                        label="Thumbnail Image"
                        maxSize={10}
                    />
                </div>

                <p className="text-xs text-muted-foreground">
                    Header image will be displayed at the top of your project page.
                    Thumbnail will be used in project cards and previews.
                </p>
            </div>

            {/* Tags */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Tags
                        <span className="text-muted-foreground font-normal ml-2">
                            (Up to 10 tags)
                        </span>
                    </label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            className="flex-1 bg-card text-foreground placeholder-muted-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-border"
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
                    <p className="text-xs text-muted-foreground mt-2">
                        {tags.length}/10 tags used
                    </p>
                </div>
            </div>

            {/* Multiplayer Settings */}
            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    Multiplayer Settings
                </h3>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                        Is this a multiplayer game?
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => onIsMultiplayerChange(true)}
                            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                isMultiplayer === true
                                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
                            }`}
                        >
                            Yes
                        </button>
                        <button
                            type="button"
                            onClick={() => onIsMultiplayerChange(false)}
                            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                isMultiplayer === false
                                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
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
                    <div className="space-y-4 bg-card/50 border border-border rounded-lg p-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Minimum Players
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="number"
                                min="2"
                                value={minPlayers ?? ""}
                                onChange={(e) => onMinPlayersChange(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full bg-card text-foreground placeholder-muted-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-border"
                                placeholder="e.g. 2"
                            />
                            {minPlayers !== null && minPlayers < 2 && (
                                <p className="text-xs text-red-400 mt-1">
                                    Minimum players must be at least 2
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Maximum Players
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="number"
                                min="2"
                                value={maxPlayers ?? ""}
                                onChange={(e) => onMaxPlayersChange(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full bg-card text-foreground placeholder-muted-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-border"
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
                            <label className="block text-sm font-medium text-foreground mb-3">
                                Game Mode (for paid rooms)
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    type="button"
                                    onClick={() => onGameModeChange(0)}
                                    className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                                        gameMode === 0 || gameMode === null
                                            ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                            : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
                                    }`}
                                >
                                    <div className="font-medium">Winner Takes All</div>
                                    <div className="text-xs opacity-75">Single winner gets entire prize pool</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onGameModeChange(1)}
                                    className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                                        gameMode === 1
                                            ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                            : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
                                    }`}
                                >
                                    <div className="font-medium">Free For All (Top 3)</div>
                                    <div className="text-xs opacity-75">Top 3 players share the prize pool</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onGameModeChange(2)}
                                    className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                                        gameMode === 2
                                            ? "border-blue-500 bg-blue-500/20 text-blue-400"
                                            : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
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
            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Social Links
                </h3>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Website URL
                    </label>
                    <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => onWebsiteUrlChange(e.target.value)}
                        className="w-full bg-card text-foreground placeholder-muted-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-border"
                        placeholder="https://your-website.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Twitter/X URL
                    </label>
                    <input
                        type="url"
                        value={twitterUrl}
                        onChange={(e) => onTwitterUrlChange(e.target.value)}
                        className="w-full bg-card text-foreground placeholder-muted-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-border"
                        placeholder="https://twitter.com/username"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Discord Invite URL
                    </label>
                    <input
                        type="url"
                        value={discordUrl}
                        onChange={(e) => onDiscordUrlChange(e.target.value)}
                        className="w-full bg-card text-foreground placeholder-muted-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-border"
                        placeholder="https://discord.gg/invite-code"
                    />
                </div>
            </div>
        </div>
    );
}
