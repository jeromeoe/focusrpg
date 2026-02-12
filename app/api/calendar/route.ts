import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Google Calendar API endpoint
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

// Holiday keywords to identify holidays
const HOLIDAY_KEYWORDS = [
    "holiday",
    "public holiday",
    "national day",
    "christmas",
    "new year",
    "deepavali",
    "hari raya",
    "vesak",
    "good friday",
    "labour day",
    "chinese new year",
];

interface GoogleEvent {
    id: string;
    summary?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    location?: string;
    description?: string;
}

export async function GET() {
    // Get the authenticated session (contains Google access token)
    const session = await auth();

    if (!session) {
        return NextResponse.json(
            {
                error: "not_authenticated",
                message:
                    "You need to sign in with Google to view your calendar. Click the Sign In button in the navigation.",
            },
            { status: 401 }
        );
    }

    const accessToken = (session as any).accessToken;

    if (!accessToken) {
        return NextResponse.json(
            {
                error: "no_token",
                message:
                    "Google Calendar access token not available. Try signing out and back in.",
            },
            { status: 401 }
        );
    }

    try {
        const now = new Date();
        const minDate = new Date();
        minDate.setMonth(minDate.getMonth() - 1); // 1 month ago

        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);

        // Fetch primary calendar events
        const url = new URL(`${CALENDAR_API_BASE}/calendars/primary/events`);
        url.searchParams.set("timeMin", minDate.toISOString());
        url.searchParams.set("timeMax", maxDate.toISOString());
        url.searchParams.set("singleEvents", "true");
        url.searchParams.set("orderBy", "startTime");
        url.searchParams.set("maxResults", "100");

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            const err = await res.json();
            return NextResponse.json(
                { error: err.error?.message || "Calendar API error" },
                { status: res.status }
            );
        }

        const data = await res.json();

        // Also try Singapore public holidays calendar
        let holidayEvents: CalendarEvent[] = [];
        try {
            const holidayUrl = new URL(
                `${CALENDAR_API_BASE}/calendars/en.singapore%23holiday%40group.v.calendar.google.com/events`
            );
            holidayUrl.searchParams.set("timeMin", minDate.toISOString());
            holidayUrl.searchParams.set("timeMax", maxDate.toISOString());
            holidayUrl.searchParams.set("singleEvents", "true");
            holidayUrl.searchParams.set("orderBy", "startTime");

            const holidayRes = await fetch(holidayUrl.toString(), {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (holidayRes.ok) {
                const holidayData = await holidayRes.json();
                holidayEvents = (holidayData.items || []).map((e: GoogleEvent) => ({
                    id: e.id,
                    summary: e.summary || "(No title)",
                    start: e.start?.date || e.start?.dateTime || "",
                    end: e.end?.date || e.end?.dateTime || "",
                    location: e.location,
                    description: e.description,
                    isHoliday: true,
                    isAllDay: !!e.start?.date,
                }));
            }
        } catch {
            // Holiday calendar fetch is optional
        }

        // Map primary events
        const events: CalendarEvent[] = (data.items || []).map(
            (event: GoogleEvent) => {
                const summary = (event.summary || "").toLowerCase();
                const isHoliday = HOLIDAY_KEYWORDS.some((kw) => summary.includes(kw));

                return {
                    id: event.id,
                    summary: event.summary || "(No title)",
                    start: event.start?.dateTime || event.start?.date || "",
                    end: event.end?.dateTime || event.end?.date || "",
                    location: event.location,
                    description: event.description,
                    isHoliday,
                    isAllDay: !!event.start?.date,
                };
            }
        );

        // Merge and deduplicate
        const allEvents = [...events, ...holidayEvents];
        const seen = new Set<string>();
        const unique = allEvents.filter((e) => {
            const key = `${e.summary}-${e.start}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return NextResponse.json(unique);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch calendar events" },
            { status: 500 }
        );
    }
}

interface CalendarEvent {
    id: string;
    summary: string;
    start: string;
    end: string;
    location?: string;
    description?: string;
    isHoliday: boolean;
    isAllDay: boolean;
}
