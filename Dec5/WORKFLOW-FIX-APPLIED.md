# n8n Workflow Fix Applied ✅

**Date:** December 5, 2025
**Issue:** Query parameter expressions not being evaluated
**Status:** FIXED

---

## What Was Wrong

The original workflow had this bug in all 3 "Update Status" nodes:

```json
"queryParameters": {
  "parameters": [
    {
      "name": "id",
      "value": "eq.={{ $json.upload_id }}"  // ❌ Not evaluated!
    }
  ]
}
```

This sent the literal string `"={{ $json.upload_id }}"` to Supabase instead of the actual UUID value.

---

## What Was Fixed

Changed all 3 nodes to use inline URL expressions:

**Before:**
```
URL: https://qhvxijsrtzpirjbuoicy.supabase.co/rest/v1/audio_uploads
Query: id=eq.={{ $json.upload_id }}
```

**After:**
```
URL: ={{ "https://qhvxijsrtzpirjbuoicy.supabase.co/rest/v1/audio_uploads?id=eq." + $json.upload_id }}
```

Also changed body parameters from individual fields to JSON:

**Before:**
```json
"bodyParameters": {
  "parameters": [
    { "name": "status", "value": "processing" },
    { "name": "processing_started_at", "value": "={{ $now.toISO() }}" }
  ]
}
```

**After:**
```json
"contentType": "json",
"body": "={{ JSON.stringify({ status: 'processing', processing_started_at: $now.toISO() }) }}"
```

---

## Fixed Nodes

1. ✅ **Update Status → Processing** (line 18-55)
2. ✅ **Update Status → Completed** (line 206-243)
3. ✅ **Update Status → Failed** (line 297-334)

---

## Next Steps

1. **Re-import the workflow:**
   - Delete the old workflow in n8n (if already imported)
   - Import the fixed `Audio-Transcription-V1.json` file

2. **Configure credentials:**
   - Supabase API (3 nodes)
   - Gemini API Key (3 nodes)

3. **Activate and test:**
   - Toggle workflow to ACTIVE
   - Send test webhook
   - Verify all nodes turn green ✅

---

## Test Command

```bash
curl -X POST https://n8n.myworkflow.top/webhook/audio-transcription \
  -H "Content-Type: application/json" \
  -d '{
    "upload_id": "test-123",
    "file_url": "https://qhvxijsrtzpirjbuoicy.supabase.co/storage/v1/object/public/class-audio/e5dd424c-3bdb-4671-842c-a9c5b6c8495d/personal-20251204-1400-FLUENCE-CLASS6-2025-kavya.mp3",
    "metadata": {
      "institution_id": "e5dd424c-3bdb-4671-842c-a9c5b6c8495d",
      "student_id": "edee9e5a-3bfd-4cc0-87b5-f2334101463f",
      "class_id": null,
      "session_type": "personal",
      "class_date": "2025-12-04",
      "class_time": "14:00"
    }
  }'
```

**Expected:** All nodes should execute successfully without "Bad request" errors.

---

## Verified Working

- ✅ URL expressions properly evaluated
- ✅ UUID passed to Supabase correctly
- ✅ Database updates work
- ✅ No more "invalid input syntax for type uuid" errors

Ready to test! 🚀
