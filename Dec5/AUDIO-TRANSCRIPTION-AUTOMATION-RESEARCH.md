# Audio Transcription Automation - Research & Solution Design

**Date:** December 5, 2025
**Status:** Implementation Ready
**Priority:** 🔥 CRITICAL - Unlocks all future features

---

## 🎯 Executive Summary

**Problem:** Manual audio transcription taking 5 minutes per recording, blocking automation of quiz generation, AI tutors, infographics, and teacher feedback.

**Previous Attempt:** n8n workflow crashed after 2-3+ hours (memory overflow on basic GCP VM).

**Solution:** Gemini File API + n8n with binary data streaming
**Expected Result:** 3-6 minute fully automated transcription, zero manual work, FREE
**Risk Level:** 🟢 Low (proven technology, well-documented)

---

## 📊 Current State Analysis

### Manual Workflow (Current)
```
1. Teacher uploads 90-min audio (~80MB) to Gemini Studio
2. Wait 2-3 minutes for transcription
3. Manually copy transcript
4. Paste into quiz generation workflow
5. Wait for questions to generate

Total Time: ~5 minutes of manual labor per recording
Cost: FREE (using Gemini Studio)
Quality: ✅ Excellent (high accuracy, good formatting, speaker labels)
```

### Previous Automation Attempt (FAILED)
```
1. Upload audio to n8n webhook
2. n8n tries to process 80MB file
3. VM runs out of memory (1-2GB RAM limit)
4. Workflow crashes OR runs for 2-3+ hours
5. Questions never generated

Error: "Out of memory" or infinite retry loops
```

---

## 🔍 Root Cause Analysis

### Why Previous n8n Attempt Failed

**Issue #1: Memory Overflow** 🔴 CRITICAL
- n8n default: `N8N_DEFAULT_BINARY_DATA_MODE=default` (stores in memory)
- 80MB audio file loaded into RAM
- Basic GCP VM has only 1-2GB RAM
- VM crashed or swapped to disk (2-3 hour delays)

**Fix:**
```bash
export N8N_DEFAULT_BINARY_DATA_MODE=filesystem
```
This saves binary data to disk instead of memory.

**Issue #2: Wrong API Approach** 🟡 MEDIUM
- May have tried sending 80MB directly in HTTP request body
- Gemini API has 20MB request size limit for inline data
- Should use File API: upload → file_uri → reference pattern

**Fix:** Use Gemini File API (two-step process)

**Issue #3: Synchronous Processing** 🟡 MEDIUM
- Webhook waited for completion
- Timeout after 30-60 seconds
- n8n retried multiple times
- Created concurrent processing loops
- Rate limits kicked in

**Fix:** Return immediate webhook response, process async

---

## 🌐 Web Research Findings (December 2025)

### 1. Gemini API Audio Capabilities

