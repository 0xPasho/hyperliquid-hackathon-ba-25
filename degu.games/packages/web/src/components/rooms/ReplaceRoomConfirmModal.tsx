"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ReplaceRoomConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    existingRoomId: string;
}

export function ReplaceRoomConfirmModal({
    open,
    onOpenChange,
    onConfirm,
    existingRoomId,
}: ReplaceRoomConfirmModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        </div>
                        <DialogTitle>Replace Existing Room?</DialogTitle>
                    </div>
                    <DialogDescription className="pt-4">
                        You already have a room for this single-player game. Creating
                        a new room will remove the existing one.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 border rounded-lg p-4 my-2">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                            Existing Room ID:
                        </span>{" "}
                        {existingRoomId}
                    </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="bg-yellow-600 hover:bg-yellow-700"
                    >
                        Replace Room
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
