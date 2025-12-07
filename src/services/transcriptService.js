import { supabase } from './supabase';

/**
 * Transcript Management Service
 *
 * Handles fetching, downloading, and managing audio transcripts
 * Admin-only functionality for aman@fluence.ac
 */

/**
 * Get all transcripts with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.search - Search in filename
 * @param {string} filters.dateFrom - Filter from date (YYYY-MM-DD)
 * @param {string} filters.dateTo - Filter to date (YYYY-MM-DD)
 * @param {string} filters.institutionId - Filter by institution
 * @param {string} filters.sessionType - Filter by session type (personal/group)
 * @returns {Promise<Array>} Array of transcript records
 */
export const getTranscripts = async (filters = {}) => {
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
        transcript,
        transcript_filename,
        transcript_length,
        gemini_tokens_used,
        questions_generated,
        created_at,
        processed_at,
        institutions!inner(name),
        classes!inner(class_name, class_code, subject),
        students(full_name, username)
      `)
      .eq('processing_status', 'completed')
      .not('transcript', 'is', null)
      .order('upload_date', { ascending: false })
      .order('class_time', { ascending: false });

    // Apply filters
    if (filters.dateFrom) {
      query = query.gte('upload_date', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('upload_date', filters.dateTo);
    }

    if (filters.institutionId) {
      query = query.eq('institution_id', filters.institutionId);
    }

    if (filters.sessionType) {
      query = query.eq('session_type', filters.sessionType);
    }

    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      query = query.or(`file_name.ilike.${searchTerm},transcript_filename.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Transcript Service] Error fetching transcripts:', error);
      throw error;
    }

    console.log(`[Transcript Service] Fetched ${data?.length || 0} transcripts`);
    return data || [];
  } catch (error) {
    console.error('[Transcript Service] Error in getTranscripts:', error);
    throw error;
  }
};

/**
 * Download transcript as .txt file
 * Creates a Blob and triggers browser download
 * @param {string} transcript - Full transcript text
 * @param {string} filename - Filename for download
 */
