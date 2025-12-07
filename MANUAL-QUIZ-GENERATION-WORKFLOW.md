# Manual Quiz Generation Workflow (30 Questions)

**Version:** 2.0
**Last Updated:** 2025-10-05
**Purpose:** Manual process for generating and inserting 30 quiz questions before n8n automation

---

## 📋 Overview

This workflow allows you to:
1. Transcribe a class recording
2. Use AI (Gemini/Claude) to generate 30 questions
3. Manually insert questions into Supabase via SQL
4. Test the quiz in the app
5. Perfect the process before automating in n8n

**Question Distribution:**
- 9 MCQ (Multiple Choice - 4 options)
- 5 True/False
- 6 Short Answer (2-3 sentences)
- 6 Fill in the Blank
- 4 Match the Following
- **Total: 30 questions**

---

## 🎯 Step 1: Transcribe Class Recording

### Option A: Using Faster Whisper (Local)
```bash
# Run Fluence Processor.bat
# OR
# Use your existing transcription workflow
```

### Option B: Manual Upload to Google Gemini
1. Go to: https://aistudio.google.com/
2. Upload audio file directly
3. Gemini will transcribe automatically

**Output:** Class transcript text

---

## 🤖 Step 2: Generate Questions with AI

### Recommended: Use This Prompt with Gemini 2.5 Pro or Claude

Copy and paste this entire prompt:

```
You are an expert educational content creator specializing in personalized learning for 6th grade students.

CONTEXT:
- Student Name: [INSERT STUDENT NAME - e.g., Anaya]
- Subject: [INSERT SUBJECT - e.g., English Grammar]
- Grade: 6th
- Learning Style: Conversational, engaging, gamified

TASK:
Analyze the following class transcript and generate EXACTLY 30 quiz questions with the following distribution:
- 9 Multiple Choice Questions (MCQ) - 4 options each
- 5 True/False Questions
- 6 Short Answer Questions (expecting 2-3 sentence answers)
- 6 Fill in the Blank Questions
- 4 Match the Following Questions

STRICT REQUIREMENTS:
1. Generate EXACTLY 30 questions (no more, no less)
2. Questions MUST be based ONLY on content taught in the transcript
3. NEVER create questions about: class duration, points/rewards, exam marks, time limits, logistics, or meta-information
4. Each question must test understanding of concepts actually discussed
5. Mix difficulty levels:
   - 12 questions: Easy (basic concept understanding)
   - 12 questions: Medium (application and connections)
   - 6 questions: Hard (analysis and critical thinking)

QUESTION QUALITY GUIDELINES:
- Use student-friendly language
- Make questions engaging and relevant
- Avoid trick questions
- Ensure answers are clearly derivable from the transcript
- For MCQ: Include plausible distractors (common misconceptions)

OUTPUT FORMAT:
Return ONLY a valid JSON object (no markdown, no explanation) in this exact structure:

{
  "quiz_metadata": {
    "student_name": "[student name]",
    "subject": "[subject]",
    "topic": "[specific topic from class]",
    "total_questions": 30,
    "date_generated": "[today's date YYYY-MM-DD]"
  },
  "questions": [
    {
      "question_number": 1,
      "question_text": "[Question text]",
      "question_type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "concept_tested": "[Specific concept]",
      "difficulty": "easy",
      "explanation": "[Why this is the correct answer]"
    },
    {
      "question_number": 2,
      "question_text": "[Statement to evaluate]",
      "question_type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "concept_tested": "[Specific concept]",
      "difficulty": "medium",
      "explanation": "[Why this is true/false]"
    },
    {
      "question_number": 3,
      "question_text": "[Question requiring 2-3 sentences]",
      "question_type": "short_answer",
      "options": null,
      "correct_answer": "[Expected answer with key points]",
      "concept_tested": "[Specific concept]",
      "difficulty": "medium",
      "explanation": "[What key points should be covered]"
    },
    {
      "question_number": 4,
      "question_text": "Complete: The dog ___ over the fence.",
      "question_type": "fill_blank",
      "options": null,
      "correct_answer": "jumped",
      "concept_tested": "[Specific concept]",
      "difficulty": "easy",
      "explanation": "[Why this word fits]"
    },
    {
      "question_number": 5,
      "question_text": "Match the following:",
      "question_type": "match",
      "options": {
        "left": ["Item 1", "Item 2", "Item 3"],
        "right": ["Match A", "Match B", "Match C"]
      },
      "correct_answer": "{\"Item 1\":\"Match B\",\"Item 2\":\"Match C\",\"Item 3\":\"Match A\"}",
      "concept_tested": "[Specific concept]",
      "difficulty": "hard",
      "explanation": "[Why these pairs match]"
    }
  ]
}

IMPORTANT DISTRIBUTION CHECK:
Before finalizing, verify counts:
- MCQ (question_type: "mcq"): Exactly 9
- True/False (question_type: "true_false"): Exactly 5
- Short Answer (question_type: "short_answer"): Exactly 6
- Fill Blank (question_type: "fill_blank"): Exactly 6
- Match (question_type: "match"): Exactly 4
- TOTAL: Must equal 30

CLASS TRANSCRIPT:
[PASTE YOUR TRANSCRIPT HERE]
```

