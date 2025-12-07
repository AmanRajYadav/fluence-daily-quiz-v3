/**
 * AlertsPanel Component
 *
 * Displays student and concept alerts for teachers:
 * - Critical alerts (red): Low scores, inactive students, declining performance
 * - Warning alerts (yellow): Moderate scores, struggling concepts
 * - Positive alerts (green): Streaks, improvements
 *
 * Features:
 * - Click alert to navigate to student detail
 * - Collapsible sections
 * - Loading and empty states
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingDown, AlertCircle, Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getStudentAlerts } from '../../services/teacherService';
import { getCurrentSession } from '../../services/authService';

const AlertsPanel = ({ compact = false }) => {
  const session = getCurrentSession();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState({
    critical: [],
    warnings: [],
    positive: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    warnings: compact ? false : true,
    positive: compact ? false : true
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    if (!session?.institution_id) {
      console.error('[AlertsPanel] No institution_id in session');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const alertsData = await getStudentAlerts(session.institution_id);
      setAlerts(alertsData);
    } catch (error) {
      console.error('[AlertsPanel] Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAlertClick = (alert) => {
    if (alert.student_id) {
      navigate(`/teacher/students/${alert.student_id}`);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_score':
      case 'inactive':
      case 'declining_score':
      case 'struggling_concepts':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'moderate_score':
      case 'weak_concept':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'long_streak':
      case 'improving':
        return <Sparkles className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActionButton = (alert) => {
    const buttons = {
      review_progress: {label: 'Review Progress', color: 'red'},
      send_reminder: {label: 'Send Reminder', color: 'orange'},
      investigate: {label: 'Investigate', color: 'red'},
      assign_practice: {label: 'Assign Practice', color: 'yellow'},
      celebrate: {label: 'Send Encouragement', color: 'green'},
      encourage: {label: 'Celebrate', color: 'green'}
    };

    const config = buttons[alert.action];
    if (!config) return null;

    return (
      <button className={`text-xs px-2 py-1 bg-${config.color}-50 text-${config.color}-700 rounded hover:bg-${config.color}-100 transition-colors`}>
        {config.label}
      </button>
    );
  };

  const totalAlerts = alerts.critical.length + alerts.warnings.length + alerts.positive.length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (totalAlerts === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <h3 className="text-lg font-bold text-green-900 mb-1">All Clear! 🎉</h3>
          <p className="text-sm text-green-700">No alerts at the moment. Great work!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Alerts
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {alerts.critical.length} critical, {alerts.warnings.length} warnings, {alerts.positive.length} positive
          </p>
        </div>
        <button
          onClick={loadAlerts}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Critical Alerts */}
      {alerts.critical.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection('critical')}
            className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <span className="font-semibold text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical ({alerts.critical.length})
            </span>
            {expandedSections.critical ? (
              <ChevronUp className="w-5 h-5 text-red-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-red-700" />
            )}
          </button>

          {expandedSections.critical && (
            <div className="mt-2 space-y-2">
              {alerts.critical.slice(0, compact ? 3 : undefined).map((alert, index) => (
                <div
                  key={index}
                  onClick={() => handleAlertClick(alert)}
                  className="flex items-center gap-3 p-3 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {alert.student_name || alert.concept_name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{alert.message}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {getActionButton(alert)}
                  </div>
                </div>
              ))}
              {compact && alerts.critical.length > 3 && (
                <button className="w-full text-center text-sm text-red-600 hover:text-red-800 font-semibold py-2">
                  View all {alerts.critical.length} critical alerts →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Warning Alerts */}
      {alerts.warnings.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection('warnings')}
            className="w-full flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="font-semibold text-yellow-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Warnings ({alerts.warnings.length})
            </span>
            {expandedSections.warnings ? (
              <ChevronUp className="w-5 h-5 text-yellow-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-yellow-700" />
            )}
          </button>

          {expandedSections.warnings && (
            <div className="mt-2 space-y-2">
              {alerts.warnings.slice(0, compact ? 3 : undefined).map((alert, index) => (
                <div
                  key={index}
                  onClick={() => handleAlertClick(alert)}
                  className="flex items-center gap-3 p-3 border border-yellow-200 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors"
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {alert.student_name || alert.concept_name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{alert.message}</p>
                  </div>
                  {alert.student_count && (
                    <div className="flex-shrink-0 text-xs font-semibold text-gray-500">
                      {alert.student_count} students
                    </div>
                  )}
                </div>
              ))}
              {compact && alerts.warnings.length > 3 && (
                <button className="w-full text-center text-sm text-yellow-600 hover:text-yellow-800 font-semibold py-2">
                  View all {alerts.warnings.length} warnings →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Positive Alerts */}
      {alerts.positive.length > 0 && !compact && (
        <div>
          <button
            onClick={() => toggleSection('positive')}
            className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="font-semibold text-green-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Positive ({alerts.positive.length})
            </span>
            {expandedSections.positive ? (
              <ChevronUp className="w-5 h-5 text-green-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-green-700" />
            )}
          </button>

          {expandedSections.positive && (
            <div className="mt-2 space-y-2">
              {alerts.positive.slice(0, 5).map((alert, index) => (
                <div
                  key={index}
                  onClick={() => handleAlertClick(alert)}
                  className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {alert.student_name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{alert.message}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {getActionButton(alert)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
