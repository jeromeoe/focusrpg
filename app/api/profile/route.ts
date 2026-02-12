import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUserId, AuthError } from "@/lib/server/auth-utils";

// GET /api/profile — Fetch user profile
export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

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

// PATCH /api/profile — Update profile fields
export async function PATCH(request: Request) {
    try {
        const userId = await getAuthenticatedUserId();
        const body = await request.json();

        // Whitelist allowed fields to prevent abuse
        // (e.g. don't allow updating 'id' or 'email' directly here)
        const allowedUpdates = {
            coins: body.coins,
            xp: body.xp,
            level: body.level,
            current_streak: body.current_streak,
            longest_streak: body.longest_streak,
            total_focus_minutes: body.total_focus_minutes
        };

        // Remove undefined keys
        Object.keys(allowedUpdates).forEach(key =>
            (allowedUpdates as any)[key] === undefined && delete (allowedUpdates as any)[key]
        );

        const { data, error } = await supabase
            .from("profiles")
            .update(allowedUpdates)
            .eq("id", userId)
            .select()
            .single();

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
