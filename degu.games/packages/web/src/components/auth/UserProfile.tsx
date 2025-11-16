"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Wallet, Copy, Check, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserProfile() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    if (!user) return null;

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const handleCopyAddress = () => {
        if (user.walletAddress) {
            navigator.clipboard.writeText(user.walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-muted border border-border hover:border-input flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <Avatar className="w-10 h-10">
                        <AvatarImage
                            src={user.profileImage}
                            alt={user.name || "User"}
                        />
                        <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {user.name || "Anonymous"}
                        </p>
                        {user.email && (
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                        if (user?.id) {
                            router.push(`/users/${user.id}`);
                        } else {
                            console.error("User ID is missing");
                        }
                    }}
                >
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                        if (user?.id) {
                            router.push(`/users/${user.id}/edit`);
                        } else {
                            console.error("User ID is missing");
                        }
                    }}
                >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                {user.walletAddress ? (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={handleCopyAddress}
                    >
                        <Wallet className="mr-2 h-4 w-4" />
                        <span className="flex-1">
                            {truncateAddress(user.walletAddress)}
                        </span>
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => router.push(`/users/${user.id}/edit`)}
                    >
                        <Wallet className="mr-2 h-4 w-4" />
                        <span className="flex-1 text-muted-foreground">
                            Link Wallet
                        </span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
