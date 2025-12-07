# Split In Batches - Testing Guide

## ✅ Implementation Complete

The workflow has been updated with the **Split In Batches** solution to process all 21 concepts in the Spaced Repetition System.

---

## 🔧 What Was Changed

### 1. Added Split In Batches Node
- **Location:** Between "Prepare Concept Updates" and "Get Existing Mastery"
- **Configuration:** `batch_size: 1` (process one concept at a time)
- **Purpose:** Forces per-item execution instead of batch processing

### 2. Updated Connections (Loop Structure)
```
Prepare Concept Updates (21 items)
  ↓
Split In Batches ← Loop entry point
  ↓
Get Existing Mastery (1 concept per loop)
  ↓
Calculate New Mastery (1 concept per loop)
  ↓
Upsert Concept Mastery (1 concept per loop)
  ↓
Back to Split In Batches → Next concept
  ↓ (after 21 loops)
Split In Batches (Done) → Merge node
```

### 3. Updated Calculate New Mastery Code
- Changed from: `$('Prepare Concept Updates').item.json`
- Changed to: `$('Split In Batches').item.json(0)`
- **Reason:** Now gets data from the batching node instead of the source

---

## 🧪 Testing Steps

### Step 1: Import Updated Workflow
1. Open n8n workflow editor
2. Import [Quiz-Results-Handler-v3.json](n8n-workflows/Quiz-Results-Handler-v3.json)
3. Ensure all credentials are connected:
   - Supabase API (SERVICE_ROLE_KEY)
   - PostgreSQL (Supabase connection)
   - Google Gemini API

### Step 2: Verify Split In Batches Node
1. Click on "Split In Batches" node
2. Verify settings:
   - **Batch Size:** `1`
   - **Mode:** Standard (not "Run Once for All Items")

### Step 3: Test Execution
1. Submit a quiz via frontend or Postman
2. Watch n8n execution log

**Expected Behavior:**
```
✅ Prepare Concept Updates: Outputs 21 items
✅ Split In Batches: Starts looping

  Loop 1/21:
  ✅ Get Existing Mastery: 1 item (Function of Fats)
  ✅ Calculate New Mastery: 1 item
  ✅ Upsert Concept Mastery: 1 item
  → Returns to Split In Batches

  Loop 2/21:
  ✅ Get Existing Mastery: 1 item (Food Groups)
  ✅ Calculate New Mastery: 1 item
  ✅ Upsert Concept Mastery: 1 item
  → Returns to Split In Batches

  ... (continues for all 21 concepts) ...

  Loop 21/21:
  ✅ Get Existing Mastery: 1 item (Application of Nutrient Sources)
  ✅ Calculate New Mastery: 1 item
  ✅ Upsert Concept Mastery: 1 item
  → Returns to Split In Batches

✅ Split In Batches: Done! Sends all to Merge
✅ Merge: Combines with Weekly Leaderboard
✅ Prepare Final Response: Returns to webhook
```

**Total Execution Time:** ~21-30 seconds (1-1.5s per concept)

### Step 4: Verify Database

Run this query in Supabase SQL Editor:

```sql
SELECT
  concept_name,
  mastery_score,
  times_practiced,
  times_correct,
  times_wrong,
  next_review_date,
  last_reviewed_date
FROM concept_mastery
WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
  AND last_reviewed_date = CURRENT_DATE
ORDER BY concept_name;
```

**Expected Result:** **21 rows** (one for each concept from the quiz)

**Example output:**
```
concept_name                    | mastery_score | times_practiced | times_correct | times_wrong | next_review_date
--------------------------------|---------------|-----------------|---------------|-------------|------------------
Application of Nutrient Sources | 15            | 1               | 1             | 0           | 2025-10-30
Balanced Diet Composition       | 0             | 2               | 0             | 2           | 2025-10-30
Components of Food              | 0             | 1               | 0             | 1           | 2025-10-30
Deficiency Diseases            | 15            | 1               | 1             | 0           | 2025-10-30
... (21 total rows)
```

### Step 5: Verify Feedback

Check the feedback table:

