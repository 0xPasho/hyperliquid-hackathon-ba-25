"use client";

import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Project, User } from "@/lib/types";
import { AppSidebar } from "../components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import Link from "next/link";
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WhatWerePlayingCarousel } from "../components/WhatWerePlayingCarousel";
import { RankingGameCard } from "../components/RankingGameCard";

interface HomeScreenProps {
    featuredProjects: Project[]; // Hero slider (hardcoded 4 games)
    trendingProjects: Project[]; // "What We're Playing" section
    popularProjects: Project[]; // "Must-Play Games" section
    trendingGamesRanking?: Project[]; // "Trending Games" ranking cards section
    latestProjects?: Project[]; // "New Games We Love" section
    trendingUsers: User[];
    popularUsers: User[];
}

export function HomeScreen({
    featuredProjects,
    trendingProjects,
    popularProjects,
    trendingGamesRanking,
    latestProjects,
    trendingUsers,
    popularUsers,
}: HomeScreenProps) {
    return (
        <SidebarProvider defaultOpen={false}>
            <div className="relative flex min-h-screen w-full bg-black">
                <div className="fixed left-0 top-0 bottom-0 z-50 hidden md:block">
                    <AppSidebar />
                </div>
                <div className="flex-1 md:ml-12 overflow-x-hidden">
                    <AppHeader showBack={false} showSearch={true} />

                    <div className="w-full pb-12">
                        {/* Hero Slider */}
                        <HeroSlider featuredProjects={featuredProjects} />

                        <div className="w-full py-6">
                            <div className="w-full px-6">
                                {/* What We're Playing Carousel - uses trendingProjects */}
                                {trendingProjects.length > 0 && (
                                    <WhatWerePlayingCarousel
                                        projects={trendingProjects}
                                        title="What We're Playing"
                                        subtitle="These favorites are always a great choice"
                                    />
                                )}

                                {/* Must-Play Games Carousel - uses popularProjects */}
                                {popularProjects.length > 0 && (
                                    <WhatWerePlayingCarousel
                                        projects={popularProjects}
                                        title="Must-Play Games"
                                        subtitle="Evolving worlds filled with exciting events"
                                    />
                                )}

                                {/* Trending Games - uses trendingGamesRanking */}
                                {trendingGamesRanking &&
                                    trendingGamesRanking.length > 0 && (
                                        <section className="mb-12">
                                            <div className="mb-6">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h2 className="text-[22px] font-bold text-white">
                                                        Trending Games
                                                    </h2>
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <p className="text-[13px] text-gray-400">
                                                    Highest activity in the past
                                                    hour
                                                </p>
                                            </div>
                                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                                                {trendingGamesRanking.map(
                                                    (project, index) => (
                                                        <div
                                                            key={project.id}
                                                            className="flex-shrink-0 w-[280px] snap-start"
                                                        >
                                                            <RankingGameCard
                                                                project={
                                                                    project
                                                                }
                                                                rank={index + 1}
                                                            />
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </section>
                                    )}

                                {/* New Games We Love - uses latestProjects */}
                                {latestProjects &&
                                    latestProjects.length > 0 && (
                                        <WhatWerePlayingCarousel
                                            projects={latestProjects}
                                            title="New Games We Love"
                                            subtitle="Recently played by plenty of users"
                                        />
                                    )}

                                {/* All-Time Popular */}
                                <section className="mb-12">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-[22px] font-bold text-white">
                                                All-Time Popular
                                            </h2>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <p className="text-[13px] text-gray-400">
                                            Most popular projects of all time
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {popularProjects
                                            .slice(0, 12)
                                            .map((project) => (
                                                <SimpleCard
                                                    key={project.id}
                                                    project={project}
                                                />
                                            ))}
                                    </div>
                                </section>

                                <WhatWerePlayingCarousel
                                    projects={trendingProjects.slice(0, 12)}
                                    title="Multiplayer Games"
                                    subtitle="The favorite multiplayer games"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}

function HeroSlider({ featuredProjects }: { featuredProjects: Project[] }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 5000, stopOnInteraction: false }),
    ]);

    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!emblaApi) return;

        const onSelect = () => {
            setSelectedIndex(emblaApi.selectedScrollSnap());
        };

        emblaApi.on("select", onSelect);
        onSelect();

        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi]);

    if (!featuredProjects || featuredProjects.length === 0) return null;

    return (
        <div className="relative w-full h-[450px] overflow-hidden">
            <div className="embla h-full" ref={emblaRef}>
                <div className="embla__container flex h-full">
                    {featuredProjects.map((project) => {
                        const backgroundImageUrl =
                            project.headerImage || project.thumbnailImage;

                        return (
                            <div
                                key={project.id}
                                className="embla__slide flex-[0_0_100%] min-w-0 relative"
                            >
                                {/* Background Image */}
                                {backgroundImageUrl && (
                                    <div className="absolute inset-0">
                                        <img
                                            src={backgroundImageUrl}
                                            alt={project.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Background overlay */}
                                <div
                                    className={`absolute inset-0 ${
                                        backgroundImageUrl
                                            ? "bg-gradient-to-br from-black/50 via-black/60 to-black/70"
                                            : "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
                                    }`}
                                />

                                {/* Dark gradient from bottom - stronger for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

                                {/* Additional dark gradient from left for text protection */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

                                {/* Content Container */}
                                <div className="relative h-full w-full px-6 flex items-end pb-10">
                                    <div className="flex items-end justify-between gap-8 w-full">
                                        {/* Left Side - Collection Info */}
                                        <div className="flex-1 space-y-4 max-w-2xl">
                                            <Link
                                                href={`/game/${project.id}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <h1 className="text-4xl md:text-5xl font-bold text-white hover:text-gray-300 transition-colors drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                                        {project.title}
                                                    </h1>
                                                    {project.user?.isVerified && (
                                                        <CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-blue-500 flex-shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                                                    )}
                                                </div>
                                            </Link>

                                            <div className="flex items-center gap-2 text-base md:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                                <span className="text-gray-400">
                                                    By
                                                </span>
                                                <Link
                                                    href={`/users/${project.userId}`}
                                                    className="text-white font-medium hover:text-blue-400 transition-colors"
                                                >
                                                    {project.user?.name ||
                                                        "Anonymous"}
                                                </Link>
                                                {project.user?.isVerified && (
                                                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Side - Single Large Thumbnail */}
                                        <div className="hidden lg:block">
                                            <Link
                                                href={`/game/${project.id}`}
                                            >
                                                <div className="w-[280px] h-[280px] rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 bg-neutral-800">
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
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pagination Dots - Bottom Center */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                {featuredProjects.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            index === selectedIndex
                                ? "bg-white w-8"
                                : "bg-white/40 w-2 hover:bg-white/60"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

function FeaturedCard({ project }: { project: Project }) {
    return (
        <Link href={`/game/${project.id}`}>
            <div className="group cursor-pointer rounded-lg overflow-hidden border border-[#2d2d2d] bg-[#141414] hover:border-[#454545] transition-all">
                <div className="relative aspect-[16/9] bg-neutral-900 overflow-hidden">
                    <img
                        src={
                            project.thumbnailImage ||
                            project.headerImage ||
                            "/default-project-image.jpg"
                        }
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <div className="p-4">
                    <h3 className="text-base font-semibold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {project.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                            <span>by</span>
                            <span className="text-gray-300">
                                {project.user?.name || "Anonymous"}
                            </span>
                        </div>
                        <div className="text-gray-500 text-xs">
                            {project._count?.views || 0} views
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function TrendingCard({ project }: { project: Project }) {
    return (
        <Link href={`/game/${project.id}`}>
            <div className="group cursor-pointer rounded-lg border border-[#2d2d2d] bg-[#141414] hover:border-[#454545] transition-all overflow-hidden">
                <div className="relative aspect-square bg-neutral-900">
                    <img
                        src={
                            project.thumbnailImage ||
                            project.headerImage ||
                            "/default-project-image.jpg"
                        }
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <div className="p-3">
                    <h3 className="text-sm font-semibold text-white mb-1 truncate group-hover:text-blue-400 transition-colors">
                        {project.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                            by {project.user?.name || "Anonymous"}
                        </span>
                        <span className="text-gray-600">
                            {project._count?.views || 0}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function SimpleCard({ project }: { project: Project }) {
    return (
        <Link href={`/game/${project.id}`}>
            <div className="group cursor-pointer">
                <div className="relative aspect-square rounded-lg overflow-hidden border border-[#2d2d2d] bg-neutral-900 mb-2 hover:border-[#454545] transition-all">
                    <img
                        src={
                            project.thumbnailImage ||
                            project.headerImage ||
                            "/default-project-image.jpg"
                        }
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <h3 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                    {project.title}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                    {project.user?.name || "Anonymous"}
                </p>
            </div>
        </Link>
    );
}

function CreatorCard({ user, rank }: { user: User; rank: number }) {
    const userInitial =
        user.name?.charAt(0).toUpperCase() ||
        user.walletAddress?.charAt(0).toUpperCase() ||
        "?";

    return (
        <Link href={`/users/${user.id}`}>
            <div className="group cursor-pointer rounded-lg border border-[#2d2d2d] bg-[#141414] hover:border-[#454545] transition-all p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 text-lg font-bold text-gray-600">
                        {rank}
                    </div>
                    <Avatar className="w-14 h-14 flex-shrink-0 border border-[#2d2d2d]">
                        <AvatarImage
                            src={user.profileImage || ""}
                            alt={user.name || "User"}
                        />
                        <AvatarFallback className="bg-neutral-800 text-white text-base font-semibold">
                            {userInitial}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                {user.name || "Anonymous"}
                            </p>
                            {user.isVerified && (
                                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                        </div>
                        {user.bio ? (
                            <p className="text-xs text-gray-500 truncate">
                                {user.bio}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-600">No bio</p>
                        )}
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-gray-600">Trending</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
