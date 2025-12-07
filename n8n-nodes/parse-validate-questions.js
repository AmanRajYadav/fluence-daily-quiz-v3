// Parse and validate Gemini-generated questions
// Expected input: Gemini API response with questions JSON

const geminiResponse = $input.first().json;
const dataProcessing = $('Data Processing').first().json;

// Extract questions from Gemini response
let questionsData;
try {
  // Gemini might return text with JSON inside
  const responseText = geminiResponse.text || geminiResponse.content || JSON.stringify(geminiResponse);

  // Try to parse if it's a string
  if (typeof responseText === 'string') {
    // Remove markdown code blocks if present
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    questionsData = JSON.parse(cleanedText);
  } else {
    questionsData = responseText;
  }
} catch (error) {
  throw new Error(`Failed to parse Gemini response: ${error.message}`);
}

// Extract questions array (handle different response structures)
let questions = questionsData.questions || questionsData.quiz?.questions || questionsData;

if (!Array.isArray(questions)) {
  throw new Error('Questions is not an array');
}

if (questions.length === 0) {
  throw new Error('No questions generated');
}

console.log(`✅ Parsed ${questions.length} questions`);

// Validate and prepare each question for database insertion
const validatedQuestions = questions.map((q, index) => {
  // Validate required fields
  if (!q.question && !q.question_text) {
    throw new Error(`Question ${index + 1} missing question text`);
  }
  if (!q.correct && !q.correct_answer) {
    throw new Error(`Question ${index + 1} missing correct answer`);
  }
  if (!q.questionType && !q.question_type) {
    throw new Error(`Question ${index + 1} missing question type`);
  }

  // Normalize field names (Gemini might use different formats)
  const questionText = q.question || q.question_text;
  const correctAnswer = q.correct || q.correct_answer;
  const questionType = q.questionType || q.question_type || 'mcq';
  const options = q.options || null;
  const conceptTested = q.topic || q.concept_tested || q.concept || 'General';
  const difficulty = q.difficulty || 'medium';
  const explanation = q.explanation || '';

  // Validate question type
  const validTypes = ['mcq', 'true_false', 'short_answer', 'voice', 'fill_blank', 'match'];
  if (!validTypes.includes(questionType)) {
    console.log(`⚠️ Invalid question type "${questionType}" for Q${index + 1}, defaulting to "mcq"`);
  }

  return {
    student_id: dataProcessing.student_id,
    question_text: questionText,
    question_type: questionType,
    options: options,  // Will be converted to JSONB by Supabase
    correct_answer: correctAnswer,
    concept_tested: conceptTested,
    difficulty: difficulty,
    explanation: explanation,
    active: true,
    created_date: new Date().toISOString().split('T')[0]
  };
});

console.log('=== VALIDATED QUESTIONS ===');
console.log(`Total Questions: ${validatedQuestions.length}`);
console.log(`Student ID: ${dataProcessing.student_id}`);
console.log(`Student Name: ${dataProcessing.student_name}`);
console.log('Question Types:', validatedQuestions.map(q => q.question_type).join(', '));

// Return array of questions (one item per question for loop processing)
return validatedQuestions.map(q => ({ json: q }));
