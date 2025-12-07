/**
 * Answer Checker Utility
 *
 * Validates student answers against correct answers based on question type.
 *
 * SUPPORTED TYPES:
 * - mcq: Multiple choice (exact match)
 * - true_false: True/False (exact match)
 * - fill_blank: Fill in the blank (exact match, case-insensitive)
 * - match: Match pairs (JSON comparison)
 *
 * DEPRECATED TYPES:
 * - short_answer: REMOVED from quiz generation (Dec 2025)
 *   Reason: Grading nuance issues ("doesn't" vs "does not")
 *   Legacy support kept for historical quiz replays only.
 * - voice: Placeholder only
 */
export const checkAnswer = (studentAnswer, correctAnswer, questionType) => {
  if (!studentAnswer || studentAnswer.trim() === '') {
    return false;
  }

  switch (questionType) {
    case 'mcq':
    case 'true_false':
    case 'fill_blank':
      // Exact match (case-insensitive, trimmed)
      return studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    case 'short_answer':
      // DEPRECATED: No longer generated as of Dec 2025
      // Kept for legacy quiz replay support only
      // Basic keyword matching (imperfect - reason for deprecation)
      const answerWords = studentAnswer.toLowerCase().split(/\s+/);
      const correctWords = correctAnswer.toLowerCase().split(/\s+/);
      const matchingWords = correctWords.filter(word =>
        answerWords.some(ansWord => ansWord.includes(word) || word.includes(ansWord))
      );
      return matchingWords.length >= correctWords.length * 0.6; // 60% word match

    case 'voice':
      // Voice answers evaluated by AI - assume correct for now
      return true;

    case 'match':
      // For matching questions, compare JSON objects
      try {
        const studentMatches = JSON.parse(studentAnswer);
        const correctMatches = JSON.parse(correctAnswer);
        return JSON.stringify(studentMatches) === JSON.stringify(correctMatches);
      } catch {
        return false;
      }

    default:
      return false;
  }
};
