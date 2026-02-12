import { createClient } from "@supabase/supabase-js";
import { UserPokemon } from "@/lib/types";

// Helper to get a Supabase client (Admin/Service role would be better for secure increments, 
// but we'll use the public URL/Anon key for now as we don't have service key in env for this demo).
// Actually, we should use the client passed from the route or create a new one.
// Since we are server-side, we can import the shared client.
import { supabase } from "@/lib/supabase";

export async function awardRewards(userId: string, xpAmount: number, coinsAmount: number) {
    // 1. Update Profile (Trainer)
    // We increment coins and XP. 
    // Note: Concurrency might be an issue with simple 'select then update', but acceptable for this scale.
    // Ideally use an RPC function `increment_stats` but we'll do JS logic for now.

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("coins, xp, level")
        .eq("id", userId)
        .single();

    if (profileError) {
        console.error("Error fetching profile for rewards:", profileError);
        return null;
    }

    const newCoins = (profile.coins || 0) + coinsAmount;
    const newTrainerXp = (profile.xp || 0) + xpAmount;
    // Trainer level up logic? Let's keep it simple: Level = floor(sqrt(XP)/10) + 1 or similar?
    // For now, just store XP.

    await supabase
        .from("profiles")
        .update({ coins: newCoins, xp: newTrainerXp })
        .eq("id", userId);

    // 2. Update Active Pokemon Buddy
    const { data: buddy, error: buddyError } = await supabase
        .from("user_pokemon")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

    let leveledUp = false;
    let newBuddyData = null;

    if (buddy && !buddyError) {
        let currentXp = buddy.xp + xpAmount;
        let currentLevel = buddy.level;
        let happiness = buddy.happiness; // Gain happiness on task complete?

        // Level Up Logic
        // Threshold: Level * 100 XP to reach next level?
        // Let's say: XP required for next level = Level * 50.
        // If currentXp > Threshold, Level++, XP -= Threshold.

        // Simple loop for potential multi-level
        const xpThreshold = (lvl: number) => lvl * 50;

        while (currentXp >= xpThreshold(currentLevel)) {
            currentXp -= xpThreshold(currentLevel);
            currentLevel++;
            leveledUp = true;
            happiness = Math.min(100, happiness + 5); // Happy on level up
        }

        // Just giving XP adds a small happiness?
        // happiness = Math.min(100, happiness + 1);

        const { data: updatedBuddy } = await supabase
            .from("user_pokemon")
            .update({
                xp: currentXp,
                level: currentLevel,
                happiness: happiness
            })
            .eq("id", buddy.id)
            .select()
            .single();

        newBuddyData = updatedBuddy;
    }

    return {
        coins: newCoins,
        trainerXp: newTrainerXp,
        buddy: newBuddyData,
        leveledUp
    };
}
