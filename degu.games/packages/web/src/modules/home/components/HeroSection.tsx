"use client";

import { useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Project } from "@/lib/types";
import { CheckCircle, Eye, MessageCircle, Heart } from "lucide-react";
import Link from "next/link";

interface HeroSectionProps {
  featuredGames: Project[];
}

export function HeroSection({ featuredGames }: HeroSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 30
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  if (!featuredGames || featuredGames.length === 0) return null;

  return (
    <div className="relative w-full h-[500px] overflow-hidden bg-background">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {featuredGames.map((game) => {
            const imageUrl = game.headerImage || game.thumbnailImage;
            const stats = game.stats || { viewCount: 5, likeCount: 2, commentCount: 1 };

            return (
              <div key={game.id} className="embla__slide flex-[0_0_100%] min-w-0">
                <Link href={`/game/${game.id}`} className="block">
                  <div className="relative w-full h-[500px] overflow-hidden cursor-pointer group">
                    {/* Background Image */}
                    {imageUrl && (
                      <div className="absolute inset-0">
                        <img
                          src={imageUrl}
                          alt={game.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Gradient Overlay - Left to Right */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                    {/* Content Container */}
                    <div className="relative h-full max-w-7xl mx-auto px-8 flex items-center justify-between">
                      {/* Left Side - Info Overlay */}
                      <div className="space-y-4 max-w-xl z-10">
                        {/* Title */}
                        <h2 className="text-5xl font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                          {game.title}
                        </h2>

                        {/* Creator */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#8B8B8B]">By</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white">
                              {game.user?.name || "Anonymous"}
                            </span>
                            {game.user?.isVerified && (
                              <CheckCircle className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-[#8B8B8B]" />
                            <span className="text-white font-medium">{stats.viewCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-[#8B8B8B]" />
                            <span className="text-white font-medium">{stats.likeCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4 text-[#8B8B8B]" />
                            <span className="text-white font-medium">{stats.commentCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Large Thumbnail */}
                      <div className="hidden lg:block">
                        <div className="w-[450px] h-[350px] rounded-xl overflow-hidden border-4 border-white/10 shadow-2xl">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={game.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
                              <span className="text-6xl font-bold text-white opacity-20">
                                {game.title.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