export const downloadTranscript = (transcript, filename) => {
  try {
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[Transcript Service] Downloaded: ${filename}`);
  } catch (error) {
    console.error('[Transcript Service] Error downloading transcript:', error);
    throw error;
  }
};

/**
 * Copy transcript text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<Object>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log('[Transcript Service] Copied to clipboard');
    return { success: true };
  } catch (error) {
    console.error('[Transcript Service] Error copying to clipboard:', error);
    return { success: false, error };
  }
};

/**
 * Delete transcript record (admin only)
 * WARNING: This is permanent deletion
 * @param {string} uploadId - Upload ID to delete
 * @returns {Promise<Object>} Success status
 */
export const deleteTranscript = async (uploadId) => {
  try {
    const { error } = await supabase
      .from('audio_uploads')
      .delete()
      .eq('id', uploadId);

    if (error) {
      console.error('[Transcript Service] Error deleting transcript:', error);
      throw error;
    }

    console.log(`[Transcript Service] Deleted transcript: ${uploadId}`);
    return { success: true };
  } catch (error) {
    console.error('[Transcript Service] Error in deleteTranscript:', error);
    throw error;
  }
};

/**
 * Get all institutions for filter dropdown
 * @returns {Promise<Array>} Array of institutions
 */
export const getInstitutions = async () => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('[Transcript Service] Error fetching institutions:', error);
      throw error;
    }

    console.log(`[Transcript Service] Fetched ${data?.length || 0} institutions`);
    return data || [];
  } catch (error) {
    console.error('[Transcript Service] Error in getInstitutions:', error);
    throw error;
  }
};

/**
 * Format date for display
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date (5 Dec 2025)
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format time for display
 * @param {string} timeStr - Time string (HH:MM:SS)
 * @returns {string} Formatted time (2:30 PM)
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

/**
 * Format file size for display
 * @param {number} mb - Size in megabytes
 * @returns {string} Formatted size (0.5 MB)
 */
export const formatFileSize = (mb) => {
  if (!mb) return '-';
  return `${mb.toFixed(1)} MB`;
};

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number (2,329)
 */
export const formatNumber = (num) => {
  if (!num) return '0';
  return num.toLocaleString('en-US');
};

// ============================================
// ADVANCED FEATURES
// ============================================

/**
 * Bulk download transcripts as ZIP file
 * @param {Array} transcripts - Array of transcript objects to download
 * @param {string} zipFilename - Name for the ZIP file
 * @returns {Promise<void>}
 */
export const bulkDownloadTranscripts = async (transcripts, zipFilename = 'transcripts.zip') => {
  try {
    const JSZip = (await import('jszip')).default;
    const { saveAs } = await import('file-saver');

    const zip = new JSZip();

    // Add each transcript to ZIP
    transcripts.forEach((transcript) => {
      const filename = transcript.transcript_filename || `transcript-${transcript.id}.txt`;
      zip.file(filename, transcript.transcript);
    });

    // Generate ZIP file
    const blob = await zip.generateAsync({ type: 'blob' });

    // Download ZIP
    saveAs(blob, zipFilename);

    console.log(`[Transcript Service] Bulk downloaded ${transcripts.length} transcripts`);
  } catch (error) {
    console.error('[Transcript Service] Error in bulkDownloadTranscripts:', error);
    throw error;
  }
};

/**
 * Export transcripts metadata to CSV
 * @param {Array} transcripts - Array of transcript objects
 * @param {string} filename - CSV filename
 */
export const exportToCSV = (transcripts, filename = 'transcripts.csv') => {
  try {
    // Define CSV headers
    const headers = [
      'Filename',
      'Date',
      'Time',
      'Session Type',
      'Institution',
      'Class Code',
      'Class Name',
      'Student Name',
      'File Size (MB)',
      'Transcript Length (chars)',
      'Word Count',
      'Gemini Tokens',
      'Questions Generated',
      'Processing Status',
      'Created At',
      'Processed At'
    ];

    // Convert transcripts to CSV rows
    const rows = transcripts.map((t) => [
      t.transcript_filename || '',
      formatDate(t.upload_date),
      formatTime(t.class_time),
      t.session_type || '',
      t.institutions?.name || '',
      t.classes?.class_code || '',
      t.classes?.class_name || '',
      t.students?.full_name || '-',
      t.file_size_mb || 0,
      t.transcript_length || 0,
      t.transcript ? t.transcript.split(/\s+/).length : 0,
      t.gemini_tokens_used || 0,
      t.questions_generated || 0,
      t.processing_status || '',
      new Date(t.created_at).toLocaleString(),
      t.processed_at ? new Date(t.processed_at).toLocaleString() : '-'
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[Transcript Service] Exported ${transcripts.length} transcripts to CSV`);
  } catch (error) {
    console.error('[Transcript Service] Error in exportToCSV:', error);
    throw error;
  }
};

/**
 * Search within transcript content (full-text search)
 * @param {string} searchTerm - Term to search for
 * @param {Array} transcripts - Array of transcript objects
 * @returns {Array} Filtered transcripts with match info
 */
export const searchInTranscriptContent = (searchTerm, transcripts) => {
  if (!searchTerm || !searchTerm.trim()) {
    return transcripts.map(t => ({ ...t, matchCount: 0, matchSnippets: [] }));
  }

  const term = searchTerm.toLowerCase().trim();

  return transcripts
    .map((transcript) => {
      const content = (transcript.transcript || '').toLowerCase();
      const matches = content.split(term).length - 1;

      // Get snippets around matches (first 3)
      const snippets = [];
      if (matches > 0) {
        const contentLower = content;
        let index = contentLower.indexOf(term);
        let snippetCount = 0;

        while (index !== -1 && snippetCount < 3) {
          const start = Math.max(0, index - 50);
          const end = Math.min(content.length, index + term.length + 50);
          const snippet = transcript.transcript.substring(start, end);
          snippets.push(snippet);

          index = contentLower.indexOf(term, index + 1);
          snippetCount++;
        }
      }

      return {
        ...transcript,
        matchCount: matches,
        matchSnippets: snippets
      };
    })
    .filter((t) => t.matchCount > 0);
};

