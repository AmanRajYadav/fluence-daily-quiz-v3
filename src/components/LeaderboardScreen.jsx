import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award, ArrowLeft, Clock, Target, TrendingUp, Calendar, History as HistoryIcon } from 'lucide-react';
import { getTodaysLeaderboard, subscribeToLeaderboard, getTotalPoints } from '../services/quizService';
import LoadingSpinner from './LoadingSpinner';
import HistoricalLeaderboard from './HistoricalLeaderboard';

const LeaderboardScreen = ({ student, onBack }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('today'); // today, all-time
  const [showHistorical, setShowHistorical] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await getTodaysLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();

    // Subscribe to real-time updates
    const subscription = subscribeToLeaderboard(() => {
      loadLeaderboard();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadLeaderboard]);

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

  const currentStudent = leaderboard.find(entry => entry.student_id === student?.id);

  if (loading) {
    return <LoadingSpinner message="Loading leaderboard..." />;
  }

  return (
    <div className="min-h-screen game-bg p-4">
      {/* Historical Leaderboard Modal */}
      {showHistorical && (
        <HistoricalLeaderboard
          student={student}
          onClose={() => setShowHistorical(false)}
        />
      )}

      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-all mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>

          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-2 flex items-center justify-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-400" />
              Leaderboard
            </h1>
            <p className="text-cyan-300">Compete with your friends!</p>
          </div>

          {/* Historical Champions Button */}
          {leaderboard.length > 0 && (
            <div className="text-center">
              <button
                onClick={() => setShowHistorical(true)}
                className="neon-border-yellow bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-6 rounded-full
                  hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-105 shadow-xl
                  flex items-center gap-2 mx-auto"
              >
                <HistoryIcon className="w-5 h-5" />
                View Historical Champions
              </button>
            </div>
          )}
        </div>

        {/* Your Rank Card */}
        {currentStudent && (
          <div className="mb-6 neon-border-pink bg-gradient-to-r from-pink-900/40 to-purple-900/40 backdrop-blur-lg rounded-3xl p-6">
            <h3 className="text-sm font-bold text-pink-300 mb-3 uppercase tracking-wide">Your Ranking</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRankColor(currentStudent.rank)} flex items-center justify-center`}>
                  <span className="text-3xl">{getRankEmoji(currentStudent.rank)}</span>
                </div>
                <div>
                  <p className="text-white font-bold text-2xl">{student.display_name}</p>
                  <p className="text-pink-300 text-sm">Rank #{currentStudent.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-black text-4xl">{Math.round(currentStudent.score)}%</p>
                <p className="text-pink-300 text-sm">Score</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/10 p-3 rounded-lg text-center">
                <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-white font-bold">
                  {Math.floor(currentStudent.time_taken_seconds / 60)}m {currentStudent.time_taken_seconds % 60}s
                </p>
                <p className="text-cyan-300 text-xs">Time Taken</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg text-center">
                <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-white font-bold">
                  {currentStudent.rank === 1 ? 'Top Rank!' : `${leaderboard[0]?.score - currentStudent.score > 0 ? `+${Math.round(leaderboard[0]?.score - currentStudent.score)}%` : 'Tied'}`}
                </p>
                <p className="text-cyan-300 text-xs">To #1</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="neon-border-purple bg-gradient-to-br from-purple-900/60 to-purple-800/60 backdrop-blur-lg rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan-400" />
              Today's Rankings
            </h2>
            <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-bold">
              Live
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-20 h-20 text-cyan-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No Scores Yet</h3>
              <p className="text-cyan-300">Be the first to complete today's quiz!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => {
                const isCurrentStudent = entry.student_id === student?.id;
                const isTopThree = entry.rank <= 3;

                return (
                  <div
                    key={entry.id}
                    className={`p-5 rounded-2xl transition-all duration-200 ${
                      isCurrentStudent
                        ? 'neon-border-pink bg-pink-900/40 scale-[1.02]'
                        : isTopThree
                        ? 'neon-border-cyan bg-purple-900/40'
                        : 'neon-border-purple bg-purple-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getRankColor(entry.rank)} flex items-center justify-center font-black text-2xl`}>
                          {entry.rank <= 3 ? getRankEmoji(entry.rank) : `#${entry.rank}`}
                        </div>

                        {/* Avatar & Name */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-xl">
                              {entry.students?.display_name || 'Unknown'}
                            </span>
                            {isCurrentStudent && (
                              <span className="bg-pink-500/30 text-pink-300 px-2 py-0.5 rounded-full text-xs font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-cyan-300 text-sm flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {Math.round(entry.score)}%
                            </span>
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor(entry.time_taken_seconds / 60)}:{String(entry.time_taken_seconds % 60).padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Badge */}
                      {isTopThree && (
                        <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getRankColor(entry.rank)}`}>
                          <span className="text-white font-black text-lg">
                            {entry.rank === 1 ? '👑' : entry.rank === 2 ? '⭐' : '🎖️'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Motivational Message */}
        {!currentStudent && leaderboard.length > 0 && (
          <div className="mt-6 neon-border-yellow bg-yellow-900/20 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to Compete?</h3>
            <p className="text-yellow-300 mb-4">
              Complete today's quiz to see your rank on the leaderboard!
            </p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-6 rounded-full
                hover:from-yellow-500 hover:to-orange-500 transition-all"
            >
              Take Quiz Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;
