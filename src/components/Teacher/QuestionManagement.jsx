/**
 * Question Management Component
 *
 * Features:
 * - View all questions for selected class
 * - Filter by type, concept, difficulty, active status
 * - Search by question text
 * - Edit questions (opens modal)
 * - Toggle active/inactive status
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';
import { Edit, Search, Filter } from 'lucide-react';
import {
  getQuestionsByClass,
  getQuestionConcepts,
  getClassesByInstitution,
  getStudentsByInstitution
} from '../../services/teacherService';
import { getCurrentSession } from '../../services/authService';
import QuestionEditModal from './QuestionEditModal';

const QuestionManagement = () => {
  const session = getCurrentSession();

  // Data state
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [concepts, setConcepts] = useState([]);

  // Selection state
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    question_type: '',
    concept_name: '',
    difficulty_level: '',
    active: true,
    search: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Load classes and concepts on mount
  useEffect(() => {
    loadClasses();
    loadConcepts();
  }, []);

  // Load students when class changes (for personal tutoring filter)
  useEffect(() => {
    if (selectedClassId) {
      loadStudents();
    }
  }, [selectedClassId]);

  // Load questions when class/student/filters change
  useEffect(() => {
    if (selectedClassId) {
      loadQuestions();
    }
  }, [selectedClassId, selectedStudentId, filters]);

  const loadClasses = async () => {
    const classesData = await getClassesByInstitution(session.institution_id);
    setClasses(classesData);

    // Auto-select first class
    if (classesData.length > 0 && !selectedClassId) {
      setSelectedClassId(classesData[0].id);
    }
  };

  const loadStudents = async () => {
    const studentsData = await getStudentsByInstitution(session.institution_id);
    setStudents(studentsData);
  };

  const loadConcepts = async () => {
    const conceptsData = await getQuestionConcepts(session.institution_id);
    setConcepts(conceptsData);
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const questionsData = await getQuestionsByClass(
        session.institution_id,
        selectedClassId,
        selectedStudentId || null,
        filters
      );
      setQuestions(questionsData);
    } catch (error) {
      console.error('[QuestionManagement] Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question) => {
    setSelectedQuestion(question);
    setShowEditModal(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getTypeBadge = (type) => {
    const badges = {
      mcq: { label: 'MCQ', color: 'bg-blue-100 text-blue-800' },
      true_false: { label: 'True/False', color: 'bg-purple-100 text-purple-800' },
      short_answer: { label: 'Short Answer (Legacy)', color: 'bg-gray-100 text-gray-500' }, // Deprecated
      fill_blank: { label: 'Fill Blank', color: 'bg-yellow-100 text-yellow-800' },
      match: { label: 'Match', color: 'bg-pink-100 text-pink-800' },
      voice: { label: 'Voice', color: 'bg-indigo-100 text-indigo-800' }
    };
    const badge = badges[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { color: 'bg-green-100 text-green-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      hard: { color: 'bg-red-100 text-red-800' }
    };
    const badge = badges[difficulty] || badges.medium;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
        <p className="text-gray-600 mt-1">
          View and edit AI-generated questions for your classes
        </p>
      </div>

      {/* Class & Student Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- Select a class --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.class_code})
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector (Optional - for personal tutoring) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student (Optional - for personal tutoring)
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={!selectedClassId}
            >
              <option value="">All students (group class)</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.username})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      {selectedClassId && (
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search questions by text..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type
              </label>
              <select
                value={filters.question_type}
                onChange={(e) => handleFilterChange('question_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="true_false">True/False</option>
                <option value="fill_blank">Fill Blank</option>
                <option value="match">Match</option>
                {/* short_answer removed - replaced with MCQs for better grading accuracy */}
              </select>
            </div>

            {/* Concept Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concept
              </label>
              <select
                value={filters.concept_name}
                onChange={(e) => handleFilterChange('concept_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Concepts</option>
                {concepts.map(concept => (
                  <option key={concept} value={concept}>
                    {concept}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={filters.difficulty_level}
                onChange={(e) => handleFilterChange('difficulty_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Active Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.active === true ? 'true' : filters.active === false ? 'false' : ''}
                onChange={(e) => handleFilterChange('active', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Questions List */}
      {!selectedClassId ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Class
          </h3>
          <p className="text-gray-600">
            Choose a class from the dropdown above to view questions
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">
            No questions found for this class.
            {selectedStudentId && ' Try removing the student filter.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concept
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {truncateText(question.question_text, 80)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(question.question_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{question.concept_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getDifficultyBadge(question.difficulty_level)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          question.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {question.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(question)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {truncateText(question.question_text, 60)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(question.question_type)}
                    {getDifficultyBadge(question.difficulty_level)}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  Concept: {question.concept_name}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      question.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {question.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleEdit(question)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit Modal */}
      <QuestionEditModal
        isOpen={showEditModal}
        question={selectedQuestion}
        onClose={() => setShowEditModal(false)}
        onSave={() => {
          // Refresh questions list after save
          loadQuestions();
        }}
      />
    </div>
  );
};

export default QuestionManagement;
