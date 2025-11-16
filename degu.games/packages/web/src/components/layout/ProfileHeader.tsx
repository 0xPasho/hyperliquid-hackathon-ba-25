"use client";

import { useState, useEffect } from "react";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserProfile } from "@/components/auth/UserProfile";
import { useRouter } from "next/navigation";
import { SearchModal } from "@/components/SearchModal";
import { useSidebar } from "@/components/ui/sidebar";

interface ProfileHeaderProps {
    showBack?: boolean;
    backPath?: string;
}

export function ProfileHeader({
    showBack = false,
    backPath = "/",
}: ProfileHeaderProps) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
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
        <>
            <div className="absolute top-0 left-0 right-0 z-50">
                <div className="px-6 py-4">
                    <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-6">
                        {/* Left: Mobile Menu + Search Bar or Back Button */}
                        <div className="flex items-center gap-3 flex-1 max-w-xl">
                            {/* Mobile Menu Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleSidebar}
                                className="lg:hidden text-white/80 hover:text-white hover:bg-white/10 cursor-pointer flex-shrink-0 backdrop-blur-sm"
                                aria-label="Toggle menu"
                            >
                                <Menu className="w-5 h-5" />
                            </Button>

                            {showBack && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(backPath)}
                                    className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer flex-shrink-0 backdrop-blur-sm"
                                >
                                    ← Back
                                </Button>
                            )}

                            <div className="relative flex-1 max-w-[460px]">
                                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/80 w-[18px] h-[18px] pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search Degu.Games"
                                    onClick={() => setShowSearchModal(true)}
                                    readOnly
                                    className="w-full bg-[rgba(0,0,0,0.5)] text-white placeholder-white/80 rounded-lg pl-11 pr-12 py-2.5 text-[15px] font-normal focus:outline-none focus:ring-0 border border-[#000] transition-all cursor-pointer hover:bg-[rgba(0,0,0,0.6)] hover:border-[#000]"
                                    style={{
                                        WebkitBackdropFilter: "blur(12px)",
                                        backdropFilter: "blur(12px)",
                                    }}
                                />
                                <kbd className="absolute right-3.5 top-1/2 transform -translate-y-1/2 px-1.5 py-0.5 text-[12px] font-normal text-white/80 bg-transparent rounded border border-[#000] pointer-events-none">
                                    /
                                </kbd>
                            </div>
                        </div>

                        {/* Right: Auth buttons & User Menu */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <UserProfile />
                            ) : (
                                <LoginButton />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Modal */}
            <SearchModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
            />
        </>
    );
}