### Expected Output
A JSON object with 25 questions in the specified format.

**Save the JSON output to:** `E:\fluence-quiz-v2\manual-questions\questions-[student-name]-[date].json`

---

## 🗄️ Step 3: Prepare SQL Queries

### A. Get Student UUID

First, find the student's UUID from Supabase:

```sql
-- Run this in Supabase SQL Editor
SELECT id, name, display_name
FROM students
WHERE display_name = 'Anaya';  -- Replace with student name
```

**Copy the UUID** (e.g., `98825c00-fb8f-46dc-bec7-3cdd8880efea`)

---

### B. Mark Old Questions as Inactive

Before inserting new questions, deactivate old ones:

```sql
-- Mark all previous questions as inactive for this student
UPDATE quiz_questions
SET active = false
WHERE student_id = '98825c00-fb8f-46dc-bec7-3cdd8880efea'  -- Replace with actual UUID
  AND active = true;
```

**Expected Result:** `UPDATE X` (where X = number of previously active questions, likely 20 or 30)

---

### C. Insert New Questions

Now you need to convert the JSON to SQL INSERT statements. Here's a template:

#### For MCQ Questions:

```sql
INSERT INTO quiz_questions
  (student_id, question_text, question_type, options, correct_answer, concept_tested, difficulty, explanation, active, created_date)
VALUES
  (
    '98825c00-fb8f-46dc-bec7-3cdd8880efea',  -- student_id
    'What is the capital of India?',  -- question_text
    'mcq',  -- question_type
    '["New Delhi", "Mumbai", "Kolkata", "Chennai"]'::jsonb,  -- options (JSONB array)
    'New Delhi',  -- correct_answer
    'Indian Geography - Capitals',  -- concept_tested
    'easy',  -- difficulty
    'New Delhi is the national capital of India',  -- explanation
    true,  -- active
    CURRENT_DATE  -- created_date
  );
```

#### For True/False Questions:

```sql
INSERT INTO quiz_questions
  (student_id, question_text, question_type, options, correct_answer, concept_tested, difficulty, explanation, active, created_date)
VALUES
  (
    '98825c00-fb8f-46dc-bec7-3cdd8880efea',
    'The sun rises in the west.',
    'true_false',
    '["True", "False"]'::jsonb,
    'False',
    'Basic Science - Solar System',
    'easy',
    'The sun rises in the east, not west',
    true,
    CURRENT_DATE
  );
```

#### For Short Answer Questions:

```sql
INSERT INTO quiz_questions
  (student_id, question_text, question_type, options, correct_answer, concept_tested, difficulty, explanation, active, created_date)
VALUES
  (
    '98825c00-fb8f-46dc-bec7-3cdd8880efea',
    'Explain the water cycle in 2-3 sentences.',
    'short_answer',
    NULL,  -- No options for short answer
    'Water evaporates from bodies of water, forms clouds through condensation, and returns to Earth as precipitation. This continuous cycle is powered by the sun''s heat.',
    'Science - Water Cycle',
    'medium',
    'Should mention: evaporation, condensation, precipitation',
    true,
    CURRENT_DATE
  );
```