Source: [Google AI for Developers - Audio Understanding](https://ai.google.dev/gemini-api/docs/audio)

**Supported Models:**
- Gemini 2.5 Pro: Highest accuracy, slower processing
- Gemini 2.0 Flash: Good accuracy, **MUCH faster** ⭐ RECOMMENDED

**File Limits:**
| Spec | Limit | Your Files |
|------|-------|------------|
| Max File Size | 2GB | 80MB ✅ |
| Max Duration | 9.5 hours | 90 min ✅ |
| Upload Method | File API | Required for >20MB |
| Supported Formats | MP3, WAV, M4A, AAC, FLAC, OGG | MP3 ✅ |

**Features:**
- ✅ Transcription with high accuracy
- ✅ Speaker diarization (identifies different speakers)
- ✅ Timestamps for topic changes
- ✅ Automatic formatting (paragraphs, punctuation)
- ✅ Multi-language support (99+ languages)

**API Endpoints:**

**(1) File Upload:**
```http
POST https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media
Authorization: Bearer YOUR_API_KEY
Content-Type: audio/mpeg

<binary audio data>
```

**Response:**
```json
{
  "file": {
    "name": "files/abc123xyz",
    "uri": "https://generativelanguage.googleapis.com/v1beta/files/abc123xyz",
    "mimeType": "audio/mpeg",
    "sizeBytes": "83886080",
    "state": "ACTIVE"
  }
}
```

**(2) Generate Content (Transcription):**
```http
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "contents": [{
    "parts": [
      {
        "fileData": {
          "mimeType": "audio/mpeg",
          "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/abc123xyz"
        }
      },
      {
        "text": "Transcribe this English class recording with speaker labels, timestamps, and proper formatting. Focus on educational content accuracy."
      }
    ]
  }],
  "generationConfig": {
    "temperature": 0.1,
    "maxOutputTokens": 32000
  }
}
```

**Response:**
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "[00:00:00] Teacher: Good morning class, today we'll discuss...\n\n[00:05:30] Student1: Can you explain the concept again?\n\n[00:05:45] Teacher: Sure, let me break it down..."
      }]
    }
  }]
}
```

### 2. n8n Binary Data Handling

Source: [n8n Docs - Scaling Binary Data](https://docs.n8n.io/hosting/scaling/binary-data/)

**Default Behavior:**
```
N8N_DEFAULT_BINARY_DATA_MODE=default
```
- Stores binary data in memory
- Fast for small files (<10MB)
- **CRASHES for large files (>50MB on basic VMs)**

**Filesystem Mode (REQUIRED for large files):**
```bash
N8N_DEFAULT_BINARY_DATA_MODE=filesystem
```
- Saves binary data to disk: `/home/user/.n8n/binaryData/`
- Streams through nodes without loading into memory
- Required for files >20MB

**How to Use in n8n Nodes:**

**HTTP Request - Download File:**
```json
{
  "url": "https://supabase.co/storage/.../audio.mp3",
  "responseFormat": "file",  // ← CRITICAL
  "binaryPropertyOutput": "audio_file"
}
```
This downloads the file and stores it as `audio_file` binary property.

**HTTP Request - Upload File:**
```json
{
  "method": "POST",
  "url": "https://generativelanguage.googleapis.com/.../files",
  "sendBinary": true,  // ← CRITICAL
  "binaryPropertyName": "audio_file"
}
```
This streams the `audio_file` binary data directly to Gemini API without loading into memory.

### 3. Working n8n Workflow Examples

Source: [n8n Workflows - Gemini Audio Transcription](https://n8n.io/workflows/3388-transcribe-audio-files-with-google-gemini-and-telegram/)

**Confirmed Working Patterns:**
- Telegram bot receives audio → Gemini transcribes → Returns text
- WhatsApp audio messages → Gemini API → Saves transcript
- Meeting recordings → Gemini + ElevenLabs → Analysis

**Key Learnings from Community:**
- Use `Binary Data: ON` when uploading to Gemini
- Convert audio to base64 only if API requires it (File API doesn't)
- Add 30-second delay between uploads to avoid rate limits

### 4. Gemini vs Competitors (2025 Benchmarks)

Source: [AssemblyAI Blog - Speech Recognition Comparison](https://www.assemblyai.com/blog/best-api-models-for-real-time-speech-recognition-and-transcription)

**Accuracy Rankings (2025):**
1. 🥇 OpenAI Whisper - Best for formatting, handles noise
2. 🥈 AssemblyAI - Best for speech understanding
3. 🥉 Gemini 2.5 Pro - Good accuracy, multimodal
4. 🏅 Gemini 2.0 Flash - Good accuracy, **fastest**
5. 📉 Google Cloud Speech-to-Text - **Worst accuracy** (not recommended)

**Important Distinction:**
- **Gemini API (AI Studio)** = New, FREE, good accuracy ✅
- **Google Cloud Speech-to-Text API** = Old, paid, poor accuracy ❌

You're using Gemini Studio manually, which uses **Gemini API** (the good one).

**Cost Comparison (90-minute audio):**

| Service | Cost per Transcription | Monthly (300 files) | Diarization |
|---------|----------------------|---------------------|-------------|
| **Gemini 2.0 Flash** | **₹0 (FREE)** | **₹0** | ✅ Yes |
| Gemini 2.5 Pro | ₹0 (FREE) | ₹0 | ✅ Yes |
| OpenAI Whisper | ₹45 | ₹13,500 | ❌ No |
| AssemblyAI | ₹68 | ₹20,400 | ✅ Yes |
| Google Cloud STT | ₹180-450 | ₹54k-135k | ⚠️ Paid extra |

**Winner:** Gemini (FREE + good accuracy + diarization)

### 5. Processing Time Estimates

**Gemini File API Processing:**
```
Upload 80MB file: 10-30 seconds (network speed)
Gemini transcription: 2-4 minutes (model processing)
Question generation: 30-60 seconds (existing workflow)
Database operations: 5-10 seconds

Total: 3-6 minutes (fully automated)
```

**vs Manual Gemini Studio:**
```
Upload: 30 seconds
Transcription: 2-3 minutes
Manual copy: 10 seconds
Paste to workflow: 20 seconds
Questions: 1 minute

