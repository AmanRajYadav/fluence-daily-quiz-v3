# Transcript Management UI

**Purpose:** Admin interface for viewing, filtering, and downloading audio transcripts.

**Access:** aman@fluence.ac only (admin user)

**Location:** Overview Tab (main admin dashboard)

---

## Requirements

### User Access
- **User:** `aman@fluence.ac` (admin email)
- **Permission:** View ALL transcripts across all institutions
- **Location:** Admin Overview Tab

### Data Display

**Show the following for each transcript:**

1. **Basic Info:**
   - Transcript filename (e.g., `personal-20251205-1400-FLUENCE-CLASS6-2025-anaya.txt`)
   - Upload date & time
   - Processing status (pending/processing/completed/failed)
   - Session type (personal/group)

2. **File Details:**
   - Audio file size (MB)
   - Transcript character count
   - Word count
   - Gemini tokens used

3. **Metadata:**
   - Institution name
   - Class code
   - Student name (for personal sessions)
   - Class date & time

4. **Actions:**
   - Download transcript (.txt file)
   - View transcript (modal/expandable)
   - Copy to clipboard
   - Delete transcript (with confirmation)

### Filtering & Search

**Filter By:**
- Date range (from/to)
- Institution
- Class code
- Student name
- Session type (personal/group)
- Processing status

**Search:**
- Full-text search in transcript content
- Search by filename
- Search by student name

**Sort By:**
- Date (newest/oldest)
- File size (largest/smallest)
- Character count
- Tokens used

### UI Design

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Transcript Management                                🔍 Search  │
├─────────────────────────────────────────────────────────────────┤
│  Filters: [Date Range] [Institution] [Class] [Student] [Type]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Filename                      Date       Size   Actions │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ personal-20251205-1400...     12/5/25   522 KB  [⬇][👁]│   │
│  │ FLUENCE-CLASS6-2025-anaya.txt 14:00     (2,329 tokens) │   │
│  │ Status: ✅ Completed          476 chars  [📋][🗑]       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ group-20251205-1030...        12/5/25   1.2 MB  [⬇][👁]│   │
│  │ FLUENCE-CLASS5-2025.txt       10:30     (8,451 tokens) │   │
│  │ Status: 🔄 Processing         2,134 ch  [📋][🗑]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Showing 1-10 of 45 transcripts              [◄] [1] [2] [►]   │
└─────────────────────────────────────────────────────────────────┘
```

**Key UI Elements:**
- **Table View:** Sortable columns
- **Status Badges:** Color-coded (green=completed, blue=processing, red=failed)
- **Download Button:** Downloads .txt file with same name as audio
- **View Button:** Opens modal with formatted transcript
- **Copy Button:** Copies transcript to clipboard
- **Delete Button:** Shows confirmation modal

### Data Source

**Supabase Table:** `audio_uploads`

**Query:**
```sql
SELECT
  id,
  file_name,
  file_url,
  file_size_mb,
  upload_date,
  class_time,
  session_type,
  processing_status,
  transcript,
  transcript_filename,
  transcript_length,
  gemini_tokens_used,
  institution_id,
  class_id,
  student_id,
  created_at,
  processed_at
FROM audio_uploads
WHERE processing_status = 'completed'
ORDER BY upload_date DESC, class_time DESC
```

**With JOINs for names:**
```sql
SELECT
  au.*,
  i.name as institution_name,
  c.class_name,
  c.class_code,
  s.name as student_name
FROM audio_uploads au
LEFT JOIN institutions i ON au.institution_id = i.id
LEFT JOIN classes c ON au.class_id = c.id
LEFT JOIN students s ON au.student_id = s.id
WHERE au.processing_status = 'completed'
ORDER BY au.upload_date DESC, au.class_time DESC
```

### Implementation Steps

1. **Create React Component:**
   - `src/components/Admin/TranscriptManagement.jsx`

2. **Create Service:**
   - `src/services/transcriptService.js`
   - Functions: `getAllTranscripts()`, `filterTranscripts()`, `downloadTranscript()`, `deleteTranscript()`

3. **Add to Admin Dashboard:**
   - Create "Transcripts" tab in admin overview
   - Only show if user email === 'aman@fluence.ac'

4. **Implement Filters:**
   - Date picker (react-datepicker)
   - Dropdown selects for institutions, classes
   - Search input with debounce

5. **Download Function:**
   ```javascript
   const downloadTranscript = (transcript, filename) => {
     const blob = new Blob([transcript], { type: 'text/plain' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename; // e.g., personal-20251205-1400-FLUENCE-CLASS6-2025-anaya.txt
     a.click();
     URL.revokeObjectURL(url);
   };
   ```

6. **View Modal:**
   - Show formatted transcript with speaker labels
   - Syntax highlighting for timestamps
   - Copy button

### Permissions

**RLS Policy (Supabase):**
```sql
-- Allow admin user to read all transcripts
CREATE POLICY "Admin can view all transcripts"
ON audio_uploads
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'aman@fluence.ac'
);
```

---

## Tech Stack

- **Framework:** React 19
- **Styling:** TailwindCSS
- **Table:** TanStack Table (React Table v8) - for sorting, filtering, pagination
- **Date Picker:** react-datepicker
- **Icons:** Lucide React
- **Download:** Browser File API

## Future Enhancements

- [ ] Bulk download (ZIP multiple transcripts)
- [ ] Export to CSV (metadata table)
- [ ] Analytics dashboard (total tokens used, average processing time)
- [ ] Transcript search (full-text search within content)
- [ ] Highlight search terms in transcript view
- [ ] Edit transcript (in case of errors)
- [ ] Re-process failed transcripts

---

**Created:** 2025-12-05
**Status:** Planning
**Priority:** High (needed for monitoring transcription quality)