#### For Fill in the Blank Questions:

```sql
INSERT INTO quiz_questions
  (student_id, question_text, question_type, options, correct_answer, concept_tested, difficulty, explanation, active, created_date)
VALUES
  (
    '98825c00-fb8f-46dc-bec7-3cdd8880efea',
    'Complete: Mount Everest is ___ tallest mountain in the world.',
    'fill_blank',
    NULL,
    'the',
    'Grammar - Definite Articles with Superlatives',
    'easy',
    'Use "the" with superlatives (tallest, highest, best)',
    true,
    CURRENT_DATE
  );
```

#### For Match Questions:

```sql
INSERT INTO quiz_questions
  (student_id, question_text, question_type, options, correct_answer, concept_tested, difficulty, explanation, active, created_date)
VALUES
  (
    '98825c00-fb8f-46dc-bec7-3cdd8880efea',
    'Match the capitals to their countries:',
    'match',
    '{"left": ["India", "USA", "UK"], "right": ["Washington D.C.", "London", "New Delhi"]}'::jsonb,
    '{"India":"New Delhi","USA":"Washington D.C.","UK":"London"}',
    'Geography - World Capitals',
    'medium',
    'Each country has one capital city',
    true,
    CURRENT_DATE
  );
```

---

## 🔧 Step 4: Helper Script (Optional)

I can create a Node.js script to convert your JSON to SQL automatically. Would you like that?

For now, you can manually create SQL INSERT statements for all 25 questions.

**Pro Tip:** Use a batch INSERT for better performance:

```sql
INSERT INTO quiz_questions
  (student_id, question_text, question_type, options, correct_answer, concept_tested, difficulty, explanation, active, created_date)
VALUES
  ('uuid', 'Question 1...', 'mcq', '["A","B","C","D"]'::jsonb, 'A', 'Concept 1', 'easy', 'Explanation 1', true, CURRENT_DATE),
  ('uuid', 'Question 2...', 'true_false', '["True","False"]'::jsonb, 'True', 'Concept 2', 'easy', 'Explanation 2', true, CURRENT_DATE),
  ('uuid', 'Question 3...', 'short_answer', NULL, 'Answer 3', 'Concept 3', 'medium', 'Explanation 3', true, CURRENT_DATE);
  -- ... continue for all 30 questions
```

---

## ✅ Step 5: Verify in Supabase

After running the INSERT query:

### A. Check Question Count
```sql
SELECT COUNT(*) as active_questions
FROM quiz_questions
WHERE student_id = '98825c00-fb8f-46dc-bec7-3cdd8880efea'
  AND active = true;
```

**Expected:** `30`

### B. Verify Question Type Distribution
```sql
SELECT
  question_type,
  COUNT(*) as count
FROM quiz_questions
WHERE student_id = '98825c00-fb8f-46dc-bec7-3cdd8880efea'
  AND active = true
GROUP BY question_type
ORDER BY question_type;
```

**Expected Output:**
```
question_type    | count
-----------------|------
fill_blank       | 6
match            | 4
mcq              | 9
short_answer     | 6
true_false       | 5
```

