/**
 * Student Service
 *
 * Service layer for student-specific data fetching and operations
 * Used by Student Dashboard to display:
 * - Performance metrics
 * - Quiz history
 * - Concept mastery
 * - Leaderboard position
 * - Streaks and achievements
 */

import { supabase } from './supabase';

/**
 * Get student's current streak count
 * @param {string} studentId - Student UUID
 * @returns {Promise<number>} Current streak count
 */
export const getCurrentStreak = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('streak_count')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    return data[0].streak_count || 0;
  } catch (error) {
    console.error('[getCurrentStreak] Error:', error);
    return 0;
  }
};

/**
 * Get total points earned by student
 * @param {string} studentId - Student UUID
 * @returns {Promise<number>} Total points
 */
export const getTotalPoints = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('score')
      .eq('student_id', studentId);

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    // Sum all scores
    const total = data.reduce((sum, result) => sum + result.score, 0);
    return Math.round(total);
  } catch (error) {
    console.error('[getTotalPoints] Error:', error);
    return 0;
  }
};

/**
 * Get quiz history for student (last N quizzes)
 * @param {string} studentId - Student UUID
 * @param {number} limit - Number of quizzes to return (default: 10)
 * @returns {Promise<Array>} Array of quiz results
 */
export const getQuizHistory = async (studentId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('student_id', studentId)
      .order('quiz_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[getQuizHistory] Error:', error);
    return [];
  }
};

/**
 * Get concept mastery data for student
 * @param {string} studentId - Student UUID
 * @returns {Promise<Array>} Array of concept mastery records
 */
export const getConceptMastery = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('concept_mastery')
      .select('*')
      .eq('student_id', studentId)
      .order('mastery_score', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[getConceptMastery] Error:', error);
    return [];
  }
};

/**
 * Get student's leaderboard position (today)
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} {rank, totalStudents, score, percentile}
 */
export const getLeaderboardPosition = async (studentId) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's leaderboard
    const { data: leaderboard, error } = await supabase
      .from('leaderboard')
      .select('student_id, rank, score')
      .eq('quiz_date', today)
      .order('rank', { ascending: true });

    if (error) throw error;

    if (!leaderboard || leaderboard.length === 0) {
      return {
        rank: null,
        totalStudents: 0,
        score: 0,
        percentile: 0
      };
    }

    // Find student's position
    const studentEntry = leaderboard.find(entry => entry.student_id === studentId);

    if (!studentEntry) {
      return {
        rank: null,
        totalStudents: leaderboard.length,
        score: 0,
        percentile: 0
      };
    }

    const percentile = Math.round(((leaderboard.length - studentEntry.rank + 1) / leaderboard.length) * 100);

    return {
      rank: studentEntry.rank,
      totalStudents: leaderboard.length,
      score: studentEntry.score,
      percentile: percentile
    };
  } catch (error) {
    console.error('[getLeaderboardPosition] Error:', error);
    return {
      rank: null,
      totalStudents: 0,
      score: 0,
      percentile: 0
    };
  }
};

/**
 * Get performance stats for student
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Performance statistics
 */
export const getPerformanceStats = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('score, time_taken_seconds, quiz_date')
      .eq('student_id', studentId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        averageTime: 0,
        highestScore: 0,
        lastQuizDate: null,
        weeklyAverage: 0,
        improvement: 0
      };
    }

    // Calculate stats
    const totalQuizzes = data.length;
    const averageScore = Math.round(data.reduce((sum, q) => sum + q.score, 0) / totalQuizzes);
    const averageTime = Math.round(data.reduce((sum, q) => sum + (q.time_taken_seconds || 0), 0) / totalQuizzes);
    const highestScore = Math.max(...data.map(q => q.score));
    const lastQuizDate = data[0]?.quiz_date;

    // Weekly average (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const weeklyQuizzes = data.filter(q => q.quiz_date >= sevenDaysAgoStr);
    const weeklyAverage = weeklyQuizzes.length > 0
      ? Math.round(weeklyQuizzes.reduce((sum, q) => sum + q.score, 0) / weeklyQuizzes.length)
      : 0;

    // Improvement (week-over-week change)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

    const lastWeekQuizzes = data.filter(q => q.quiz_date >= sevenDaysAgoStr);
    const previousWeekQuizzes = data.filter(q => q.quiz_date >= twoWeeksAgoStr && q.quiz_date < sevenDaysAgoStr);

    const lastWeekAvg = lastWeekQuizzes.length > 0
      ? lastWeekQuizzes.reduce((sum, q) => sum + q.score, 0) / lastWeekQuizzes.length
      : 0;

    const previousWeekAvg = previousWeekQuizzes.length > 0
      ? previousWeekQuizzes.reduce((sum, q) => sum + q.score, 0) / previousWeekQuizzes.length
      : 0;

    const improvement = previousWeekAvg > 0 ? Math.round(lastWeekAvg - previousWeekAvg) : 0;

    return {
      totalQuizzes,
      averageScore,
      averageTime,
      highestScore,
      lastQuizDate,
      weeklyAverage,
      improvement
    };
  } catch (error) {
    console.error('[getPerformanceStats] Error:', error);
    return {
      totalQuizzes: 0,
      averageScore: 0,
      averageTime: 0,
      highestScore: 0,
      lastQuizDate: null,
      weeklyAverage: 0,
      improvement: 0
    };
  }
};

