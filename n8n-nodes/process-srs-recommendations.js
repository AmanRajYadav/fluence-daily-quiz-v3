/**
 * N8N Code Node: Process SRS Recommendations
 *
 * Processes concept_mastery data to generate actionable SRS recommendations
 *
 * INPUT:
 * - $json (array of concept_mastery records from get-srs-recommendations.sql)
 *
 * OUTPUT:
 * - srs_recommendations object
 */

// Get concept mastery data
const conceptMasteryData = $input.all().map(item => item.json);

// Initialize recommendations object
const srsRecs = {
  // Tomorrow's review
  review_tomorrow: [],
  review_this_week: [],

  // Critical areas
  critical_concepts: [],

  // Needs different approach
  struggling_concepts: [],

  // Strong areas
  mastered_concepts: [],

  // Summary
  summary: {
    total_concepts: conceptMasteryData.length,
    concepts_due_soon: 0,
    critical_count: 0,
    mastered_count: 0,
    struggling_count: 0
  },

  // Recommendations
  action_items: []
};

// Calculate tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

// One week from now
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
const nextWeekStr = nextWeek.toISOString().split('T')[0];

// ===================================
// 1. CATEGORIZE CONCEPTS
// ===================================
conceptMasteryData.forEach(concept => {
  const masteryScore = concept.mastery_score || 0;
  const nextReviewDate = concept.next_review_date || '';
  const needsDifferentApproach = concept.needs_different_approach || false;
  const consecutiveIncorrect = concept.consecutive_incorrect || 0;

  // Check if due tomorrow
  if (nextReviewDate === tomorrowStr) {
    srsRecs.review_tomorrow.push({
      concept: concept.concept_name,
      mastery_score: masteryScore,
      review_count: concept.review_count || 0,
      priority: masteryScore < 50 ? 'high' : 'normal'
    });
    srsRecs.summary.concepts_due_soon++;
  }

  // Check if due this week
  if (nextReviewDate > tomorrowStr && nextReviewDate <= nextWeekStr) {
    srsRecs.review_this_week.push({
      concept: concept.concept_name,
      mastery_score: masteryScore,
      next_review_date: nextReviewDate
    });
  }

  // Critical concepts (mastery < 20)
  if (masteryScore < 20) {
    srsRecs.critical_concepts.push({
      concept: concept.concept_name,
      mastery_score: masteryScore,
      review_count: concept.review_count || 0,
      consecutive_incorrect: consecutiveIncorrect,
      message: `Critical weakness in ${concept.concept_name} (only ${masteryScore}% mastery)`
    });
    srsRecs.summary.critical_count++;
  }

  // Needs different approach
  if (needsDifferentApproach || consecutiveIncorrect >= 3) {
    srsRecs.struggling_concepts.push({
      concept: concept.concept_name,
      mastery_score: masteryScore,
      consecutive_incorrect: consecutiveIncorrect,
      needs_different_approach: needsDifferentApproach,
      message: `Struggling with ${concept.concept_name}. Current method isn't working - try a different approach.`
    });
    srsRecs.summary.struggling_count++;
  }

  // Mastered concepts (mastery >= 80)
  if (masteryScore >= 80) {
    srsRecs.mastered_concepts.push({
      concept: concept.concept_name,
      mastery_score: masteryScore,
      consecutive_correct: concept.consecutive_correct || 0
    });
    srsRecs.summary.mastered_count++;
  }
});

// ===================================
// 2. GENERATE ACTION ITEMS
// ===================================

// Critical concepts need immediate attention
if (srsRecs.critical_concepts.length > 0) {
  srsRecs.action_items.push({
    priority: 'urgent',
    action: `Focus on these critical weaknesses first: ${srsRecs.critical_concepts.map(c => c.concept).join(', ')}`,
    reason: 'These concepts have very low mastery scores and need immediate attention.'
  });
}

// Tomorrow's review
if (srsRecs.review_tomorrow.length > 0) {
  const highPriority = srsRecs.review_tomorrow.filter(c => c.priority === 'high');
  if (highPriority.length > 0) {
    srsRecs.action_items.push({
      priority: 'high',
      action: `Tomorrow, review these concepts: ${highPriority.map(c => c.concept).join(', ')}`,
      reason: 'These are due for review tomorrow and need reinforcement.'
    });
  }
}

// Struggling concepts need different approach
if (srsRecs.struggling_concepts.length > 0) {
  srsRecs.action_items.push({
    priority: 'high',
    action: `Try a different learning method for: ${srsRecs.struggling_concepts.map(c => c.concept).join(', ')}`,
    reason: 'Current approach isn\'t working. Consider watching videos, getting examples, or asking for help.'
  });
}

// Celebrate mastery
if (srsRecs.mastered_concepts.length > 0) {
  srsRecs.action_items.push({
    priority: 'low',
    action: `Great job mastering: ${srsRecs.mastered_concepts.map(c => c.concept).join(', ')}`,
    reason: 'These concepts are well understood. Keep practicing occasionally to maintain.'
  });
}

// ===================================
// 3. SUMMARY MESSAGE
// ===================================
let summaryMessage = '';

if (srsRecs.summary.critical_count > 0) {
  summaryMessage += `⚠️ ${srsRecs.summary.critical_count} critical weakness(es). `;
}

if (srsRecs.summary.concepts_due_soon > 0) {
  summaryMessage += `📅 ${srsRecs.summary.concepts_due_soon} concept(s) due for review tomorrow. `;
}

if (srsRecs.summary.mastered_count > 0) {
  summaryMessage += `✅ ${srsRecs.summary.mastered_count} concept(s) mastered! `;
}

srsRecs.summary.message = summaryMessage.trim();

// ===================================
// OUTPUT
// ===================================
return {
  json: {
    srs_recommendations: srsRecs
  }
};
