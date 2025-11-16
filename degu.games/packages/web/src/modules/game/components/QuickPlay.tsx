"use client";

import { Project } from "@/lib/types";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    getRoomsByProject,
    RoomStatus,
    createRoom,
    joinRoom,
    prepareBlockchainGame,
} from "@/lib/room-api";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useWallets } from "@privy-io/react-auth";
import { payAndJoinGame } from "@/lib/user-escrow-client";
import { createWalletClientFromPrivy } from "@/lib/privy-wallet-client";
import { getNetworkByChainId } from "@/lib/networks";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";

interface QuickPlayProps {
    project: Project;
    onSwitchToAllRooms?: () => void;
}

// Simplified tier configuration
const GAME_TIERS = [
    { id: "starter", name: "Starter Match", amount: 1 },
    { id: "challenger", name: "Challenger Arena", amount: 2.5 },
    { id: "champion", name: "Champion League", amount: 10 },
] as const;

interface Currency {
    id: string;
    symbol: string;
    name: string;
    icon: () => JSX.Element;
    networkId: number;
    networkName: string;
    decimals: number;
}

const CURRENCIES: Currency[] = [
    {
        id: "usdc-base",
        symbol: "USDC",
        name: "USD Coin",
        networkId: 84532,
        networkName: "Base",
        decimals: 6,
        icon: () => (
            <img
                src="/coins/usdc.png"
                alt="USDC"
                width="20"
                height="20"
                className="rounded-full"
            />
        ),
    },
    {
        id: "usdc-polygon",
        symbol: "USDC",
        name: "USD Coin",
        networkId: 80002,
        networkName: "Polygon",
        decimals: 6,
        icon: () => (
            <img
                src="/coins/usdc.png"
                alt="USDC"
                width="20"
                height="20"
                className="rounded-full"
            />
        ),
    },
    {
        id: "usdc-arbitrum",
        symbol: "USDC",
        name: "USD Coin",
        networkId: 421614,
        networkName: "Arbitrum",
        decimals: 6,
        icon: () => (
            <img
                src="/coins/usdc.png"
                alt="USDC"
                width="20"
                height="20"
                className="rounded-full"
            />
        ),
    },
    {
        id: "eth-base",
        symbol: "ETH",
        name: "Ethereum",
        networkId: 84532,
        networkName: "Base",
        decimals: 18,
        icon: () => (
            <img
                src="/coins/base.png"
                alt="ETH on Base"
                width="20"
                height="20"
                className="rounded-full"
            />
        ),
    },
    {
        id: "eth-arbitrum",
        symbol: "ETH",
        name: "Ethereum",
        networkId: 421614,
        networkName: "Arbitrum",
        decimals: 18,
        icon: () => (
            <img
                src="/coins/arbitrum.png"
                alt="ETH on Arbitrum"
                width="20"
                height="20"
                className="rounded-full"
            />
        ),
    },
    {
        id: "matic-polygon",
        symbol: "MATIC",
        name: "Polygon",
        networkId: 80002,
        networkName: "Polygon",
        decimals: 18,
        icon: () => (
            <img
                src="/coins/polygon.png"
                alt="MATIC"
                width="20"
                height="20"
                className="rounded-full"
            />
        ),
    },
];

const EXCHANGE_RATES: Record<string, number> = {
    USDC: 1,
    ETH: 0.00032,
    MATIC: 1.2,
};

function parseErrorMessage(error: any): string {
    const errorString =
        error?.message || error?.toString() || "An unknown error occurred";

    if (
        errorString.includes("User Rejected") ||
        errorString.includes("user rejected") ||
        errorString.includes("rejected") ||
        errorString.includes("User denied") ||
        errorString.includes("ethers-user-denied")
    ) {
        return "Transaction cancelled";
    }

    if (
        errorString.includes("insufficient funds") ||
        errorString.includes("insufficient balance")
    ) {
        return "Insufficient funds in your wallet";
    }

    if (errorString.includes("network") || errorString.includes("connection")) {
        return "Network connection error. Please try again";
    }

    if (errorString.includes("wallet") && errorString.includes("connect")) {
        return "Please connect your wallet";
    }

    return errorString.split("\n")[0].substring(0, 100);
}

