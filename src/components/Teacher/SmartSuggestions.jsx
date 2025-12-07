/**
 * SmartSuggestions Component
 *
 * Displays AI-generated teaching recommendations based on analytics:
 * - Struggling concepts that need attention
 * - Overdue SRS reviews requiring student reminders
 * - Class performance gaps
 * - Question type weaknesses
 *
 * Features:
 * - Priority-based ordering
 * - Expected impact for each suggestion
 * - Action buttons
 * - Loading and empty states
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb, Target, Users, CheckCircle, RefreshCw, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';
import { generateSmartSuggestions } from '../../services/teacherService';
import { getCurrentSession } from '../../services/authService';

const SmartSuggestions = ({ compact = false }) => {
  const session = getCurrentSession();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    if (!session?.institution_id) {
      console.error('[SmartSuggestions] No institution_id in session');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const suggestionsData = await generateSmartSuggestions(session.institution_id);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('[SmartSuggestions] Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'struggling_concepts':
        return <Target className="w-5 h-5 text-red-500" />;
      case 'overdue_reviews':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'class_gap':
        return <Users className="w-5 h-5 text-yellow-500" />;
      case 'question_type':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSuggestionColor = (type) => {
    switch (type) {
      case 'struggling_concepts':
        return 'red';
      case 'overdue_reviews':
        return 'orange';
      case 'class_gap':
        return 'yellow';
      case 'question_type':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1:
        return 'High Priority';
      case 2:
        return 'Medium Priority';
      case 3:
        return 'Low Priority';
      default:
        return 'Suggestion';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800';
      case 2:
        return 'bg-orange-100 text-orange-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <h3 className="text-lg font-bold text-green-900 mb-1">All Good!</h3>
          <p className="text-sm text-green-700">
            No immediate actions needed. Keep up the great work!
          </p>
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
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            Smart Suggestions
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered recommendations based on student data
          </p>
        </div>
        <button
          onClick={loadSuggestions}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.slice(0, compact ? 3 : undefined).map((suggestion, index) => {
          const color = getSuggestionColor(suggestion.type);
          return (
            <div
              key={index}
              className={`border-l-4 border-${color}-500 bg-${color}-50 rounded-lg p-4 hover:bg-${color}-100 transition-colors`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(suggestion.priority)}`}>
                        {getPriorityLabel(suggestion.priority)}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900">{suggestion.message}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="ml-8 mb-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Action:</span> {suggestion.action}
                </p>
              </div>

              {/* Expected Impact */}
              <div className="ml-8 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">
                    <span className="font-medium">Expected Impact:</span> {suggestion.impact}
                  </span>
                </div>
              </div>

              {/* Supporting Data */}
              {suggestion.data && Object.keys(suggestion.data).length > 0 && (
                <div className="ml-8 bg-white bg-opacity-50 rounded p-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">Details:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {suggestion.type === 'struggling_concepts' && (
                      <>
                        <div>
                          <span className="text-gray-600">Concept:</span>{' '}
                          <span className="font-medium">{suggestion.data.concept_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Mastery:</span>{' '}
                          <span className="font-medium">{suggestion.data.avg_mastery}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Students Affected:</span>{' '}
                          <span className="font-medium">{suggestion.data.student_count}</span>
                        </div>
                      </>
                    )}
                    {suggestion.type === 'overdue_reviews' && (
                      <>
                        <div>
                          <span className="text-gray-600">Students with Overdue:</span>{' '}
                          <span className="font-medium">{suggestion.data.student_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Overdue Reviews:</span>{' '}
                          <span className="font-medium">{suggestion.data.total_overdue}</span>
                        </div>
                      </>
                    )}
                    {suggestion.type === 'class_gap' && (
                      <>
                        <div>
                          <span className="text-gray-600">Top Class:</span>{' '}
                          <span className="font-medium">{suggestion.data.top_class}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Bottom Class:</span>{' '}
                          <span className="font-medium">{suggestion.data.bottom_class}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Score Gap:</span>{' '}
                          <span className="font-medium">{suggestion.data.gap}%</span>
                        </div>
                      </>
                    )}
                    {suggestion.type === 'question_type' && (
                      <>
                        <div>
                          <span className="text-gray-600">Question Type:</span>{' '}
                          <span className="font-medium">{suggestion.data.question_type}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Accuracy:</span>{' '}
                          <span className="font-medium">{suggestion.data.accuracy}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="ml-8 mt-3">
                <button
                  className={`text-xs px-3 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors font-medium`}
                >
                  Take Action
                </button>
              </div>
            </div>
          );
        })}

        {compact && suggestions.length > 3 && (
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-semibold py-2">
            View all {suggestions.length} suggestions →
          </button>
        )}
      </div>
    </div>
  );
};

export default SmartSuggestions;
