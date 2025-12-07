/**
 * Student Detail View Component
 *
 * Shows detailed information about a single student:
 * - Student info card (name, class, total points, total quizzes)
 * - Quiz history list (all past quiz attempts)
 * - Back button to return to student list
 * - Loading and error states
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentDetail } from '../../services/teacherService';
import { ArrowLeft, User, Calendar, Trophy, Target, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import ConceptMasteryHeatmap from './ConceptMasteryHeatmap';

const StudentDetailView = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  const loadStudent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentDetail(studentId);
      if (!data) {
        setError('Student not found');
      } else {
        setStudent(data);
      }
    } catch (err) {
      console.error('[StudentDetailView] Error loading student:', err);
      setError('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/teacher/students')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Students
        </button>

        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">
            {error || 'Student not found'}
          </h2>
          <p className="text-red-700 mb-4">
            The student you're looking for doesn't exist or you don't have permission to view them.
          </p>
          <button
            onClick={() => navigate('/teacher/students')}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Return to Student List
          </button>
        </div>
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/teacher/students')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Students
      </button>

      {/* Student Info Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-black text-4xl shadow-lg">
              {(student.full_name || student.username || 'U')[0].toUpperCase()}
            </div>
          </div>

          {/* Student Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {student.full_name || student.username}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <User className="w-4 h-4" />
              <span>{student.email || student.phone || 'No contact info'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <Target className="w-4 h-4" />
              <span>
                {student.classes?.name || 'No class'}
                {student.classes?.grade && ` • ${student.classes.grade}`}
              </span>
            </div>
            {student.created_at && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Enrolled: {formatDate(student.created_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Points */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Total Points</p>
            <p className="text-3xl font-black text-gray-900">
              {student.total_points?.toLocaleString() || 0}
            </p>
          </div>

          {/* Total Quizzes */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
            <Target className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Quizzes Taken</p>
            <p className="text-3xl font-black text-gray-900">
              {student.total_quizzes || 0}
            </p>
          </div>

          {/* Average Score */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Average Score</p>
            <p className="text-3xl font-black text-gray-900">
              {student.quiz_results && student.quiz_results.length > 0
                ? `${Math.round(
                    student.quiz_results.reduce((sum, q) => sum + (q.score || 0), 0) /
                      student.quiz_results.length
                  )}%`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      {student.quiz_results && student.quiz_results.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Score Trend
          </h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Total Quizzes</p>
              <p className="text-3xl font-black text-blue-600">
                {student.quiz_results.length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-3xl font-black text-green-600">
                {Math.round(
                  student.quiz_results.reduce((sum, q) => sum + (q.score || 0), 0) /
                    student.quiz_results.length
                )}%
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Latest Score</p>
              <p className="text-3xl font-black text-purple-600">
                {Math.round(student.quiz_results[student.quiz_results.length - 1]?.score || 0)}%
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Trend</p>
              <div className="flex items-center justify-center gap-1">
                {(() => {
                  const first = student.quiz_results[0]?.score || 0;
                  const latest = student.quiz_results[student.quiz_results.length - 1]?.score || 0;
                  const change = latest - first;
                  return (
                    <>
                      {change > 0 && <TrendingUp className="w-6 h-6 text-green-600" />}
                      {change < 0 && <TrendingDown className="w-6 h-6 text-red-600" />}
                      <p className={`text-2xl font-black ${
                        change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {Math.abs(change).toFixed(0)}%
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Simple SVG Line Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <svg viewBox="0 0 100 50" className="w-full h-32" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="5" y1="10" x2="95" y2="10" stroke="#e5e7eb" strokeWidth="0.2" />
              <line x1="5" y1="25" x2="95" y2="25" stroke="#e5e7eb" strokeWidth="0.2" />
              <line x1="5" y1="40" x2="95" y2="40" stroke="#e5e7eb" strokeWidth="0.2" />

              {/* Chart line */}
              {(() => {
                const scores = student.quiz_results.map(q => q.score || 0);
                const maxScore = Math.max(...scores);
                const minScore = Math.min(...scores);
                const scoreRange = maxScore - minScore || 1;

                const points = student.quiz_results.map((quiz, index) => {
                  const x = 5 + (90 * index) / (student.quiz_results.length - 1 || 1);
                  const y = 45 - ((quiz.score - minScore) / scoreRange) * 35;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <>
                    <polyline
                      points={points}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="0.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {student.quiz_results.map((quiz, index) => {
                      const x = 5 + (90 * index) / (student.quiz_results.length - 1 || 1);
                      const y = 45 - ((quiz.score - minScore) / scoreRange) * 35;
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="0.8"
                          fill="#10b981"
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>
                {formatDate(student.quiz_results[0]?.quiz_date || student.quiz_results[0]?.created_at)}
              </span>
              <span>
                {formatDate(
                  student.quiz_results[student.quiz_results.length - 1]?.quiz_date ||
                  student.quiz_results[student.quiz_results.length - 1]?.created_at
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quiz History */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6 text-gray-700" />
          Quiz History
        </h2>

        {!student.quiz_results || student.quiz_results.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No quiz attempts yet</p>
            <p className="text-gray-500 text-sm mt-2">
              This student hasn't taken any quizzes yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Taken
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {student.quiz_results.map((quiz, index) => (
                    <tr key={quiz.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(quiz.quiz_date || quiz.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            quiz.score >= 70
                              ? 'bg-green-100 text-green-800'
                              : quiz.score >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {Math.round(quiz.score || 0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {quiz.correct_answers || 0}/{quiz.total_questions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {quiz.time_taken_seconds
                          ? `${Math.floor(quiz.time_taken_seconds / 60)}m ${
                              quiz.time_taken_seconds % 60
                            }s`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {quiz.total_points || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden space-y-3">
              {student.quiz_results.map((quiz, index) => (
                <div
                  key={quiz.id || index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm text-gray-600">
                        {formatDate(quiz.quiz_date || quiz.created_at)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        quiz.score >= 70
                          ? 'bg-green-100 text-green-800'
                          : quiz.score >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {Math.round(quiz.score || 0)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Questions</p>
                      <p className="font-semibold text-gray-900">
                        {quiz.correct_answers || 0}/{quiz.total_questions || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time</p>
                      <p className="font-semibold text-gray-900">
                        {quiz.time_taken_seconds
                          ? `${Math.floor(quiz.time_taken_seconds / 60)}m ${
                              quiz.time_taken_seconds % 60
                            }s`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Points</p>
                      <p className="font-semibold text-gray-900">
                        {quiz.total_points || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Concept Mastery Heatmap */}
      <ConceptMasteryHeatmap conceptMasteryData={student.concept_mastery || []} />
    </div>
  );
};

export default StudentDetailView;
