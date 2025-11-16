"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Room } from "@/lib/room-api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TutorialSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: Room;
}

export function TutorialSheet({
    open,
    onOpenChange,
    room,
}: TutorialSheetProps) {
    const instructions = room.project?.instructions;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>How to Play</SheetTitle>
                    <SheetDescription>
                        Game instructions and tutorial
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    {instructions ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {instructions}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-[#6B6B6B] text-sm">
                                No instructions available for this game.
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
