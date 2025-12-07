/**
 * Stats Cards Component
 *
 * Displays 4 key statistics for the institution dashboard:
 * - Total Students
 * - Quizzes This Week
 * - Average Score This Week
 * - Active Students This Week
 *
 * Uses getDashboardStats() from teacherService
 */

import React, { useState, useEffect } from 'react';
import { Users, BookOpen, TrendingUp, UserCheck } from 'lucide-react';
import { getDashboardStats } from '../../services/teacherService';
import { getCurrentSession } from '../../services/authService';

const StatsCards = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    quizzes_this_week: 0,
    avg_score: 0,
    active_this_week: 0
  });
  const [loading, setLoading] = useState(true);
  const session = getCurrentSession();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats(session.institution_id);
      setStats(data);
    } catch (error) {
      console.error('[StatsCards] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Students',
      value: stats.total_students,
      icon: Users,
      bgColor: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Quizzes This Week',
      value: stats.quizzes_this_week,
      icon: BookOpen,
      bgColor: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Average Score',
      value: `${stats.avg_score}%`,
      icon: TrendingUp,
      bgColor: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtitle: 'This week'
    },
    {
      title: 'Active Students',
      value: stats.active_this_week,
      icon: UserCheck,
      bgColor: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      subtitle: 'This week'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          {/* Icon */}
          <div className={`${card.iconBg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
            <card.icon className={`w-6 h-6 ${card.iconColor}`} />
          </div>

          {/* Title */}
          <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>

          {/* Value */}
          <p className="text-3xl font-black text-gray-900 mb-1">{card.value}</p>

          {/* Subtitle */}
          {card.subtitle && (
            <p className="text-xs text-gray-500">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
