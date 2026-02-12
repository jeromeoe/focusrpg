import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId, AuthError } from "@/lib/server/auth-utils";
import { awardRewards } from "@/lib/server/game-service";

// POST /api/rewards — Award XP and Coins manually (e.g. from Timer)
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        const body = await request.json();
        const { xp, coins, source } = body;

        if (typeof xp !== "number" || typeof coins !== "number") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const result = await awardRewards(userId, xp, coins);

        if (!result) {
            return NextResponse.json({ error: "Failed to award rewards" }, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
