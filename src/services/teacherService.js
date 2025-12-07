/**
 * Teacher Service
 *
 * Provides all teacher-specific database queries.
 * All functions return empty arrays/objects on error for graceful degradation.
 *
 * IMPORTANT: Teachers can only access data from their institution (RLS enforced).
 */

import { supabase } from './supabase';

/**
 * Get all students for institution
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Array of student objects with class info
 */
export const getStudentsByInstitution = async (institutionId) => {
  try {
    console.log('[getStudentsByInstitution] Fetching students for institution:', institutionId);

    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('active', true)
      .order('full_name');

    if (studentsError) {
      console.error('[getStudentsByInstitution] Error fetching students:', studentsError);
      throw studentsError;
    }

    if (!students || students.length === 0) {
      console.log('[getStudentsByInstitution] No students found');
      return [];
    }

    // Get class enrollments for all students
    const studentIds = students.map(s => s.id);
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_class_enrollments')
      .select(`
        student_id,
        class_id,
        status,
        classes (
          id,
          class_name,
          subject,
          session
        )
      `)
      .in('student_id', studentIds)
      .eq('status', 'active');

    if (enrollmentsError) {
      console.error('[getStudentsByInstitution] Error fetching enrollments:', enrollmentsError);
      // Continue without class data rather than failing completely
    }

    // Get quiz statistics for all students
    const { data: quizStats } = await supabase
      .from('quiz_results')
      .select('student_id, score')
      .in('student_id', studentIds);

    // Calculate quiz count and average score per student
    const statsPerStudent = {};
    quizStats?.forEach(result => {
      if (!statsPerStudent[result.student_id]) {
        statsPerStudent[result.student_id] = {
          count: 0,
          totalScore: 0
        };
      }
      statsPerStudent[result.student_id].count++;
      statsPerStudent[result.student_id].totalScore += result.score || 0;
    });

    // Combine students with their class enrollments and quiz stats
    const studentsWithClasses = students.map(student => {
      const studentEnrollments = enrollments?.filter(e => e.student_id === student.id) || [];
      const classes = studentEnrollments.map(e => e.classes).filter(Boolean);

      // Get quiz stats
      const stats = statsPerStudent[student.id] || { count: 0, totalScore: 0 };
      const avgScore = stats.count > 0 ? stats.totalScore / stats.count : 0;

      return {
        ...student,
        classes: classes,
        // For backward compatibility, include first class as primary
        class_id: classes[0]?.id || null,
        class_name: classes[0]?.class_name || 'No class',
        subject: classes[0]?.subject || null,
        session: classes[0]?.session || null,
        // Quiz statistics
        quiz_count: stats.count,
        avg_score: Math.round(avgScore * 10) / 10  // Round to 1 decimal
      };
    });

    console.log('[getStudentsByInstitution] Fetched:', studentsWithClasses.length, 'students with class data and quiz stats');
    return studentsWithClasses;
  } catch (error) {
    console.error('[getStudentsByInstitution] Error:', error);
    return [];
  }
};

/**
 * Get detailed student information including quiz history and concept mastery
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object|null>} Student object with quiz_results and concept_mastery
 */
