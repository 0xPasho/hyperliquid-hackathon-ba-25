import { Project } from "@/lib/types";
import Link from "next/link";
import { CheckCircle, Play, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeaturedCollectionsProps {
  collections: Project[];
}

export function FeaturedCollections({ collections }: FeaturedCollectionsProps) {
  const getGameStats = (game: Project) => {
    const projectData = game.projectData as {
      targets?: Array<{ isStage?: boolean; blocks?: Record<string, unknown> }>;
    };
    const sprites = projectData.targets?.filter((t) => !t.isStage) || [];
    const blocks = projectData.targets?.reduce(
      (sum, target) => sum + (target.blocks ? Object.keys(target.blocks).length : 0),
      0
    ) || 0;

    return {
      sprites: sprites.length,
      blocks: blocks,
      // Random player count for demo
      players: Math.floor(Math.random() * 5000) + 100,
    };
  };

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-foreground mb-3">Featured Games</h2>
          <p className="text-muted-foreground400 text-lg">Discover the most popular blockchain games</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((game) => {
            const stats = getGameStats(game);

            return (
              <Link
                key={game.id}
                href={`/game/${game.id}`}
                className="group"
              >
                <Card className="bg-card border-border hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden">
                  {/* Game Preview/Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
                    <img
                      src={game.thumbnailImage || game.headerImage || "/default-project-image.jpg"}
                      alt={game.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-16 h-16 text-foreground" fill="white" />
                      </div>
                    </div>
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  <CardContent className="p-5">
                    {/* Game Title */}
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-blue-400 transition-colors line-clamp-1">
                        {game.title}
                      </h3>
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    </div>

                    {/* Creator */}
                    <p className="text-sm text-muted-foreground400 mb-4">By Anonymous Creator</p>

                    {/* Game Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground400" />
                        <span className="text-sm text-muted-foreground300">{stats.players.toLocaleString()} players</span>
                      </div>
                      <div className="text-sm text-muted-foreground400">
                        {stats.sprites} sprites • {stats.blocks} blocks
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
