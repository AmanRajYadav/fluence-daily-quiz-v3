/**
 * Student Dashboard Component
 *
 * Clean, modern dashboard for students inspired by Duolingo
 * Features:
 * - Real-time stats (streak, points, rank)
 * - Quiz availability status
 * - Recent quiz history
 * - Concept mastery visualization
 * - Weak concepts to review
 * - Upcoming SRS reviews
 * - Performance metrics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Star,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Loader2,
  Calendar,
  Award,
  Brain
} from 'lucide-react';
import { getStudentDashboardData } from '../../services/studentService';

const StudentDashboard = ({ session, onLogout, onStartQuiz }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [session.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentDashboardData(session.id);
      setDashboardData(data);
    } catch (err) {
      console.error('[StudentDashboard] Error loading data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Oops!</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    streak,
    points,
    quizHistory,
    leaderboardPosition,
    stats,
    quizStatus,
    weakConcepts,
    strongConcepts,
    upcomingReviews
  } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Welcome back, {session.full_name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              {session.class_name} • {session.session}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white shadow"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-lg border border-orange-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Current Streak</h3>
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-orange-600 mb-1">
              {streak} {streak === 1 ? 'day' : 'days'}
            </p>
            <p className="text-sm text-gray-600">
              {streak === 0 ? 'Start your streak today!' : `Keep it going! 🔥`}
            </p>
          </motion.div>

          {/* Points Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg border border-purple-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Total Points</h3>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-4xl font-bold text-purple-600 mb-1">{points}</p>
            <p className="text-sm text-gray-600">
              {stats.totalQuizzes} {stats.totalQuizzes === 1 ? 'quiz' : 'quizzes'} completed
            </p>
          </motion.div>

          {/* Rank Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg border border-blue-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Leaderboard</h3>
              <Trophy className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-blue-600 mb-1">
              {leaderboardPosition.rank ? `#${leaderboardPosition.rank}` : '-'}
            </p>
            <p className="text-sm text-gray-600">
              {leaderboardPosition.rank
                ? `Top ${leaderboardPosition.percentile}% • ${leaderboardPosition.totalStudents} students`
                : 'Complete a quiz to rank'}
            </p>
          </motion.div>
        </div>

        {/* Quiz Status + Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6"
        >
          {quizStatus.completedToday ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Great work! ✅
              </h2>
              <p className="text-gray-600 mb-4">
                You've completed today's quiz. Come back tomorrow for more!
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 inline-block">
                <p className="text-sm font-semibold text-green-800">
                  Your score: {quizHistory[0]?.score || 0} points
                </p>
              </div>
            </div>
          ) : quizStatus.available ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Today's Quiz</h2>
                  <p className="text-gray-600">
                    {quizStatus.questionsCount} personalized questions ready
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Complete your daily quiz to improve your concept mastery, maintain your streak, and climb the leaderboard!
              </p>
              <button
                onClick={onStartQuiz}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
              >
                Start Quiz Now →
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Quiz Available
              </h2>
              <p className="text-gray-600">
                Your teacher hasn't generated questions yet. Check back later!
              </p>
            </div>
          )}
        </motion.div>

        {/* Performance & Concepts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Performance Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Performance</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Average Score</span>
                <span className="font-bold text-lg text-gray-900">{stats.averageScore}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Highest Score</span>
                <span className="font-bold text-lg text-green-600">{stats.highestScore}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Weekly Average</span>
                <span className="font-bold text-lg text-blue-600">{stats.weeklyAverage}%</span>
              </div>
              {stats.improvement !== 0 && (
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <span className="text-gray-700">Improvement</span>
                  <span className={`font-bold text-lg ${stats.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Weak Concepts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">Needs Practice</h3>
            </div>

            {weakConcepts.length > 0 ? (
              <div className="space-y-2">
                {weakConcepts.map((concept, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {concept.concept_name}
                      </span>
                      <span className="text-xs font-bold text-red-600 ml-2">
                        {Math.round(concept.mastery_score)}%
                      </span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${concept.mastery_score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Award className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No weak concepts! You're doing great! 🎉</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Quiz History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Recent Quizzes</h3>
          </div>

          {quizHistory.length > 0 ? (
            <div className="space-y-2">
              {quizHistory.slice(0, 5).map((quiz, index) => {
                const date = new Date(quiz.quiz_date);
                const scoreColor = quiz.score >= 80 ? 'text-green-600' : quiz.score >= 60 ? 'text-yellow-600' : 'text-red-600';
                const bgColor = quiz.score >= 80 ? 'bg-green-50 border-green-200' : quiz.score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

                return (
                  <div key={index} className={`p-3 rounded-lg border ${bgColor}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {quiz.time_taken_seconds ? `${Math.round(quiz.time_taken_seconds / 60)} min` : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${scoreColor}`}>{quiz.score}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No quizzes yet. Start your first one above!</p>
            </div>
          )}
        </motion.div>

        {/* Upcoming Reviews (SRS) */}
        {upcomingReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Upcoming Reviews</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              These concepts are due for review soon based on Spaced Repetition:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {upcomingReviews.slice(0, 6).map((concept, index) => {
                const reviewDate = new Date(concept.next_review_date);
                const today = new Date();
                const daysUntil = Math.ceil((reviewDate - today) / (1000 * 60 * 60 * 24));

                return (
                  <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 truncate">{concept.concept_name}</p>
                    <p className="text-xs text-gray-600">
                      {daysUntil === 0 ? 'Due today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
