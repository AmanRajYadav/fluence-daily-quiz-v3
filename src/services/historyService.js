import { supabase } from './supabase';

// Get quiz history for a student
export const getQuizHistory = async (studentId, filters = {}) => {
  let query = supabase
    .from('quiz_history')
    .select('*')
    .eq('student_id', studentId)
    .order('quiz_date', { ascending: false });

  if (filters.subject) {
    query = query.eq('subject', filters.subject);
  }

  if (filters.startDate) {
    query = query.gte('quiz_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('quiz_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching quiz history:', error);
    return [];
  }

  return data || [];
};

// Get notes history for a student
export const getNotesHistory = async (studentId, filters = {}) => {
  let query = supabase
    .from('notes_history')
    .select('*')
    .eq('student_id', studentId)
    .order('note_date', { ascending: false });

  if (filters.subject) {
    query = query.eq('subject', filters.subject);
  }

  if (filters.startDate) {
    query = query.gte('note_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('note_date', filters.endDate);
  }

  const { data, error} = await query;

  if (error) {
    console.error('Error fetching notes history:', error);
    return [];
  }

  return data || [];
};

// Get questions for a specific date (for replay)
export const getQuestionsByDate = async (studentId, date) => {
  // Query quiz_results to get the questions from that specific quiz attempt
  const { data: quizData, error: quizError } = await supabase
    .from('quiz_results')
    .select('answers_json')
    .eq('student_id', studentId)
    .eq('quiz_date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (quizError || !quizData?.answers_json?.questions) {
    console.error('Error fetching quiz questions:', quizError);

    // Fallback: Try to get questions that were active around that date
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('student_id', studentId)
      .lte('created_at', `${date}T23:59:59`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (fallbackError) {
      console.error('Error fetching fallback questions:', fallbackError);
      return [];
    }

    return fallbackData || [];
  }

  // Convert answers_json questions back to quiz_questions format
  const questions = quizData.answers_json.questions.map((q, index) => ({
    id: q.question_id || `replay-${index}`,
    student_id: studentId,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options || null,
    correct_answer: q.correct_answer,
    concept_tested: q.concept_tested || null,
    difficulty_level: q.difficulty_level || 'medium',
    explanation: q.explanation || null,
    active: false, // Mark as replay
    created_at: date
  }));

  console.log('[getQuestionsByDate] Reconstructed questions:', questions.slice(0, 2)); // Log first 2 for debugging

  // ✅ SAFEGUARD: If any questions are missing options or explanations, fetch from quiz_questions table
  const questionsNeedingData = questions.filter(q =>
    ((q.question_type === 'mcq' || q.question_type === 'match') && !q.options) || !q.explanation
  );

  if (questionsNeedingData.length > 0) {
    console.warn('[getQuestionsByDate] Some questions missing options/explanations, fetching from quiz_questions...');

    // Get question IDs that need data
    const questionIds = questionsNeedingData.map(q => q.id).filter(id => !id.startsWith('replay-'));

    if (questionIds.length > 0) {
      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('id, options, explanation')
        .in('id', questionIds);

      if (questionData) {
        // Merge options and explanations back into questions
        questions.forEach(q => {
          const match = questionData.find(qd => qd.id === q.id);
          if (match) {
            if (!q.options && match.options) {
              q.options = match.options;
              console.log(`[getQuestionsByDate] ✅ Retrieved options for question ${q.id}`);
            }
            if (!q.explanation && match.explanation) {
              q.explanation = match.explanation;
              console.log(`[getQuestionsByDate] ✅ Retrieved explanation for question ${q.id}`);
            }
          }
        });
      }
    }
  }

  return questions;
};

// Save quiz to history after completion
export const saveQuizToHistory = async (historyData) => {
  try {
    const { data, error } = await supabase
      .from('quiz_history')
      .insert([historyData])
      .select()
      .single();

    if (error) {
      console.error('Error saving quiz to history:', error);
      return {
        success: false,
        error: error.message || 'Failed to save quiz to history'
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error saving quiz to history:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error occurred while saving to history'
    };
  }
};
