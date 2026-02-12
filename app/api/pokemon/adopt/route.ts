import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUserId } from "@/lib/server/auth-utils";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { speciesId, nickname } = await request.json();

        // 1. Check if user already has a buddy
        const { data: existing } = await supabase
            .from("user_pokemon")
            .select("id")
            .eq("user_id", userId)
            .single();

        if (existing) {
            return NextResponse.json({ error: "You already have a buddy!" }, { status: 400 });
        }

        // 2. Create the buddy
        const { data, error } = await supabase
            .from("user_pokemon")
            .insert({
                user_id: userId,
                species_id: speciesId,
                nickname: nickname,
                level: 5,
                xp: 0,
                happiness: 100, // Starts happy
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