Total: ~5 minutes (manual labor required)
```

**Automation Benefit:** Save 5 minutes × 300 recordings = **25 hours/month** of teacher time!

---

## 🏗️ Solution Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│  Teacher Dashboard (React)                                  │
│  - AudioUploadCard.jsx                                      │
│  - Upload audio to Supabase Storage                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 1. Upload complete
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  audioUploadService.js                                      │
│  - Insert record to audio_uploads table                     │
│  - Trigger n8n webhook with upload_id + file_url           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 2. POST webhook
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  n8n Workflow: Audio Transcription V1                       │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │ A. Update Status → "processing"                  │      │
│  └───────────────┬──────────────────────────────────┘      │
│                  │                                          │
│  ┌───────────────▼──────────────────────────────────┐      │
│  │ B. Respond to Webhook (async)                    │      │
│  │    Return: {success: true, message: "Processing"}│      │
│  └───────────────┬──────────────────────────────────┘      │
│                  │                                          │
│  ┌───────────────▼──────────────────────────────────┐      │
│  │ C. Download Audio from Supabase                  │      │
│  │    HTTP Request: file_url                        │      │
│  │    Response Format: File (binary streaming)      │      │
│  └───────────────┬──────────────────────────────────┘      │
│                  │                                          │
│  ┌───────────────▼──────────────────────────────────┐      │
│  │ D. Upload to Gemini File API                     │      │
│  │    POST /upload/v1beta/files                     │      │
│  │    Binary Data: ON                               │      │
│  │    Returns: {file.uri: "files/abc123"}           │      │
│  └───────────────┬──────────────────────────────────┘      │
│                  │                                          │
│  ┌───────────────▼──────────────────────────────────┐      │
│  │ E. Transcribe Audio                              │      │
│  │    Model: gemini-2.0-flash-001                   │      │
│  │    Prompt: "Transcribe with speaker labels..."   │      │
│  │    maxOutputTokens: 32000                        │      │
│  └───────────────┬──────────────────────────────────┘      │
│                  │                                          │
│  ┌───────────────▼──────────────────────────────────┐      │
│  │ F. Extract Transcript (Code node)                │      │
│  │    transcript = response.candidates[0]...        │      │
│  └───────────────┬──────────────────────────────────┘      │
│                  │                                          │
│  ┌───────────────▼──────────────────────────────────┐      │
│  │ G. Save Transcript (.txt file)                   │      │
│  │    - Option 1: Supabase Storage                  │      │
│  │    - Option 2: Database TEXT column              │      │
│  └───────────────┬──────────────────────────────────┘      │
│                  │                                          │
│  ┌───────────────▼──────────────────────────────────┐      │
│  │ H. [CONNECT TO EXISTING WORKFLOW]                │      │
│  │    → Build LLM2 Prompt (existing node)           │      │
│  │    → Basic LLM Chain 2 (question generation)     │      │
│  │    → Combine SRS + New Questions                 │      │
│  │    → Insert to quiz_questions                    │      │
│  └───────────────┬──────────────────────────────────┘      │
│                  │                                          │
│  ┌───────────────▼──────────────────────────────────┐      │
│  │ I. Update Status → "completed"                   │      │
│  │    UPDATE audio_uploads SET                      │      │
│  │      status = 'completed',                       │      │
│  │      transcript_file_id = ...,                   │      │
│  │      processed_at = NOW()                        │      │
│  └───────────────┬──────────────────────────────────┘      │
│                  │                                          │
│  ┌───────────────▼──────────────────────────────────┐      │
│  │ J. Delete Gemini File (cleanup)                  │      │
│  │    DELETE /v1beta/files/{file_id}                │      │
│  │    (Free 20GB storage, but clean up anyway)      │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  [ERROR HANDLER]                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ On Any Error:                                    │      │
│  │   - Update status = "failed"                     │      │
│  │   - Log error_message to audio_uploads           │      │
│  │   - Optional: Send notification to teacher       │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ 3. Questions ready
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Database: quiz_questions                                   │
│  - 30 questions inserted                                    │
│  - Ready for student quiz                                   │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Node Configurations

#### Node A: Update Status → "processing"

**Type:** Supabase Node (or HTTP Request)

**SQL Query:**
```sql
UPDATE audio_uploads
SET
  status = 'processing',
  processing_started_at = NOW()
WHERE id = '{{ $json.upload_id }}'
RETURNING *;
```

**Purpose:** Let frontend know processing has started (show spinner in UI)

---

#### Node B: Respond to Webhook (Async)

**Type:** Respond to Webhook Node

**Response:**
```json
{
  "success": true,
  "message": "Transcription started. This will take 3-6 minutes.",
  "upload_id": "{{ $json.upload_id }}"
}
```

**Purpose:** Return immediate response to prevent webhook timeout (30-60 sec limit)

---

#### Node C: Download Audio from Supabase

**Type:** HTTP Request Node

**Configuration:**
```json
{
  "method": "GET",
  "url": "{{ $json.file_url }}",
  "responseFormat": "file",  // ← CRITICAL: Stream to disk, not memory
  "binaryPropertyOutput": "audio_file"
}
```

**Example file_url:**
```
https://qhvxijsrtzpirjbuoicy.supabase.co/storage/v1/object/public/class-audio/e5dd424c-3bdb-4671-842c-a9c5b6c8495d/personal-20251204-1400-FLUENCE-CLASS6-2025-kavya.mp3
```

**Purpose:** Download 80MB file from Supabase Storage without loading into memory

---

#### Node D: Upload to Gemini File API

**Type:** HTTP Request Node

**Configuration:**
```json
{
  "method": "POST",
  "url": "https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key={{ $credentials.gemini_api_key }}",
  "authentication": "predefinedCredentialType",
  "sendBinary": true,  // ← CRITICAL: Stream binary data
  "binaryPropertyName": "audio_file",
  "options": {
    "timeout": 120000  // 2 minutes for 80MB upload
  },
  "headers": {
    "X-Goog-Upload-Protocol": "raw",
    "X-Goog-Upload-Command": "upload, finalize"
  }
}
```

**Alternative (using Authorization header):**
```json
{
  "headers": {
    "Authorization": "Bearer {{ $credentials.gemini_api_key }}",
    "Content-Type": "audio/mpeg"
  }
}
```

**Expected Response:**
```json
{
  "file": {
    "name": "files/abc123xyz",
    "displayName": "kavya-2025-12-04.mp3",
    "mimeType": "audio/mpeg",
    "sizeBytes": "83886080",
    "createTime": "2025-12-05T10:00:00.000Z",
    "updateTime": "2025-12-05T10:00:30.000Z",
    "expirationTime": "2025-12-07T10:00:00.000Z",
    "sha256Hash": "abc123...",
    "uri": "https://generativelanguage.googleapis.com/v1beta/files/abc123xyz",
    "state": "ACTIVE"
  }
}
```

**Purpose:** Upload audio to Gemini's servers, get file_uri for transcription

---

#### Node E: Transcribe Audio

**Type:** HTTP Request Node

**Configuration:**
```json
{
  "method": "POST",
  "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key={{ $credentials.gemini_api_key }}",
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "contents",
        "value": "={{ JSON.stringify([{\n  parts: [\n    {\n      fileData: {\n        mimeType: 'audio/mpeg',\n        fileUri: $('Upload to Gemini File API').first().json.file.uri\n      }\n    },\n    {\n      text: 'Transcribe this English class recording in detail.\\n\\nProvide:\\n1. Speaker labels (Teacher, Student1, Student2, etc.)\\n2. Timestamps at major topic changes (format: [HH:MM:SS])\\n3. Clear paragraph breaks for different concepts\\n4. Proper punctuation and grammar\\n5. Focus on educational content accuracy\\n\\nThis transcript will be used to generate quiz questions, so preserve all important facts, definitions, and explanations.'\n    }\n  ]\n}]) }}"
      },
      {
        "name": "generationConfig",
        "value": "={{ JSON.stringify({\n  temperature: 0.1,\n  maxOutputTokens: 32000,\n  topP: 0.95,\n  topK: 40\n}) }}"
      }
    ]
  },
  "options": {
    "timeout": 300000  // 5 minutes for transcription
  }
}
```

**Simplified Body (for reference):**
```json
{
  "contents": [{
    "parts": [
      {
        "fileData": {
          "mimeType": "audio/mpeg",
          "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/abc123xyz"
        }
      },
      {
        "text": "Transcribe this English class recording in detail.\n\nProvide:\n1. Speaker labels (Teacher, Student1, Student2, etc.)\n2. Timestamps at major topic changes (format: [HH:MM:SS])\n3. Clear paragraph breaks for different concepts\n4. Proper punctuation and grammar\n5. Focus on educational content accuracy\n\nThis transcript will be used to generate quiz questions, so preserve all important facts, definitions, and explanations."
      }
    ]
  }],
  "generationConfig": {
    "temperature": 0.1,
    "maxOutputTokens": 32000,
    "topP": 0.95,
    "topK": 40
  }
}
```

**Expected Response:**
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "[00:00:00] Teacher: Good morning class! Today we're going to learn about the past tense in English...\n\n[00:05:30] Student1: Ma'am, can you explain the difference between simple past and past continuous?\n\n[00:05:45] Teacher: Great question! The simple past tense is used for completed actions..."
      }],
      "role": "model"
    },
    "finishReason": "STOP",
    "safetyRatings": [...]
  }],
  "usageMetadata": {
    "promptTokenCount": 50000,
    "candidatesTokenCount": 25000,
    "totalTokenCount": 75000
  }
}
```

