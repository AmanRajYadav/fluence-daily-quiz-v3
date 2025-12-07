# Quick Start Guide - V3 Frontend Integration

## 🚀 Start Here (5 Minutes)

This guide gets you testing the V3 integration immediately.

---

## Step 1: Import N8N Workflow (2 minutes)

1. Open: https://n8n.myworkflow.top
2. Login
3. Click "Workflows" → "+ Add workflow" → "Import from File"
4. Select: `n8n-workflows/Class-Q-S-Workflow-V3.json`
5. Click "Import"
6. Toggle "Active" (top right)
7. ✅ Done! Webhook URL: `https://n8n.myworkflow.top/webhook/class-questions-v3`

---

## Step 2: Verify Database (30 seconds)

Open Supabase SQL Editor: https://qhvxijsrtzpirjbuoicy.supabase.co/project/_/sql

Run this query:
```sql
SELECT * FROM classes WHERE class_code IN ('FLNC-CLS6-ANAYA', 'FLNC-CLS6-KAVYA');
```

**If no results**, run:
```sql
INSERT INTO classes (id, institution_id, class_code, class_name, active) VALUES
('6ac05c62-da19-4c28-a09d-f6295c660ca2', 'e5dd424c-3bdb-4671-842c-a9c5b6c8495d', 'FLNC-CLS6-ANAYA', 'Anaya - English', true),
(gen_random_uuid(), 'e5dd424c-3bdb-4671-842c-a9c5b6c8495d', 'FLNC-CLS6-KAVYA', 'Kavya - Math', true);
```

---

## Step 3: Generate Questions (2 minutes)

### Option A: Using Postman (Recommended)

1. Open Postman
2. Create POST request
3. URL: `https://n8n.myworkflow.top/webhook/class-questions-v3`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):

**For Anaya:**
```json
{
  "transcription": "[Copy FULL text from test-transcripts/personal-20251028-0900-FLNC-CLS6-ANAYA-anaya.txt]",
  "metadata": {
    "filename": "personal-20251028-0900-FLNC-CLS6-ANAYA-anaya.txt"
  }
}
```

6. Click "Send"
7. Wait 20-30 seconds for Gemini to generate questions
8. Should return: `{ "success": true, "questions_inserted": 30 }`

### Option B: Using cURL (Command Line)

```bash
# Read transcript file
$transcription = Get-Content "test-transcripts\personal-20251028-0900-FLNC-CLS6-ANAYA-anaya.txt" -Raw

# Send to n8n (PowerShell)
$body = @{
  transcription = $transcription
  metadata = @{
    filename = "personal-20251028-0900-FLNC-CLS6-ANAYA-anaya.txt"
  }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://n8n.myworkflow.top/webhook/class-questions-v3" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

---

## Step 4: Verify Questions (30 seconds)

Run in Supabase SQL Editor:
```sql
SELECT COUNT(*), question_type FROM quiz_questions
WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f' AND active = true
GROUP BY question_type;
```

**Expected Result:**
```
count | question_type
------+--------------
  9   | mcq
  5   | true_false
  6   | short_answer
  6   | fill_blank
  4   | match
```

**Total:** 30 questions

---

## Step 5: Test Frontend (1 minute)

1. Start React app:
```bash
cd e:\fluence-quiz-v2
npm start
```

2. Open: http://localhost:3000

3. Login:
   - Class Code: `FLNC-CLS6-ANAYA`
   - Username: `anaya`
   - PIN: `1234`

4. Open DevTools (F12) → Console

5. Test loading questions:
```javascript
import('./services/quizService.js').then(m => {
  m.getActiveQuestions().then(q => {
    console.log('✅ Loaded:', q.length, 'questions');
    console.log('First question:', q[0]);
  });
});
```

**Expected Output:**
```
[getActiveQuestions] Fetching for: {user_id: "...", institution_id: "...", class_id: "..."}
[getActiveQuestions] Fetched 30 questions
✅ Loaded: 30 questions
First question: {
  id: "...",
  question_text: "What tense is used to describe habits and routines?",
  question_type: "mcq",
  ...
  institution_id: "e5dd424c-3bdb-4671-842c-a9c5b6c8495d",
  class_id: "6ac05c62-da19-4c28-a09d-f6295c660ca2",
  student_id: "edee9e5a-3bfd-4cc0-87b5-f2334101463f"
}
```

6. Test submission:
```javascript
import('./services/webhookService.js').then(m => {
  m.submitQuizResults({
    student_id: "edee9e5a-3bfd-4cc0-87b5-f2334101463f",
    score: 90,
    total_questions: 30,
    correct_answers: 27,
    time_taken_seconds: 900,
    answers: []
  }).then(r => console.log('✅ Submitted:', r));
});
```

**Expected Output:**
```
[webhookService] Submitting quiz results with V3 fields:
  - student_id: edee9e5a-3bfd-4cc0-87b5-f2334101463f
  - institution_id: e5dd424c-3bdb-4671-842c-a9c5b6c8495d
  - class_id: 6ac05c62-da19-4c28-a09d-f6295c660ca2
  - score: 90
  - total_questions: 30
[webhookService] Success response: {...}
✅ Submitted: { success: true, data: {...} }
```

---

## ✅ Success!

If all steps passed, V3 integration is working! 🎉

**What's Working:**
- ✅ N8N generates questions with V3 fields
- ✅ Frontend loads questions with V3 filters
- ✅ Frontend submits with V3 fields

**What's Next:**
- Integrate quiz UI (App.js) into AppV3.js StudentDashboard
- Display AI feedback on results screen
- Update leaderboard to weekly view

---

## 🐛 Troubleshooting

### "Class not found" error
→ Run Step 2 SQL insert query

### "Student not found" error
→ Check UUIDs in n8n workflow "Resolve Student ID" node

### Questions count is 0
→ Upload transcript again (Step 3)

### Session has no institution_id
→ Logout and login again

---

## 📚 Full Documentation

For detailed testing: `V3-INTEGRATION-TESTING-GUIDE.md`
For implementation details: `V3-IMPLEMENTATION-SUMMARY.md`

---

**Ready to Go!** 🚀

Now you can test the V3 integration end-to-end. For full quiz integration, follow the testing guide to connect App.js with AppV3.js.
