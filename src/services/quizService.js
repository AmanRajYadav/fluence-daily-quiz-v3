import { supabase } from './supabase';
import { getCurrentSession } from './authService';

/**
 * Get active questions for current student's class
 * Handles both personal tutoring (student_id) and group class (class_id)
 */
export const getActiveQuestions = async () => {
  const session = getCurrentSession();
  if (!session) {
    throw new Error('No active session. Please login first.');
  }

  console.log('[getActiveQuestions] Fetching for:', {
    user_id: session.user_id,
    institution_id: session.institution_id,
    class_id: session.class_id
  });

  try {
    // Query active questions for this institution and class
    // Personal tutoring: questions have student_id matching user_id
    // Group class: questions have class_id matching session.class_id (and student_id is NULL)

    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('institution_id', session.institution_id)
      .eq('active', true)
      // Match either:
      // - student_id = user_id (personal tutoring)
      // - class_id = session.class_id AND student_id IS NULL (group class)
      .or(`student_id.eq.${session.user_id},and(class_id.eq.${session.class_id},student_id.is.null)`)
      .order('created_at', { ascending: false })  // Most recent first
      .limit(30);  // Max 30 questions per quiz

    if (error) {
      console.error('[getActiveQuestions] Error:', error);
      throw error;
    }

    console.log('[getActiveQuestions] Fetched', data?.length || 0, 'questions');

    if (!data || data.length === 0) {
      console.warn('[getActiveQuestions] No active questions found. Has a class been processed today?');
    }

    return data || [];
  } catch (error) {
    console.error('[getActiveQuestions] Exception:', error);
    throw error;
  }
};

/**
 * Get student by username (V3 uses username, not display_name)
 */
export const getStudentByName = async (username) => {
  const session = getCurrentSession();

  const { data, error} = await supabase
    .from('students')
    .select('*')
    .eq('institution_id', session?.institution_id)
    .ilike('username', username)
    .single();

  if (error) {
    console.error('[getStudentByName] Error:', error);
    return null;
  }

  return data;
};

/**
 * Get student by ID
 */
export const getStudentById = async (studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error) {
    console.error('[getStudentById] Error:', error);
    return null;
  }

  return data;
};

/**
 * Get this week's leaderboard (V3 with institution filter)
 * Uses weekly_leaderboard table (Monday-Sunday accumulation)
 */
export const getTodaysLeaderboard = async () => {
  const session = getCurrentSession();

  if (!session) {
    console.error('[getTodaysLeaderboard] No session found');
    return [];
  }

  // Calculate this week's Monday (ISO week starts on Monday)
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Days since Monday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0, 0);
  // Format date in local timezone (not UTC) to avoid timezone conversion issues
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(monday.getDate()).padStart(2, '0');
  const weekStartDate = `${year}-${month}-${dayOfMonth}`;

  console.log('[getTodaysLeaderboard] Fetching weekly leaderboard for week starting:', weekStartDate);

  const { data, error } = await supabase
    .from('weekly_leaderboard')  // ✅ FIXED: Changed from 'leaderboard'
    .select(`
      *,
      students (
        username,
        full_name
      )
    `)
    .eq('week_start_date', weekStartDate)  // ✅ FIXED: Use week_start_date instead of quiz_date
    .eq('institution_id', session.institution_id)
    .order('rank', { ascending: true });

  if (error) {
    console.error('[getTodaysLeaderboard] Error:', error);
    return [];
  }

  console.log('[getTodaysLeaderboard] Fetched:', data?.length || 0, 'entries');
  return data || [];
};

// Subscribe to leaderboard changes (real-time)
// ✅ FIXED: Now uses weekly_leaderboard table
export const subscribeToLeaderboard = (callback) => {
  // Calculate this week's Monday (ISO week starts on Monday)
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Days since Monday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0, 0);
  // Format date in local timezone (not UTC) to avoid timezone conversion issues
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(monday.getDate()).padStart(2, '0');
  const weekStartDate = `${year}-${month}-${dayOfMonth}`;

  const subscription = supabase
    .channel('weekly-leaderboard-changes')  // ✅ FIXED: Updated channel name
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'weekly_leaderboard',  // ✅ FIXED: Changed from 'leaderboard'
        filter: `week_start_date=eq.${weekStartDate}`  // ✅ FIXED: Use week_start_date
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

