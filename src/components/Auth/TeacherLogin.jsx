import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { loginTeacher } from '../../services/authService';

/**
 * Teacher Login Screen
 * Email + Password
 */

const TeacherLogin = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [rememberMe, setRememberMe] = useState(true);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLogging(true);

    // Attempt login
    const result = await loginTeacher(
      formData.email.toLowerCase(),
      formData.password
    );

    setLogging(false);

    if (result.success) {
      // Success! Redirect to teacher dashboard
      if (onSuccess) {
        onSuccess(result.teacher, result.session);
      }
    } else {
      setError(result.error || 'Login failed');
      // Clear password on failed attempt
      setFormData(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              👨‍🏫 Fluence
            </h1>
            <p className="text-gray-600">
              Teacher Portal Login
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="aman@fluence.ac"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                disabled={logging}
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none pr-12"
                  disabled={logging}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </a>
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {logging ? 'Logging in...' : 'Login to Dashboard'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm text-gray-600">
              Student?{' '}
              <a href="/login" className="text-green-600 hover:text-green-700 font-medium">
                Login here
              </a>
            </p>
            <p className="text-sm text-gray-600">
              New institution?{' '}
              <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact us
              </a>
            </p>
          </div>
        </div>

        {/* Default Credentials Info (Remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
            <p className="text-xs text-yellow-800 font-medium">
              🔧 DEV MODE - Default Credentials:
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Email: aman@fluence.ac | Password: aman@123
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              (Change password on first login)
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TeacherLogin;
