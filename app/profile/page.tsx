"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/stores/game-store";
import { DAILY_HABITS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Flame,
    Zap,
    Coins,
    Clock,
    TrendingUp,
    Loader2,
} from "lucide-react";

interface HabitStreak {
    habit_id: string;
    name: string;
    icon: string;
    completedToday: boolean;
}

const ACHIEVEMENTS = [
    { id: "first_session", name: "First Focus", description: "Complete your first session", icon: "⚡", unlocked: true },
    { id: "streak_3", name: "On Fire", description: "3-day streak", icon: "🔥", unlocked: true },
    { id: "streak_7", name: "Unstoppable", description: "7-day streak", icon: "🏆", unlocked: false },
    { id: "streak_30", name: "Iron Will", description: "30-day streak", icon: "💎", unlocked: false },
    { id: "hours_10", name: "Dedicated", description: "10 hours focused", icon: "🎯", unlocked: false },
    { id: "hours_50", name: "Powerhouse", description: "50 hours focused", icon: "⭐", unlocked: false },
    { id: "perfect_day", name: "Perfect Day", description: "Complete all daily habits", icon: "✨", unlocked: false },
    { id: "level_5", name: "Seasoned", description: "Reach Level 5", icon: "🏅", unlocked: false },
];

export default function ProfilePage() {
    const { profile, setProfile } = usePlayerStore();
    const [habitStreaks, setHabitStreaks] = useState<HabitStreak[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch profile from Supabase
    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch {
                // silently fail, use existing profile
            }
        }

        async function fetchHabits() {
            try {
                const res = await fetch("/api/habits");
                if (res.ok) {
                    const data = await res.json();
                    const streaks: HabitStreak[] = DAILY_HABITS.map((h) => {
                        const entry = data.find((d: any) => d.habit_id === h.id);
                        return {
                            habit_id: h.id,
                            name: h.name,
                            icon: h.icon,
                            completedToday: entry?.completed ?? false,
                        };
                    });
                    setHabitStreaks(streaks);
                }
            } catch {
                // Use empty streaks on error
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
        fetchHabits();
    }, [setProfile]);

    if (loading || !profile) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const p = profile;
    const xpInLevel = p.xp % 100;
    const xpToNext = 100;
    const hours = Math.floor(p.total_focus_minutes / 60);
    const mins = p.total_focus_minutes % 60;
    const completedToday = habitStreaks.filter((h) => h.completedToday).length;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-warm-500 flex items-center justify-center text-3xl font-bold text-surface-0">
                    {p.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">{p.display_name}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <Badge className="bg-accent-blue/15 text-accent-blue border-accent-blue/30">
                            <Zap className="w-3 h-3 mr-1" />
                            Level {p.level}
                        </Badge>
                        <Badge className="bg-warm-500/15 text-warm-400 border-warm-500/30">
                            <Coins className="w-3 h-3 mr-1" />
                            {p.coins}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* XP Progress */}
            <Card className="bg-surface-100 border-surface-300">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Level {p.level} → {p.level + 1}</span>
                        <span className="stat-number text-accent-blue">{xpInLevel}/{xpToNext} XP</span>
                    </div>
                    <div className="progress-bar progress-xp">
                        <div className="progress-bar-fill" style={{ width: `${(xpInLevel / xpToNext) * 100}%` }} />
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-surface-100 border-surface-300">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-streak/10 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-streak" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold stat-number text-foreground">{p.current_streak}</p>
                            <p className="text-xs text-muted-foreground">Day Streak</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-100 border-surface-300">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-accent-blue" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold stat-number text-foreground">{p.longest_streak}</p>
                            <p className="text-xs text-muted-foreground">Best Streak</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-100 border-surface-300">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warm-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-warm-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold stat-number text-foreground">{hours}h {mins}m</p>
                            <p className="text-xs text-muted-foreground">Total Focus</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-100 border-surface-300">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-accent-green" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold stat-number text-foreground">{p.xp}</p>
                            <p className="text-xs text-muted-foreground">Total XP</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Habits */}
            <Card className="bg-surface-100 border-surface-300">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Today's Habits
                        </h3>
                        <span className="text-xs text-accent-green stat-number">
                            {completedToday}/{habitStreaks.length}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {habitStreaks.map((streak) => (
                            <div key={streak.habit_id} className="flex items-center justify-between p-3 rounded-lg bg-surface-200">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{streak.icon}</span>
                                    <span className="text-sm font-medium text-foreground">{streak.name}</span>
                                </div>
                                <div className={`flex items-center gap-1 ${streak.completedToday ? "text-accent-green" : "text-muted-foreground"}`}>
                                    <span className="text-sm">{streak.completedToday ? "✓" : "—"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-surface-100 border-surface-300">
                <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Achievements
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                        {ACHIEVEMENTS.map((ach) => (
                            <div
                                key={ach.id}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition ${ach.unlocked ? "bg-surface-200" : "bg-surface-200/50 opacity-40"
                                    }`}
                                title={ach.description}
                            >
                                <span className="text-2xl">{ach.icon}</span>
                                <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight">
                                    {ach.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
