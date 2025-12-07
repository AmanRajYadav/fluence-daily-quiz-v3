-- SQL Commands to Rename "Mamta" to "User" in Supabase
-- Execute these commands in Supabase SQL Editor
-- Date: 2025-10-15

-- ============================================
-- 1. UPDATE students table
-- ============================================
UPDATE students
SET
  name = 'User',
  display_name = 'User'
WHERE id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1';

-- Verify the update
SELECT id, name, display_name, grade, subjects, active
FROM students
WHERE id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1';

-- ============================================
-- 2. UPDATE quiz_results table (student_name field)
-- ============================================
UPDATE quiz_results
SET student_name = 'User'
WHERE student_id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1';

-- Verify the update
SELECT id, student_id, student_name, quiz_date, score
FROM quiz_results
WHERE student_id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1'
ORDER BY quiz_date DESC
LIMIT 5;

-- ============================================
-- 3. UPDATE quiz_history table (student_name field)
-- ============================================
UPDATE quiz_history
SET student_name = 'User'
WHERE student_id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1';

-- Verify the update
SELECT id, student_id, student_name, quiz_date, score
FROM quiz_history
WHERE student_id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1'
ORDER BY quiz_date DESC
LIMIT 5;

-- ============================================
-- 4. CHECK: Verify all updates
-- ============================================
-- Count records by student_id
SELECT
  'students' AS table_name,
  COUNT(*) AS count
FROM students
WHERE id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1'

UNION ALL

SELECT
  'quiz_questions' AS table_name,
  COUNT(*) AS count
FROM quiz_questions
WHERE student_id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1'

UNION ALL

SELECT
  'quiz_results' AS table_name,
  COUNT(*) AS count
FROM quiz_results
WHERE student_id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1'

UNION ALL

SELECT
  'quiz_history' AS table_name,
  COUNT(*) AS count
FROM quiz_history
WHERE student_id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1'

UNION ALL

SELECT
  'concept_mastery' AS table_name,
  COUNT(*) AS count
FROM concept_mastery
WHERE student_id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1'

UNION ALL

SELECT
  'leaderboard' AS table_name,
  COUNT(*) AS count
FROM leaderboard
WHERE student_id = 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1';

-- ============================================
-- DONE! Summary:
-- ============================================
-- ✅ students.name: Mamta → User
-- ✅ students.display_name: Mamta → User
-- ✅ quiz_results.student_name: Mamta → User
-- ✅ quiz_history.student_name: Mamta → User
-- ✅ student_id (UUID: afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1) remains unchanged
-- ============================================
