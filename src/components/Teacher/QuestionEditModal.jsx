/**
 * Question Edit Modal Component
 *
 * Dynamic form for editing questions based on type:
 * - MCQ: 4 options + correct answer dropdown
 * - True/False: Correct answer radio buttons
 * - Short Answer: Correct answer textarea
 * - Fill Blank: Validate ___ exists, correct answer input
 * - Match: Left/right items + mapping dropdowns
 * - Voice: Correct answer input
 *
 * Common fields: question_text, concept_name, difficulty_level, explanation
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { updateQuestion } from '../../services/teacherService';
import { getCurrentSession } from '../../services/authService';

const QuestionEditModal = ({ isOpen, question, onClose, onSave }) => {
  const session = getCurrentSession();

  const [formData, setFormData] = useState({
    question_text: '',
    concept_name: '',
    difficulty_level: 'medium',
    explanation: '',
    options: null,
    correct_answer: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when question changes
  useEffect(() => {
    if (question) {
      console.log('[QuestionEditModal] Initializing with question:', question);

      // Parse options if it's a JSON string (Supabase sometimes returns JSONB as string)
      let options = question.options;
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
          console.log('[QuestionEditModal] Parsed options from JSON string:', options);
        } catch (e) {
          console.error('[QuestionEditModal] Failed to parse options JSON:', e);
          options = null;
        }
      }

      // For MCQ, ensure it's an array with 4 items
      if (question.question_type === 'mcq') {
        if (!options || !Array.isArray(options)) {
          console.warn('[QuestionEditModal] MCQ options not an array, using defaults. Type:', typeof options);
          options = ['', '', '', ''];
        } else {
          // Ensure we have exactly 4 options
          if (options.length < 4) {
            // Pad with empty strings
            options = [...options, ...Array(4 - options.length).fill('')];
          } else if (options.length > 4) {
            // Trim to 4
            options = options.slice(0, 4);
          }
        }
        console.log('[QuestionEditModal] MCQ options after init:', options);
      }

      // For Match, ensure it has left/right arrays
      if (question.question_type === 'match') {
        if (!options || typeof options !== 'object') {
          console.warn('[QuestionEditModal] Match options not an object, using defaults. Type:', typeof options);
          options = {
            left: ['', '', '', ''],
            right: ['', '', '', '']
          };
        } else if (!Array.isArray(options.left) || !Array.isArray(options.right)) {
          console.warn('[QuestionEditModal] Match options missing left/right arrays, using defaults:', options);
          options = {
            left: Array.isArray(options.left) ? options.left : ['', '', '', ''],
            right: Array.isArray(options.right) ? options.right : ['', '', '', '']
          };
        } else {
          // Ensure both arrays have same length, pad if needed
          const maxLen = Math.max(options.left.length, options.right.length);
          options = {
            left: [...options.left, ...Array(maxLen - options.left.length).fill('')].slice(0, maxLen),
            right: [...options.right, ...Array(maxLen - options.right.length).fill('')].slice(0, maxLen)
          };
        }
        console.log('[QuestionEditModal] Match options after init:', options);
      }

      // Normalize correct_answer for true_false questions (DB stores "True"/"False", form needs "true"/"false")
      let correctAnswer = question.correct_answer || '';
      if (question.question_type === 'true_false' && correctAnswer) {
        correctAnswer = correctAnswer.toLowerCase();
      }

      setFormData({
        question_text: question.question_text || '',
        concept_name: question.concept_name || '',
        difficulty_level: question.difficulty_level || 'medium',
        explanation: question.explanation || '',
        options: options,
        correct_answer: correctAnswer
      });
      setErrors({});
    }
  }, [question]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleMatchItemChange = (side, index, value) => {
    const newOptions = { ...formData.options };
    newOptions[side][index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleMatchMappingChange = (leftItem, rightItem) => {
    try {
      const currentMapping = JSON.parse(formData.correct_answer || '{}');
      currentMapping[leftItem] = rightItem;
      setFormData(prev => ({
        ...prev,
        correct_answer: JSON.stringify(currentMapping)
      }));
    } catch (e) {
      // If correct_answer is not valid JSON, reset it
      const newMapping = { [leftItem]: rightItem };
      setFormData(prev => ({
        ...prev,
        correct_answer: JSON.stringify(newMapping)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.question_text?.trim()) {
      newErrors.question_text = 'Question text is required';
    } else if (formData.question_text.length > 500) {
      newErrors.question_text = 'Question text must be less than 500 characters';
    }

    if (!formData.concept_name?.trim()) {
      newErrors.concept_name = 'Concept name is required';
    }

    // Type-specific validations
    switch (question?.question_type) {
      case 'mcq':
        // Validate options
        if (!formData.options || formData.options.length !== 4) {
          newErrors.options = 'MCQ must have exactly 4 options';
        } else {
          const hasEmpty = formData.options.some(opt => !opt?.trim());
          if (hasEmpty) {
            newErrors.options = 'All options must be filled';
          }
          // Check for duplicates
          const uniqueOptions = new Set(formData.options.map(opt => opt.trim().toLowerCase()));
          if (uniqueOptions.size !== 4) {
            newErrors.options = 'All options must be unique';
          }
        }
        // Validate correct answer exists in options
        if (!formData.options?.includes(formData.correct_answer)) {
          newErrors.correct_answer = 'Correct answer must be one of the options';
        }
        break;

      case 'true_false':
        if (formData.correct_answer !== 'true' && formData.correct_answer !== 'false') {
          newErrors.correct_answer = 'Correct answer must be True or False';
        }
        break;

      case 'short_answer':
        if (!formData.correct_answer?.trim()) {
          newErrors.correct_answer = 'Correct answer is required';
        } else if (formData.correct_answer.length > 200) {
          newErrors.correct_answer = 'Correct answer must be less than 200 characters';
        }
        break;

      case 'fill_blank':
        // Check if question has blank marker
        if (!formData.question_text?.includes('___') && !formData.question_text?.includes('_')) {
          newErrors.question_text = 'Question text must contain a blank marker (___  or _)';
        }
        if (!formData.correct_answer?.trim()) {
          newErrors.correct_answer = 'Correct answer is required';
        }
        break;

      case 'match':
        // Validate left and right arrays (filter out empty items)
        const allLeftItems = formData.options?.left || [];
        const allRightItems = formData.options?.right || [];

        // Filter out empty items
        const leftItems = allLeftItems.filter(item => item?.trim());
        const rightItems = allRightItems.filter(item => item?.trim());

        // Must have at least 2 pairs
        if (leftItems.length < 2) {
          newErrors.options = 'Match question must have at least 2 pairs';
          break;
        }

        if (leftItems.length !== rightItems.length) {
          newErrors.options = 'Left and right items must have equal count';
          break;
        }

        // Check for duplicates in non-empty items
        const uniqueLeft = new Set(leftItems.map(item => item.trim().toLowerCase()));
        const uniqueRight = new Set(rightItems.map(item => item.trim().toLowerCase()));
        if (uniqueLeft.size !== leftItems.length) {
          newErrors.options = 'Left items must be unique';
        }
        if (uniqueRight.size !== rightItems.length) {
          newErrors.options = 'Right items must be unique';
        }

        // Validate mapping (must map all non-empty items)
        try {
          const mapping = JSON.parse(formData.correct_answer);
          // Filter mapping to only include keys that exist in current leftItems
          const validMappingKeys = Object.keys(mapping).filter(key => leftItems.includes(key));
          if (validMappingKeys.length !== leftItems.length) {
            newErrors.correct_answer = 'All items must be mapped';
          }
          // Check that all mapped values exist in rightItems
          const allValuesValid = validMappingKeys.every(key => rightItems.includes(mapping[key]));
          if (!allValuesValid) {
            newErrors.correct_answer = 'All mappings must be valid';
          }
        } catch (e) {
          newErrors.correct_answer = 'Invalid mapping format';
        }
        break;

      case 'voice':
        if (!formData.correct_answer?.trim()) {
          newErrors.correct_answer = 'Expected answer is required';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare correct_answer (capitalize for true_false to match DB format)
      let correctAnswer = formData.correct_answer;
      if (question.question_type === 'true_false' && correctAnswer) {
        correctAnswer = correctAnswer.charAt(0).toUpperCase() + correctAnswer.slice(1);
      }

      // Prepare options (filter out empty items for match questions)
      let options = formData.options;
      if (question.question_type === 'match' && options) {
        const filteredLeft = options.left.filter(item => item?.trim());
        const filteredRight = options.right.filter(item => item?.trim());
        options = {
          left: filteredLeft,
          right: filteredRight
        };
      }

      // Prepare updates (only fields that can be edited)
      const updates = {
        question_text: formData.question_text.trim(),
        concept_name: formData.concept_name.trim(),
        difficulty_level: formData.difficulty_level,
        explanation: formData.explanation?.trim() || null,
        options: options,
        correct_answer: correctAnswer
      };

      await updateQuestion(question.id, updates, session.user_id);

      window.alert('Question updated successfully!');

      if (onSave) {
        onSave();
      }

      onClose();
    } catch (error) {
      console.error('[QuestionEditModal] Error:', error);
      window.alert('Failed to update question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      onClose();
    }
  };

  if (!isOpen || !question) return null;

  // Get current mapping for match questions
  let currentMapping = {};
  if (question.question_type === 'match') {
    try {
      currentMapping = JSON.parse(formData.correct_answer || '{}');
    } catch (e) {
      currentMapping = {};
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Question</h2>
              <p className="text-sm text-gray-600 mt-1">
                Type: {question.question_type.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Common Fields */}

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.question_text}
                onChange={(e) => handleInputChange('question_text', e.target.value)}
                rows={3}
                maxLength={500}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.question_text ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.question_text && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.question_text}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.question_text.length}/500 characters
              </p>
            </div>

            {/* Type-Specific Fields */}

            {/* MCQ Options */}
            {question.question_type === 'mcq' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map(i => (
                    <input
                      key={i}
                      type="text"
                      value={formData.options?.[i] || ''}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
                {errors.options && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.options}
                  </p>
                )}
              </div>
            )}

            {/* MCQ Correct Answer */}
            {question.question_type === 'mcq' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.correct_answer}
                  onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.correct_answer ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">-- Select correct answer --</option>
                  {formData.options?.map((opt, i) => (
                    <option key={i} value={opt}>{opt || `Option ${String.fromCharCode(65 + i)}`}</option>
                  ))}
                </select>
                {errors.correct_answer && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.correct_answer}
                  </p>
                )}
              </div>
            )}

            {/* True/False Correct Answer */}
            {question.question_type === 'true_false' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="correct_answer"
                      value="true"
                      checked={formData.correct_answer === 'true'}
                      onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                      disabled={isSubmitting}
                    />
                    <span>True</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="correct_answer"
                      value="false"
                      checked={formData.correct_answer === 'false'}
                      onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                      disabled={isSubmitting}
                    />
                    <span>False</span>
                  </label>
                </div>
                {errors.correct_answer && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.correct_answer}
                  </p>
                )}
              </div>
            )}

            {/* Short Answer Correct Answer */}
            {question.question_type === 'short_answer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.correct_answer}
                  onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Expected answer with key points..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.correct_answer ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.correct_answer && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.correct_answer}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.correct_answer.length}/200 characters
                </p>
              </div>
            )}

            {/* Fill Blank Correct Answer */}
            {question.question_type === 'fill_blank' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.correct_answer}
                  onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                  placeholder="Word or phrase to fill the blank"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.correct_answer ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.correct_answer && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.correct_answer}
                  </p>
                )}
              </div>
            )}

            {/* Match Items */}
            {question.question_type === 'match' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Items <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Left Items</p>
                    {formData.options?.left?.map((item, i) =>
                      item?.trim() ? (
                        <input
                          key={`left-${i}`}
                          type="text"
                          value={item}
                          onChange={(e) => handleMatchItemChange('left', i, e.target.value)}
                          placeholder={`Left item ${i + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-2"
                          disabled={isSubmitting}
                        />
                      ) : null
                    )}
                  </div>
                  {/* Right Column */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Right Items</p>
                    {formData.options?.right?.map((item, i) =>
                      item?.trim() ? (
                        <input
                          key={`right-${i}`}
                          type="text"
                          value={item}
                          onChange={(e) => handleMatchItemChange('right', i, e.target.value)}
                          placeholder={`Right item ${i + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-2"
                          disabled={isSubmitting}
                        />
                      ) : null
                    )}
                  </div>
                </div>
                {errors.options && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.options}
                  </p>
                )}

                {/* Match Mapping */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Correct Mapping <span className="text-red-500">*</span>
                  </p>
                  <div className="space-y-2">
                    {formData.options?.left?.filter(item => item?.trim()).map((leftItem, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 flex-1">{leftItem}</span>
                        <span className="text-gray-400">→</span>
                        <select
                          value={currentMapping[leftItem] || ''}
                          onChange={(e) => handleMatchMappingChange(leftItem, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          disabled={isSubmitting}
                        >
                          <option value="">-- Select match --</option>
                          {formData.options?.right?.filter(item => item?.trim()).map((rightItem, j) => (
                            <option key={j} value={rightItem}>{rightItem}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  {errors.correct_answer && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.correct_answer}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Voice Correct Answer */}
            {question.question_type === 'voice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Answer (Spoken) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.correct_answer}
                  onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                  placeholder="Expected spoken answer..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.correct_answer ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.correct_answer && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.correct_answer}
                  </p>
                )}
              </div>
            )}

            {/* Concept Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concept Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.concept_name}
                onChange={(e) => handleInputChange('concept_name', e.target.value)}
                placeholder="e.g., Tenses, Vocabulary, Grammar"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  errors.concept_name ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.concept_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.concept_name}
                </p>
              )}
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <select
                value={formData.difficulty_level}
                onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isSubmitting}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation (Optional)
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => handleInputChange('explanation', e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Explanation shown to students after answering..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                {(formData.explanation || '').length}/300 characters
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditModal;
