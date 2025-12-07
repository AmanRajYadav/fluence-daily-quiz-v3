import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { getTodaysLeaderboard, subscribeToLeaderboard } from '../services/quizService';
import { formatTime } from '../utils/timeUtils';

const Leaderboard = ({ currentStudentId, currentScore }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      console.log('[Leaderboard Component] Loading leaderboard...');
      const data = await getTodaysLeaderboard();
      console.log('[Leaderboard Component] Leaderboard data received:', data);
      setLeaderboard(data);
    } catch (error) {
      console.error('[Leaderboard Component] Error loading leaderboard:', error);
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
      subscription.unsubscribe();
    };
  }, [loadLeaderboard]);

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="w-8 h-8 text-yellow-400" />;
      case 2: return <Medal className="w-8 h-8 text-gray-300" />;
      case 3: return <Award className="w-8 h-8 text-orange-400" />;
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

  if (loading) {
    return (
      <div className="neon-border-purple bg-gradient-to-br from-purple-900/60 to-purple-800/60 backdrop-blur-lg rounded-3xl p-8">
        <h2 className="text-3xl font-black text-cyan-300 mb-4 flex items-center gap-2 uppercase neon-text-cyan">
          <Trophy className="w-8 h-8" />
          Leaderboard
        </h2>
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="neon-border-purple bg-gradient-to-br from-purple-900/60 to-purple-800/60 backdrop-blur-lg rounded-3xl p-8">
      <h2 className="text-3xl font-black text-cyan-300 mb-6 flex items-center gap-2 uppercase neon-text-cyan">
        <Trophy className="w-8 h-8" />
        Leaderboard
      </h2>

      {leaderboard.length === 0 ? (
        <p className="text-white/60 text-center">No scores yet today. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isCurrentStudent = entry.student_id === currentStudentId;
            const isTopThree = entry.rank <= 3;

            return (
              <div
                key={entry.id}
                className={`p-4 rounded-2xl transition-all duration-200 ${
                  isCurrentStudent
                    ? 'neon-border-pink bg-pink-900/40 scale-105'
                    : isTopThree
                    ? 'neon-border-cyan bg-purple-900/40'
                    : 'neon-border-purple bg-purple-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar Circle */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xl font-black text-white">
                      {(entry.students?.full_name || entry.students?.username || 'U')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getRankEmoji(entry.rank)}</span>
                        <span className="text-white font-bold text-lg">
                          {entry.students?.full_name || entry.students?.username || 'Unknown'}
                        </span>
                      </div>
                      {isCurrentStudent && (
                        <span className="text-cyan-300 text-sm font-semibold">(You)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="coin-badge px-3 py-1 rounded-full inline-block">
                      <span className="text-white font-black text-lg">
                        {Math.round(entry.avg_score || entry.score || 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {currentScore !== null && !leaderboard.find(e => e.student_id === currentStudentId) && (
        <div className="mt-4 p-4 neon-border-cyan bg-cyan-900/30 rounded-2xl">
          <p className="text-white text-center font-semibold">
            Your score: <span className="text-cyan-300 font-black text-xl">{Math.round(currentScore)}%</span>
            <br />
            <span className="text-sm text-cyan-300/80">Submit to see your rank!</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
