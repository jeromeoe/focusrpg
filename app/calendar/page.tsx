"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    LogIn,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- Data Fetching ---
    useEffect(() => {
        if (authStatus !== "authenticated") return;

        async function fetchEvents() {
            setLoading(true);
            try {
                // Fetch events from 1 month ago to 3 months ahead (API updated in prev step)
                const res = await fetch("/api/calendar");
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || data.error || "Failed to fetch");
                }
                const data = await res.json();
                setEvents(data);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load calendar";
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, [authStatus]);

    // --- Date Helpers ---
    const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    };

    const weekStart = getWeekStart(currentDate);
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [weekStart]);

    const nextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const prevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // --- Event Filtering ---
    const weekEvents = useMemo(() => {
        const startOfWeek = weekDays[0];
        const endOfWeek = new Date(weekDays[6]);
        endOfWeek.setHours(23, 59, 59, 999);
        startOfWeek.setHours(0, 0, 0, 0);

        return events.filter(e => {
            const eStart = new Date(e.start);
            const eEnd = new Date(e.end);
            return eEnd >= startOfWeek && eStart <= endOfWeek;
        });
    }, [events, weekDays]);

    const holidays = events.filter((e) => e.isHoliday);
    // Upcoming: All events starting from "now" onwards
    const upcoming = events.filter((e) => !e.isHoliday && new Date(e.start) >= new Date());

    // Grouping for List View
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
    const upcomingGroups = groupByDate(upcoming);

    // --- Formatting Helpers ---
    const formatTime = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        return `${s.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })} — ${e.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}`;
    };

    const formatDate = (dateStr: string, allDay: boolean) => {
        const d = new Date(dateStr);
        if (allDay) return d.toLocaleDateString("en-SG", { weekday: "short", month: "short", day: "numeric" });
        return d.toLocaleDateString("en-SG", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    // --- Auth Check ---
    if (authStatus === "unauthenticated") {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                <Card className="bg-surface-100 border-surface-300">
                    <CardContent className="p-8 text-center space-y-4">
                        <CalendarIcon className="w-12 h-12 text-warm-400 mx-auto" />
                        <p className="text-foreground font-medium text-lg">Connect your Google Calendar</p>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Sign in with your Google account to sync your calendar events, deadlines, and holidays.
                        </p>
                        <Button onClick={() => signIn("google")} className="bg-warm-500 hover:bg-warm-600 text-surface-0 font-semibold rounded-xl px-6">
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign in with Google
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (authStatus === "loading") {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {events.length} events synced · {session?.user?.email}
                    </p>
                </div>
                {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
            </div>

            {/* Compact Weekly View (Requested Feature) */}
            <div className="bg-surface-100 border border-surface-300 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-2 border-b border-surface-200 bg-surface-200/30">
                    <Button variant="ghost" size="icon" onClick={prevWeek} className="h-7 w-7"><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={nextWeek} className="h-7 w-7"><ChevronRight className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-7 relative">
                    {weekDays.map((day, i) => {
                        const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
                        const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);

                        const dayEvents = weekEvents.filter(e => {
                            const eStart = new Date(e.start);
                            const eEnd = new Date(e.end);
                            return eStart < dayEnd && eEnd > dayStart && !e.isAllDay;
                        });
                        const dayHolidays = weekEvents.filter(e => {
                            const eStart = new Date(e.start);
                            const eEnd = new Date(e.end);
                            return eStart < dayEnd && eEnd > dayStart && (e.isHoliday || e.isAllDay);
                        });

                        const isTodayDate = isToday(day);

                        return (
                            <div key={i} className={cn(
                                "flex flex-col min-h-[120px] border-r border-surface-200 last:border-r-0 p-1 md:p-2 gap-1",
                                isTodayDate ? "bg-accent-gold/5" : ""
                            )}>
                                <div className="text-center mb-1">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                                    <div className={cn(
                                        "text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center mx-auto mt-0.5",
                                        isTodayDate ? "bg-accent-gold text-surface-950" : "text-foreground"
                                    )}>
                                        {day.getDate()}
                                    </div>
                                </div>

                                {/* Events Stack */}
                                <div className="flex flex-col gap-1 overflow-y-auto max-h-[150px] custom-scrollbar">
                                    {/* Holidays/AllDay First */}
                                    {dayHolidays.map(ev => (
                                        <div key={ev.id} className="text-[10px] bg-accent-green/10 text-accent-green px-1.5 py-0.5 rounded border border-accent-green/20 truncate" title={ev.summary}>
                                            {ev.summary}
                                        </div>
                                    ))}
                                    {/* Timed Events */}
                                    {dayEvents.map(ev => (
                                        <div key={ev.id} className="text-[10px] bg-surface-300 text-foreground px-1.5 py-0.5 rounded border border-surface-400 truncate" title={`${ev.summary} (${new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}>
                                            {ev.summary}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detailed Lists (Restored) */}
            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="bg-surface-200 border border-surface-300 w-full justify-start overflow-x-auto">
                    <TabsTrigger value="upcoming">📅 Upcoming Lists</TabsTrigger>
                    <TabsTrigger value="holidays">🏖️ Holidays</TabsTrigger>
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
                                        <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-200 transition">
                                            <div className="w-1 h-full min-h-[2rem] rounded-full bg-warm-500 mt-1" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">{event.summary}</p>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    {!event.isAllDay && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(event.start, event.end)}
                                                        </span>
                                                    )}
                                                    {event.isAllDay && (
                                                        <Badge className="text-[10px] bg-accent-blue/15 text-accent-blue border-accent-blue/30">All Day</Badge>
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
                        <p className="text-center text-muted-foreground py-8 text-sm">No upcoming events</p>
                    )}
                </TabsContent>

                <TabsContent value="holidays" className="mt-4">
                    <Card className="bg-surface-100 border-surface-300">
                        <CardContent className="p-4 space-y-2">
                            {holidays.map((event) => (
                                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-200">
                                    <span className="text-lg">🏖️</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">{event.summary}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(event.start, event.isAllDay)}</p>
                                    </div>
                                    <Badge className="badge-daily text-[10px]">Holiday</Badge>
                                </div>
                            ))}
                            {holidays.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No holidays found</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
