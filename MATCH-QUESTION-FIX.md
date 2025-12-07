# Fix Match Question Duplicate Bug

**Date:** 2025-10-15
**Bug:** Match questions with duplicate options in right column

---

## 🐛 PROBLEM

Match question has duplicate "Does" in the right column:
```
Left:  ["He", "They", "Kavya"]
Right: ["Does", "Do", "Does"]  ❌ DUPLICATE!
```

When user matches "He → Does", the other "Does" disappears because React component treats them as the same item.

---

## ✅ SOLUTION 1: Add Validation Node in n8n

**Step 1:** Add new code node after "Parse & Validate Questions"

**Node Name:** "Validate Match Questions"

**Code:** Use `n8n-nodes/validate-match-questions.js`

**What it does:**
- Detects duplicate values in match question right column
- Fixes them by adding index: "Does (1)", "Does (2)"
- Logs warnings for manual review

**Workflow Position:**
```
Gemini API
  ↓
Parse & Validate Questions
  ↓
Validate Match Questions  ← NEW NODE
  ↓
Loop (30x)
  ↓
Insert Question
```

---

## ✅ SOLUTION 2: Improve Gemini Prompt

Add to the Match question section of the Gemini prompt:

```markdown
**MATCH QUESTIONS - CRITICAL RULES:**
1. Left column must have UNIQUE items (no duplicates)
2. Right column must have UNIQUE items (no duplicates) ⚠️
3. Number of left items MUST EQUAL number of right items
4. Each left item has exactly ONE correct match on the right

**Example - CORRECT:**
{
  "left": ["He", "They", "I"],
  "right": ["Does", "Do", "Do"]  ✅ Correct: unique pairing
}

**Example - WRONG:**
{
  "left": ["He", "They", "Kavya"],
  "right": ["Does", "Do", "Does"]  ❌ WRONG: "Does" appears twice!
}

To avoid duplicates:
- Use different forms: "Does", "Do", "Did"
- Use different subjects: "He", "They", "We"
- Use different verbs: "is", "are", "was"
```

---

## ✅ SOLUTION 3: Frontend Validation (Quick Fix)

Update `MatchQuestion.jsx` to detect and handle duplicates:

```javascript
// In MatchQuestion.jsx - componentDidMount or useEffect

useEffect(() => {
  // Check for duplicates in right column
  const rightSet = new Set(options.right || []);

  if (rightSet.size !== options.right?.length) {
    console.error('❌ DUPLICATE DETECTED in match question options!');
    console.error('Question:', question.question_text);
    console.error('Right options:', options.right);

    // Alert user (dev mode only)
    if (process.env.NODE_ENV === 'development') {
      alert('Invalid match question: duplicate options detected. Please skip this question.');
    }
  }
}, [question, options]);
```

---

## 🔍 HOW TO FIND AFFECTED QUESTIONS

Run this query in Supabase to find match questions with potential duplicates:

```sql
SELECT
  id,
  student_id,
  question_text,
  options->'right' as right_options,
  created_at
FROM quiz_questions
WHERE question_type = 'match'
  AND active = true
ORDER BY created_at DESC;
```

Manually inspect the `right_options` column for duplicates.

---

## 🛠️ IMMEDIATE FIX (Manual)

**For the current question (Question 18):**

1. Find the question in Supabase:
```sql
SELECT id, question_text, options
FROM quiz_questions
WHERE question_text LIKE '%Match the pronoun or subject%'
  AND student_id = '1d7b1b8a-6f8f-419b-be99-18baeb1dd9f7'
  AND active = true;
```

2. Update the options:
```sql
UPDATE quiz_questions
SET options = '{
  "left": ["He", "They", "Kavya"],
  "right": ["Does", "Do", "Does (singular)"]
}'::jsonb
WHERE id = '[question_id_from_step_1]';
```

Or deactivate it:
```sql
UPDATE quiz_questions
SET active = false
WHERE id = '[question_id_from_step_1]';
```

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] Add "Validate Match Questions" node to n8n workflow
- [ ] Update Gemini prompt with duplicate prevention rules
- [ ] Add frontend validation in MatchQuestion.jsx (dev mode)
- [ ] Run query to find existing duplicates
- [ ] Fix or deactivate affected questions
- [ ] Test: Generate 30 questions and check for duplicates
- [ ] Monitor: Check logs after each generation

---

## 🎯 PREVENTION STRATEGY

**Layer 1: AI Prompt (Prevention)**
- Explicit rules against duplicates in Gemini prompt

**Layer 2: Backend Validation (Detection + Fix)**
- n8n node validates and fixes duplicates automatically

**Layer 3: Frontend Validation (User Warning)**
- Dev console warning if duplicate detected
- Graceful handling (skip question or show error)

**Layer 4: Manual Review**
- Periodic SQL queries to check for duplicates
- Teacher review queue before questions go live

---

**Priority:** HIGH - Blocks quiz completion
**Estimated Fix Time:** 30 minutes (add validation node)
**Long-term Solution:** All 4 layers implemented
