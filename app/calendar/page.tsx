"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Loader2,
    LogIn,
} from "lucide-react";

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

export default function CalendarPage() {
    const { data: session, status: authStatus } = useSession();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authStatus !== "authenticated") return;

        async function fetchEvents() {
            setLoading(true);
            try {
                const res = await fetch("/api/calendar");
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || data.error || "Failed to fetch");
                }
                const data = await res.json();
                setEvents(data);
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : "Failed to load calendar";
                setError(message);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, [authStatus]);

    const holidays = events.filter((e) => e.isHoliday);
    const upcoming = events.filter((e) => !e.isHoliday);

    const formatTime = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        return `${s.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })} — ${e.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}`;
    };

    const formatDate = (dateStr: string, allDay: boolean) => {
        const d = new Date(dateStr);
        if (allDay)
            return d.toLocaleDateString("en-SG", {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        return d.toLocaleDateString("en-SG", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const groupByDate = (events: CalendarEvent[]) => {
        const groups: Record<string, CalendarEvent[]> = {};
        for (const event of events) {
            const dateKey = new Date(event.start).toLocaleDateString("en-SG", {
                weekday: "long",
                month: "long",
                day: "numeric",
            });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(event);
        }
        return groups;
    };

    // Not signed in — show sign-in prompt
    if (authStatus === "unauthenticated") {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                <Card className="bg-surface-100 border-surface-300">
                    <CardContent className="p-8 text-center space-y-4">
                        <CalendarIcon className="w-12 h-12 text-warm-400 mx-auto" />
                        <p className="text-foreground font-medium text-lg">
                            Connect your Google Calendar
                        </p>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Sign in with your Google account to sync your calendar events,
                            deadlines, and holidays.
                        </p>
                        <Button
                            onClick={() => signIn("google")}
                            className="bg-warm-500 hover:bg-warm-600 text-surface-0 font-semibold rounded-xl px-6"
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign in with Google
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Loading auth status
    if (authStatus === "loading" || loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                <Card className="bg-surface-100 border-surface-300">
                    <CardContent className="p-6 text-center space-y-3">
                        <p className="text-foreground font-medium">
                            Failed to load calendar
                        </p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="rounded-xl"
                        >
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const upcomingGroups = groupByDate(upcoming);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {events.length} events synced · Signed in as{" "}
                    {session?.user?.email}
                </p>
            </div>

            <Tabs defaultValue="upcoming">
                <TabsList className="bg-surface-200 border border-surface-300">
                    <TabsTrigger
                        value="upcoming"
                        className="data-[state=active]:bg-surface-100"
                    >
                        📅 Upcoming ({upcoming.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="holidays"
                        className="data-[state=active]:bg-surface-100"
                    >
                        🏖️ Holidays ({holidays.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4 mt-4">
                    {Object.entries(upcomingGroups).map(([date, groupEvents]) => (
                        <div key={date}>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                                {date}
                            </h3>
                            <Card className="bg-surface-100 border-surface-300">
                                <CardContent className="p-3 space-y-1">
                                    {groupEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-200 transition"
                                        >
                                            <div className="w-1 h-full min-h-[2rem] rounded-full bg-warm-500 mt-1" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">
                                                    {event.summary}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    {!event.isAllDay && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(event.start, event.end)}
                                                        </span>
                                                    )}
                                                    {event.isAllDay && (
                                                        <Badge className="text-[10px] bg-accent-blue/15 text-accent-blue border-accent-blue/30">
                                                            All Day
                                                        </Badge>
                                                    )}
                                                    {event.location && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="w-3 h-3" />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                    {upcoming.length === 0 && (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                            No upcoming events
                        </p>
                    )}
                </TabsContent>

                <TabsContent value="holidays" className="mt-4">
                    <Card className="bg-surface-100 border-surface-300">
                        <CardContent className="p-4 space-y-2">
                            {holidays.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-200"
                                >
                                    <span className="text-lg">🏖️</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">
                                            {event.summary}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(event.start, event.isAllDay)}
                                        </p>
                                    </div>
                                    <Badge className="badge-daily text-[10px]">Holiday</Badge>
                                </div>
                            ))}
                            {holidays.length === 0 && (
                                <p className="text-center text-muted-foreground py-4 text-sm">
                                    No holidays found
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
