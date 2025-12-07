/**
 * n8n Code Node: Extract Transcript from Gemini Response
 *
 * Purpose: Parse JSON response from Gemini API and extract clean transcript text
 *
 * Input: Response from "Transcribe Audio" node
 * Output: Clean transcript + metadata
 */

// Extract transcript from Gemini response
const response = $input.first().json;

console.log('[Extract Transcript] Processing response...');

// Get the transcript text
const transcript = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

if (!transcript) {
  throw new Error('[Extract Transcript] No transcript found in Gemini response. Check API response structure.');
}

console.log('[Extract Transcript] Transcript length:', transcript.length, 'characters');

// Get metadata from webhook
const webhookData = $('Webhook Trigger').first().json;

// Get Gemini file info
const geminiFile = $('Upload to Gemini File API').first().json;

// Extract filename from file_url (same name as audio file)
// Example: "https://.../personal-20251205-1400-FLUENCE-CLASS6-2025-anaya.mp3"
// Result: "personal-20251205-1400-FLUENCE-CLASS6-2025-anaya"
const fileUrl = webhookData.file_url;
const audioFilename = fileUrl.split('/').pop(); // "personal-20251205-1400-FLUENCE-CLASS6-2025-anaya.mp3"
const transcriptFilename = audioFilename.replace(/\.(mp3|wav|m4a|mpeg|mp4)$/i, '.txt'); // Replace extension with .txt

console.log('[Extract Transcript] Audio file:', audioFilename);
console.log('[Extract Transcript] Transcript will be named:', transcriptFilename);

// Calculate processing time
const processingStarted = $('Update Status → Processing').first().json[0]?.processing_started_at;
const processingTime = processingStarted ?
  Math.floor((Date.now() - new Date(processingStarted).getTime()) / 1000) :
  null;

return [{
  json: {
    // Transcript data
    transcript: transcript,
    transcript_filename: transcriptFilename, // ✅ Same name as audio file
    transcript_length: transcript.length,
    transcript_word_count: transcript.split(/\s+/).length,

    // Original upload metadata
    upload_id: webhookData.upload_id,
    file_url: webhookData.file_url,
    institution_id: webhookData.metadata.institution_id,
    student_id: webhookData.metadata.student_id,
    class_id: webhookData.metadata.class_id,
    session_type: webhookData.metadata.session_type,
    class_date: webhookData.metadata.class_date,
    class_time: webhookData.metadata.class_time,

    // Gemini API metadata
    gemini_file_uri: geminiFile.file?.uri || geminiFile.file?.name,
    gemini_file_id: geminiFile.file?.name, // For cleanup
    gemini_tokens_prompt: response.usageMetadata?.promptTokenCount || 0,
    gemini_tokens_response: response.usageMetadata?.candidatesTokenCount || 0,
    gemini_tokens_total: response.usageMetadata?.totalTokenCount || 0,

    // Processing metadata
    processing_time_seconds: processingTime,
    processed_at: new Date().toISOString()
  }
}];
