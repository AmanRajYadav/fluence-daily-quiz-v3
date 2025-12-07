/**
 * N8N Supabase Node: Get Last 5 Quiz Results for Progress Tracking
 *
 * This query fetches the student's last 5 quiz attempts to analyze trends
 *
 * VARIABLES TO REPLACE:
 * - {{$json.student_id}} - from quiz submission
 * - {{$json.institution_id}} - from quiz submission
 */

-- Get last 5 quiz results for this student
SELECT
  id,
  quiz_date,
  score,
  total_questions,
  correct_answers,
  time_taken_seconds,
  total_points,
  created_at
FROM quiz_results
WHERE student_id = '{{$json.student_id}}'
  AND institution_id = '{{$json.institution_id}}'
ORDER BY created_at DESC
LIMIT 6;
-- Limit 6 because current quiz will be inserted soon, so we want 5 previous + current

/**
 * EXPECTED OUTPUT:
 * Array of quiz result objects, most recent first
 *
 * Use this in a Code node to calculate:
 * - Average score trend (improving/declining)
 * - Consistency (score variance)
 * - Streak information
 * - Best/worst performance
 */
