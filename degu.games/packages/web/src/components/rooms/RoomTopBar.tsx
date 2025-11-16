"use client";

import { ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoomTopBarProps {
    title: string;
    subtitle?: string;
    onBack: () => void;
    onGameInfo: () => void;
    onToggleSound: () => void;
    onViewTutorial: () => void;
}

export function RoomTopBar({
    title,
    subtitle,
    onBack,
    onGameInfo,
    onToggleSound,
    onViewTutorial,
}: RoomTopBarProps) {
    return (
        <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-[#1A1A1A]">
            {/* Left: Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-[#E5E5E5] hover:bg-[#1A1A1A] p-2"
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* Center: Title */}
            <div className="flex-1 text-center px-4 min-w-0">
                <h1 className="text-base font-semibold text-[#E5E5E5] truncate">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-xs text-[#6B6B6B] truncate">{subtitle}</p>
                )}
            </div>

            {/* Right: Options Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#E5E5E5] hover:bg-[#1A1A1A] p-2"
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
    );
}
