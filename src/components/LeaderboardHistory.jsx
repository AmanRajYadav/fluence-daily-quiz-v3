import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, X, TrendingUp, Crown, Medal, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const LeaderboardHistory = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // Days to show

  useEffect(() => {
    loadHistoricalLeaderboard();
  }, [timeRange]);

  const loadHistoricalLeaderboard = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          *,
          students (
            display_name
          )
        `)
        .eq('rank', 1) // Only get #1 winners
        .gte('quiz_date', startDateStr)
        .order('quiz_date', { ascending: false });

      if (error) throw error;

      // Group by date and find winner for each date
      const dateMap = new Map();
      data.forEach(entry => {
        if (!dateMap.has(entry.quiz_date)) {
          dateMap.set(entry.quiz_date, entry);
        }
      });

      setHistoricalData(Array.from(dateMap.values()));
    } catch (error) {
      console.error('Error loading historical leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getRankIcon = (rank) => {
    return <Crown className="w-6 h-6 text-yellow-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 rounded-3xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto neon-border-yellow"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-1 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Hall of Champions
            </h2>
            <p className="text-yellow-300">Who conquered each day?</p>
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
          {[7, 14, 30, 90].map((days) => (
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
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Loading champions...</p>
          </div>
        ) : historicalData.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Data Yet</h3>
            <p className="text-yellow-300">Complete quizzes to appear in history!</p>
          </div>
        ) : (
          <>
            {/* Winners Timeline - Horizontal Scrollable */}
            <div className="relative mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                Daily Champions Timeline
              </h3>

              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-purple-900/20">
                {historicalData.map((entry, index) => {
                  const isSelected = selectedDate === entry.quiz_date;
                  const dayName = getDayName(entry.quiz_date);

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedDate(isSelected ? null : entry.quiz_date)}
                      className={`flex-shrink-0 w-72 snap-center cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'neon-border-yellow bg-gradient-to-br from-yellow-900/40 to-orange-900/40 scale-105'
                          : 'neon-border-purple bg-gradient-to-br from-purple-900/40 to-blue-900/40 hover:scale-102'
                      } rounded-2xl p-6`}
                    >
                      {/* Date Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-yellow-300 text-sm font-bold">{dayName}</p>
                          <p className="text-white text-xs">
                            {new Date(entry.quiz_date + 'T00:00:00').toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Crown className="w-7 h-7 text-white" />
                        </div>
                      </div>

                      {/* Winner Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-2xl font-black text-white border-4 border-yellow-300">
                          {(entry.students?.display_name || 'U')[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-lg leading-tight">
                            {entry.students?.display_name || 'Unknown'}
                          </p>
                          <p className="text-yellow-300 text-sm">🏆 Champion</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <p className="text-yellow-300 text-xs">Score</p>
                          <p className="text-white font-black text-xl">{Math.round(entry.score)}%</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <p className="text-yellow-300 text-xs">Time</p>
                          <p className="text-white font-black text-sm">
                            {Math.floor(entry.time_taken_seconds / 60)}:{String(entry.time_taken_seconds % 60).padStart(2, '0')}
                          </p>
                        </div>
                      </div>

                      {/* Click indicator */}
                      {!isSelected && (
                        <div className="mt-3 text-center">
                          <p className="text-cyan-300 text-xs">Tap to expand</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Scroll hint */}
              {historicalData.length > 3 && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-purple-900 to-transparent pr-4 pl-8 py-8 pointer-events-none">
                  <ChevronRight className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
              )}
            </div>

            {/* Expanded Day Details */}
            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="neon-border-cyan bg-cyan-900/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Full Leaderboard for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h3>
                    <DayLeaderboard date={selectedDate} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Champion Stats Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-white font-black text-3xl">{historicalData.length}</p>
                <p className="text-cyan-300 text-sm">Days Tracked</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-white font-black text-3xl">
                  {[...new Set(historicalData.map(d => d.student_id))].length}
                </p>
                <p className="text-cyan-300 text-sm">Unique Champions</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-black text-3xl">
                  {Math.round(
                    historicalData.reduce((sum, d) => sum + d.score, 0) / historicalData.length || 0
                  )}%
                </p>
                <p className="text-cyan-300 text-sm">Avg. Winning Score</p>
              </div>
            </div>
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-6 rounded-xl
            hover:from-yellow-500 hover:to-orange-500 transition-all"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

// Component to show full leaderboard for a specific day
const DayLeaderboard = ({ date }) => {
  const [dayData, setDayData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDayLeaderboard();
  }, [date]);

  const loadDayLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          *,
          students (
            display_name
          )
        `)
        .eq('quiz_date', date)
        .order('rank', { ascending: true })
        .limit(10);

      if (error) throw error;
      setDayData(data || []);
    } catch (error) {
      console.error('Error loading day leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-2">
      {dayData.map((entry, index) => (
        <div
          key={entry.id}
          className={`p-3 rounded-xl flex items-center justify-between ${
            entry.rank === 1
              ? 'bg-yellow-500/20 neon-border-yellow'
              : entry.rank === 2
              ? 'bg-gray-400/20 neon-border-cyan'
              : entry.rank === 3
              ? 'bg-orange-500/20'
              : 'bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
              entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
              entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
              entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' :
              'bg-white/20 text-cyan-300'
            }`}>
              #{entry.rank}
            </div>
            <p className="text-white font-bold">{entry.students?.display_name || 'Unknown'}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-black text-lg">{Math.round(entry.score)}%</p>
            <p className="text-cyan-300 text-xs">
              {Math.floor(entry.time_taken_seconds / 60)}:{String(entry.time_taken_seconds % 60).padStart(2, '0')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeaderboardHistory;