/* ❌ DEPRECATED V2 FUNCTIONS - DO NOT USE
 * ========================================
 * The functions below are from V2 and reference the old 'leaderboard' table.
 *
 * V3 ARCHITECTURE CHANGE:
 * - N8N workflow now handles ALL leaderboard updates (not the frontend)
 * - Uses 'weekly_leaderboard' table (Monday-Sunday accumulation)
 * - Ranks calculated via PostgreSQL window functions in n8n "Update Weekly Ranks" node
 *
 * FRONTEND ROLE IN V3:
 * - ✅ READ leaderboard data (via getTodaysLeaderboard, getWeeklyLeaderboard)
 * - ✅ SUBSCRIBE to real-time updates (via subscribeToLeaderboard)
 * - ❌ DO NOT WRITE to leaderboard tables (n8n handles this)
 *
 * N8N WORKFLOW HANDLES:
 * 1. Quiz submission → "Upsert Weekly Leaderboard" node
 * 2. Point accumulation → Adds total_points to weekly total
 * 3. Rank calculation → "Update Weekly Ranks" node (atomic SQL window function)
 *
 * If you need to modify leaderboard logic, edit the n8n workflow:
 * - File: n8n-workflows/Quiz-Results-Handler-V3.json
 * - Nodes: "Upsert Weekly Leaderboard", "Update Weekly Ranks"
 */

// ❌ DEPRECATED: Update or insert leaderboard entry (V2 - references non-existent 'leaderboard' table)
// export const updateLeaderboard = async (studentId, quizData) => {
//   try {
//     const today = new Date().toISOString().split('T')[0];
//     console.log('[Leaderboard] Updating leaderboard for student:', studentId, 'Date:', today);
//     console.log('[Leaderboard] Quiz data:', quizData);
//
//     // First, check if student already has an entry today
//     const { data: existing, error: fetchError } = await supabase
//       .from('leaderboard')  // ❌ V2 table doesn't exist
//       .select('*')
//       .eq('student_id', studentId)
//       .eq('quiz_date', today)
//       .maybeSingle();
//
//     if (fetchError && fetchError.code !== 'PGRST116') {
//       console.error('[Leaderboard] Error fetching existing entry:', fetchError);
//       throw fetchError;
//     }
//
//     console.log('[Leaderboard] Existing entry:', existing);
//
//     const leaderboardEntry = {
//       student_id: studentId,
//       quiz_date: today,
//       score: quizData.score,
//       time_taken_seconds: quizData.time_taken_seconds,
//       rank: 999 // Temporary rank, will be recalculated
//     };
//
//     console.log('[Leaderboard] Entry to save:', leaderboardEntry);
//
//     let result;
//     if (existing) {
//       console.log('[Leaderboard] Existing entry found, comparing scores:', quizData.score, 'vs', existing.score);
//       // Update existing entry if new score is better
//       if (quizData.score > existing.score) {
//         console.log('[Leaderboard] New score is better, updating...');
//         const { data, error } = await supabase
//           .from('leaderboard')  // ❌ V2 table doesn't exist
//           .update(leaderboardEntry)
//           .eq('id', existing.id)
//           .select()
//           .single();
//
//         if (error) {
//           console.error('[Leaderboard] Error updating entry:', error);
//           throw error;
//         }
//         console.log('[Leaderboard] Entry updated successfully:', data);
//         result = data;
//       } else {
//         console.log('[Leaderboard] Keeping existing score (better or equal)');
//         result = existing;
//       }
//     } else {
//       console.log('[Leaderboard] No existing entry, inserting new...');
//       // Insert new entry
//       const { data, error } = await supabase
//         .from('leaderboard')  // ❌ V2 table doesn't exist
//         .insert([leaderboardEntry])
//         .select()
//         .single();
//
//       if (error) {
//         console.error('[Leaderboard] Error inserting entry:', error);
//         throw error;
//       }
//       console.log('[Leaderboard] Entry inserted successfully:', data);
//       result = data;
//     }
//
//     // Recalculate ranks for today
//     console.log('[Leaderboard] Recalculating ranks...');
//     await recalculateRanks(today);
//     console.log('[Leaderboard] Ranks recalculated successfully');
//
//     return { success: true, data: result };
//   } catch (error) {
//     console.error('[Leaderboard] Error updating leaderboard:', error);
//     return { success: false, error: error.message };
//   }
// };

