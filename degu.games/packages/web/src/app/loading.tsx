"use client";

import { AppSidebar } from "@/modules/home/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export default function HomeLoading() {
    return (
        <SidebarProvider defaultOpen={false}>
            <div className="relative flex min-h-screen w-full bg-black">
                <div className="fixed left-0 top-0 bottom-0 z-50 hidden md:block">
                    <AppSidebar />
                </div>
                <div className="flex-1 md:ml-12 overflow-x-hidden">
                    <AppHeader showBack={false} showSearch={true} />

                    <div className="w-full pb-12">
                        {/* Hero Slider Skeleton */}
                        <div className="relative w-full h-[450px] bg-gray-700 animate-pulse">
                            {/* Content placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <div className="relative h-full w-full px-6 flex items-end pb-10">
                                    <div className="flex items-end justify-between gap-8 w-full">
                                        {/* Left Side - Title and creator */}
                                        <div className="flex-1 space-y-4 max-w-2xl">
                                            <div className="h-12 w-96 bg-gray-600 rounded animate-pulse" />
                                            <div className="h-6 w-48 bg-gray-600 rounded animate-pulse" />
                                        </div>
                                        {/* Right Side - Thumbnail */}
                                        <div className="hidden lg:block w-[280px] h-[280px] rounded-lg bg-gray-600 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                            {/* Pagination dots */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-2 w-2 rounded-full bg-white/40"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="w-full py-6">
                            <div className="w-full px-6">
                                {/* What We're Playing Carousel Skeleton */}
                                <section className="mb-12">
                                    <div className="mb-6">
                                        <div className="h-7 w-64 bg-gray-700 rounded animate-pulse mb-2" />
                                        <div className="h-4 w-80 bg-gray-700 rounded animate-pulse" />
                                    </div>
                                    <div className="flex gap-4 overflow-hidden">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div
                                                key={i}
                                                className="flex-shrink-0 w-[200px]"
                                            >
                                                <div className="aspect-square rounded-lg bg-gray-700 animate-pulse mb-3" />
                                                <div className="h-4 w-full bg-gray-700 rounded animate-pulse mb-2" />
                                                <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Must-Play Games Carousel Skeleton */}
                                <section className="mb-12">
                                    <div className="mb-6">
                                        <div className="h-7 w-64 bg-gray-700 rounded animate-pulse mb-2" />
                                        <div className="h-4 w-80 bg-gray-700 rounded animate-pulse" />
                                    </div>
                                    <div className="flex gap-4 overflow-hidden">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div
                                                key={i}
                                                className="flex-shrink-0 w-[200px]"
                                            >
                                                <div className="aspect-square rounded-lg bg-gray-700 animate-pulse mb-3" />
                                                <div className="h-4 w-full bg-gray-700 rounded animate-pulse mb-2" />
                                                <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Trending Games Ranking Cards Skeleton */}
                                <section className="mb-12">
                                    <div className="mb-6">
                                        <div className="h-7 w-64 bg-gray-700 rounded animate-pulse mb-2" />
                                        <div className="h-4 w-80 bg-gray-700 rounded animate-pulse" />
                                    </div>
                                    <div className="flex gap-4 overflow-hidden">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className="flex-shrink-0 w-[280px]"
                                            >
                                                <div className="rounded-lg bg-gray-700 animate-pulse p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-12 h-12 rounded bg-gray-600 animate-pulse" />
                                                        <div className="flex-1">
                                                            <div className="h-5 w-full bg-gray-600 rounded animate-pulse mb-2" />
                                                            <div className="h-3 w-24 bg-gray-600 rounded animate-pulse" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 h-16 bg-gray-600 rounded animate-pulse" />
                                                        <div className="flex-1 h-16 bg-gray-600 rounded animate-pulse" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* All-Time Popular Grid Skeleton */}
                                <section className="mb-12">
                                    <div className="mb-6">
                                        <div className="h-7 w-64 bg-gray-700 rounded animate-pulse mb-2" />
                                        <div className="h-4 w-80 bg-gray-700 rounded animate-pulse" />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="aspect-square rounded-lg bg-gray-700 animate-pulse" />
                                                <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
                                                <div className="h-3 w-20 bg-gray-700 rounded animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Multiplayer Games Carousel Skeleton */}
                                <section className="mb-12">
                                    <div className="mb-6">
                                        <div className="h-7 w-64 bg-gray-700 rounded animate-pulse mb-2" />
                                        <div className="h-4 w-80 bg-gray-700 rounded animate-pulse" />
                                    </div>
                                    <div className="flex gap-4 overflow-hidden">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div
                                                key={i}
                                                className="flex-shrink-0 w-[200px]"
                                            >
                                                <div className="aspect-square rounded-lg bg-gray-700 animate-pulse mb-3" />
                                                <div className="h-4 w-full bg-gray-700 rounded animate-pulse mb-2" />
                                                <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}
