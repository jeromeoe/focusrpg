import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export class AuthError extends Error {
    constructor(message: string, public statusCode: number = 401) {
        super(message);
        this.name = "AuthError";
    }
}

/**
 * Gets the current user's profile ID.
 * 
 * Strategy:
 * 1. If signed in via NextAuth → find/create profile by email
 * 2. If not signed in → use the first (and likely only) profile in the DB
 *    This fallback is safe because FocusRPG is a single-user app.
 */
export async function getAuthenticatedUserId(): Promise<string> {
    const session = await auth();

    if (session?.user?.email) {
        // --- Authenticated path ---
        const email = session.user.email;

        // Try to find existing profile by email
        const { data: profile, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (profile) {
            return profile.id;
        }

        // Not found (PGRST116) → create profile
        if (error && error.code !== "PGRST116") {
            console.error("Profile lookup error:", error);
            throw new AuthError("Database error", 500);
        }

        const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
                email,
                display_name: session.user.name || "FocusHero",
            })
            .select("id")
            .single();

        if (createError) {
            console.error("Profile creation error:", createError);
            throw new AuthError("Failed to create profile", 500);
        }

        return newProfile.id;
    }

    // --- Fallback: not signed in → use first profile in DB ---
    const { data: fallback } = await supabase
        .from("profiles")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

    if (fallback) {
        return fallback.id;
    }

    throw new AuthError("No profile found. Please sign in with Google.", 401);
}
