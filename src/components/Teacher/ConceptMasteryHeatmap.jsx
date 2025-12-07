/**
 * Concept Mastery Heatmap Component
 *
 * Displays a visual heatmap of student's concept mastery:
 * - Color-coded cells (red/yellow/green based on mastery score)
 * - Hover tooltips showing concept name + exact score
 * - Legend explaining colors
 * - Responsive grid layout
 */

import React from 'react';
import { Target } from 'lucide-react';

const ConceptMasteryHeatmap = ({ conceptMasteryData }) => {
  // Return empty state if no data
  if (!conceptMasteryData || conceptMasteryData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-gray-700" />
          Concept Mastery
        </h2>
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No concept data yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Student needs to complete more quizzes to see concept mastery.
          </p>
        </div>
      </div>
    );
  }

  // Get color class based on mastery score
  const getColorClass = (score) => {
    if (score >= 71) return 'bg-green-500 hover:bg-green-600';
    if (score >= 41) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-red-500 hover:bg-red-600';
  };

  // Get text color for contrast
  const getTextColor = (score) => {
    return 'text-white'; // All colors have good contrast with white
  };

  // Calculate stats
  const avgMastery = Math.round(
    conceptMasteryData.reduce((sum, c) => sum + c.mastery_score, 0) / conceptMasteryData.length
  );
  const masteredCount = conceptMasteryData.filter(c => c.mastery_score >= 71).length;
  const strugglingCount = conceptMasteryData.filter(c => c.mastery_score < 41).length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Target className="w-6 h-6 text-gray-700" />
        Concept Mastery
      </h2>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Concepts</p>
          <p className="text-3xl font-black text-gray-900">{conceptMasteryData.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Mastered</p>
          <p className="text-3xl font-black text-green-600">{masteredCount}</p>
          <p className="text-xs text-gray-500 mt-1">≥71%</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Struggling</p>
          <p className="text-3xl font-black text-red-600">{strugglingCount}</p>
          <p className="text-xs text-gray-500 mt-1">&lt;41%</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded"></div>
          <span className="text-gray-700">Struggling (0-40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-500 rounded"></div>
          <span className="text-gray-700">Improving (41-70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span className="text-gray-700">Mastered (71-100%)</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {conceptMasteryData.map((concept, index) => (
            <div
              key={concept.id || index}
              className={`${getColorClass(concept.mastery_score)} ${getTextColor(concept.mastery_score)}
                rounded-lg p-3 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-md`}
              title={`${concept.concept_name}: ${Math.round(concept.mastery_score)}%`}
            >
              <div className="text-xs font-semibold text-center truncate mb-1">
                {concept.concept_name}
              </div>
              <div className="text-xl font-black text-center">
                {Math.round(concept.mastery_score)}%
              </div>
              <div className="text-xs text-center opacity-90 mt-1">
                {concept.attempts || 0} attempts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weakest Concepts (Bottom 5) */}
      {strugglingCount > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            🎯 Needs Attention ({strugglingCount} concepts)
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <ul className="space-y-2">
              {conceptMasteryData
                .filter(c => c.mastery_score < 41)
                .sort((a, b) => a.mastery_score - b.mastery_score)
                .slice(0, 5)
                .map((concept, index) => (
                  <li key={concept.id || index} className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">{concept.concept_name}</span>
                    <span className="text-red-600 font-bold">{Math.round(concept.mastery_score)}%</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {/* Strongest Concepts (Top 5) */}
      {masteredCount > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            ⭐ Strengths ({masteredCount} concepts)
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <ul className="space-y-2">
              {conceptMasteryData
                .filter(c => c.mastery_score >= 71)
                .sort((a, b) => b.mastery_score - a.mastery_score)
                .slice(0, 5)
                .map((concept, index) => (
                  <li key={concept.id || index} className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">{concept.concept_name}</span>
                    <span className="text-green-600 font-bold">{Math.round(concept.mastery_score)}%</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptMasteryHeatmap;