/**
 * Get today's quiz availability
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} {available, questionsCount, completedToday}
 */
export const getTodayQuizStatus = async (studentId) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if quiz already completed today
    const { data: todayQuiz, error: quizError } = await supabase
      .from('quiz_results')
      .select('id')
      .eq('student_id', studentId)
      .eq('quiz_date', today)
      .limit(1);

    if (quizError) throw quizError;

    const completedToday = todayQuiz && todayQuiz.length > 0;

    // Get available questions count
    const { count, error: countError } = await supabase
      .from('quiz_questions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('active', true);

    if (countError) throw countError;

    return {
      available: !completedToday && count > 0,
      questionsCount: count || 0,
      completedToday
    };
  } catch (error) {
    console.error('[getTodayQuizStatus] Error:', error);
    return {
      available: false,
      questionsCount: 0,
      completedToday: false
    };
  }
};

/**
 * Get weak concepts that need review
 * @param {string} studentId - Student UUID
 * @param {number} threshold - Mastery score threshold (default: 60)
 * @param {number} limit - Max concepts to return (default: 5)
 * @returns {Promise<Array>} Array of weak concepts
 */
export const getWeakConcepts = async (studentId, threshold = 60, limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('concept_mastery')
      .select('*')
      .eq('student_id', studentId)
      .lt('mastery_score', threshold)
      .order('mastery_score', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[getWeakConcepts] Error:', error);
    return [];
  }
};

/**
 * Get strong concepts (high mastery)
 * @param {string} studentId - Student UUID
 * @param {number} threshold - Mastery score threshold (default: 80)
 * @param {number} limit - Max concepts to return (default: 5)
 * @returns {Promise<Array>} Array of strong concepts
 */
export const getStrongConcepts = async (studentId, threshold = 80, limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('concept_mastery')
      .select('*')
      .eq('student_id', studentId)
      .gte('mastery_score', threshold)
      .order('mastery_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[getStrongConcepts] Error:', error);
    return [];
  }
};

/**
 * Get upcoming SRS reviews for student
 * @param {string} studentId - Student UUID
 * @param {number} daysAhead - How many days to look ahead (default: 7)
 * @returns {Promise<Array>} Array of concepts due for review
 */
export const getUpcomingReviews = async (studentId, daysAhead = 7) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('concept_mastery')
      .select('*')
      .eq('student_id', studentId)
      .gte('next_review_date', todayStr)
      .lte('next_review_date', futureDateStr)
      .order('next_review_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[getUpcomingReviews] Error:', error);
    return [];
  }
};

/**
 * Get all student dashboard data in one call (optimized)
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} All dashboard data
 */
export const getStudentDashboardData = async (studentId) => {
  try {
    console.log('[getStudentDashboardData] Fetching all data for student:', studentId);

    // Fetch all data in parallel
    const [
      streak,
      points,
      quizHistory,
      leaderboardPosition,
      stats,
      quizStatus,
      weakConcepts,
      strongConcepts,
      upcomingReviews
    ] = await Promise.all([
      getCurrentStreak(studentId),
      getTotalPoints(studentId),
      getQuizHistory(studentId, 10),
      getLeaderboardPosition(studentId),
      getPerformanceStats(studentId),
      getTodayQuizStatus(studentId),
      getWeakConcepts(studentId, 60, 5),
      getStrongConcepts(studentId, 80, 5),
      getUpcomingReviews(studentId, 7)
    ]);

    console.log('[getStudentDashboardData] Data fetched successfully');

    return {
      streak,
      points,
      quizHistory,
      leaderboardPosition,
      stats,
      quizStatus,
      weakConcepts,
      strongConcepts,
      upcomingReviews
    };
  } catch (error) {
    console.error('[getStudentDashboardData] Error:', error);
    throw error;
  }
};
