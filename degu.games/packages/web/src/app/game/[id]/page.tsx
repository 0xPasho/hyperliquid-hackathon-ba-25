import type { Metadata } from "next";
import { cookies } from "next/headers";
import { fetchProject } from "@/lib/api";
import { GameScreen } from "@/modules/game/screens/GameScreen";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface GamePageProps {
    params: {
        id: string;
    };
}

// Helper to get auth token from cookies
async function getAuthToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    return token;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
    const project = await fetchProject(params.id);

    if (!project) {
        return {
            title: "Game Not Found",
        };
    }

    const title = `${project.title} - Play on Degu.Games`;
    const description = project.description || `Play ${project.title} on Degu.Games. Join multiplayer rooms, compete with other players, and earn rewards.`;
    const imageUrl = project.thumbnailImage || project.headerImage || "/logo.png";

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [imageUrl],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function GamePage({ params }: GamePageProps) {
    const token = await getAuthToken();
    const project = await fetchProject(params.id, token);

    if (!project) {
        notFound();
    }

    // If project is not public, check if user is the owner
    // Note: In a server component, we can't easily get the current user without another API call
    // The fetchProject API should handle this on the backend - if the user is authenticated
    // and is the owner, it should return the project even if not public
    // Otherwise, if not public and not owner, it returns null

    return <GameScreen project={project} />;
}