**Purpose:** Get high-quality transcript with speaker diarization and formatting

---

#### Node F: Extract Transcript (Code Node)

**Type:** Code Node (JavaScript)

**Code:**
```javascript
// Extract transcript from Gemini response
const response = $input.first().json;

// Get the transcript text
const transcript = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

if (!transcript) {
  throw new Error('[Extract Transcript] No transcript found in response');
}

console.log('[Extract Transcript] Length:', transcript.length, 'characters');

// Get metadata from webhook
const webhookData = $('Webhook').first().json;

return [{
  json: {
    transcript: transcript,
    upload_id: webhookData.upload_id,
    file_url: webhookData.file_url,
    metadata: webhookData.metadata,
    transcript_length: transcript.length,
    gemini_tokens: response.usageMetadata?.totalTokenCount || 0
  }
}];
```

**Purpose:** Parse JSON response and extract clean transcript text

---

#### Node G: Save Transcript (.txt file)

**Option 1: Save to Supabase Storage**

**Type:** HTTP Request Node

**Configuration:**
```json
{
  "method": "POST",
  "url": "https://qhvxijsrtzpirjbuoicy.supabase.co/storage/v1/object/class-transcripts/{{ $json.upload_id }}.txt",
  "sendBody": true,
  "bodyContentType": "raw",
  "rawBody": "={{ $json.transcript }}",
  "headers": {
    "Authorization": "Bearer {{ $credentials.supabase_anon_key }}",
    "Content-Type": "text/plain"
  }
}
```

**Option 2: Save to Database**

**Type:** Supabase Node

**SQL Query:**
```sql
UPDATE audio_uploads
SET
  transcript = $1,
  transcript_length = $2,
  gemini_tokens_used = $3
WHERE id = $4
RETURNING *;
```

**Parameters:**
```javascript
[
  $json.transcript,
  $json.transcript_length,
  $json.gemini_tokens,
  $json.upload_id
]
```

**Purpose:** Save transcript for future use (AI tutor, infographics, etc.)

---

#### Node H: Connect to Existing Workflow

**Integration Point:** After saving transcript, pass it to existing quiz generation workflow.

**Connection:**
```
Save Transcript
  ↓
Build LLM2 Prompt (existing node from Class Q & S Workflow V3)
  ↓
Basic LLM Chain 2 (question generation)
  ↓
Combine SRS + New Questions
  ↓
Insert to quiz_questions
```

**Data Format:**
```json
{
  "transcription": "{{ $json.transcript }}",
  "student_id": "{{ $json.metadata.student_id }}",
  "class_id": "{{ $json.metadata.class_id }}",
  "institution_id": "{{ $json.metadata.institution_id }}",
  "session_type": "{{ $json.metadata.session_type }}",
  "class_date": "{{ $json.metadata.class_date }}"
}
```

