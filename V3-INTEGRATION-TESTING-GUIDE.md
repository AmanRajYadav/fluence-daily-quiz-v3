# V3 Integration Testing Guide

## 📋 Overview

This guide provides step-by-step instructions for testing the complete V3 integration:
1. N8N Question Generation Workflow
2. Frontend Quiz Services (webhookService.js, quizService.js)
3. End-to-end quiz flow

---

## 🚀 Part 1: Import N8N Workflow

### Step 1.1: Open N8N
1. Go to https://n8n.myworkflow.top
2. Login to your n8n instance

### Step 1.2: Import Workflow
1. Click "Workflows" in left sidebar
2. Click "+ Add workflow" → "Import from File"
3. Select file: `n8n-workflows/Class-Q-S-Workflow-V3.json`
4. Click "Import"

### Step 1.3: Verify Gemini Credentials
1. Open the "Google Gemini Chat Model1" node
2. Check credentials are set correctly
3. If not, add your Google Gemini API key

### Step 1.4: Activate Workflow
1. Click the toggle at top to activate workflow
2. Copy the webhook URL (will look like: `https://n8n.myworkflow.top/webhook/class-questions-v3`)

---

## 🗄️ Part 2: Verify Database Setup

### Step 2.1: Check Class Records Exist

Open Supabase SQL Editor (https://qhvxijsrtzpirjbuoicy.supabase.co) and run:

```sql
-- Check if Anaya's class exists
SELECT * FROM classes WHERE class_code = 'FLNC-CLS6-ANAYA';

-- Check if Kavya's class exists
SELECT * FROM classes WHERE class_code = 'FLNC-CLS6-KAVYA';
```

**Expected Result:** Two rows returned with:
- `id`: Class UUID
- `class_code`: FLNC-CLS6-ANAYA / FLNC-CLS6-KAVYA
- `class_name`: Class name
- `institution_id`: e5dd424c-3bdb-4671-842c-a9c5b6c8495d (FLUENCE)
- `active`: true

### Step 2.2: If Classes Don't Exist, Create Them

```sql
-- Insert Anaya's class
INSERT INTO classes (id, institution_id, class_code, class_name, active)
VALUES (
  '6ac05c62-da19-4c28-a09d-f6295c660ca2', -- Use this specific ID or generate new
  'e5dd424c-3bdb-4671-842c-a9c5b6c8495d', -- FLUENCE institution
  'FLNC-CLS6-ANAYA',
  'Anaya - English (Personal Tutoring)',
  true
);

-- Insert Kavya's class
INSERT INTO classes (id, institution_id, class_code, class_name, active)
VALUES (
  gen_random_uuid(), -- Or use specific ID
  'e5dd424c-3bdb-4671-842c-a9c5b6c8495d', -- FLUENCE institution
  'FLNC-CLS6-KAVYA',
  'Kavya - Math (Personal Tutoring)',
  true
);
```

### Step 2.3: Verify Student Records

```sql
-- Check Anaya
SELECT id, username, full_name, institution_id FROM students WHERE username = 'anaya';

-- Check Kavya
SELECT id, username, full_name, institution_id FROM students WHERE username = 'kavya';
```

**Expected:**
- Anaya ID: `edee9e5a-3bfd-4cc0-87b5-f2334101463f`
- Kavya ID: `523ae5d3-4e6f-4bb3-b196-c87534a46c37`
- Both have `institution_id`: e5dd424c-3bdb-4671-842c-a9c5b6c8495d

---

## 📤 Part 3: Test Question Generation Workflow

### Test 3.1: Upload Anaya's Transcript

**Method 1: Using cURL (Command Line)**

```bash
curl -X POST https://n8n.myworkflow.top/webhook/class-questions-v3 \
  -H "Content-Type: application/json" \
  -d '{
    "transcription": "...paste transcript content here...",
    "metadata": {
      "filename": "personal-20251028-0900-FLNC-CLS6-ANAYA-anaya.txt"
    }
  }'
```

**Method 2: Using n8n Test Feature**

1. Open the workflow in n8n
2. Click "Execute Workflow" button
3. In the "Webhook" node, click "Listen for test event"
4. Use Postman or similar tool to send POST request to webhook URL with body:

```json
{
  "transcription": "[Paste content from test-transcripts/personal-20251028-0900-FLNC-CLS6-ANAYA-anaya.txt]",
  "metadata": {
    "filename": "personal-20251028-0900-FLNC-CLS6-ANAYA-anaya.txt"
  }
}
```

**Method 3: Using Postman**
1. Open Postman
2. Create new POST request
3. URL: `https://n8n.myworkflow.top/webhook/class-questions-v3`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "transcription": "[Copy full transcript text here]",
  "metadata": {
    "filename": "personal-20251028-0900-FLNC-CLS6-ANAYA-anaya.txt"
  }
}
```
6. Click "Send"

### Test 3.2: Verify Workflow Execution

**In N8N:**
1. Go to "Executions" tab
2. Check latest execution
3. Verify all nodes succeeded (green checkmarks)

**Expected Flow:**
1. ✅ **Webhook** → Receives data
2. ✅ **Data Processing V3** → Parses filename:
   - `institution_type`: "personal"
   - `class_code`: "FLNC-CLS6-ANAYA"
   - `username`: "anaya"
3. ✅ **Get Class Info** → Fetches class from database
4. ✅ **Resolve Student ID** → Maps "anaya" to UUID
5. ✅ **Deactivate Old Questions** → Sets old questions to `active=false`
6. ✅ **Gemini Generation** → Creates 30 questions
7. ✅ **Parse & Validate** → Validates and adds V3 fields
8. ✅ **Insert Questions** → Inserts 30 questions (loops 30 times)
9. ✅ **Success Response** → Returns success message

### Test 3.3: Verify Questions in Database

```sql
-- Check active questions for Anaya
SELECT COUNT(*), question_type, difficulty
FROM quiz_questions
WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
  AND active = true
