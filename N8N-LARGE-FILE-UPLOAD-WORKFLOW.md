# n8n Workflow: Large Audio File Upload (>50MB)

**Purpose:** Handle audio files >50MB by using SERVICE_ROLE_KEY to bypass Supabase free tier limits

**Webhook URL:** `https://n8n.myworkflow.top/webhook/audio-upload`

---

## Workflow Nodes

### 1. Webhook Trigger
```
Name: Webhook - Audio Upload
Method: POST
Path: audio-upload
Response Mode: Respond Immediately
```

### 2. Decode Base64 File
**Type:** Code Node
**Name:** Decode Base64 to Binary

```javascript
// Decode base64 file data
const fileData = $json.file_data;
const fileName = $json.file_name;
const contentType = $json.content_type || 'audio/mpeg';

// Convert base64 to binary
const binaryData = Buffer.from(fileData, 'base64');

return {
  json: {
    file_path: $json.file_path,
    file_name: fileName,
    content_type: contentType,
    metadata: $json.metadata
  },
  binary: {
    data: {
      data: binaryData.toString('base64'),
      mimeType: contentType,
      fileName: fileName
    }
  }
};
```

### 3. Upload to Supabase Storage
**Type:** HTTP Request
**Name:** Upload to Supabase Storage (SERVICE_ROLE_KEY)

**Settings:**
- Method: POST
- URL: `https://{{$env.SUPABASE_URL}}/storage/v1/object/class-audio/{{$json.file_path}}`
- Authentication: None (use header)
- Headers:
  ```
  Authorization: Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}
  Content-Type: {{$json.content_type}}
  x-upsert: true
  ```
- Send Binary Data: ON
- Binary Property: `data`

### 4. Prepare Response
**Type:** Code Node
**Name:** Prepare Success Response

```javascript
const supabaseUrl = $env.SUPABASE_URL;
const filePath = $('Upload to Supabase Storage').first().json.file_path;
const publicUrl = `${supabaseUrl}/storage/v1/object/public/class-audio/${filePath}`;

return {
  json: {
    success: true,
    file_url: publicUrl,
    file_name: $json.file_name,
    message: 'File uploaded successfully'
  }
};
```

### 5. Insert to audio_uploads Table
**Type:** Supabase Node (or HTTP Request)
**Name:** Create Upload Record

**SQL:**
```sql
INSERT INTO audio_uploads (
  institution_id,
  class_id,
  student_id,
  file_name,
  file_url,
  file_size_mb,
  upload_date,
  class_time,
  session_type,
  uploaded_by,
  processing_status
) VALUES (
  '{{$json.metadata.institution_id}}',
  '{{$json.metadata.class_id}}',
  '{{$json.metadata.student_id}}',
  '{{$json.file_name}}',
  '{{$node["Prepare Success Response"].json["file_url"]}}',
  {{$json.metadata.file_size_mb}},
  '{{$json.metadata.upload_date}}',
  '{{$json.metadata.class_time}}',
  '{{$json.metadata.session_type}}',
  '{{$json.metadata.uploaded_by}}',
  'pending'
) RETURNING id;
```

### 6. Trigger Transcription Workflow
**Type:** HTTP Request
**Name:** Trigger Audio Transcription

**Settings:**
- Method: POST
- URL: `https://n8n.myworkflow.top/webhook/audio-transcription`
- Headers: `Content-Type: application/json`
- Body:
  ```json
  {
    "upload_id": "{{$node["Create Upload Record"].json["id"]}}",
    "file_url": "{{$node["Prepare Success Response"].json["file_url"]}}",
    "metadata": {{$json.metadata}}
  }
  ```

---

## Environment Variables Needed

Add these to your n8n environment:

```bash
SUPABASE_URL=https://qhvxijsrtzpirjbuoicy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## How It Works

1. **Frontend** sends base64-encoded file >50MB to n8n webhook
2. **n8n** decodes base64 to binary
3. **n8n** uploads to Supabase with SERVICE_ROLE_KEY (no 50MB limit)
4. **n8n** creates database record
5. **n8n** triggers transcription workflow
6. **n8n** returns success with file URL to frontend

---

## Testing

**Curl command:**
```bash
# First, encode your audio file to base64
base64 -i audio.mp3 > audio.base64

# Then send to webhook
curl -X POST https://n8n.myworkflow.top/webhook/audio-upload \
  -H "Content-Type: application/json" \
  -d '{
    "file_data": "BASE64_STRING_HERE",
    "file_name": "test-audio.mp3",
    "file_path": "institution-id/test-audio.mp3",
    "content_type": "audio/mpeg",
    "metadata": {
      "institution_id": "uuid-here",
      "class_id": "uuid-here",
      "student_id": null,
      "session_type": "group",
      "upload_date": "2025-12-12",
      "class_time": "14:00",
      "uploaded_by": "teacher-uuid",
      "file_size_mb": 54.1
    }
  }'
```

---

## Workflow Export

Save as `n8n-workflows/Large-Audio-Upload.json` and import to n8n.

---

## Advantages

✅ Bypasses Supabase 50MB free tier limit
✅ Uses SERVICE_ROLE_KEY safely (backend only)
✅ Automatic transcription trigger
✅ Database tracking
✅ Works with files up to 500MB
✅ No frontend code changes needed (already implemented)

---

**Status:** Ready to implement in n8n
**Priority:** HIGH (blocks 54MB file upload)