export const getStudentDetail = async (studentId) => {
  try {
    console.log('[getStudentDetail] Fetching details for student:', studentId);

    // Get student basic info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    if (!student) {
      console.warn('[getStudentDetail] Student not found:', studentId);
      return null;
    }

    // Get class enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_class_enrollments')
      .select(`
        student_id,
        class_id,
        status,
        classes (
          id,
          class_name,
          subject,
          session
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (enrollmentsError) {
      console.error('[getStudentDetail] Error fetching enrollments:', enrollmentsError);
    }

    // Get quiz history
    const { data: quizResults, error: quizError } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (quizError) {
      console.error('[getStudentDetail] Error fetching quiz results:', quizError);
    }

    // Get concept mastery
    const { data: conceptMastery, error: masteryError } = await supabase
      .from('concept_mastery')
      .select('*')
      .eq('student_id', studentId)
      .order('mastery_score', { ascending: true }); // Weakest concepts first

    if (masteryError) {
      console.error('[getStudentDetail] Error fetching concept mastery:', masteryError);
    }

    // Calculate total points
    const totalPoints = (quizResults || []).reduce((sum, result) => sum + (result.total_points || 0), 0);

    // Combine class enrollments
    const classes = enrollments?.map(e => e.classes).filter(Boolean) || [];

    // Combine all data
    const studentDetail = {
      ...student,
      classes: classes,
      // For backward compatibility, include first class as primary
      class_id: classes[0]?.id || null,
      class_name: classes[0]?.class_name || 'No class',
      subject: classes[0]?.subject || null,
      session: classes[0]?.session || null,
      quiz_results: quizResults || [],
      concept_mastery: conceptMastery || [],
      total_points: totalPoints,
      total_quizzes: quizResults?.length || 0
    };

    console.log('[getStudentDetail] Student detail loaded successfully');
    return studentDetail;
  } catch (error) {
    console.error('[getStudentDetail] Error:', error);
    return null;
  }
};

/**
 * Get all classes for institution
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Array of class objects
 */
export const getClassesByInstitution = async (institutionId) => {
  try {
    console.log('[getClassesByInstitution] Fetching classes for institution:', institutionId);

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('active', true)
      .order('class_name');

    if (error) {
      console.error('[getClassesByInstitution] Error:', error);
      throw error;
    }

    console.log('[getClassesByInstitution] Fetched:', data?.length || 0, 'classes');
    return data || [];
  } catch (error) {
    console.error('[getClassesByInstitution] Error:', error);
    return [];
  }
};

/**
 * Get dashboard statistics for institution
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Object>} Stats object with total_students, quizzes_this_week, avg_score, active_this_week
 */
export const getDashboardStats = async (institutionId) => {
  try {
    console.log('[getDashboardStats] Fetching stats for institution:', institutionId);

    // Calculate this week's Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekStartDate = monday.toISOString().split('T')[0];

    // Get total students count
    const { count: totalStudents, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('active', true);

    if (studentsError) throw studentsError;

    // Get this week's quiz results
    const { data: weeklyQuizzes, error: quizzesError } = await supabase
      .from('quiz_results')
      .select('student_id, score')
      .eq('institution_id', institutionId)
      .gte('quiz_date', weekStartDate);

    if (quizzesError) throw quizzesError;

    // Calculate stats
    const quizzesThisWeek = weeklyQuizzes?.length || 0;
    const avgScore = quizzesThisWeek > 0
      ? weeklyQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / quizzesThisWeek
      : 0;

    // Count unique students who took quiz this week
    const activeStudents = new Set(weeklyQuizzes?.map(q => q.student_id) || []).size;

    const stats = {
      total_students: totalStudents || 0,
      quizzes_this_week: quizzesThisWeek,
      avg_score: Math.round(avgScore * 10) / 10, // Round to 1 decimal
      active_this_week: activeStudents
    };

    console.log('[getDashboardStats] Stats calculated:', stats);
    return stats;
  } catch (error) {
    console.error('[getDashboardStats] Error:', error);
    return {
      total_students: 0,
      quizzes_this_week: 0,
      avg_score: 0,
      active_this_week: 0
    };
  }
};

/**
 * Get alerts for struggling students
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Array of alert objects
 */
export const getAlerts = async (institutionId) => {
  try {
    console.log('[getAlerts] Fetching alerts for institution:', institutionId);

    const alerts = [];

    // Calculate this week's Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekStartDate = monday.toISOString().split('T')[0];

    // 1. Find students who missed quizzes that were actually published this week
    // First, get all students with their class enrollments
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name, username')
      .eq('institution_id', institutionId)
      .eq('active', true);

    if (studentsError) throw studentsError;

    // Get student class enrollments
    const studentIds = allStudents?.map(s => s.id) || [];
    const { data: enrollments } = await supabase
      .from('student_class_enrollments')
      .select('student_id, class_id')
      .in('student_id', studentIds)
      .eq('status', 'active');

    // Get quizzes published this week (count quiz_questions created for each class)
    const { data: publishedQuizzes } = await supabase
      .from('quiz_questions')
      .select('class_id, created_date')
      .eq('institution_id', institutionId)
      .gte('created_date', weekStartDate)
      .eq('active', true);

    // Count published quizzes per class
    const quizzesPerClass = {};
    publishedQuizzes?.forEach(q => {
      const classId = q.class_id;
      if (classId) {
        quizzesPerClass[classId] = (quizzesPerClass[classId] || 0) + 1;
      }
    });

    // Get quiz results per student this week
    const { data: weeklyQuizzes, error: quizzesError } = await supabase
      .from('quiz_results')
      .select('student_id, class_id')
      .eq('institution_id', institutionId)
      .gte('quiz_date', weekStartDate);

    if (quizzesError) throw quizzesError;

    // Count quizzes taken per student
    const quizCounts = {};
    weeklyQuizzes?.forEach(q => {
      quizCounts[q.student_id] = (quizCounts[q.student_id] || 0) + 1;
    });

    // Only alert if student missed quizzes that were actually published for their class
    allStudents?.forEach(student => {
      const quizzesTaken = quizCounts[student.id] || 0;

      // Get student's class
      const enrollment = enrollments?.find(e => e.student_id === student.id);
      if (!enrollment) return;

      const expectedQuizzes = quizzesPerClass[enrollment.class_id] || 0;

      // Only alert if quizzes were published and student missed >50% of them
      if (expectedQuizzes > 0 && quizzesTaken < expectedQuizzes * 0.5) {
        const missedCount = expectedQuizzes - quizzesTaken;
        alerts.push({
          id: `missed-${student.id}`,
          student_id: student.id,
          student_name: student.full_name || student.username,
          type: 'missed_quizzes',
          message: `Missed ${missedCount} quiz${missedCount > 1 ? 'zes' : ''} this week (took ${quizzesTaken}/${expectedQuizzes})`,
          severity: 'high'
        });
      }
    });

    // 2. Find students with >20% score drop (compare this week vs last week)
    // Get last week's date range
    const lastMonday = new Date(monday);
    lastMonday.setDate(lastMonday.getDate() - 7);
    const lastWeekStartDate = lastMonday.toISOString().split('T')[0];
    const lastWeekEndDate = monday.toISOString().split('T')[0];

    // Get last week's scores
    const { data: lastWeekQuizzes, error: lastWeekError } = await supabase
      .from('quiz_results')
      .select('student_id, score')
      .eq('institution_id', institutionId)
      .gte('quiz_date', lastWeekStartDate)
      .lt('quiz_date', lastWeekEndDate);

    if (!lastWeekError && lastWeekQuizzes) {
      // Calculate average scores per student for each week
      const thisWeekAvg = {};
      const lastWeekAvg = {};

      weeklyQuizzes?.forEach(q => {
        if (!thisWeekAvg[q.student_id]) thisWeekAvg[q.student_id] = [];
        thisWeekAvg[q.student_id].push(q.score || 0);
      });

      lastWeekQuizzes?.forEach(q => {
        if (!lastWeekAvg[q.student_id]) lastWeekAvg[q.student_id] = [];
        lastWeekAvg[q.student_id].push(q.score || 0);
      });

      // Find students with score drops
      Object.keys(lastWeekAvg).forEach(studentId => {
        if (thisWeekAvg[studentId] && thisWeekAvg[studentId].length > 0) {
          const lastAvg = lastWeekAvg[studentId].reduce((a, b) => a + b, 0) / lastWeekAvg[studentId].length;
          const thisAvg = thisWeekAvg[studentId].reduce((a, b) => a + b, 0) / thisWeekAvg[studentId].length;
          const drop = lastAvg - thisAvg;

          if (drop > 20) {
            const student = allStudents?.find(s => s.id === studentId);
            if (student) {
              alerts.push({
                id: `drop-${studentId}`,
                student_id: studentId,
                student_name: student.full_name || student.username,
                type: 'score_drop',
                message: `Score dropped ${Math.round(drop)}% (from ${Math.round(lastAvg)}% to ${Math.round(thisAvg)}%)`,
                severity: 'medium'
              });
            }
          }
        }
      });
    }

    // 3. Find students with low concept mastery (<40%)
    const { data: lowMastery, error: masteryError } = await supabase
      .from('concept_mastery')
      .select('student_id, concept_name, mastery_score')
      .eq('institution_id', institutionId)
      .lt('mastery_score', 40);

    if (!masteryError && lowMastery) {
      // Group by student and count weak concepts
      const weakConceptCounts = {};
      lowMastery.forEach(cm => {
        if (!weakConceptCounts[cm.student_id]) {
          weakConceptCounts[cm.student_id] = [];
        }
        weakConceptCounts[cm.student_id].push(cm.concept_name);
      });

      // Alert if student has >5 weak concepts
      Object.keys(weakConceptCounts).forEach(studentId => {
        const weakConcepts = weakConceptCounts[studentId];
        if (weakConcepts.length > 5) {
          const student = allStudents?.find(s => s.id === studentId);
          if (student) {
            alerts.push({
              id: `mastery-${studentId}`,
              student_id: studentId,
              student_name: student.full_name || student.username,
              type: 'low_mastery',
              message: `Struggling with ${weakConcepts.length} concepts (mastery <40%)`,
              severity: 'low'
            });
          }
        }
      });
    }

    // Group alerts by student (combine multiple alerts for same student)
    const alertsByStudent = {};
    alerts.forEach(alert => {
      if (!alertsByStudent[alert.student_id]) {
        alertsByStudent[alert.student_id] = {
          id: alert.id,
          student_id: alert.student_id,
          student_name: alert.student_name,
          issues: [],
          severity: alert.severity // Will be updated to highest severity
        };
      }

      // Add this issue to the student's alert
      alertsByStudent[alert.student_id].issues.push({
        type: alert.type,
        message: alert.message,
        severity: alert.severity
      });

      // Update to highest severity
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const currentSeverity = severityOrder[alertsByStudent[alert.student_id].severity];
      const newSeverity = severityOrder[alert.severity];
      if (newSeverity > currentSeverity) {
        alertsByStudent[alert.student_id].severity = alert.severity;
      }
    });

    // Convert back to array and create combined messages
    const groupedAlerts = Object.values(alertsByStudent).map(alert => {
      // Use first issue as primary message, show count if multiple
      const primaryMessage = alert.issues[0].message;
      const additionalCount = alert.issues.length - 1;

      return {
        id: alert.id,
        student_id: alert.student_id,
        student_name: alert.student_name,
        type: alert.issues[0].type, // Primary issue type
        message: additionalCount > 0
          ? `${primaryMessage} (+${additionalCount} more issue${additionalCount > 1 ? 's' : ''})`
          : primaryMessage,
        severity: alert.severity,
        all_issues: alert.issues // Keep all issues for detail view
      };
    });

    // Sort by severity (high > medium > low)
    const severityOrder = { high: 3, medium: 2, low: 1 };
    groupedAlerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

    console.log('[getAlerts] Found', groupedAlerts.length, 'students with alerts (', alerts.length, 'total issues )');
    return groupedAlerts;
  } catch (error) {
    console.error('[getAlerts] Error:', error);
    return [];
  }
};

/**
 * Helper: Get current week's Monday date (ISO week starts on Monday)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getCurrentWeekMonday = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Days since Monday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  // Format date in local timezone (not UTC) to avoid timezone conversion issues
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
};

/**
 * QUESTION MANAGEMENT FUNCTIONS
 */

/**
 * Get questions for a class with optional filters
 * @param {string} institutionId - Institution UUID
 * @param {string} classId - Class UUID
 * @param {string|null} studentId - Student UUID (for personal tutoring, NULL for group class)
 * @param {Object} filters - Filter options
 * @param {string} filters.question_type - Filter by type
 * @param {string} filters.concept_name - Filter by concept
 * @param {string} filters.difficulty_level - Filter by difficulty
 * @param {boolean} filters.active - Filter by active status
 * @param {string} filters.search - Search in question text
 * @returns {Promise<Array>} Array of question objects
 */
export const getQuestionsByClass = async (institutionId, classId, studentId = null, filters = {}) => {
  try {
    console.log('[getQuestionsByClass] Fetching questions for class:', classId, 'student:', studentId, 'filters:', filters);

    let query = supabase
      .from('quiz_questions')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('class_id', classId);

    // Filter by student (personal tutoring) or group class
    if (studentId) {
      query = query.eq('student_id', studentId);
    } else {
      query = query.is('student_id', null); // Group class only
    }

    // Apply filters
    if (filters.question_type) {
      query = query.eq('question_type', filters.question_type);
    }

    if (filters.concept_name) {
      query = query.eq('concept_name', filters.concept_name);
    }

    if (filters.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level);
    }

    if (filters.active !== undefined && filters.active !== null) {
      query = query.eq('active', filters.active);
    }

    if (filters.search && filters.search.trim()) {
      query = query.ilike('question_text', `%${filters.search.trim()}%`);
    }

    // Order by created date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[getQuestionsByClass] Error:', error);
      throw error;
    }

    console.log('[getQuestionsByClass] Fetched:', data?.length || 0, 'questions');
    return data || [];
  } catch (error) {
    console.error('[getQuestionsByClass] Error:', error);
    return [];
  }
};

/**
 * Get unique concepts for filter dropdown
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Array of unique concept names
 */
export const getQuestionConcepts = async (institutionId) => {
  try {
    console.log('[getQuestionConcepts] Fetching concepts for institution:', institutionId);

    const { data, error } = await supabase
      .from('quiz_questions')
      .select('concept_name')
      .eq('institution_id', institutionId)
      .not('concept_name', 'is', null);

    if (error) {
      console.error('[getQuestionConcepts] Error:', error);
      throw error;
    }

    // Get unique values and sort alphabetically
    const unique = [...new Set(data.map(q => q.concept_name))].sort();

    console.log('[getQuestionConcepts] Found', unique.length, 'unique concepts');
    return unique;
  } catch (error) {
    console.error('[getQuestionConcepts] Error:', error);
    return [];
  }
};

/**
 * Update a question (teacher editing)
 * @param {string} questionId - Question UUID
 * @param {Object} updates - Fields to update
 * @param {string} teacherId - Teacher UUID (for edited_by field)
 * @returns {Promise<Object|null>} Updated question object
 */
export const updateQuestion = async (questionId, updates, teacherId) => {
  try {
    console.log('[updateQuestion] Updating question:', questionId);

    const { data, error } = await supabase
      .from('quiz_questions')
      .update({
        ...updates,
        edited_by: teacherId,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      console.error('[updateQuestion] Error:', error);
      throw error;
    }

    console.log('[updateQuestion] Question updated successfully');
    return data;
  } catch (error) {
    console.error('[updateQuestion] Error:', error);
    throw error; // Throw to show error to user
  }
};

/**
 * Toggle question active status
 * @param {string} questionId - Question UUID
 * @param {boolean} active - New active status
 * @returns {Promise<boolean>} Success status
 */
export const toggleQuestionActive = async (questionId, active) => {
  try {
    console.log('[toggleQuestionActive] Setting active status to:', active, 'for question:', questionId);

    const { error } = await supabase
      .from('quiz_questions')
      .update({
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId);

    if (error) {
      console.error('[toggleQuestionActive] Error:', error);
      throw error;
    }

    console.log('[toggleQuestionActive] Status updated successfully');
    return true;
  } catch (error) {
    console.error('[toggleQuestionActive] Error:', error);
    return false;
  }
};

/**
 * Get a single question by ID
 * @param {string} questionId - Question UUID
 * @returns {Promise<Object|null>} Question object
 */
export const getQuestionById = async (questionId) => {
  try {
    console.log('[getQuestionById] Fetching question:', questionId);

    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) {
      console.error('[getQuestionById] Error:', error);
      throw error;
    }

    console.log('[getQuestionById] Question fetched successfully');
    return data;
  } catch (error) {
    console.error('[getQuestionById] Error:', error);
    return null;
  }
};

/**
 * ANALYTICS FUNCTIONS
 */

/**
 * Get score trends over time
 * @param {string} institutionId - Institution UUID
 * @param {number} timeRange - Number of days (7, 30, or 90)
 * @returns {Promise<Array>} Array of {date, avg_score, quiz_count}
 */
export const getScoreTrends = async (institutionId, timeRange = 30) => {
  try {
    console.log('[getScoreTrends] Fetching score trends for institution:', institutionId, 'timeRange:', timeRange);

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('quiz_results')
      .select('quiz_date, score')
      .eq('institution_id', institutionId)
      .gte('quiz_date', startDateStr)
      .order('quiz_date');

    if (error) {
      console.error('[getScoreTrends] Error:', error);
      throw error;
    }

    // Group by date and calculate average
    const groupedByDate = {};
    data.forEach(result => {
      const date = result.quiz_date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { scores: [], count: 0 };
      }
      groupedByDate[date].scores.push(result.score);
      groupedByDate[date].count++;
    });

    // Convert to array format for charts
    const trends = Object.keys(groupedByDate).map(date => {
      const scores = groupedByDate[date].scores;
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return {
        date: date,
        avg_score: Math.round(avg),
        quiz_count: groupedByDate[date].count
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('[getScoreTrends] Fetched', trends.length, 'data points');
    return trends;
  } catch (error) {
    console.error('[getScoreTrends] Error:', error);
    return [];
  }
};

/**
 * Get concept analytics (weak concepts)
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Array of {concept_name, avg_mastery, student_count}
 */
export const getConceptAnalytics = async (institutionId) => {
  try {
    console.log('[getConceptAnalytics] Fetching concept analytics for institution:', institutionId);

    const { data, error } = await supabase
      .from('concept_mastery')
      .select('concept_name, mastery_score, student_id')
      .eq('institution_id', institutionId);

    if (error) {
      console.error('[getConceptAnalytics] Error:', error);
      throw error;
    }

    // Group by concept and calculate average mastery
    const groupedByConcept = {};
    data.forEach(cm => {
      if (!groupedByConcept[cm.concept_name]) {
        groupedByConcept[cm.concept_name] = { scores: [], students: new Set() };
      }
      groupedByConcept[cm.concept_name].scores.push(cm.mastery_score);
      groupedByConcept[cm.concept_name].students.add(cm.student_id);
    });

    // Convert to array and calculate averages
    const concepts = Object.keys(groupedByConcept).map(concept => {
      const scores = groupedByConcept[concept].scores;
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return {
        concept_name: concept,
        avg_mastery: Math.round(avg),
        student_count: groupedByConcept[concept].students.size
      };
    });

    // Sort by avg_mastery (ascending - weakest first)
    concepts.sort((a, b) => a.avg_mastery - b.avg_mastery);

    // Return top 10 weakest concepts
    const weakConcepts = concepts.slice(0, 10);

    console.log('[getConceptAnalytics] Fetched', concepts.length, 'concepts, returning top 10 weakest');
    return weakConcepts;
  } catch (error) {
    console.error('[getConceptAnalytics] Error:', error);
    return [];
  }
};

/**
 * Get engagement metrics
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Array of {name, value} for pie chart
 */
export const getEngagementMetrics = async (institutionId) => {
  try {
    console.log('[getEngagementMetrics] Fetching engagement metrics for institution:', institutionId);

    // Get all students
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('institution_id', institutionId)
      .eq('active', true);

    if (studentsError) {
      console.error('[getEngagementMetrics] Error fetching students:', studentsError);
      throw studentsError;
    }

    // Get students who took quiz in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: activeStudents, error: activeError } = await supabase
      .from('quiz_results')
      .select('student_id')
      .eq('institution_id', institutionId)
      .gte('quiz_date', sevenDaysAgoStr);

    if (activeError) {
      console.error('[getEngagementMetrics] Error fetching active students:', activeError);
      throw activeError;
    }

    // Count unique active students
    const activeStudentIds = new Set(activeStudents.map(r => r.student_id));
    const activeCount = activeStudentIds.size;
    const inactiveCount = allStudents.length - activeCount;

    const metrics = [
      { name: 'Active (Last 7 Days)', value: activeCount },
      { name: 'Inactive', value: inactiveCount }
    ];

    console.log('[getEngagementMetrics] Active:', activeCount, 'Inactive:', inactiveCount);
    return metrics;
  } catch (error) {
    console.error('[getEngagementMetrics] Error:', error);
    return [
      { name: 'Active (Last 7 Days)', value: 0 },
      { name: 'Inactive', value: 0 }
    ];
  }
};

/**
 * ALERT FUNCTIONS
 */

/**
 * Get all student alerts for institution
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Object>} {critical: [], warnings: [], positive: []}
 */
export const getStudentAlerts = async (institutionId) => {
  try {
    console.log('[getStudentAlerts] Fetching alerts for institution:', institutionId);

    const alerts = {
      critical: [],
      warnings: [],
      positive: []
    };

    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name, username')
      .eq('institution_id', institutionId)
      .eq('active', true);

    if (studentsError) throw studentsError;

    // Process each student
    for (const student of students) {
      // Check weekly performance
      const weeklyPerf = await getWeeklyPerformance(student.id);

      if (weeklyPerf.avg_score < 60 && weeklyPerf.quiz_count > 0) {
        alerts.critical.push({
          type: 'low_score',
          severity: 'critical',
          student_id: student.id,
          student_name: student.full_name,
          message: `Scoring ${Math.round(weeklyPerf.avg_score)}% average (last 7 days)`,
          value: weeklyPerf.avg_score,
          action: 'review_progress'
        });
      } else if (weeklyPerf.avg_score >= 60 && weeklyPerf.avg_score < 70 && weeklyPerf.quiz_count > 0) {
        alerts.warnings.push({
          type: 'moderate_score',
          severity: 'warning',
          student_id: student.id,
          student_name: student.full_name,
          message: `Scoring ${Math.round(weeklyPerf.avg_score)}% average`,
          value: weeklyPerf.avg_score,
          action: 'monitor'
        });
      }

      // Check inactivity
      const daysSinceQuiz = await getDaysSinceLastQuiz(student.id);

      // Handle new students (never took quiz)
      if (daysSinceQuiz === 999) {
        alerts.critical.push({
          type: 'never_started',
          severity: 'critical',
          student_id: student.id,
          student_name: student.full_name,
          message: `Has not started taking quizzes yet`,
          value: daysSinceQuiz,
          action: 'send_reminder'
        });
      } else if (daysSinceQuiz >= 7 && daysSinceQuiz < 30) {
        // Inactive for 7-30 days
        alerts.critical.push({
          type: 'inactive',
          severity: 'critical',
          student_id: student.id,
          student_name: student.full_name,
          message: `No quiz in ${daysSinceQuiz} days`,
          value: daysSinceQuiz,
          action: 'send_reminder'
        });
      } else if (daysSinceQuiz >= 30) {
        // Very inactive (30+ days)
        alerts.critical.push({
          type: 'very_inactive',
          severity: 'critical',
          student_id: student.id,
          student_name: student.full_name,
          message: `Inactive for ${daysSinceQuiz} days - requires attention`,
          value: daysSinceQuiz,
          action: 'send_reminder'
        });
      }

      // Check score delta (week-over-week change)
      const scoreDelta = await getScoreDelta(student.id);
      if (scoreDelta && scoreDelta < -20) {
        alerts.critical.push({
          type: 'declining_score',
          severity: 'critical',
          student_id: student.id,
          student_name: student.full_name,
          message: `Score dropped ${Math.abs(scoreDelta)}% this week`,
          value: scoreDelta,
          action: 'investigate'
        });
      }

      // Check struggling concepts
      const { data: conceptData } = await supabase
        .from('concept_mastery')
        .select('concept_name, mastery_score')
        .eq('student_id', student.id)
        .lt('mastery_score', 40);

      if (conceptData && conceptData.length >= 3) {
        alerts.critical.push({
          type: 'struggling_concepts',
          severity: 'critical',
          student_id: student.id,
          student_name: student.full_name,
          message: `Struggling with ${conceptData.length} concepts`,
          value: conceptData.length,
          action: 'assign_practice'
        });
      }

      // Check positive streaks
      const { data: latestQuiz } = await supabase
        .from('quiz_results')
        .select('streak_count')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestQuiz && latestQuiz[0] && latestQuiz[0].streak_count >= 7) {
        alerts.positive.push({
          type: 'long_streak',
          severity: 'positive',
          student_id: student.id,
          student_name: student.full_name,
          message: `${latestQuiz[0].streak_count} day streak! 🔥`,
          value: latestQuiz[0].streak_count,
          action: 'celebrate'
        });
      }

      // Check improvement
      if (scoreDelta && scoreDelta > 20) {
        alerts.positive.push({
          type: 'improving',
          severity: 'positive',
          student_id: student.id,
          student_name: student.full_name,
          message: `Improved ${scoreDelta}% this week!`,
          value: scoreDelta,
          action: 'encourage'
        });
      }
    }

    // Check concept-level alerts
    const conceptAlerts = await getConceptAlerts(institutionId);
    alerts.warnings.push(...conceptAlerts);

    console.log('[getStudentAlerts] Found:', alerts.critical.length, 'critical,', alerts.warnings.length, 'warnings,', alerts.positive.length, 'positive');
    return alerts;
  } catch (error) {
    console.error('[getStudentAlerts] Error:', error);
    return {critical: [], warnings: [], positive: []};
  }
};

/**
 * Get weekly performance for a student
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} {avg_score, quiz_count}
 */
export const getWeeklyPerformance = async (studentId) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('quiz_results')
      .select('score')
      .eq('student_id', studentId)
      .gte('quiz_date', sevenDaysAgoStr);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {avg_score: 0, quiz_count: 0};
    }

    const avg = data.reduce((sum, r) => sum + r.score, 0) / data.length;
    return {avg_score: avg, quiz_count: data.length};
  } catch (error) {
    console.error('[getWeeklyPerformance] Error:', error);
    return {avg_score: 0, quiz_count: 0};
  }
};

/**
 * Get days since last quiz
 * @param {string} studentId - Student UUID
 * @returns {Promise<number>} Days since last quiz
 */
export const getDaysSinceLastQuiz = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('quiz_date')
      .eq('student_id', studentId)
      .order('quiz_date', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return 999; // Never took quiz

    const lastQuizDate = new Date(data[0].quiz_date);
    const today = new Date();
    const diffTime = Math.abs(today - lastQuizDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error('[getDaysSinceLastQuiz] Error:', error);
    return 999;
  }
};

/**
 * Get score delta (week-over-week change)
 * @param {string} studentId - Student UUID
 * @returns {Promise<number|null>} Percentage change (+/-)
 */
export const getScoreDelta = async (studentId) => {
  try {
    const today = new Date();

    // This week (last 7 days)
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];

    // Last week (8-14 days ago)
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);
    const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];

    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    const lastWeekEndStr = lastWeekEnd.toISOString().split('T')[0];

    // Get this week's scores
    const { data: thisWeek } = await supabase
      .from('quiz_results')
      .select('score')
      .eq('student_id', studentId)
      .gte('quiz_date', thisWeekStartStr);

    // Get last week's scores
    const { data: lastWeek } = await supabase
      .from('quiz_results')
      .select('score')
      .eq('student_id', studentId)
      .gte('quiz_date', lastWeekStartStr)
      .lt('quiz_date', lastWeekEndStr);

    if (!thisWeek || thisWeek.length === 0 || !lastWeek || lastWeek.length === 0) {
      return null; // Not enough data
    }

    const thisWeekAvg = thisWeek.reduce((sum, r) => sum + r.score, 0) / thisWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, r) => sum + r.score, 0) / lastWeek.length;

    return Math.round(thisWeekAvg - lastWeekAvg);
  } catch (error) {
    console.error('[getScoreDelta] Error:', error);
    return null;
  }
};

/**
 * Get concept-level alerts (declining mastery)
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Array of concept alerts
 */
export const getConceptAlerts = async (institutionId) => {
  try {
    const alerts = [];

    // Get all concepts
    const { data: concepts } = await supabase
      .from('concept_mastery')
      .select('concept_name, mastery_score, updated_at')
      .eq('institution_id', institutionId);

    if (!concepts) return [];

    // Group by concept
    const conceptGroups = {};
    concepts.forEach(cm => {
      if (!conceptGroups[cm.concept_name]) {
        conceptGroups[cm.concept_name] = [];
      }
      conceptGroups[cm.concept_name].push(cm);
    });

    // Check each concept for declining mastery
    for (const [conceptName, records] of Object.entries(conceptGroups)) {
      const avgMastery = records.reduce((sum, r) => sum + r.mastery_score, 0) / records.length;

      // Check if average is low
      if (avgMastery < 50 && records.length >= 5) {
        const studentCount = records.length;
        alerts.push({
          type: 'weak_concept',
          severity: 'warning',
          concept_name: conceptName,
          message: `${studentCount} students struggling (${Math.round(avgMastery)}% avg mastery)`,
          value: avgMastery,
          student_count: studentCount,
          action: 'review_concept'
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('[getConceptAlerts] Error:', error);
    return [];
  }
};

/**
 * SRS ANALYTICS FUNCTIONS
 */

/**
 * Get SRS health score and distribution
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Object>} SRS metrics
 */
export const getSRSAnalytics = async (institutionId) => {
  try {
    console.log('[getSRSAnalytics] Fetching SRS analytics for institution:', institutionId);

    const { data: concepts, error } = await supabase
      .from('concept_mastery')
      .select('*')
      .eq('institution_id', institutionId);

    if (error) throw error;
    if (!concepts || concepts.length === 0) {
      return {
        health_score: 0,
        distribution: {struggling: 0, improving: 0, mastered: 0},
        review_adherence: 0,
        overdue_count: 0
      };
    }

    // Calculate mastery distribution
    const struggling = concepts.filter(c => c.mastery_score < 40).length;
    const improving = concepts.filter(c => c.mastery_score >= 40 && c.mastery_score < 70).length;
    const mastered = concepts.filter(c => c.mastery_score >= 70).length;

    // Calculate health score (weighted average)
    const healthScore = Math.round(
      (mastered * 100 + improving * 60 + struggling * 20) / concepts.length
    );

    // Calculate review adherence
    const today = new Date().toISOString().split('T')[0];
    const overdueReviews = concepts.filter(c => c.next_review_date && c.next_review_date < today).length;
    const reviewAdherence = Math.round(((concepts.length - overdueReviews) / concepts.length) * 100);

    return {
      health_score: healthScore,
      distribution: {
        struggling,
        improving,
        mastered
      },
      review_adherence: reviewAdherence,
      overdue_count: overdueReviews,
      total_concepts: concepts.length
    };
  } catch (error) {
    console.error('[getSRSAnalytics] Error:', error);
    return {
      health_score: 0,
      distribution: {struggling: 0, improving: 0, mastered: 0},
      review_adherence: 0,
      overdue_count: 0
    };
  }
};

/**
 * Get students with overdue reviews
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Students with overdue review counts
 */
export const getOverdueReviews = async (institutionId) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: concepts, error } = await supabase
      .from('concept_mastery')
      .select('student_id, concept_name, next_review_date, students(full_name)')
      .eq('institution_id', institutionId)
      .lt('next_review_date', today);

    if (error) throw error;
    if (!concepts) return [];

    // Group by student
    const studentGroups = {};
    concepts.forEach(c => {
      if (!studentGroups[c.student_id]) {
        studentGroups[c.student_id] = {
          student_id: c.student_id,
          student_name: c.students?.full_name || 'Unknown',
          overdue_concepts: []
        };
      }
      studentGroups[c.student_id].overdue_concepts.push(c.concept_name);
    });

    // Convert to array and sort by count
    const result = Object.values(studentGroups)
      .map(s => ({
        ...s,
        count: s.overdue_concepts.length
      }))
      .sort((a, b) => b.count - a.count);

    return result;
  } catch (error) {
    console.error('[getOverdueReviews] Error:', error);
    return [];
  }
};

/**
 * ADDITIONAL ANALYTICS FUNCTIONS
 */

/**
 * Get class-level comparison
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Class performance comparison
 */
export const getClassComparison = async (institutionId) => {
  try {
    console.log('[getClassComparison] Fetching class comparison for institution:', institutionId);

    // Get all classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, class_name, class_code')
      .eq('institution_id', institutionId)
      .eq('active', true);

    if (classesError) throw classesError;
    if (!classes) return [];

    // Get quiz results for each class
    const classStats = await Promise.all(classes.map(async (cls) => {
      // This week's performance
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: thisWeek } = await supabase
        .from('quiz_results')
        .select('score, student_id')
        .eq('class_id', cls.id)
        .gte('quiz_date', sevenDaysAgoStr);

      // Last week's performance
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

      const { data: lastWeek } = await supabase
        .from('quiz_results')
        .select('score')
        .eq('class_id', cls.id)
        .gte('quiz_date', fourteenDaysAgoStr)
        .lt('quiz_date', sevenDaysAgoStr);

      // Calculate averages
      const thisWeekAvg = thisWeek && thisWeek.length > 0
        ? thisWeek.reduce((sum, r) => sum + r.score, 0) / thisWeek.length
        : 0;

      const lastWeekAvg = lastWeek && lastWeek.length > 0
        ? lastWeek.reduce((sum, r) => sum + r.score, 0) / lastWeek.length
        : 0;

      const delta = thisWeekAvg - lastWeekAvg;

      // Get unique student count
      const studentCount = thisWeek ? new Set(thisWeek.map(r => r.student_id)).size : 0;

      return {
        class_id: cls.id,
        class_name: cls.class_name,
        class_code: cls.class_code,
        avg_score: Math.round(thisWeekAvg),
        delta: Math.round(delta),
        student_count: studentCount,
        quiz_count: thisWeek ? thisWeek.length : 0
      };
    }));

    // Sort by average score (descending)
    classStats.sort((a, b) => b.avg_score - a.avg_score);

    return classStats;
  } catch (error) {
    console.error('[getClassComparison] Error:', error);
    return [];
  }
};

/**
 * Get question type performance
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Performance by question type
 */
export const getQuestionTypePerformance = async (institutionId) => {
  try {
    console.log('[getQuestionTypePerformance] Fetching question type performance');

    const { data: quizResults, error } = await supabase
      .from('quiz_results')
      .select('answers_json')
      .eq('institution_id', institutionId)
      .limit(1000); // Limit for performance

    if (error) throw error;
    if (!quizResults) return [];

    // Aggregate by question type
    const typeStats = {};

    quizResults.forEach(result => {
      if (!result.answers_json || !result.answers_json.questions) return;

      result.answers_json.questions.forEach(q => {
        const type = q.question_type || 'unknown';
        if (!typeStats[type]) {
          typeStats[type] = {
            type,
            total: 0,
            correct: 0
          };
        }

        typeStats[type].total++;
        if (q.is_correct) {
          typeStats[type].correct++;
        }
      });
    });

    // Calculate accuracy percentages
    const result = Object.values(typeStats).map(stat => ({
      question_type: stat.type,
      avg_accuracy: Math.round((stat.correct / stat.total) * 100),
      total_questions: stat.total
    }));

    // Sort by accuracy (descending)
    result.sort((a, b) => b.avg_accuracy - a.avg_accuracy);

    return result;
  } catch (error) {
    console.error('[getQuestionTypePerformance] Error:', error);
    return [];
  }
};

/**
 * Get concept difficulty rating
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Object>} Concept difficulty distribution
 */
export const getConceptDifficulty = async (institutionId) => {
  try {
    console.log('[getConceptDifficulty] Fetching concept difficulty rating');

    const { data: concepts, error } = await supabase
      .from('concept_mastery')
      .select('concept_name, mastery_score')
      .eq('institution_id', institutionId);

    if (error) throw error;
    if (!concepts) return {easy: 0, medium: 0, hard: 0, concepts_by_difficulty: []};

    // Group by concept and calculate average mastery
    const conceptGroups = {};
    concepts.forEach(c => {
      if (!conceptGroups[c.concept_name]) {
        conceptGroups[c.concept_name] = [];
      }
      conceptGroups[c.concept_name].push(c.mastery_score);
    });

    const conceptDifficulties = Object.entries(conceptGroups).map(([name, scores]) => {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      return {
        concept_name: name,
        avg_mastery: Math.round(avg),
        student_count: scores.length
      };
    });

    // Categorize
    const easy = conceptDifficulties.filter(c => c.avg_mastery > 80).length;
    const medium = conceptDifficulties.filter(c => c.avg_mastery >= 60 && c.avg_mastery <= 80).length;
    const hard = conceptDifficulties.filter(c => c.avg_mastery < 60).length;

    // Get hardest concepts (for display)
    const hardConcepts = conceptDifficulties
      .filter(c => c.avg_mastery < 60)
      .sort((a, b) => a.avg_mastery - b.avg_mastery)
      .slice(0, 5);

    return {
      easy,
      medium,
      hard,
      total: conceptDifficulties.length,
      hardest_concepts: hardConcepts
    };
  } catch (error) {
    console.error('[getConceptDifficulty] Error:', error);
    return {easy: 0, medium: 0, hard: 0, concepts_by_difficulty: []};
  }
};

/**
 * Get top streaks leaderboard
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Top students by streak
 */
export const getTopStreaks = async (institutionId) => {
  try {
    console.log('[getTopStreaks] Fetching top streaks');

    // Get latest quiz for each student to get their current streak
    const { data: students, error } = await supabase
      .from('students')
      .select('id, full_name, username')
      .eq('institution_id', institutionId)
      .eq('active', true);

    if (error) throw error;
    if (!students) return [];

    const streaks = await Promise.all(students.map(async (student) => {
      const { data: latestQuiz } = await supabase
        .from('quiz_results')
        .select('streak_count, score')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        student_id: student.id,
        student_name: student.full_name,
        username: student.username,
        streak_count: latestQuiz && latestQuiz[0] ? latestQuiz[0].streak_count : 0,
        latest_score: latestQuiz && latestQuiz[0] ? latestQuiz[0].score : 0
      };
    }));

    // Filter out zero streaks and sort
    const result = streaks
      .filter(s => s.streak_count > 0)
      .sort((a, b) => b.streak_count - a.streak_count)
      .slice(0, 10); // Top 10

    return result;
  } catch (error) {
    console.error('[getTopStreaks] Error:', error);
    return [];
  }
};

/**
 * Get streak vs score correlation
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Object>} Correlation insights
 */
export const getStreakCorrelation = async (institutionId) => {
  try {
    const { data: quizResults, error } = await supabase
      .from('quiz_results')
      .select('streak_count, score')
      .eq('institution_id', institutionId)
      .limit(1000);

    if (error) throw error;
    if (!quizResults || quizResults.length === 0) {
      return {
        correlation: 'Not enough data',
        high_streak_avg: 0,
        low_streak_avg: 0
      };
    }

    // Calculate averages for high streaks (>7) vs low streaks (0-7)
    const highStreaks = quizResults.filter(r => r.streak_count > 7);
    const lowStreaks = quizResults.filter(r => r.streak_count <= 7);

    const highStreakAvg = highStreaks.length > 0
      ? highStreaks.reduce((sum, r) => sum + r.score, 0) / highStreaks.length
      : 0;

    const lowStreakAvg = lowStreaks.length > 0
      ? lowStreaks.reduce((sum, r) => sum + r.score, 0) / lowStreaks.length
      : 0;

    const percentageHigher = highStreakAvg > 0 && lowStreakAvg > 0
      ? Math.round(((highStreakAvg - lowStreakAvg) / lowStreakAvg) * 100)
      : 0;

    return {
      correlation: `Students with >7 day streak score ${percentageHigher}% higher on average`,
      high_streak_avg: Math.round(highStreakAvg),
      low_streak_avg: Math.round(lowStreakAvg),
      high_streak_count: highStreaks.length,
      low_streak_count: lowStreaks.length
    };
  } catch (error) {
    console.error('[getStreakCorrelation] Error:', error);
    return {
      correlation: 'Error calculating correlation',
      high_streak_avg: 0,
      low_streak_avg: 0
    };
  }
};

/**
 * Generate smart suggestions based on data
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Auto-generated suggestions
 */
export const generateSmartSuggestions = async (institutionId) => {
  try {
    console.log('[generateSmartSuggestions] Generating suggestions for institution:', institutionId);

    const suggestions = [];

    // Suggestion 1: Struggling concepts
    const conceptAnalytics = await getConceptAnalytics(institutionId);
    if (conceptAnalytics && conceptAnalytics.length > 0) {
      const worstConcept = conceptAnalytics[0]; // Already sorted weakest first
      suggestions.push({
        priority: 1,
        title: `"${worstConcept.concept_name}" needs attention`,
        description: `${worstConcept.student_count} students below 50% mastery`,
        action: 'Assign targeted practice quiz',
        expected_impact: '+20% mastery in 1 week',
        action_type: 'create_practice',
        concept_name: worstConcept.concept_name
      });
    }

    // Suggestion 2: Overdue reviews
    const overdueReviews = await getOverdueReviews(institutionId);
    if (overdueReviews && overdueReviews.length > 0) {
      const totalOverdue = overdueReviews.reduce((sum, s) => sum + s.count, 0);
      suggestions.push({
        priority: 2,
        title: `Review overdue for ${overdueReviews.length} students`,
        description: `${totalOverdue} concepts need review`,
        action: 'Send reminder notifications',
        expected_impact: 'Improve retention by 30%',
        action_type: 'send_reminder',
        students: overdueReviews.slice(0, 3) // Top 3
      });
    }

    // Suggestion 3: Class performance gap
    const classComparison = await getClassComparison(institutionId);
    if (classComparison && classComparison.length > 1) {
      const worstClass = classComparison[classComparison.length - 1];
      const bestClass = classComparison[0];
      const gap = bestClass.avg_score - worstClass.avg_score;

      if (gap > 15) { // Significant gap
        suggestions.push({
          priority: 3,
          title: `${worstClass.class_name} lagging behind`,
          description: `${gap}% below ${bestClass.class_name}`,
          action: 'Review teaching approach or provide extra support',
          expected_impact: 'Close performance gap',
          action_type: 'review_class',
          class_id: worstClass.class_id,
          class_name: worstClass.class_name
        });
      }
    }

    // Suggestion 4: Question type struggles
    const questionTypePerf = await getQuestionTypePerformance(institutionId);
    if (questionTypePerf && questionTypePerf.length > 0) {
      const worstType = questionTypePerf[questionTypePerf.length - 1];
      if (worstType.avg_accuracy < 70) {
        suggestions.push({
          priority: 4,
          title: `Students struggling with ${worstType.question_type} questions`,
          description: `Only ${worstType.avg_accuracy}% accuracy`,
          action: 'Provide training on this question type',
          expected_impact: '+15% accuracy',
          action_type: 'training',
          question_type: worstType.question_type
        });
      }
    }

    // Sort by priority
    suggestions.sort((a, b) => a.priority - b.priority);

    return suggestions;
  } catch (error) {
    console.error('[generateSmartSuggestions] Error:', error);
    return [];
  }
};

// ========================================
// SRS (SPACED REPETITION SYSTEM) FUNCTIONS
// ========================================

/**
 * Get SRS Teaching Plan for Today
 *
 * Returns concepts that need to be taught/reviewed today based on SRS schedule
 *
 * @param {string} institutionId - Institution UUID
 * @param {string|null} classId - Class UUID (null = all classes)
 * @param {string|null} studentId - Student UUID (null = group classes)
 * @returns {Promise<Object>} Teaching plan with group and personal sessions
 */
export const getSRSTeachingPlan = async (institutionId, classId = null, studentId = null) => {
  console.log('[getSRSTeachingPlan] Input:', { institutionId, classId, studentId });

  try {
    const today = new Date().toISOString().split('T')[0];

    // Get due concepts for review
    const dueConcepts = await getDueConceptsForReview(classId, studentId, today);

    // Separate into group and personal sessions
    const groupConcepts = [];
    const personalSessions = {};

    dueConcepts.forEach(concept => {
      if (concept.student_id === null) {
        // Group class concept
        groupConcepts.push(concept);
      } else {
        // Personal session concept
        if (!personalSessions[concept.student_id]) {
          personalSessions[concept.student_id] = {
            student_id: concept.student_id,
            student_name: concept.student_name,
            concepts: []
          };
        }
        personalSessions[concept.student_id].concepts.push(concept);
      }
    });

    const result = {
      group_classes: groupConcepts,
      personal_sessions: Object.values(personalSessions)
    };

    console.log('[getSRSTeachingPlan] Result:', result);
    return result;
  } catch (error) {
    console.error('[getSRSTeachingPlan] Error:', error);
    throw error;
  }
};

/**
 * Get Concepts Due for Review
 *
 * Queries concept_mastery to find concepts that need review on or before a specific date
 * For group classes: returns concepts where >50% of students need review
 *
 * @param {string|null} classId - Class UUID (null = all classes)
 * @param {string|null} studentId - Student UUID (null = group classes)
 * @param {string} reviewDate - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of concepts due for review
 */
export const getDueConceptsForReview = async (classId, studentId, reviewDate) => {
  console.log('[getDueConceptsForReview] Input:', { classId, studentId, reviewDate });

  try {
    // Simplified query without complex nested joins
    let query = supabase
      .from('concept_mastery')
      .select(`
        id,
        student_id,
        concept_name,
        mastery_score,
        next_review_date,
        last_reviewed_date,
        times_practiced,
        students!inner(id, full_name, institution_id)
      `)
      .lte('next_review_date', reviewDate);

    // Filter by student (personal session)
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data: concepts, error } = await query;

    if (error) {
      console.error('[getDueConceptsForReview] Supabase error:', error);
      // Return empty array instead of throwing to prevent UI breaking
      return [];
    }

    if (!concepts || concepts.length === 0) {
      console.log('[getDueConceptsForReview] No concepts due for review');
      return [];
    }

    // TODO: Add class filtering once student_class_enrollments data exists
    if (classId) {
      console.log('[getDueConceptsForReview] Class filtering skipped (no enrollment data yet)');
    }

    // For group classes: group by concept_name and count students
    const conceptGroups = {};
    concepts.forEach(concept => {
      const key = concept.concept_name;
      if (!conceptGroups[key]) {
        conceptGroups[key] = {
          concept_name: concept.concept_name,
          student_ids: new Set(),
          avg_mastery: 0,
          days_overdue: 0
        };
      }
      conceptGroups[key].student_ids.add(concept.student_id);
      conceptGroups[key].avg_mastery += concept.mastery_score;

      // Calculate days overdue
      const daysOverdue = Math.floor((new Date(reviewDate) - new Date(concept.next_review_date)) / (1000 * 60 * 60 * 24));
      conceptGroups[key].days_overdue = Math.max(conceptGroups[key].days_overdue, daysOverdue);
    });

    // Convert to array and calculate averages
    const result = Object.values(conceptGroups).map(group => ({
      concept_name: group.concept_name,
      student_count: group.student_ids.size,
      avg_mastery: Math.round(group.avg_mastery / group.student_ids.size),
      days_overdue: group.days_overdue,
      priority: group.days_overdue > 3 ? 'high' : (group.days_overdue > 0 ? 'medium' : 'low')
    }));

    // For group classes: filter to concepts where >50% of class needs review
    // TODO: Add this filtering once we have class roster counts

    // Sort by days_overdue (most overdue first)
    result.sort((a, b) => b.days_overdue - a.days_overdue);

    console.log('[getDueConceptsForReview] Found concepts:', result.length);
    return result;
  } catch (error) {
    console.error('[getDueConceptsForReview] Error:', error);
    throw error;
  }
};

/**
 * Get SRS Questions for Quiz Generation
 *
 * Retrieves questions for SRS review based on:
 * - Concepts due for review (from concept_mastery)
 * - Questions student previously got WRONG
 * - Ordered by mastery_score (weakest concepts first)
 *
 * @param {string} classId - Class UUID
 * @param {string|null} studentId - Student UUID (null for group classes)
 * @param {number} limit - Max questions to return (default: 10)
 * @returns {Promise<Array>} Array of quiz questions for SRS review
 */
export const getSRSQuestionsForQuiz = async (classId, studentId, limit = 10) => {
  console.log('[getSRSQuestionsForQuiz] Input:', { classId, studentId, limit });

  try {
    const today = new Date().toISOString().split('T')[0];

    // Step 1: Get concepts due for review
    const dueConcepts = await getDueConceptsForReview(classId, studentId, today);

    if (!dueConcepts || dueConcepts.length === 0) {
      console.log('[getSRSQuestionsForQuiz] No concepts due for review');
      return [];
    }

    // Extract concept names
    const conceptNames = dueConcepts.map(c => c.concept_name);
    console.log('[getSRSQuestionsForQuiz] Due concepts:', conceptNames);

    // Step 2: Get questions for these concepts
    let query = supabase
      .from('quiz_questions')
      .select('*')
      .eq('class_id', classId)
      .in('concept_name', conceptNames)
      .eq('active', true)
      .order('created_at', { ascending: true })  // Prefer older questions (from first teaching)
      .limit(limit * 2);  // Fetch extra in case we need to filter

    // Filter by student (personal) or group
    if (studentId) {
      query = query.eq('student_id', studentId);
    } else {
      query = query.is('student_id', null);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('[getSRSQuestionsForQuiz] Supabase error:', error);
      throw error;
    }

    if (!questions || questions.length === 0) {
      console.log('[getSRSQuestionsForQuiz] No questions found for due concepts');
      return [];
    }

    // Step 3: Prioritize questions based on mastery score
    // Match with dueConcepts to get mastery scores
    const questionsWithPriority = questions.map(q => {
      const conceptData = dueConcepts.find(c => c.concept_name === q.concept_name);
      return {
        ...q,
        mastery_score: conceptData?.avg_mastery || 50,
        days_overdue: conceptData?.days_overdue || 0
      };
    });

    // Sort by: days_overdue DESC, mastery_score ASC (most urgent + weakest first)
    questionsWithPriority.sort((a, b) => {
      if (b.days_overdue !== a.days_overdue) {
        return b.days_overdue - a.days_overdue;
      }
      return a.mastery_score - b.mastery_score;
    });

    // Step 4: Return top questions (up to limit)
    const result = questionsWithPriority.slice(0, limit);

    console.log('[getSRSQuestionsForQuiz] Returning questions:', result.length);
    return result;
  } catch (error) {
    console.error('[getSRSQuestionsForQuiz] Error:', error);
    throw error;
  }
};

// ========================================
// CONCEPT GROUPING FUNCTIONS (Dec 2025)
// ========================================
// These functions reduce 20-25 granular concepts to 5-6 topic groups
// for simplified teacher analytics

/**
 * Group concepts by their main topic (prefix before " - ")
 *
 * Examples:
 * - "Simple Present Tense - Affirmative" → "Simple Present Tense"
 * - "Simple Present Tense - Negative" → "Simple Present Tense"
 * - "Vocabulary - Animals" → "Vocabulary"
 *
 * @param {Array} concepts - Array of concept objects with concept_name field
 * @returns {Object} Grouped concepts { topicName: [concepts] }
 */
export const groupConceptsByTopic = (concepts) => {
  const groups = {};

  concepts.forEach(concept => {
    const conceptName = concept.concept_name || concept.concept || 'Unknown';

    // Extract main topic (before " - " delimiter)
    let mainTopic = conceptName;
    if (conceptName.includes(' - ')) {
      mainTopic = conceptName.split(' - ')[0].trim();
    } else if (conceptName.includes(': ')) {
      mainTopic = conceptName.split(': ')[0].trim();
    }

    if (!groups[mainTopic]) {
      groups[mainTopic] = [];
    }
    groups[mainTopic].push(concept);
  });

  return groups;
};

/**
 * Get grouped concept analytics (reduces 20-25 concepts to 5-6 topics)
 *
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>} Array of {topic_name, avg_mastery, concept_count, student_count}
 */
export const getGroupedConceptAnalytics = async (institutionId) => {
  try {
    console.log('[getGroupedConceptAnalytics] Fetching grouped analytics for institution:', institutionId);

    const { data, error } = await supabase
      .from('concept_mastery')
      .select('concept_name, mastery_score, student_id')
      .eq('institution_id', institutionId);

    if (error) {
      console.error('[getGroupedConceptAnalytics] Error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by main topic
    const grouped = groupConceptsByTopic(data);

    // Calculate aggregated stats per topic
    const topicStats = Object.entries(grouped).map(([topicName, concepts]) => {
      const totalMastery = concepts.reduce((sum, c) => sum + (c.mastery_score || 0), 0);
      const avgMastery = Math.round(totalMastery / concepts.length);
      const uniqueStudents = new Set(concepts.map(c => c.student_id)).size;
      const uniqueConcepts = new Set(concepts.map(c => c.concept_name)).size;

      return {
        topic_name: topicName,
        avg_mastery: avgMastery,
        concept_count: uniqueConcepts,
        student_count: uniqueStudents,
        // For sorting: lower mastery = needs more attention
        priority: avgMastery < 40 ? 'high' : avgMastery < 60 ? 'medium' : 'low'
      };
    });

    // Sort by avg_mastery ascending (weakest first)
    topicStats.sort((a, b) => a.avg_mastery - b.avg_mastery);

    console.log('[getGroupedConceptAnalytics] Grouped', data.length, 'concepts into', topicStats.length, 'topics');
    return topicStats;
  } catch (error) {
    console.error('[getGroupedConceptAnalytics] Error:', error);
    return [];
  }
};

/**
 * Get single daily priority for teacher (simplified view)
 *
 * Returns ONE actionable insight instead of multiple complex alerts
 *
 * Priority order:
 * 1. Students inactive >7 days (critical)
 * 2. Topic with <50% mastery (needs review)
 * 3. All good!
 *
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Object>} Single priority insight
 */
export const getDailyPriority = async (institutionId) => {
  try {
    console.log('[getDailyPriority] Calculating daily priority for institution:', institutionId);

    // Check 1: Inactive students (>7 days without quiz)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Get all active students
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('institution_id', institutionId)
      .eq('active', true);

    if (!allStudents || allStudents.length === 0) {
      return {
        type: 'no_students',
        severity: 'info',
        message: 'No students enrolled yet.',
        action: 'Add students to get started.',
        icon: 'users'
      };
    }

    // Get students who took quiz in last 7 days
    const { data: recentQuizzes } = await supabase
      .from('quiz_results')
      .select('student_id')
      .eq('institution_id', institutionId)
      .gte('quiz_date', sevenDaysAgoStr);

    const activeStudentIds = new Set(recentQuizzes?.map(q => q.student_id) || []);
    const inactiveStudents = allStudents.filter(s => !activeStudentIds.has(s.id));

    if (inactiveStudents.length > 0) {
      return {
        type: 'inactive_students',
        severity: 'critical',
        count: inactiveStudents.length,
        message: `${inactiveStudents.length} student${inactiveStudents.length > 1 ? 's' : ''} haven't taken a quiz this week.`,
        action: 'Send reminder or check in with them.',
        students: inactiveStudents.slice(0, 3).map(s => s.full_name),
        icon: 'alert-triangle'
      };
    }

    // Check 2: Topics with low mastery (<50%)
    const groupedAnalytics = await getGroupedConceptAnalytics(institutionId);
    const weakTopics = groupedAnalytics.filter(t => t.avg_mastery < 50);

    if (weakTopics.length > 0) {
      const worstTopic = weakTopics[0]; // Already sorted by mastery
      return {
        type: 'weak_topic',
        severity: 'warning',
        topic: worstTopic.topic_name,
        mastery: worstTopic.avg_mastery,
        studentCount: worstTopic.student_count,
        message: `${worstTopic.student_count} students struggling with "${worstTopic.topic_name}" (${worstTopic.avg_mastery}% avg).`,
        action: 'Review this topic before the next class.',
        icon: 'book-open'
      };
    }

    // Check 3: All good!
    return {
      type: 'all_good',
      severity: 'success',
      message: 'All students are on track! Keep up the great work.',
      action: 'No immediate action needed.',
      icon: 'check-circle'
    };
  } catch (error) {
    console.error('[getDailyPriority] Error:', error);
    return {
      type: 'error',
      severity: 'info',
      message: 'Unable to calculate priority.',
      action: 'Please refresh the page.',
      icon: 'info'
    };
  }
};

