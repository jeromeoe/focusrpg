// ===== Database Types =====

export interface Profile {
    id: string;
    email: string;
    display_name: string;
    coins: number;
    xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
    total_focus_minutes: number;
    class_name?: string;
    created_at: string;
}

export interface FocusSession {
    id: string;
    user_id: string;
    quest_id: string | null;
    duration_minutes: number;
    status: "active" | "completed" | "cancelled" | "backlog";
    xp_earned: number;
    coins_earned: number;
    started_at: string;
    completed_at: string | null;
    label: string | null;
    category: string | null;
}

export interface Quest {
    id: string;
    user_id: string;
    google_event_id: string | null;
    title: string;
    description: string | null;
    status: "pending" | "active" | "completed" | "failed";
    priority: "boss" | "side" | "daily" | "weekly";
    category: string | null;
    duration_minutes: number;
    reward_coins: number;
    reward_xp: number;
    due_at: string | null;
    completed_at: string | null;
    created_at: string;
}

export interface HabitEntry {
    id: string;
    user_id: string;
    habit_id: string;
    date: string;
    completed: boolean;
}

export interface Streak {
    habit_id: string;
    name: string;
    icon: string;
    current: number;
    best: number;
    completedToday: boolean;
}

export interface RewardItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: string;
    type: "reward" | "utility" | "goal";
    purchased?: boolean;
}

// ===== Timer Types =====

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface TimerState {
    status: TimerStatus;
    totalSeconds: number;
    remainingSeconds: number;
    sessionLabel: string;
    sessionCategory: string;
    isBacklog: boolean;
}

export interface UserPokemon {
    id: string;
    species_id: number;
    nickname: string;
    level: number;
    xp: number;
    happiness: number;
}
