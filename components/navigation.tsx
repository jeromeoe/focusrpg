"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { usePlayerStore } from "@/lib/stores/game-store";
import { Timer, ListTodo, Clock, Gift, User, Flame, Coins, Zap, Calendar, LogOut } from "lucide-react";

const NAV_ITEMS = [
    { href: "/", label: "Focus", icon: Timer },
    { href: "/quests", label: "Tasks", icon: ListTodo },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/backlog", label: "Backlog", icon: Clock },
    { href: "/shop", label: "Rewards", icon: Gift },
    { href: "/profile", label: "Profile", icon: User },
];

export function Navigation() {
    const pathname = usePathname();
    const profile = usePlayerStore((s) => s.profile);

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-0/80 border-b border-surface-300">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-warm-500 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-surface-0" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-warm-400 transition-colors">
                        FocusRPG
                    </span>
                </Link>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-1">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-warm-500/10 text-warm-400"
                                    : "text-muted-foreground hover:text-foreground hover:bg-surface-200"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-warm-400">
                        <Coins className="w-4 h-4" />
                        <span className="stat-number">{profile?.coins ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent-blue">
                        <Zap className="w-4 h-4" />
                        <span className="stat-number">Lv.{profile?.level ?? 1}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-streak">
                        <Flame className="w-4 h-4" />
                        <span className="stat-number">{profile?.current_streak ?? 0}</span>
                    </div>

                    <div className="h-4 w-px bg-surface-300 mx-1" />

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="p-1.5 hover:bg-surface-200 rounded-lg text-muted-foreground hover:text-accent-red transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>


            {/* Mobile Nav */}
            <nav className="md:hidden flex items-center justify-around border-t border-surface-300 py-2">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${isActive ? "text-warm-400" : "text-muted-foreground"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </Link>
                    );
                })}
            </nav>
        </header >
    );
}