export function QuickPlay({ project, onSwitchToAllRooms }: QuickPlayProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { wallets } = useWallets();
    const { preference, setPreference } = useCurrencyPreference();

    const getValidCurrency = (pref: string | null): string => {
        if (pref && CURRENCIES.some((c) => c.id === pref)) {
            return pref;
        }
        return "usdc-base";
    };

    const [selectedCurrency, setSelectedCurrency] = useState<string>(() =>
        getValidCurrency(preference)
    );

    useEffect(() => {
        if (preference) {
            const validCurrency = getValidCurrency(preference);
            setSelectedCurrency(validCurrency);
        }
    }, [preference]);

    const handleCurrencyChange = (currencyId: string) => {
        setSelectedCurrency(currencyId);
        setPreference(currencyId);
    };

    const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({
        starter: 0,
        challenger: 0,
        champion: 0,
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState("");

    const selectedCurrencyData =
        CURRENCIES.find((c) => c.id === selectedCurrency) || CURRENCIES[0];

    useEffect(() => {
        loadPlayerCounts();
    }, [project.id, selectedCurrencyData.networkId]);

    const loadPlayerCounts = async () => {
        try {
            const result = await getRoomsByProject(project.id, {
                chainId: selectedCurrencyData.networkId,
            });
            if (result.success && result.data) {
                const rooms = result.data;

                const counts = {
                    starter: rooms
                        .filter(
                            (r) =>
                                r.entryFee &&
                                parseFloat(r.entryFee) === 1 &&
                                r.status === RoomStatus.WAITING
                        )
                        .reduce((sum, r) => sum + r.currentPlayers, 0),

                    challenger: rooms
                        .filter(
                            (r) =>
                                r.entryFee &&
                                parseFloat(r.entryFee) === 2.5 &&
                                r.status === RoomStatus.WAITING
                        )
                        .reduce((sum, r) => sum + r.currentPlayers, 0),

                    champion: rooms
                        .filter(
                            (r) =>
                                r.entryFee &&
                                parseFloat(r.entryFee) === 10 &&
                                r.status === RoomStatus.WAITING
                        )
                        .reduce((sum, r) => sum + r.currentPlayers, 0),
                };

                setPlayerCounts(counts);
            }
        } catch (error) {
            console.error("Error loading player counts:", error);
        }
    };

    const convertToSelectedCurrency = (usdcAmount: number): string => {
        const rate = EXCHANGE_RATES[selectedCurrencyData.symbol];
        const converted = usdcAmount * rate;

        if (selectedCurrencyData.symbol === "USDC") {
            return converted.toString();
        } else if (selectedCurrencyData.symbol === "ETH") {
            return converted.toFixed(4);
        } else {
            return converted.toFixed(2);
        }
    };

    const handleQuickPlay = async (usdcAmount: number) => {
        if (!isAuthenticated || !user) {
            toast.error("Please log in to play");
            return;
        }

        setIsProcessing(true);
        setProcessingMessage("Finding best room...");

        try {
            const token = localStorage.getItem("authToken");

            const roomsResult = await getRoomsByProject(project.id, {
                chainId: selectedCurrencyData.networkId,
            });

            if (!roomsResult.success || !roomsResult.data) {
                throw new Error(roomsResult.error || "Failed to load rooms");
            }

            const matchingRooms = roomsResult.data.filter(
                (r) =>
                    r.status === RoomStatus.WAITING &&
                    r.entryFee === usdcAmount.toString() &&
                    r.chainId === selectedCurrencyData.networkId &&
                    r.currentPlayers < r.maxPlayers
            );

            const sortedRooms = matchingRooms.sort((a, b) => {
                const aSpotsLeft = a.maxPlayers - a.currentPlayers;
                const bSpotsLeft = b.maxPlayers - b.currentPlayers;

                if (aSpotsLeft !== bSpotsLeft) {
                    return aSpotsLeft - bSpotsLeft;
                }

                return (
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                );
            });

            const bestRoom = sortedRooms[0];

            if (bestRoom) {
                setProcessingMessage("Joining room...");

                const currentNetwork = getNetworkByChainId(
                    selectedCurrencyData.networkId
                );
                if (!currentNetwork) {
                    throw new Error("Invalid network selected");
                }

                const usdcToken = currentNetwork.tokens.find(
                    (t) => t.symbol === "USDC"
                );
                const tokenAddress =
                    usdcToken?.address || currentNetwork.tokens[0].address;

                setProcessingMessage("Preparing payment...");

                const wallet = wallets[0];
                if (!wallet) {
                    throw new Error(
                        "No wallet found. Please connect your wallet."
                    );
                }

                const walletClient = createWalletClientFromPrivy(
                    wallet,
                    selectedCurrencyData.networkId
                );

                setProcessingMessage("Paying entry fee...");
                const paymentResult = await payAndJoinGame(
                    walletClient,
                    wallet.address,
                    bestRoom.blockchainGameId!,
                    usdcAmount.toString(),
                    tokenAddress,
                    currentNetwork.gameEscrowAddress,
                    0,
                    setProcessingMessage
                );

                if (!paymentResult.success) {
                    throw new Error(
                        paymentResult.error || "Failed to pay entry fee"
                    );
                }

                setProcessingMessage("Joining room...");
                const joinResult = await joinRoom(
                    bestRoom.id,
                    user.id,
                    user.walletAddress,
                    undefined,
                    token || undefined,
                    true
                );

                if (!joinResult.success) {
                    throw new Error(joinResult.error || "Failed to join room");
                }

                router.push(`/rooms/${bestRoom.id}`);
            } else {
                setProcessingMessage("Creating new room...");

                const currentNetwork = getNetworkByChainId(
                    selectedCurrencyData.networkId
                );
                if (!currentNetwork) {
                    throw new Error("Invalid network selected");
                }

                const usdcToken = currentNetwork.tokens.find(
                    (t) => t.symbol === "USDC"
                );
                const tokenAddress =
                    usdcToken?.address || currentNetwork.tokens[0].address;

                setProcessingMessage("Preparing blockchain game...");
                const prepareResult = await prepareBlockchainGame(
                    {
                        tokenAddress,
                        entryFee: usdcAmount.toString(),
                        gameMode: project.gameMode ?? 0,
                        maxPlayers: project.maxPlayers ?? 2,
                        teams: 0,
                        chainId: selectedCurrencyData.networkId,
                    },
                    token || undefined
                );

                if (!prepareResult.success || !prepareResult.gameId) {
                    throw new Error(
                        prepareResult.error ||
                            "Failed to prepare blockchain game"
                    );
                }

                const blockchainGameId = prepareResult.gameId;

                setProcessingMessage("Preparing payment...");

                const wallet = wallets[0];
                if (!wallet) {
                    throw new Error(
                        "No wallet found. Please connect your wallet."
                    );
                }

                const walletClient = createWalletClientFromPrivy(
                    wallet,
                    selectedCurrencyData.networkId
                );

                setProcessingMessage("Paying entry fee...");
                const paymentResult = await payAndJoinGame(
                    walletClient,
                    wallet.address,
                    blockchainGameId,
                    usdcAmount.toString(),
                    tokenAddress,
                    currentNetwork.gameEscrowAddress,
                    0,
                    setProcessingMessage
                );

                if (!paymentResult.success) {
                    throw new Error(
                        paymentResult.error || "Failed to pay entry fee"
                    );
                }

                setProcessingMessage("Creating room...");

                const entryFeeUsd = (
                    usdcAmount / EXCHANGE_RATES[selectedCurrencyData.symbol]
                ).toFixed(2);

                const roomResult = await createRoom(
                    {
                        projectId: project.id,
                        hostId: user.id,
                        maxPlayers: project.maxPlayers ?? 2,
                        entryFee: usdcAmount.toString(),
                        entryFeeUsd,
                        tokenAddress,
                        tokenSymbol: selectedCurrencyData.symbol,
                        chainId: selectedCurrencyData.networkId,
                        networkName: selectedCurrencyData.networkName,
                        gameMode: project.gameMode ?? 0,
                        blockchainGameId,
                    },
                    token || undefined
                );

                if (!roomResult.success || !roomResult.data) {
                    throw new Error(
                        roomResult.error || "Failed to create room"
                    );
                }

                router.push(`/rooms/${roomResult.data.id}`);
            }
        } catch (error: any) {
            console.error("Quick play error:", error);
            const friendlyMessage = parseErrorMessage(error);
            toast.error(friendlyMessage);
        } finally {
            setIsProcessing(false);
            setProcessingMessage("");
        }
    };

    return (
        <div className="w-full py-6">
            {/* Section Title */}
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Choose Your Stakes
            </h2>

            {/* Currency Selector */}
            <div className="flex items-center justify-center gap-3 mb-8">
                <span className="text-sm font-semibold text-white/80">
                    Currency:
                </span>
                <Select
                    value={selectedCurrency}
                    onValueChange={handleCurrencyChange}
                >
                    <SelectTrigger className="w-[180px] bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/30 text-white h-9 rounded-full">
                        <SelectValue>
                            {selectedCurrencyData && (
                                <span className="flex items-center gap-2">
                                    <selectedCurrencyData.icon />
                                    <span className="font-semibold text-sm">
                                        {selectedCurrencyData.symbol}
                                    </span>
                                    <span className="text-xs text-white/50">
                                        on PolkaVM
                                    </span>
                                </span>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1e] border-white/20">
                        {CURRENCIES.map((currency) => (
                            <SelectItem
                                key={currency.id}
                                value={currency.id}
                                className="text-white focus:bg-white/10 cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <currency.icon />
                                    <span className="font-semibold text-sm">
                                        {currency.symbol}
                                    </span>
                                    <span className="text-xs text-white/50">
                                        {currency.networkName}
                                    </span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 3 Cards Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 max-w-[980px] mx-auto">
                {GAME_TIERS.map((tier, index) => {
                    const playersWaiting = playerCounts[tier.id];
                    const isHighStakes = tier.amount === 10;
                    const isBestValue = tier.amount === 2.5;

                    return (
                        <div
                            key={tier.id}
                            className={`relative bg-[#1a1a2e] rounded-lg overflow-hidden transition-all duration-200 hover:transform hover:scale-[1.02] ${
                                isHighStakes
                                    ? "border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20"
                                    : isBestValue
                                    ? "border border-blue-500/30 shadow-md shadow-blue-500/10"
                                    : "border border-[#2a2a3e]"
                            }`}
                            style={{ width: "300px", height: "160px" }}
                        >
                            {/* Badge */}
                            {isHighStakes && (
                                <div className="absolute top-2 right-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                    HIGH STAKES
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-4 h-full flex flex-col justify-between">
                                {/* Top: Game Mode Name */}
                                <div className="text-white/90 font-semibold text-sm">
                                    {tier.name}
                                </div>

                                {/* Center: Big Bet Amount */}
                                <div className="text-center">
                                    <div className="text-4xl font-black text-white mb-1">
                                        {convertToSelectedCurrency(tier.amount)}
                                    </div>
                                    <div className="text-xs text-white/50">
                                        Entry Fee •{" "}
                                        {selectedCurrencyData.symbol}
                                    </div>
                                    {/* Players waiting indicator */}
                                    {playersWaiting > 0 && (
                                        <div className="flex items-center justify-center gap-1 mt-1 text-emerald-400 text-[10px]">
                                            <Users className="w-3 h-3" />
                                            <span>
                                                {playersWaiting} waiting
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom: Play Button */}
                                <Button
                                    onClick={() => handleQuickPlay(tier.amount)}
                                    disabled={isProcessing}
                                    className="w-full h-8 bg-[#007AFF] hover:bg-[#0066CC] text-white font-semibold text-xs rounded disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        "PLAY"
                                    )}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Processing Message */}
            {isProcessing && processingMessage && (
                <div className="text-center text-sm text-white/70 mb-4">
                    {processingMessage}
                </div>
            )}

            {/* Bottom Action */}
            <div className="flex justify-center">
                <button
                    onClick={() => {
                        if (onSwitchToAllRooms) {
                            onSwitchToAllRooms();
                        }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full transition-all font-semibold"
                >
                    View All Rooms
                </button>
            </div>
        </div>
    );
}
