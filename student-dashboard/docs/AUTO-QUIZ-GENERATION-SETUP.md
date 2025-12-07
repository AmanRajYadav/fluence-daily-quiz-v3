# Auto Quiz Generation Setup

**Purpose:** Automatically trigger quiz generation workflow after transcription completes.

**Current State:** Audio transcription workflow completes successfully, but does NOT automatically trigger quiz generation.

**Goal:** Add automatic trigger so the flow becomes: **Audio Upload → Transcribe → Generate Quiz (automatic)**

---

## Current Workflows

### 1. Audio Transcription V3
**File:** `n8n-workflows/Audio Transcription V3.json`
**Webhook:** `https://n8n.myworkflow.top/webhook/audio-transcription`

**Flow:**
1. Webhook Trigger (receives audio upload notification)
2. Update Status → Processing
3. Respond to Webhook
4. Download Audio from Supabase
5. Upload to Gemini File API
6. Prepare Transcription Prompt
7. Transcribe Audio (gemini-2.5-pro)
8. Extract Transcript
9. Update Status → Completed
10. Delete Gemini File (Cleanup) ✅ **CURRENTLY ENDS HERE**

### 2. Class Q & S V3 (Quiz Generation)
**File:** `n8n-workflows/Class Q & S V3.json`
**Status:** Manual trigger only (no webhook yet)

**Expected Input:**
```json
{
  "body": {
    "transcription": "Full transcript text...",
    "metadata": {
      "filename": "personal-20251205-1400-FLUENCE-CLASS6-2025-anaya.txt",
      "institution_id": "uuid",
      "class_id": "uuid",
      "student_id": "uuid" // null for group classes
    }
  }
}
```

**Flow:**
1. Data Processing V3 (parse filename)
2. Get Class Info (from Supabase)
3. Resolve Student ID
4. (Continues with quiz generation using Gemini API)

---

## Solution: Add Execute Workflow Trigger

### Step 1: Add "Execute Workflow" Node

**In n8n workflow "Audio Transcription V3":**

1. Open the workflow in n8n editor
2. After "Delete Gemini File (Cleanup)" node, add a new node
3. Select **"Execute Workflow"** node type
4. Configure:

**Node Name:** `Trigger Quiz Generation`

**Settings:**
- **Workflow to Execute:** Select "Class Q & S V3"
- **Execution Mode:** `Continue on Error` (if quiz gen fails, don't break transcription)
- **Wait for Completion:** `true` (to track success/failure)

**Data to Pass:**
```javascript
{{
  {
    "body": {
      "transcription": $('Extract Transcript').first().json.transcript,
      "metadata": {
        "filename": $('Extract Transcript').first().json.transcript_filename,
        "institution_id": $('Extract Transcript').first().json.institution_id,
        "class_id": $('Extract Transcript').first().json.class_id,
        "student_id": $('Extract Transcript').first().json.student_id
      }
    }
  }
}}
```

### Step 2: Alternative - Use Webhook Trigger

**If "Execute Workflow" doesn't work:**

1. Add a webhook trigger to "Class Q & S V3" workflow
2. In "Audio Transcription V3", add HTTP Request node:

**Node Name:** `Trigger Quiz Generation (Webhook)`

**Settings:**
- **Method:** POST
- **URL:** `https://n8n.myworkflow.top/webhook/quiz-generation`
- **Authentication:** None (internal webhook)
- **Send Body:** Yes
- **Body Content Type:** JSON
- **JSON Body:**
```javascript
{{
  {
    "transcription": $('Extract Transcript').first().json.transcript,
    "metadata": {
      "filename": $('Extract Transcript').first().json.transcript_filename,
      "institution_id": $('Extract Transcript').first().json.institution_id,
      "class_id": $('Extract Transcript').first().json.class_id,
      "student_id": $('Extract Transcript').first().json.student_id
    }
  }
}}
```

---

## Update Workflow JSON

### Manual Edit (if needed):

1. Open `E:\fluence-quiz-v2\n8n-workflows\Audio Transcription V3.json`
2. Add node after line 329 (after Delete Gemini File):

```json
{
  "parameters": {
    "workflowId": "{{ CLASS_Q_S_V3_WORKFLOW_ID }}",
    "fieldsUi": {
      "values": [
        {
          "name": "body",
          "stringValue": "={{ { \"transcription\": $('Extract Transcript').first().json.transcript, \"metadata\": { \"filename\": $('Extract Transcript').first().json.transcript_filename, \"institution_id\": $('Extract Transcript').first().json.institution_id, \"class_id\": $('Extract Transcript').first().json.class_id, \"student_id\": $('Extract Transcript').first().json.student_id } } }}"
        }
      ]
    },
    "options": {
      "waitForExecution": true
    }
  },
  "id": "trigger-quiz-generation",
  "name": "Trigger Quiz Generation",
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1,
  "position": [992, -112]
}
```

3. Update connections section:
```json
"Delete Gemini File (Cleanup)": {
  "main": [
    [
      {
        "node": "Trigger Quiz Generation",
        "type": "main",
        "index": 0
      }
    ]
  ]
}
```

---

## Testing

### Test End-to-End Flow:

1. **Upload Test Audio:**
   ```bash
   # Use existing audio file in test-audio/
   # Upload via teacher dashboard or API
   ```

2. **Monitor n8n Executions:**
   - Open n8n UI: `https://n8n.myworkflow.top`
   - Go to "Executions" tab
   - Watch for 2 executions:
     1. Audio Transcription V3 ✅
     2. Class Q & S V3 ✅ (triggered automatically)

3. **Verify Database:**
   ```sql
   -- Check transcript was saved
   SELECT processing_status, transcript_length, questions_generated
   FROM audio_uploads
   ORDER BY created_at DESC
   LIMIT 1;
   -- Expected: processing_status = 'completed', questions_generated = 30

   -- Check questions were created
   SELECT COUNT(*) FROM quiz_questions
   WHERE created_at > NOW() - INTERVAL '5 minutes';
   -- Expected: 30 new questions
   ```

4. **Check Quiz App:**
   - Open quiz app as student
   - Verify new quiz is available
   - Questions should be from the latest transcript

---

## Error Handling

**If Quiz Generation Fails:**
- Audio transcription should still complete
- Transcript should be saved to database
- Manual quiz generation can be triggered later

**Logs to Check:**
- n8n execution logs
- Gemini API usage (tokens consumed)
- Supabase database logs

---

## Current Limitations

1. **No Retry Logic:** If quiz gen fails, it doesn't retry
2. **No Notification:** Admin doesn't get notified of failures
3. **Manual Intervention:** Failed quiz gen requires manual trigger

## Future Enhancements

- [ ] Add retry logic (3 attempts with exponential backoff)
- [ ] Send email notification on failure (to aman@fluence.ac)
- [ ] Add "Regenerate Quiz" button in transcript management UI
- [ ] Track quiz generation status in `audio_uploads` table (new column: `quiz_generation_status`)

---

**Created:** 2025-12-05
**Status:** Ready to Implement
**Priority:** High (needed for full automation)
**Estimated Time:** 30 minutes (n8n UI) or 15 minutes (manual JSON edit)
