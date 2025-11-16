/**
 * Username generator utility for creating random usernames
 * Format: {Adjective}{Noun}{Number}
 * Example: DiamondWhale247, CosmicNinja420, TurboDegen888
 */

const FIRST_WORD_POOL = [
    "Crypto",
    "Degen",
    "Diamond",
    "Golden",
    "Liquid",
    "Staked",
    "Minted",
    "Blazing",
    "Cosmic",
    "Quantum",
    "Turbo",
    "Ultra",
    "Mega",
    "Alpha",
    "Based",
    "Epic",
    "Legendary",
    "Immortal",
    "Eternal",
    "Sacred",
    "Ancient",
    "Mystic",
    "Atomic",
    "Stellar",
] as const;

const SECOND_WORD_POOL = [
    "Whale",
    "Ape",
    "Bull",
    "Bear",
    "Degen",
    "Trader",
    "Hodler",
    "Wizard",
    "Ninja",
    "Samurai",
    "Knight",
    "Viking",
    "Phantom",
    "Shadow",
    "Hunter",
    "Sniper",
    "Builder",
    "Miner",
    "Farmer",
    "Stacker",
    "Gambler",
    "Player",
    "Gamer",
    "Hustler",
    "Shark",
    "Wolf",
    "Tiger",
    "Dragon",
    "Phoenix",
    "Titan",
] as const;

/**
 * Generate a random username in the format: {Adjective}{Noun}{Number}
 * @returns A randomly generated username (e.g., "DiamondWhale247")
 */
export function generateRandomUsername(): string {
    // Get random adjective from first pool
    const randomAdjective =
        FIRST_WORD_POOL[Math.floor(Math.random() * FIRST_WORD_POOL.length)];

    // Get random noun from second pool
    const randomNoun =
        SECOND_WORD_POOL[Math.floor(Math.random() * SECOND_WORD_POOL.length)];

    // Generate random number between 100 and 999
    const randomNumber = Math.floor(Math.random() * 900) + 100;

    // Combine all parts
    return `${randomAdjective}${randomNoun}${randomNumber}`;
}

/**
 * Generate multiple unique usernames
 * @param count Number of usernames to generate
 * @returns Array of unique usernames
 */
export function generateMultipleUsernames(count: number): string[] {
    const usernames = new Set<string>();

    while (usernames.size < count) {
        usernames.add(generateRandomUsername());
    }

    return Array.from(usernames);
}
