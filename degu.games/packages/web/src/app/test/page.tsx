"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/modules/home/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Coins,
    Send,
    CheckCircle,
    Flame,
    Search,
    RefreshCw,
    Clock,
    Gamepad2,
    Users,
    Trophy,
    XCircle,
} from "lucide-react";
import * as BlockchainAPI from "@/lib/blockchain-api";

export default function TestPage() {
    const { user, isAuthenticated, token, loading: authLoading } = useAuth();

    const [balance, setBalance] = useState<string>("");
    const [nativeBalance, setNativeBalance] = useState<string>("");
    const [canClaim, setCanClaim] = useState<boolean>(false);
    const [timeUntilClaim, setTimeUntilClaim] = useState<number>(0);
    const [tokenInfo, setTokenInfo] = useState<BlockchainAPI.TokenInfo | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Get wallet address directly from user object
    const walletAddress = user?.walletAddress || "";

    // Form inputs
    const [transferTo, setTransferTo] = useState<string>("");
    const [transferAmount, setTransferAmount] = useState<string>("");
    const [approveSpender, setApproveSpender] = useState<string>("");
    const [approveAmount, setApproveAmount] = useState<string>("");
    const [burnAmount, setBurnAmount] = useState<string>("");
    const [checkOwner, setCheckOwner] = useState<string>("");
    const [checkSpender, setCheckSpender] = useState<string>("");

    // Betting form inputs
    const [bettingTokenAddress, setBettingTokenAddress] = useState<string>("");
    const [betAmount, setBetAmount] = useState<string>("");
    const [minPlayers, setMinPlayers] = useState<string>("2");
    const [maxPlayers, setMaxPlayers] = useState<string>("10");
    const [joinGameId, setJoinGameId] = useState<string>("");
    const [viewGameId, setViewGameId] = useState<string>("");
    const [gameDetails, setGameDetails] = useState<BlockchainAPI.BettingGameDetails | null>(null);
    const [totalGames, setTotalGames] = useState<number>(0);
    const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
    const [allowanceResult, setAllowanceResult] = useState<BlockchainAPI.AllowanceResponse | null>(null);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    };

    const refreshData = async () => {
        if (!walletAddress) {
            console.log("Cannot refresh data: no wallet address");
            return;
        }

        try {
            // Get token balance (DEGU)
            const balanceData = await BlockchainAPI.getTokenBalance(walletAddress);
            setBalance(balanceData.balance);

            // Get native balance (WND for gas)
            const nativeData = await BlockchainAPI.getNativeBalance(walletAddress);
            setNativeBalance(nativeData.balance);

            // Check if can claim
            const claimData = await BlockchainAPI.canClaimTokens(walletAddress);
            setCanClaim(claimData.canClaim);
            setTimeUntilClaim(claimData.timeUntilNext);

            addLog("✅ Data refreshed");
        } catch (error: unknown) {
            console.error("Error refreshing data:", error);
            addLog(`❌ Error refreshing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const loadTokenInfo = async () => {
        try {
            const info = await BlockchainAPI.getTokenInfo();
            setTokenInfo(info);
            addLog("✅ Token info loaded");
        } catch (error: unknown) {
            console.error("Error loading token info:", error);
            addLog(`❌ Error loading token info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Load data when authenticated and wallet address is available
    useEffect(() => {
        if (isAuthenticated && walletAddress) {
            addLog(`✅ Wallet connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
            refreshData();
            loadTokenInfo();
        }
    }, [isAuthenticated, walletAddress]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        if (!isAuthenticated || !walletAddress) return;

        const interval = setInterval(() => {
            refreshData();
        }, 10000);

        return () => clearInterval(interval);
    }, [isAuthenticated, walletAddress]);

    const handleClaimTokens = async () => {
        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            addLog("🔄 Claiming 1000 DEGU tokens...");
            const result = await BlockchainAPI.claimFreeTokens();

            if (!result.success) {
                addLog(`❌ Claim failed: ${result.error}`);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Claimed 1000 DEGU! Block: ${result.data.blockNumber}`);

            await refreshData();
        } catch (error: unknown) {
            console.error("Claim error:", error);
            addLog(`❌ Claim failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!transferTo || !transferAmount) {
            addLog("❌ Please enter recipient and amount");
            return;
        }

        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            addLog(`🔄 Transferring ${transferAmount} DEGU to ${transferTo}...`);
            const result = await BlockchainAPI.transfer(transferTo, transferAmount);

            if (!result.success) {
                addLog(`❌ Transfer failed: ${result.error}`);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Transfer complete! Block: ${result.data.blockNumber}`);

            setTransferTo("");
            setTransferAmount("");
            await refreshData();
        } catch (error: unknown) {
            console.error("Transfer error:", error);
            addLog(`❌ Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!approveSpender || !approveAmount) {
            addLog("❌ Please enter spender and amount");
            return;
        }

        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            addLog(`🔄 Approving ${approveAmount} DEGU for ${approveSpender}...`);
            const result = await BlockchainAPI.approve(approveSpender, approveAmount);

            if (!result.success) {
                addLog(`❌ Approval failed: ${result.error}`);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Approval complete! Block: ${result.data.blockNumber}`);

            setApproveSpender("");
            setApproveAmount("");
        } catch (error: unknown) {
            console.error("Approve error:", error);
            addLog(`❌ Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBurn = async () => {
        if (!burnAmount) {
            addLog("❌ Please enter amount to burn");
            return;
        }

        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            addLog(`🔄 Burning ${burnAmount} DEGU...`);
            const result = await BlockchainAPI.burn(burnAmount);

            if (!result.success) {
                addLog(`❌ Burn failed: ${result.error}`);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Burned ${burnAmount} DEGU! Block: ${result.data.blockNumber}`);

            setBurnAmount("");
            await refreshData();
        } catch (error: unknown) {
            console.error("Burn error:", error);
            addLog(`❌ Burn failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAllowance = async () => {
        if (!checkOwner || !checkSpender) {
            addLog("❌ Please enter owner and spender addresses");
            return;
        }

        try {
            const result = await BlockchainAPI.getAllowance(checkOwner, checkSpender);
            setAllowanceResult(result);
            addLog(`✅ Allowance: ${result.allowance} DEGU`);
        } catch (error: unknown) {
            console.error("Check allowance error:", error);
            setAllowanceResult(null);
            addLog(`❌ Check allowance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // ==================== BETTING HANDLERS ====================

    const loadTotalGames = async () => {
        try {
            const result = await BlockchainAPI.getTotalBettingGames();
            setTotalGames(result.totalGames || 0);
        } catch (error: unknown) {
            console.error("Load total games error:", error);
        }
    };

    const handleCreateGame = async () => {
        if (!bettingTokenAddress || !betAmount || !minPlayers || !maxPlayers) {
            addLog("❌ Please fill all fields for creating a game");
            return;
        }

        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            // Check allowance first
            addLog("🔍 Checking if betting contract is approved...");
            try {
                const bettingContractAddr = "0x7f4736bb8011e152C14a98858EA532dA45370cFb";
                const allowanceData = await BlockchainAPI.getAllowance(walletAddress, bettingContractAddr);
                const allowance = parseFloat(allowanceData.allowance);
                const requiredAmount = parseFloat(betAmount);

                if (allowance < requiredAmount) {
                    addLog(`❌ Insufficient approval! You have ${allowance} DEGU approved, but need ${requiredAmount} DEGU`);
                    addLog(`⚠️ Please go to the Approve section and approve ${bettingContractAddr} for at least ${requiredAmount} DEGU`);
                    setLoading(false);
                    return;
                }
                addLog(`✅ Approval confirmed: ${allowance} DEGU approved`);
            } catch (err) {
                console.error("Allowance check error:", err);
                addLog("⚠️ Could not verify approval. Proceeding anyway...");
            }

            addLog(`🔄 Creating betting game (${betAmount} DEGU, ${minPlayers}-${maxPlayers} players)...`);
            const result = await BlockchainAPI.createBettingGame(
                bettingTokenAddress,
                betAmount,
                parseInt(minPlayers),
                parseInt(maxPlayers)
            );

            if (!result.success) {
                addLog(`❌ Create game failed: ${result.error}`);
                const errorMsg = result.error || '';
                if (errorMsg.includes("Invalid Transaction") || errorMsg.includes("1010")) {
                    addLog("💡 This usually means you need to approve the betting contract first!");
                    addLog(`💡 Go to Approve section, enter: 0x7f4736bb8011e152C14a98858EA532dA45370cFb`);
                }
                setLoading(false);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Game created! Block: ${result.data.blockNumber}`);

            setBettingTokenAddress("");
            setBetAmount("");
            await loadTotalGames();
        } catch (error: unknown) {
            console.error("Create game error:", error);
            addLog(`❌ Create game failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGame = async () => {
        if (!joinGameId) {
            addLog("❌ Please enter a game ID");
            return;
        }

        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            addLog(`🔄 Joining game #${joinGameId}...`);
            const result = await BlockchainAPI.joinBettingGame(parseInt(joinGameId));

            if (!result.success) {
                addLog(`❌ Join game failed: ${result.error}`);
                setLoading(false);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Joined game #${joinGameId}! Block: ${result.data.blockNumber}`);

            setJoinGameId("");
            if (gameDetails && gameDetails.gameId === parseInt(joinGameId)) {
                await handleViewGame();
            }
        } catch (error: unknown) {
            console.error("Join game error:", error);
            addLog(`❌ Join game failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleViewGame = async () => {
        if (!viewGameId) {
            addLog("❌ Please enter a game ID");
            return;
        }

        try {
            addLog(`🔄 Loading game #${viewGameId} details...`);
            const result = await BlockchainAPI.getBettingGameDetails(parseInt(viewGameId));
            setGameDetails(result);
            addLog(`✅ Game #${viewGameId} loaded: ${result.status}, ${result.players.length} players`);
        } catch (error: unknown) {
            console.error("View game error:", error);
            addLog(`❌ View game failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleStartGame = async () => {
        if (!gameDetails) {
            addLog("❌ No game loaded");
            return;
        }

        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            addLog(`🔄 Starting game #${gameDetails.gameId}...`);
            const result = await BlockchainAPI.startBettingGame(gameDetails.gameId);

            if (!result.success) {
                addLog(`❌ Start game failed: ${result.error}`);
                setLoading(false);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Game started! Block: ${result.data.blockNumber}`);

            await handleViewGame();
        } catch (error: unknown) {
            console.error("Start game error:", error);
            addLog(`❌ Start game failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectWinners = async () => {
        if (!gameDetails) {
            addLog("❌ No game loaded");
            return;
        }

        if (selectedWinners.length === 0) {
            addLog("❌ Please select at least one winner");
            return;
        }

        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            addLog(`🔄 Selecting ${selectedWinners.length} winner(s) for game #${gameDetails.gameId}...`);
            const result = await BlockchainAPI.selectWinners(gameDetails.gameId, selectedWinners);

            if (!result.success) {
                addLog(`❌ Select winners failed: ${result.error}`);
                setLoading(false);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Winners selected! Block: ${result.data.blockNumber}`);

            setSelectedWinners([]);
            await handleViewGame();
        } catch (error: unknown) {
            console.error("Select winners error:", error);
            addLog(`❌ Select winners failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimPrize = async () => {
        if (!gameDetails) {
            addLog("❌ No game loaded");
            return;
        }

        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            addLog(`🔄 Claiming prize from game #${gameDetails.gameId}...`);
            const result = await BlockchainAPI.claimBettingPrize(gameDetails.gameId);

            if (!result.success) {
                addLog(`❌ Claim prize failed: ${result.error}`);
                setLoading(false);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Prize claimed! Block: ${result.data.blockNumber}`);

            await handleViewGame();
            await refreshData();
        } catch (error: unknown) {
            console.error("Claim prize error:", error);
            addLog(`❌ Claim prize failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelGame = async () => {
        if (!gameDetails) {
            addLog("❌ No game loaded");
            return;
        }

        if (!token) {
            addLog("❌ Not authenticated");
            return;
        }

        setLoading(true);
        try {
            addLog(`🔄 Cancelling game #${gameDetails.gameId}...`);
            const result = await BlockchainAPI.cancelBettingGame(gameDetails.gameId);

            if (!result.success) {
                addLog(`❌ Cancel game failed: ${result.error}`);
                setLoading(false);
                return;
            }

            addLog(`⏳ Transaction sent: ${result.data.transactionHash}`);
            addLog(`✅ Game cancelled and refunded! Block: ${result.data.blockNumber}`);

            setGameDetails(null);
            setViewGameId("");
            await loadTotalGames();
        } catch (error: unknown) {
            console.error("Cancel game error:", error);
            addLog(`❌ Cancel game failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleWinnerSelection = (address: string) => {
        setSelectedWinners(prev =>
            prev.includes(address)
                ? prev.filter(a => a !== address)
                : [...prev, address]
        );
    };

    // Load total games on mount
    useEffect(() => {
        if (isAuthenticated) {
            loadTotalGames();
        }
    }, [isAuthenticated]);

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex min-h-screen w-full bg-black">
                <AppSidebar />
                <SidebarInset className="flex-1">
                    <AppHeader showBack={false} showSearch={false} />

                    <div className="w-full pb-12">
                        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8">
                            {/* Header */}
                            <div className="mb-8">
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    DeguToken Test Interface
                                </h1>
                                <p className="text-gray-400">
                                    Hackathon Demo - Contract Interactions via API
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                    <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded border border-purple-600/30">
                                        Network: Westend Asset Hub (PolkaVM)
                                    </span>
                                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded border border-blue-600/30">
                                        Chain ID: 420420421
                                    </span>
                                </div>
                            </div>

                            {!isAuthenticated ? (
                                <div className="space-y-6">
                                    <Card className="max-w-2xl mx-auto">
                                        <CardContent className="pt-6">
                                            <div className="text-center space-y-6">
                                                <div>
                                                    <Coins className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                                                    <h2 className="text-2xl font-bold text-white mb-2">
                                                        Connect Your Wallet
                                                    </h2>
                                                    <p className="text-gray-400">
                                                        Connect via Web3Auth to test all ERC20 token interactions
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Use the &quot;Connect Wallet&quot; button in the header to get started
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="max-w-2xl mx-auto bg-blue-950/20 border-blue-600/30">
                                        <CardHeader>
                                            <CardTitle className="text-blue-400">
                                                Getting Started
                                            </CardTitle>
                                            <CardDescription>
                                                What you need to interact with the contract
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ol className="space-y-3 text-sm text-gray-300">
                                                <li className="flex gap-3">
                                                    <span className="text-blue-400 font-bold">1.</span>
                                                    <div>
                                                        <strong>Connect Wallet:</strong> Click &quot;Connect Wallet&quot; in the header and sign in with Google/Twitter/Discord
                                                    </div>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="text-blue-400 font-bold">2.</span>
                                                    <div>
                                                        <strong>Get Testnet Tokens:</strong> You need PAS (Westend Asset Hub tokens) for gas fees. Get them from{" "}
                                                        <a href="https://faucet.polkadot.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                            Polkadot Faucet
                                                        </a>
                                                    </div>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="text-blue-400 font-bold">3.</span>
                                                    <div>
                                                        <strong>Claim DEGU:</strong> Once connected, use the faucet to claim 1000 free DEGU tokens
                                                    </div>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="text-blue-400 font-bold">4.</span>
                                                    <div>
                                                        <strong>Test Interactions:</strong> Transfer, approve, burn, and more!
                                                    </div>
                                                </li>
                                            </ol>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <>
                                    {/* Important Notice - Get Faucet Tokens */}
                                    <Card className="mb-6 bg-gradient-to-r from-blue-950/30 to-purple-950/30 border-blue-500/50">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-blue-600/20 rounded-lg flex-shrink-0">
                                                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-blue-300 mb-3 flex items-center gap-2">
                                                        🚰 Get Free Testnet Tokens First!
                                                    </h3>
                                                    <div className="space-y-3 text-gray-200">
                                                        <p className="text-base">
                                                            <strong className="text-white">Before testing, you MUST get WND tokens</strong> for gas fees. Without them, all transactions will fail!
                                                        </p>
                                                        <div className="bg-black/40 rounded-lg p-4 border border-blue-500/30">
                                                            <p className="text-sm font-semibold text-blue-300 mb-2">📋 Follow these steps:</p>
                                                            <ol className="space-y-2 text-sm list-decimal list-inside">
                                                                <li>
                                                                    Copy your wallet address below:
                                                                    <div className="mt-1 p-2 bg-black/60 rounded border border-gray-700 font-mono text-xs text-green-400 break-all">
                                                                        {walletAddress}
                                                                    </div>
                                                                </li>
                                                                <li>
                                                                    Go to the{" "}
                                                                    <a
                                                                        href="https://faucet.polkadot.io/westend"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-400 hover:text-blue-300 underline font-semibold"
                                                                    >
                                                                        Polkadot Westend Faucet
                                                                    </a>
                                                                </li>
                                                                <li>Paste your address and request WND tokens</li>
                                                                <li>Wait ~30 seconds for tokens to arrive</li>
                                                                <li>Refresh this page - your WND balance will show above</li>
                                                            </ol>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-yellow-400 flex items-center gap-2">
                                                                ⚠️ <span>You only need to do this once. The faucet gives you enough tokens for many transactions!</span>
                                                            </p>
                                                            <p className="text-xs text-gray-400 border-t border-gray-700 pt-2">
                                                                <strong className="text-gray-300">Note:</strong> This is <strong>testnet only</strong>. We can&apos;t deploy to production yet because PolkaVM is still in development on mainnet.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Wallet Info */}
                                    <Card className="mb-6">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Coins className="w-5 h-5 text-blue-500" />
                                                        Wallet Info
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Your Web3Auth wallet details
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    onClick={refreshData}
                                                    disabled={loading || !walletAddress}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {!walletAddress ? (
                                                <div className="text-center py-4">
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                                                    <p className="text-sm text-gray-400">
                                                        Loading wallet...
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label className="text-gray-400">Address</Label>
                                                        <p className="text-sm font-mono text-white mt-1">
                                                            {walletAddress}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-gray-400">Gas Balance (WND)</Label>
                                                            <p className={`text-2xl font-bold mt-1 ${parseFloat(nativeBalance) === 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                                {nativeBalance} WND
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-gray-400">Token Balance</Label>
                                                            <p className="text-2xl font-bold text-green-400 mt-1">
                                                                {balance} DEGU
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-gray-400 flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            Can Claim
                                                        </Label>
                                                        {canClaim ? (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                                <span className="text-green-400 font-semibold">
                                                                    Ready to claim!
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-red-400 mt-1">
                                                                Wait {Math.floor(timeUntilClaim / 60)}m {timeUntilClaim % 60}s
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Gas Balance Warning */}
                                    {parseFloat(nativeBalance) === 0 && (
                                        <Card className="mb-6 bg-red-950/20 border-red-600/30">
                                            <CardContent className="pt-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 bg-red-600/20 rounded-lg">
                                                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-red-400 mb-2">
                                                            Insufficient Gas Balance
                                                        </h3>
                                                        <p className="text-sm text-gray-300 mb-4">
                                                            You need WND tokens to pay for gas fees on Westend Asset Hub. Your wallet currently has 0 WND.
                                                        </p>
                                                        <div className="bg-black/30 rounded-lg p-4 space-y-3">
                                                            <p className="text-sm font-semibold text-white">How to get WND for Asset Hub:</p>
                                                            <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
                                                                <li>
                                                                    Get WND from{" "}
                                                                    <a href="https://faucet.polkadot.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                                        Polkadot Faucet
                                                                    </a>
                                                                    {" "}(you&apos;ll receive it on the Westend relay chain)
                                                                </li>
                                                                <li>
                                                                    Use{" "}
                                                                    <a href="https://polkadot.js.org/apps/#/accounts" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                                        Polkadot.js Apps
                                                                    </a>
                                                                    {" "}to teleport WND from Westend relay chain to Westend Asset Hub
                                                                </li>
                                                                <li>Send WND to your wallet address: <span className="font-mono text-xs">{walletAddress}</span></li>
                                                            </ol>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Token Info */}
                                    {tokenInfo && (
                                        <Card className="mb-6">
                                            <CardHeader>
                                                <CardTitle>Token Information</CardTitle>
                                                <CardDescription>DeguToken contract details</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label className="text-gray-400">Name</Label>
                                                        <p className="text-white font-semibold mt-1">{tokenInfo.name}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-gray-400">Symbol</Label>
                                                        <p className="text-white font-semibold mt-1">{tokenInfo.symbol}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-gray-400">Total Supply</Label>
                                                        <p className="text-white font-semibold mt-1">{tokenInfo.totalSupply}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-gray-400">Faucet Amount</Label>
                                                        <p className="text-white font-semibold mt-1">{tokenInfo.faucetAmount} DEGU</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-gray-400">Cooldown</Label>
                                                        <p className="text-white font-semibold mt-1">{tokenInfo.faucetCooldownFormatted}</p>
                                                    </div>
                                                    <div className="col-span-2 md:col-span-1">
                                                        <Label className="text-gray-400">Contract</Label>
                                                        <p className="text-xs font-mono text-gray-500 mt-1 break-all">
                                                            {tokenInfo.contractAddress}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Actions Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                        {/* Faucet */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Coins className="w-5 h-5 text-green-500" />
                                                    Faucet
                                                </CardTitle>
                                                <CardDescription>Claim 1000 free DEGU tokens (once per hour)</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Button
                                                    onClick={handleClaimTokens}
                                                    disabled={loading || !canClaim}
                                                    className="w-full"
                                                    variant={canClaim ? "default" : "secondary"}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : canClaim ? (
                                                        "Claim 1000 DEGU"
                                                    ) : (
                                                        "Cooldown Active"
                                                    )}
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        {/* Transfer */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Send className="w-5 h-5 text-blue-500" />
                                                    Transfer
                                                </CardTitle>
                                                <CardDescription>Send DEGU to another address</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <Label htmlFor="transfer-to">Recipient Address</Label>
                                                    <Input
                                                        id="transfer-to"
                                                        placeholder="0x..."
                                                        value={transferTo}
                                                        onChange={(e) => setTransferTo(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="transfer-amount">Amount</Label>
                                                    <Input
                                                        id="transfer-amount"
                                                        placeholder="100"
                                                        value={transferAmount}
                                                        onChange={(e) => setTransferAmount(e.target.value)}
                                                    />
                                                </div>
                                                <Button onClick={handleTransfer} disabled={loading} className="w-full">
                                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                    Transfer
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        {/* Approve */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5 text-purple-500" />
                                                    Approve
                                                </CardTitle>
                                                <CardDescription>Approve another address to spend your tokens</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <Label htmlFor="approve-spender">Spender Address</Label>
                                                    <Input
                                                        id="approve-spender"
                                                        placeholder="0x..."
                                                        value={approveSpender}
                                                        onChange={(e) => setApproveSpender(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="approve-amount">Amount</Label>
                                                    <Input
                                                        id="approve-amount"
                                                        placeholder="1000"
                                                        value={approveAmount}
                                                        onChange={(e) => setApproveAmount(e.target.value)}
                                                    />
                                                </div>
                                                <Button onClick={handleApprove} disabled={loading} className="w-full" variant="outline">
                                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                    Approve
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        {/* Burn */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Flame className="w-5 h-5 text-red-500" />
                                                    Burn
                                                </CardTitle>
                                                <CardDescription>Permanently destroy tokens</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <Label htmlFor="burn-amount">Amount to Burn</Label>
                                                    <Input
                                                        id="burn-amount"
                                                        placeholder="10"
                                                        value={burnAmount}
                                                        onChange={(e) => setBurnAmount(e.target.value)}
                                                    />
                                                </div>
                                                <Button onClick={handleBurn} disabled={loading} className="w-full" variant="destructive">
                                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                    Burn Tokens
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Check Allowance */}
                                    <Card className="mb-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Search className="w-5 h-5 text-yellow-500" />
                                                Check Allowance
                                            </CardTitle>
                                            <CardDescription>View approved spending limits</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <Label htmlFor="check-owner">Owner Address</Label>
                                                    <Input
                                                        id="check-owner"
                                                        placeholder="0x..."
                                                        value={checkOwner}
                                                        onChange={(e) => setCheckOwner(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="check-spender">Spender Address</Label>
                                                    <Input
                                                        id="check-spender"
                                                        placeholder="0x..."
                                                        value={checkSpender}
                                                        onChange={(e) => setCheckSpender(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <Button onClick={handleCheckAllowance} variant="outline" className="w-full mb-4">
                                                Check Allowance
                                            </Button>

                                            {/* Display Allowance Result */}
                                            {allowanceResult && (
                                                <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-600/30 rounded-lg p-4">
                                                    <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Allowance Information
                                                    </h4>
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <Label className="text-xs text-gray-400">Owner</Label>
                                                                <p className="text-xs font-mono text-gray-300 truncate" title={allowanceResult.owner}>
                                                                    {allowanceResult.owner.slice(0, 10)}...{allowanceResult.owner.slice(-8)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-gray-400">Spender</Label>
                                                                <p className="text-xs font-mono text-gray-300 truncate" title={allowanceResult.spender}>
                                                                    {allowanceResult.spender.slice(0, 10)}...{allowanceResult.spender.slice(-8)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-gray-700 pt-3">
                                                            <Label className="text-xs text-gray-400">Approved Amount</Label>
                                                            <p className="text-2xl font-bold text-green-400 mt-1">
                                                                {allowanceResult.allowance} DEGU
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Wei: {allowanceResult.allowanceWei}
                                                            </p>
                                                        </div>
                                                        {parseFloat(allowanceResult.allowance) === 0 && (
                                                            <div className="bg-yellow-950/30 border border-yellow-600/30 rounded p-2 mt-2">
                                                                <p className="text-xs text-yellow-300">
                                                                    ⚠️ No approval found. The spender cannot transfer tokens from the owner.
                                                                </p>
                                                            </div>
                                                        )}
                                                        {parseFloat(allowanceResult.allowance) > 0 && (
                                                            <div className="bg-green-950/30 border border-green-600/30 rounded p-2 mt-2">
                                                                <p className="text-xs text-green-300">
                                                                    ✅ Approval active! The spender can transfer up to {allowanceResult.allowance} DEGU from the owner.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* ==================== BETTING CONTRACT SECTION ==================== */}
                                    <div className="mb-6">
                                        <div className="border-t border-gray-800 pt-8 mb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Gamepad2 className="w-8 h-8 text-purple-500" />
                                                <h2 className="text-3xl font-bold text-white">Betting Contract (SimpleBetting)</h2>
                                            </div>
                                            <p className="text-gray-400 mb-4">
                                                Create and join betting games with DEGU tokens. Multiple players, winner selection, and automatic prize distribution with 2% platform fee.
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded border border-purple-600/30">
                                                    Total Games: {totalGames}
                                                </span>
                                                {tokenInfo && (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 text-green-400 rounded border border-green-600/30">
                                                        <span className="text-xs">DEGU Token:</span>
                                                        <code className="text-xs font-mono">{tokenInfo.contractAddress.slice(0, 6)}...{tokenInfo.contractAddress.slice(-4)}</code>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(tokenInfo.contractAddress);
                                                                addLog(`📋 Copied DEGU token address: ${tokenInfo.contractAddress}`);
                                                            }}
                                                            className="text-green-300 hover:text-green-200"
                                                            title="Copy full address"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Betting Actions Grid */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                            {/* Create Game */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Gamepad2 className="w-5 h-5 text-purple-500" />
                                                        Create Betting Game
                                                    </CardTitle>
                                                    <CardDescription>Start a new betting game with custom settings</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {/* Important Approve Warning */}
                                                    <div className="bg-yellow-950/30 border border-yellow-600/50 rounded-lg p-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="text-yellow-500 text-xl">⚠️</div>
                                                            <div className="flex-1 text-sm">
                                                                <p className="font-semibold text-yellow-400 mb-2">IMPORTANT: Approve First!</p>
                                                                <p className="text-yellow-200 mb-3">
                                                                    Before creating a game, you must approve the SimpleBetting contract to spend your DEGU tokens.
                                                                    Without this approval, the transaction will fail.
                                                                </p>
                                                                <div className="bg-black/30 rounded p-2 mb-2">
                                                                    <p className="text-xs text-gray-300 mb-1">SimpleBetting Contract:</p>
                                                                    <code className="text-xs text-green-400">0x7f4736bb8011e152C14a98858EA532dA45370cFb</code>
                                                                </div>
                                                                <p className="text-xs text-yellow-300">
                                                                    👉 Go to the "Approve" section below, paste the contract address above, enter the amount, and click Approve.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <Label htmlFor="betting-token">Token Address</Label>
                                                            {tokenInfo && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setBettingTokenAddress(tokenInfo.contractAddress);
                                                                        addLog(`✅ Auto-filled DEGU token address`);
                                                                    }}
                                                                    className="h-6 text-xs text-green-400 hover:text-green-300"
                                                                >
                                                                    Use DEGU
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <Input
                                                            id="betting-token"
                                                            placeholder="0x... (DEGU token address)"
                                                            value={bettingTokenAddress}
                                                            onChange={(e) => setBettingTokenAddress(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="bet-amount">Bet Amount (DEGU per player)</Label>
                                                        <Input
                                                            id="bet-amount"
                                                            placeholder="100"
                                                            value={betAmount}
                                                            onChange={(e) => setBetAmount(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="min-players">Min Players</Label>
                                                            <Input
                                                                id="min-players"
                                                                type="number"
                                                                min="2"
                                                                value={minPlayers}
                                                                onChange={(e) => setMinPlayers(e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="max-players">Max Players</Label>
                                                            <Input
                                                                id="max-players"
                                                                type="number"
                                                                min="2"
                                                                value={maxPlayers}
                                                                onChange={(e) => setMaxPlayers(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button onClick={handleCreateGame} disabled={loading} className="w-full">
                                                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                        Create Game
                                                    </Button>
                                                </CardContent>
                                            </Card>

                                            {/* Join Game */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Users className="w-5 h-5 text-blue-500" />
                                                        Join Game
                                                    </CardTitle>
                                                    <CardDescription>Enter an existing game with your bet</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="join-game-id">Game ID</Label>
                                                        <Input
                                                            id="join-game-id"
                                                            placeholder="0"
                                                            type="number"
                                                            value={joinGameId}
                                                            onChange={(e) => setJoinGameId(e.target.value)}
                                                        />
                                                    </div>
                                                    <Button onClick={handleJoinGame} disabled={loading} className="w-full">
                                                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                        Join Game
                                                    </Button>
                                                    <div className="text-xs text-gray-400 bg-blue-950/20 border border-blue-600/30 rounded p-3">
                                                        <strong>Note:</strong> You must approve the betting contract to spend your DEGU tokens before joining. The bet amount will be transferred automatically.
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* View Game Details */}
                                        <Card className="mb-6">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Search className="w-5 h-5 text-yellow-500" />
                                                    View Game Details
                                                </CardTitle>
                                                <CardDescription>Load and inspect game information</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex gap-2 mb-4">
                                                    <Input
                                                        placeholder="Enter Game ID"
                                                        type="number"
                                                        value={viewGameId}
                                                        onChange={(e) => setViewGameId(e.target.value)}
                                                    />
                                                    <Button onClick={handleViewGame} variant="outline">
                                                        <Search className="w-4 h-4 mr-2" />
                                                        Load
                                                    </Button>
                                                </div>

                                                {gameDetails && (
                                                    <div className="space-y-4">
                                                        <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                <div>
                                                                    <Label className="text-gray-400">Game ID</Label>
                                                                    <p className="text-white font-semibold">#{gameDetails.gameId}</p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-gray-400">Status</Label>
                                                                    <p className={`font-semibold ${
                                                                        gameDetails.status === 'Open' ? 'text-green-400' :
                                                                        gameDetails.status === 'Active' ? 'text-blue-400' :
                                                                        gameDetails.status === 'Completed' ? 'text-purple-400' :
                                                                        'text-red-400'
                                                                    }`}>{gameDetails.status}</p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-gray-400">Bet Amount</Label>
                                                                    <p className="text-white font-semibold">{gameDetails.betAmount} DEGU</p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-gray-400">Players</Label>
                                                                    <p className="text-white font-semibold">
                                                                        {gameDetails.players.length} / {gameDetails.maxPlayers} ({gameDetails.minPlayers} min)
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-gray-400">Total Pot</Label>
                                                                    <p className="text-green-400 font-semibold">{gameDetails.totalPot} DEGU</p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-gray-400">Creator</Label>
                                                                    <p className="text-xs font-mono text-gray-400">
                                                                        {gameDetails.creator.slice(0, 6)}...{gameDetails.creator.slice(-4)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {gameDetails.players.length > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-gray-700">
                                                                    <Label className="text-gray-400 mb-2 block">Players</Label>
                                                                    <div className="space-y-1">
                                                                        {gameDetails.players.map((player, i) => (
                                                                            <div key={i} className="text-xs font-mono text-gray-300 flex items-center gap-2">
                                                                                <span>{i + 1}.</span>
                                                                                <span>{player}</span>
                                                                                {gameDetails.winners.includes(player) && (
                                                                                    <Trophy className="w-3 h-3 text-yellow-500" />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {gameDetails.winners.length > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-gray-700">
                                                                    <Label className="text-gray-400 mb-2 flex items-center gap-2">
                                                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                                                        Winners
                                                                    </Label>
                                                                    <div className="space-y-1">
                                                                        {gameDetails.winners.map((winner, i) => (
                                                                            <div key={i} className="text-xs font-mono text-yellow-400">
                                                                                {winner}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Game Controls */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Creator Controls */}
                                                            {gameDetails.creator.toLowerCase() === walletAddress.toLowerCase() && (
                                                                <>
                                                                    {gameDetails.status === 'Open' && gameDetails.players.length >= gameDetails.minPlayers && (
                                                                        <Button onClick={handleStartGame} disabled={loading} className="w-full">
                                                                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                                            Start Game
                                                                        </Button>
                                                                    )}

                                                                    {gameDetails.status === 'Active' && (
                                                                        <div className="col-span-full">
                                                                            <Label className="mb-2 block">Select Winners (check players)</Label>
                                                                            <div className="space-y-2 mb-4">
                                                                                {gameDetails.players.map((player, i) => (
                                                                                    <label key={i} className="flex items-center gap-2 cursor-pointer">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={selectedWinners.includes(player)}
                                                                                            onChange={() => toggleWinnerSelection(player)}
                                                                                            className="w-4 h-4"
                                                                                        />
                                                                                        <span className="text-sm font-mono text-gray-300">{player}</span>
                                                                                    </label>
                                                                                ))}
                                                                            </div>
                                                                            <Button onClick={handleSelectWinners} disabled={loading || selectedWinners.length === 0} className="w-full">
                                                                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                                                <Trophy className="w-4 h-4 mr-2" />
                                                                                Select Winners ({selectedWinners.length})
                                                                            </Button>
                                                                        </div>
                                                                    )}

                                                                    {gameDetails.status === 'Open' && (
                                                                        <Button onClick={handleCancelGame} disabled={loading} variant="destructive" className="w-full">
                                                                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                                            <XCircle className="w-4 h-4 mr-2" />
                                                                            Cancel & Refund
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}

                                                            {/* Winner Controls */}
                                                            {gameDetails.status === 'Completed' &&
                                                             gameDetails.winners.some(w => w.toLowerCase() === walletAddress.toLowerCase()) && (
                                                                <Button onClick={handleClaimPrize} disabled={loading} className="w-full">
                                                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                                    <Trophy className="w-4 h-4 mr-2" />
                                                                    Claim Your Prize
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {!gameDetails && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        Enter a Game ID and click Load to view details
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Activity Log */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Activity Log</CardTitle>
                                            <CardDescription>Real-time transaction updates</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm border border-[#2d2d2d]">
                                                {logs.length === 0 ? (
                                                    <p className="text-gray-500">No activity yet...</p>
                                                ) : (
                                                    logs.map((log, i) => (
                                                        <div key={i} className="mb-1 text-gray-300">
                                                            {log}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
