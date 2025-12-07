import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentSession, logout, isStudent, isTeacher } from './services/authService';
import AuthRouter from './components/Auth/AuthRouter';
import App from './App'; // V2 Quiz App (for students)
import Dashboard from './components/Teacher/Dashboard'; // V3 Teacher Dashboard
import StudentDashboardComponent from './components/Student/StudentDashboard'; // V3 Student Dashboard

/**
 * Fluence V3 - Main App with Authentication
 * Routes to AuthRouter (if not logged in) or Dashboard (if logged in)
 */

function AppV3() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = getCurrentSession();
    if (existingSession) {
      setSession(existingSession);
    }
    setLoading(false);
  }, []);

  const handleAuthenticated = (newSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      setSession(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎓</div>
          <p className="text-gray-600 text-lg">Loading Fluence...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth screens
  if (!session) {
    return <AuthRouter onAuthenticated={handleAuthenticated} />;
  }

  // Authenticated - show appropriate dashboard
  return (
    <BrowserRouter>
      <Routes>
        {/* Teacher Routes */}
        {isTeacher() && (
          <>
            <Route path="/" element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="/teacher/*" element={<Dashboard />} />
          </>
        )}

        {/* Student Routes (after teacher routes to prevent catching /teacher paths) */}
        {isStudent() && (
          <>
            <Route path="/" element={<StudentDashboard session={session} onLogout={handleLogout} />} />
            <Route path="/student/*" element={<StudentDashboard session={session} onLogout={handleLogout} />} />
          </>
        )}

        {/* Fallback */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Unknown user type</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Student Dashboard Wrapper (V3 - WITH QUIZ INTEGRATION)
 * Handles toggling between dashboard view and quiz view
 */
const StudentDashboard = ({ session, onLogout }) => {
  const [showQuiz, setShowQuiz] = useState(false);

  // If quiz is active, show the quiz game
  if (showQuiz) {
    return <App session={session} onBack={() => setShowQuiz(false)} />;
  }

  // Otherwise show the new dashboard component
  return (
    <StudentDashboardComponent
      session={session}
      onLogout={onLogout}
      onStartQuiz={() => setShowQuiz(true)}
    />
  );
};

export default AppV3;
