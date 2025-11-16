"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
    currentImage?: string;
    onUpload: (file: File) => Promise<void>;
    onRemove?: () => void;
    aspectRatio?: "16:9" | "4:3" | "1:1" | "3:1";
    label?: string;
    maxSize?: number; // in MB
}

export function ImageUpload({
    currentImage,
    onUpload,
    onRemove,
    aspectRatio = "16:9",
    label = "Upload Image",
    maxSize = 10,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const aspectRatioClasses = {
        "16:9": "aspect-video",
        "4:3": "aspect-[4/3]",
        "1:1": "aspect-square",
        "3:1": "aspect-[3/1]",
    };

    // Update preview when currentImage prop changes
    useEffect(() => {
        setPreview(currentImage || null);
    }, [currentImage]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`Image must be less than ${maxSize}MB`);
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setError(null);
        setIsUploading(true);
        try {
            await onUpload(file);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to upload image"
            );
            setPreview(currentImage || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onRemove?.();
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
                {label}
            </label>
            <div
                className={`relative w-full ${aspectRatioClasses[aspectRatio]} border-2 border-dashed border-border rounded-lg overflow-hidden bg-card hover:bg-muted transition-colors cursor-pointer group`}
                onClick={handleClick}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {!isUploading && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClick();
                                    }}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Change
                                </Button>
                                {onRemove && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove();
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        {isUploading ? (
                            <>
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p className="text-sm">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-8 w-8" />
                                <p className="text-sm">Click to upload</p>
                                <p className="text-xs text-muted-foreground/60">
                                    Max {maxSize}MB • JPG, PNG, GIF
                                </p>
                            </>
                        )}
                    </div>
                )}

                {isUploading && preview && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
