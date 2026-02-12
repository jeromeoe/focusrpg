-- =============================================
-- FocusRPG Updated Schema (No Monsters)
-- =============================================

-- Drop all tables to ensure clean slate
DROP TABLE IF EXISTS profiles, quests, focus_sessions, inventory, habit_entries, habit_streaks, user_pokemon CASCADE;

-- ===== PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'FocusHero',
  coins INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_focus_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  class_name TEXT -- Added for Pokemon update compatibility
);

-- ===== QUESTS (Tasks) =====
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  google_event_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  priority TEXT NOT NULL DEFAULT 'side' CHECK (priority IN ('boss', 'side', 'daily', 'weekly')),
  category TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  reward_coins INTEGER NOT NULL DEFAULT 1,
  reward_xp INTEGER NOT NULL DEFAULT 10,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== FOCUS SESSIONS =====
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'backlog')),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  label TEXT,
  category TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);


-- ===== HABIT ENTRIES =====
CREATE TABLE IF NOT EXISTS habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, habit_id, date)
);

-- ===== HABIT STREAKS (Persistent Stats) =====
CREATE TABLE IF NOT EXISTS habit_streaks (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id TEXT NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, habit_id)
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_quests_user ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quests_priority ON quests(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user ON habit_entries(user_id, date);

-- ===== ROW LEVEL SECURITY =====

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (to allow re-running script)
DROP POLICY IF EXISTS "Allow all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all quests" ON quests;
DROP POLICY IF EXISTS "Allow all sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Allow all habits" ON habit_entries;
DROP POLICY IF EXISTS "Allow all habit streaks" ON habit_streaks;

-- Permissive policies (will lock down with auth later)
CREATE POLICY "Allow all profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all quests" ON quests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all sessions" ON focus_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all habits" ON habit_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all habit streaks" ON habit_streaks FOR ALL USING (true) WITH CHECK (true);

-- Pokemon Buddy System
CREATE TABLE IF NOT EXISTS user_pokemon (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    species_id INT NOT NULL, -- Pokedex ID
    nickname TEXT,
    level INT DEFAULT 5,
    xp INT DEFAULT 0,
    happiness INT DEFAULT 50, -- 0-100
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one active buddy per user (optional, can be enforced by app logic, but partial index is safe)
-- CREATE UNIQUE INDEX IF NOT EXISTS one_active_buddy_per_user ON user_pokemon (user_id) WHERE (is_active = true);

ALTER TABLE user_pokemon ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all user_pokemon" ON user_pokemon FOR ALL USING (true) WITH CHECK (true);

-- Inventory System
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
