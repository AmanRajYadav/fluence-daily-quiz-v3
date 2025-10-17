// Check if answer is correct based on question type
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
      // Flexible matching - contains key terms
      // Will be evaluated by AI in n8n, but do basic check
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
      // For matching questions, compare arrays
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
