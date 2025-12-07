// N8N Code Node: Validate and Fix Match Questions
// Place this AFTER "Parse & Validate Questions" node, BEFORE "Loop"

const questions = $input.first().json.questions;

// Function to detect and fix duplicate match options
function fixMatchQuestion(question) {
  if (question.question_type !== 'match') {
    return question; // Not a match question, return as-is
  }

  const options = question.options;
  if (!options || !options.left || !options.right) {
    return question; // Invalid structure, return as-is
  }

  // Check for duplicates in right column
  const rightSet = new Set(options.right);

  if (rightSet.size !== options.right.length) {
    // Duplicates found!
    console.log(`⚠️ Duplicate found in match question: "${question.question_text}"`);
    console.log(`Original right options:`, options.right);

    // Strategy: Make duplicates unique by adding index
    const seen = {};
    const fixedRight = options.right.map((item, index) => {
      if (seen[item]) {
        // This is a duplicate, add suffix
        seen[item]++;
        return `${item} (${seen[item]})`;
      } else {
        seen[item] = 1;
        return item;
      }
    });

    console.log(`Fixed right options:`, fixedRight);

    return {
      ...question,
      options: {
        ...options,
        right: fixedRight
      }
    };
  }

  return question; // No duplicates, return as-is
}

// Process all questions
const fixedQuestions = questions.map(fixMatchQuestion);

// Count how many were fixed
const fixedCount = fixedQuestions.filter((q, i) =>
  q !== questions[i] && q.question_type === 'match'
).length;

console.log(`✅ Validated ${questions.length} questions, fixed ${fixedCount} match questions`);

return [{
  json: {
    questions: fixedQuestions
  }
}];
