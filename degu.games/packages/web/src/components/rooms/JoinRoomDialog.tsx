"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Shield } from "lucide-react";
import { Room, joinRoom } from "@/lib/room-api";
import { useWallets } from "@privy-io/react-auth";
import { payAndJoinGame } from "@/lib/user-escrow-client";
import { createWalletClientFromPrivy } from "@/lib/privy-wallet-client";
import { getNetworkByChainId } from "@/lib/networks";

interface JoinRoomDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: Room;
    userId: string;
    walletAddress?: string;
    onJoinSuccess: () => void;
}

export function JoinRoomDialog({
    open,
    onOpenChange,
    room,
    userId,
    walletAddress,
    onJoinSuccess
}: JoinRoomDialogProps) {
    // Privy wallet hooks
    const { wallets } = useWallets();

    const [step, setStep] = useState<'confirm' | 'joining'>('confirm');
    const [error, setError] = useState<string | null>(null);
    const [paymentProgress, setPaymentProgress] = useState<string>("");

    const isPaidRoom = !!room.blockchainGameId && !!room.entryFee;

    const handleJoin = async () => {
        setStep('joining');
        setError(null);
        setPaymentProgress("Joining room...");

        try {
            // Check if player is rejoining (already in room with leftAt timestamp)
            const existingPlayer = room.players?.find(p => p.userId === userId);
            const isRejoin = existingPlayer && existingPlayer.leftAt;
            const alreadyPaid = existingPlayer?.hasPaid === true;
            const alreadyInRoom = existingPlayer && !existingPlayer.leftAt;

            // If user is already in the room and never left, they don't need to join again
            if (alreadyInRoom) {
                console.log("[JoinRoom] User already in room, refreshing...");
                setPaymentProgress("");
                onOpenChange(false);
                onJoinSuccess();
                return;
            }

            // If paid room, user must pay entry fee from their wallet (unless rejoining and already paid)
            if (isPaidRoom && room.blockchainGameId && room.entryFee && !alreadyPaid) {
                setPaymentProgress("Preparing payment...");

                // Get wallet
                const wallet = wallets[0];
                if (!wallet) {
                    setError("No wallet found. Please connect your wallet.");
                    setStep('confirm');
                    setPaymentProgress("");
                    return;
                }

                // Get network configuration
                const currentNetwork = getNetworkByChainId(room.chainId);
                if (!currentNetwork) {
                    throw new Error(`Unsupported network: ${room.chainId}`);
                }

                // Get token address for the room's currency
                const tokenData = currentNetwork.tokens.find(t => t.symbol === room.tokenSymbol);
                const tokenAddress = tokenData?.address || currentNetwork.tokens[0].address;

                // Create wallet client compatible with user-escrow-client
                const walletClient = createWalletClientFromPrivy(wallet, room.chainId);

                // Pay entry fee and join game
                console.log("[JoinRoom] Player paying entry fee...", {
                    gameId: room.blockchainGameId,
                    entryFee: room.entryFee,
                    wallet: wallet.address,
                    tokenAddress,
                    escrowAddress: currentNetwork.gameEscrowAddress,
                });

                const paymentResult = await payAndJoinGame(
                    walletClient,
                    wallet.address,
                    room.blockchainGameId,
                    room.entryFee,
                    tokenAddress,
                    currentNetwork.gameEscrowAddress,
                    0, // teamId
                    setPaymentProgress
                );

                if (!paymentResult.success) {
                    setError(paymentResult.error || "Failed to pay entry fee");
                    setStep('confirm');
                    setPaymentProgress("");
                    return;
                }

                console.log("[JoinRoom] ✅ Payment successful:", paymentResult.txHash);
            } else if (alreadyPaid) {
                console.log("[JoinRoom] Player rejoining - skipping payment (already paid)");
                setPaymentProgress("Rejoining room...");
            }

            // Call backend API to join room (register user in room)
            setPaymentProgress("Completing join...");
            const token = localStorage.getItem("authToken");

            // If this is a paid room, mark player as paid (they paid on-chain above)
            const hasPaid = isPaidRoom && (alreadyPaid || true); // true because payment succeeded

            console.log('[JoinRoom] Joining room via backend API...', {
                isPaidRoom,
                alreadyPaid,
                hasPaid,
                userId
            });

            const result = await joinRoom(
                room.id,
                userId,
                walletAddress,
                undefined, // password
                token || undefined,
                hasPaid
            );

            if (!result.success) {
                console.error(result.error || 'Failed to join room');
                setError(result.error || 'Failed to join room');
                setStep('confirm');
                setPaymentProgress("");
                return;
            }

            console.log('[JoinRoom] ✅ Joined room successfully');

            // Success!
            setPaymentProgress("");
            onOpenChange(false);
            onJoinSuccess();

        } catch (err) {
            console.error('[JoinRoom] Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to join room');
            setStep('confirm');
            setPaymentProgress("");
        }
    };

    const resetDialog = () => {
        setStep('confirm');
        setError(null);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetDialog();
        }
        onOpenChange(newOpen);
    };

    const totalPrizePool = isPaidRoom && room.entryFee && room.maxPlayers
        ? (parseFloat(room.entryFee) * room.maxPlayers).toFixed(2)
        : '0';

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>
                        {isPaidRoom ? 'Join Paid Room' : 'Join Room'}
                    </DialogTitle>
                    <DialogDescription>
                        {isPaidRoom
                            ? 'This room requires an entry fee. Your payment will be held in escrow.'
                            : 'Join this room to play with other players.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'confirm' && (
                    <div className="space-y-6 py-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="bg-card border border-border rounded-lg p-4">
                                <h3 className="font-semibold text-foreground mb-3">Room Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="text-foreground font-medium">{room.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Players:</span>
                                        <span className="text-foreground font-medium">
                                            {room.currentPlayers}/{room.maxPlayers}
                                        </span>
                                    </div>
                                    {room.host && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Host:</span>
                                            <span className="text-foreground font-medium">
                                                {room.host.name || 'Anonymous'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isPaidRoom && (
                                <div className="bg-green-600/10 border border-green-600 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <DollarSign className="w-5 h-5 text-green-500" />
                                        <h3 className="font-semibold text-green-500">Payment Required</h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Entry Fee:</span>
                                            <span className="text-foreground font-bold">
                                                {room.entryFee} USDC
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Prize Pool:</span>
                                            <span className="text-green-500 font-bold">
                                                {totalPrizePool} USDC
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isPaidRoom && (
                                <div className="bg-blue-500/10 border border-blue-500 p-3 rounded-lg text-sm">
                                    <div className="flex items-start gap-2">
                                        <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-medium text-blue-500">Escrow Protection</p>
                                            <ul className="space-y-1 text-muted-foreground">
                                                <li>• Your entry fee is held safely in smart contract</li>
                                                <li>• Winner is automatically paid after game</li>
                                                <li>• Refund if game is cancelled before starting</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleJoin}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                {isPaidRoom ? `Pay ${room.entryFee} USDC & Join` : 'Join Room'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'joining' && (
                    <div className="py-12 text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
                        <div className="space-y-2">
                            <p className="text-lg font-medium">
                                {paymentProgress || "Joining room..."}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {isPaidRoom && paymentProgress.includes("payment")
                                    ? "Please confirm the transaction in your wallet"
                                    : isPaidRoom && paymentProgress.includes("USDC")
                                    ? "Please wait..."
                                    : isPaidRoom && !paymentProgress.includes("Completing")
                                    ? "Processing payment..."
                                    : "Setting up your connection..."}
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
