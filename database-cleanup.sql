/**
 * Database Cleanup Script for Fresh Start
 *
 * WHAT THIS DOES:
 * - Keeps: Teacher profile (aman@fluence.ac), classes, Kavya & Anaya student profiles
 * - Deletes: All transcript history, quiz data, quiz results, leaderboard, concept_mastery
 *
 * RUN THIS IN SUPABASE SQL EDITOR
 *
 * Date: 2025-12-07
 * Purpose: Clean database for fresh deployment to fluence-daily-quiz-v3
 */

-- =================================================================
-- STEP 1: Backup Important Data (OPTIONAL - for safety)
-- =================================================================

-- Backup teacher profile
CREATE TEMP TABLE temp_teacher_backup AS
SELECT * FROM teachers WHERE email = 'aman@fluence.ac';

-- Backup classes
CREATE TEMP TABLE temp_classes_backup AS
SELECT * FROM classes WHERE teacher_id IN (SELECT id FROM teachers WHERE email = 'aman@fluence.ac');

-- Backup Kavya and Anaya profiles
CREATE TEMP TABLE temp_students_backup AS
SELECT * FROM students WHERE full_name IN ('Kavya', 'Anaya');

-- =================================================================
-- STEP 2: Delete Quiz Data (Keep Students & Teacher)
-- =================================================================

-- Delete leaderboard entries
DELETE FROM leaderboard;
SELECT 'Deleted ' || ROW_COUNT() || ' leaderboard entries';

-- Delete quiz results
DELETE FROM quiz_results;
SELECT 'Deleted ' || ROW_COUNT() || ' quiz results';

-- Delete concept mastery records
DELETE FROM concept_mastery;
SELECT 'Deleted ' || ROW_COUNT() || ' concept mastery records';

-- Delete quiz history
DELETE FROM quiz_history;
SELECT 'Deleted ' || ROW_COUNT() || ' quiz history records';

-- Delete generated quiz questions
DELETE FROM quiz_questions;
SELECT 'Deleted ' || ROW_COUNT() || ' quiz questions';

-- =================================================================
-- STEP 3: Delete Transcript History
-- =================================================================

-- Delete audio uploads and transcripts
DELETE FROM audio_uploads;
SELECT 'Deleted ' || ROW_COUNT() || ' audio uploads';

-- Delete notes history
DELETE FROM notes_history;
SELECT 'Deleted ' || ROW_COUNT() || ' notes history records';

-- =================================================================
-- STEP 4: Verify What's Left
-- =================================================================

-- Check teachers (should have aman@fluence.ac)
SELECT 'Teachers:' as category, COUNT(*) as count FROM teachers
UNION ALL
-- Check institutions
SELECT 'Institutions:', COUNT(*) FROM institutions
UNION ALL
-- Check classes
SELECT 'Classes:', COUNT(*) FROM classes
UNION ALL
-- Check students (should have Kavya and Anaya)
SELECT 'Students:', COUNT(*) FROM students
UNION ALL
-- Check quiz data (should be 0)
SELECT 'Quiz Results:', COUNT(*) FROM quiz_results
UNION ALL
SELECT 'Quiz Questions:', COUNT(*) FROM quiz_questions
UNION ALL
SELECT 'Concept Mastery:', COUNT(*) FROM concept_mastery
UNION ALL
SELECT 'Leaderboard:', COUNT(*) FROM leaderboard
UNION ALL
-- Check transcript data (should be 0)
SELECT 'Audio Uploads:', COUNT(*) FROM audio_uploads
UNION ALL
SELECT 'Notes History:', COUNT(*) FROM notes_history;

-- =================================================================
-- STEP 5: Verify Student & Teacher Details
-- =================================================================

-- Show teacher details
SELECT 'Teacher Profile:' as info;
SELECT email, full_name, institution_id, created_at
FROM teachers
WHERE email = 'aman@fluence.ac';

-- Show student details
SELECT 'Student Profiles:' as info;
SELECT full_name, username, class_id, institution_id, active, created_at
FROM students
WHERE full_name IN ('Kavya', 'Anaya')
ORDER BY full_name;

-- Show classes
SELECT 'Classes:' as info;
SELECT class_code, class_name, teacher_id, created_at
FROM classes
ORDER BY class_name;

-- =================================================================
-- CLEANUP COMPLETE!
-- =================================================================

SELECT '✅ Database cleanup complete!' as status;
SELECT '
WHAT WAS KEPT:
- Teacher: aman@fluence.ac
- Students: Kavya, Anaya
- Classes: All classes created by teacher
- Institutions: All institutions

WHAT WAS DELETED:
- All quiz results
- All quiz questions
- All concept mastery data
- All leaderboard entries
- All audio uploads & transcripts
- All notes history

NEXT STEPS:
1. Test login as teacher
2. Test login as Kavya
3. Test login as Anaya
4. Upload new audio file to generate fresh questions
5. Take a quiz to verify system works
' as summary;
