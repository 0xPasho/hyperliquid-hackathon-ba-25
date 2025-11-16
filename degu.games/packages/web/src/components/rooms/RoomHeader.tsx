"use client";

import { ArrowLeft, Menu, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/components/auth/UserProfile";
import { NetworkBalanceSelector } from "@/components/wallet/NetworkBalanceSelector";
import { useSidebar } from "@/components/ui/sidebar";

interface RoomHeaderProps {
    title: string;
    subtitle?: string;
    onBack: () => void;
    onGameInfo: () => void;
    onToggleSound: () => void;
    onViewTutorial: () => void;
}

export function RoomHeader({
    title,
    subtitle,
    onBack,
    onGameInfo,
    onToggleSound,
    onViewTutorial,
}: RoomHeaderProps) {
    const { isAuthenticated } = useAuth();
    const { toggleSidebar } = useSidebar();

    return (
        <header className="sticky top-0 z-40 bg-[#141414] border-b border-[#2d2d2d] h-[57px] flex items-center">
            <div className="px-4 sm:px-6 w-full">
                <div className="w-full flex items-center justify-between gap-4">
                    {/* Left: Mobile Menu + Back Button + Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="lg:hidden text-gray-400 hover:text-white hover:bg-[#1a1a1a] cursor-pointer flex-shrink-0"
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        {/* Back Button */}
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium hidden sm:inline">
                                Back
                            </span>
                        </button>

                        {/* Title and Subtitle */}
                        <div className="flex-1 min-w-0 hidden md:block">
                            <h1 className="text-base font-semibold text-[#E5E5E5] truncate">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-xs text-[#6B6B6B] truncate">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Balance Selector, User Profile, Options Menu */}
                    <div className="flex items-center gap-3">
                        {/* Balance Selector */}
                        {isAuthenticated && (
                            <div className="hidden sm:block">
                                <NetworkBalanceSelector />
                            </div>
                        )}

                        {/* User Profile */}
                        {isAuthenticated && (
                            <div className="hidden sm:block">
                                <UserProfile />
                            </div>
                        )}

                        {/* Options Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-[#E5E5E5] hover:bg-[#1A1A1A] cursor-pointer"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-[#0F0F0F] border-[#1A1A1A] min-w-[180px]"
                            >
                                <DropdownMenuItem
                                    onClick={onGameInfo}
                                    className="text-[#E5E5E5] hover:bg-[#1A1A1A] cursor-pointer"
                                >
                                    Game Info
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={onToggleSound}
                                    className="text-[#E5E5E5] hover:bg-[#1A1A1A] cursor-pointer"
                                >
                                    Toggle Sound
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={onViewTutorial}
                                    className="text-[#E5E5E5] hover:bg-[#1A1A1A] cursor-pointer"
                                >
                                    View Tutorial
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
}