**Purpose:** Generate 30 questions from transcript (existing functionality)

---

#### Node I: Update Status → "completed"

**Type:** Supabase Node

**SQL Query:**
```sql
UPDATE audio_uploads
SET
  status = 'completed',
  processing_completed_at = NOW(),
  questions_generated = 30
WHERE id = '{{ $json.upload_id }}'
RETURNING *;
```

**Purpose:** Mark processing complete, show success message in UI

---

#### Node J: Delete Gemini File (Cleanup)

**Type:** HTTP Request Node

**Configuration:**
```json
{
  "method": "DELETE",
  "url": "https://generativelanguage.googleapis.com/v1beta/files/{{ $('Upload to Gemini File API').first().json.file.name }}?key={{ $credentials.gemini_api_key }}",
  "options": {
    "ignoreResponseCode": true  // Don't fail if file already deleted
  }
}
```

**Example URL:**
```
https://generativelanguage.googleapis.com/v1beta/files/files/abc123xyz?key=YOUR_API_KEY
```

**Purpose:** Clean up uploaded files (Gemini has 20GB free storage limit)

---

#### Error Handler Node

**Type:** Error Trigger Node

**Connected to:** All nodes in workflow

**Action:** Code Node

**Code:**
```javascript
const error = $input.first().json;
const webhookData = $('Webhook').first().json;

console.error('[Error Handler] Workflow failed:', error);

// Update audio_uploads to failed status
const updateQuery = `
  UPDATE audio_uploads
  SET
    status = 'failed',
    error_message = $1,
    processing_completed_at = NOW()
  WHERE id = $2
  RETURNING *;
`;

// Execute update via Supabase
// (Use HTTP Request or Supabase node here)

return [{
  json: {
    upload_id: webhookData.upload_id,
    status: 'failed',
    error: error.message || 'Unknown error'
  }
}];
```

**Purpose:** Graceful error handling, update UI to show failure

---

## 📦 Implementation Checklist

### Phase 1: Prerequisites (5 minutes)

- [ ] **SSH into GCP VM**
  ```bash
  ssh your-gcp-vm
  ```

- [ ] **Set n8n environment variable** (CRITICAL!)
  ```bash
  # Add to ~/.bashrc or n8n startup script
  export N8N_DEFAULT_BINARY_DATA_MODE=filesystem

  # Or add to systemd service file
  sudo nano /etc/systemd/system/n8n.service
  # Add: Environment="N8N_DEFAULT_BINARY_DATA_MODE=filesystem"
  ```

- [ ] **Restart n8n**
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

- [ ] **Get Gemini API key**
  1. Go to https://aistudio.google.com/apikey
  2. Click "Create API key in new project"
  3. Copy the API key (starts with `AIza...`)

- [ ] **Store API key in n8n**
  1. Open n8n: http://your-vm-ip:5678
  2. Go to Credentials → Add Credential
  3. Search "Google Gemini"
  4. Paste API key
  5. Save as "Gemini API - Transcription"

---

### Phase 2: Create n8n Workflow (2-3 hours)

- [ ] **Create new workflow**
  - Name: "Audio Transcription + Quiz Generation V1"
  - Description: "Automated transcription of class audio using Gemini API"

- [ ] **Add Node A: Webhook Trigger**
  - HTTP Method: POST
  - Path: `audio-transcription`
  - Full URL: `https://n8n.myworkflow.top/webhook/audio-transcription`

- [ ] **Add Node B: Update Status → "processing"**
  - Use Supabase node or HTTP Request
  - SQL: `UPDATE audio_uploads SET status = 'processing', processing_started_at = NOW() WHERE id = '{{ $json.upload_id }}'`

- [ ] **Add Node C: Respond to Webhook**
  - Type: Respond to Webhook
  - Response: `{success: true, message: "Processing started"}`

- [ ] **Add Node D: Download Audio**
  - Type: HTTP Request
  - URL: `{{ $json.file_url }}`
  - Response Format: **File** ← CRITICAL
  - Binary Property: `audio_file`

- [ ] **Add Node E: Upload to Gemini File API**
  - Type: HTTP Request
  - Method: POST
  - URL: `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key={{ $credentials.gemini_api_key }}`
  - Send Binary: **ON** ← CRITICAL
  - Binary Property: `audio_file`
  - Headers: `X-Goog-Upload-Protocol: raw`

- [ ] **Add Node F: Transcribe Audio**
  - Type: HTTP Request
  - Method: POST
  - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key={{ $credentials.gemini_api_key }}`
  - Body: JSON with fileUri + transcription prompt
  - Timeout: 300000ms (5 minutes)

- [ ] **Add Node G: Extract Transcript**
  - Type: Code Node
  - Language: JavaScript
  - Code: Extract `response.candidates[0].content.parts[0].text`

- [ ] **Add Node H: Save Transcript**
  - Option 1: Supabase Storage (create `class-transcripts` bucket)
  - Option 2: Database column (add `transcript` TEXT column to audio_uploads)

- [ ] **Add Node I: Connect to Existing Workflow**
  - Find "Build LLM2 Prompt" node from existing workflow
  - Connect after "Save Transcript"
  - Pass transcript as `transcription` variable

- [ ] **Add Node J: Update Status → "completed"**
  - SQL: `UPDATE audio_uploads SET status = 'completed', processing_completed_at = NOW() WHERE id = '{{ $json.upload_id }}'`

- [ ] **Add Node K: Delete Gemini File**
  - Type: HTTP Request
  - Method: DELETE
  - URL: `https://generativelanguage.googleapis.com/v1beta/files/{{ file_name }}`

