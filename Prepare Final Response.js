// Get quiz data
const webhookData = $('Parse Quiz Data').first().json.quizResults;

// Get weekly leaderboard scores
const weeklyScoresNodes = $('Get Weekly Scores').all();
const weeklyScores = weeklyScoresNodes.map(node => node.json);

// Get feedback (guaranteed to exist because of Merge!)
const feedbackData = $('Insert Feedback').first().json;

// ✅ GET PERFORMANCE ANALYSIS DATA (from Analyze Performance node)
const performanceData = $('Analyze Performance').first().json.performance_analysis;

// ✅ GET PROGRESS TRENDS DATA (from Analyze Progress Trends node)
const progressData = $('Analyze Progress Trends').first().json.progress_trends;

// ✅ GET SRS RECOMMENDATIONS DATA (from Process SRS Recommendations node)
const srsData = $('Process SRS Recommendations').first().json.srs_recommendations;

// Find student's rank
const studentEntry = weeklyScores.find(entry =>
  entry.student_id === webhookData.student_id
);

const rank = studentEntry
  ? weeklyScores.findIndex(entry => entry.student_id === webhookData.student_id) + 1
  : null;

// Return complete response with ALL analysis data
return {
  json: {
    success: true,
    message: "Quiz submitted successfully! Check your feedback below.",
    data: {
      // Basic quiz results
      score: webhookData.score,
      total_questions: webhookData.total_questions,
      correct_answers: webhookData.correct_answers,
      total_points: webhookData.total_points,

      // ✅ PERFORMANCE ANALYSIS (rushing, confusion patterns, time insights)
      performance_analysis: {
        rushing_detected: performanceData.patterns?.is_rushing || false,
        rushed_answers_count: performanceData.patterns?.rushed_answers_count || 0,
        confusion_pairs: performanceData.patterns?.confusion_pairs || [],
        accuracy_by_speed: performanceData.insights?.accuracy_by_time || {},
        time_patterns: {
          avg_time_per_question: performanceData.insights?.time_per_question_avg || 0,
          fastest_correct: performanceData.insights?.fastest_correct || null,
          slowest_correct: performanceData.insights?.slowest_correct || null
        },
        critical_weaknesses: performanceData.critical_weaknesses || [],
        moderate_weaknesses: performanceData.moderate_weaknesses || [],
        strong_concepts: performanceData.strong_concepts || []
      },

      // ✅ PROGRESS TRENDS (improvement over time)
      progress_trends: {
        trend_direction: progressData.score_trend?.direction || 'stable',
        change_percentage: progressData.score_trend?.change_percentage || 0,
        last_5_scores: progressData.score_trend?.last_5_scores || [],
        average_last_5: progressData.score_trend?.average_last_5 || 0,
        best_score: progressData.score_trend?.best_score || 0,
        consistency: progressData.score_trend?.consistency || 'moderate',
        vs_last_quiz: progressData.comparison?.vs_last_quiz || null,
        vs_average: progressData.comparison?.vs_average || null,
        vs_best: progressData.comparison?.vs_best || null,
        insights: progressData.insights || [],
        recommendations: progressData.recommendations || []
      },

      // ✅ SRS RECOMMENDATIONS (what to review tomorrow)
      srs_recommendations: {
        review_tomorrow: srsData.review_tomorrow || [],
        review_this_week: srsData.review_this_week || [],
        critical_concepts: srsData.critical_concepts || [],
        struggling_concepts: srsData.struggling_concepts || [],
        mastered_concepts: srsData.mastered_concepts || [],
        summary: srsData.summary || {},
        action_items: srsData.action_items || []
      },

      // Weekly leaderboard
      weekly_rank: rank,
      total_students: weeklyScores.length,

      // AI-generated feedback
      feedback: {
        strengths: feedbackData.strengths || [],
        weaknesses: feedbackData.weaknesses || [],
        ai_insights: feedbackData.ai_insights || '',
        feedback_id: feedbackData.id
      },

      // Gamification
      next_milestone: rank === 1
        ? "🏆 You're #1 this week! Keep it up!"
        : rank <= 3
        ? "🥉 Great job! You're in top 3!"
        : `💪 Keep going! ${rank - 1} spots to top!`,

      // ✅ SRS COMPLETION SIGNAL
      srs_updated: true,
      concepts_updated: performanceData.patterns?.confusion_pairs?.length || 0
    }
  }
};