// ❌ DEPRECATED: Recalculate ranks for a specific date (V2 - inefficient loop-based approach)
// const recalculateRanks = async (date) => {
//   try {
//     // Get all entries for the date, ordered by score
//     const { data: entries, error } = await supabase
//       .from('leaderboard')  // ❌ V2 table doesn't exist
//       .select('*')
//       .eq('quiz_date', date)
//       .order('score', { ascending: false })
//       .order('time_taken_seconds', { ascending: true });
//
//     if (error) throw error;
//
//     if (!entries || entries.length === 0) return;
//
//     // Update ranks
//     const updates = entries.map((entry, index) => ({
//       id: entry.id,
//       rank: index + 1
//     }));
//
//     // ❌ INEFFICIENT: Loop-based updates (V2 approach)
//     // V3 uses single SQL query with ROW_NUMBER() window function
//     for (const update of updates) {
//       await supabase
//         .from('leaderboard')  // ❌ V2 table doesn't exist
//         .update({ rank: update.rank })
//         .eq('id', update.id);
//     }
//   } catch (error) {
//     console.error('Error recalculating ranks:', error);
//   }
// };

// Get total points accumulated by student across all quizzes
// ✅ FIXED: Now uses total_points column (not total_score)
export const getTotalPoints = async (studentId) => {
  try {
    const session = getCurrentSession();

    if (!session) {
      console.warn('[getTotalPoints] No session found');
      return 0;
    }

    console.log('[getTotalPoints] Fetching total points for student:', studentId);

    const { data, error } = await supabase
      .from('quiz_results')
      .select('total_points')  // ✅ FIXED: Changed from 'total_score'
      .eq('student_id', studentId)
      .eq('institution_id', session.institution_id);  // ✅ ADDED: V3 filter

    if (error) {
      console.error('[getTotalPoints] Error fetching points:', error);
      return 0;
    }

    // Sum all total_points values
    const total = (data || []).reduce((sum, result) => sum + (result.total_points || 0), 0);  // ✅ FIXED
    console.log('[getTotalPoints] Total points calculated:', total);

    return total;
  } catch (error) {
    console.error('[getTotalPoints] Error:', error);
    return 0;
  }
};

/**
 * V3: Get current week's Monday date (ISO week starts on Monday)
 */
const getCurrentWeekMonday = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Days since Monday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0, 0);
  // Format date in local timezone (not UTC) to avoid timezone conversion issues
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
};

/**
 * V3: Get weekly leaderboard (current week)
 */
export const getWeeklyLeaderboard = async () => {
  const weekStartDate = getCurrentWeekMonday();
  const session = getCurrentSession();

  if (!session) {
    console.error('[getWeeklyLeaderboard] No session found');
    return [];
  }

  console.log('[getWeeklyLeaderboard] Fetching for week starting:', weekStartDate);

  const { data, error } = await supabase
    .from('weekly_leaderboard')
    .select(`
      *,
      students (
        username,
        full_name
      )
    `)
    .eq('week_start_date', weekStartDate)
    .eq('institution_id', session.institution_id)
    .order('rank', { ascending: true });

  if (error) {
    console.error('[getWeeklyLeaderboard] Error:', error);
    return [];
  }

  console.log('[getWeeklyLeaderboard] Fetched:', data?.length || 0, 'entries');
  return data || [];
};

/**
 * V3: Subscribe to weekly leaderboard changes (real-time)
 */
export const subscribeToWeeklyLeaderboard = (callback) => {
  const weekStartDate = getCurrentWeekMonday();

  const subscription = supabase
    .channel('weekly-leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'weekly_leaderboard',
        filter: `week_start_date=eq.${weekStartDate}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};
