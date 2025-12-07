/**
 * Teacher Dashboard - Main Layout Component
 *
 * Provides tab-based navigation for teacher features:
 * - Overview: Stats cards + Alerts panel
 * - Students: Student list and management
 * - Questions: Question editor
 * - Classes: Class management
 * - Analytics: Charts and reports
 *
 * Uses Duolingo-inspired design (colorful, clean, minimal)
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentSession, logout, isAdmin } from '../../services/authService';
import { Users, Settings, BarChart3, LogOut, Home, FileEdit, FileText } from 'lucide-react';

// Tab Components
import StudentListView from './StudentListView';
import StudentDetailView from './StudentDetailView';
import OverviewTab from './OverviewTab';
import ClassManagement from './ClassManagement';
import ClassDetail from './ClassDetail';
import QuestionManagement from './QuestionManagement';
import Analytics from './Analytics';
import TranscriptManagement from '../Admin/TranscriptManagement';

const Dashboard = () => {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL path
  const getActiveTab = () => {
    if (location.pathname.includes('/students')) return 'students';
    if (location.pathname.includes('/questions')) return 'questions';
    if (location.pathname.includes('/classes')) return 'classes';
    if (location.pathname.includes('/analytics')) return 'analytics';
    if (location.pathname.includes('/transcripts')) return 'transcripts';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  useEffect(() => {
    // Get current session
    const currentSession = getCurrentSession();
    if (!currentSession || currentSession.user_type !== 'teacher') {
      // Redirect to login if not a teacher
      navigate('/teacher/login');
      return;
    }
    setSession(currentSession);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/teacher/login');
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Tab configuration with routes
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home, path: '/teacher/dashboard' },
    { id: 'students', label: 'Students', icon: Users, path: '/teacher/students' },
    { id: 'questions', label: 'Questions', icon: FileEdit, path: '/teacher/questions' },
    { id: 'classes', label: 'Classes', icon: Settings, path: '/teacher/classes' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/teacher/analytics' },
    // Admin-only tab
    ...(isAdmin() ? [{ id: 'transcripts', label: '📄 Transcripts', icon: FileText, path: '/teacher/transcripts' }] : []),
  ];

  const handleTabClick = (tab) => {
    navigate(tab.path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {session?.institution?.name || 'Teacher Dashboard'}
            </h1>
            <p className="text-sm text-gray-600">
              Welcome, {session?.teacher?.name || session?.user?.email || 'Teacher'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Tab Navigation - Desktop */}
      <nav className="bg-white border-b border-gray-200 sticky top-[73px] z-30 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                    isActive
                      ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 mb-20 md:mb-0">
        <Routes>
          <Route path="/dashboard" element={<OverviewTab />} />
          <Route path="/students" element={<StudentListView />} />
          <Route path="/students/:studentId" element={<StudentDetailView />} />
          <Route path="/questions" element={<QuestionManagement />} />
          <Route path="/classes" element={<ClassManagement />} />
          <Route path="/classes/:classId" element={<ClassDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          {/* Admin-only route */}
          {isAdmin() && <Route path="/transcripts" element={<TranscriptManagement />} />}
        </Routes>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 shadow-lg">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex flex-col items-center py-2 px-3 flex-1 transition-colors ${
                  isActive
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-xs font-semibold mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// Placeholder Components (to be replaced with actual components)

const OverviewTabPlaceholder = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Overview</h2>
      <p className="text-gray-600">
        Dashboard overview with stats cards and alerts will appear here.
      </p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Next:</strong> Implement StatsCards and AlertsPanel components
        </p>
      </div>
    </div>
  </div>
);

const QuestionsTabPlaceholder = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Questions</h2>
      <p className="text-gray-600">
        Question editor with filters will appear here.
      </p>
      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-sm text-orange-800">
          <strong>Phase 2:</strong> Question editor (Days 4-5)
        </p>
      </div>
    </div>
  </div>
);

const ClassesTabPlaceholder = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">🏫 Classes</h2>
      <p className="text-gray-600">
        Class management with student assignment will appear here.
      </p>
      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          <strong>Phase 2:</strong> Class management (Days 6-7)
        </p>
      </div>
    </div>
  </div>
);

const AnalyticsTabPlaceholder = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Analytics</h2>
      <p className="text-gray-600">
        Analytics charts and reports will appear here.
      </p>
      <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
        <p className="text-sm text-cyan-800">
          <strong>Phase 3:</strong> Analytics dashboard (Day 8)
        </p>
      </div>
    </div>
  </div>
);

export default Dashboard;
