/**
 * Class Detail Component
 *
 * Shows detailed view of a single class with:
 * - Class information
 * - Student roster
 * - Add/remove students
 * - Class statistics
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserMinus, Users, BookOpen, TrendingUp } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getCurrentSession } from '../../services/authService';

const ClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const session = getCurrentSession();

  const [classInfo, setClassInfo] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    setLoading(true);
    try {
      // Get class info
      const { data: cls, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (classError) throw classError;
      setClassInfo(cls);

      // Get enrolled students
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_class_enrollments')
        .select(`
          id,
          student_id,
          joined_at,
          students (
            id,
            full_name,
            username,
            email,
            phone_number,
            last_login_at
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      const enrolled = enrollments?.map(e => ({
        ...e.students,
        enrollment_id: e.id,
        joined_at: e.joined_at
      })) || [];

      setEnrolledStudents(enrolled);

      // Get available students (not enrolled in this class)
      const enrolledIds = enrolled.map(s => s.id);
      const { data: available, error: availError } = await supabase
        .from('students')
        .select('id, full_name, username, email, phone_number')
        .eq('institution_id', session.institution_id)
        .eq('active', true)
        .not('id', 'in', `(${enrolledIds.length > 0 ? enrolledIds.join(',') : 'null'})`);

      if (availError) throw availError;
      setAvailableStudents(available || []);

    } catch (error) {
      console.error('[ClassDetail] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (studentId) => {
    try {
      // Use UPSERT to handle both new enrollments and re-enrollments
      // If a 'dropped' enrollment exists, this will reactivate it
      const { error } = await supabase
        .from('student_class_enrollments')
        .upsert({
          student_id: studentId,
          class_id: classId,
          status: 'active',
          joined_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,class_id'
        });

      if (error) throw error;

      // Reload data
      await loadClassData();
      setShowAddStudent(false);
      window.alert('Student added successfully!');
    } catch (error) {
      console.error('[ClassDetail] Error adding student:', error);
      window.alert('Failed to add student. Please try again.');
    }
  };

  const handleRemoveStudent = async (enrollmentId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from this class?`)) return;

    try {
      const { error } = await supabase
        .from('student_class_enrollments')
        .update({ status: 'dropped' })
        .eq('id', enrollmentId);

      if (error) throw error;

      // Reload data
      await loadClassData();
      window.alert('Student removed successfully!');
    } catch (error) {
      console.error('[ClassDetail] Error removing student:', error);
      window.alert('Failed to remove student. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Class not found</p>
        <button
          onClick={() => navigate('/teacher/classes')}
          className="mt-4 text-green-600 hover:text-green-700"
        >
          Back to Classes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/teacher/classes')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Classes
      </button>

      {/* Class Info Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-2xl">
              {(classInfo.class_name || 'C')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{classInfo.class_name}</h1>
              <p className="text-gray-600 mt-1">
                {classInfo.subject} • {classInfo.session}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                  Code: {classInfo.class_code}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  classInfo.active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {classInfo.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Total Students</span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              {enrolledStudents.length}
              <span className="text-sm font-normal text-gray-600 ml-2">
                / {classInfo.max_students || '∞'}
              </span>
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-medium">Subject</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {classInfo.subject || 'Not specified'}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Session</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {classInfo.session || 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Student Roster */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Student Roster</h2>
          <button
            onClick={() => setShowAddStudent(!showAddStudent)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <UserPlus className="w-5 h-5" />
            Add Student
          </button>
        </div>

        {/* Add Student Section */}
        {showAddStudent && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Available Students</h3>
            {availableStudents.length === 0 ? (
              <p className="text-gray-600 text-sm">All students are already enrolled in this class.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableStudents.map(student => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-white rounded border hover:border-green-500 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{student.full_name}</p>
                      <p className="text-sm text-gray-600">{student.username}</p>
                    </div>
                    <button
                      onClick={() => handleAddStudent(student.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enrolled Students List */}
        {enrolledStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No students enrolled yet</p>
            <p className="text-sm text-gray-500 mt-1">Add students to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {enrolledStudents.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {student.username}
                      {student.email && ` • ${student.email}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Joined: {new Date(student.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveStudent(student.enrollment_id, student.full_name)}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  <span className="text-sm font-medium">Remove</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetail;