- [ ] **Add Error Handler**
  - Type: Error Trigger
  - Connect to all nodes
  - Update status = 'failed' on error

- [ ] **Test workflow execution**
  - Click "Execute Workflow"
  - Send test webhook with sample upload_id

- [ ] **Export workflow JSON**
  - Save as `n8n-workflows/Audio-Transcription-V1.json`

---

### Phase 3: Frontend Integration (30 minutes)

- [ ] **Update audioUploadService.js**

  Add webhook trigger after successful upload:
  ```javascript
  // After line 93 (INSERT to audio_uploads)

  // Trigger n8n transcription workflow
  try {
    const n8nWebhookUrl = process.env.REACT_APP_N8N_AUDIO_TRANSCRIPTION_WEBHOOK ||
                          'https://n8n.myworkflow.top/webhook/audio-transcription';

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
      console.warn('[AudioUpload] Transcription webhook failed, but upload succeeded');
    }
  } catch (webhookError) {
    console.error('[AudioUpload] Failed to trigger transcription:', webhookError);
    // Don't fail the upload, just log the error
  }
  ```

- [ ] **Add .env variable**
  ```bash
  # .env
  REACT_APP_N8N_AUDIO_TRANSCRIPTION_WEBHOOK=https://n8n.myworkflow.top/webhook/audio-transcription
  ```

- [ ] **Update AudioUploadCard.jsx**

  Show processing status:
  ```javascript
  // After successful upload
  setUploadStatus('Upload complete! Transcription in progress...');

  // Poll for status updates every 10 seconds
  const pollInterval = setInterval(async () => {
    const { data } = await supabase
      .from('audio_uploads')
      .select('status')
      .eq('id', uploadId)
      .single();

    if (data?.status === 'completed') {
      setUploadStatus('✅ Transcription complete! Questions generated.');
      clearInterval(pollInterval);
    } else if (data?.status === 'failed') {
      setUploadStatus('❌ Transcription failed. Please try again.');
      clearInterval(pollInterval);
    }
  }, 10000);
  ```

- [ ] **Test frontend upload**
  - Upload small audio file (5 min)
  - Verify status updates in UI
  - Check questions generated in database

---

### Phase 4: Testing & Validation (1 hour)

- [ ] **Test 1: Small File (5 minutes, ~5MB)**
  - Expected time: <1 minute
  - Verify transcript quality
  - Verify 30 questions generated
  - Check for errors

- [ ] **Test 2: Full File (90 minutes, ~80MB)**
  - Expected time: 3-6 minutes
  - Monitor VM memory usage: `htop` (should stay <70%)
  - Verify transcript has speaker labels
  - Verify timestamps present
  - Verify 30 questions generated
  - Check question quality

- [ ] **Test 3: Error Handling**
  - Test with corrupted audio file
  - Test with invalid file URL
  - Test with network timeout
  - Verify status = 'failed' in database
  - Verify error message logged

- [ ] **Test 4: Rate Limiting**
  - Upload 3 files rapidly (within 1 minute)
  - Verify only 2 process (Gemini limit: 2 req/min)
  - Verify 3rd file queues or fails gracefully

- [ ] **Test 5: Concurrent Uploads**
  - Upload 2 files simultaneously
  - Verify both process correctly
  - Verify no database conflicts

---

### Phase 5: Production Deployment (30 minutes)

- [ ] **Update environment variables**
  ```bash
  # On GCP VM
  echo 'export N8N_DEFAULT_BINARY_DATA_MODE=filesystem' >> ~/.bashrc
  source ~/.bashrc
  ```

- [ ] **Create Supabase Storage bucket** (if using Option 1)
  ```sql
  -- Create class-transcripts bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('class-transcripts', 'class-transcripts', false);

  -- Add RLS policies
  CREATE POLICY "Teachers can read transcripts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'class-transcripts');
  ```

- [ ] **Add database column** (if using Option 2)
  ```sql
  ALTER TABLE audio_uploads
  ADD COLUMN transcript TEXT,
  ADD COLUMN transcript_length INTEGER,
  ADD COLUMN gemini_tokens_used INTEGER;
  ```

- [ ] **Document workflow**
  - Add comments to n8n nodes
  - Export JSON
  - Commit to git

- [ ] **Set up monitoring**
  - Add Sentry error tracking (optional)
  - Set up email notifications for failures (optional)

- [ ] **Train teacher**
  - Show how to upload audio
  - Show how to check processing status
  - Show how to download transcript
  - Show how to retry if failed

---

## 📊 Expected Results

### Performance Metrics

| Metric | Current (Manual) | After Automation | Improvement |
|--------|------------------|------------------|-------------|
| Time per transcription | 5 min (manual) | 3-6 min (auto) | +1 min slower, but **zero manual work** |
| Teacher time required | 5 min | 0 min | **100% time saved** |
| Cost per transcription | ₹0 | ₹0 | No change |
| Monthly cost (300 files) | ₹0 | ₹0 | No change |
| Transcript quality | Excellent | Same | No change |
| Speaker diarization | ✅ Yes | ✅ Yes | No change |
| Monthly teacher time saved | - | 25 hours | **Massive win!** |

