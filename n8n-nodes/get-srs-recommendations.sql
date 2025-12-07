/**
 * N8N Supabase Node: Get SRS-Based Recommendations
 *
 * Queries concept_mastery to find concepts needing review
 *
 * VARIABLES TO REPLACE:
 * - {{$json.student_id}} - from quiz submission
 * - {{$json.institution_id}} - from quiz submission
 */

-- Get concept mastery data for SRS recommendations
SELECT
  concept_name,
  mastery_score,
  review_count,
  last_reviewed_at,
  next_review_date,
  consecutive_correct,
  consecutive_incorrect,
  needs_different_approach,
  created_at
FROM concept_mastery
WHERE student_id = '{{$json.student_id}}'
  AND institution_id = '{{$json.institution_id}}'
ORDER BY mastery_score ASC, next_review_date ASC;

/**
 * EXPECTED OUTPUT:
 * Array of concept mastery records
 *
 * Use this to:
 * 1. Find concepts due for review tomorrow (next_review_date = tomorrow)
 * 2. Identify critical weaknesses (mastery_score < 20)
 * 3. Find concepts needing different approach (needs_different_approach = true)
 * 4. Suggest focus areas for next study session
 */
