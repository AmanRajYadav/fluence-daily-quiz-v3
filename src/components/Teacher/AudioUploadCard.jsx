/**
 * Audio Upload Card Component
 *
 * Teacher uploads class recordings to generate quiz questions.
 *
 * Features:
 * - Session type toggle (Group / Personal)
 * - Class dropdown
 * - Date & Time pickers
 * - Student dropdown (for Personal sessions)
 * - Drag & drop file upload
 * - Form persistence in localStorage
 * - Upload progress indicator
 *
 * ARCHITECTURE:
 * - Uploads to n8n webhook (not directly to cloud)
 * - n8n handles: cloud storage → transcription → question generation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Mic,
  Calendar,
  Clock,
  Users,
  User,
  FileAudio,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getCurrentSession } from '../../services/authService';
import {
  uploadAudioForProcessing,
  getClassesForUpload,
  getStudentsForUpload,
  validateAudioFile,
  generateFileName
} from '../../services/audioUploadService';

const STORAGE_KEY = 'audioUploadForm';

const AudioUploadCard = ({ onUploadComplete }) => {
  const session = getCurrentSession();

  // Form state
  const [sessionType, setSessionType] = useState('group');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [audioFile, setAudioFile] = useState(null);

  // Data state
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'success', 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Load saved form data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.sessionType) setSessionType(data.sessionType);
        if (data.selectedClassId) setSelectedClassId(data.selectedClassId);
        if (data.selectedDate) setSelectedDate(data.selectedDate);
        if (data.selectedTime) setSelectedTime(data.selectedTime);
        if (data.selectedStudentId) setSelectedStudentId(data.selectedStudentId);
      } catch (e) {
        console.error('[AudioUpload] Failed to load saved form:', e);
      }
    }
  }, []);

  // Save form data to localStorage on change
  useEffect(() => {
    const formData = {
      sessionType,
      selectedClassId,
      selectedDate,
      selectedTime,
      selectedStudentId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [sessionType, selectedClassId, selectedDate, selectedTime, selectedStudentId]);

  // Load classes on mount
  useEffect(() => {
    if (session?.institution_id) {
      loadClasses();
    }
  }, [session?.institution_id]);

  // Load students when class changes (for personal sessions)
  useEffect(() => {
    if (sessionType === 'personal' && selectedClassId) {
      loadStudents();
    }
  }, [sessionType, selectedClassId]);

  const loadClasses = async () => {
    const data = await getClassesForUpload(session.institution_id);
    setClasses(data);
    // Auto-select first class if none selected
    if (!selectedClassId && data.length > 0) {
      setSelectedClassId(data[0].id);
    }
  };

  const loadStudents = async () => {
    const data = await getStudentsForUpload(session.institution_id, selectedClassId);
    setStudents(data);
  };

  // File handling
  const handleFileSelect = useCallback((file) => {
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setUploadStatus('error');
      setStatusMessage(validation.error);
      return;
    }

    setAudioFile(file);
    setUploadStatus(null);
    setStatusMessage(`Selected: ${file.name} (${validation.sizeMB}MB)`);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const clearFile = () => {
    setAudioFile(null);
    setStatusMessage('');
    setUploadStatus(null);
  };

  const clearForm = () => {
    setSessionType('group');
    setSelectedClassId(classes[0]?.id || '');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedTime('14:00');
    setSelectedStudentId('');
    setAudioFile(null);
    setStatusMessage('');
    setUploadStatus(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Upload handler
  const handleUpload = async () => {
    // Validation
    if (!audioFile) {
      setUploadStatus('error');
      setStatusMessage('Please select an audio file');
      return;
    }

    if (!selectedClassId) {
      setUploadStatus('error');
      setStatusMessage('Please select a class');
      return;
    }

    if (sessionType === 'personal' && !selectedStudentId) {
      setUploadStatus('error');
      setStatusMessage('Please select a student for personal session');
      return;
    }

    const selectedClass = classes.find(c => c.id === selectedClassId);
    const selectedStudent = students.find(s => s.id === selectedStudentId);

    // Generate filename
    const fileName = generateFileName({
      sessionType,
      date: selectedDate,
      time: selectedTime,
      classCode: selectedClass?.class_code || 'UNKNOWN',
      studentUsername: selectedStudent?.username,
      originalFileName: audioFile.name
    });

    // Prepare metadata
    const metadata = {
      institution_id: session.institution_id,
      class_id: selectedClassId,
      student_id: sessionType === 'personal' ? selectedStudentId : null,
      session_type: sessionType,
      upload_date: selectedDate,
      class_time: selectedTime,
      uploaded_by: session.teacher_id || session.user_id,
      file_name: fileName,
      original_file_name: audioFile.name
    };

    setIsLoading(true);
    setUploadProgress(0);
    setUploadStatus(null);
    setStatusMessage('Uploading...');

    try {
      // Pass real progress callback for files >50MB
      const result = await uploadAudioForProcessing(audioFile, metadata, (progress) => {
        setUploadProgress(progress);
        setStatusMessage(`Uploading... ${progress}%`);
      });

      setUploadProgress(100);

      if (result.success) {
        setUploadStatus('success');
        setStatusMessage(result.message || 'Audio uploaded successfully! Questions will be generated in 5-10 minutes.');
        setAudioFile(null);

        // Notify parent component
        if (onUploadComplete) {
          onUploadComplete(result);
        }
      } else {
        setUploadStatus('error');
        setStatusMessage(result.error || 'Upload failed. Please try again.');
      }

    } catch (error) {
      setUploadStatus('error');
      setStatusMessage(error.message || 'Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 2000); // Clear progress after 2s
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Upload Class Recording</h3>
            <p className="text-green-100 text-sm">Generate quiz questions from your class audio</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Session Type Toggle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Session Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSessionType('group')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                sessionType === 'group'
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              Group Class
            </button>
            <button
              type="button"
              onClick={() => setSessionType('personal')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                sessionType === 'personal'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
              Personal
            </button>
          </div>
        </div>

        {/* Class Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          >
            <option value="">Select a class...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.class_name} ({c.class_code})
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Student Dropdown (Personal only) */}
        {sessionType === 'personal' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select a student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} (@{s.username})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File Upload Zone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Audio File
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? 'border-green-500 bg-green-50'
                : audioFile
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {audioFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileAudio className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{audioFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">
                  Drag & drop your audio file here
                </p>
                <p className="text-sm text-gray-400 mb-3">
                  or
                </p>
                <label className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium cursor-pointer hover:bg-gray-200 transition-colors">
                  Browse Files
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-3">
                  Supported: MP3, WAV, M4A (max 500MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="font-medium text-green-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && !isLoading && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              uploadStatus === 'success'
                ? 'bg-green-50 text-green-700'
                : uploadStatus === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-50 text-gray-600'
            }`}
          >
            {uploadStatus === 'success' && <CheckCircle className="w-5 h-5" />}
            {uploadStatus === 'error' && <AlertCircle className="w-5 h-5" />}
            <span className="text-sm">{statusMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={clearForm}
            disabled={isLoading}
            className="px-4 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Clear Form
          </button>
          <button
            onClick={handleUpload}
            disabled={isLoading || !audioFile}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload & Generate Questions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioUploadCard;
