/**
 * N8N Code Node: Analyze Detailed Performance
 *
 * This node analyzes quiz results to detect patterns and provide insights
 *
 * INPUT:
 * - $json.answers_json (from quiz submission)
 * - $json.total_questions
 * - $json.correct_answers
 * - $json.score
 * - $json.time_taken_seconds
 *
 * OUTPUT:
 * - performance_analysis object with detailed insights
 */

// Get quiz data from webhook
const answersJson = $json.answers_json || {};
const questions = answersJson.questions || [];
const metadata = answersJson.metadata || {};

// Initialize analysis object
const analysis = {
  // Basic stats
  total_questions: $json.total_questions || questions.length,
  correct_count: $json.correct_answers || 0,
  incorrect_count: metadata.incorrect_count || 0,
  score: $json.score || 0,
  time_taken: $json.time_taken_seconds || 0,

  // Pattern detection
  patterns: {
    is_rushing: false,
    rushed_answers_count: 0,
    short_answers: [],
    confusion_pairs: [],
    consistent_mistakes: []
  },

  // Performance insights
  insights: {
    fastest_correct: null,
    slowest_correct: null,
    time_per_question_avg: 0,
    accuracy_by_time: { fast: 0, medium: 0, slow: 0 }
  },

  // Weaknesses
  critical_weaknesses: [],
  moderate_weaknesses: [],

  // Strengths
  strong_concepts: [],

  // Recommendations
  needs_different_approach: [],
  ready_for_harder_questions: []
};

// ===================================
// 1. DETECT RUSHING BEHAVIOR
// ===================================
const shortAnswers = questions.filter(q => {
  const answer = q.student_answer || '';
  const isShort = typeof answer === 'string' && answer.trim().length <= 2;
  const isIncorrect = q.is_correct === false;
  return isShort && isIncorrect;
});

analysis.patterns.short_answers = shortAnswers.map(q => ({
  question_id: q.question_id,
  answer: q.student_answer,
  concept: q.concept_name
}));

analysis.patterns.rushed_answers_count = shortAnswers.length;

// If >30% of questions have very short incorrect answers, student is rushing
if (analysis.patterns.rushed_answers_count >= analysis.total_questions * 0.3) {
  analysis.patterns.is_rushing = true;
}

// ===================================
// 2. IDENTIFY CONFUSION PAIRS
// ===================================
// Group wrong answers by concept
const incorrectByConcept = {};
questions.forEach(q => {
  if (!q.is_correct) {
    const concept = q.concept_name || 'Unknown';
    if (!incorrectByConcept[concept]) {
      incorrectByConcept[concept] = [];
    }
    incorrectByConcept[concept].push({
      question_id: q.question_id,
      question_text: q.question_text,
      student_answer: q.student_answer,
      correct_answer: q.correct_answer
    });
  }
});

// If a concept has >=2 wrong answers, it's a confusion area
Object.keys(incorrectByConcept).forEach(concept => {
  const count = incorrectByConcept[concept].length;
  if (count >= 2) {
    analysis.patterns.confusion_pairs.push({
      concept,
      incorrect_count: count,
      examples: incorrectByConcept[concept].slice(0, 2) // Show first 2 examples
    });
  }
});

// ===================================
// 3. TIME ANALYSIS
// ===================================
const questionsWithTime = questions.filter(q => q.time_spent > 0);

