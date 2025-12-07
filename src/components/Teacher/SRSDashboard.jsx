/**
 * SRSDashboard Component
 *
 * Displays Spaced Repetition System (SRS) analytics:
 * - SRS health score (0-100)
 * - Concept distribution (struggling, improving, mastered)
 * - Review adherence percentage
 * - Students with overdue reviews
 *
 * Features:
 * - Visual health indicator
 * - Pie chart for concept distribution
 * - List of students needing review reminders
 * - Loading and empty states
 */

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import { getSRSAnalytics, getOverdueReviews } from '../../services/teacherService';
import { getCurrentSession } from '../../services/authService';

const SRSDashboard = () => {
  const session = getCurrentSession();

  const [srsData, setSrsData] = useState({
    health_score: 0,
    distribution: { struggling: 0, improving: 0, mastered: 0 },
    review_adherence: 0,
    overdue_count: 0
  });
  const [overdueStudents, setOverdueStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSRSData();
  }, []);

  const loadSRSData = async () => {
    if (!session?.institution_id) {
      console.error('[SRSDashboard] No institution_id in session');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [analytics, overdue] = await Promise.all([
        getSRSAnalytics(session.institution_id),
        getOverdueReviews(session.institution_id)
      ]);

      setSrsData(analytics);
      setOverdueStudents(overdue);
    } catch (error) {
      console.error('[SRSDashboard] Error loading SRS data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare pie chart data
  const distributionData = [
    { name: 'Struggling (<40%)', value: srsData.distribution.struggling, color: '#FF4B4B' },
    { name: 'Improving (40-70%)', value: srsData.distribution.improving, color: '#FFC800' },
    { name: 'Mastered (>70%)', value: srsData.distribution.mastered, color: '#58CC02' }
  ].filter(item => item.value > 0);

  const getHealthColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getHealthLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Needs Attention';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalConcepts = srsData.distribution.struggling + srsData.distribution.improving + srsData.distribution.mastered;

  if (totalConcepts === 0) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-3 text-purple-600" />
          <h3 className="text-lg font-bold text-purple-900 mb-1">No SRS Data Yet</h3>
          <p className="text-sm text-purple-700">
            Students need to practice concepts to see SRS analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            SRS Analytics
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Spaced Repetition System effectiveness
          </p>
        </div>
        <button
          onClick={loadSRSData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Health Score Card */}
      <div className={`${getHealthBgColor(srsData.health_score)} rounded-lg p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">SRS Health Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${getHealthColor(srsData.health_score)}`}>
                {srsData.health_score}
              </span>
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <p className={`text-sm font-semibold mt-1 ${getHealthColor(srsData.health_score)}`}>
              {getHealthLabel(srsData.health_score)}
            </p>
          </div>
          <div className="text-right">
            {srsData.health_score >= 70 ? (
              <CheckCircle className="w-16 h-16 text-green-600" />
            ) : srsData.health_score >= 40 ? (
              <AlertTriangle className="w-16 h-16 text-yellow-600" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Concepts */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Concepts</p>
          <p className="text-3xl font-bold text-blue-600">{totalConcepts}</p>
        </div>

        {/* Review Adherence */}
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Review Adherence</p>
          <p className="text-3xl font-bold text-green-600">{srsData.review_adherence}%</p>
        </div>

        {/* Overdue Reviews */}
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Overdue Reviews</p>
          <p className="text-3xl font-bold text-red-600">{srsData.overdue_count}</p>
        </div>
      </div>

      {/* Concept Distribution */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Concept Distribution
        </h4>

        {distributionData.length > 0 ? (
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Pie Chart */}
            <div className="w-full md:w-1/2">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with Numbers */}
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">Struggling (&lt;40%)</span>
                </div>
                <span className="text-xl font-bold text-red-600">
                  {srsData.distribution.struggling}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-gray-700">Improving (40-70%)</span>
                </div>
                <span className="text-xl font-bold text-yellow-600">
                  {srsData.distribution.improving}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">Mastered (&gt;70%)</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {srsData.distribution.mastered}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No distribution data available</p>
        )}
      </div>

      {/* Overdue Students */}
      {overdueStudents.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Students with Overdue Reviews
          </h4>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="space-y-2">
              {overdueStudents.slice(0, 5).map((student, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-gray-900">{student.student_name}</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {student.overdue_count} overdue {student.overdue_count === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              ))}
            </div>

            {overdueStudents.length > 5 && (
              <button className="w-full text-center text-sm text-orange-600 hover:text-orange-800 font-semibold py-2 mt-2">
                View all {overdueStudents.length} students →
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-orange-200">
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                Send Review Reminders to All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SRSDashboard;
