"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface PlayButtonProps {
  projectId: string;
}

export function PlayButton({ projectId }: PlayButtonProps) {
  const handlePlayClick = () => {
    const studioUrl = process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:8601";
    window.location.href = `${studioUrl}?project=${projectId}`;
  };

  return (
    <Button size="lg" className="gap-2" onClick={handlePlayClick}>
      <Play className="size-5" />
      Play Project
    </Button>
  );
}
