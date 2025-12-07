/**
 * Analytics Component
 *
 * Displays institution-wide analytics with:
 * - Score trends over time (line chart)
 * - Weak concepts analysis (bar chart)
 * - Student engagement metrics (pie chart)
 *
 * Features:
 * - Date range selector (7/30/90 days)
 * - Responsive charts
 * - Loading states
 * - Empty states
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, TrendingDown, Users, RefreshCw, Zap, Award, Target } from 'lucide-react';
import {
  getScoreTrends,
  getConceptAnalytics,
  getEngagementMetrics,
  getClassComparison,
  getQuestionTypePerformance,
  getTopStreaks
} from '../../services/teacherService';
import { getCurrentSession } from '../../services/authService';
import AlertsPanel from './AlertsPanel';
import SmartSuggestions from './SmartSuggestions';
import SRSDashboard from './SRSDashboard';

const Analytics = () => {
  const session = getCurrentSession();

  // Data state
  const [scoreTrends, setScoreTrends] = useState([]);
  const [conceptAnalytics, setConceptAnalytics] = useState([]);
  const [engagementMetrics, setEngagementMetrics] = useState([]);
  const [classComparison, setClassComparison] = useState([]);
  const [questionTypePerf, setQuestionTypePerf] = useState([]);
  const [topStreaks, setTopStreaks] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    if (!session?.institution_id) {
      console.error('[Analytics] No institution_id in session');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      console.log('[Analytics] Loading analytics data...');

      // Load all analytics data in parallel
      const [trends, concepts, engagement, classes, questionTypes, streaks] = await Promise.all([
        getScoreTrends(session.institution_id, parseInt(timeRange)),
        getConceptAnalytics(session.institution_id),
        getEngagementMetrics(session.institution_id),
        getClassComparison(session.institution_id),
        getQuestionTypePerformance(session.institution_id),
        getTopStreaks(session.institution_id)
      ]);

      setScoreTrends(trends);
      setConceptAnalytics(concepts);
      setEngagementMetrics(engagement);
      setClassComparison(classes);
      setQuestionTypePerf(questionTypes);
      setTopStreaks(streaks);

      console.log('[Analytics] Data loaded successfully');
    } catch (error) {
      console.error('[Analytics] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart colors (Duolingo palette)
  const COLORS = {
    primary: '#58CC02',    // Green
    secondary: '#1CB0F6',  // Blue
    warning: '#FFC800',    // Yellow
    danger: '#FF4B4B',     // Red
    purple: '#CE82FF',     // Purple
    orange: '#FF9600'      // Orange
  };

  const PIE_COLORS = [COLORS.primary, COLORS.danger];

  // Custom tooltip for score trends
  const ScoreTrendTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.date}</p>
          <p className="text-sm text-gray-600">Avg Score: {payload[0].value}%</p>
          <p className="text-sm text-gray-600">Quizzes: {payload[0].payload.quiz_count}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for concepts
  const ConceptTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.concept_name}</p>
          <p className="text-sm text-gray-600">Avg Mastery: {payload[0].value}%</p>
          <p className="text-sm text-gray-600">Students: {payload[0].payload.student_count}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for class comparison
  const ClassTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{data.class_name}</p>
          <p className="text-sm text-gray-600">Avg Score: {payload[0].value}%</p>
          <p className="text-sm text-gray-600">Students: {data.student_count}</p>
          {data.delta !== undefined && (
            <p className={`text-sm font-medium ${data.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Week-over-week: {data.delta >= 0 ? '+' : ''}{data.delta}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for question types
  const QuestionTypeTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.question_type}</p>
          <p className="text-sm text-gray-600">Accuracy: {payload[0].value}%</p>
          <p className="text-sm text-gray-600">Total: {payload[0].payload.total_questions}</p>
          <p className="text-sm text-gray-600">Correct: {payload[0].payload.correct_answers}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        </div>

        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-600 mt-1">
            Institution-wide performance insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Priority Sections: Alerts, Suggestions, SRS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel compact={false} />
        <SmartSuggestions compact={false} />
      </div>

      <SRSDashboard />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Score Trends Chart - Full Width */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900">Score Trends</h3>
          </div>

          {scoreTrends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="font-semibold">No quiz data available</p>
                <p className="text-sm mt-1">Students need to take quizzes to see trends</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Tooltip content={<ScoreTrendTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg_score"
                  name="Average Score (%)"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottom Row: Concepts + Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weak Concepts Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Weak Concepts (Top 10)</h3>
            </div>

            {conceptAnalytics.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="font-semibold">No concept data available</p>
                  <p className="text-sm mt-1">Students need to practice concepts</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conceptAnalytics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="category"
                    dataKey="concept_name"
                    stroke="#6B7280"
                    style={{ fontSize: '10px' }}
                    width={120}
                  />
                  <Tooltip content={<ConceptTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="avg_mastery"
                    name="Avg Mastery (%)"
                    fill={COLORS.danger}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Student Engagement Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Student Engagement</h3>
            </div>

            {engagementMetrics.every(m => m.value === 0) ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="font-semibold">No students enrolled</p>
                  <p className="text-sm mt-1">Add students to see engagement</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={engagementMetrics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {engagementMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  {engagementMetrics.map((metric, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div
                        className="w-3 h-3 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: PIE_COLORS[index] }}
                      ></div>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                      <p className="text-xs text-gray-600">{metric.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Class Comparison Chart */}
        {classComparison.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Class Performance Comparison</h3>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="class_name"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Tooltip content={<ClassTooltip />} />
                <Legend />
                <Bar
                  dataKey="avg_score"
                  name="Average Score (%)"
                  fill={COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Question Type Performance + Streak Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Type Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Question Type Performance</h3>
            </div>

            {questionTypePerf.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="font-semibold">No question type data available</p>
                  <p className="text-sm mt-1">Students need to answer questions</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questionTypePerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="category"
                    dataKey="question_type"
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                    width={100}
                  />
                  <Tooltip content={<QuestionTypeTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="accuracy"
                    name="Accuracy (%)"
                    fill={COLORS.secondary}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Streak Leaderboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-yellow-600" />
              <h3 className="text-xl font-bold text-gray-900">Top Streaks</h3>
            </div>

            {topStreaks.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="font-semibold">No streak data available</p>
                  <p className="text-sm mt-1">Students need to build streaks</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {topStreaks.map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg hover:from-yellow-100 hover:to-orange-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{student.student_name}</p>
                        <p className="text-xs text-gray-600">Class: {student.class_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span className="text-2xl font-bold text-orange-600">{student.streak_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Average Score (Last {timeRange} days)</p>
            <p className="text-3xl font-bold text-green-600">
              {scoreTrends.length > 0
                ? Math.round(scoreTrends.reduce((sum, t) => sum + t.avg_score, 0) / scoreTrends.length)
                : 0}%
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Weakest Concept</p>
            <p className="text-lg font-bold text-red-600 truncate">
              {conceptAnalytics.length > 0
                ? `${conceptAnalytics[0].concept_name} (${conceptAnalytics[0].avg_mastery}%)`
                : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Students</p>
            <p className="text-3xl font-bold text-blue-600">
              {engagementMetrics.find(m => m.name.includes('Active'))?.value || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
