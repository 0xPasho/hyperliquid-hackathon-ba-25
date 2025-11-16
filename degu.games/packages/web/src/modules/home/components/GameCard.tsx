import { Project } from "@/lib/types";
import Link from "next/link";
import { Play, MoreVertical, Copy } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { duplicateProject } from "@/lib/api";
import { generateInitials } from "@/lib/avatar-utils";

interface GameCardProps {
  game: Project;
}

export function GameCard({ game }: GameCardProps) {
  const { toast } = useToast();
  const { user, getToken } = useAuth();

  const projectData = game.projectData as {
    targets?: Array<{ isStage?: boolean; blocks?: Record<string, unknown> }>;
  };
  const sprites = projectData.targets?.filter((t) => !t.isStage) || [];
  const totalBlocks = projectData.targets?.reduce(
    (sum, target) => sum + (target.blocks ? Object.keys(target.blocks).length : 0),
    0
  ) || 0;

  // Generate a random price for demo purposes
  const price = (Math.random() * 2 + 0.5).toFixed(3);
  const priceChange = ((Math.random() - 0.5) * 50).toFixed(1);
  const isPositive = parseFloat(priceChange) > 0;

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = await getToken();
    if (!token) {
      toast({ title: "Error", description: "Please log in first", variant: "destructive" });
      return;
    }

    const duplicate = await duplicateProject(game.id, token);
    if (duplicate) {
      toast({ title: "Success", description: `Created "${duplicate.title}"` });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast({ title: "Error", description: "Failed to duplicate project", variant: "destructive" });
    }
  };

  return (
    <Link href={`/game/${game.id}`}>
      <div className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-white/30 transition-all hover:shadow-xl hover:shadow-purple-500/20 hover:bg-[#1c1c1e]/30 cursor-pointer">
        {/* Image/Preview */}
        <div className="relative aspect-square bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center overflow-hidden">
          {/* Background Image with Avatar fallback */}
          {game.thumbnailImage || game.headerImage ? (
            <img
              src={game.thumbnailImage || game.headerImage || "/default-project-image.jpg"}
              alt={game.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <span className="text-white text-6xl font-bold">
                {generateInitials(game.title)}
              </span>
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-foreground fill-white" />
            </div>
          </div>

          {/* Three-dot menu (only show for owner) */}
          {user?.id === game.userId && (
            <div className="absolute top-3 left-3 z-10" onClick={(e) => e.preventDefault()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-black/80">
                    <MoreVertical className="w-4 h-4 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Stats badge */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-foreground">
            {sprites.length} sprites · {totalBlocks} blocks
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-foreground font-semibold text-lg mb-2 truncate group-hover:text-blue-400 transition-colors">
            {game.title}
          </h3>

          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-muted-foreground400 text-xs mb-1">Floor price</p>
              <p className="text-foreground font-semibold">{price} ETH</p>
            </div>
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                isPositive ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
              }`}
            >
              {isPositive ? "+" : ""}
              {priceChange}%
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
