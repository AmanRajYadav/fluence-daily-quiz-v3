// ==========================================
// COMBINE SRS + NEW QUESTIONS
// FIXED: Filters out empty SRS rows to prevent null question_text errors
// ==========================================

// Get SRS questions from database - FILTER OUT EMPTY ROWS
const srsQuestions = $('Get SRS Questions').all()
  .filter(item => item.json && item.json.question_text) // Only keep items with actual question text
  .map(item => ({
    json: {
      institution_id: $('Resolve Student ID').first().json.institution_id,
      class_id: $('Resolve Student ID').first().json.class_id,
      student_id: $('Resolve Student ID').first().json.student_id,
      question_text: item.json.question_text,
      question_type: item.json.question_type,
      options: item.json.options,
      correct_answer: item.json.correct_answer,
      concept_name: item.json.concept_name,
      difficulty_level: item.json.difficulty_level,
      explanation: item.json.explanation,
      active: true,
      created_date: new Date().toISOString().split('T')[0]
    }
  }));

// Get new questions from Gemini (from Parse & Validate Questions 2)
const newQuestions = $input.all();

// Combine arrays
const allQuestions = [...srsQuestions, ...newQuestions];

console.log('=== QUESTION COMBINATION ===');
console.log(`SRS (valid): ${srsQuestions.length}, New: ${newQuestions.length}, Total: ${allQuestions.length}`);

// Validate - allow flexibility for edge cases
// When no SRS: expect ~30 new questions
// When SRS exists: expect SRS + new = ~30
if (allQuestions.length < 20) {
  throw new Error(`Too few questions: ${allQuestions.length}. Expected at least 20.`);
}

if (allQuestions.length > 35) {
  throw new Error(`Too many questions: ${allQuestions.length}. Expected max 35.`);
}

// If we have more than 30, trim to 30 (take all SRS + trim new questions)
if (allQuestions.length > 30) {
  console.log(`Trimming from ${allQuestions.length} to 30 questions`);
  return allQuestions.slice(0, 30);
}

// If we have less than 30 but more than 20, that's acceptable
// (happens when SRS is empty and LLM generates exactly what was asked)
if (allQuestions.length < 30) {
  console.log(`Note: Only ${allQuestions.length} questions (less than 30, but acceptable)`);
}

return allQuestions;
