"use client";

import { useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { CONTRACTS } from "@/lib/game-escrow-api";
import { checkUSDCBalance } from "@/lib/user-escrow-client";
import { createWalletClientFromPrivy } from "@/lib/privy-wallet-client";

export default function DebugUSDCPage() {
    const { wallets } = useWallets();
    const [usdcAddress, setUsdcAddress] = useState<string>("");
    const [balance, setBalance] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get the USDC address from the config
        setUsdcAddress(CONTRACTS.USDC_ADDRESS);
    }, []);

    const checkBalance = async () => {
        setLoading(true);
        setError(null);
        setBalance(null);

        try {
            const wallet = wallets[0];
            if (!wallet) {
                setError("No wallet connected");
                return;
            }

            setWalletAddress(wallet.address);

            const walletClient = createWalletClientFromPrivy(wallet);
            const userBalance = await checkUSDCBalance(walletClient, wallet.address);
            setBalance(userBalance);
        } catch (err: any) {
            setError(err.message || "Failed to check balance");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">USDC Debug Page</h1>

            <div className="space-y-6 bg-slate-900 p-6 rounded-lg">
                <div>
                    <h2 className="text-xl font-semibold mb-3">Configuration</h2>
                    <div className="space-y-2 font-mono text-sm">
                        <div>
                            <span className="text-slate-400">USDC Contract:</span>
                            <div className="bg-slate-800 p-2 rounded mt-1 break-all">
                                {usdcAddress || "Loading..."}
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-400">GameEscrow Contract:</span>
                            <div className="bg-slate-800 p-2 rounded mt-1 break-all">
                                {CONTRACTS.GAME_ESCROW_ADDRESS}
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-400">Chain ID:</span>
                            <div className="bg-slate-800 p-2 rounded mt-1">
                                {CONTRACTS.CHAIN_ID}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">Expected Values</h2>
                    <div className="space-y-2 font-mono text-sm text-green-400">
                        <div>USDC: 0xE02E0dEa9F850D88E1329550D9FC8D98aF541f55</div>
                        <div>GameEscrow: 0x90c15373A1db6c75A55CfD3743249D56136Cb86a</div>
                        <div>Chain ID: 84532</div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">Your Wallet</h2>
                    <button
                        onClick={checkBalance}
                        disabled={loading || wallets.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold"
                    >
                        {loading ? "Checking..." : "Check USDC Balance"}
                    </button>

                    {wallets.length === 0 && (
                        <p className="text-yellow-500 mt-2 text-sm">
                            Please log in to check your balance
                        </p>
                    )}

                    {walletAddress && (
                        <div className="mt-4 space-y-2">
                            <div>
                                <span className="text-slate-400">Wallet Address:</span>
                                <div className="bg-slate-800 p-2 rounded mt-1 font-mono text-sm break-all">
                                    {walletAddress}
                                </div>
                            </div>

                            {balance && (
                                <div>
                                    <span className="text-slate-400">USDC Balance:</span>
                                    <div className="bg-slate-800 p-2 rounded mt-1 font-mono text-2xl font-bold text-green-400">
                                        {balance} USDC
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-700 pt-4">
                    <h2 className="text-xl font-semibold mb-2">Troubleshooting</h2>
                    <ul className="text-sm space-y-2 text-slate-300">
                        <li>✅ If USDC address matches expected: Configuration is correct</li>
                        <li>✅ If balance shows 10000 USDC: Your wallet has sufficient funds</li>
                        <li>❌ If USDC address doesn't match: Try hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)</li>
                        <li>❌ If balance shows 0 USDC: Contact support to mint tokens</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
