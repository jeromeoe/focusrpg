import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fixed user ID for single-user setup (matches seed.sql)
// Will be replaced with auth.uid() once NextAuth is wired
// Fixed user ID for single-user setup (matches seed.sql)
// DEPRECATED: API routes now use auth() from lib/server/auth-utils.ts
// Keeping this only for seed.sql reference if needed
export const DEPRECATED_USER_ID = "00000000-0000-0000-0000-000000000001";
