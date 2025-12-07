import React, { useState, useEffect } from 'react';
import { getCurrentSession, isStudent, isTeacher } from '../../services/authService';
import LandingPage from './LandingPage';
import StudentRegistration from './StudentRegistration';
import StudentLogin from './StudentLogin';
import TeacherLogin from './TeacherLogin';

/**
 * Auth Router
 * Handles navigation between auth screens and redirects to appropriate dashboard
 */

const AuthRouter = ({ onAuthenticated }) => {
  const [currentView, setCurrentView] = useState('landing');
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      // User already logged in, redirect to dashboard
      onAuthenticated(session);
    } else {
      setLoading(false);
    }
  }, [onAuthenticated]);

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const handleStudentSuccess = (student, session) => {
    console.log('[AuthRouter] Student authenticated:', student);
    onAuthenticated(session);
  };

  const handleTeacherSuccess = (teacher, session) => {
    console.log('[AuthRouter] Teacher authenticated:', teacher);
    onAuthenticated(session);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎓</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render current view
  switch (currentView) {
    case 'student-register':
      return <StudentRegistration onSuccess={handleStudentSuccess} />;

    case 'student-login':
      return <StudentLogin onSuccess={handleStudentSuccess} />;

    case 'teacher-login':
      return <TeacherLogin onSuccess={handleTeacherSuccess} />;

    case 'landing':
    default:
      return <LandingPage onNavigate={handleNavigation} />;
  }
};

export default AuthRouter;
