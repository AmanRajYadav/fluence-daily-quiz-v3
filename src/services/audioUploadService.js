/**
 * Audio Upload Service
 *
 * Handles:
 * - Supabase Storage upload for audio files
 * - Database tracking in audio_uploads table
 * - Recent uploads fetching
 *
 * ARCHITECTURE:
 * - Frontend uploads to Supabase Storage (class-audio bucket)
 * - Records metadata in audio_uploads table
 * - n8n can later poll for pending uploads or be triggered via webhook
 */

import { supabase } from './supabase';

const STORAGE_BUCKET = 'class-audio';

/**
 * Upload audio file to Supabase Storage
 *
 * @param {File} file - Audio file to upload
 * @param {Object} metadata - Class info, student, date, etc.
 * @returns {Object} Upload result with file URL
 */
export const uploadAudioForProcessing = async (file, metadata) => {
  try {
    console.log('[AudioUpload] Uploading to Supabase Storage:', {
      fileName: metadata.file_name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      metadata
    });

    // 1. Upload file to Supabase Storage
    const filePath = `${metadata.institution_id}/${metadata.file_name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Overwrite if exists
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const fileUrl = urlData?.publicUrl;
    console.log('[AudioUpload] File uploaded:', fileUrl);

    // 3. Insert record into audio_uploads table
    const { data: dbRecord, error: dbError } = await supabase
      .from('audio_uploads')
      .insert({
        institution_id: metadata.institution_id,
        class_id: metadata.class_id,
        student_id: metadata.student_id || null,
        file_name: metadata.file_name,
        file_url: fileUrl,
        file_size_mb: file.size / (1024 * 1024),
        upload_date: metadata.upload_date,
        class_time: metadata.class_time,
        session_type: metadata.session_type,
        uploaded_by: metadata.uploaded_by,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('[AudioUpload] Database insert failed:', dbError);
      // File uploaded but DB failed - still consider partial success
      return {
        success: true,
        uploadId: null,
        fileUrl,
        message: 'Audio uploaded but tracking failed. Please contact support.',
        warning: dbError.message
      };
    }

    console.log('[AudioUpload] Record created:', dbRecord.id);

    // ✅ AUTOMATED TRANSCRIPTION: Trigger n8n workflow
    try {
      const n8nWebhookUrl = process.env.REACT_APP_N8N_AUDIO_TRANSCRIPTION_WEBHOOK ||
                            'https://n8n.myworkflow.top/webhook/audio-transcription';

      console.log('[AudioUpload] Triggering transcription workflow:', n8nWebhookUrl);

      const webhookResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_id: dbRecord.id,
          file_url: fileUrl,
          metadata: {
            institution_id: metadata.institution_id,
            student_id: metadata.student_id || null,
            class_id: metadata.class_id || null,
            session_type: metadata.session_type,
            class_date: metadata.upload_date,
            class_time: metadata.class_time
          }
        })
      });

      if (!webhookResponse.ok) {
        console.warn(
          '[AudioUpload] Transcription webhook failed (status', webhookResponse.status,
          '), but upload succeeded. Transcription may need manual trigger.'
        );
      } else {
        console.log('[AudioUpload] Transcription workflow triggered successfully');
      }
    } catch (webhookError) {
      console.error('[AudioUpload] Failed to trigger transcription:', webhookError);
      // Don't fail the upload, transcription can be triggered manually
    }
    // ✅ END OF AUTOMATED TRANSCRIPTION

    return {
      success: true,
      uploadId: dbRecord.id,
      fileUrl,
      message: 'Audio uploaded successfully! Transcription in progress...'
    };

  } catch (error) {
    console.error('[AudioUpload] Upload failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload audio'
    };
  }
};

/**
 * Get recent audio uploads for a teacher
 *
 * @param {string} institutionId - Institution UUID
 * @param {string} teacherId - Teacher UUID (optional, filters to their uploads)
 * @param {number} limit - Max results (default 10)
 * @returns {Array} Recent uploads with status
 */
export const getRecentUploads = async (institutionId, teacherId = null, limit = 10) => {
  try {
    let query = supabase
      .from('audio_uploads')
      .select(`
        id,
        file_name,
        file_url,
        file_size_mb,
        upload_date,
        class_time,
        session_type,
        processing_status,
        questions_generated,
        error_message,
        created_at,
        processed_at,
        class:classes(id, class_name, class_code),
        student:students(id, full_name, username)
      `)
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (teacherId) {
      query = query.eq('uploaded_by', teacherId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('[AudioUpload] Failed to fetch recent uploads:', error);
    return [];
  }
};

/**
 * Get upload status by ID
 *
 * @param {string} uploadId - Upload UUID
 * @returns {Object} Upload status details
 */
export const getUploadStatus = async (uploadId) => {
  try {
    const { data, error } = await supabase
      .from('audio_uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (error) throw error;

    return data;

  } catch (error) {
    console.error('[AudioUpload] Failed to fetch upload status:', error);
    return null;
  }
};

/**
 * Get classes for dropdown
 *
 * @param {string} institutionId - Institution UUID
 * @returns {Array} Classes list
 */
export const getClassesForUpload = async (institutionId) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('id, class_name, class_code, subject')
      .eq('institution_id', institutionId)
      .eq('active', true)
      .order('class_name');

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('[AudioUpload] Failed to fetch classes:', error);
    return [];
  }
};

/**
 * Get students for dropdown (filtered by class if provided)
 *
 * @param {string} institutionId - Institution UUID
 * @param {string} classId - Optional class UUID to filter students
 * @returns {Array} Students list
 */
export const getStudentsForUpload = async (institutionId, classId = null) => {
  try {
    if (classId) {
      // Get students enrolled in specific class
      const { data, error } = await supabase
        .from('student_class_enrollments')
        .select(`
          student:students(id, full_name, username)
        `)
        .eq('class_id', classId)
        .eq('status', 'active');

      if (error) throw error;

      return (data || []).map(e => e.student).filter(Boolean);
    } else {
      // Get all students in institution
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, username')
        .eq('institution_id', institutionId)
        .eq('active', true)
        .order('full_name');

      if (error) throw error;

      return data || [];
    }

  } catch (error) {
    console.error('[AudioUpload] Failed to fetch students:', error);
    return [];
  }
};

/**
 * Generate filename following naming convention
 * Format: {type}-{YYYYMMDD}-{HHMM}-{CLASS_CODE}-{student_name}.{ext}
 *
 * @param {Object} params - Parameters for filename
 * @returns {string} Formatted filename
 */
export const generateFileName = ({ sessionType, date, time, classCode, studentUsername, originalFileName }) => {
  const ext = originalFileName.split('.').pop() || 'mp3';
  const dateStr = date.replace(/-/g, ''); // 2025-12-04 → 20251204
  const timeStr = time.replace(':', ''); // 14:00 → 1400

  if (sessionType === 'personal' && studentUsername) {
    return `personal-${dateStr}-${timeStr}-${classCode}-${studentUsername.toLowerCase()}.${ext}`;
  }

  return `group-${dateStr}-${timeStr}-${classCode}.${ext}`;
};

/**
 * Validate audio file
 *
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateAudioFile = (file) => {
  const MAX_SIZE_MB = 500;
  const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];
  const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4', '.mpeg'];

  // Check file exists
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_SIZE_MB) {
    return { valid: false, error: `File too large (${sizeMB.toFixed(1)}MB). Maximum is ${MAX_SIZE_MB}MB.` };
  }

  // Check file type
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(extension);

  if (!isValidType) {
    return { valid: false, error: `Invalid file type. Allowed: MP3, WAV, M4A` };
  }

  return { valid: true, sizeMB: sizeMB.toFixed(2) };
};
