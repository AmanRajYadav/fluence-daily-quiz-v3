/**
 * N8N Code Node: Analyze Progress Trends
 *
 * Analyzes last 5 quiz results to detect improvement/decline trends
 *
 * INPUT:
 * - $json (array of quiz results from get-progress-history.sql)
 * - $('Parse Quiz Data').item.json (current quiz data)
 *
 * OUTPUT:
 * - progress_trends object with insights
 */

// Get previous quiz results
const previousQuizzes = $input.all().map(item => item.json);

// Get current quiz data from earlier node
const currentQuiz = {
  score: $('Parse Quiz Data').item.json.score,
  total_points: $('Parse Quiz Data').item.json.total_points,
  correct_answers: $('Parse Quiz Data').item.json.correct_answers,
  total_questions: $('Parse Quiz Data').item.json.total_questions,
  time_taken: $('Parse Quiz Data').item.json.time_taken_seconds
};

// Initialize trends object
const trends = {
  total_quizzes: previousQuizzes.length,
  current_score: currentQuiz.score,

  // Score analysis
  score_trend: {
    direction: 'stable', // improving, declining, stable
    change_percentage: 0,
    last_5_scores: [],
    average_last_5: 0,
    best_score: 0,
    worst_score: 100,
    consistency: 'moderate' // high, moderate, low
  },

  // Performance comparison
  comparison: {
    vs_last_quiz: null,
    vs_average: null,
    vs_best: null
  },

  // Insights
  insights: [],

  // Recommendations
  recommendations: []
};

if (previousQuizzes.length === 0) {
  // First quiz ever
  trends.insights.push('This is your first quiz! Great start! 🎉');
  trends.recommendations.push('Keep taking quizzes daily to track your progress.');

  return {
    json: {
      progress_trends: trends
    }
  };
}

// ===================================
// 1. CALCULATE SCORE TRENDS
// ===================================
// Extract last 5 scores (excluding current quiz)
const last5Scores = previousQuizzes
  .slice(0, 5)
  .map(q => q.score)
  .reverse(); // Oldest to newest

trends.score_trend.last_5_scores = last5Scores;

// Calculate average of last 5
if (last5Scores.length > 0) {
  const sum = last5Scores.reduce((a, b) => a + b, 0);
  trends.score_trend.average_last_5 = Math.round(sum / last5Scores.length);
}

// Find best and worst
const allScores = [...last5Scores, currentQuiz.score];
trends.score_trend.best_score = Math.max(...allScores);
trends.score_trend.worst_score = Math.min(...allScores);

// ===================================
// 2. DETECT TREND DIRECTION
// ===================================
// Compare current score to average of last 5
const avgLast5 = trends.score_trend.average_last_5;
const scoreDiff = currentQuiz.score - avgLast5;
trends.score_trend.change_percentage = Math.round(scoreDiff);

if (scoreDiff > 10) {
  trends.score_trend.direction = 'improving';
  trends.insights.push(`Great progress! You're ${Math.abs(scoreDiff).toFixed(1)}% better than your recent average.`);
} else if (scoreDiff < -10) {
  trends.score_trend.direction = 'declining';
  trends.insights.push(`Your score dropped ${Math.abs(scoreDiff).toFixed(1)}% from your average. Let's identify what changed.`);
} else {
  trends.score_trend.direction = 'stable';
  trends.insights.push('Your performance is consistent with recent quizzes.');
}

// ===================================
// 3. CONSISTENCY ANALYSIS
// ===================================
// Calculate standard deviation
if (last5Scores.length >= 3) {
  const mean = avgLast5;
  const variance = last5Scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / last5Scores.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 5) {
    trends.score_trend.consistency = 'high';
    trends.insights.push('Your scores are very consistent! This shows stable understanding.');
  } else if (stdDev > 15) {
    trends.score_trend.consistency = 'low';
    trends.insights.push('Your scores vary a lot. Try maintaining a regular study routine.');
  } else {
    trends.score_trend.consistency = 'moderate';
  }
}

// ===================================
// 4. PERFORMANCE COMPARISONS
// ===================================
// vs last quiz
if (previousQuizzes.length > 0) {
  const lastQuiz = previousQuizzes[0];
  const diff = currentQuiz.score - lastQuiz.score;
  trends.comparison.vs_last_quiz = {
    diff: Math.round(diff),
    improved: diff > 0,
    message: diff > 0
      ? `+${diff.toFixed(1)}% better than last quiz!`
      : diff < 0
      ? `${Math.abs(diff).toFixed(1)}% lower than last quiz`
      : 'Same as last quiz'
  };
}

// vs average
trends.comparison.vs_average = {
  diff: Math.round(scoreDiff),
  better: scoreDiff > 0,
  message: scoreDiff > 0
    ? `${scoreDiff.toFixed(1)}% above your average`
    : scoreDiff < 0
    ? `${Math.abs(scoreDiff).toFixed(1)}% below your average`
    : 'Right at your average'
};

// vs best
const diffFromBest = currentQuiz.score - trends.score_trend.best_score;
if (Math.abs(diffFromBest) < 1) {
  trends.comparison.vs_best = {
    is_best: true,
    message: '🎉 NEW PERSONAL BEST!'
  };
  trends.insights.push('This is your best score yet! Keep up the great work!');
} else {
  trends.comparison.vs_best = {
    is_best: false,
    diff: Math.round(diffFromBest),
    message: `${Math.abs(diffFromBest).toFixed(1)}% away from your best (${trends.score_trend.best_score.toFixed(1)}%)`
  };
}

// ===================================
// 5. RECOMMENDATIONS
// ===================================
// If declining, suggest review
if (trends.score_trend.direction === 'declining') {
  trends.recommendations.push('Review concepts from your previous quiz where you scored higher.');
  trends.recommendations.push('Take breaks between quizzes to avoid burnout.');
}

// If improving, encourage
if (trends.score_trend.direction === 'improving') {
  trends.recommendations.push('Your improvement is excellent! Keep this momentum going.');
  trends.recommendations.push('Challenge yourself with harder questions soon.');
}

// If inconsistent, suggest routine
if (trends.score_trend.consistency === 'low') {
  trends.recommendations.push('Try to study at the same time each day for better consistency.');
}

// If consistently high, suggest advancing
if (avgLast5 >= 85 && trends.score_trend.consistency === 'high') {
  trends.recommendations.push('You\'re crushing it! Time to move to more advanced material.');
}

// ===================================
// OUTPUT
// ===================================
return {
  json: {
    progress_trends: trends
  }
};
