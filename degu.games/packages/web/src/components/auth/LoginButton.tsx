"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function LoginButton() {
    const { login, loading } = useAuth();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        try {
            setIsLoggingIn(true);
            await login();
        } catch (error) {
            console.error("Login failed:", error);
            // You can add toast notification here
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <Button
            onClick={handleLogin}
            disabled={loading || isLoggingIn}
            variant="outline"
            className="bg-transparent border-border text-foreground hover:bg-muted"
        >
            {isLoggingIn ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                </>
            ) : (
                "Connect Wallet"
            )}
        </Button>
    );
}
