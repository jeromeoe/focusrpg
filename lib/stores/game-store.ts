"use client";

import { create } from "zustand";
import type { Profile, TimerStatus, FocusSession, Quest, Streak } from "@/lib/types";

// ===== Timer Store =====

interface TimerStore {
    status: TimerStatus;
    totalSeconds: number;
    remainingSeconds: number;
    sessionLabel: string;
    sessionCategory: string;
    isBacklog: boolean;

    // Actions
    startTimer: (minutes: number, label?: string, category?: string) => void;
    tick: () => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
    completeTimer: () => void;
    cancelTimer: () => void;
    resetTimer: () => void;
    startBacklogEntry: (minutes: number, label: string, category?: string) => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
    status: "idle",
    totalSeconds: 0,
    remainingSeconds: 0,
    sessionLabel: "",
    sessionCategory: "",
    isBacklog: false,

    startTimer: (minutes: number, label?: string, category?: string) =>
        set({
            status: "running",
            totalSeconds: minutes * 60,
            remainingSeconds: minutes * 60,
            sessionLabel: label || "Focus Session",
            sessionCategory: category || "",
            isBacklog: false,
        }),

    tick: () => {
        const { remainingSeconds, status } = get();
        if (status !== "running") return;
        if (remainingSeconds <= 1) {
            set({ remainingSeconds: 0, status: "completed" });
        } else {
            set({ remainingSeconds: remainingSeconds - 1 });
        }
    },

    pauseTimer: () => set({ status: "paused" }),
    resumeTimer: () => set({ status: "running" }),

    completeTimer: () => set({ status: "completed", remainingSeconds: 0 }),

    cancelTimer: () =>
        set({
            status: "idle",
            totalSeconds: 0,
            remainingSeconds: 0,
            sessionLabel: "",
            sessionCategory: "",
            isBacklog: false,
        }),

    resetTimer: () =>
        set({
            status: "idle",
            totalSeconds: 0,
            remainingSeconds: 0,
            sessionLabel: "",
            sessionCategory: "",
            isBacklog: false,
        }),

    startBacklogEntry: (minutes: number, label: string, category?: string) =>
        set({
            status: "completed",
            totalSeconds: minutes * 60,
            remainingSeconds: 0,
            sessionLabel: label,
            sessionCategory: category || "",
            isBacklog: true,
        }),
}));

// ===== Player Store =====

interface PlayerStore {
    profile: Profile | null;
    quests: Quest[];
    sessions: FocusSession[];
    streaks: Streak[];
    isLoading: boolean;

    // Actions
    setProfile: (profile: Profile) => void;
    setQuests: (quests: Quest[]) => void;
    setSessions: (sessions: FocusSession[]) => void;
    setStreaks: (streaks: Streak[]) => void;
    addCoins: (amount: number) => void;
    addXp: (amount: number) => void;
    setLoading: (loading: boolean) => void;
    toggleHabit: (habitId: string) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
    profile: null,
    quests: [],
    sessions: [],
    streaks: [],
    isLoading: true,

    setProfile: (profile) => set({ profile }),
    setQuests: (quests) => set({ quests }),
    setSessions: (sessions) => set({ sessions }),
    setStreaks: (streaks) => set({ streaks }),

    addCoins: (amount) => {
        const { profile } = get();
        if (profile) {
            set({ profile: { ...profile, coins: profile.coins + amount } });
        }
    },

    addXp: (amount) => {
        const { profile } = get();
        if (profile) {
            const newXp = profile.xp + amount;
            const newLevel = Math.floor(newXp / 100) + 1;
            set({ profile: { ...profile, xp: newXp, level: newLevel } });
        }
    },

    setLoading: (loading) => set({ isLoading: loading }),

    toggleHabit: (habitId: string) => {
        const { streaks } = get();
        set({
            streaks: streaks.map((s) =>
                s.habit_id === habitId
                    ? {
                        ...s,
                        completedToday: !s.completedToday,
                        current: !s.completedToday ? s.current + 1 : Math.max(0, s.current - 1),
                        best: !s.completedToday ? Math.max(s.best, s.current + 1) : s.best
                    }
                    : s
            ),
        });
    },
}));
