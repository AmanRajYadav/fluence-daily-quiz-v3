import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Lightbulb, TrendingUp, Target } from 'lucide-react';

/**
 * FeedbackScreen Component
 * Displays AI-generated feedback after quiz completion
 * Uses Duolingo-inspired design: cute, colorful, encouraging
 *
 * Colors:
 * - Strengths: Green (#58CC02)
 * - Weaknesses: Orange (#FF9600)
 * - AI Insights: Blue (#1CB0F6)
 */
const FeedbackScreen = ({ feedback, score, onContinue, onPractice }) => {
  // Handle missing feedback gracefully
  if (!feedback) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">Feedback not available</p>
      </div>
    );
  }

  const { strengths = [], weaknesses = [], ai_insights = '' } = feedback;

  // Determine encouragement based on score
  const getEncouragement = (scoreValue) => {
    if (scoreValue >= 90) return { emoji: '🎉', message: 'Outstanding!' };
    if (scoreValue >= 75) return { emoji: '🌟', message: 'Great Job!' };
    if (scoreValue >= 60) return { emoji: '👍', message: 'Good Work!' };
    if (scoreValue >= 40) return { emoji: '💪', message: 'Keep Going!' };
    return { emoji: '📚', message: 'Practice More!' };
  };

  const encouragement = getEncouragement(score);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center"
      >
        <div className="text-6xl mb-2">{encouragement.emoji}</div>
        <h2 className="text-3xl font-black text-white mb-1">{encouragement.message}</h2>
        <p className="text-cyan-300 text-lg">Score: {Math.round(score)}%</p>
      </motion.div>

      {/* Strengths Section */}
      {strengths.length > 0 && (
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-lg rounded-2xl p-5 border-2 border-green-500/30"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-green-300">💪 Your Strengths</h3>
          </div>
          <div className="space-y-2">
            {strengths.map((strength, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2 text-white bg-green-500/20 rounded-lg p-3"
              >
                <span className="text-green-400">✓</span>
                <span className="font-semibold">{strength}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weaknesses Section */}
      {weaknesses.length > 0 && (
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 backdrop-blur-lg rounded-2xl p-5 border-2 border-orange-500/30"
        >
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-6 h-6 text-orange-400" />
            <h3 className="text-xl font-bold text-orange-300">📚 Practice These</h3>
          </div>
          <div className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-2 text-white bg-orange-500/20 rounded-lg p-3"
              >
                <span className="text-orange-400">→</span>
                <span className="font-semibold">{weakness}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Insights Section */}
      {ai_insights && (
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-lg rounded-2xl p-5 border-2 border-blue-500/30"
        >
          <div className="flex items-center gap-3 mb-3">
            <Lightbulb className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-blue-300">💡 AI Insights</h3>
          </div>
          <div className="text-white bg-blue-500/20 rounded-lg p-4 leading-relaxed">
            <p className="font-medium whitespace-pre-wrap">{ai_insights}</p>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-4 pt-4"
      >
        {onPractice && weaknesses.length > 0 && (
          <button
            onClick={onPractice}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 px-6 rounded-xl
              hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105
              shadow-lg flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Practice Now
          </button>
        )}
        <button
          onClick={onContinue}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl
            hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105
            shadow-lg"
        >
          Continue
        </button>
      </motion.div>

      {/* Fun Fact Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-sm text-cyan-400/60 pt-2"
      >
        <p>🧠 Keep practicing to strengthen your neural pathways!</p>
      </motion.div>
    </div>
  );
};

export default FeedbackScreen;
