import { LOOT_ITEMS } from "@/lib/constants";

export interface SessionResult {
    isCrit: boolean;
    lootItem: typeof LOOT_ITEMS[number] | null;
}

/**
 * Rolls for critical success and loot drops based on session duration.
 * @param minutes Duration of the session in minutes
 * @returns SessionResult with crit boolean and potential loot item
 */
export function rollSessionRewards(minutes: number): SessionResult {
    // 1. Critical Success Roll
    // Base chance 10%
    // Bonus: +1% per 10 mins (max +5%)
    const critChance = 0.1 + Math.min(0.05, Math.floor(minutes / 10) * 0.01);
    const isCrit = Math.random() < critChance;

    // 2. Loot Drop Roll
    // Only for sessions > 15 mins
    if (minutes < 15) {
        return { isCrit, lootItem: null };
    }

    // Base chance 5%
    // Bonus: +1% per 10 mins (max +10%)
    const lootChance = 0.05 + Math.min(0.1, Math.floor(minutes / 10) * 0.01);
    const isLoot = Math.random() < lootChance;

    let lootItem = null;
    if (isLoot) {
        // Roll for Rarity
        // Common: 0-60, Rare: 60-90, Epic: 90-100
        const rarityRoll = Math.random() * 100;
        let selectedRarity = "common";
        if (rarityRoll > 90) selectedRarity = "epic";
        else if (rarityRoll > 60) selectedRarity = "rare";

        // Pick item from pool
        const pool = LOOT_ITEMS.filter(i => i.rarity === selectedRarity);
        if (pool.length > 0) {
            lootItem = pool[Math.floor(Math.random() * pool.length)];
        } else {
            // Fallback to a common item if pool is empty
            const commonPool = LOOT_ITEMS.filter(i => i.rarity === "common");
            lootItem = commonPool[Math.floor(Math.random() * commonPool.length)];
        }
    }

    return { isCrit, lootItem };
}
