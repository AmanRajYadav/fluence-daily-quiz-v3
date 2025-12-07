# n8n Quiz Question Generation Workflow

**Purpose:** Automatically generate and insert 30 quiz questions from class transcripts into Supabase database.

**Status:** Ready to implement (replaces manual json-to-sql.js process)

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Webhook - Receive Transcript                            │
│    POST /webhook/process-class                             │
│    Body: {transcription: "...", metadata: {...}}           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Data Processing (Code Node)                             │
│    - Extract student name from filename (DD-MM-anaya)      │
│    - Map name → UUID (anaya → 98825c00-fb8f...)           │
│    - Prepare metadata                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Gemini API - Generate Questions                         │
│    Model: gemini-2.5-pro (FREE)                            │
│    Prompt: Generate 30 questions from transcript           │
│    Output: JSON with questions array                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Parse & Validate Questions (Code Node)                  │
│    - Parse Gemini JSON response                            │
│    - Validate required fields                               │
│    - Normalize question format                              │
│    - Output: Array of 30 validated questions               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Supabase HTTP - Deactivate Old Questions                │
│    Method: PATCH                                            │
│    URL: /rest/v1/quiz_questions?student_id=eq.UUID&active=eq.true
│    Body: {"active": false}                                  │
│    Result: Old questions marked inactive                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Loop Through Questions (Split In Batches)               │
│    Batch Size: 1 (process one question at a time)          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Supabase HTTP - Insert Question                         │
│    Method: POST                                             │
│    URL: /rest/v1/quiz_questions                            │
│    Headers:                                                 │
│      - apikey: {{SUPABASE_SERVICE_ROLE_KEY}}               │
│      - Authorization: Bearer {{SUPABASE_SERVICE_ROLE_KEY}} │
│      - Content-Type: application/json                       │
│      - Prefer: return=minimal                               │
│    Body: {student_id, question_text, options, ...}         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Success Response                                         │
│    Return: {success: true, questions_inserted: 30}          │
└─────────────────────────────────────────────────────────────┘
```

---

## Node Configurations

### Node 1: Webhook
- **Method:** POST
- **Path:** `/webhook/process-class`
- **Authentication:** None (or API key if needed)

### Node 2: Data Processing
- **Type:** Code (JavaScript)
- **Code:** See `n8n-nodes/data-processing-fixed.js`
- **Key Fix:** Maps student names to actual UUIDs (not 'student1', 'student2')

### Node 3: Gemini API
- **Type:** HTTP Request (or Google Gemini node if available)
- **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-latest:generateContent`
- **Headers:**
  - `x-goog-api-key: {{GEMINI_API_KEY}}`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "contents": [{
    "parts": [{
      "text": "{{YOUR_PROMPT_HERE}}\n\nTranscript:\n{{ $json.transcription }}"
    }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 8192
  }
}
```

**Prompt Template:**
```
You are generating 30 quiz questions for a 6th grade student named {{ $('Data Processing').item.json.student_name }}.

Based on this class transcript, generate EXACTLY 30 questions in the following format:

QUESTION TYPE DISTRIBUTION:
- 12 MCQ (Multiple Choice) - 4 options each
- 6 True/False
- 5 Short Answer (2-3 sentences expected)
- 3 Fill in the Blank
- 2 Match (pairs to match)
- 2 Voice Answer (oral explanation expected)

IMPORTANT RULES:
1. ONLY ask questions about concepts taught in the transcript
2. NEVER ask about: class duration, points, rewards, exam marks, or logistics
3. Each question must test understanding of specific concepts
4. Difficulty distribution: 40% easy, 40% medium, 20% hard

Return ONLY valid JSON in this exact format (no markdown, no explanation):

{
  "questions": [
    {
      "question": "Question text here",
      "correct": "Correct answer",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "questionType": "mcq",
      "topic": "Specific concept being tested",
      "difficulty": "easy",
      "explanation": "Why this is the correct answer"
    }
  ]
}

For non-MCQ questions, set "options" to null.
For Match questions, use this format:
"options": {"left": ["Item 1", "Item 2"], "right": ["Match A", "Match B"]}
```

### Node 4: Parse & Validate Questions
- **Type:** Code (JavaScript)
- **Code:** See `n8n-nodes/parse-validate-questions.js`
- **Output:** Array of 30 validated question objects

### Node 5: Supabase - Deactivate Old Questions
- **Type:** HTTP Request
- **Method:** PATCH
- **URL:** `https://wvzvfzjjiamjkibegvip.supabase.co/rest/v1/quiz_questions?student_id=eq.{{ $('Data Processing').item.json.student_id }}&active=eq.true`
- **Headers:**
```json
{
  "apikey": "{{SUPABASE_SERVICE_ROLE_KEY}}",
  "Authorization": "Bearer {{SUPABASE_SERVICE_ROLE_KEY}}",
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
}
```
- **Body:**
```json
{
  "active": false
}
```

### Node 6: Split In Batches
- **Type:** Split In Batches
- **Batch Size:** 1
- **Options:** Reset after each execution

### Node 7: Supabase - Insert Question
- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://wvzvfzjjiamjkibegvip.supabase.co/rest/v1/quiz_questions`
- **Headers:**
```json
{
  "apikey": "{{SUPABASE_SERVICE_ROLE_KEY}}",
  "Authorization": "Bearer {{SUPABASE_SERVICE_ROLE_KEY}}",
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
}
```
- **Body (Use n8n expressions):**
```json
{
  "student_id": "{{ $json.student_id }}",
  "question_text": "{{ $json.question_text }}",
  "question_type": "{{ $json.question_type }}",
  "options": {{ $json.options }},
  "correct_answer": "{{ $json.correct_answer }}",
  "concept_tested": "{{ $json.concept_tested }}",
  "difficulty": "{{ $json.difficulty }}",
  "explanation": "{{ $json.explanation }}",
  "active": true,
  "created_date": "{{ $json.created_date }}"
}
```

**CRITICAL:** For `options` field, use this expression to handle null and JSONB:
```
{{ $json.options ? JSON.stringify($json.options) : null }}
```

### Node 8: Success Response (Code Node)
```javascript
const questionsInserted = $input.all().length;
const studentName = $('Data Processing').item.json.student_name;

console.log('=== WORKFLOW COMPLETE ===');
console.log(`✅ Inserted ${questionsInserted} questions for ${studentName}`);

return [{
  json: {
    success: true,
    student_name: studentName,
    questions_inserted: questionsInserted,
    timestamp: new Date().toISOString()
  }
}];
```

---

## Advantages Over SQL String Approach

### ✅ Your Manual Process (json-to-sql.js)
- Generates SQL INSERT string
- Must handle quote escaping manually
- Risk of SQL injection if not careful
- Debugging = inspecting huge SQL string
- Single failure = entire batch fails

### ✅ HTTP API Approach (Recommended)
- No SQL string manipulation
- Supabase handles escaping automatically
- Zero SQL injection risk
- Debugging = inspect each question's response
- Individual failures = can retry specific questions
- Consistent with Quiz Results Handler pattern
- Uses same auth as existing workflow

---

## Testing Plan

### 1. Test with Sample Transcript (Local)
```bash
# Sample webhook payload
curl -X POST http://localhost:5678/webhook/process-class \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "transcription": "Today we learned about definite articles...",
      "metadata": {
        "student_name": "anaya",
        "filename": "13-01-anaya.txt",
        "processed_date": "2025-01-13"
      }
    }
  }'
```

### 2. Verify in Supabase
```sql
-- Check old questions deactivated
SELECT COUNT(*) FROM quiz_questions
WHERE student_id = '98825c00-fb8f-46dc-bec7-3cdd8880efea'
AND active = false;

-- Check new questions inserted
SELECT COUNT(*) FROM quiz_questions
WHERE student_id = '98825c00-fb8f-46dc-bec7-3cdd8880efea'
AND active = true;
-- Should be exactly 30

-- Check question types distribution
SELECT question_type, COUNT(*)
FROM quiz_questions
WHERE student_id = '98825c00-fb8f-46dc-bec7-3cdd8880efea'
AND active = true
GROUP BY question_type;
```

### 3. Test Quiz App
```bash
cd E:\fluence-quiz-v2
npm start
# Login as Anaya
# Verify 30 questions load
# Verify question types work
```

---

## Migration from Manual Process

**Before (Manual):**
1. Run Fluence Processor.bat
2. Copy generated JSON
3. Run `node scripts/json-to-sql.js manual-questions/questions.json`
4. Copy SQL output
5. Manually run in Supabase SQL editor

**After (Automated):**
1. Run Fluence Processor.bat
2. (Workflow handles everything else automatically)
3. Questions appear in database immediately

**Time Savings:** ~10 minutes per transcript → ~0 minutes

---

## Error Handling

Add error handling nodes after critical steps:

### After Gemini API:
- Check if response contains questions
- If empty, retry or alert user

### After Question Parsing:
- Validate question count (should be 30)
- Validate question types distribution
- If validation fails, send error notification

### After Supabase Operations:
- Check HTTP status codes
- Log any failures
- Send summary (30 inserted, 0 failed)

---

## Environment Variables Needed

Add to n8n credentials:
```
SUPABASE_URL=https://wvzvfzjjiamjkibegvip.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (full key)
GEMINI_API_KEY=AIzaSy... (from Google AI Studio)
```

---

## Next Steps

1. ✅ Fix Data Processing UUID mapping
2. ⏳ Set up Gemini API node with prompt
3. ⏳ Add Parse & Validate node
4. ⏳ Add Supabase deactivate node
5. ⏳ Add loop + insert nodes
6. ⏳ Test with sample transcript
7. ⏳ Verify in database
8. ⏳ Test with quiz app
9. ⏳ Deploy workflow

**Estimated Time:** 1-2 hours to set up, 30 minutes to test
