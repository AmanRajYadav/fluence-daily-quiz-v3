# Audio Upload Feature

**Feature**: Teacher Dashboard - Audio Recording Upload & Question Generation
**Status**: 📋 Documented - Ready for Implementation
**Priority**: High
**Estimated Time**: 1-2 hours

---

## 📋 Table of Contents
1. [Feature Overview](#feature-overview)
2. [User Workflow](#user-workflow)
3. [Technical Requirements](#technical-requirements)
4. [File Naming Convention](#file-naming-convention)
5. [Form Fields & Persistence](#form-fields--persistence)
6. [n8n Integration](#n8n-integration)
7. [Database Schema](#database-schema)
8. [UI/UX Design](#uiux-design)
9. [Implementation Notes](#implementation-notes)

---

## Feature Overview

Teachers record their class lessons and upload the audio files to generate quiz questions automatically.

### Purpose
- Automate question generation from class content
- Ensure questions are relevant to what was actually taught
- Save teachers time creating quizzes manually
- Generate exactly 30 questions per class session

### How It Works
1. Teacher records class audio
2. Teacher uploads audio file via Fluence platform
3. File is stored in cloud (S3 or Google Drive)
4. File URL is sent to n8n webhook
5. n8n transcribes audio → generates 30 questions
6. Questions appear in Question Editor for teacher review

---

## User Workflow

### Step 1: Record Class
- Teacher teaches class as normal
- Records audio on phone/computer
- Supported formats: MP3, WAV, M4A (common audio formats)

### Step 2: Fill Upload Form
**Location**: Teacher Dashboard → Overview Tab

Teacher provides:
1. **Class Type**: Group Class or Personal Tutoring
2. **Class**: Select from dropdown (e.g., "Class 6")
3. **Date**: Select date of class
4. **Time**: Select start time (24h format)
5. **Student Name**: (only if Personal Tutoring)
6. **Audio File**: Upload button

### Step 3: Upload & Process
- Click "Upload & Generate Questions"
- File uploads to cloud storage
- n8n workflow triggered automatically
- Teacher sees confirmation: "Audio uploaded successfully! Questions will be generated in 5-10 minutes."

### Step 4: Review Generated Questions
- Wait 5-10 minutes for processing
- Go to Questions tab
- Filter by class and recent date
- Review and edit the 30 generated questions

---

## Technical Requirements

### Cloud Storage Options

**Primary**: Google Drive (recommended for ₹0 cost)
- Google Drive API integration
- Store in institution-specific folder: `Fluence/[Institution Name]/Audio Recordings/`
- Get shareable link for n8n access

**Alternative**: AWS S3 (for scale)
- S3 bucket: `fluence-class-audio/[institution-id]/`
- Signed URLs for secure access
- Cost: ~₹100/month for 100GB

### File Processing
- Maximum file size: 500MB (~ 4 hours of audio)
- Automatic compression if needed
- Generate unique file ID for tracking

### n8n Workflow
- **Webhook**: `https://n8n.myworkflow.top/webhook/audio-to-questions`
- **Input**: Audio file URL + metadata (JSON)
- **Output**: 30 quiz questions inserted into `quiz_questions` table
- **Processing Time**: 5-10 minutes depending on audio length

---

## File Naming Convention

### Format
```
{type}-{YYYYMMDD}-{HHMM}-{CLASS_CODE}-{student_name}
```

### Components
- **type**: `group` or `personal`
- **YYYYMMDD**: Date in format 20251031 (Oct 31, 2025)
- **HHMM**: Time in 24h format 1400 (2:00 PM)
- **CLASS_CODE**: From database (e.g., FLUENCE-CLASS6-2025)
- **student_name**: Student username (only for personal, lowercase, no spaces)

### Examples

**Group Class**:
```
group-20251031-1400-FLUENCE-CLASS6-2025.mp3
```

**Personal Tutoring**:
```
personal-20251031-1400-FLUENCE-CLASS6-2025-anaya.mp3
```

### Why This Format?
- **Sortable**: Files sort chronologically
- **Searchable**: Easy to find specific class/student
- **Unique**: No conflicts or duplicates
- **Parseable**: Can extract metadata from filename

---

## Form Fields & Persistence

### Form State (Persisted in localStorage)

```javascript
{
  classType: 'group',  // or 'personal'
  selectedClassId: 'uuid-class-6',
  selectedDate: '2025-10-31',
  selectedTime: '14:00',
  selectedStudentId: null  // or 'uuid-anaya' for personal
}
```

### Persistence Logic
- Save form state to `localStorage` after every change
- Load from `localStorage` on component mount
- Clear localStorage only when user clicks "Clear Form" button

```javascript
// Save
localStorage.setItem('audioUploadForm', JSON.stringify(formData));

// Load
const saved = localStorage.getItem('audioUploadForm');
if (saved) {
  setFormData(JSON.parse(saved));
}
```

### Why Persistence?
- Teachers often upload multiple recordings in one session
- Same class, different dates
- Reduces repetitive form filling

### Editable Fields
- Add "Edit" button next to each field
- Click to unlock field for editing
- Save to localStorage on change

---

## n8n Integration

### Workflow: `Class Q & S V3.json`

**Location**: `E:\fluence-quiz-v2\n8n-workflows\Class Q & S V3.json`

### Process Flow

```
1. Webhook receives:
   {
     "audio_url": "https://drive.google.com/file/...",
     "institution_id": "uuid",
     "class_id": "uuid",
     "student_id": "uuid" or null,
     "class_type": "group" or "personal",
     "class_date": "2025-10-31",
     "class_time": "14:00",
     "uploaded_by": "teacher_uuid"
   }

2. Download audio from URL

3. Transcribe with Gemini 2.0 Flash (Free!)
   - Supports 1-hour audio max
   - Fast (~2 minutes for 30-min audio)
   - Free tier: 1500 requests/day

4. Extract key concepts from transcript
   - Identify main topics taught
   - Detect difficulty level

5. Generate 30 questions with Gemini 2.5 Pro
   - Types: 50% MCQ, 20% True/False, 15% Fill Blank, 10% Match, 5% Short Answer
   - Difficulty: 40% Easy, 40% Medium, 20% Hard
   - JSON format with validation

6. Insert into quiz_questions table
   - Batch insert all 30 questions
   - Set active=true by default
   - Set edited_by=null (AI-generated)
   - Set created_by=teacher_uuid

7. Send confirmation email/notification (optional)
```

### Webhook Payload

```json
{
  "audio_url": "https://drive.google.com/file/d/xxx/view",
  "metadata": {
    "institution_id": "e5dd424c-3bdb-4671-842c-a9c5b6c8495d",
    "class_id": "6ac05c62-da19-4c28-a09d-f6295c660ca2",
    "student_id": "edee9e5a-3bfd-4cc0-87b5-f2334101463f",
    "class_type": "personal",
    "class_date": "2025-10-31",
    "class_time": "14:00",
    "uploaded_by": "teacher-uuid-here",
    "file_name": "personal-20251031-1400-FLUENCE-CLASS6-2025-anaya.mp3"
  }
}
```

---

## Database Schema

### New Table: `audio_uploads` (Optional Tracking)

```sql
CREATE TABLE audio_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  student_id UUID REFERENCES students(id),  -- NULL for group
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_mb DECIMAL,
  upload_date DATE NOT NULL,
  class_time TIME NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES teachers(id),
  processing_status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  questions_generated INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  error_message TEXT
);

-- Index for teacher dashboard
CREATE INDEX idx_audio_uploads_teacher ON audio_uploads(uploaded_by, created_at DESC);
```

### Processing Status
- `pending`: Uploaded, waiting for n8n
- `processing`: n8n is transcribing/generating
- `completed`: 30 questions created successfully
- `failed`: Error occurred (logged in error_message)

### Integration with Existing Tables
- Questions insert into `quiz_questions` table (existing)
- Link via `class_id` and `student_id`
- Set `created_at` to audio upload date

---

## UI/UX Design

### Location
**Teacher Dashboard → Overview Tab**

### Layout

```
┌─────────────────────────────────────────────────────┐
│  📊 Overview                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Recent Activity...                                │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │ 🎙️ Upload Class Recording                  │   │
│  │                                             │   │
│  │ Class Type: ⚪ Group  ⚪ Personal           │   │
│  │                                             │   │
│  │ Class: [Class 6 ▼]                         │   │
│  │                                             │   │
│  │ Date: [Oct 31, 2025 📅]                    │   │
│  │                                             │   │
│  │ Time: [14:00 🕐]                            │   │
│  │                                             │   │
│  │ Student: [Anaya ▼] (if personal)           │   │
│  │                                             │   │
│  │ Audio File: [Choose File...] [Browse]     │   │
│  │                                             │   │
│  │ [Clear Form] [Upload & Generate Questions] │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  Recent Uploads:                                    │
│  ✅ Oct 30, 2025 - Class 7 (30 questions)         │
│  ⏳ Oct 29, 2025 - Class 6 - Anaya (Processing...) │
│  ❌ Oct 28, 2025 - Class 8 (Failed - see error)    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component Structure

```jsx
<OverviewTab>
  <StatsCards /> {/* Existing */}
  <AudioUploadCard>
    <ClassTypeToggle />
    <ClassSelector />
    <DatePicker />
    <TimePicker />
    <StudentSelector /> {/* Conditional */}
    <AudioFileUpload />
    <ActionButtons />
  </AudioUploadCard>
  <RecentUploadsTable />
</OverviewTab>
```

### User Feedback

**Upload Progress:**
```
Uploading... ▓▓▓▓▓▓▓░░░ 70%
```

**Success:**
```
✅ Audio uploaded successfully!
   Questions will be generated in 5-10 minutes.
   You can review them in the Questions tab.
```

**Error:**
```
❌ Upload failed: File size too large (max 500MB)
   Please compress your audio file and try again.
```

---

## Implementation Notes

### Frontend Components to Create

1. **`src/components/Teacher/AudioUploadCard.jsx`**
   - Upload form UI
   - File validation
   - Cloud upload logic
   - n8n webhook trigger

2. **`src/components/Teacher/RecentUploadsTable.jsx`**
   - List of recent uploads
   - Processing status indicators
   - Error messages display

3. **`src/services/audioUploadService.js`**
   - `uploadToCloudStorage(file, metadata)`
   - `triggerN8nWorkflow(audioUrl, metadata)`
   - `getRecentUploads(teacherId)`
   - `getUploadStatus(uploadId)`

### Libraries Needed

```bash
npm install react-dropzone  # File upload UI
npm install date-fns        # Date formatting
```

### Environment Variables

```bash
# .env
REACT_APP_GOOGLE_DRIVE_API_KEY=xxx
REACT_APP_GOOGLE_DRIVE_FOLDER_ID=xxx
REACT_APP_N8N_AUDIO_WEBHOOK=https://n8n.myworkflow.top/webhook/audio-to-questions
```

### Security Considerations

- Validate file type (only audio files)
- Check file size (max 500MB)
- Sanitize file names
- Use signed URLs for cloud storage
- Never expose cloud API keys in frontend

### Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| File too large | "File exceeds 500MB limit" | Prompt to compress |
| Invalid format | "Only audio files allowed" | Show supported formats |
| Upload failed | "Network error, try again" | Retry button |
| n8n timeout | "Processing delayed, check later" | Show in Recent Uploads |
| No questions generated | "Failed to generate questions" | Show error log, allow re-process |

---

## Testing Checklist

### Manual Testing

- [ ] Upload group class audio
- [ ] Upload personal class audio
- [ ] Form persistence (refresh page, data remains)
- [ ] Edit persisted fields
- [ ] Clear form button
- [ ] File validation (size, type)
- [ ] Upload progress indicator
- [ ] Success message
- [ ] Error handling
- [ ] Recent uploads list updates
- [ ] Processing status changes (pending → processing → completed)
- [ ] View generated questions in Questions tab

### Edge Cases

- [ ] Upload same class twice (different dates)
- [ ] Upload while processing previous
- [ ] Cancel upload mid-way
- [ ] Network error during upload
- [ ] n8n webhook timeout
- [ ] Invalid audio file (corrupted)
- [ ] Very short audio (< 5 minutes)
- [ ] Very long audio (> 2 hours)

---

## Cost Analysis

### Google Drive (Recommended)
- Storage: FREE (15GB per Google account)
- API calls: FREE (10M requests/day)
- Transcription: FREE (Gemini 2.0 Flash)
- Question generation: FREE (Gemini 2.5 Pro free tier)

**Total**: ₹0/month for 0-100 classes

### AWS S3 (Alternative)
- Storage: ₹1.5/GB/month
- Bandwidth: ₹7/GB download
- API calls: ~₹0.04/1000 requests

**Estimated**: ₹100-300/month for 100 classes

### Recommendation
Start with Google Drive, migrate to S3 if:
- Storage exceeds 15GB
- Need faster access speeds
- Enterprise security requirements

---

## Future Enhancements

- **Batch upload**: Multiple audio files at once
- **Audio player**: Preview uploaded audio
- **Transcript view**: See generated transcript before questions
- **Question preview**: Preview generated questions before activating
- **Re-generate**: Regenerate questions if unsatisfied
- **Custom prompts**: Teacher can guide question generation ("Focus on Chapter 3")
- **Multi-language**: Support Hindi, Tamil, etc. audio

---

**Documentation by**: Claude Code
**Last Updated**: November 18, 2025
