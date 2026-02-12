"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CheckCircle2,
    Circle,
    AlertTriangle,
    Calendar,
    Plus,
    Loader2,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    category: string | null;
    reward_coins: number;
    reward_xp: number;
    due_at: string | null;
    completed_at: string | null;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form state
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newPriority, setNewPriority] = useState("side");
    const [newDueDate, setNewDueDate] = useState("");
    const [newCoins, setNewCoins] = useState(1);
    const [newXp, setNewXp] = useState(10);

    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch("/api/tasks");
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            setTasks(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const toggleTask = async (task: Task) => {
        const newStatus = task.status === "completed" ? "pending" : "completed";
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update");
            const updated = await res.json();
            setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
            if (newStatus === "completed") {
                toast.success(`${task.title} ✓`, { description: `+${task.reward_coins} 🪙 +${task.reward_xp} XP` });
            }
        } catch {
            toast.error("Failed to update task");
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await fetch(`/api/tasks/${id}`, { method: "DELETE" });
            setTasks((prev) => prev.filter((t) => t.id !== id));
            toast.success("Task deleted");
        } catch {
            toast.error("Failed to delete task");
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) {
            toast.error("Title is required");
            return;
        }
        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    category: newCategory || null,
                    priority: newPriority,
                    reward_coins: newCoins,
                    reward_xp: newXp,
                    due_at: newDueDate ? new Date(newDueDate).toISOString() : null,
                }),
            });
            if (!res.ok) throw new Error("Failed to create task");
            const task = await res.json();
            setTasks((prev) => [...prev, task]);
            setNewTitle("");
            setNewCategory("");
            setNewPriority("side");
            setNewDueDate("");
            setNewCoins(1);
            setNewXp(10);
            setDialogOpen(false);
            toast.success("Task created!", { description: task.title });
        } catch {
            toast.error("Failed to create task");
        }
    };

    const bossTasks = tasks.filter((t) => t.priority === "boss" && t.status !== "completed");
    const sideTasks = tasks.filter((t) => t.priority === "side" && t.status !== "completed");
    const completedTasks = tasks.filter((t) => t.status === "completed");
    const totalPending = bossTasks.length + sideTasks.length;

    const formatDue = (due: string | null) => {
        if (!due) return null;
        const d = new Date(due);
        return d.toLocaleDateString("en-SG", { month: "short", day: "numeric" });
    };

    const isPast = (due: string | null) => {
        if (!due) return false;
        return new Date(due) < new Date();
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {completedTasks.length} done · {totalPending} pending
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-warm-500 hover:bg-warm-600 text-surface-0 rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-surface-100 border-surface-300">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">New Task</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 pt-2">
                            <input
                                type="text"
                                placeholder="Task title"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Category (e.g. HW0218)"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                                />
                                <select
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value)}
                                    className="bg-surface-200 border border-surface-300 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                                >
                                    <option value="boss">🔴 Urgent</option>
                                    <option value="side">🟡 Upcoming</option>
                                </select>
                            </div>
                            <input
                                type="datetime-local"
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                                className="w-full bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">Coins:</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={newCoins}
                                        onChange={(e) => setNewCoins(Number(e.target.value))}
                                        className="flex-1 bg-surface-200 border border-surface-300 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">XP:</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={newXp}
                                        onChange={(e) => setNewXp(Number(e.target.value))}
                                        className="flex-1 bg-surface-200 border border-surface-300 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-warm-500/40"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleCreate}
                                className="w-full bg-warm-500 hover:bg-warm-600 text-surface-0 font-semibold rounded-xl"
                            >
                                Create Task
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="all">
                <TabsList className="bg-surface-200 border border-surface-300">
                    <TabsTrigger value="all" className="data-[state=active]:bg-surface-100">All</TabsTrigger>
                    <TabsTrigger value="boss" className="data-[state=active]:bg-surface-100">🔴 Urgent</TabsTrigger>
                    <TabsTrigger value="side" className="data-[state=active]:bg-surface-100">🟡 Upcoming</TabsTrigger>
                    <TabsTrigger value="done" className="data-[state=active]:bg-surface-100">✅ Done</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                    {bossTasks.length > 0 && (
                        <TaskGroup
                            label="🔴 Urgent — Deadlines"
                            tasks={bossTasks}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            formatDue={formatDue}
                            isPast={isPast}
                        />
                    )}
                    {sideTasks.length > 0 && (
                        <TaskGroup
                            label="🟡 Upcoming"
                            tasks={sideTasks}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            formatDue={formatDue}
                            isPast={isPast}
                        />
                    )}
                    {bossTasks.length === 0 && sideTasks.length === 0 && (
                        <p className="text-center text-muted-foreground py-8 text-sm">No pending tasks. Nice work! 🎉</p>
                    )}
                </TabsContent>

                <TabsContent value="boss" className="mt-4">
                    <TaskGroup label="" tasks={bossTasks} onToggle={toggleTask} onDelete={deleteTask} formatDue={formatDue} isPast={isPast} />
                </TabsContent>

                <TabsContent value="side" className="mt-4">
                    <TaskGroup label="" tasks={sideTasks} onToggle={toggleTask} onDelete={deleteTask} formatDue={formatDue} isPast={isPast} />
                </TabsContent>

                <TabsContent value="done" className="mt-4">
                    <TaskGroup label="" tasks={completedTasks} onToggle={toggleTask} onDelete={deleteTask} formatDue={formatDue} isPast={isPast} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function TaskGroup({
    label,
    tasks,
    onToggle,
    onDelete,
    formatDue,
    isPast,
}: {
    label: string;
    tasks: Task[];
    onToggle: (t: Task) => void;
    onDelete: (id: string) => void;
    formatDue: (d: string | null) => string | null;
    isPast: (d: string | null) => boolean;
}) {
    return (
        <Card className="bg-surface-100 border-surface-300">
            <CardContent className="p-4">
                {label && (
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                        {label}
                    </h3>
                )}
                <div className="space-y-1">
                    {tasks.map((task) => {
                        const completed = task.status === "completed";
                        const overdue = !completed && isPast(task.due_at);
                        return (
                            <div
                                key={task.id}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-200 transition group"
                            >
                                <button onClick={() => onToggle(task)} className="mt-0.5">
                                    {completed ? (
                                        <CheckCircle2 className="w-5 h-5 text-accent-green" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-surface-400 group-hover:text-warm-400 transition" />
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-sm font-medium ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                            {task.title}
                                        </span>
                                        {task.category && (
                                            <Badge className={`text-[10px] px-1.5 py-0 ${task.priority === "boss" ? "badge-boss" : "badge-side"}`}>
                                                {task.category}
                                            </Badge>
                                        )}
                                    </div>
                                    {task.due_at && (
                                        <div className={`flex items-center gap-1 mt-1 text-xs ${overdue ? "text-accent-red" : "text-muted-foreground"}`}>
                                            {overdue && <AlertTriangle className="w-3 h-3" />}
                                            <Calendar className="w-3 h-3" />
                                            {formatDue(task.due_at)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-warm-400">+{task.reward_coins} 🪙</span>
                                    <span className="text-xs text-accent-blue">+{task.reward_xp} XP</span>
                                    <button
                                        onClick={() => onDelete(task.id)}
                                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-surface-300 rounded-lg"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {tasks.length === 0 && (
                        <p className="text-center text-muted-foreground py-4 text-sm">No tasks here</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

