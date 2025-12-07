# Audio Transcription Setup Guide - Quick Start

**Time Required:** 30 minutes
**Difficulty:** Medium
**Prerequisites:** Access to GCP VM, n8n, Supabase

---

## Step 1: Configure n8n Environment (5 minutes)

### SSH into your GCP VM
```bash
ssh your-gcp-vm
```

### Set the CRITICAL environment variable
```bash
# Add to n8n startup configuration
export N8N_DEFAULT_BINARY_DATA_MODE=filesystem

# Make it permanent (add to ~/.bashrc)
echo 'export N8N_DEFAULT_BINARY_DATA_MODE=filesystem' >> ~/.bashrc
source ~/.bashrc
```

### Restart n8n
```bash
# If using pm2:
pm2 restart n8n

# If using systemd:
sudo systemctl restart n8n

# Verify it's running:
pm2 status
# or
sudo systemctl status n8n
```

### Verify environment variable
```bash
# Check that it's set
echo $N8N_DEFAULT_BINARY_DATA_MODE
# Should output: filesystem
```

---

## Step 2: Get Gemini API Key (2 minutes)

1. Go to https://aistudio.google.com/apikey
2. Click **"Create API key in new project"** (or use existing project)
3. Copy the API key (starts with `AIza...`)
4. Save it somewhere safe (you'll need it in Step 3)

**Example:**
```
AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz
```

---

## Step 3: Add API Key to n8n (3 minutes)

1. Open n8n in browser: `http://your-vm-ip:5678` or `https://n8n.myworkflow.top`
2. Click **Settings** (gear icon) → **Credentials**
3. Click **"Add Credential"**
4. Search for **"Google Gemini"** or **"Google AI"**
5. Paste your API key
6. Name it: **"Gemini API - Transcription"**
7. Click **Save**

---

## Step 4: Create n8n Workflow (15 minutes)

### Option A: Import JSON (Recommended - 2 minutes)

**Coming soon:** We'll provide a pre-built JSON export

1. Go to n8n
2. Click **Workflows** → **Import from File**
3. Select `n8n-workflows/Audio-Transcription-V1.json`
4. Click **Import**
5. Update credential references to your "Gemini API - Transcription"
6. Save workflow

### Option B: Build Manually (15 minutes)

Follow this node structure:

```
1. Webhook Trigger
   ├─ Path: audio-transcription
   ├─ Method: POST
   └─ URL: https://n8n.myworkflow.top/webhook/audio-transcription

2. Update Status → "processing"
   ├─ Type: HTTP Request (Supabase REST API)
   ├─ SQL: Use code from n8n-nodes/UpdateStatusProcessing.js

3. Respond to Webhook
   ├─ Type: Respond to Webhook
   └─ Response: {success: true, message: "Processing started"}

4. Download Audio from Supabase
   ├─ Type: HTTP Request
   ├─ URL: {{ $json.file_url }}
   ├─ Response Format: File ← CRITICAL!
   └─ Binary Property Output: audio_file

5. Upload to Gemini File API
   ├─ Type: HTTP Request
   ├─ Method: POST
   ├─ URL: https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key={{ $credentials.gemini_api_key }}
   ├─ Send Binary: ON ← CRITICAL!
   ├─ Binary Property Name: audio_file
   └─ Headers:
       - X-Goog-Upload-Protocol: raw
       - X-Goog-Upload-Command: upload, finalize

6. Prepare Transcription Prompt
   ├─ Type: Code Node
   └─ Code: Use n8n-nodes/PrepareTranscriptionPrompt.js

7. Transcribe Audio
   ├─ Type: HTTP Request
   ├─ Method: POST
   ├─ URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key={{ $credentials.gemini_api_key }}
   ├─ Body: {{ $json.request_body }}
   └─ Timeout: 300000 (5 minutes)

8. Extract Transcript
   ├─ Type: Code Node
   └─ Code: Use n8n-nodes/ExtractTranscript.js

9. Save Transcript (optional - if you want separate storage)
   └─ Skip for now, we'll save to audio_uploads table directly

10. [CONNECT TO EXISTING QUIZ GENERATION]
    ├─ Find your existing "Class Q & S Workflow V3"
    ├─ Connect to "Build LLM2 Prompt" node
    └─ Pass: {{ $json.transcript }} as transcription

11. Update Status → "completed"
    ├─ Type: HTTP Request (Supabase)
    └─ SQL: Use n8n-nodes/UpdateStatusCompleted.js

12. Delete Gemini File (cleanup)
    ├─ Type: HTTP Request
    ├─ Method: DELETE
    └─ URL: https://generativelanguage.googleapis.com/v1beta/files/{{ $('Upload to Gemini File API').first().json.file.name }}

13. [ERROR HANDLER]
    ├─ Type: Error Trigger
    ├─ Connect to: All nodes
    └─ Action: Update Status → "failed"
        - Type: Code Node → Use n8n-nodes/UpdateStatusFailed.js
        - Then: HTTP Request to update database
```

**Save the workflow!**

---

## Step 5: Update Frontend (5 minutes)

### Edit `src/services/audioUploadService.js`

Find the section after database insert (around line 93):

```javascript
// After successful upload and DB insert
console.log('[AudioUpload] Upload complete:', { uploadId: dbRecord.id, fileUrl });

// ✅ ADD THIS CODE:
// Trigger n8n transcription workflow
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
        institution_id: session.institution_id,
        student_id: studentId,
        class_id: classId,
        session_type: sessionType,
        class_date: recordingDate,
        class_time: recordingTime
      }
    })
  });

  if (!webhookResponse.ok) {
    console.warn('[AudioUpload] Transcription webhook failed (status', webhookResponse.status, '), but upload succeeded');
  } else {
    console.log('[AudioUpload] Transcription workflow triggered successfully');
  }
} catch (webhookError) {
  console.error('[AudioUpload] Failed to trigger transcription:', webhookError);
  // Don't fail the upload, just log the error
}
// ✅ END OF ADDED CODE

return {
  success: true,
  uploadId: dbRecord.id,
  fileUrl,
  message: 'Audio uploaded successfully. Transcription in progress...'
};
```

### Add environment variable to `.env`

```bash
# .env
REACT_APP_N8N_AUDIO_TRANSCRIPTION_WEBHOOK=https://n8n.myworkflow.top/webhook/audio-transcription
```

---

## Step 6: Test the Workflow (5 minutes)

### Test 1: Manual Trigger (n8n)

1. In n8n, open your workflow
2. Click **"Execute Workflow"** button
3. Send test webhook:
   ```bash
   curl -X POST https://n8n.myworkflow.top/webhook/audio-transcription \
     -H "Content-Type: application/json" \
     -d '{
       "upload_id": "test-123",
       "file_url": "https://qhvxijsrtzpirjbuoicy.supabase.co/storage/v1/object/public/class-audio/test.mp3",
       "metadata": {
         "institution_id": "your-institution-id",
         "student_id": "test-student-id",
         "class_id": null,
         "session_type": "personal",
         "class_date": "2025-12-05",
         "class_time": "14:00"
       }
     }'
   ```

4. Watch the workflow execute step-by-step
5. Check for errors

### Test 2: Frontend Upload

1. Open Teacher Dashboard: `http://localhost:3000/teacher/dashboard`
2. Go to **Overview** tab
3. Upload a **small audio file** (5-10 minutes, ~5MB):
   - Session Type: Personal
   - Student: Select test student
   - Date: Today
   - Time: Current time
   - File: Select audio file

4. Click **"Upload & Generate Questions"**
5. Watch the console logs:
   ```
   [AudioUpload] Uploading to Supabase Storage...
   [AudioUpload] File uploaded: https://...
   [AudioUpload] Database insert success
   [AudioUpload] Triggering transcription workflow: https://n8n.myworkflow.top/webhook/audio-transcription
   [AudioUpload] Transcription workflow triggered successfully
   [OverviewTab] Upload complete: {success: true, uploadId: "...", message: "Transcription in progress..."}
   ```

6. Check n8n execution history:
   - Should show new execution
   - All nodes should be green (success)
   - Check "Extract Transcript" node output - should have transcript text

7. Wait 3-6 minutes, then check database:
   ```sql
   SELECT id, status, transcript_length, questions_generated, processing_started_at, processing_completed_at
   FROM audio_uploads
   WHERE id = 'your-upload-id';
   ```

   Expected:
   ```
   status: 'completed'
   transcript_length: ~15000 (varies by audio length)
   questions_generated: 30
   processing_completed_at: (timestamp)
   ```

8. Check quiz_questions table:
   ```sql
   SELECT COUNT(*) FROM quiz_questions
   WHERE student_id = 'test-student-id'
   AND active = true;
   ```

   Expected: **30 questions**

---

## Troubleshooting

### Issue: "File too large" error

**Solution:** Check audio file size
```bash
ls -lh test-audio.mp3
# Should be <100MB
```

If >100MB, compress:
```bash
ffmpeg -i input.mp3 -b:a 64k output.mp3
```

### Issue: "Rate limit exceeded"

**Solution:** Wait 30 seconds between uploads (Gemini free tier: 2 req/min)

### Issue: n8n workflow shows "Out of memory"

**Solution:** Check environment variable
```bash
echo $N8N_DEFAULT_BINARY_DATA_MODE
# Should output: filesystem
```

If not set, restart n8n after setting it.

### Issue: Webhook returns 404

**Solution:** Check webhook URL
- Workflow must be **ACTIVE** (toggle on)
- Path must match: `/webhook/audio-transcription`
- Check full URL in n8n Webhook node settings

### Issue: Transcript is empty

**Solution:** Check Gemini API response
- Open n8n execution
- Click "Transcribe Audio" node
- Check output - should have `candidates[0].content.parts[0].text`
- If empty, check prompt quality or audio file integrity

---

## Success Checklist

After setup, verify:

- [ ] `N8N_DEFAULT_BINARY_DATA_MODE=filesystem` is set
- [ ] n8n restarted successfully
- [ ] Gemini API key added to n8n credentials
- [ ] n8n workflow created and ACTIVE
- [ ] Frontend code updated with webhook trigger
- [ ] `.env` has `REACT_APP_N8N_AUDIO_TRANSCRIPTION_WEBHOOK`
- [ ] Test upload works (5-min audio)
- [ ] n8n execution shows all green nodes
- [ ] Database shows `status: 'completed'`
- [ ] 30 questions generated
- [ ] Transcript saved to database
- [ ] Processing time <10 minutes

---

## Next Steps

Once basic automation works:

1. **Test with 90-minute audio** (your production use case)
2. **Add transcript editing UI** (optional)
3. **Build AI tutor from transcript** (future feature)
4. **Generate infographics** (future feature)
5. **Teacher feedback reports** (future feature)

---

## Need Help?

Check the logs:

**n8n Logs:**
```bash
pm2 logs n8n
# or
journalctl -u n8n -f
```

**Frontend Console:**
- Open Chrome DevTools
- Console tab
- Look for `[AudioUpload]` prefix

**Database:**
```sql
-- Check upload status
SELECT * FROM audio_uploads ORDER BY created_at DESC LIMIT 10;

-- Check if questions were generated
SELECT COUNT(*), student_id FROM quiz_questions
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY student_id;
```

---

**Good luck! 🚀 This is going to save you 25+ hours/month of manual work.**
