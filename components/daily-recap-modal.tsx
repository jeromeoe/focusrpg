"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Flame } from "lucide-react";
import { DAILY_HABITS } from "@/lib/constants";
import { toast } from "sonner";

interface DailyRecapModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkDate: Date; // The date we are checking (usually yesterday)
}

export function DailyRecapModal({ isOpen, onClose, checkDate }: DailyRecapModalProps) {
    const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const checkDateStr = checkDate.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
    const checkDateIso = checkDate.toISOString().split("T")[0];

    const toggleSelection = (id: string) => {
        setSelectedHabits(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (selectedHabits.length > 0) {
                const res = await fetch("/api/habits/recap", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        habits: selectedHabits,
                        date: checkDateIso
                    })
                });

                if (!res.ok) throw new Error("Failed to save recap");

                toast.success("Streaks Updated!", {
                    description: `Logged ${selectedHabits.length} habits for ${checkDateStr}.`
                });
            } else {
                toast.info("No habits logged for yesterday.");
            }
            onClose();
        } catch (e) {
            toast.error("Failed to save recap");
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-surface-100 border-surface-300">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Flame className="w-5 h-5 text-accent-gold" />
                        Daily Recap
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Did you complete any habits on <strong>{checkDateStr}</strong>?
                        <br />Mark them now to save your streaks!
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {DAILY_HABITS.map(habit => {
                        const isSelected = selectedHabits.includes(habit.id);
                        return (
                            <div
                                key={habit.id}
                                onClick={() => toggleSelection(habit.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                        ? "bg-warm-500/10 border-warm-500"
                                        : "bg-surface-200 border-surface-300 hover:border-warm-400"
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? "bg-warm-500 border-warm-500" : "border-muted-foreground"
                                    }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className="text-2xl">{habit.icon}</span>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">{habit.name}</p>
                                    <p className="text-xs text-muted-foreground">{habit.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Skip (Break Streaks)
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-warm-500 hover:bg-warm-600 text-white">
                        {isSubmitting ? "Saving..." : "Confirm & Save Streaks"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