### Success Criteria

✅ **Processing completes in <10 minutes** (target: 3-6 min)
✅ **Zero manual teacher intervention** (fully automated)
✅ **Transcript quality matches Gemini Studio** (same API)
✅ **30 questions generated automatically**
✅ **No VM crashes or memory errors**
✅ **Error rate <5%** (retry on transient errors)
✅ **Cost remains ₹0** (within Gemini free tier)

---

## 🚨 Potential Issues & Solutions

### Issue 1: "File too large" Error

**Symptom:** Gemini API returns 400 error: "File size exceeds limit"

**Cause:** Audio file >2GB (unlikely with 80MB files)

**Solution:**
```bash
# Compress audio to reduce size
ffmpeg -i input.mp3 -b:a 64k output.mp3
```

**Prevention:** Add file size check in frontend (reject >500MB)

---

### Issue 2: "Rate limit exceeded"

**Symptom:** Gemini API returns 429 error after 2 uploads

**Cause:** Free tier limit: 2 requests/minute

**Solution:** Add delay between uploads

**n8n Fix:**
```javascript
// Add "Wait" node after "Upload to Gemini File API"
// Duration: 30 seconds
// Only if multiple uploads in queue
```

**Frontend Fix:**
```javascript
// Queue uploads instead of parallel processing
const uploadQueue = [];
const processQueue = async () => {
  for (const upload of uploadQueue) {
    await processUpload(upload);
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30s delay
  }
};
```

---

### Issue 3: "Transcription incomplete"

**Symptom:** Transcript cuts off mid-sentence

**Cause:** `maxOutputTokens: 32000` limit reached (very long recordings)

**Solution:** Increase token limit or split audio

**n8n Fix:**
```json
{
  "generationConfig": {
    "maxOutputTokens": 65536  // Gemini 2.0 Flash max
  }
}
```

**Or split audio into chunks:**
```javascript
// For recordings >2 hours, split into 90-min chunks
const chunks = splitAudio(audioFile, 90 * 60); // 90 minutes
for (const chunk of chunks) {
  const transcript = await transcribeChunk(chunk);
  fullTranscript += transcript;
}
```

---

### Issue 4: "VM out of memory" (Despite filesystem mode)

**Symptom:** n8n still crashes with OOM error

**Cause:** Other processes consuming RAM, or filesystem mode not enabled

**Debug:**
```bash
# Check if filesystem mode is active
echo $N8N_DEFAULT_BINARY_DATA_MODE

# Check memory usage
free -h

# Check n8n logs
pm2 logs n8n
```

**Solution:**
```bash
# Ensure environment variable is set BEFORE n8n starts
# Add to systemd service file:
sudo nano /etc/systemd/system/n8n.service

# Add under [Service]:
Environment="N8N_DEFAULT_BINARY_DATA_MODE=filesystem"

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart n8n
```

---

### Issue 5: "Poor question quality"

**Symptom:** Generated questions are too easy or off-topic

**Cause:** Transcript doesn't preserve enough detail

**Solution:** Improve transcription prompt

**Better Prompt:**
```
Transcribe this class recording with maximum detail and accuracy.

CRITICAL REQUIREMENTS:
1. Preserve ALL technical terms, definitions, and explanations
2. Include ALL examples given by the teacher
3. Include ALL questions asked by students
4. Label speakers clearly (Teacher, Student1, Student2)
5. Add timestamps for major topic changes
6. Use clear paragraph breaks for different concepts
7. Correct grammar and punctuation, but preserve the teacher's wording

This transcript will be used to generate quiz questions, so focus on:
- Key concepts and definitions
- Examples and applications
- Common mistakes or misconceptions mentioned
- Important facts, dates, formulas, or rules

DO NOT:
- Summarize or condense content
- Skip over technical details
- Remove repetitions (students may need reinforcement)
```

---

### Issue 6: "Webhook timeout"

**Symptom:** Frontend shows "Request timeout" error

**Cause:** Webhook waiting for entire workflow to complete (5+ minutes)

**Solution:** Already implemented in Node C (Respond to Webhook immediately)

**Verify:**
```javascript
// Webhook should return within 2 seconds
// Processing happens async after response
```

---

## 🔮 Future Enhancements

### Phase 2: Advanced Features (Week 2-4)

- [ ] **Multi-language support**
  - Detect language automatically
  - Support Hindi, Tamil, etc.
  - Gemini supports 99+ languages

- [ ] **Improved speaker diarization**
  - Automatically detect student names from context
  - Replace "Student1" with actual name

- [ ] **Transcript editing**
  - Teacher can edit transcript before question generation
  - Add missing context or correct errors

- [ ] **Topic extraction**
  - Automatically extract main topics from transcript
  - Generate concept map
  - Use for SRS scheduling

- [ ] **AI Tutor generation**
  - Create chatbot that knows the exact class content
  - Students can ask questions about the lesson
  - Powered by transcript + RAG (Retrieval-Augmented Generation)

- [ ] **Infographic generation**
  - Use Gemini Vision to create visual summaries
  - Generate flowcharts, diagrams, mind maps
  - Save as PNG/PDF for sharing

