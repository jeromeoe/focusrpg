"use client";

import { useState } from "react";
import { usePlayerStore } from "@/lib/stores/game-store";
import { GAME } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Zap, Coins, Calendar } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = GAME.SESSION_CATEGORIES;

interface BacklogEntry {
    id: string;
    label: string;
    category: string;
    minutes: number;
    date: string;
    xpEarned: number;
    coinsEarned: number;
}

export default function BacklogPage() {
    const { addCoins, addXp } = usePlayerStore();

    const [entries, setEntries] = useState<BacklogEntry[]>([]);
    const [label, setLabel] = useState("");
    const [category, setCategory] = useState("");
    const [minutes, setMinutes] = useState(45);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    const xpPreview = minutes * GAME.XP_PER_MINUTE;
    const coinsPreview = GAME.COINS_PER_SESSION;

    const handleSubmit = () => {
        if (!label.trim()) {
            toast.error("Add a label for your session");
            return;
        }

        const entry: BacklogEntry = {
            id: Date.now().toString(),
            label: label.trim(),
            category: category || "Other",
            minutes,
            date,
            xpEarned: xpPreview,
            coinsEarned: coinsPreview,
        };

        setEntries([entry, ...entries]);
        addXp(xpPreview);
        addCoins(coinsPreview);

        toast.success("Session logged!", {
            description: `+${xpPreview} XP, +${coinsPreview} Coins`,
        });

        setLabel("");
        setCategory("");
        setMinutes(45);
    };

    const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
    const totalXp = entries.reduce((sum, e) => sum + e.xpEarned, 0);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Session Backlog</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Log past focus sessions and workouts for XP credit.
                </p>
            </div>

            {/* Log Form */}
            <Card className="bg-surface-100 border-surface-300">
                <CardContent className="p-5 space-y-4">
                    <input
                        type="text"
                        placeholder="What did you work on?"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40 transition"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="bg-surface-200 border border-surface-300 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                        >
                            <option value="">Category...</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="number"
                                min={5}
                                max={300}
                                value={minutes}
                                onChange={(e) => setMinutes(Number(e.target.value))}
                                className="flex-1 bg-surface-200 border border-surface-300 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                            />
                            <span className="text-xs text-muted-foreground">min</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="flex-1 bg-surface-200 border border-surface-300 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                        />
                    </div>

                    {/* Reward Preview */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-200">
                        <span className="text-xs text-muted-foreground">Rewards:</span>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-accent-blue/15 text-accent-blue border-accent-blue/30">
                                <Zap className="w-3 h-3 mr-1" />
                                +{xpPreview} XP
                            </Badge>
                            <Badge className="bg-warm-500/15 text-warm-400 border-warm-500/30">
                                <Coins className="w-3 h-3 mr-1" />
                                +{coinsPreview}
                            </Badge>
                        </div>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        className="w-full bg-warm-500 hover:bg-warm-600 text-surface-0 font-semibold rounded-xl"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Log Session
                    </Button>
                </CardContent>
            </Card>

            {/* Summary */}
            {entries.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-surface-100 border-surface-300">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold stat-number text-foreground">{entries.length}</p>
                            <p className="text-xs text-muted-foreground mt-1">Sessions</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-surface-100 border-surface-300">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold stat-number text-foreground">{totalMinutes}m</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Time</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-surface-100 border-surface-300">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold stat-number text-accent-blue">{totalXp}</p>
                            <p className="text-xs text-muted-foreground mt-1">XP Earned</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Session History */}
            {entries.length > 0 && (
                <Card className="bg-surface-100 border-surface-300">
                    <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Recent Entries
                        </h3>
                        <div className="space-y-2">
                            {entries.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-200">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{entry.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {entry.category} · {entry.minutes}m · {entry.date}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-accent-blue stat-number">+{entry.xpEarned} XP</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