### C. Check Sample Questions
```sql
SELECT
  question_number,
  question_type,
  LEFT(question_text, 50) as question_preview,
  concept_tested,
  difficulty
FROM quiz_questions
WHERE student_id = '98825c00-fb8f-46dc-bec7-3cdd8880efea'
  AND active = true
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎮 Step 6: Test in Quiz App

### A. Load Quiz
1. Open quiz app: http://localhost:3000
2. Enter student name (e.g., "Anaya")
3. Click "Start Quiz"

### B. Verify
- ✅ Exactly 30 questions load
- ✅ Question types match distribution (9 MCQ, 5 T/F, 6 Short, 6 Fill, 4 Match)
- ✅ All questions display correctly
- ✅ Timer, lives, power-ups work
- ✅ Answer validation works for each type
- ✅ Final submission succeeds

### C. Check Console
Look for:
```
[QuizService] Loading questions for student: [UUID]
[QuizService] Loaded 30 questions
[App] Questions loaded: 30 total
```

---

## 🔍 Step 7: Debug Common Issues

### Issue 1: Wrong Question Count
**Problem:** Only 20 questions load instead of 30

**Debug:**
```sql
SELECT COUNT(*), active FROM quiz_questions
WHERE student_id = '[UUID]'
GROUP BY active;
```

**Fix:** Ensure only 30 questions have `active = true`

---

### Issue 2: Match Question Options Format
**Problem:** Match questions not displaying correctly

**Debug:**
```sql
SELECT question_text, options, correct_answer
FROM quiz_questions
WHERE question_type = 'match' AND active = true;
```

**Fix:** Ensure `options` is valid JSONB:
```json
{
  "left": ["Item 1", "Item 2", "Item 3"],
  "right": ["Match A", "Match B", "Match C"]
}
```

And `correct_answer` is JSON string:
```
{"Item 1":"Match A","Item 2":"Match B","Item 3":"Match C"}
```

---

### Issue 3: Fill Blank Not Accepting Answer
**Problem:** Correct answer marked as wrong

**Debug:** Check answer trimming and case sensitivity

**Fix in SQL:**
```sql
-- Update to lowercase or trim whitespace
UPDATE quiz_questions
SET correct_answer = TRIM(LOWER(correct_answer))
WHERE question_type = 'fill_blank' AND active = true;
```

---

## 📊 Step 8: Collect Feedback

After testing the quiz:

### Questions to Answer:
- [ ] Did all 30 questions display?
- [ ] Were question types distributed correctly?
- [ ] Did students find questions appropriate difficulty?
- [ ] Were any questions confusing or unclear?
- [ ] Did all question types work correctly (MCQ, T/F, Short, Fill, Match)?
- [ ] Was the quiz too long/short? (target: 20-25 minutes)
- [ ] Any issues with answer validation?

### Document Learnings

Create file: `E:\fluence-quiz-v2\manual-questions\test-feedback-[date].md`

```markdown
# Quiz Test Feedback - [Date]

## Test Details
- Student: [name]
- Subject: [subject]
- Topic: [topic]
- Questions: 30
- Time Taken: [minutes]

## What Worked Well
- [List positive findings]

## Issues Found
- [List problems encountered]

## Improvements Needed
- [List changes to make]

## Ready for n8n Automation?
- [ ] Yes, process is stable
- [ ] No, needs more refinement

## Next Steps
- [Action items]
```

---

## 🚀 Step 9: Once Perfected → Automate in n8n

After you've tested and perfected the manual process:

1. Update n8n "Class Q & S Workflow"
2. Modify Gemini prompt to match your tested prompt
3. Add SQL query nodes to insert questions
4. Test n8n workflow end-to-end
5. Document in context1C.md as SOLVED entry

**Next File to Create:** `n8n-25-questions-workflow-upgrade.md` (when ready)

---

## 🛠️ Tools & Resources

### Recommended AI Platforms:
1. **Google AI Studio** (Gemini 2.5 Pro) - FREE
   - URL: https://aistudio.google.com/
   - Best for: Long transcripts, free tier generous

2. **Claude.ai** (Claude 3.5 Sonnet) - FREE (limited)
   - URL: https://claude.ai/
   - Best for: Better reasoning, may hit free tier limits

### SQL Editor:
- **Supabase SQL Editor**
  - URL: https://supabase.com/dashboard/project/wvzvfzjjiamjkibegvip/sql

### Quiz App:
- **Local Dev:** http://localhost:3000
- **Production:** [Your deployed URL]

---

## ✅ Success Checklist

Before moving to n8n automation:

- [ ] Generated 30 questions using AI prompt
- [ ] Verified question distribution (9+5+6+6+4 = 30)
- [ ] Converted JSON to SQL successfully
- [ ] Inserted questions into Supabase
- [ ] Verified 30 active questions in database
- [ ] Tested quiz in app (all 30 questions display)
- [ ] All question types work correctly
- [ ] Answer validation accurate for each type
- [ ] Quiz submission succeeds
- [ ] Leaderboard updates correctly
- [ ] Process documented with learnings
- [ ] Ready to replicate for future classes

---

**Last Updated:** 2025-10-05
**Status:** Ready for use
**Next:** Test with real class transcript → Document findings → Automate in n8n
