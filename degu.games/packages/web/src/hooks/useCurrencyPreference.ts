"use client";

import { useState, useEffect } from "react";

const CURRENCY_PREFERENCE_KEY = "preferred_currency";

/**
 * Currency preference format: "symbol-network" (e.g., "usdc-base", "eth-arbitrum")
 */
export type CurrencyPreference = string;

/**
 * Get initial preference from localStorage (client-side only)
 */
function getInitialPreference(): CurrencyPreference | null {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(CURRENCY_PREFERENCE_KEY);
    } catch {
        return null;
    }
}

/**
 * Hook to manage user's preferred currency selection
 * Syncs with localStorage and provides methods to get/set preference
 */
export function useCurrencyPreference() {
    const [preference, setPreferenceState] = useState<CurrencyPreference | null>(
        getInitialPreference
    );

    // Set preference and save to localStorage
    const setPreference = (currencyId: CurrencyPreference) => {
        setPreferenceState(currencyId);
        if (typeof window !== "undefined") {
            localStorage.setItem(CURRENCY_PREFERENCE_KEY, currencyId);
        }
    };

    // Clear preference
    const clearPreference = () => {
        setPreferenceState(null);
        if (typeof window !== "undefined") {
            localStorage.removeItem(CURRENCY_PREFERENCE_KEY);
        }
    };

    return {
        preference,
        setPreference,
        clearPreference,
    };
}

/**
 * Utility to build currency ID from token symbol and network
 * @param tokenSymbol - Token symbol (e.g., "USDC", "ETH", "MATIC")
 * @param networkShortName - Network name (e.g., "Base", "Polygon", "Arbitrum")
 * @returns Currency ID (e.g., "usdc-base")
 */
export function buildCurrencyId(
    tokenSymbol: string,
    networkShortName: string
): CurrencyPreference {
    return `${tokenSymbol.toLowerCase()}-${networkShortName.toLowerCase()}`;
}
