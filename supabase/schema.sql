-- =============================================
-- FocusRPG Updated Schema (No Monsters)
-- Run this AFTER dropping old tables if they exist
-- =============================================

-- Drop old monster-related objects
DROP TABLE IF EXISTS monsters CASCADE;
ALTER TABLE IF EXISTS profiles DROP COLUMN IF EXISTS active_monster_id;
ALTER TABLE IF EXISTS focus_sessions DROP COLUMN IF EXISTS monster_id;

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== QUESTS (Tasks) =====
-- Drop and recreate to add priority + category
DROP TABLE IF EXISTS quests CASCADE;
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
DROP TABLE IF EXISTS focus_sessions CASCADE;
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

-- ===== INVENTORY =====
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('reward', 'utility', 'goal')),
  item_name TEXT NOT NULL,
  item_metadata JSONB DEFAULT '{}',
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user ON habit_entries(user_id, date);

-- ===== ROW LEVEL SECURITY =====
-- Permissive for now (single-user private project)
-- Will tighten with auth.uid() once NextAuth is wired

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own quests" ON quests;
DROP POLICY IF EXISTS "Users can insert own quests" ON quests;
DROP POLICY IF EXISTS "Users can update own quests" ON quests;
DROP POLICY IF EXISTS "Users can view own sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON inventory;

-- Permissive policies (will lock down with auth later)
CREATE POLICY "Allow all profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all quests" ON quests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all sessions" ON focus_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all habits" ON habit_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all habit streaks" ON habit_streaks FOR ALL USING (true) WITH CHECK (true);