GROUP BY question_type, difficulty;

-- View sample questions
SELECT id, question_text, question_type, concept_tested, active
FROM quiz_questions
WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
  AND active = true
LIMIT 5;
```

**Expected:**
- Total 30 questions with `active = true`
- All have `student_id` = Anaya UUID
- All have `institution_id` = FLUENCE UUID
- All have `class_id` = Anaya's class UUID
- Question types distributed: 9 MCQ, 5 T/F, 6 Short Answer, 6 Fill Blank, 4 Match
- Difficulty levels: 14 easy, 10 medium, 6 hard

### Test 3.4: Test Kavya's Transcript

Repeat Test 3.1-3.3 with:
- Filename: `personal-20251028-1430-FLNC-CLS6-KAVYA-kavya.txt`
- Student: Kavya
- UUID: `523ae5d3-4e6f-4bb3-b196-c87534a46c37`

---

## 💻 Part 4: Frontend Testing

### Test 4.1: Login as Anaya

1. Start React app:
```bash
cd e:\fluence-quiz-v2
npm start
```

2. Open browser: http://localhost:3000

3. Login:
   - **Class Code:** FLNC-CLS6-ANAYA
   - **Username:** anaya
   - **PIN:** 1234

4. Verify session in browser console:
```javascript
// Open DevTools (F12) → Console tab
JSON.parse(localStorage.getItem('fluence_session'))

// Expected output:
// {
//   user_id: "edee9e5a-3bfd-4cc0-87b5-f2334101463f",
//   username: "anaya",
//   full_name: "Anaya Singh",
//   institution_id: "e5dd424c-3bdb-4671-842c-a9c5b6c8495d",
//   class_id: "6ac05c62-da19-4c28-a09d-f6295c660ca2",
//   class_code: "FLNC-CLS6-ANAYA",
//   ...
// }
```

### Test 4.2: Load Quiz Questions

**Currently, the StudentDashboard in AppV3.js shows a placeholder.**

To test the quiz loading functionality:

1. Open browser DevTools → Console
2. Run this code to test `getActiveQuestions`:

```javascript
import('./services/quizService.js').then(module => {
  module.getActiveQuestions().then(questions => {
    console.log('Fetched questions:', questions.length);
    console.log('First question:', questions[0]);
  }).catch(err => {
    console.error('Error:', err);
  });
});
```

**Expected Console Output:**
```
[getActiveQuestions] Fetching for: {user_id: "...", institution_id: "...", class_id: "..."}
[getActiveQuestions] Fetched 30 questions
Fetched questions: 30
First question: {
  id: "...",
  question_text: "...",
  question_type: "mcq",
  options: [...],
  correct_answer: "...",
  institution_id: "e5dd424c-3bdb-4671-842c-a9c5b6c8495d",
  class_id: "6ac05c62-da19-4c28-a09d-f6295c660ca2",
  student_id: "edee9e5a-3bfd-4cc0-87b5-f2334101463f",
  active: true
}
```

### Test 4.3: Test Quiz Submission (Manual)

To test webhook submission:

```javascript
import('./services/webhookService.js').then(module => {
  const testData = {
    student_id: "edee9e5a-3bfd-4cc0-87b5-f2334101463f",
    score: 85,
    total_questions: 30,
    correct_answers: 27,
    time_taken_seconds: 900,
    answers: []
  };

  module.submitQuizResults(testData).then(result => {
    console.log('Submission result:', result);
  }).catch(err => {
    console.error('Submission error:', err);
  });
});
```

**Expected Console Output:**
```
[webhookService] Submitting quiz results with V3 fields:
  - student_id: edee9e5a-3bfd-4cc0-87b5-f2334101463f
  - institution_id: e5dd424c-3bdb-4671-842c-a9c5b6c8495d
  - class_id: 6ac05c62-da19-4c28-a09d-f6295c660ca2
  - score: 85
  - total_questions: 30
