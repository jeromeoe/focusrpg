import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUserId, AuthError } from "@/lib/server/auth-utils";

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

// POST /api/habits — Toggle a habit for today (once per day only)
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        const { habit_id } = await request.json();
        const today = new Date().toISOString().split("T")[0];

        if (!habit_id) {
            return NextResponse.json({ error: "habit_id is required" }, { status: 400 });
        }

        // Check if entry already exists for today
        const { data: existing } = await supabase
            .from("habit_entries")
            .select("*")
            .eq("user_id", userId)
            .eq("habit_id", habit_id)
            .eq("date", today)
            .single();

        if (existing) {
            // Already completed today — cannot uncomplete
            if (existing.completed) {
                return NextResponse.json(
                    { error: "already_completed", message: "Already completed today" },
                    { status: 409 }
                );
            }

            // Mark as completed
            const { data, error } = await supabase
                .from("habit_entries")
                .update({ completed: true })
                .eq("id", existing.id)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json(data);
        }

        // No entry exists — create and mark as completed
        const { data, error } = await supabase
            .from("habit_entries")
            .insert({
                user_id: userId,
                habit_id,
                date: today,
                completed: true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
