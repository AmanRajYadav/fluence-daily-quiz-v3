/**
 * n8n Supabase Node: Update Status → "completed"
 *
 * Purpose: Mark audio transcription as completed in database
 *
 * SQL Query for Supabase Node
 */

-- Update audio_uploads status to completed
UPDATE audio_uploads
SET
  status = 'completed',
  processing_completed_at = NOW(),
  transcript = '{{ $json.transcript }}',
  transcript_length = {{ $json.transcript_length }},
  gemini_tokens_used = {{ $json.gemini_tokens_total }},
  questions_generated = 30,
  updated_at = NOW()
WHERE id = '{{ $json.upload_id }}'
RETURNING *;
