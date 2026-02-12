import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUserId, AuthError } from "@/lib/server/auth-utils";
import { awardRewards } from "@/lib/server/game-service";

// GET /api/habits — Get today's habit entries
export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();
        const today = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
            .from("habit_entries")
            .select("*")
            .eq("user_id", userId)
            .eq("date", today);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/habits — Toggle a habit for today
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        const { habit_id } = await request.json();
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        if (!habit_id) {
            return NextResponse.json({ error: "habit_id is required" }, { status: 400 });
        }

        // 1. Check if entry already exists for today
        const { data: existingEntry } = await supabase
            .from("habit_entries")
            .select("*")
            .eq("user_id", userId)
            .eq("habit_id", habit_id)
            .eq("date", todayStr)
            .single();

        if (existingEntry?.completed) {
            return NextResponse.json(
                { error: "already_completed", message: "Already completed today" },
                { status: 409 }
            );
        }

        // 2. Mark as completed in `habit_entries`
        // Upsert ensures we handle both "new for today" and "retry after failed toggle"
        const { error: entryError } = await supabase
            .from("habit_entries")
            .upsert({
                user_id: userId,
                habit_id,
                date: todayStr,
                completed: true,
            });

        if (entryError) throw entryError;

        // 3. Update `habit_streaks`
        // Fetch current streak info
        const { data: streakData } = await supabase
            .from("habit_streaks")
            .select("*")
            .eq("user_id", userId)
            .eq("habit_id", habit_id)
            .single();

        let currentStreak = 1;
        let longestStreak = 1;

        if (streakData) {
            const lastCompleted = streakData.last_completed_at ? new Date(streakData.last_completed_at) : null;

            // Calculate "Yesterday" in UTC logic to match database dates usually
            // Ideally we use user timezone, but simpler to use strict 24-48h window or verify "date" string
            // Let's rely on date strings for safety.

            // Check if last completion was yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];
            const lastDateStr = lastCompleted ? lastCompleted.toISOString().split("T")[0] : null;

            if (lastDateStr === yesterdayStr) {
                // Streak continues!
                currentStreak = (streakData.current_streak || 0) + 1;
            } else if (lastDateStr === todayStr) {
                // Should be caught by entry check, but safe fallback
                currentStreak = streakData.current_streak;
            } else {
                // Streak broken (missed yesterday) -> Reset to 1
                currentStreak = 1;
            }

            longestStreak = Math.max(streakData.longest_streak || 0, currentStreak);
        }

        // Upsert streak data
        const { data: newStreakData, error: streakError } = await supabase
            .from("habit_streaks")
            .upsert({
                user_id: userId,
                habit_id,
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (streakError) throw streakError;

        // Award Rewards for Habit Completion (Fixed amount for now: 10 XP, 1 coin)
        await awardRewards(userId, 10, 1);

        return NextResponse.json({
            status: "success",
            streak: newStreakData
        }, { status: 201 });

    } catch (err: any) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error("Habit toggle error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
