-- =============================================
-- Transfer Data to New User ID
-- Run this in the Supabase SQL Editor to migrate your data.
-- =============================================

-- Old ID (Placeholder/Previous Seed)
-- 'f4e2bfa4-9192-4864-9d52-947001c79722'

-- New ID (Your Google Auth ID)
-- 'fbc48e91-1ff4-4bc1-97e7-efee204eaa63'

BEGIN;

-- 1. Quests
UPDATE quests 
SET user_id = 'fbc48e91-1ff4-4bc1-97e7-efee204eaa63' 
WHERE user_id = 'f4e2bfa4-9192-4864-9d52-947001c79722';

-- 2. Habits
-- Handle potential conflicts (if new user already has entries)
-- For simplicity, we assume new user is empty or we overwrite.
-- If conflict, we might need DO NOTHING or careful merge.
-- Here we try to update, if it fails due to constraint, you might need to delete old data instead.

UPDATE habit_entries 
SET user_id = 'fbc48e91-1ff4-4bc1-97e7-efee204eaa63' 
WHERE user_id = 'f4e2bfa4-9192-4864-9d52-947001c79722'
AND NOT EXISTS (
    SELECT 1 FROM habit_entries he 
    WHERE he.user_id = 'fbc48e91-1ff4-4bc1-97e7-efee204eaa63' 
    AND he.habit_id = habit_entries.habit_id 
    AND he.date = habit_entries.date
);

UPDATE habit_streaks 
SET user_id = 'fbc48e91-1ff4-4bc1-97e7-efee204eaa63' 
WHERE user_id = 'f4e2bfa4-9192-4864-9d52-947001c79722'
AND NOT EXISTS (
    SELECT 1 FROM habit_streaks hs 
    WHERE hs.user_id = 'fbc48e91-1ff4-4bc1-97e7-efee204eaa63' 
    AND hs.habit_id = habit_streaks.habit_id
);

-- 3. Pokemon Buddy
UPDATE user_pokemon 
SET user_id = 'fbc48e91-1ff4-4bc1-97e7-efee204eaa63' 
WHERE user_id = 'f4e2bfa4-9192-4864-9d52-947001c79722';

-- 4. Inventory
UPDATE inventory 
SET user_id = 'fbc48e91-1ff4-4bc1-97e7-efee204eaa63' 
WHERE user_id = 'f4e2bfa4-9192-4864-9d52-947001c79722'
AND NOT EXISTS (
    SELECT 1 FROM inventory i 
    WHERE i.user_id = 'fbc48e91-1ff4-4bc1-97e7-efee204eaa63' 
    AND i.item_id = inventory.item_id
);

-- 5. Profile Stats?
-- You might want to copy coins/XP/Streaks to new profile manually or summation?
-- UPDATE profiles SET ... 
-- Usually we just assume the Quests/Pokemon are the important part.

COMMIT;
