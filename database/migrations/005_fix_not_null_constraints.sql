-- ============================================
-- FLUENCE QUIZ V3 - FIX NOT NULL CONSTRAINTS
-- ============================================
-- Migration: 005_fix_not_null_constraints.sql
-- Created: 2025-10-27
-- Purpose: Add NOT NULL constraints for better data integrity
-- Severity: LOW (optional optimization)
-- ============================================

-- ⚠️ SAFETY CHECK: Run this query FIRST to ensure no NULL values exist
-- SELECT 'feedback' as table_name, COUNT(*) as null_count
-- FROM feedback WHERE student_id IS NULL
-- UNION ALL
-- SELECT 'weekly_leaderboard (institution_id)', COUNT(*)
-- FROM weekly_leaderboard WHERE institution_id IS NULL
-- UNION ALL
-- SELECT 'weekly_leaderboard (class_id)', COUNT(*)
-- FROM weekly_leaderboard WHERE class_id IS NULL
-- UNION ALL
-- SELECT 'weekly_leaderboard (student_id)', COUNT(*)
-- FROM weekly_leaderboard WHERE student_id IS NULL;
--
-- Expected: All counts should be 0

-- ============================================
-- APPLY MIGRATION
-- ============================================

BEGIN;

-- Fix feedback.student_id (should be NOT NULL)
-- Rationale: Every feedback must belong to a student
ALTER TABLE feedback
  ALTER COLUMN student_id SET NOT NULL;

-- Fix weekly_leaderboard multi-tenant columns
-- Rationale: All leaderboard entries must be scoped to institution + class + student
ALTER TABLE weekly_leaderboard
  ALTER COLUMN institution_id SET NOT NULL,
  ALTER COLUMN class_id SET NOT NULL,
  ALTER COLUMN student_id SET NOT NULL;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify constraints applied
SELECT
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('feedback', 'weekly_leaderboard')
  AND column_name IN ('student_id', 'institution_id', 'class_id')
ORDER BY table_name, column_name;

-- Expected: All should show is_nullable = 'NO'

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ NOT NULL constraints applied successfully!';
  RAISE NOTICE '   - feedback.student_id → NOT NULL';
  RAISE NOTICE '   - weekly_leaderboard.institution_id → NOT NULL';
  RAISE NOTICE '   - weekly_leaderboard.class_id → NOT NULL';
  RAISE NOTICE '   - weekly_leaderboard.student_id → NOT NULL';
END $$;
