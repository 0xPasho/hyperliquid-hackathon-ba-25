"use client";

import { useState } from "react";
import {
    useMultiChainBalances,
    type NetworkBalance,
    type TokenBalance,
} from "@/hooks/useMultiChainBalances";
import {
    formatUsdValue,
    formatTokenBalance,
    isUsingFallbackPrices,
} from "@/lib/crypto-prices";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    useCurrencyPreference,
    buildCurrencyId,
} from "@/hooks/useCurrencyPreference";
import { toast } from "sonner";

const IS_TESTNET = process.env.NEXT_PUBLIC_IS_TESTNET === "true";

// Valid currency combinations available in QuickPlay
const VALID_CURRENCY_COMBINATIONS = [
    "usdc-base",
    "usdc-polygon",
    "usdc-arbitrum",
    "eth-base",
    "eth-arbitrum",
    "matic-polygon",
];

/**
 * Token logo with network badge
 */
function TokenLogo({
    tokenSymbol,
    networkShortName,
    size = 28,
    isSubToken = false,
}: {
    tokenSymbol: string;
    networkShortName: string;
    size?: number;
    isSubToken?: boolean;
}) {
    const networkColors: Record<string, string> = {
        Base: "#0052FF",
        Polygon: "#000",
        Arbitrum: "#28A0F0",
    };

    const networkColor = networkColors[networkShortName] || "#6B6B6B";
    const badgeSize = size * 0.52;

    // Map token symbols to logo paths
    const getTokenLogo = (symbol: string, network: string) => {
        if (symbol === "USDC") return "/coins/usdc.png";
        // For native tokens, use network logo
        if (symbol === "ETH" && network === "Base") return "/coins/base.png";
        if (symbol === "ETH" && network === "Arbitrum")
            return "/coins/arbitrum.png";
        if (symbol === "MATIC" && network === "Polygon")
            return "/coins/polygon.png";
        return null;
    };

    const getNetworkLogo = (network: string) => {
        if (network === "Base") return "/coins/base.png";
        if (network === "Polygon") return "/coins/polygon.png";
        if (network === "Arbitrum") return "/coins/arbitrum.png";
        return null;
    };

    const mainLogo = getTokenLogo(tokenSymbol, networkShortName);
    const badgeLogo = getNetworkLogo(networkShortName);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Main token logo */}
            <div
                className="absolute inset-0 rounded-full border border-[#2d2d2d] flex items-center justify-center overflow-hidden bg-white p-[1px]"
                style={{
                    boxShadow: isSubToken
                        ? "0 0 8px rgba(255,255,255,0.1)"
                        : `0 0 12px ${networkColor}40`,
                }}
            >
                {mainLogo ? (
                    <img
                        src={mainLogo}
                        alt={tokenSymbol}
                        className="w-full h-full object-cover rounded-full"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <span
                            className="text-white font-bold"
                            style={{ fontSize: size * 0.35 }}
                        >
                            {tokenSymbol.charAt(0)}
                        </span>
                    </div>
                )}
            </div>

            {/* Network badge */}
            {isSubToken && (
                <div
                    className="absolute bottom-0 right-0 rounded-full border-2 border-[#141414] bg-[#000] p-[1px]"
                    style={{
                        width: badgeSize,
                        height: badgeSize,
                    }}
                >
                    <div
                        className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: networkColor }}
                    >
                        {badgeLogo ? (
                            <img
                                src={badgeLogo}
                                alt={networkShortName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span
                                className="text-white font-bold"
                                style={{ fontSize: badgeSize * 0.5 }}
                            >
                                {networkShortName.charAt(0)}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Individual network balance item in dropdown
 */
function NetworkBalanceItem({
    network,
    onTokenClick,
}: {
    network: NetworkBalance;
    onTokenClick?: (tokenSymbol: string, networkShortName: string) => void;
}) {
    const nativeToken = network.balances.find((b) => b.isNative);
    const otherTokens = network.balances.filter((b) => !b.isNative);

    return (
        <>
            {/* Native token row */}
            <div
                className="px-3 py-2.5 cursor-pointer transition-all duration-150"
                style={{
                    backgroundColor: "transparent",
                }}
                onClick={() => {
                    if (onTokenClick && nativeToken) {
                        onTokenClick(nativeToken.symbol, network.shortName);
                    }
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <TokenLogo
                            tokenSymbol={nativeToken?.symbol || "ETH"}
                            networkShortName={network.shortName}
                            size={28}
                        />
                        <span
                            className="text-sm font-medium"
                            style={{ color: "rgba(255, 255, 255, 0.90)" }}
                        >
                            {network.shortName}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className="text-sm font-medium"
                            style={{ color: "rgba(255, 255, 255, 0.95)" }}
                        >
                            {nativeToken
                                ? `${formatTokenBalance(nativeToken.balance)} ${
                                      nativeToken.symbol
                                  }`
                                : "—"}
                        </span>
                        <span
                            className="text-sm font-semibold min-w-[70px] text-right"
                            style={{ color: "rgba(255, 255, 255, 0.95)" }}
                        >
                            {nativeToken
                                ? formatUsdValue(nativeToken.usdValue || 0)
                                : "$0.00"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Other tokens (USDC, etc.) - as sub-rows */}
            {otherTokens.map((token) => (
                <div
                    key={token.symbol}
                    className="px-3 py-2.5 cursor-pointer transition-all duration-150"
                    style={{
                        backgroundColor: "transparent",
                    }}
                    onClick={() => {
                        if (onTokenClick) {
                            onTokenClick(token.symbol, network.shortName);
                        }
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <TokenLogo
                                tokenSymbol={token.symbol}
                                networkShortName={network.shortName}
                                size={28}
                                isSubToken={true}
                            />
                            <span
                                className="text-sm font-medium"
                                style={{ color: "rgba(255, 255, 255, 0.60)" }}
                            >
                                {token.symbol}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span
                                className="text-sm font-medium"
                                style={{ color: "rgba(255, 255, 255, 0.85)" }}
                            >
                                {formatTokenBalance(token.balance, 2)}
                            </span>
                            <span
                                className="text-sm font-semibold min-w-[70px] text-right"
                                style={{ color: "rgba(255, 255, 255, 0.85)" }}
                            >
                                {formatUsdValue(token.usdValue || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

/**
 * Loading skeleton for balance selector
 */
function BalanceSelectorSkeleton() {
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-24 h-4" />
        </div>
    );
}

/**
 * Main network balance selector component
 */
export function NetworkBalanceSelector() {
    const { networks, totalPortfolioValue, isLoading, error } =
        useMultiChainBalances();
    const { setPreference } = useCurrencyPreference();
    const [open, setOpen] = useState(false);

    // Don't render if loading initially
    if (isLoading && networks.length === 0) {
        return <BalanceSelectorSkeleton />;
    }

    // Don't render if error and no cached data
    if (error && networks.length === 0) {
        return null;
    }

    // Find the network with the highest balance to display in trigger
    const primaryNetwork = networks.reduce((prev, current) => {
        return current.totalUsdValue > prev.totalUsdValue ? current : prev;
    }, networks[0]);

    const primaryToken = primaryNetwork?.balances.find((b) => b.isNative);

    // Handle token selection to save as preference
    const handleTokenClick = (
        tokenSymbol: string,
        networkShortName: string
    ) => {
        const currencyId = buildCurrencyId(tokenSymbol, networkShortName);

        // Only save if this currency combination is available in QuickPlay
        if (VALID_CURRENCY_COMBINATIONS.includes(currencyId)) {
            setPreference(currencyId);
            setOpen(false); // Close the dropdown
            toast.success(
                `Preference saved: ${tokenSymbol} on ${networkShortName}`,
                {
                    duration: 2000,
                }
            );
        } else {
            setOpen(false); // Still close the dropdown
            toast.info(
                `${tokenSymbol} on ${networkShortName} is not available for gameplay`,
                {
                    duration: 2000,
                }
            );
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg hover:bg-[#141414] transition-colors">
                    {primaryNetwork && primaryToken ? (
                        <>
                            <TokenLogo
                                tokenSymbol={"Polkadot"}
                                networkShortName={primaryNetwork.shortName}
                                size={20}
                            />
                            <span className="text-sm font-medium text-[#E5E5E5]">
                                {formatTokenBalance(primaryToken.balance)} DOT
                            </span>
                            <span className="text-xs text-[#6B6B6B]">
                                ({formatUsdValue(primaryToken.usdValue || 0)})
                            </span>
                            <svg
                                className="w-4 h-4 text-gray-400 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </>
                    ) : (
                        <>
                            <span className="text-sm text-gray-400">
                                No balances
                            </span>
                            <svg
                                className="w-4 h-4 text-gray-400 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-[320px] bg-[#141414] border-[#2d2d2d] p-0"
            >
                {/* Testnet Banner */}
                {IS_TESTNET && (
                    <div className="bg-orange-500/10 border-b border-orange-500/20 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full bg-orange-500"
                                style={{
                                    animation:
                                        "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                                    boxShadow:
                                        "0 0 8px rgba(249, 115, 22, 0.6)",
                                }}
                            />
                            <span className="text-[10px] font-semibold text-orange-400 tracking-wide uppercase">
                                Testnet - Test tokens only
                            </span>
                        </div>
                    </div>
                )}

                {/* Total portfolio value header */}
                <div className="px-3 py-3 border-b border-[#2d2d2d]">
                    <div
                        className="text-[10px] font-medium mb-1 tracking-wider uppercase"
                        style={{ color: "rgba(255, 255, 255, 0.50)" }}
                    >
                        Total Portfolio
                    </div>
                    <div
                        className="text-2xl font-bold"
                        style={{ color: "rgba(255, 255, 255, 0.95)" }}
                    >
                        {formatUsdValue(totalPortfolioValue)}
                    </div>
                    {isUsingFallbackPrices() && (
                        <div className="text-[10px] text-yellow-500 mt-1.5 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Using approximate prices</span>
                        </div>
                    )}
                </div>

                {/* Network list - compact rows */}
                <div className="py-1">
                    {networks.map((network) => (
                        <NetworkBalanceItem
                            key={network.chainId}
                            network={network}
                            onTokenClick={handleTokenClick}
                        />
                    ))}
                </div>

                {/* Loading indicator */}
                {isLoading && (
                    <div className="p-3 border-t border-[#2d2d2d] bg-[#0F0F0F]">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            <span>Updating...</span>
                        </div>
                    </div>
                )}

                {/* Error indicator */}
                {error && (
                    <div className="p-3 border-t border-[#2d2d2d] bg-red-500/5">
                        <div className="text-xs text-red-400 text-center">
                            {error}
                        </div>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
