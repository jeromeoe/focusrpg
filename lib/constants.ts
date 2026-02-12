// ===== Game Balance Constants =====

export const GAME = {
    // XP & Leveling
    XP_PER_MINUTE: 1,
    XP_BONUS_COMPLETION: 25,
    XP_TO_LEVEL: 100,

    // Coins
    COINS_PER_SESSION: 2,

    // Timer presets (minutes)
    TIMER_PRESETS: [15, 25, 30, 45, 60, 90] as const,
    DEFAULT_TIMER: 45,

    // Session Categories
    SESSION_CATEGORIES: [
        "Deep Work",
        "Study",
        "Exercise",
        "Reading",
        "Coding",
        "Writing",
        "Creative",
        "Meditation",
        "Piano",
        "Japanese",
        "Leetcode",
        "Other",
    ] as const,
} as const;

// ===== Habits =====

export const DAILY_HABITS = [
    { id: "steps", name: "Walk the Path", description: "10,000 Steps", icon: "🚶", reward: 1 },
    { id: "fiber", name: "Eat Clean", description: ">15g Fiber", icon: "🥦", reward: 1 },
    { id: "protein", name: "Eat Strong", description: ">120g Protein", icon: "💪", reward: 1 },
    { id: "exercise", name: "Train Body", description: "Any Exercise", icon: "🏋️", reward: 1 },
    { id: "focus", name: "Deep Focus", description: "45m+ Work/Study", icon: "🎯", reward: 2 },
    { id: "enrichment", name: "Mind Expansion", description: "Leetcode/Piano/Japanese/Reading", icon: "🧠", reward: 1 },
] as const;

export const WEEKLY_HABITS = [
    { id: "heavy_volume", name: "Heavy Volume", description: "Exercise 5 Times", icon: "🔥", reward: 5, target: 5 },
    { id: "self_reflection", name: "Self Reflection", description: "Take Progress Picture", icon: "📸", reward: 2, target: 1 },
] as const;

// ===== Shop / Rewards =====

export const SHOP_ITEMS = [
    {
        id: "consumable_01",
        name: "Hot & Spicy Chips",
        description: "Buy/Eat Chips — you earned it!",
        type: "reward" as const,
        cost: 10,
        icon: "🌶️",
    },
    {
        id: "consumable_02",
        name: "Mala Dinner",
        description: "Treat yourself to a Mala feast.",
        type: "reward" as const,
        cost: 20,
        icon: "🍜",
    },
    {
        id: "consumable_03",
        name: "Wingstop",
        description: "Wings > everything.",
        type: "reward" as const,
        cost: 20,
        icon: "🍗",
    },
    {
        id: "item_freeze",
        name: "Streak Freeze",
        description: "Protects a streak for 24 hours.",
        type: "utility" as const,
        cost: 5,
        icon: "🛡️",
    },
    {
        id: "misc_keyboard",
        name: "Groupbuy Keyboard Fund",
        description: "Neo75 Kit / GMK 80082 — the ultimate goal.",
        type: "goal" as const,
        cost: 500,
        icon: "⌨️",
    },
] as const;
