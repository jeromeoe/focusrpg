import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUserId, AuthError } from "@/lib/server/auth-utils";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();

        const { data, error } = await supabase
            .from("habit_streaks")
            .select("*")
            .eq("user_id", userId);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: any) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