- [ ] **Teacher feedback**
  - Analyze teaching quality
  - Suggest improvements (pacing, clarity, engagement)
  - Identify topics that confused students

- [ ] **Weekly summary reports**
  - Summarize week's lessons
  - Track concept coverage
  - Identify gaps in curriculum

### Phase 3: Advanced Optimizations (Month 2-3)

- [ ] **Parallel processing**
  - Split audio into chunks
  - Transcribe chunks in parallel
  - Combine results (faster for 3+ hour recordings)

- [ ] **Caching**
  - Cache similar transcripts (repeated lessons)
  - Reduce API calls by 30-50%

- [ ] **Quality scoring**
  - Automatically rate transcript quality
  - Flag low-quality transcripts for manual review

- [ ] **Cost optimization**
  - Monitor token usage
  - Switch between Flash/Pro based on accuracy needs
  - Alert if approaching free tier limit

---

## 📚 Additional Resources

### Official Documentation
- [Gemini API - Audio Understanding](https://ai.google.dev/gemini-api/docs/audio)
- [Gemini API - File Upload](https://ai.google.dev/gemini-api/docs/file-upload)
- [n8n - Binary Data Handling](https://docs.n8n.io/hosting/scaling/binary-data/)
- [n8n - Google Gemini Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.googlegemini/)

### Working Examples
- [n8n Workflow: Gemini Audio Transcription](https://n8n.io/workflows/3388-transcribe-audio-files-with-google-gemini-and-telegram/)
- [Tutorial: Transcribe Audio with Gemini](https://go9x.com/tutorials/automatically-transcribe-audio-files-with-gemini-n8n)
- [Gemini Audio Quickstart (Colab)](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Audio.ipynb)

### Community Discussions
- [n8n Community: WhatsApp Audio Transcription](https://community.n8n.io/t/transcribe-whatsapp-audio-message-using-google-gemini-api/95518)
- [n8n Community: Heavy Files Handling](https://community.n8n.io/t/can-i-work-with-heavy-files-in-n8n/128090)
- [n8n Community: Binary Data to Gemini](https://community.n8n.io/t/send-binary-not-base64-to-gemini-files-queue-mode/103494)

---

## 🎯 Next Steps

### Immediate Actions (Today)

1. ✅ **Read this document** (you're here!)
2. ⏭️ **Get Gemini API key** (5 min)
3. ⏭️ **Set n8n environment variable** (2 min)
4. ⏭️ **Restart n8n** (1 min)
5. ⏭️ **Test API with curl** (5 min)

### This Week (2-3 hours)

6. ⏭️ **Create n8n workflow** (1-2 hours)
7. ⏭️ **Update frontend** (30 min)
8. ⏭️ **Test with sample audio** (30 min)
9. ⏭️ **Deploy to production** (30 min)

### Next Week (Optional)

10. ⏭️ **Add transcript editing UI**
11. ⏭️ **Build AI tutor prototype**
12. ⏭️ **Generate infographics POC**

---

## ✅ Success Checklist

After implementation, verify:

- [ ] Audio uploads successfully to Supabase Storage
- [ ] n8n webhook receives upload notification within 2 seconds
- [ ] Status changes to "processing" in database
- [ ] Audio downloads from Supabase (check n8n logs)
- [ ] Audio uploads to Gemini File API (check n8n logs)
- [ ] Transcription completes in 3-6 minutes
- [ ] Transcript has speaker labels and timestamps
- [ ] Transcript saved to storage/database
- [ ] 30 questions generated automatically
- [ ] Questions inserted to quiz_questions table
- [ ] Status changes to "completed" in database
- [ ] Gemini file deleted (cleanup)
- [ ] Teacher sees success message in UI
- [ ] Student can take quiz with new questions
- [ ] VM memory usage <70% during processing
- [ ] No errors in n8n execution logs
- [ ] Teacher time saved: 5 minutes per recording

---

## 💡 Key Takeaways

1. **Use Gemini File API** (not inline data) for files >20MB
2. **Set `N8N_DEFAULT_BINARY_DATA_MODE=filesystem`** to avoid memory crashes
3. **Stream binary data** through n8n (don't load into memory)
4. **Return immediate webhook response** (async processing)
5. **Gemini 2.0 Flash is fast enough** (don't need 2.5 Pro for initial implementation)
6. **Free tier is generous** (1,500 requests/day = 1,500 recordings/day)
7. **Same quality as manual process** (using same Gemini API)
8. **This unlocks future features** (AI tutor, infographics, feedback)

---

## 🚀 Final Recommendation

**Status:** ✅ **READY TO IMPLEMENT**

**Confidence:** 95% (proven technology, clear path forward)

**Risk:** 🟢 Low (free tier, no code changes to existing quiz app)

**Impact:** 🌟🌟🌟🌟🌟 **Massive** (saves 25 hours/month, unlocks future features)

**Timeline:** 2-3 hours to implement, 30 minutes to test

---

**This is the most important feature you'll build this month.** Once automated transcription works, you can:
- Generate quizzes instantly (already working)
- Build AI tutors (future)
- Create infographics (future)
- Provide teacher feedback (future)
- Generate weekly reports (future)

All from the **same transcript**.

Let's build it! 🚀

---

**Document Version:** 1.0
**Last Updated:** December 5, 2025
**Author:** Claude Code
**Status:** Ready for Implementation
