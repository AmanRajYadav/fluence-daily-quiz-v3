import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, X, Calendar } from 'lucide-react';
import { getQuizHistory } from '../../services/historyService';

const ProgressChart = ({ student, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90 days

  useEffect(() => {
    if (student) {
      loadHistory();
    }
  }, [student, timeRange]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getQuizHistory(student.id);

      // Filter by time range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

      const filtered = data.filter(quiz => {
        const quizDate = new Date(quiz.quiz_date);
        return quizDate >= cutoffDate;
      }).sort((a, b) => new Date(a.quiz_date) - new Date(b.quiz_date));

      setHistory(filtered);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const calculateStats = () => {
    if (history.length === 0) return null;

    const scores = history.map(q => q.score);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const latest = scores[scores.length - 1];
    const first = scores[0];
    const change = latest - first;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      average: average.toFixed(1),
      latest: latest.toFixed(1),
      first: first.toFixed(1),
      change: Math.abs(change).toFixed(1),
      trend,
      totalQuizzes: history.length
    };
  };

  const stats = calculateStats();

  // Prepare chart data points
  const getChartPoints = () => {
    if (history.length === 0) return '';

    const padding = 20;
    const width = 100 - padding * 2;
    const height = 100 - padding * 2;

    // Find min and max scores for scaling
    const scores = history.map(q => q.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreRange = maxScore - minScore || 1; // Avoid division by zero

    // Generate points
    const points = history.map((quiz, index) => {
      const x = padding + (width * index) / (history.length - 1 || 1);
      const y = 100 - padding - ((quiz.score - minScore) / scoreRange) * height;
      return `${x},${y}`;
    }).join(' ');

    return points;
  };

  const chartPoints = getChartPoints();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto neon-border-cyan">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-1">📈 Progress Chart</h2>
            <p className="text-cyan-300">Your learning journey over time</p>
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
                  ? 'bg-cyan-500 text-white neon-border-cyan'
                  : 'bg-white/10 text-cyan-300 hover:bg-white/20'
              }`}
            >
              Last {days} Days
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-white">Loading your progress...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-20 h-20 text-cyan-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Data Yet</h3>
            <p className="text-cyan-300">Complete more quizzes to see your progress!</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <p className="text-cyan-300 text-sm mb-1">Total Quizzes</p>
                <p className="text-white font-black text-3xl">{stats.totalQuizzes}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <p className="text-cyan-300 text-sm mb-1">Average Score</p>
                <p className="text-white font-black text-3xl">{stats.average}%</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <p className="text-cyan-300 text-sm mb-1">Latest Score</p>
                <p className="text-white font-black text-3xl">{stats.latest}%</p>
              </div>
              <div className={`bg-white/10 rounded-2xl p-4 text-center ${
                stats.trend === 'up' ? 'neon-border-green' : stats.trend === 'down' ? 'neon-border-pink' : ''
              }`}>
                <p className="text-cyan-300 text-sm mb-1">Trend</p>
                <div className="flex items-center justify-center gap-1">
                  {stats.trend === 'up' && <TrendingUp className="w-6 h-6 text-green-400" />}
                  {stats.trend === 'down' && <TrendingDown className="w-6 h-6 text-red-400" />}
                  <p className={`font-black text-2xl ${
                    stats.trend === 'up' ? 'text-green-400' : stats.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {stats.change}%
                  </p>
                </div>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 neon-border-purple">
              <svg viewBox="0 0 100 100" className="w-full h-64" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="10" y1="20" x2="90" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                <line x1="10" y1="40" x2="90" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                <line x1="10" y1="60" x2="90" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                <line x1="10" y1="80" x2="90" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />

                {/* Area under the line (gradient fill) */}
                {chartPoints && (
                  <polygon
                    points={`10,90 ${chartPoints} 90,90`}
                    fill="url(#gradient)"
                    opacity="0.3"
                  />
                )}

                {/* The line */}
                {chartPoints && (
                  <polyline
                    points={chartPoints}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data points */}
                {history.map((quiz, index) => {
                  const scores = history.map(q => q.score);
                  const maxScore = Math.max(...scores);
                  const minScore = Math.min(...scores);
                  const scoreRange = maxScore - minScore || 1;

                  const x = 10 + (80 * index) / (history.length - 1 || 1);
                  const y = 90 - ((quiz.score - minScore) / scoreRange) * 70;

                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="0.8"
                      fill="#06b6d4"
                      className="drop-shadow-lg"
                    />
                  );
                })}

                {/* Gradients */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0 }} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between mt-2 text-xs text-cyan-300">
                <span>{new Date(history[0].quiz_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                {history.length > 2 && (
                  <span>{new Date(history[Math.floor(history.length / 2)].quiz_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                )}
                <span>{new Date(history[history.length - 1].quiz_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Recent Quizzes List */}
            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-4">Recent Performance</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.slice().reverse().map((quiz, index) => (
                  <div
                    key={quiz.id}
                    className="bg-white/10 rounded-xl p-3 flex items-center justify-between hover:bg-white/20 transition-all"
                  >
                    <div>
                      <p className="text-white font-bold">
                        {new Date(quiz.quiz_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-cyan-300 text-sm">
                        {quiz.correct_answers}/{quiz.total_questions} correct
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-2xl">{quiz.score.toFixed(0)}%</p>
                      <p className="text-cyan-300 text-xs">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-3 px-6 rounded-xl
            hover:from-cyan-500 hover:to-blue-500 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ProgressChart;
