import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyClassCode, registerStudent, checkUsernameAvailability } from '../../services/authService';

/**
 * Student Registration Flow
 * Step 1: Enter Class Code
 * Step 2: Fill Registration Form
 * Step 3: Success → Redirect to quiz
 */

const StudentRegistration = ({ onSuccess }) => {
  // Step management
  const [step, setStep] = useState(1); // 1 = Class Code, 2 = Form

  // Step 1: Class Code
  const [classCode, setClassCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [classData, setClassData] = useState(null);

  // Step 2: Registration Form
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    pin: '',
    confirmPin: '',
    phoneNumber: '',
    email: ''
  });

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  // ============================================
  // STEP 1: VERIFY CLASS CODE
  // ============================================

  const handleVerifyClassCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!classCode.trim()) {
      setError('Please enter a class code');
      return;
    }

    setVerifying(true);

    const result = await verifyClassCode(classCode);

    setVerifying(false);

    if (result.success) {
      setClassData(result.class);
      setStep(2); // Move to registration form
    } else {
      setError(result.error || 'Invalid class code');
    }
  };

  // ============================================
  // STEP 2: REGISTRATION FORM
  // ============================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset username availability when username changes
    if (name === 'username') {
      setUsernameAvailable(null);
    }
  };

  const handleUsernameBlur = async () => {
    if (!formData.username.trim() || !classData) return;

    setUsernameChecking(true);

    const result = await checkUsernameAvailability(
      classData.institution_id,
      formData.username
    );

    setUsernameChecking(false);

    if (result.available) {
      setUsernameAvailable(true);
    } else if (result.taken) {
      setUsernameAvailable(false);
      setError('Username already taken. Try another one.');
    } else {
      setError(result.error || 'Failed to check username');
    }
  };

  const validateForm = () => {
    // Full name
    if (!formData.fullName.trim() || formData.fullName.length < 3) {
      setError('Full name must be at least 3 characters');
      return false;
    }

    // Username
    if (!formData.username.trim() || formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!usernameAvailable) {
      setError('Username is not available or not checked');
      return false;
    }

    // PIN
    if (!/^\d{4}$/.test(formData.pin)) {
      setError('PIN must be exactly 4 digits');
      return false;
    }

    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match');
      return false;
    }

    // Phone number
    if (!/^(\+91)?[6-9]\d{9}$/.test(formData.phoneNumber.replace(/[\s\-]/g, ''))) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }

    // Email (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setRegistering(true);

    // Normalize phone number
    let phoneNumber = formData.phoneNumber.replace(/[\s\-]/g, '');
    if (!phoneNumber.startsWith('+91')) {
      phoneNumber = `+91${phoneNumber}`;
    }

    const result = await registerStudent({
      classCode: classData.class_code,
      fullName: formData.fullName.trim(),
      username: formData.username.trim().toLowerCase(),
      pin: formData.pin,
      phoneNumber,
      email: formData.email.trim() || null,
      session: classData.session
    });

    setRegistering(false);

    if (result.success) {
      // Success! Redirect to dashboard
      if (onSuccess) {
        onSuccess(result.student, result.session);
      }
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          // STEP 1: CLASS CODE
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  🎓 Join Your Class
                </h1>
                <p className="text-gray-600">
                  Enter the class code provided by your teacher
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleVerifyClassCode}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Code
                  </label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="FLUENCE-CLASS6-2025"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-lg font-medium text-center"
                    disabled={verifying}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Ask your teacher for the class code
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={verifying || !classCode.trim()}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : 'Continue →'}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <a href="/login" className="text-green-600 hover:text-green-700 font-medium">
                    Login here
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          // STEP 2: REGISTRATION FORM
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Header */}
              <div className="mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-900 mb-4"
                >
                  ← Back
                </button>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Joining:</span> {classData?.class_name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Teacher: {classData?.teacher?.full_name} • Session: {classData?.session}
                  </p>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    placeholder="Anaya Agrawal"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Create Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    onBlur={handleUsernameBlur}
                    placeholder="anaya01"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  />
                  {usernameChecking && (
                    <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-xs text-green-600 mt-1">✓ Username available!</p>
                  )}
                  {usernameAvailable === false && (
                    <p className="text-xs text-red-600 mt-1">✗ Username already taken</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number * (Yours or Parent's)
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleFormChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional - for PIN recovery)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="anaya@example.com"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Create 4-Digit PIN *
                  </label>
                  <input
                    type="password"
                    name="pin"
                    value={formData.pin}
                    onChange={handleFormChange}
                    placeholder="••••"
                    maxLength="4"
                    pattern="\d{4}"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-center text-2xl tracking-widest"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Choose something you'll remember (like your birth date: 0509)
                  </p>
                </div>

                {/* Confirm PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm PIN *
                  </label>
                  <input
                    type="password"
                    name="confirmPin"
                    value={formData.confirmPin}
                    onChange={handleFormChange}
                    placeholder="••••"
                    maxLength="4"
                    pattern="\d{4}"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-center text-2xl tracking-widest"
                    required
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={registering || !usernameAvailable}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mt-6"
                >
                  {registering ? 'Creating Account...' : 'Create Account & Join Class'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentRegistration;
