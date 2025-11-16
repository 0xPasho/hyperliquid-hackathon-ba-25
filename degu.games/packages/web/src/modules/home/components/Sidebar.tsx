"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
    Compass,
    Search,
    Gamepad2,
    Plus,
    User,
    Settings,
    ChevronRight,
    PersonStanding,
} from "lucide-react";
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { NewGameModal } from "@/components/NewGameModal";
import { SearchModal } from "@/components/SearchModal";

interface NavigationItem {
    name: string;
    href?: string;
    icon: LucideIcon;
    onClick?: () => void;
    requiresAuth?: boolean;
}

export function AppSidebar() {
    const pathname = usePathname();
    const { setOpen } = useSidebar();
    const { user, isAuthenticated } = useAuth();
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showNewGameModal, setShowNewGameModal] = useState(false);

    const handleMouseEnter = () => {
        setOpen(true);
    };

    const handleMouseLeave = () => {
        setOpen(false);
    };

    const navigation: NavigationItem[] = [
        { name: "Discover", href: "/", icon: Compass },
        {
            name: "Search",
            icon: Search,
            onClick: () => setShowSearchModal(true),
        },
        {
            name: "My Games",
            href: user ? `/users/${user.id}` : "/",
            icon: Gamepad2,
            requiresAuth: true,
        },
        {
            name: "Create Game",
            icon: Plus,
            onClick: () => setShowNewGameModal(true),
            requiresAuth: true,
        },
        {
            name: "PolkaVM Contract Testing",
            icon: PersonStanding,
            href: "/test",
        },
    ];

    const bottomNavigation: NavigationItem[] = [
        {
            name: "Profile",
            href: user ? `/users/${user.id}` : "/",
            icon: User,
            requiresAuth: true,
        },
        {
            name: "Settings",
            href: user ? `/users/${user.id}/edit` : "/",
            icon: Settings,
            requiresAuth: true,
        },
    ];

    return (
        <ShadcnSidebar
            collapsible="icon"
            className="border-r border-border"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Logo Header */}
            <SidebarHeader className="border-b border-border p-0 h-[57px]">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 h-full group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center transition-all duration-200"
                >
                    <img
                        src="/logo.png"
                        alt="Degu.Games"
                        className="w-10 h-10 object-contain flex-shrink-0 transition-transform group-data-[collapsible=icon]:scale-90"
                    />
                    <span className="text-2xl mt-2 font-bold text-foreground group-data-[collapsible=icon]:hidden transition-opacity font-[family-name:var(--font-special-elite)]">
                        Degu.Games
                    </span>
                </Link>
            </SidebarHeader>

            {/* Main Navigation */}
            <SidebarContent className="px-2 py-4">
                <SidebarMenu>
                    {navigation.map((item) => {
                        // Skip items that require auth if user is not authenticated
                        if (item.requiresAuth && !isAuthenticated) {
                            return null;
                        }

                        const isActive = item.href
                            ? pathname === item.href
                            : false;
                        const isClickable = !!item.onClick;

                        return (
                            <SidebarMenuItem key={item.name}>
                                <SidebarMenuButton
                                    asChild={!isClickable}
                                    isActive={isActive}
                                    tooltip={item.name}
                                    onClick={
                                        isClickable ? item.onClick : undefined
                                    }
                                    className={`
                    h-11 px-3 rounded-xl transition-all duration-200 ease-in-out cursor-pointer
                    ${
                        isActive
                            ? "bg-white/10 text-foreground font-medium"
                            : "text-muted-foreground400 hover:text-foreground hover:bg-white/5 hover:scale-[1.02]"
                    }
                    group-data-[collapsible=icon]:h-11
                    group-data-[collapsible=icon]:w-11
                    group-data-[collapsible=icon]:justify-center
                    active:scale-[0.98]
                  `}
                                >
                                    {item.href ? (
                                        <Link href={item.href}>
                                            <item.icon className="w-5 h-5 flex-shrink-0" />
                                            <span className="group-data-[collapsible=icon]:hidden transition-opacity duration-200">
                                                {item.name}
                                            </span>
                                        </Link>
                                    ) : (
                                        <>
                                            <item.icon className="w-5 h-5 flex-shrink-0" />
                                            <span className="group-data-[collapsible=icon]:hidden transition-opacity duration-200">
                                                {item.name}
                                            </span>
                                        </>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            {/* Bottom Navigation */}
            <SidebarFooter className="border-t border-border p-2 mt-auto">
                <SidebarMenu>
                    {bottomNavigation.map((item) => {
                        // Skip items that require auth if user is not authenticated
                        if (item.requiresAuth && !isAuthenticated) {
                            return null;
                        }

                        const isActive = item.href
                            ? pathname === item.href
                            : false;

                        return (
                            <SidebarMenuItem key={item.name}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={item.name}
                                    className={`
                    h-11 px-3 rounded-xl transition-all duration-200 ease-in-out
                    ${
                        isActive
                            ? "bg-white/10 text-foreground font-medium"
                            : "text-muted-foreground400 hover:text-foreground hover:bg-white/5 hover:scale-[1.02]"
                    }
                    group-data-[collapsible=icon]:h-11
                    group-data-[collapsible=icon]:w-11
                    group-data-[collapsible=icon]:justify-center
                    active:scale-[0.98]
                  `}
                                >
                                    <Link href={item.href!} className="w-full">
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="group-data-[collapsible=icon]:hidden flex-1 transition-opacity duration-200">
                                            {item.name}
                                        </span>
                                        <ChevronRight className="w-4 h-4 flex-shrink-0 group-data-[collapsible=icon]:hidden transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarFooter>

            {/* Rail for hover interaction */}
            <SidebarRail />

            {/* Search Modal */}
            {showSearchModal && (
                <div
                    className="fixed inset-0 z-50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget)
                            setShowSearchModal(false);
                    }}
                >
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowSearchModal(false)}
                    />
                    <SearchModalContent
                        onClose={() => setShowSearchModal(false)}
                    />
                </div>
            )}

            {/* New Game Modal */}
            {showNewGameModal && (
                <NewGameModal onClose={() => setShowNewGameModal(false)} />
            )}
        </ShadcnSidebar>
    );
}

// SearchModal component
function SearchModalContent({ onClose }: { onClose: () => void }) {
    return <SearchModal isOpen={true} onClose={onClose} />;
}
