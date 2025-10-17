const WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL;

export const submitQuizResults = async (resultsData) => {
  // Validate webhook URL
  if (!WEBHOOK_URL) {
    console.error('Webhook URL not configured');
    return { success: false, error: 'Webhook URL not configured in environment variables' };
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resultsData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook submission failed: ${response.status} - ${errorText}`);
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim().length > 0) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.warn('Failed to parse JSON response, but request was successful');
        }
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error submitting to webhook:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error occurred during webhook submission'
    };
  }
};
