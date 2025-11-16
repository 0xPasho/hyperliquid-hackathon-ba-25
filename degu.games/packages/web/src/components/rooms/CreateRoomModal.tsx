"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { GameMode, CONTRACTS } from "@/lib/game-escrow-api";
import { createRoom, CreateRoomData, getRoomsByProject, deleteRoom, prepareBlockchainGame } from "@/lib/room-api";
import { ReplaceRoomConfirmModal } from "./ReplaceRoomConfirmModal";
import { useWallets } from "@privy-io/react-auth";
import { payAndJoinGame } from "@/lib/user-escrow-client";
import { createWalletClientFromPrivy } from "@/lib/privy-wallet-client";
import { NETWORKS, DEFAULT_NETWORK, type NetworkConfig, type Token } from "@/lib/networks";

interface CreateRoomModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    hostId: string;
    gameMode?: GameMode; // Game mode from project settings
    maxPlayers?: number; // Max players from project configuration
    onRoomCreated: (roomId: string) => void;
}

export function CreateRoomModal({
    open,
    onOpenChange,
    projectId,
    hostId,
    gameMode = GameMode.WinnerTakesAll, // Default to WinnerTakesAll if not set
    maxPlayers = 2, // Default to 2 players (minimum for paid rooms)
    onRoomCreated,
}: CreateRoomModalProps) {
    // Privy wallet hooks
    const { wallets } = useWallets();

    const [step, setStep] = useState<"config" | "creating">("config");
    const [isPaidRoom, setIsPaidRoom] = useState(true);
    const [entryFee, setEntryFee] = useState("1");
    const [error, setError] = useState<string | null>(null);
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [existingRoomId, setExistingRoomId] = useState<string | null>(null);
    const [paymentProgress, setPaymentProgress] = useState<string>("");
    const [selectedNetwork, setSelectedNetwork] = useState<string>("base");
    const [selectedToken, setSelectedToken] = useState<string>("");
    const isSinglePlayer = maxPlayers === 1;

    // Get current network config
    const currentNetwork = NETWORKS[selectedNetwork];

    // Get available tokens for selected network
    const availableTokens = currentNetwork?.tokens || [];

    // Set default token when network changes
    useEffect(() => {
        if (currentNetwork && availableTokens.length > 0) {
            // Default to USDC if available, otherwise first token
            const usdcToken = availableTokens.find(t => t.symbol === 'USDC');
            setSelectedToken(usdcToken ? usdcToken.address : availableTokens[0].address);
        }
    }, [selectedNetwork]);

    // Get currently selected token object
    const currentToken = availableTokens.find(t => t.address === selectedToken);

    // Check for existing rooms when modal opens for single-player games
    useEffect(() => {
        const checkExistingRooms = async () => {
            if (!open || !isSinglePlayer) return;

            const token = localStorage.getItem("authToken");
            const result = await getRoomsByProject(projectId, false);

            if (result.success && result.data) {
                // Filter for rooms hosted by this user
                const userRooms = result.data.filter(room => room.hostId === hostId);

                if (userRooms.length > 0) {
                    setExistingRoomId(userRooms[0].id);
                }
            } else {
                console.error("Error checking existing rooms:", result.error);
            }
        };

        checkExistingRooms();
    }, [open, isSinglePlayer, projectId, hostId]);

    const handleCreateRoom = async () => {
        // If single-player and existing room, show confirmation modal
        if (isSinglePlayer && existingRoomId) {
            setShowReplaceModal(true);
            return;
        }

        await proceedWithRoomCreation();
    };

    const proceedWithRoomCreation = async () => {
        setStep("creating");
        setError(null);
        setPaymentProgress("Preparing game...");

        // Delete existing room if it exists
        if (existingRoomId) {
            const token = localStorage.getItem("authToken");
            const deleteResult = await deleteRoom(existingRoomId, hostId, token || undefined);
            if (!deleteResult.success) {
                setError(deleteResult.error || "Failed to delete existing room");
                setStep("config");
                setPaymentProgress("");
                return;
            }
            setExistingRoomId(null);
        }

        const token = localStorage.getItem("authToken");
        let blockchainGameId: string | undefined;

        console.log("[CreateRoom] isPaidRoom:", isPaidRoom, "entryFee:", entryFee);

        // Step 1: If paid room, prepare blockchain game FIRST
        if (isPaidRoom) {
            try {
                setPaymentProgress("Preparing blockchain game...");
                console.log("[CreateRoom] Preparing blockchain game...");

                const prepareResult = await prepareBlockchainGame(
                    {
                        tokenAddress: selectedToken,
                        entryFee,
                        gameMode,
                        maxPlayers,
                        teams: 0,
                        chainId: currentNetwork.chainId,
                    },
                    token || undefined
                );

                if (!prepareResult.success || !prepareResult.gameId) {
                    setError(prepareResult.error || "Failed to prepare blockchain game");
                    setStep("config");
                    setPaymentProgress("");
                    return;
                }

                blockchainGameId = prepareResult.gameId;
                console.log("[CreateRoom] ✅ Blockchain game prepared:", blockchainGameId);

                // Step 2: User MUST pay entry fee from their wallet
                setPaymentProgress("Preparing payment...");

                // Get wallet
                const wallet = wallets[0];
                if (!wallet) {
                    setError("No wallet found. Please connect your wallet.");
                    setStep("config");
                    setPaymentProgress("");
                    return;
                }

                // Create wallet client compatible with user-escrow-client
                const walletClient = createWalletClientFromPrivy(wallet, currentNetwork.chainId);

                // Pay entry fee and join game
                console.log("[CreateRoom] Host paying entry fee...", {
                    gameId: blockchainGameId,
                    entryFee,
                    wallet: wallet.address,
                });

                const paymentResult = await payAndJoinGame(
                    walletClient,
                    wallet.address,
                    blockchainGameId,
                    entryFee,
                    0, // teamId
                    setPaymentProgress
                );

                if (!paymentResult.success) {
                    setError(paymentResult.error || "Failed to pay entry fee. Room not created.");
                    setStep("config");
                    setPaymentProgress("");
                    return;
                }

                console.log("[CreateRoom] ✅ Payment successful:", paymentResult.txHash);
            } catch (error: any) {
                console.error("[CreateRoom] Payment error:", error);
                setError(error.message || "Failed to process payment. Room not created.");
                setStep("config");
                setPaymentProgress("");
                return;
            }
        }

        // Step 3: ONLY NOW create room in database (after payment succeeded or if free room)
        setPaymentProgress("Creating room...");
        console.log("[CreateRoom] Creating room in database...");
        console.log("[CreateRoom] blockchainGameId before creating room:", blockchainGameId);

        const roomData: any = {
            projectId,
            hostId,
            maxPlayers,
            entryFee: isPaidRoom ? entryFee : undefined,
            tokenAddress: isPaidRoom ? selectedToken : undefined,
            chainId: currentNetwork.chainId,
            gameMode,
            blockchainGameId, // Pass the gameId if paid room
        };

        console.log("[CreateRoom] roomData being sent:", roomData);

        const roomResult = await createRoom(roomData, token || undefined);
        if (!roomResult.success || !roomResult.data) {
            setError(roomResult.error || "Failed to create room");
            setStep("config");
            setPaymentProgress("");
            return;
        }

        console.log("[CreateRoom] ✅ Room created in database:", roomResult.data.id);

        // Success!
        setPaymentProgress("");
        onOpenChange(false);
        onRoomCreated(roomResult.data.id);
    };

    const resetModal = () => {
        setStep("config");
        setIsPaidRoom(true);
        setEntryFee("1");
        setError(null);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetModal();
        }
        onOpenChange(newOpen);
    };

    return (
        <>
            <ReplaceRoomConfirmModal
                open={showReplaceModal}
                onOpenChange={setShowReplaceModal}
                onConfirm={proceedWithRoomCreation}
                existingRoomId={existingRoomId || ""}
            />
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[480px]">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-lg font-medium">Create Game Room</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Configure your game room settings
                    </DialogDescription>
                </DialogHeader>

                {step === "config" && (
                    <div className="space-y-5 py-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Toggle Section - Medium emphasis */}
                        <div className="flex items-center justify-between py-2 px-1">
                            <Label htmlFor="paid-room" className="text-sm font-medium">
                                Paid Room
                            </Label>
                            <Switch
                                id="paid-room"
                                checked={isPaidRoom}
                                onCheckedChange={setIsPaidRoom}
                            />
                        </div>

                        {isPaidRoom && (
                            <>
                                {/* Entry Fee - PRIMARY visual weight */}
                                <div className="space-y-3">
                                    <Label htmlFor="entryFee" className="text-sm font-medium text-muted-foreground">
                                        Entry Fee
                                    </Label>
                                    <Input
                                        id="entryFee"
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={entryFee}
                                        onChange={(e) =>
                                            setEntryFee(e.target.value)
                                        }
                                        placeholder="1.0"
                                        className="h-14 text-2xl font-semibold text-center"
                                    />
                                </div>

                                {/* Currency & Network - Secondary inputs */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Currency & Network
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Payment Token */}
                                        <Select
                                            value={selectedToken}
                                            onValueChange={setSelectedToken}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Token" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableTokens.map((token) => (
                                                    <SelectItem key={token.address} value={token.address}>
                                                        {token.symbol}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {/* Network */}
                                        <Select
                                            value={selectedNetwork}
                                            onValueChange={setSelectedNetwork}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Network" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(NETWORKS).map(([key, network]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {network.shortName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Prize Pool - Secondary emphasis, clear result */}
                                <div className="border-t border-b border-border py-4 px-1">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-sm text-muted-foreground">Prize Pool</span>
                                        <span className="text-xl font-semibold">
                                            {(parseFloat(entryFee) * maxPlayers).toFixed(2)}{" "}
                                            {currentToken?.symbol || 'tokens'}
                                        </span>
                                    </div>
                                </div>

                                {/* Minimal help text - Very subtle */}
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        You're creating a room with {entryFee} {currentToken?.symbol || 'token'} entry fee. All funds are secured in a smart contract and automatically released to the winner.
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Action Buttons - Clear but not competing */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="flex-1 h-11"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateRoom}
                                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                            >
                                Create Room
                            </Button>
                        </div>
                    </div>
                )}

                {step === "creating" && (
                    <div className="py-12 text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
                        <div className="space-y-2">
                            <p className="text-lg font-medium">
                                {paymentProgress || "Creating your room..."}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {isPaidRoom && paymentProgress.includes("payment")
                                    ? "Please confirm the transaction in your wallet"
                                    : isPaidRoom && paymentProgress.includes("USDC")
                                    ? "Please wait..."
                                    : isPaidRoom
                                    ? "Setting up escrow game..."
                                    : "Setting up your room..."}
                            </p>
                        </div>
                    </div>
                )}
                </DialogContent>
            </Dialog>
        </>
    );
}
