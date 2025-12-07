import React from 'react';
import { motion } from 'framer-motion';

/**
 * Landing Page
 * Choose: Student (Register/Login) or Teacher (Login)
 */

const LandingPage = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            🎓 Fluence
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-2">
            Master Your Studies with AI
          </p>
          <p className="text-gray-500">
            Personalized quizzes • Spaced Repetition • Real-time Progress
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Students
              </h2>
              <p className="text-gray-600">
                Take daily quizzes, track your progress, and compete with classmates
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onNavigate('student-register')}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Join a Class
              </button>
              <button
                onClick={() => onNavigate('student-login')}
                className="w-full bg-white hover:bg-gray-50 text-green-600 font-medium py-3 px-6 rounded-xl border-2 border-green-500 transition-colors"
              >
                Student Login
              </button>
            </div>

            {/* Features */}
            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <p>✓ Personalized AI-generated quizzes</p>
              <p>✓ Track concept mastery</p>
              <p>✓ Weekly leaderboards</p>
            </div>
          </motion.div>

          {/* Teacher Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">👨‍🏫</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Teachers
              </h2>
              <p className="text-gray-600">
                Manage students, view analytics, and track class performance
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onNavigate('teacher-login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Teacher Login
              </button>
              <button
                onClick={() => window.location.href = '/contact'}
                className="w-full bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-6 rounded-xl border-2 border-blue-600 transition-colors"
              >
                New Institution?
              </button>
            </div>

            {/* Features */}
            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <p>✓ Student management dashboard</p>
              <p>✓ Performance analytics</p>
              <p>✓ Question editing</p>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p>
            © 2025 Fluence • Built with ❤️ for better learning
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