/**
 * Highlight search term in text
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Term to highlight
 * @returns {string} HTML with highlighted terms
 */
export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm || !searchTerm.trim() || !text) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-300 px-1 rounded">$1</mark>');
};

/**
 * Update transcript text (admin edit)
 * @param {string} uploadId - Upload ID
 * @param {string} newTranscript - Updated transcript text
 * @returns {Promise<Object>} Success status
 */
export const updateTranscript = async (uploadId, newTranscript) => {
  try {
    const { error } = await supabase
      .from('audio_uploads')
      .update({
        transcript: newTranscript,
        transcript_length: newTranscript.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadId);

    if (error) {
      console.error('[Transcript Service] Error updating transcript:', error);
      throw error;
    }

    console.log(`[Transcript Service] Updated transcript: ${uploadId}`);
    return { success: true };
  } catch (error) {
    console.error('[Transcript Service] Error in updateTranscript:', error);
    throw error;
  }
};

/**
 * Get analytics data for transcripts
 * @param {Array} transcripts - Array of all transcripts
 * @returns {Object} Analytics data
 */
export const getAnalytics = (transcripts) => {
  if (!transcripts || transcripts.length === 0) {
    return {
      totalTranscripts: 0,
      totalTokens: 0,
      avgTokens: 0,
      totalChars: 0,
      avgChars: 0,
      avgProcessingTime: 0,
      totalFileSize: 0,
      avgFileSize: 0,
      bySessionType: { personal: 0, group: 0 },
      byStatus: { completed: 0, processing: 0, failed: 0 },
      costEstimate: 0
    };
  }

  const totalTranscripts = transcripts.length;
  const totalTokens = transcripts.reduce((sum, t) => sum + (t.gemini_tokens_used || 0), 0);
  const totalChars = transcripts.reduce((sum, t) => sum + (t.transcript_length || 0), 0);
  const totalFileSize = transcripts.reduce((sum, t) => sum + (t.file_size_mb || 0), 0);

  // Calculate processing times
  const processingTimes = transcripts
    .filter((t) => t.created_at && t.processed_at)
    .map((t) => {
      const created = new Date(t.created_at);
      const processed = new Date(t.processed_at);
      return (processed - created) / 1000; // seconds
    });

  const avgProcessingTime =
    processingTimes.length > 0
      ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
      : 0;

  // Group by session type
  const bySessionType = transcripts.reduce(
    (acc, t) => {
      if (t.session_type === 'personal') acc.personal++;
      else if (t.session_type === 'group') acc.group++;
      return acc;
    },
    { personal: 0, group: 0 }
  );

  // Group by status
  const byStatus = transcripts.reduce(
    (acc, t) => {
      if (t.processing_status === 'completed') acc.completed++;
      else if (t.processing_status === 'processing') acc.processing++;
      else if (t.processing_status === 'failed') acc.failed++;
      return acc;
    },
    { completed: 0, processing: 0, failed: 0 }
  );

  // Estimate cost (Gemini 2.5 Pro is FREE up to 1M tokens/month)
  // But if we were paying: ~$0.00125 per 1K tokens
  const costEstimate = (totalTokens / 1000) * 0.00125;

  return {
    totalTranscripts,
    totalTokens,
    avgTokens: totalTokens / totalTranscripts,
    totalChars,
    avgChars: totalChars / totalTranscripts,
    avgProcessingTime,
    totalFileSize,
    avgFileSize: totalFileSize / totalTranscripts,
    bySessionType,
    byStatus,
    costEstimate
  };
};