[webhookService] Success response: {...}
Submission result: { success: true, data: {...} }
```

**Verify in N8N:**
1. Check "Quiz Results Handler V3" workflow executions
2. Should show successful execution
3. Payload should include `institution_id` and `class_id`

**Verify in Database:**
```sql
-- Check quiz_results
SELECT * FROM quiz_results
WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
ORDER BY created_at DESC LIMIT 1;

-- Check weekly_leaderboard
SELECT * FROM weekly_leaderboard
WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
ORDER BY week_start_date DESC LIMIT 1;
```

---

## ⚠️ Known Limitations & Next Steps

### Current State:
✅ **Working:**
- N8N workflow V3 (question generation)
- webhookService.js (adds institution_id, class_id)
- quizService.js (V3 queries for personal/group)
- authService.js (session management)

⚠️ **Partially Working:**
- AppV3.js has StudentDashboard placeholder
- Actual quiz UI (App.js) not yet integrated with AppV3

❌ **TODO (Future Tasks):**
- Integrate App.js quiz component into AppV3 StudentDashboard
- Update App.js to use session instead of URL params
- Display AI feedback on results screen
- Update leaderboard to weekly view

### Integration Steps (For Future):

**To fully integrate the quiz:**

1. Update AppV3.js StudentDashboard:
```javascript
import App from './App';

const StudentDashboard = ({ session }) => {
  const [showQuiz, setShowQuiz] = useState(false);

  if (showQuiz) {
    return <App session={session} onBack={() => setShowQuiz(false)} />;
  }

  // ... existing dashboard UI ...
  <button onClick={() => setShowQuiz(true)}>
    Start Today's Quiz
  </button>
};
```

2. Update App.js to accept session prop:
```javascript
function App({ session, onBack }) {
  // Remove URL param loading
  // Use session.user_id instead of student.id
  // Pass onBack to results screen
}
```

---

## 🐛 Troubleshooting

### Issue: "Class not found"
**Cause:** Class record doesn't exist in database
**Fix:** Run SQL insert from Step 2.2

### Issue: "Student not found"
**Cause:** Username not in hardcoded mapping in workflow
**Fix:** Update "Resolve Student ID" node in n8n with correct UUIDs

### Issue: "No active questions found"
**Cause:** Questions not yet generated or all inactive
**Fix:** Upload transcript through n8n workflow (Part 3)

### Issue: "Webhook submission failed"
**Cause:** Wrong webhook URL or workflow not active
**Fix:**
1. Check `.env` has correct `REACT_APP_N8N_WEBHOOK_URL`
2. Verify workflow is activated in n8n

### Issue: "Session institution_id is null"
**Cause:** Student logged in before institution_id was added
**Fix:** Logout and login again to refresh session

---

## ✅ Success Criteria

### N8N Workflow:
- [x] Imports successfully
- [x] All nodes have green checkmarks after execution
- [x] 30 questions inserted to database
- [x] Questions have correct V3 fields (institution_id, class_id, student_id)

### Frontend:
- [x] Login works with V3 auth
- [x] Session has institution_id and class_id
- [x] getActiveQuestions fetches 30 questions
- [x] submitQuizResults sends institution_id and class_id

### End-to-End:
- [ ] Upload transcript → Questions generated → Questions visible in quiz
- [ ] Complete quiz → Submit → Data in quiz_results with V3 fields
- [ ] Weekly leaderboard updates

---

## 📞 Support

**If you encounter issues:**

1. Check n8n execution logs for errors
2. Check browser console for JavaScript errors
3. Check Supabase logs for database errors
4. Verify all UUIDs match between code and database

**Files to check:**
- `.env` → Webhook URL and Supabase credentials
- `n8n-workflows/Class-Q-S-Workflow-V3.json` → Workflow definition
- `src/services/webhookService.js` → Submission logic
- `src/services/quizService.js` → Query logic
- `src/services/authService.js` → Session management

---

**Last Updated:** 2025-10-28
**Version:** 3.0
**Status:** Phase 2 - Frontend Integration Complete (Services Layer)
**Next:** Full UI Integration (App.js → AppV3.js)
