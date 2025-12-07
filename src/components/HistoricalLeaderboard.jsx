import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, TrendingUp, Crown, Medal, Award, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import LoadingSpinner from './LoadingSpinner';

const HistoricalLeaderboard = ({ student, onClose }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7'); // 7, 30, 90 days

  useEffect(() => {
    loadHistoricalData();
  }, [timeRange]);

  const loadHistoricalData = async () => {
    setLoading(true);
    try {
      // Calculate date range (in weeks)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));
      const startDateStr = startDate.toISOString().split('T')[0];

      // ✅ FIXED: Fetch WEEKLY leaderboard data (V3)
      const { data, error } = await supabase
        .from('weekly_leaderboard')  // ✅ Changed from 'leaderboard'
        .select(`
          *,
          students (
            username,
            full_name
          )
        `)
        .gte('week_start_date', startDateStr)  // ✅ Changed from 'quiz_date'
        .lte('week_start_date', endDate)
        .order('week_start_date', { ascending: false })  // ✅ Changed from 'quiz_date'
        .order('rank', { ascending: true });

      if (error) throw error;

      // ✅ Group by week_start_date (instead of quiz_date)
      const grouped = {};
      data.forEach(entry => {
        if (!grouped[entry.week_start_date]) {
          grouped[entry.week_start_date] = [];
        }
        grouped[entry.week_start_date].push(entry);
      });

      // Convert to array and sort by date (most recent first)
      const groupedArray = Object.entries(grouped)
        .map(([date, entries]) => ({
          date,
          entries: entries.slice(0, 3), // Top 3 only
          totalParticipants: entries.length
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setHistoricalData(groupedArray);
    } catch (error) {
      console.error('Error loading historical leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Crown className="w-8 h-8 text-yellow-400" />;
      case 2: return <Medal className="w-7 h-7 text-gray-300" />;
      case 3: return <Award className="w-6 h-6 text-orange-400" />;
      default: return null;
    }
  };

  const getRankEmoji = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return 'from-yellow-500 to-orange-500';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-orange-400 to-red-500';
      default: return 'from-cyan-500 to-purple-600';
    }
  };

  // Calculate student statistics
  const getStudentStats = () => {
    if (!student || historicalData.length === 0) return null;

    let firstPlaces = 0;
    let secondPlaces = 0;
    let thirdPlaces = 0;
    let totalAppearances = 0;

    historicalData.forEach(day => {
      const studentEntry = day.entries.find(e => e.student_id === student.id);
      if (studentEntry) {
        totalAppearances++;
        if (studentEntry.rank === 1) firstPlaces++;
        if (studentEntry.rank === 2) secondPlaces++;
        if (studentEntry.rank === 3) thirdPlaces++;
      }
    });

    return {
      firstPlaces,
      secondPlaces,
      thirdPlaces,
      totalAppearances,
      winRate: totalAppearances > 0 ? ((firstPlaces / totalAppearances) * 100).toFixed(1) : 0
    };
  };

  const stats = getStudentStats();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 rounded-3xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto neon-border-yellow">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-gradient-to-br from-purple-900/95 to-blue-900/95 z-10 pb-4">
          <div>
            <h2 className="text-3xl font-black text-white mb-1 flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Weekly Champions
            </h2>
            <p className="text-yellow-300">See who dominated each week!</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {['7', '30', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                timeRange === days
                  ? 'bg-yellow-500 text-black neon-border-yellow'
                  : 'bg-white/10 text-yellow-300 hover:bg-white/20'
              }`}
            >
              Last {days} Days
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner message="Loading champions history..." />
        ) : historicalData.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-20 h-20 text-yellow-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Historical Data</h3>
            <p className="text-yellow-300">Complete more quizzes to see the champions!</p>
          </div>
        ) : (
          <>
            {/* Student Stats Cards (if student is logged in) */}
            {stats && stats.totalAppearances > 0 && (
              <div className="mb-6 neon-border-pink bg-gradient-to-r from-pink-900/40 to-purple-900/40 backdrop-blur-lg rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-400" />
                  Your Performance (Last {timeRange} Days)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-yellow-300 text-sm mb-1">🥇 1st Place</p>
                    <p className="text-white font-black text-2xl">{stats.firstPlaces}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-gray-300 text-sm mb-1">🥈 2nd Place</p>
                    <p className="text-white font-black text-2xl">{stats.secondPlaces}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-orange-300 text-sm mb-1">🥉 3rd Place</p>
                    <p className="text-white font-black text-2xl">{stats.thirdPlaces}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-cyan-300 text-sm mb-1">Total</p>
                    <p className="text-white font-black text-2xl">{stats.totalAppearances}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-green-300 text-sm mb-1">Win Rate</p>
                    <p className="text-white font-black text-2xl">{stats.winRate}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Weekly Winners Cards */}
            <div className="space-y-4">
              {historicalData.map((day, index) => {
                const displayDate = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                });

                // Check if this is the current week
                const today = new Date();
                const dayOfWeek = today.getDay();
                const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                const thisMonday = new Date(today.setDate(diff));
                const thisMondayStr = thisMonday.toISOString().split('T')[0];
                const isCurrentWeek = day.date === thisMondayStr;

                return (
                  <div
                    key={day.date}
                    className={`rounded-3xl p-6 transition-all ${
                      isCurrentWeek
                        ? 'neon-border-yellow bg-gradient-to-br from-yellow-900/40 to-orange-900/40'
                        : 'neon-border-purple bg-gradient-to-br from-purple-900/40 to-blue-900/40'
                    }`}
                  >
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-6 h-6 ${isCurrentWeek ? 'text-yellow-400' : 'text-cyan-400'}`} />
                        <div>
                          <h3 className="text-xl font-bold text-white">Week of {displayDate}</h3>
                          <p className={`text-sm ${isCurrentWeek ? 'text-yellow-300' : 'text-cyan-300'}`}>
                            {day.totalParticipants} {day.totalParticipants === 1 ? 'participant' : 'participants'}
                          </p>
                        </div>
                      </div>
                      {isCurrentWeek && (
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                          THIS WEEK
                        </span>
                      )}
                    </div>

                    {/* Top 3 Podium */}
                    <div className="grid grid-cols-3 gap-4">
                      {day.entries.map((entry, podiumIndex) => {
                        const isCurrentStudent = entry.student_id === student?.id;
                        const rank = entry.rank;

                        return (
                          <div
                            key={entry.id}
                            className={`relative ${
                              isCurrentStudent
                                ? 'neon-border-pink bg-pink-900/40 scale-105'
                                : 'bg-white/10'
                            } rounded-2xl p-4 text-center transition-all hover:scale-105`}
                          >
                            {/* Rank Badge */}
                            <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-3xl font-black`}>
                              {getRankEmoji(rank)}
                            </div>

                            {/* Student Name */}
                            <p className={`font-bold text-sm mb-1 ${isCurrentStudent ? 'text-pink-300' : 'text-white'}`}>
                              {entry.students?.full_name || entry.students?.username || 'Unknown'}
                              {isCurrentStudent && (
                                <span className="block text-xs text-pink-400 mt-1">(You)</span>
                              )}
                            </p>

                            {/* Score (Weekly Average) */}
                            <p className="text-2xl font-black text-white mb-1">
                              {Math.round(entry.avg_score || entry.score || 0)}%
                            </p>

                            {/* Total Points */}
                            <p className="text-xs text-cyan-300 font-bold">
                              {entry.total_points || 0} pts
                            </p>

                            {/* Quizzes Taken */}
                            <p className="text-xs text-gray-300">
                              {entry.quizzes_taken || 0} {entry.quizzes_taken === 1 ? 'quiz' : 'quizzes'}
                            </p>

                            {/* Crown for winner */}
                            {rank === 1 && (
                              <div className="absolute -top-3 -right-3">
                                <Crown className="w-8 h-8 text-yellow-400 animate-pulse" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-6 rounded-xl
            hover:from-yellow-500 hover:to-orange-500 transition-all sticky bottom-0"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default HistoricalLeaderboard;
