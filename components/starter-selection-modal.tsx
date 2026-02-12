"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface StarterSelectionModalProps {
    isOpen: boolean;
    onSelect: (speciesId: number, nickname: string) => Promise<void>;
}

const STARTERS = [
    { id: 1, name: "Bulbasaur", type: "Grass", desc: "A faithful friend for those who grow steadily." },
    { id: 4, name: "Charmander", type: "Fire", desc: "For those with a burning passion to focus." },
    { id: 7, name: "Squirtle", type: "Water", desc: "Calm and collected, perfect for deep work." },
];

export function StarterSelectionModal({ isOpen, onSelect }: StarterSelectionModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleConfirm = async () => {
        if (!selectedId) return;
        setLoading(true);
        // Default nickname is same as name for now
        const name = STARTERS.find(s => s.id === selectedId)?.name || "Buddy";
        await onSelect(selectedId, name);
        setLoading(false);
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-md bg-surface-100 border-surface-300">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">Choose Your Partner</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-4 py-4">
                    {STARTERS.map(starter => (
                        <div
                            key={starter.id}
                            className={`
                                cursor-pointer rounded-xl border-2 p-2 flex flex-col items-center gap-2 transition-all
                                ${selectedId === starter.id
                                    ? "border-accent-blue bg-accent-blue/10 scale-105"
                                    : "border-surface-200 hover:border-surface-400 hover:bg-surface-200"
                                }
                            `}
                            onClick={() => setSelectedId(starter.id)}
                        >
                            <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${starter.id}.gif`}
                                alt={starter.name}
                                className="w-16 h-16 object-contain pixelated"
                            />
                            <div className="text-center">
                                <div className="font-bold text-sm">{starter.name}</div>
                                <div className="text-[10px] text-muted-foreground">{starter.type}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedId && (
                    <div className="text-center text-sm text-muted-foreground px-4 bg-surface-200/50 py-2 rounded-lg">
                        {STARTERS.find(s => s.id === selectedId)?.desc}
                    </div>
                )}

                <DialogFooter className="sm:justify-center">
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedId || loading}
                        className="w-full sm:w-auto bg-accent-blue hover:bg-blue-600 font-bold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "I Choose You!"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
