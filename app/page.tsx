"use client";

import { useEffect, useState, useRef } from "react";
import { useTimerStore, usePlayerStore } from "@/lib/stores/game-store";
import { GAME, DAILY_HABITS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Check,
  Coins,
  Zap,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const PRESETS = GAME.TIMER_PRESETS;

interface HabitStatus {
  habit_id: string;
  completed: boolean;
}

export default function FocusPage() {
  const { data: session } = useSession();
  const {
    status,
    totalSeconds,
    remainingSeconds,
    sessionLabel,
    startTimer,
    tick,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    resetTimer,
  } = useTimerStore();

  const { profile, setProfile, addCoins, addXp } = usePlayerStore();

  const [selectedMinutes, setSelectedMinutes] = useState<number>(GAME.DEFAULT_TIMER);
  const [label, setLabel] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Habit state
  const [habitStatuses, setHabitStatuses] = useState<HabitStatus[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);

  // Fetch Stats & Habits on load
  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Profile (XP, Coins, etc.)
      try {
        const pRes = await fetch("/api/profile");
        if (pRes.ok) {
          const pData = await pRes.json();
          setProfile(pData);
        }
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }

      // 2. Fetch Habits
      try {
        const res = await fetch("/api/habits");
        if (!res.ok) throw new Error("Failed to fetch habits");
        const data = await res.json();
        const statuses: HabitStatus[] = DAILY_HABITS.map((h) => {
          const entry = data.find((d: any) => d.habit_id === h.id);
          return { habit_id: h.id, completed: entry?.completed ?? false };
        });
        setHabitStatuses(statuses);
      } catch {
        setHabitStatuses(
          DAILY_HABITS.map((h) => ({ habit_id: h.id, completed: false }))
        );
      } finally {
        setHabitsLoading(false);
      }
    }
    fetchData();
  }, [setProfile]); // Re-run if setProfile changes (stable)

  // Timer tick
  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => tick(), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, tick]);

  // Auto-reward and PERSIST on completion
  useEffect(() => {
    if (status === "completed" && totalSeconds > 0) {
      const minutes = Math.round(totalSeconds / 60);
      const earnedXp = minutes * GAME.XP_PER_MINUTE + GAME.XP_BONUS_COMPLETION;
      const earnedCoins = GAME.COINS_PER_SESSION;

      // 1. Update local store for immediate UI feedback
      addXp(earnedXp);
      addCoins(earnedCoins);

      toast.success(`Session Complete!`, {
        description: `+${earnedXp} XP, +${earnedCoins} Coins earned`,
      });

      // 2. Persist to Supabase
      // We need current values from 'profile' state, but 'profile' in dependency array might be stale or cause loops.
      // Better to use functional update or re-fetch.
      // Since 'addXp' updates the store, let's assume store is now fresh-ish, OR just send increment to server?
      // Our API takes absolute values.
      // SAFE APPROACH: Fetch latest, then update.
      async function persistRewards() {
        try {
          // Get fresh profile first
          const getRes = await fetch("/api/profile");
          if (!getRes.ok) return;
          const currentProfile = await getRes.json();

          const newXp = currentProfile.xp + earnedXp;
          const newCoins = currentProfile.coins + earnedCoins;
          const newUrl = currentProfile.level; // Logic for level up is in store but simplified here
          // Re-calculate level just in case: floor(xp / 100) + 1
          const newLevel = Math.floor(newXp / 100) + 1;
          const newFocusTime = currentProfile.total_focus_minutes + minutes;

          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              xp: newXp,
              coins: newCoins,
              level: newLevel,
              total_focus_minutes: newFocusTime,
            }),
          });

          // Update local profile with confirmed server data
          setProfile({
            ...currentProfile,
            xp: newXp,
            coins: newCoins,
            level: newLevel,
            total_focus_minutes: newFocusTime
          });

        } catch (err) {
          console.error("Failed to persist rewards", err);
          toast.error("Could not save rewards to server");
        }
      }
      persistRewards();
    }
  }, [status, totalSeconds, addXp, addCoins, setProfile]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!session) {
      toast.error("Please sign in to track your focus!");
      // We could redirect to login or just allow it but warn.
      // For now, allow it but rewards won't save if not logged in.
    }
    startTimer(selectedMinutes, label || "Focus Session", selectedCategory);
  };

  const handleToggleHabit = async (habitId: string) => {
    const current = habitStatuses.find((h) => h.habit_id === habitId);
    if (!current || current.completed) return;

    setTogglingHabit(habitId);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habitId }),
      });

      if (res.status === 409) {
        setHabitStatuses((prev) =>
          prev.map((h) =>
            h.habit_id === habitId ? { ...h, completed: true } : h
          )
        );
        return;
      }

      if (!res.ok) throw new Error("Failed to update habit");

      setHabitStatuses((prev) =>
        prev.map((h) =>
          h.habit_id === habitId ? { ...h, completed: true } : h
        )
      );

      const habit = DAILY_HABITS.find((h) => h.id === habitId);
      if (habit) {
        // Update local UI
        addCoins(habit.reward);
        toast.success(`${habit.name} ✓`, {
          description: `+${habit.reward} Coin${habit.reward > 1 ? "s" : ""}`,
        });

        // PERSIST COINS
        // We fetch current, add reward, patch.
        const pRes = await fetch("/api/profile");
        if (pRes.ok) {
          const pData = await pRes.json();
          const newCoins = pData.coins + habit.reward;
          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coins: newCoins }),
          });
          // Update local store with confirmed
          setProfile({ ...pData, coins: newCoins });
        }
      }
    } catch {
      toast.error("Failed to save habit");
    } finally {
      setTogglingHabit(null);
    }
  };

  const progress =
    totalSeconds > 0
      ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
      : 0;

  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Timer Section */}
      <div className="flex flex-col items-center space-y-6">
        {/* Timer Ring */}
        <div
          className={`timer-ring ${status === "running" ? "timer-active-glow" : ""} rounded-full`}
        >
          <svg
            width="312"
            height="312"
            viewBox="0 0 312 312"
            className="transform -rotate-90"
          >
            <circle
              cx="156"
              cy="156"
              r="140"
              fill="none"
              stroke="var(--color-surface-300)"
              strokeWidth="6"
            />
            <circle
              cx="156"
              cy="156"
              r="140"
              fill="none"
              stroke={
                status === "completed"
                  ? "var(--color-accent-green)"
                  : "var(--color-warm-500)"
              }
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={
                status === "idle" ? circumference : strokeDashoffset
              }
              className="transition-all duration-1000 linear"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-mono font-bold tracking-tight text-foreground">
              {status === "idle"
                ? formatTime(selectedMinutes * 60)
                : formatTime(remainingSeconds)}
            </span>
            {status !== "idle" && sessionLabel && (
              <span className="text-sm text-muted-foreground mt-2">
                {sessionLabel}
              </span>
            )}
            {status === "completed" && (
              <div className="flex items-center gap-3 mt-3">
                <Badge className="bg-accent-green/15 text-accent-green border-accent-green/30">
                  <Zap className="w-3 h-3 mr-1" />+
                  {Math.round(totalSeconds / 60) * GAME.XP_PER_MINUTE +
                    GAME.XP_BONUS_COMPLETION}{" "}
                  XP
                </Badge>
                <Badge className="bg-warm-500/15 text-warm-400 border-warm-500/30">
                  <Coins className="w-3 h-3 mr-1" />+{GAME.COINS_PER_SESSION}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Preset Buttons */}
        {status === "idle" && (
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((mins) => (
              <button
                key={mins}
                onClick={() => setSelectedMinutes(mins)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedMinutes === mins
                    ? "bg-warm-500 text-surface-0"
                    : "bg-surface-200 text-muted-foreground hover:bg-surface-300 hover:text-foreground"
                  }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {/* Label + Category */}
        {status === "idle" && (
          <div className="w-full max-w-sm space-y-3">
            <input
              type="text"
              placeholder="What are you working on?"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40 transition"
            />
            <div className="relative">
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="w-full flex items-center justify-between bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition"
              >
                {selectedCategory || "Select category..."}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCategories && (
                <div className="absolute top-full mt-1 w-full bg-surface-100 border border-surface-300 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                  {GAME.SESSION_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategories(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-surface-200 text-foreground transition"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          {status === "idle" && (
            <Button
              onClick={handleStart}
              size="lg"
              className="bg-warm-500 hover:bg-warm-600 text-surface-0 font-semibold px-8 rounded-xl"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Focus
            </Button>
          )}
          {status === "running" && (
            <>
              <Button
                onClick={pauseTimer}
                variant="outline"
                size="lg"
                className="border-surface-400 hover:bg-surface-200 rounded-xl"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              <Button
                onClick={cancelTimer}
                variant="ghost"
                size="lg"
                className="text-muted-foreground hover:text-foreground rounded-xl"
              >
                <Square className="w-5 h-5 mr-2" />
                Cancel
              </Button>
            </>
          )}
          {status === "paused" && (
            <>
              <Button
                onClick={resumeTimer}
                size="lg"
                className="bg-warm-500 hover:bg-warm-600 text-surface-0 font-semibold rounded-xl"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
              <Button
                onClick={cancelTimer}
                variant="ghost"
                size="lg"
                className="text-muted-foreground hover:text-foreground rounded-xl"
              >
                <Square className="w-5 h-5 mr-2" />
                Cancel
              </Button>
            </>
          )}
          {status === "completed" && (
            <Button
              onClick={resetTimer}
              size="lg"
              className="bg-surface-200 hover:bg-surface-300 text-foreground font-semibold rounded-xl"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              New Session
            </Button>
          )}
        </div>
      </div>

      {/* Daily Habits Quick-Check */}
      <Card className="bg-surface-100 border-surface-300">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Daily Habits
          </h3>
          {habitsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {DAILY_HABITS.map((habit) => {
                const habitStatus = habitStatuses.find(
                  (h) => h.habit_id === habit.id
                );
                const completed = habitStatus?.completed ?? false;
                const isToggling = togglingHabit === habit.id;

                return (
                  <button
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id)}
                    disabled={completed || isToggling}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition group ${completed
                        ? "opacity-60 cursor-default"
                        : "hover:bg-surface-200 cursor-pointer"
                      }`}
                  >
                    <div
                      className={`habit-check ${completed ? "completed" : ""}`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                      ) : (
                        completed && (
                          <Check className="w-3.5 h-3.5 text-surface-0" />
                        )
                      )}
                    </div>
                    <span className="text-lg">{habit.icon}</span>
                    <div className="flex-1 text-left">
                      <span
                        className={`text-sm font-medium ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {habit.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {habit.description}
                      </span>
                    </div>
                    {!completed && (
                      <span className="text-xs text-warm-400 stat-number">
                        +{habit.reward} 🪙
                      </span>
                    )}
                    {completed && (
                      <span className="text-xs text-accent-green">Done ✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
