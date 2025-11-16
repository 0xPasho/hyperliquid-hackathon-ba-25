"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Project } from "@/lib/types";
import {
    fetchProject,
    updateProject,
    uploadProjectHeaderImage,
    uploadProjectThumbnailImage,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GameSettingsScreen } from "@/modules/game/screens/GameSettingsScreen";

export default function GameSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProject() {
            try {
                const projectId = params.id as string;
                const token = localStorage.getItem("authToken");
                const projectData = await fetchProject(projectId, token || undefined);

                // Authorization check - only project owner can access settings
                if (!isAuthenticated || !user) {
                    router.push(`/game/${projectId}`);
                    return;
                }

                if (user.id !== projectData.userId) {
                    alert("You don't have permission to edit this project.");
                    router.push(`/game/${projectId}`);
                    return;
                }

                setProject(projectData);
            } catch (error) {
                console.error("Error loading project:", error);
                router.push("/");
            } finally {
                setLoading(false);
            }
        }
        loadProject();
    }, [params.id, isAuthenticated, user, router]);

    const handleSave = async (data: {
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
    }) => {
        if (!project) return;

        try {
            const token = localStorage.getItem("authToken");
            const updatedProject = await updateProject(
                project.id,
                {
                    title: data.title,
                    instructions: data.instructions,
                    description: data.description,
                    tags: data.tags,
                    websiteUrl: data.websiteUrl,
                    twitterUrl: data.twitterUrl,
                    discordUrl: data.discordUrl,
                    isPublic: data.isPublic,
                    isMultiplayer: data.isMultiplayer,
                    minPlayers: data.isMultiplayer === true ? data.minPlayers : null,
                    maxPlayers: data.isMultiplayer === true ? data.maxPlayers : null,
                    gameMode: data.gameMode,
                },
                token || undefined
            );

            setProject(updatedProject);
            router.push(`/game/${project.id}`);
        } catch (error) {
            console.error("Error saving settings:", error);
            throw error;
        }
    };

    const handleCancel = () => {
        router.push(`/game/${project?.id}`);
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
            setProject(result.project);
        } catch (error) {
            console.error("Error uploading header image:", error);
            throw error;
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
            setProject(result.project);
        } catch (error) {
            console.error("Error uploading thumbnail image:", error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Project not found</div>
            </div>
        );
    }

    return (
        <GameSettingsScreen
            project={project}
            onSave={handleSave}
            onCancel={handleCancel}
            onHeaderImageUpload={handleHeaderImageUpload}
            onThumbnailImageUpload={handleThumbnailImageUpload}
        />
    );
}