if (questionsWithTime.length > 0) {
  const totalTime = questionsWithTime.reduce((sum, q) => sum + q.time_spent, 0);
  analysis.insights.time_per_question_avg = Math.round(totalTime / questionsWithTime.length);

  // Find fastest and slowest correct answers
  const correctAnswers = questionsWithTime.filter(q => q.is_correct);
  if (correctAnswers.length > 0) {
    correctAnswers.sort((a, b) => a.time_spent - b.time_spent);
    analysis.insights.fastest_correct = {
      time: correctAnswers[0].time_spent,
      concept: correctAnswers[0].concept_name
    };
    analysis.insights.slowest_correct = {
      time: correctAnswers[correctAnswers.length - 1].time_spent,
      concept: correctAnswers[correctAnswers.length - 1].concept_name
    };
  }

  // Categorize questions by time taken
  const fastThreshold = 10; // seconds
  const slowThreshold = 30;

  let fastCorrect = 0, fastTotal = 0;
  let mediumCorrect = 0, mediumTotal = 0;
  let slowCorrect = 0, slowTotal = 0;

  questionsWithTime.forEach(q => {
    if (q.time_spent < fastThreshold) {
      fastTotal++;
      if (q.is_correct) fastCorrect++;
    } else if (q.time_spent < slowThreshold) {
      mediumTotal++;
      if (q.is_correct) mediumCorrect++;
    } else {
      slowTotal++;
      if (q.is_correct) slowCorrect++;
    }
  });

  analysis.insights.accuracy_by_time = {
    fast: fastTotal > 0 ? Math.round((fastCorrect / fastTotal) * 100) : 0,
    medium: mediumTotal > 0 ? Math.round((mediumCorrect / mediumTotal) * 100) : 0,
    slow: slowTotal > 0 ? Math.round((slowCorrect / slowTotal) * 100) : 0
  };
}

// ===================================
// 4. IDENTIFY CRITICAL WEAKNESSES
// ===================================
// Critical: concepts with multiple wrong answers
analysis.patterns.confusion_pairs.forEach(confusion => {
  if (confusion.incorrect_count >= 3) {
    analysis.critical_weaknesses.push({
      concept: confusion.concept,
      severity: 'critical',
      wrong_count: confusion.incorrect_count,
      message: `Struggled significantly with ${confusion.concept} (${confusion.incorrect_count} errors)`
    });
  } else if (confusion.incorrect_count >= 2) {
    analysis.moderate_weaknesses.push({
      concept: confusion.concept,
      severity: 'moderate',
      wrong_count: confusion.incorrect_count,
      message: `Needs practice with ${confusion.concept} (${confusion.incorrect_count} errors)`
    });
  }
});

// ===================================
// 5. IDENTIFY STRENGTHS
// ===================================
// Group correct answers by concept
const correctByConcept = {};
questions.forEach(q => {
  if (q.is_correct) {
    const concept = q.concept_name || 'Unknown';
    if (!correctByConcept[concept]) {
      correctByConcept[concept] = 0;
    }
    correctByConcept[concept]++;
  }
});

// If a concept has >=3 correct answers, it's a strength
Object.keys(correctByConcept).forEach(concept => {
  const count = correctByConcept[concept];
  if (count >= 3) {
    analysis.strong_concepts.push({
      concept,
      correct_count: count,
      message: `Strong grasp of ${concept} (${count} correct)`
    });
  }
});

// ===================================
// 6. RECOMMENDATIONS
// ===================================
// If student is rushing, recommend slowing down
if (analysis.patterns.is_rushing) {
  analysis.needs_different_approach.push({
    issue: 'rushing',
    recommendation: 'Slow down and read questions carefully. Many errors were from rushed, very short answers.'
  });
}

// If slow accuracy is low, recommend more practice
if (analysis.insights.accuracy_by_time.slow < 50 && analysis.insights.accuracy_by_time.slow > 0) {
  analysis.needs_different_approach.push({
    issue: 'difficult_questions',
    recommendation: 'Spend more time on challenging questions. Your accuracy drops significantly on questions that take longer.'
  });
}

// If fast accuracy is high, ready for harder questions
if (analysis.insights.accuracy_by_time.fast >= 80) {
  analysis.ready_for_harder_questions.push({
    reason: 'Quick questions mastered',
    message: 'Excellent performance on quick recall questions. Ready for more challenging material.'
  });
}

// ===================================
// OUTPUT
// ===================================
return {
  json: {
    ...$json,
    performance_analysis: analysis
  }
};
