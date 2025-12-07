/**
 * Simple Overview Component (Dec 2025)
 *
 * A streamlined teacher dashboard that shows:
 * 1. ONE daily priority (single actionable insight)
 * 2. THREE key metrics (students, avg score, needs help)
 * 3. Quick action buttons (Upload, Leaderboard, Edit Questions)
 *
 * This replaces the complex Overview for teachers who want simplicity.
 * Link to "View Detailed Analytics" for those who need more.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Upload,
  Trophy,
  Edit,
  BarChart3,
  Info
} from 'lucide-react';
import { getCurrentSession } from '../../services/authService';
import { getDailyPriority, getSimpleStats } from '../../services/teacherService';

const SimpleOverview = ({ onNavigate }) => {
  const session = getCurrentSession();

  const [priority, setPriority] = useState(null);
  const [stats, setStats] = useState({ totalStudents: 0, avgScore: 0, needsHelp: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!session?.institution_id) return;

    setLoading(true);
    try {
      const [priorityData, statsData] = await Promise.all([
        getDailyPriority(session.institution_id),
        getSimpleStats(session.institution_id)
      ]);

      setPriority(priorityData);
      setStats(statsData);
    } catch (error) {
      console.error('[SimpleOverview] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = () => {
    if (!priority) return <Info className="w-8 h-8 text-gray-400" />;

    switch (priority.severity) {
      case 'critical':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <BookOpen className="w-8 h-8 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getPriorityColor = () => {
    if (!priority) return 'border-gray-200 bg-gray-50';

    switch (priority.severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded-xl"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="h-16 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm">Your daily teaching snapshot</p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('analytics')}
          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
        >
          <BarChart3 className="w-4 h-4" />
          Detailed Analytics
        </button>
      </div>

      {/* Priority Card - Single Actionable Insight */}
      <div className={`rounded-xl border-2 p-6 ${getPriorityColor()}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getPriorityIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              Today's Priority
            </h3>
            <p className="text-gray-700 mb-2">
              {priority?.message || 'Loading...'}
            </p>
            <p className="text-sm text-gray-500">
              {priority?.action || ''}
            </p>
            {priority?.students && priority.students.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {priority.students.map((name, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border"
                  >
                    {name}
                  </span>
                ))}
                {priority.count > 3 && (
                  <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-400 border">
                    +{priority.count - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple Stats - 3 Key Metrics Only */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalStudents}
          </div>
          <div className="text-xs text-gray-500 font-medium">Students</div>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <div className="text-3xl font-bold text-gray-900">
            {stats.avgScore}%
          </div>
          <div className="text-xs text-gray-500 font-medium">Avg Score</div>
        </div>

        {/* Needs Help */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${stats.needsHelp > 0 ? 'text-red-500' : 'text-gray-300'}`} />
          <div className={`text-3xl font-bold ${stats.needsHelp > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {stats.needsHelp}
          </div>
          <div className="text-xs text-gray-500 font-medium">Need Help</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate && onNavigate('upload')}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
          >
            <Upload className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-green-700">Upload Audio</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('leaderboard')}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
          >
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700">Leaderboard</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('questions')}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Edit className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Edit Questions</span>
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-center text-xs text-gray-400">
        Want more details? Click "Detailed Analytics" above.
      </p>
    </div>
  );
};

export default SimpleOverview;
