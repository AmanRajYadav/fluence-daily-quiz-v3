# n8n Workflow Fixes - URGENT 🚨

**Date:** December 5, 2025
**Workflow:** Audio Transcription V3

---

## Issues Found

### ✅ Your Timing Question - NO PROBLEM!

**Q:** "Workflow is getting triggered before the upload is finished - will it cause an issue?"

**A:** **NO, this is perfectly fine!** The code flow is:

1. Upload file to Supabase Storage ✅
2. Get public URL ✅
3. Create database record ✅
4. **THEN** trigger webhook ✅

The file is fully uploaded before the workflow runs. No race condition!

---

### ❌ Critical Issue 1: "Transcribe Audio" Node Missing Request Body

**Error:** The node has empty body parameters, so it's not sending the transcription prompt to Gemini!

**Fix in n8n UI:**

1. Open workflow: "Audio Transcription V3"
2. Click on **"Transcribe Audio"** node
3. **Remove** the current body configuration
4. Change **"Body Content Type"** to: `JSON`
5. In the **"Specify Body"** section:
   - Switch to **Expression** mode (click the gear icon)
   - Paste this expression:
     ```javascript
     {{ $('Prepare Transcription Prompt').first().json.request_body }}
     ```

6. Save the node

**Why this matters:** Without the prompt, Gemini doesn't know what to do with the audio file!

---

### ❌ Critical Issue 2: ALL "Update Status" Nodes Using Wrong Data Reference

**Error from n8n:**
```json
{
  "errorMessage": "Bad request - please check your parameters",
  "errorDescription": "invalid input syntax for type uuid: \"undefined\""
}
```

**Root Cause:** The nodes are using `$json.upload_id`, but the correct reference is `$('Webhook Trigger').item.json.upload_id` (like the "Download Audio" node already does correctly!)

**Database Proof:** All 3 uploads are stuck at `processing_status: 'pending'` because the workflow fails at the FIRST node.

**Fix in n8n UI - ALL 3 STATUS UPDATE NODES:**

#### 1. Fix "Update Status → Processing" Node:

- Click on the node
- Find the **URL** field
- Change from:
  ```javascript
  {{ "https://qhvxijsrtzpirjbuoicy.supabase.co/rest/v1/audio_uploads?id=eq." + $json.upload_id }}
  ```
- To:
  ```javascript
  {{ "https://qhvxijsrtzpirjbuoicy.supabase.co/rest/v1/audio_uploads?id=eq." + $('Webhook Trigger').item.json.upload_id }}
  ```
- **Save**

#### 2. Fix "Update Status → Completed" Node:

- Same change - replace `$json.upload_id` with `$('Webhook Trigger').item.json.upload_id`

#### 3. Fix "Update Status → Failed" Node:

- Same change - replace `$json.upload_id` with `$('Webhook Trigger').item.json.upload_id`

**Why this matters:** The "Download Audio from Supabase" node already uses the CORRECT pattern: `$('Webhook Trigger').item.json.file_url` - all status nodes need to use the same pattern!

---

### ⚠️ Issue 3: CORS Error (Frontend → n8n)

**Error from Console:**
```
Access to fetch at 'https://n8n.myworkflow.top/webhook/audio-transcription' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Status:** The first request failed, but **subsequent requests succeeded**, so CORS headers are working now.

**If CORS errors continue:**

1. **Check n8n settings:**
   ```bash
   # SSH into your GCP VM
   ssh your-vm

   # Check if CORS is enabled in n8n
   env | grep N8N_WEBHOOK
   ```

2. **Add CORS environment variable (if not set):**
   ```bash
   export N8N_WEBHOOK_URL_CORS_ALLOW_ORIGIN="*"
   # or for production:
   export N8N_WEBHOOK_URL_CORS_ALLOW_ORIGIN="http://localhost:3000,https://fluence.ac"

   # Restart n8n
   pm2 restart n8n
   ```

---

## Testing Plan

### Test 1: Manual Webhook Test

Use `curl` to test the webhook with correct data:

```bash
curl -X POST https://n8n.myworkflow.top/webhook/audio-transcription \
  -H "Content-Type: application/json" \
  -d '{
    "upload_id": "ba184a25-270f-4a75-afb1-347cff3bc8b7",
    "file_url": "https://qhvxijsrtzpirjbuoicy.supabase.co/storage/v1/object/public/class-audio/e5dd424c-3bdb-4671-842c-a9c5b6c8495d/personal-20251205-1400-FLUENCE-CLASS6-2025-anaya.mp3",
    "metadata": {
      "institution_id": "e5dd424c-3bdb-4671-842c-a9c5b6c8495d",
      "student_id": "edee9e5a-3bfd-4cc0-87b5-f2334101463f",
      "class_id": null,
      "session_type": "personal",
      "class_date": "2025-12-05",
      "class_time": "14:00"
    }
  }'
```

**Expected:**
- Immediate response: `{"success": true, "message": "Transcription started. This will take 3-6 minutes.", "upload_id": "..."}`
- n8n execution should show all nodes turning green
- Database should update: `processing_status = 'processing'` → `'completed'`

### Test 2: Check Database After Test

```sql
-- Check the upload status
SELECT
  id,
  processing_status,
  transcript_length,
  gemini_tokens_used,
  processed_at,
  error_message
FROM audio_uploads
WHERE id = 'ba184a25-270f-4a75-afb1-347cff3bc8b7';
```

**Expected after 3-6 minutes:**
- `processing_status`: `'completed'`
- `transcript_length`: ~15000 (varies by audio)
- `gemini_tokens_used`: ~50000 (varies)
- `processed_at`: (timestamp)
- `error_message`: `NULL`

---

## Quick Fix Checklist

Before testing again:

- [ ] Fix "Transcribe Audio" node (add request body expression)
- [ ] Test webhook with `curl` command above
- [ ] Check n8n execution logs for errors
- [ ] Verify database updates correctly
- [ ] If still getting `undefined` error, update "Update Status → Processing" URL expression

---

## If Still Not Working

**Share with me:**
1. Screenshot of n8n execution showing which node failed
2. Screenshot of "Webhook Trigger" node OUTPUT tab
3. Full error message from failed node

I'll help debug further!

---

**Priority:** Fix "Transcribe Audio" node FIRST - this is the critical blocker!
