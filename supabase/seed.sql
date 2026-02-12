-- =============================================
-- FocusRPG Seed Data
-- Run AFTER schema.sql
-- =============================================

-- 1. Create user profile
INSERT INTO profiles (id, email, display_name, coins, xp, level, current_streak, longest_streak, total_focus_minutes)
VALUES (
  'fbc48e91-1ff4-4bc1-97e7-efee204eaa63',
  'jerome@focusrpg.local',
  'Jerome',
  22,
  0,
  1,
  3,
  3,
  180
) ON CONFLICT (email) DO UPDATE SET
  coins = EXCLUDED.coins,
  xp = EXCLUDED.xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  total_focus_minutes = EXCLUDED.total_focus_minutes;

-- 2. Boss Battles (Urgent Tasks)
INSERT INTO quests (user_id, title, category, priority, status, reward_coins, reward_xp, due_at) VALUES
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Buy Groupbuy Keyboard', 'MISC', 'boss', 'pending', 3, 30, '2025-02-12T23:59:00+08:00'),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Valentines Dinner', 'Other', 'boss', 'pending', 3, 30, '2025-02-14T23:59:00+08:00'),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Draft of Assignment 1', 'HW0218', 'boss', 'pending', 5, 50, '2025-02-16T23:59:00+08:00'),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Peer Review & Consult', 'HW0218', 'boss', 'pending', 5, 50, '2025-02-19T23:59:00+08:00');

-- 3. Side Quests (Upcoming)
INSERT INTO quests (user_id, title, category, priority, status, reward_coins, reward_xp, due_at) VALUES
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Assignment 1 Submission', 'HW0218', 'side', 'pending', 5, 50, '2025-02-23T23:59:00+08:00'),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Pay Hall Fees', 'MISC', 'side', 'pending', 2, 20, '2025-02-24T23:59:00+08:00'),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Quiz 1 (4-5PM, Exam Hall C)', 'MH3511', 'side', 'pending', 5, 50, '2025-02-25T16:00:00+08:00'),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Caleb & Elliotte Hangout', 'Other', 'side', 'pending', 1, 10, '2025-02-27T23:59:00+08:00'),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Check Assignment 1 Deadline', 'MH3500', 'side', 'pending', 1, 10, NULL),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Determine Lab 2 Date', 'SC3000', 'side', 'pending', 1, 10, NULL),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Fix Client Website (DenryuTCG)', 'Did', 'side', 'pending', 3, 30, NULL),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'Fix Boggle (Local)', 'Did', 'side', 'pending', 2, 20, NULL);

-- 4. Seed today's habit entries (not yet completed)
INSERT INTO habit_entries (user_id, habit_id, date, completed) VALUES
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'steps', CURRENT_DATE, false),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'fiber', CURRENT_DATE, false),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'protein', CURRENT_DATE, false),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'exercise', CURRENT_DATE, false),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'focus', CURRENT_DATE, false),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'enrichment', CURRENT_DATE, false)
ON CONFLICT (user_id, habit_id, date) DO NOTHING;

-- 5. Seed Habit Streaks
INSERT INTO habit_streaks (user_id, habit_id, current_streak, longest_streak, last_completed_at) VALUES
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'focus', 3, 5, NOW()),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'steps', 1, 10, NOW() - INTERVAL '1 day')
ON CONFLICT (user_id, habit_id) DO NOTHING;

-- 7. Seed Inventory
INSERT INTO inventory (user_id, item_id, quantity) VALUES
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'berry_oran', 5),
('fbc48e91-1ff4-4bc1-97e7-efee204eaa63', 'potion', 2)
ON CONFLICT (user_id, item_id) DO NOTHING;
