import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUserId, AuthError } from "@/lib/server/auth-utils";
import { awardRewards } from "@/lib/server/game-service";

// PATCH /api/tasks/[id] — Update task status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId();
        const { id } = await params;
        const body = await request.json();

        const updates: Record<string, unknown> = {};

        if (body.status !== undefined) updates.status = body.status;
        if (body.title !== undefined) updates.title = body.title;
        if (body.priority !== undefined) updates.priority = body.priority;
        if (body.category !== undefined) updates.category = body.category;
        if (body.due_at !== undefined) updates.due_at = body.due_at;

        if (body.status === "completed") {
            updates.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from("quests")
            .update(updates)
            .eq("id", id)
            .eq("user_id", userId) // Ensure ownership
            .select() // Needed for reward info
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Award Rewards if completed
        if (body.status === "completed" && data) {
            const coins = data.reward_coins || 1;
            const xp = data.reward_xp || 10;
            // Fire and forget (or await if we want to return updated stats)
            // We await to return consistent state if needed, though frontend might optimistic update.
            await awardRewards(userId, xp, coins);
        }

        return NextResponse.json(data);
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/tasks/[id] — Delete a task
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId();
        const { id } = await params;

        const { error } = await supabase
            .from("quests")
            .delete()
            .eq("id", id)
            .eq("user_id", userId); // Ensure ownership

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