```sql
SELECT
  strengths,
  weaknesses,
  ai_insights
FROM feedback
WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```json
{
  "strengths": ["Deficiency Diseases", "Types of Carbohydrates", ...],
  "weaknesses": ["Function of Fats", "Food Groups", ...],
  "ai_insights": "Great job tackling the quiz!..."
}
```

**NOT:** `[null]` ✅

---

## 🎯 Success Criteria

### ✅ Workflow Execution
- [ ] Split In Batches loops **21 times**
- [ ] Each loop processes **1 concept**
- [ ] No errors in execution log
- [ ] Total time: 21-30 seconds

### ✅ Database Verification
- [ ] `concept_mastery` table has **21 new/updated rows**
- [ ] All concept names from quiz are present
- [ ] Mastery scores calculated correctly
- [ ] Next review dates set (based on SRS algorithm)

### ✅ Feedback Verification
- [ ] `feedback` table has new row
- [ ] `strengths` array populated (not `[null]`)
- [ ] `weaknesses` array populated (not `[null]`)
- [ ] `ai_insights` contains feedback text

---

## 🐛 Troubleshooting

### Problem: Still only 1 concept processed

**Check:**
1. Split In Batches node has `batch_size: 1`
2. Connection from "Upsert Concept Mastery" loops back to "Split In Batches"
3. "Calculate New Mastery" code uses `$('Split In Batches').item.json(0)`

### Problem: Workflow doesn't loop

**Check:**
1. Verify connections:
   - Upsert Concept Mastery → Split In Batches (creates loop)
   - Split In Batches has TWO outputs:
     - Output 1 (main) → Get Existing Mastery
     - Output 2 (done) → Merge

### Problem: Error in Calculate New Mastery

**Check:**
- Code should reference `$('Split In Batches').item.json(0)` not `$('Prepare Concept Updates')`
- If error persists, check n8n execution log for exact error message

### Problem: Database shows < 21 concepts

**Possible causes:**
1. Some concepts have empty `concept_name` (check webhook payload)
2. Loop exiting early (check n8n execution count)
3. Database constraints failing (check error log)

---

## 📊 Performance Notes

**Before (Broken):**
- Execution time: ~2 seconds
- Concepts processed: 1
- Database writes: 1

**After (Fixed with Split In Batches):**
- Execution time: ~21-30 seconds
- Concepts processed: 21 ✅
- Database writes: 21 ✅

**Trade-off:** Slower execution (21x more database calls) but **ALL concepts tracked correctly**

---

## 🎉 Expected Final Response

The webhook should return:

```json
{
  "success": true,
  "message": "Quiz submitted successfully! Check your feedback below.",
  "data": {
    "score": 16.67,
    "total_questions": 30,
    "correct_answers": 5,
    "total_points": 0,
    "weekly_rank": 1,
    "total_students": 1,
    "feedback": {
      "strengths": ["Deficiency Diseases", "Types of Carbohydrates"],
      "weaknesses": ["Function of Fats", "Food Groups", ...19 more],
      "ai_insights": "Great job on the quiz!...",
      "feedback_id": "..."
    }
  }
}
```

**Key indicators:**
- ✅ `strengths` is an array (not `[null]`)
- ✅ `weaknesses` is an array (not `[null]`)
- ✅ All 21 concepts tracked in database (verify separately)

---

## 📝 Summary

**What was the problem?**
- Only 1 out of 21 concepts was being tracked in the SRS system
- Supabase/PostgreSQL nodes were executing once for all items instead of once per item

**What's the solution?**
- Added **Split In Batches** node with `batch_size: 1`
- Created a loop: Process → Loop back → Next item
- Forces n8n to process each concept individually

**Why this approach?**
- ✅ **Secure:** Service key in n8n credentials (not in code)
- ✅ **Visual:** Easy to see loops in UI
- ✅ **Standard:** Official n8n pattern for this exact use case
- ✅ **Debuggable:** Can inspect each loop iteration

---

**Testing Status:** Ready for testing
**Documentation:** [N8N-QUIZ-WORKFLOW-FIXES-2025-10-29.md](N8N-QUIZ-WORKFLOW-FIXES-2025-10-29.md)
**Workflow File:** [Quiz-Results-Handler-v3.json](n8n-workflows/Quiz-Results-Handler-v3.json)
