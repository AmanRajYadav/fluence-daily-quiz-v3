// Calculate score with streak bonus (no timer bonus)
// Scoring reduced to 1/10th to keep totals reasonable for 30 questions
export const calculateScore = (isCorrect, streak) => {
  if (!isCorrect) return 0;

  const basePoints = 100;

  // Streak bonus: +20 points per streak level
  const streakBonus = streak * 20;

  // Divide by 10 to make scoring reasonable (30 questions = ~1000-1200 points max)
  const totalPoints = (basePoints + streakBonus) / 10;

  return totalPoints;
};

// Calculate final grade
export const calculateGrade = (score, totalQuestions) => {
  const percentage = (score / (totalQuestions * 100)) * 100;

  if (percentage >= 90) return { grade: 'A+', color: '#10B981', emoji: '🏆' };
  if (percentage >= 80) return { grade: 'A', color: '#34D399', emoji: '⭐' };
  if (percentage >= 70) return { grade: 'B', color: '#60A5FA', emoji: '👍' };
  if (percentage >= 60) return { grade: 'C', color: '#FBBF24', emoji: '📚' };
  if (percentage >= 50) return { grade: 'D', color: '#F59E0B', emoji: '💪' };
  return { grade: 'F', color: '#EF4444', emoji: '🔄' };
};

// Get performance message based on score percentage
export const getPerformanceMessage = (percentage) => {
  if (percentage >= 90) return "Outstanding! You're a quiz master! 🌟";
  if (percentage >= 80) return "Excellent work! Keep it up! 🎉";
  if (percentage >= 70) return "Great job! You're doing well! 👏";
  if (percentage >= 60) return "Good effort! Keep practicing! 📈";
  if (percentage >= 50) return "Not bad! Room for improvement! 💡";
  return "Keep trying! Practice makes perfect! 🚀";
};
