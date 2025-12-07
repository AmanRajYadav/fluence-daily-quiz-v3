-- ============================================
-- FLUENCE QUIZ V3 - ADD INSTITUTION INDEXES
-- ============================================
-- Migration: 006_add_institution_indexes.sql
-- Created: 2025-10-27
-- Purpose: Add performance indexes for multi-tenant queries
-- Severity: LOW (optional optimization, critical at scale)
-- Impact: 10-100x faster queries when filtering by institution_id
-- ============================================

BEGIN;

-- Add index on quiz_results.institution_id
-- Use case: "Get all quiz results for institution X"
-- Query example: SELECT * FROM quiz_results WHERE institution_id = 'uuid'
-- Performance: Enables index scan instead of sequential scan
CREATE INDEX IF NOT EXISTS idx_quiz_results_institution
  ON quiz_results(institution_id);

-- Add index on quiz_questions.institution_id
-- Use case: "Get all questions for institution X"
-- Query example: SELECT * FROM quiz_questions WHERE institution_id = 'uuid'
-- Performance: Enables index scan instead of sequential scan
CREATE INDEX IF NOT EXISTS idx_quiz_questions_institution
  ON quiz_questions(institution_id);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check indexes created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname IN ('idx_quiz_results_institution', 'idx_quiz_questions_institution')
ORDER BY tablename;

-- Expected: 2 rows returned

-- ============================================
-- PERFORMANCE ANALYSIS
-- ============================================

-- Test query performance (EXPLAIN shows execution plan)
EXPLAIN ANALYZE
SELECT * FROM quiz_results
WHERE institution_id = (SELECT id FROM institutions LIMIT 1);

-- Before index: Seq Scan (slow)
-- After index: Index Scan using idx_quiz_results_institution (fast)

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Institution indexes created successfully!';
  RAISE NOTICE '   - idx_quiz_results_institution';
  RAISE NOTICE '   - idx_quiz_questions_institution';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Performance Impact:';
  RAISE NOTICE '   - Queries filtering by institution_id now use index scan';
  RAISE NOTICE '   - 10-100x faster at scale (>10,000 records)';
  RAISE NOTICE '   - Critical for multi-tenant performance';
END $$;
