/**
 * SRS Teaching Plan Component
 *
 * Displays concepts that need to be taught/reviewed today based on Spaced Repetition System
 *
 * Features:
 * - Class selector dropdown (like Question Editor)
 * - Student selector for personal sessions
 * - Separate sections for group classes and personal sessions
 * - Color-coded priorities (red: overdue, yellow: due today, green: upcoming)
 * - Student counts for each concept
 * - Refresh button
 * - Link to audio upload for quiz generation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, BookOpen, User, Users, RefreshCw, Upload, ChevronDown } from 'lucide-react';
import { getSRSTeachingPlan } from '../../services/teacherService';
import { getClassesByInstitution } from '../../services/teacherService';
import { getCurrentSession } from '../../services/authService';

const SRSTeachingPlan = () => {
  // Memoize session to prevent infinite loops from object recreation
  const session = useMemo(() => getCurrentSession(), []);

  const [teachingPlan, setTeachingPlan] = useState({
    group_classes: [],
    personal_sessions: []
  });
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadClasses = useCallback(async () => {
    if (!session?.institution_id) {
      console.error('[SRSTeachingPlan] No institution_id in session');
      return;
    }

    try {
      const classesData = await getClassesByInstitution(session.institution_id);
      setClasses(classesData || []);
    } catch (error) {
      console.error('[SRSTeachingPlan] Error loading classes:', error);
    }
  }, [session]);

  // Wrap loadTeachingPlan in useCallback to prevent infinite loops
  const loadTeachingPlan = useCallback(async () => {
    if (!session?.institution_id) {
      console.error('[SRSTeachingPlan] No institution_id in session');
      setLoading(false);
      return;
    }

    setLoading(true);

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('[SRSTeachingPlan] Loading timeout after 10 seconds');
      setLoading(false);
      setTeachingPlan({ group_classes: [], personal_sessions: [] });
    }, 10000); // 10 second timeout

    try {
      const classId = selectedClass === 'all' ? null : selectedClass;
      const plan = await getSRSTeachingPlan(session.institution_id, classId, null);
      clearTimeout(timeout); // Clear timeout if successful
      setTeachingPlan(plan || { group_classes: [], personal_sessions: [] });
    } catch (error) {
      console.error('[SRSTeachingPlan] Error loading teaching plan:', error);
      clearTimeout(timeout); // Clear timeout on error
      setTeachingPlan({ group_classes: [], personal_sessions: [] }); // Set empty data on error
    } finally {
      setLoading(false);
    }
  }, [session, selectedClass]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (session?.institution_id) {
      loadTeachingPlan();
    }
  }, [session, loadTeachingPlan]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Overdue';
      case 'medium':
        return 'Due Today';
      case 'low':
        return 'Upcoming';
      default:
        return '';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalConcepts = teachingPlan.group_classes.length +
    teachingPlan.personal_sessions.reduce((sum, session) => sum + session.concepts.length, 0);

  if (totalConcepts === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <h3 className="text-lg font-bold text-green-900 mb-1">No Concepts Due Today!</h3>
          <p className="text-sm text-green-700">
            All students are on track with their SRS schedule. Great work!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            SRS Teaching Plan for Today
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Concepts to review based on Spaced Repetition System
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Class Selector */}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadTeachingPlan}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{totalConcepts}</p>
          <p className="text-sm text-gray-600">Total Concepts Due</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{teachingPlan.group_classes.length}</p>
          <p className="text-sm text-gray-600">Group Classes</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{teachingPlan.personal_sessions.length}</p>
          <p className="text-sm text-gray-600">Personal Sessions</p>
        </div>
      </div>

      {/* Group Classes Section */}
      {teachingPlan.group_classes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-bold text-gray-900">
              Group Classes ({teachingPlan.group_classes.length} concepts)
            </h4>
          </div>

          <div className="space-y-2">
            {teachingPlan.group_classes.map((concept, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 border rounded-lg ${getPriorityColor(concept.priority)}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityBadgeColor(concept.priority)}`}>
                      {getPriorityLabel(concept.priority)}
                    </span>
                    {concept.days_overdue > 0 && (
                      <span className="text-xs text-gray-600">
                        ({concept.days_overdue} {concept.days_overdue === 1 ? 'day' : 'days'} overdue)
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-lg">{concept.concept_name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {concept.student_count} {concept.student_count === 1 ? 'student needs' : 'students need'} review •
                    Average mastery: {concept.avg_mastery}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Sessions Section */}
      {teachingPlan.personal_sessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-bold text-gray-900">
              Personal Sessions ({teachingPlan.personal_sessions.length} students)
            </h4>
          </div>

          <div className="space-y-4">
            {teachingPlan.personal_sessions.map((session, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-green-700" />
                  <p className="font-bold text-gray-900">{session.student_name}</p>
                  <span className="text-xs text-gray-600">
                    ({session.concepts.length} {session.concepts.length === 1 ? 'concept' : 'concepts'})
                  </span>
                </div>

                <div className="space-y-2 ml-7">
                  {session.concepts.map((concept, cIndex) => (
                    <div
                      key={cIndex}
                      className={`flex items-center justify-between p-3 border rounded ${getPriorityColor(concept.priority)}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityBadgeColor(concept.priority)}`}>
                            {getPriorityLabel(concept.priority)}
                          </span>
                          <p className="font-semibold">{concept.concept_name}</p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Mastery: {concept.avg_mastery}%
                          {concept.days_overdue > 0 && ` • ${concept.days_overdue} days overdue`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
          <Upload className="w-5 h-5" />
          Upload Class Audio to Generate Quiz
        </button>
        <p className="text-xs text-gray-600 text-center mt-2">
          The quiz will include review questions for concepts listed above
        </p>
      </div>
    </div>
  );
};

export default SRSTeachingPlan;
