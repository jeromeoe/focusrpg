import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUserId } from "@/lib/server/auth-utils";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabase
            .from("user_pokemon")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
            throw error;
        }

        return NextResponse.json(data || null);

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
