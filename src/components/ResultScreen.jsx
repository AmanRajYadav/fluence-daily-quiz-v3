import React, { useEffect, useState } from 'react';
import { Trophy, Target, TrendingUp, Home, Flame, Heart, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import Leaderboard from './Leaderboard';
import FeedbackScreen from './Feedback/FeedbackScreen';
import { soundService } from '../services/soundService';

const ResultScreen = ({
  score,
  correctAnswers,
  incorrectAnswers = 0,
  totalQuestions,
  timeTaken,
  studentId,
  onRestart,
  lives = 0, // kept for future arcade mode
  maxStreak = 0,
  totalScore = 0,
  onSubmit,
  submitting = false,
  submitted = false,
  submitError = null,
  isReplayMode = false,
  feedback = null // V3: AI-generated feedback from n8n workflow
}) => {
  const percentage = Math.round(score);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Play completion sound
    soundService.play('complete');

    // Show confetti for high scores
    if (percentage >= 70) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    // Debug logging for feedback
    console.log('[ResultScreen] Props received:', {
      submitted,
      isReplayMode,
      hasFeedback: !!feedback,
      feedback
    });
  }, [percentage, submitted, feedback, isReplayMode]);

  const getMessage = () => {
    if (percentage >= 90) return { text: "Outstanding! 🌟", color: "text-yellow-400" };
    if (percentage >= 75) return { text: "Great Job! 🎉", color: "text-green-400" };
    if (percentage >= 60) return { text: "Good Work! 👍", color: "text-blue-400" };
    return { text: "Keep Practicing! 💪", color: "text-orange-400" };
  };

  const message = getMessage();

  return (
    <div className="min-h-screen game-bg p-4 flex items-center justify-center">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <div className="max-w-4xl w-full space-y-6">
        {/* Main Result Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="neon-border-purple bg-gradient-to-br from-purple-900/60 to-purple-800/60 backdrop-blur-lg rounded-3xl p-8 text-center shadow-2xl"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: 2 }}
          >
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
          </motion.div>

          <h1 className={`text-5xl font-bold mb-4 ${message.color}`}>
            {message.text}
          </h1>

          <div className="text-7xl font-bold text-white mb-6">
            {percentage}%
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="neon-border-cyan bg-cyan-900/30 rounded-2xl p-4">
              <Target className="w-8 h-8 text-cyan-300 mx-auto mb-2" />
              <div className="text-cyan-300 text-sm font-semibold">Score</div>
              <div className="text-white font-black text-2xl">
                {correctAnswers}/{totalQuestions}
              </div>
            </div>

            <div className="neon-border-purple bg-purple-900/30 rounded-2xl p-4">
              <TrendingUp className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <div className="text-purple-300 text-sm font-semibold">Accuracy</div>
              <div className="text-white font-black text-2xl">
                {percentage}%
              </div>
            </div>

            <div className="neon-border-pink bg-red-900/30 rounded-2xl p-4">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-red-300 text-sm font-semibold">Incorrect</div>
              <div className="text-white font-black text-2xl">
                {incorrectAnswers}
              </div>
            </div>

            <div className="neon-border-purple bg-orange-900/30 rounded-2xl p-4">
              <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-orange-300 text-sm font-semibold">Best Streak</div>
              <div className="text-white font-black text-2xl">
                {maxStreak}
              </div>
            </div>
          </div>

          {totalScore > 0 && !isReplayMode && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 border border-purple-400/30">
              <div className="text-white/80 text-sm mb-1">Total Points Earned</div>
              <div className="text-white font-bold text-3xl">{totalScore}</div>
            </div>
          )}

          {/* Replay Mode Message */}
          {isReplayMode && (
            <div className="bg-cyan-500/20 border border-cyan-400 rounded-xl p-4 mb-6 flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-cyan-400" />
              <span className="text-cyan-400 font-bold">Review Complete - No Points Awarded</span>
            </div>
          )}

          {/* Submit Results Section - Only show in regular quiz mode */}
          {!isReplayMode && (
            <div className="space-y-4 mb-6">
              {!submitted && !submitError && (
                <button
                  onClick={onSubmit}
                  disabled={submitting}
                  className="neon-border-pink bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-black text-lg py-4 px-8 rounded-full
                    hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-105
                    shadow-2xl flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wider"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Submitting Results...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Results
                    </>
                  )}
                </button>
              )}

              {submitted && (
                <div className="bg-green-500/20 border border-green-400 rounded-xl p-4 flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-green-400 font-bold">Results Submitted Successfully!</span>
                </div>
              )}

              {submitError && (
                <div className="space-y-3">
                  <div className="bg-red-500/20 border border-red-400 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                      <span className="text-red-400 font-bold">Submission Failed</span>
                    </div>
                    <p className="text-red-300 text-sm">{submitError}</p>
                  </div>
                  <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="bg-gradient-to-r from-red-400 to-pink-500 text-white font-bold py-3 px-6 rounded-xl
                      hover:from-red-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105
                      shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Retry Submission
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onRestart}
            className="neon-border-cyan bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-lg py-4 px-8 rounded-full
              hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105
              shadow-2xl flex items-center gap-2 mx-auto uppercase tracking-wider"
          >
            <Home className="w-6 h-6" />
            Back to Home
          </button>
        </motion.div>

        {/* AI Feedback Section - V3 Feature */}
        {feedback && submitted && !isReplayMode && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="neon-border-purple bg-gradient-to-br from-purple-900/60 to-purple-800/60 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <FeedbackScreen
              feedback={feedback}
              score={score}
              onContinue={onRestart}
              onPractice={() => {
                // TODO: Implement practice mode for weak concepts
                alert('Practice mode coming soon! 🚀');
              }}
            />
          </motion.div>
        )}

        {/* Leaderboard */}
        <Leaderboard currentStudentId={studentId} currentScore={score} />
      </div>
    </div>
  );
};

export default ResultScreen;
