"use client";

import { useState } from "react";
import { usePlayerStore } from "@/lib/stores/game-store";
import { SHOP_ITEMS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, Plus, ShoppingBag, Target, Shield } from "lucide-react";
import { toast } from "sonner";

export default function RewardsPage() {
    const { profile, addCoins } = usePlayerStore();
    const coins = profile?.coins ?? 0;

    const [customName, setCustomName] = useState("");
    const [customCost, setCustomCost] = useState(10);
    const [customDesc, setCustomDesc] = useState("");
    const [customItems, setCustomItems] = useState<{ id: string; name: string; description: string; cost: number; icon: string }[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    const allItems = [...SHOP_ITEMS, ...customItems.map(c => ({ ...c, type: "reward" as const }))];

    const handlePurchase = (item: { name: string; cost: number }) => {
        if (coins < item.cost) {
            toast.error("Not enough coins!", {
                description: `You need ${item.cost - coins} more coins.`,
            });
            return;
        }
        addCoins(-item.cost);
        toast.success(`Redeemed: ${item.name}!`, {
            description: `${item.cost} coins spent. Enjoy! 🎉`,
        });
    };

    const handleCreateReward = () => {
        if (!customName.trim()) return;
        const newReward = {
            id: `custom_${Date.now()}`,
            name: customName.trim(),
            description: customDesc.trim() || "Custom reward",
            cost: customCost,
            icon: "🎁",
        };
        setCustomItems([...customItems, newReward]);
        setCustomName("");
        setCustomCost(10);
        setCustomDesc("");
        setDialogOpen(false);
        toast.success("Reward created!", { description: newReward.name });
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case "reward": return <ShoppingBag className="w-4 h-4" />;
            case "utility": return <Shield className="w-4 h-4" />;
            case "goal": return <Target className="w-4 h-4" />;
            default: return <ShoppingBag className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "reward": return "Treat";
            case "utility": return "Utility";
            case "goal": return "Savings Goal";
            default: return type;
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Rewards</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Earn coins through focus & habits. Spend them on real rewards.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-surface-200 px-4 py-2 rounded-xl">
                    <Coins className="w-5 h-5 text-warm-400" />
                    <span className="text-lg font-bold stat-number text-warm-400">{coins}</span>
                </div>
            </div>

            {/* Rewards Grid */}
            <div className="space-y-3">
                {allItems.map((item) => (
                    <Card key={item.id} className="bg-surface-100 border-surface-300 hover:border-surface-400 transition">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-surface-200 flex items-center justify-center text-2xl">
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                                        <Badge className="text-[10px] px-1.5 py-0 bg-surface-200 text-muted-foreground border-surface-300">
                                            {getTypeLabel(item.type)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                                </div>
                                <Button
                                    onClick={() => handlePurchase(item)}
                                    disabled={coins < item.cost}
                                    className={`rounded-xl text-sm font-semibold min-w-[90px] ${coins >= item.cost
                                            ? "bg-warm-500 hover:bg-warm-600 text-surface-0"
                                            : "bg-surface-300 text-muted-foreground cursor-not-allowed"
                                        }`}
                                >
                                    <Coins className="w-3.5 h-3.5 mr-1" />
                                    {item.cost}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Custom Reward */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full border-dashed border-surface-400 hover:border-warm-500 hover:bg-surface-200 text-muted-foreground hover:text-foreground rounded-xl py-6"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Custom Reward
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface-100 border-surface-300">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">New Reward</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <input
                            type="text"
                            placeholder="Reward name (e.g., Watch a movie)"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="w-full bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                        />
                        <input
                            type="text"
                            placeholder="Description (optional)"
                            value={customDesc}
                            onChange={(e) => setCustomDesc(e.target.value)}
                            className="w-full bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                        />
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-muted-foreground">Cost:</label>
                            <input
                                type="number"
                                min={1}
                                value={customCost}
                                onChange={(e) => setCustomCost(Number(e.target.value))}
                                className="w-24 bg-surface-200 border border-surface-300 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                            />
                            <span className="text-sm text-muted-foreground">coins</span>
                        </div>
                        <Button
                            onClick={handleCreateReward}
                            className="w-full bg-warm-500 hover:bg-warm-600 text-surface-0 font-semibold rounded-xl"
                        >
                            Create Reward
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
