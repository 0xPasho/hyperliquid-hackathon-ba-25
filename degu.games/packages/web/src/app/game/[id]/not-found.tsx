import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function GameNotFound() {
    return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-white">404</h1>
                    <h2 className="text-2xl font-semibold text-white">Game Not Found</h2>
                    <p className="text-gray-400">
                        This game doesn't exist or is not publicly available yet.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                    <Link href="/">
                        <Button className="bg-[#007AFF] hover:bg-[#0066CC] text-white">
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="border-[#2d2d2d] text-white hover:bg-[#1c1c1e]">
                            <Search className="w-4 h-4 mr-2" />
                            Browse Games
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
