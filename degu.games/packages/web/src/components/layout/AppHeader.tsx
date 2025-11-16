"use client";

import { useState, useEffect } from "react";
import { Search, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserProfile } from "@/components/auth/UserProfile";
import { useRouter, usePathname } from "next/navigation";
import { SearchModal } from "@/components/SearchModal";
import { useSidebar } from "@/components/ui/sidebar";
import { NetworkBalanceSelector } from "@/components/wallet/NetworkBalanceSelector";
import Link from "next/link";

interface AppHeaderProps {
    showBack?: boolean;
    showSearch?: boolean;
    backPath?: string;
}

export function AppHeader({
    showBack = false,
    showSearch = true,
    backPath = "/",
}: AppHeaderProps) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [showSearchModal, setShowSearchModal] = useState(false);
    const { toggleSidebar } = useSidebar();

    // Keyboard shortcut to open search (/)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === "/" &&
                !showSearchModal &&
                document.activeElement?.tagName !== "INPUT" &&
                document.activeElement?.tagName !== "TEXTAREA"
            ) {
                e.preventDefault();
                setShowSearchModal(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showSearchModal]);

    return (
        <header className="sticky top-0 z-40 bg-[#141414] border-b border-[#2d2d2d] h-[57px] flex items-center">
            <div className="px-6 w-full">
                <div className="w-full flex items-center justify-between gap-6">
                    {/* Left: Mobile Menu + Search Bar or Back Button */}
                    <div className="flex items-center gap-3 flex-1 max-w-xl">
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

                        {showBack ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(backPath)}
                                className="text-gray-400 hover:text-white hover:bg-[#1a1a1a] cursor-pointer flex-shrink-0"
                            >
                                ← Back
                            </Button>
                        ) : null}

                        {showSearch && (
                            <div className="relative flex-1 max-w-2xl">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B8B8B] w-4 h-4 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search Degu.Games"
                                    onClick={() => setShowSearchModal(true)}
                                    readOnly
                                    className="w-full bg-[#0F0F0F] text-[#E5E5E5] placeholder-[#6B6B6B] rounded-xl pl-11 pr-16 py-2.5 text-[15px] focus:outline-none focus:ring-1 focus:ring-[#3B3B3B] border border-[#1A1A1A] transition-all duration-150 cursor-pointer hover:border-[#252525] hover:bg-[#141414]"
                                />
                                <kbd className="absolute right-4 top-1/2 transform -translate-y-1/2 px-2 py-0.5 text-[11px] font-medium text-[#6B6B6B] bg-[#1A1A1A] rounded border border-[#252525] pointer-events-none">
                                    /
                                </kbd>
                            </div>
                        )}
                    </div>

                    {/* Right: Balance Selector & Auth buttons & User Menu */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated && <NetworkBalanceSelector />}
                        {isAuthenticated ? <UserProfile /> : <LoginButton />}
                    </div>
                </div>
            </div>

            {/* Search Modal */}
            <SearchModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
            />
        </header>
    );
}
