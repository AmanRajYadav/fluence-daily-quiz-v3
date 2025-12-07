import { getCurrentSession } from './authService';

const WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL;

/**
 * Submit quiz results to n8n workflow
 * Automatically adds institution_id and class_id from session
 */
export const submitQuizResults = async (resultsData) => {
  // Validate webhook URL
  if (!WEBHOOK_URL) {
    console.error('[webhookService] Webhook URL not configured');
    return {
      success: false,
      error: 'Webhook URL not configured in environment variables'
    };
  }

  // Get current student session
  const session = getCurrentSession();
  if (!session) {
    console.error('[webhookService] No active session found');
    return {
      success: false,
      error: 'No active session. Please login again.'
    };
  }

  // Add V3 institution model fields from session
  const payload = {
    ...resultsData,
    institution_id: session.institution_id,
    class_id: session.class_id
  };

  console.log('[webhookService] Submitting quiz results with V3 fields:');
  console.log('  - student_id:', payload.student_id);
  console.log('  - institution_id:', payload.institution_id);
  console.log('  - class_id:', payload.class_id);
  console.log('  - score:', payload.score);
  console.log('  - total_questions:', payload.total_questions);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[webhookService] Submission failed:', response.status, errorText);
      throw new Error(`Webhook submission failed: ${response.status} - ${errorText}`);
    }

    // Parse JSON response
    const contentType = response.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim().length > 0) {
        try {
          data = JSON.parse(text);
          console.log('[webhookService] Success response:', data);
        } catch (e) {
          console.warn('[webhookService] Failed to parse JSON response, but request was successful');
        }
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('[webhookService] Error submitting to webhook:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error occurred during submission'
    };
  }
};
