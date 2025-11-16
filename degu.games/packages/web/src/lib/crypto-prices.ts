/**
 * Crypto Price Fetching Utility
 * Fetches USD prices for cryptocurrencies from CoinGecko API
 */

interface PriceCache {
    prices: Record<string, number>;
    timestamp: number;
    isUsingFallback: boolean;
}

// 5-minute cache
const CACHE_DURATION = 5 * 60 * 1000;
let priceCache: PriceCache | null = null;

// CoinGecko IDs mapping
const COIN_IDS: Record<string, string> = {
    'ETH': 'ethereum',
    'MATIC': 'matic-network',
    'USDC': 'usd-coin',
    'PAS': 'polkadot', // Approximate - use DOT as proxy for Westend
};

/**
 * Fetch current USD prices for supported cryptocurrencies
 */
export async function getCryptoPrices(): Promise<Record<string, number>> {
    // Check cache first
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
        console.log('[Prices] Using cached prices', priceCache.isUsingFallback ? '(FALLBACK)' : '(REAL)');
        return priceCache.prices;
    }

    try {
        const ids = Object.values(COIN_IDS).join(',');
        console.log('[Prices] Fetching from CoinGecko API...');
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
            {
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch prices: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[Prices] Received data from CoinGecko:', data);

        // Convert to symbol-based mapping
        const prices: Record<string, number> = {};
        for (const [symbol, coinId] of Object.entries(COIN_IDS)) {
            if (data[coinId]?.usd) {
                prices[symbol] = data[coinId].usd;
            }
        }

        console.log('[Prices] ✓ Using REAL prices from API:', prices);

        // Update cache
        priceCache = {
            prices,
            timestamp: Date.now(),
            isUsingFallback: false,
        };

        return prices;
    } catch (error) {
        console.error('[Prices] ✗ Error fetching crypto prices:', error);

        // Return cached prices if available, otherwise fallback
        if (priceCache) {
            console.log('[Prices] Using old cached prices (stale)');
            return priceCache.prices;
        }

        // Return fallback prices (approximate, for display purposes only)
        const fallbackPrices = {
            'ETH': 2300,
            'MATIC': 0.92,
            'USDC': 1.0,
            'PAS': 7.5,
        };
        console.warn('[Prices] ⚠️ Using FALLBACK prices:', fallbackPrices);

        priceCache = {
            prices: fallbackPrices,
            timestamp: Date.now(),
            isUsingFallback: true,
        };

        return fallbackPrices;
    }
}

/**
 * Get cached price for a specific symbol
 */
export function getCachedPrice(symbol: string): number | null {
    if (!priceCache) return null;
    return priceCache.prices[symbol] || null;
}

/**
 * Check if currently using fallback prices
 */
export function isUsingFallbackPrices(): boolean {
    return priceCache?.isUsingFallback ?? false;
}

/**
 * Calculate USD value from token balance and symbol
 */
export function calculateUsdValue(
    balance: string,
    symbol: string,
    prices: Record<string, number>
): number {
    const price = prices[symbol];
    if (!price) return 0;

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum)) return 0;

    return balanceNum * price;
}

/**
 * Format USD value for display
 */
export function formatUsdValue(value: number): string {
    if (value === 0) return '$0.00';
    if (value < 0.01) return '<$0.01';
    if (value < 1) return `$${value.toFixed(3)}`;
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${(value / 1000000).toFixed(2)}M`;
}

/**
 * Format token balance for display
 */
export function formatTokenBalance(balance: string, decimals: number = 4): string {
    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum)) return '0';
    if (balanceNum === 0) return '0';
    if (balanceNum < 0.0001) return '<0.0001';
    if (balanceNum < 1) return balanceNum.toFixed(decimals);
    if (balanceNum < 1000) return balanceNum.toFixed(2);
    if (balanceNum < 1000000) return `${(balanceNum / 1000).toFixed(2)}K`;
    return `${(balanceNum / 1000000).toFixed(2)}M`;
}
