import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { loginStudent, checkRateLimit } from '../../services/authService';

/**
 * Student Login Screen
 * Class Code + Username + 4-Digit PIN
 */

const StudentLogin = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    classCode: '',
    username: '',
    pin: ''
  });

  const [rememberMe, setRememberMe] = useState(true);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.classCode.trim()) {
      setError('Please enter your class code');
      return;
    }

    if (!formData.username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (!/^\d{4}$/.test(formData.pin)) {
      setError('PIN must be 4 digits');
      return;
    }

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(formData.username, formData.classCode);
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.message);
      return;
    }

    setLogging(true);

    // Attempt login
    const result = await loginStudent(
      formData.classCode.toUpperCase(),
      formData.username.toLowerCase(),
      formData.pin
    );

    setLogging(false);

    if (result.success) {
      // Success! Redirect to dashboard
      if (onSuccess) {
        onSuccess(result.student, result.session);
      }
    } else {
      setError(result.error || 'Login failed');
      // Clear PIN on failed attempt
      setFormData(prev => ({ ...prev, pin: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎓 Fluence
            </h1>
            <p className="text-gray-600">
              Student Login
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Code
              </label>
              <input
                type="text"
                name="classCode"
                value={formData.classCode}
                onChange={handleChange}
                placeholder="FLUENCE-CLASS6-2025"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-center font-medium"
                disabled={logging}
                autoFocus
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="anaya01"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                disabled={logging}
                required
              />
            </div>

            {/* PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN
              </label>
              <input
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                placeholder="••••"
                maxLength="4"
                pattern="\d{4}"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-center text-2xl tracking-widest"
                disabled={logging}
                required
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                Remember me on this device
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={logging}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {logging ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm text-gray-600">
              Forgot your PIN?{' '}
              <a href="/forgot-pin" className="text-green-600 hover:text-green-700 font-medium">
                Contact your teacher
              </a>
            </p>
            <p className="text-sm text-gray-600">
              New student?{' '}
              <a href="/register" className="text-green-600 hover:text-green-700 font-medium">
                Join a class
              </a>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-white/50 rounded-xl backdrop-blur-sm text-center">
          <p className="text-xs text-gray-600">
            💡 <strong>Tip:</strong> Your username and PIN were provided during registration.
            If you forgot them, ask your teacher for help.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentLogin;
