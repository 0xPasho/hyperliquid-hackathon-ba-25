import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function VerifiedBadge({ className, size = "md" }: VerifiedBadgeProps) {
    const sizeClasses = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
    };

    return (
        <BadgeCheck
            className={cn(
                "text-blue-500 fill-blue-500/20",
                sizeClasses[size],
                className
            )}
            aria-label="Verified"
        />
    );
}
