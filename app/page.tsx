"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTimerStore, usePlayerStore } from "@/lib/stores/game-store";
import { GAME, DAILY_HABITS } from "@/lib/constants";
import { rollSessionRewards } from "@/lib/game-logic";
import { DailyRecapModal } from "@/components/daily-recap-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  Flame,
  Gift,
} from "lucide-react";

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
    fizzleTimer,
    resetTimer,
  } = useTimerStore();

  const { profile, setProfile, addCoins, removeCoins, addXp } = usePlayerStore();

  const [selectedMinutes, setSelectedMinutes] = useState<number>(GAME.DEFAULT_TIMER);
  const [label, setLabel] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Habit state
  const [habitStatuses, setHabitStatuses] = useState<HabitStatus[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);
  const rewardProcessed = useRef(false);

  // Recap state
  const [showRecap, setShowRecap] = useState(false);
  const [recapDate, setRecapDate] = useState<Date | null>(null);

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
  }, [setProfile]);

  // Check for Daily Recap (Missed Yesterday?)
  useEffect(() => {
    async function checkRecap() {
      try {
        const res = await fetch("/api/habits/streaks");
        if (!res.ok) return;
        const streaks: any[] = await res.json();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const todayStr = new Date().toISOString().split("T")[0];

        if (streaks.length === 0) return;

        const missedYesterday = streaks.some(s => {
          const lastDate = s.last_completed_at ? new Date(s.last_completed_at).toISOString().split("T")[0] : null;
          return lastDate !== yesterdayStr && lastDate !== todayStr;
        });

        if (missedYesterday) {
          setRecapDate(yesterday);
          setShowRecap(true);
        }
      } catch (e) {
        console.error("Recap check failed", e);
      }
    }
    checkRecap();
  }, []);

  // Timer tick
  useEffect(() => {
    if (status === "running") {
      rewardProcessed.current = false;
      intervalRef.current = setInterval(() => tick(), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, tick]);

  // Auto-reward and PERSIST on completion
  useEffect(() => {
    if (status === "completed" && totalSeconds > 0 && !rewardProcessed.current) {
      rewardProcessed.current = true;
      const minutes = Math.round(totalSeconds / 60);

      // --- RNG REWARDS (Loot & Crit) ---
      const { isCrit, lootItem } = rollSessionRewards(minutes);

      let earnedXp = minutes * GAME.XP_PER_MINUTE + GAME.XP_BONUS_COMPLETION;
      let earnedCoins = GAME.COINS_PER_SESSION;

      // Apply Crit
      if (isCrit) {
        earnedXp *= 2;
        earnedCoins *= 2;
      }

      // Handle Loot (Auto-sell for now)
      let lootMessage = "";
      if (lootItem) {
        if (lootItem.id === "potion_xp_small") {
          earnedXp += lootItem.value;
        } else {
          earnedCoins += lootItem.value;
        }
        lootMessage = `${lootItem.icon} Found ${lootItem.name}!`;
      }

      addXp(earnedXp);
      addCoins(earnedCoins);

      if (isCrit) {
        toast("CRITICAL FOCUS! 🎲", {
          description: `Double Rewards! +${earnedXp} XP, +${earnedCoins} Coins`,
          style: { border: "2px solid var(--color-accent-gold)" }
        });
      } else {
        toast.success(`Session Complete!`, {
          description: `+${earnedXp} XP, +${earnedCoins} Coins`,
        });
      }

      if (lootItem) {
        toast(lootMessage, {
          description: "Item auto-redeemed for bonus stats.",
          icon: <Gift className="w-4 h-4" />
        });
      }

      async function persistRewards() {
        try {
          const getRes = await fetch("/api/profile");
          if (!getRes.ok) return;
          const currentProfile = await getRes.json();

          const newXp = currentProfile.xp + earnedXp;
          const newCoins = currentProfile.coins + earnedCoins;
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

  const handleStart = () => {
    if (selectedMinutes > 0) {
      startTimer(selectedMinutes, label, selectedCategory);
      setLabel("");
    }
  };

  const handleCancel = async () => {
    const elapsedSeconds = totalSeconds - remainingSeconds;
    if (elapsedSeconds > 120) {
      const penalty = fizzleTimer();
      removeCoins(penalty);

      toast("Session Fizzled! 🔥", {
        description: `You broke focus! Lost ${penalty} Coins.`,
        style: { borderColor: "var(--color-accent-red)" }
      });

      try {
        const getRes = await fetch("/api/profile");
        if (getRes.ok) {
          const currentProfile = await getRes.json();
          const newCoins = Math.max(0, currentProfile.coins - penalty);

          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coins: newCoins }),
          });
          setProfile({ ...currentProfile, coins: newCoins });
        }
      } catch (e) {
        console.error("Failed to save penalty", e);
      }
    } else {
      cancelTimer();
      toast.info("Session cancelled (No penalty)");
    }
  };

  const toggleHabit = async (habitId: string) => {
    setTogglingHabit(habitId);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habitId }),
      });

      if (res.ok) {
        const data = await res.json();
        setHabitStatuses((prev) =>
          prev.map((h) =>
            h.habit_id === habitId ? { ...h, completed: true } : h
          )
        );
        toast.success("Habit Completed +10 XP");
        addXp(10);
      } else if (res.status === 409) {
        toast.info("Already completed today!");
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast.error("Failed to update habit");
    } finally {
      setTogglingHabit(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-gold to-orange-500 bg-clip-text text-transparent">
            FocusRPG
          </h1>
          <p className="text-muted-foreground">Level {profile?.level ?? 1} • {profile?.class_name ?? "Novice"}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-200 px-3 py-1 rounded-full flex items-center gap-2">
            <Coins className="w-4 h-4 text-accent-gold" />
            <span className="font-mono font-bold">{profile?.coins ?? 0}</span>
          </div>
          <div className="bg-surface-200 px-3 py-1 rounded-full flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-blue" />
            <span className="font-mono font-bold">{profile?.xp ?? 0} XP</span>
          </div>
        </div>
      </div>

      {/* Timer Card */}
      <Card className="border-surface-300 bg-surface-100/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
        {status === "running" && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-surface-300">
              <div
                className="h-full bg-accent-blue transition-all duration-1000"
                style={{ width: `${(remainingSeconds / totalSeconds) * 100}%` }}
              />
            </div>
          </div>
        )}

        <CardContent className="p-8 flex flex-col items-center gap-6">
          <div className="text-center space-y-2">
            <div className="text-6xl font-black tabular-nums tracking-tighter text-foreground">
              {Math.floor(remainingSeconds / 60)
                .toString()
                .padStart(2, "0")}
              :
              {(remainingSeconds % 60).toString().padStart(2, "0")}
            </div>
            <div className="text-xl text-muted-foreground font-medium">
              {status === "running" ? sessionLabel || "Focusing..." : "Ready to Focus?"}
            </div>
          </div>

          <div className="flex gap-3 w-full justify-center">
            {status === "idle" || status === "completed" ? (
              <Button size="lg" className="w-40 gap-2 bg-accent-gold hover:bg-yellow-500 text-black font-bold" onClick={handleStart}>
                <Play className="w-5 h-5 fill-current" />
                Start
              </Button>
            ) : status === "running" ? (
              <>
                <Button size="lg" variant="outline" className="w-32 gap-2 border-surface-300" onClick={pauseTimer}>
                  <Pause className="w-5 h-5" />
                  Pause
                </Button>
                <Button size="lg" variant="destructive" className="w-32 gap-2" onClick={handleCancel}>
                  <Square className="w-5 h-5 fill-current" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="lg" className="w-40 gap-2 bg-accent-blue" onClick={resumeTimer}>
                <Play className="w-5 h-5" />
                Resume
              </Button>
            )}
          </div>

          {/* Quick Config (Only when Idle) */}
          {status === "idle" && (
            <div className="w-full space-y-4 pt-4 border-t border-surface-200">
              <div className="flex flex-wrap justify-center gap-2">
                {PRESETS.map(m => (
                  <Badge
                    key={m}
                    variant={selectedMinutes === m ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-1.5 text-sm ${selectedMinutes === m ? 'bg-surface-300 hover:bg-surface-400' : 'hover:bg-surface-200'}`}
                    onClick={() => setSelectedMinutes(m)}
                  >
                    {m}m
                  </Badge>
                ))}
              </div>
              <input
                type="text"
                placeholder="Identify your quest... (optional)"
                className="w-full bg-surface-200 border-none rounded-lg px-4 py-2 text-center text-sm focus:ring-2 focus:ring-accent-blue outline-none"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Habits */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-accent-green" />
          Daily Rituals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habitsLoading ? (
            <div className="col-span-2 py-8 flex justify-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            DAILY_HABITS.map(habit => {
              const status = habitStatuses.find(h => h.habit_id === habit.id);
              const isCompleted = status?.completed ?? false;
              const isToggling = togglingHabit === habit.id;

              return (
                <button
                  key={habit.id}
                  disabled={isCompleted || isToggling}
                  onClick={() => toggleHabit(habit.id)}
                  className={`
                                group flex items-start gap-4 p-4 rounded-xl border text-left transition-all
                                ${isCompleted
                      ? "bg-surface-200/50 border-surface-200 opacity-70"
                      : "bg-surface-100 border-surface-300 hover:border-accent-green/50 hover:bg-surface-200"
                    }
                            `}
                >
                  <div className={`
                                mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center transition-colors
                                ${isCompleted
                      ? "bg-accent-green border-accent-green"
                      : "border-surface-400 group-hover:border-accent-green"
                    }
                            `}>
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <span className="text-xl">{habit.icon}</span>
                      {habit.name}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{habit.description}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Daily Recap Modal */}
      {recapDate && (
        <DailyRecapModal
          isOpen={showRecap}
          onClose={() => setShowRecap(false)}
          checkDate={recapDate}
        />
      )}
    </div>
  );
}
