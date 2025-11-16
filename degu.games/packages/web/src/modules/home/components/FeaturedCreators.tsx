import { CheckCircle, Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Creator {
  id: string;
  name: string;
  verified: boolean;
  games: number;
  totalPlays: number;
  avatar?: string;
}

// Mock data for featured creators
const featuredCreators: Creator[] = [
  {
    id: "1",
    name: "BlockMaster",
    verified: true,
    games: 24,
    totalPlays: 125000,
  },
  {
    id: "2",
    name: "PixelPioneer",
    verified: true,
    games: 18,
    totalPlays: 98000,
  },
  {
    id: "3",
    name: "CodeCrafterX",
    verified: true,
    games: 32,
    totalPlays: 210000,
  },
  {
    id: "4",
    name: "GameDevPro",
    verified: true,
    games: 15,
    totalPlays: 75000,
  },
];

export function FeaturedCreators() {
  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-foreground mb-3">Featured Creators</h2>
          <p className="text-muted-foreground400 text-lg">Meet the top game developers in our community</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCreators.map((creator) => (
            <Card
              key={creator.id}
              className="bg-card border-border hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer group"
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                {/* Avatar */}
                <Avatar className="w-24 h-24 mb-4 ring-4 ring-blue-500/20 group-hover:ring-blue-500/50 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-foreground text-2xl font-bold">
                    {creator.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Creator Name */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-blue-400 transition-colors">
                    {creator.name}
                  </h3>
                  {creator.verified && (
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  )}
                </div>

                {/* Stats */}
                <div className="w-full mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground400">Games</span>
                    <div className="flex items-center gap-1.5 text-foreground font-semibold">
                      <Gamepad2 className="w-4 h-4" />
                      {creator.games}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground400">Total Plays</span>
                    <span className="text-foreground font-semibold">
                      {(creator.totalPlays / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
