import { supabase } from './supabase';

// Get student by display name
export const getStudentByName = async (displayName) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .ilike('display_name', displayName)
    .single();

  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }

  return data;
};

// Get student by ID
export const getStudentById = async (studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }

  return data;
};

// Get active questions for a student
export const getActiveQuestions = async (studentId) => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('student_id', studentId)
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }

  return data || [];
};

// Get today's leaderboard
export const getTodaysLeaderboard = async () => {
  const today = new Date().toISOString().split('T')[0];
  console.log('[getTodaysLeaderboard] Fetching leaderboard for date:', today);

  const { data, error } = await supabase
    .from('leaderboard')
    .select(`
      *,
      students (
        display_name
      )
    `)
    .eq('quiz_date', today)
    .order('rank', { ascending: true });

  if (error) {
    console.error('[getTodaysLeaderboard] Error fetching leaderboard:', error);
    return [];
  }

  console.log('[getTodaysLeaderboard] Raw data from DB:', data);
  return data || [];
};

// Subscribe to leaderboard changes (real-time)
export const subscribeToLeaderboard = (callback) => {
  const today = new Date().toISOString().split('T')[0];

  const subscription = supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leaderboard',
        filter: `quiz_date=eq.${today}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

// Update or insert leaderboard entry
export const updateLeaderboard = async (studentId, quizData) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('[Leaderboard] Updating leaderboard for student:', studentId, 'Date:', today);
    console.log('[Leaderboard] Quiz data:', quizData);

    // First, check if student already has an entry today
    const { data: existing, error: fetchError } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('student_id', studentId)
      .eq('quiz_date', today)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Leaderboard] Error fetching existing entry:', fetchError);
      throw fetchError;
    }

    console.log('[Leaderboard] Existing entry:', existing);

    const leaderboardEntry = {
      student_id: studentId,
      quiz_date: today,
      score: quizData.score,
      time_taken_seconds: quizData.time_taken_seconds,
      rank: 999 // Temporary rank, will be recalculated
    };

    console.log('[Leaderboard] Entry to save:', leaderboardEntry);

    let result;
    if (existing) {
      console.log('[Leaderboard] Existing entry found, comparing scores:', quizData.score, 'vs', existing.score);
      // Update existing entry if new score is better
      if (quizData.score > existing.score) {
        console.log('[Leaderboard] New score is better, updating...');
        const { data, error } = await supabase
          .from('leaderboard')
          .update(leaderboardEntry)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('[Leaderboard] Error updating entry:', error);
          throw error;
        }
        console.log('[Leaderboard] Entry updated successfully:', data);
        result = data;
      } else {
        console.log('[Leaderboard] Keeping existing score (better or equal)');
        result = existing;
      }
    } else {
      console.log('[Leaderboard] No existing entry, inserting new...');
      // Insert new entry
      const { data, error } = await supabase
        .from('leaderboard')
        .insert([leaderboardEntry])
        .select()
        .single();

      if (error) {
        console.error('[Leaderboard] Error inserting entry:', error);
        throw error;
      }
      console.log('[Leaderboard] Entry inserted successfully:', data);
      result = data;
    }

    // Recalculate ranks for today
    console.log('[Leaderboard] Recalculating ranks...');
    await recalculateRanks(today);
    console.log('[Leaderboard] Ranks recalculated successfully');

    return { success: true, data: result };
  } catch (error) {
    console.error('[Leaderboard] Error updating leaderboard:', error);
    return { success: false, error: error.message };
  }
};

// Recalculate ranks for a specific date
const recalculateRanks = async (date) => {
  try {
    // Get all entries for the date, ordered by score
    const { data: entries, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('quiz_date', date)
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true });

    if (error) throw error;

    if (!entries || entries.length === 0) return;

    // Update ranks
    const updates = entries.map((entry, index) => ({
      id: entry.id,
      rank: index + 1
    }));

    // Update each entry with new rank
    for (const update of updates) {
      await supabase
        .from('leaderboard')
        .update({ rank: update.rank })
        .eq('id', update.id);
    }
  } catch (error) {
    console.error('Error recalculating ranks:', error);
  }
};

// Get total points accumulated by student across all quizzes
export const getTotalPoints = async (studentId) => {
  try {
    console.log('[getTotalPoints] Fetching total points for student:', studentId);

    const { data, error } = await supabase
      .from('quiz_results')
      .select('total_score')
      .eq('student_id', studentId);

    if (error) {
      console.error('[getTotalPoints] Error fetching points:', error);
      return 0;
    }

    // Sum all total_score values
    const total = (data || []).reduce((sum, result) => sum + (result.total_score || 0), 0);
    console.log('[getTotalPoints] Total points calculated:', total);

    return total;
  } catch (error) {
    console.error('[getTotalPoints] Error:', error);
    return 0;
  }
};
