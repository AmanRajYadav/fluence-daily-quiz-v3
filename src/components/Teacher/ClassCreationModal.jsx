/**
 * Class Creation Modal Component
 *
 * Modal form for creating new classes with:
 * - Class name, code, subject, session
 * - Max students configuration
 * - Active/Inactive toggle
 * - Form validation
 */

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getCurrentSession } from '../../services/authService';

const ClassCreationModal = ({ isOpen, onClose, onClassCreated }) => {
  const session = getCurrentSession();

  const [formData, setFormData] = useState({
    class_name: '',
    class_code: '',
    subject: '',
    session: '',
    max_students: 100,
    active: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);

  // Auto-generate class code from class name
  const generateClassCode = (className) => {
    if (!className) return '';
    const sanitized = className.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const year = new Date().getFullYear();
    return `FLUENCE-${sanitized}-${year}`;
  };

  const handleInputChange = (field, value) => {
    // If user is editing class_code directly, mark it as manually edited
    if (field === 'class_code') {
      setIsCodeManuallyEdited(true);
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-generate class code when name changes (only if user hasn't manually edited it)
      if (field === 'class_name' && !isCodeManuallyEdited) {
        newData.class_code = generateClassCode(value);
      }

      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.class_name.trim()) {
      newErrors.class_name = 'Class name is required';
    }

    if (!formData.class_code.trim()) {
      newErrors.class_code = 'Class code is required';
    } else if (!/^[A-Z0-9-]+$/.test(formData.class_code)) {
      newErrors.class_code = 'Class code can only contain uppercase letters, numbers, and hyphens';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.session.trim()) {
      newErrors.session = 'Session/Year is required';
    }

    if (formData.max_students <= 0) {
      newErrors.max_students = 'Max students must be greater than 0';
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
      // Check if class code already exists in this institution
      const { data: existingClass } = await supabase
        .from('classes')
        .select('id')
        .eq('institution_id', session.institution_id)
        .eq('class_code', formData.class_code)
        .maybeSingle();

      if (existingClass) {
        setErrors({ class_code: 'This class code already exists. Please use a different code.' });
        setIsSubmitting(false);
        return;
      }

      // Insert new class
      const { data, error } = await supabase
        .from('classes')
        .insert({
          institution_id: session.institution_id,
          class_name: formData.class_name.trim(),
          class_code: formData.class_code.trim(),
          subject: formData.subject.trim(),
          session: formData.session.trim(),
          max_students: formData.max_students,
          active: formData.active
        })
        .select()
        .single();

      if (error) throw error;

      // Success!
      window.alert(`Class "${formData.class_name}" created successfully!`);

      // Reset form
      setFormData({
        class_name: '',
        class_code: '',
        subject: '',
        session: '',
        max_students: 100,
        active: true
      });
      setIsCodeManuallyEdited(false);

      // Notify parent component
      if (onClassCreated) {
        onClassCreated(data);
      }

      // Close modal
      onClose();

    } catch (error) {
      console.error('[ClassCreationModal] Error creating class:', error);
      window.alert('Failed to create class. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        class_name: '',
        class_code: '',
        subject: '',
        session: '',
        max_students: 100,
        active: true
      });
      setErrors({});
      setIsCodeManuallyEdited(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
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
            {/* Class Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.class_name}
                onChange={(e) => handleInputChange('class_name', e.target.value)}
                placeholder="e.g., Class 7, Grade 10A"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.class_name ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.class_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.class_name}
                </p>
              )}
            </div>

            {/* Class Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.class_code}
                onChange={(e) => handleInputChange('class_code', e.target.value.toUpperCase())}
                placeholder="e.g., FLUENCE-CLASS7-2025"
                className={`w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.class_code ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.class_code && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.class_code}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Unique identifier for this class. Auto-generated but can be customized.
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="e.g., Mathematics, Science, English"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.subject ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.subject}
                </p>
              )}
            </div>

            {/* Session/Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session/Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.session}
                onChange={(e) => handleInputChange('session', e.target.value)}
                placeholder="e.g., 2025-26, Spring 2025"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.session ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.session && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.session}
                </p>
              )}
            </div>

            {/* Max Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Students
              </label>
              <input
                type="number"
                value={formData.max_students}
                onChange={(e) => handleInputChange('max_students', parseInt(e.target.value) || 0)}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.max_students ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.max_students && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.max_students}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
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
                {isSubmitting ? 'Creating...' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassCreationModal;
