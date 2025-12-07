/**
 * n8n Code Node: Update Status → "failed"
 *
 * Purpose: Handle errors and mark upload as failed
 *
 * This runs when ANY node in the workflow fails
 */

const error = $input.first().json;
const webhookData = $('Webhook').first()?.json;

console.error('[Error Handler] Workflow failed:', error);

if (!webhookData?.upload_id) {
  console.error('[Error Handler] No upload_id found, cannot update database');
  return [{
    json: {
      error: 'No upload_id found',
      original_error: error.message || 'Unknown error'
    }
  }];
}

// Prepare error message
const errorMessage = error.message || error.error || 'Transcription failed';
const errorDetails = JSON.stringify({
  message: errorMessage,
  node: error.node || 'Unknown',
  timestamp: new Date().toISOString()
});

// Return data for Supabase update
return [{
  json: {
    upload_id: webhookData.upload_id,
    status: 'failed',
    error_message: errorMessage,
    error_details: errorDetails,
    updated_at: new Date().toISOString()
  }
}];