/**
 * Get simple stats for teacher dashboard (3 key metrics only)
 *
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Object>} { totalStudents, avgScore, needsHelp }
 */
export const getSimpleStats = async (institutionId) => {
  try {
    console.log('[getSimpleStats] Fetching simple stats for institution:', institutionId);

    // Get student count
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('active', true);

    // Get this week's average score
    const weekStart = getCurrentWeekMonday();
    const { data: weeklyResults } = await supabase
      .from('quiz_results')
      .select('score')
      .eq('institution_id', institutionId)
      .gte('quiz_date', weekStart);

    const avgScore = weeklyResults && weeklyResults.length > 0
      ? Math.round(weeklyResults.reduce((sum, r) => sum + r.score, 0) / weeklyResults.length)
      : 0;

    // Count students who need help (score <60% or inactive)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Get students with low scores
    const { data: lowScoreStudents } = await supabase
      .from('quiz_results')
      .select('student_id, score')
      .eq('institution_id', institutionId)
      .gte('quiz_date', sevenDaysAgoStr)
      .lt('score', 60);

    // Get inactive students
    const { data: allStudents } = await supabase
      .from('students')
      .select('id')
      .eq('institution_id', institutionId)
      .eq('active', true);

    const { data: activeQuizzes } = await supabase
      .from('quiz_results')
      .select('student_id')
      .eq('institution_id', institutionId)
      .gte('quiz_date', sevenDaysAgoStr);

    const activeStudentIds = new Set(activeQuizzes?.map(q => q.student_id) || []);
    const inactiveCount = (allStudents || []).filter(s => !activeStudentIds.has(s.id)).length;

    // Count unique students who need help
    const lowScoreStudentIds = new Set(lowScoreStudents?.map(r => r.student_id) || []);
    const needsHelp = lowScoreStudentIds.size + inactiveCount;

    return {
      totalStudents: totalStudents || 0,
      avgScore: avgScore,
      needsHelp: Math.min(needsHelp, totalStudents || 0) // Can't exceed total
    };
  } catch (error) {
    console.error('[getSimpleStats] Error:', error);
    return {
      totalStudents: 0,
      avgScore: 0,
      needsHelp: 0
    };
  }
};
