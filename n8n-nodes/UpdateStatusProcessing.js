/**
 * n8n Supabase Node: Update Status → "processing"
 *
 * Purpose: Mark audio upload as processing in database
 *
 * SQL Query for Supabase Node
 */

-- Update audio_uploads status to processing
UPDATE audio_uploads
SET
  status = 'processing',
  processing_started_at = NOW(),
  updated_at = NOW()
WHERE id = '{{ $json.upload_id }}'
RETURNING *;
