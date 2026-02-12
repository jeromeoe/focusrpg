import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUserId, AuthError } from "@/lib/server/auth-utils";

// GET /api/tasks — Fetch all tasks for the user
export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();

        const { data, error } = await supabase
            .from("quests")
            .select("*")
            .eq("user_id", userId)
            .order("due_at", { ascending: true, nullsFirst: false });

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

// POST /api/tasks — Create a new task
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        const body = await request.json();

        const { title, description, category, priority, reward_coins, reward_xp, due_at } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("quests")
            .insert({
                user_id: userId,
                title,
                description: description || null,
                category: category || null,
                priority: priority || "side",
                reward_coins: reward_coins ?? 1,
                reward_xp: reward_xp ?? 10,
                due_at: due_at || null,
                status: "pending",
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
