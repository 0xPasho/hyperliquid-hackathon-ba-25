"use client";

import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronRight as ArrowRight,
} from "lucide-react";
import { Project } from "@/lib/types";
import { GameDisplayCard } from "./GameDisplayCard";
import { cn } from "@/lib/utils";

interface WhatWerePlayingCarouselProps {
    projects: Project[];
    title?: string;
    subtitle?: string;
}

// Helper function to chunk array into groups of 9 (3x3 grid)
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export function WhatWerePlayingCarousel({
    projects,
    title,
    subtitle,
}: WhatWerePlayingCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: "start",
    });

    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setPrevBtnEnabled(emblaApi.canScrollPrev());
        setNextBtnEnabled(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        onSelect();
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);

        return () => {
            emblaApi.off("select", onSelect);
            emblaApi.off("reInit", onSelect);
        };
    }, [emblaApi, onSelect]);

    if (!projects || projects.length === 0) return null;

    // Split projects into pages of 9 (3x3 grid per page)
    const projectPages = chunkArray(projects, 9);

    return (
        <section className="mb-12">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-[22px] font-bold text-white">
                        {title}
                    </h2>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-[13px] text-gray-400">{subtitle}</p>
            </div>

            {/* Carousel Container */}
            <div
                className="relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Navigation Buttons */}
                {prevBtnEnabled && (
                    <button
                        className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full",
                            "bg-[#1a1a1a]/90 backdrop-blur-sm",
                            "flex items-center justify-center text-white",
                            "hover:bg-[#1a1a1a] transition-all",
                            "transform -translate-x-1/2 shadow-lg",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                        onClick={scrollPrev}
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}

                {nextBtnEnabled && (
                    <button
                        className={cn(
                            "absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full",
                            "bg-[#1a1a1a]/90 backdrop-blur-sm",
                            "flex items-center justify-center text-white",
                            "hover:bg-[#1a1a1a] transition-all",
                            "transform translate-x-1/2 shadow-lg",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                        onClick={scrollNext}
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}

                {/* Embla Carousel */}
                <div className="embla overflow-hidden" ref={emblaRef}>
                    <div className="embla__container flex">
                        {projectPages.map((page, pageIndex) => (
                            <div
                                key={pageIndex}
                                className="embla__slide flex-[0_0_100%] min-w-0"
                            >
                                {/* 3x3 Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                    {page.map((project) => (
                                        <GameDisplayCard
                                            key={project.id}
                                            project={project}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
