# n8n Quiz Workflow Fixes - 2025-10-29

## Summary
Fixed critical bugs in [Quiz-Results-Handler-v3.json](n8n-workflows/Quiz-Results-Handler-v3.json) preventing proper feedback storage and concept mastery tracking.

---

## Bug #1: Feedback Arrays Showing `[null]` Instead of `[]`

### Problem
When a student had no strengths or weaknesses, the database stored `[null]` instead of an empty array `[]`.

**Example Output (BEFORE):**
```json
{
  "strengths": [null],
  "weaknesses": [null],
  "ai_insights": "Great job tackling the quiz!..."
}
```

**Expected Output (AFTER):**
```json
{
  "strengths": [],
  "weaknesses": ["Modal Verbs", "Conditional Sentences"],
  "ai_insights": "Great job tackling the quiz!..."
}
```

### Root Cause
In the **"Insert Feedback"** node SQL query (line 231), the ternary expression created `ARRAY[NULL]::text[]` when arrays were empty:

```sql
-- ❌ BUGGY CODE
ARRAY[{{ ... ? ... : 'NULL' }}]::text[]
```

When the condition was false, it evaluated to:
```sql
ARRAY[NULL]::text[]  -- Creates [null] instead of []
```

### Fix
Moved the `ARRAY[]::text[]` wrapper **inside** the ternary expression:

```sql
-- ✅ FIXED CODE
{{ ... ? `ARRAY[${...}]::text[]` : `ARRAY[]::text[]` }}
```

Now it produces:
- `ARRAY['Tenses', 'Grammar']::text[]` when strengths exist
- `ARRAY[]::text[]` when empty (correct!)

**File:** [n8n-workflows/Quiz-Results-Handler-v3.json:231](n8n-workflows/Quiz-Results-Handler-v3.json#L231)

---

## Bug #2: Concept Mastery Data Not Being Tracked (Field Name Mismatch)

### Problem
The **"Prepare Concept Updates"** and **"Analyze Answers (Feedback)"** nodes had hardcoded field names, but production and test data use DIFFERENT field names:

**Test Data (pinned in workflow):**
```json
{
  "question_id": "q2",
  "concept_tested": "Subject-Verb Agreement"  // ← Test format
}
```

**Production Data (actual quiz submissions):**
```json
{
  "question_id": "q2",
  "concept_name": "Function of Fats"  // ← Production format
}
```

**Code was looking for only ONE field:**
```javascript
const concept = answer.concept_name;  // ❌ Fails with test data
// OR
const concept = answer.concept_tested;  // ❌ Fails with production data
if (!concept) return; // Skipped ALL concepts when field didn't match
```

### Impact
- **Concept mastery updates were skipped** depending on data format
- **Feedback strengths/weaknesses were empty** when field name didn't match
- Students' progress wasn't being tracked in the SRS system
- No concept_mastery records were created/updated
- Empty arrays for strengths/weaknesses in feedback

### Fix
Support BOTH field names with fallback logic:

```javascript
// ✅ FIXED - Works with both formats
const concept = answer.concept_tested || answer.concept_name;
if (!concept) return; // Now correctly processes concepts from any source
```

**Files Changed:**
- [n8n-workflows/Quiz-Results-Handler-v3.json:84](n8n-workflows/Quiz-Results-Handler-v3.json#L84) - Prepare Concept Updates
- [n8n-workflows/Quiz-Results-Handler-v3.json:217](n8n-workflows/Quiz-Results-Handler-v3.json#L217) - Analyze Answers (Feedback)

---

## Testing Instructions

### 1. Re-import Workflow to n8n
1. Open n8n workflow editor
2. Import the fixed [Quiz-Results-Handler-v3.json](n8n-workflows/Quiz-Results-Handler-v3.json)
3. Ensure all credentials are connected
4. Activate the workflow

### 2. Submit Test Quiz
Use Postman or frontend to submit a quiz with the test payload.

**Expected Results:**

**✅ Feedback Table:**
```sql
SELECT strengths, weaknesses, ai_insights
FROM feedback
ORDER BY created_at DESC
LIMIT 1;
```

Should show:
```
strengths: ["Definite Articles", "Past Continuous Tense", ...]
weaknesses: ["Subject-Verb Agreement", "Modal Verbs", ...]
ai_insights: "Great job tackling the quiz!..."
```

**✅ Concept Mastery Table:**
```sql
SELECT concept_name, mastery_score, times_practiced, times_correct, times_wrong
FROM concept_mastery
WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
ORDER BY updated_at DESC;
```

Should show multiple rows (one per concept tested):
```
concept_name                | mastery_score | times_practiced | times_correct | times_wrong
----------------------------+---------------+----------------+--------------+-------------
Subject-Verb Agreement      | 40            | 2              | 1            | 1
Definite Articles          | 75            | 3              | 3            | 0
Modal Verbs                | 30            | 2              | 0            | 2
...
```

### 3. Verify Workflow Execution
1. Check n8n execution history
2. Verify all nodes show green (success)
3. **"Prepare Concept Updates"** node should output **10 items** (one per question/concept)
4. **"Calculate New Mastery"** node should process all concepts
5. **"Upsert Concept Mastery"** node should update database

---

## Files Changed

1. **[n8n-workflows/Quiz-Results-Handler-v3.json](n8n-workflows/Quiz-Results-Handler-v3.json)**
   - **Line 84** (Prepare Concept Updates): Changed to support both `concept_tested` and `concept_name`
   - **Line 95** (Split In Batches): 🔴 **CRITICAL** - Added Split In Batches node to force per-item processing
   - **Line 134** (Calculate New Mastery): Updated to get data from Split In Batches
   - **Line 217** (Analyze Answers): Changed to support both `concept_tested` and `concept_name`
   - **Line 231** (Insert Feedback): Fixed array insertion logic for strengths/weaknesses
   - **Line 616-677** (Connections): Updated to create loop: Prepare → Split → Get → Calculate → Upsert → Split (loop)

---

## Before vs After Comparison

### Database Results (Before Fix)
```sql
-- feedback table
strengths: [null]
weaknesses: [null]

-- concept_mastery table
(no records created - all skipped!)
```

### Database Results (After Fix)
```sql
-- feedback table
strengths: ["Definite Articles", "Past Continuous Tense", "Passive Voice", ...]
weaknesses: ["Subject-Verb Agreement", "Modal Verbs", "Conditional Sentences"]

-- concept_mastery table
10 concepts tracked with correct mastery scores
```

---

## Related Documentation

- **Main workflow:** [n8n-workflows/Quiz-Results-Handler-v3.json](n8n-workflows/Quiz-Results-Handler-v3.json)
- **Concept naming:** [CONCEPT-NAMING-STANDARDIZATION.md](CONCEPT-NAMING-STANDARDIZATION.md)
- **n8n best practices:** [N8N-BEST-PRACTICES.md](N8N-BEST-PRACTICES.md)
- **Database schema:** [roadmap-guide/DATABASE-SCHEMA-REFERENCE.md](roadmap-guide/DATABASE-SCHEMA-REFERENCE.md)

---

## Future Prevention

### Standard Field Names
**⚠️ IMPORTANT:** The workflow now supports BOTH field names to handle test and production data:

**In quiz submission (flexible):**
- ✅ `concept_tested` (preferred for new code)
- ✅ `concept_name` (legacy format, also supported)

**In database (concept_mastery table):**
- ✅ Use `concept_name` (normalized storage)

**Mapping happens in nodes with fallback:**
```javascript
// Support both formats
const concept = answer.concept_tested || answer.concept_name;
conceptUpdates[concept] = {
  concept_name: concept,  // Database field
  // ...
};
```

**Recommendation for Frontend:**
Going forward, standardize on `concept_tested` in quiz submissions, but the workflow will handle both.

### Code Review Checklist
- [ ] Verify field names match between frontend → workflow → database
- [ ] Test with empty arrays (strengths/weaknesses)
- [ ] Check workflow execution with 10+ concepts
- [ ] Verify database inserts/updates are working

---

---

## Bug #3: Spaced Repetition System Only Processing First Concept (CRITICAL!)

### Problem
The **"Get Existing Mastery"** node was using the **Supabase node** which only executed ONCE for all 21 input items, instead of executing 21 times (once per concept).

**Evidence from execution logs:**
- ✅ **Prepare Concept Updates**: Outputs 21 items (21 concepts)
- ❌ **Get Existing Mastery**: Outputs only 1 item ("Function of Fats")
- ❌ **Calculate New Mastery**: Processes only 1 concept
- ❌ **Upsert Concept Mastery**: Updates only 1 concept

**Error message in n8n:**
> "Limit of 1 items reached. There may be more items that aren't being returned."

### Impact
🔴 **CRITICAL:** 20 out of 21 concepts were NOT being tracked in the SRS system!

**Example from user's quiz:**
- Student answered 30 questions covering 21 different concepts
- Only "Function of Fats" was being tracked
- Remaining 20 concepts (Food Groups, Balanced Diet Composition, etc.) were completely ignored
- No mastery scores updated
- No next_review_date scheduled
- SRS algorithm NOT working for 95% of concepts!

### Root Cause
The Supabase node (`n8n-nodes-base.supabase`) treats the `limit: 1` parameter as a global limit across ALL input items, not per-item. This caused it to return only 1 result total instead of executing 21 separate queries.

**Supabase Node Behavior:**
```
Input: 21 items
Execute: 1 query with LIMIT 1
Output: 1 item (first match only)
```

**Expected Behavior:**
```
Input: 21 items
Execute: 21 queries (one per item)
Output: 21 items (one per concept)
```

### Fix ⭐ FINAL SOLUTION: Split In Batches

Added **Split In Batches node** to force per-item processing:

**Workflow Structure:**
```
Prepare Concept Updates (21 items)
  ↓
Split In Batches (batch_size: 1) ← Loop starts here
  ↓
Get Existing Mastery (HTTP Request) → Processes 1 concept
  ↓
Calculate New Mastery (Code)
  ↓
Upsert Concept Mastery (HTTP Request)
  ↓
Loop back to Split In Batches → Next concept
  ↓ (after all 21 loops)
Split In Batches (Done output) → Merge node
```

**Split In Batches Configuration:**
- **Batch Size:** `1` (process one concept at a time)
- **Output 1 (main):** Sends to Get Existing Mastery (for processing)
- **Output 2 (done):** Sends to Merge (when all 21 complete)

**Why This Works:**
- ✅ Forces **sequential per-item execution** (guaranteed by n8n)
- ✅ Loops 21 times (once per concept)
- ✅ No code dependencies (pg module not needed)
- ✅ Service key stored in n8n credentials (secure!)
- ✅ Visual workflow (easy to debug)
- ✅ Standard n8n pattern (proven approach)

**Nodes Added:**
- [n8n-workflows/Quiz-Results-Handler-v3.json:95](n8n-workflows/Quiz-Results-Handler-v3.json#L95) - Split In Batches node

**Nodes Modified:**
- [n8n-workflows/Quiz-Results-Handler-v3.json:134](n8n-workflows/Quiz-Results-Handler-v3.json#L134) - Calculate New Mastery (get data from Split In Batches)

**Connections Updated:**
- Prepare Concept Updates → **Split In Batches**
- Split In Batches (main) → Get Existing Mastery
- Upsert Concept Mastery → **Split In Batches** (loop back!)
- Split In Batches (done) → Merge

### Verification
After the fix, the workflow will loop 21 times:

**Loop Execution:**
- ✅ **Split In Batches**: Loops **21 times**
- ✅ **Get Existing Mastery**: Executes **21 times** (once per loop)
- ✅ **Calculate New Mastery**: Executes **21 times**
- ✅ **Upsert Concept Mastery**: Executes **21 times**

**Check n8n execution log:**
```
1. Prepare Concept Updates: 21 items ✅
2. Split In Batches: Loop 1/21 → Processing "Function of Fats"
3. Get Existing Mastery: 1 item
4. Calculate New Mastery: 1 item
5. Upsert Concept Mastery: 1 item
6. Split In Batches: Loop 2/21 → Processing "Food Groups"
   ... (loops 21 times) ...
21. Split In Batches: Loop 21/21 → Processing "Application of Nutrient Sources"
22. Split In Batches: DONE → Sends all 21 to Merge
```

**Visual Indicator in n8n:**
- You'll see the workflow execute **21 times** in a loop
- Each loop processes **1 concept**
- Total execution time: ~21-30 seconds (1-1.5s per concept)

**Check database:**
```sql
-- Should show 21 concept records for this student
SELECT concept_name, mastery_score, times_practiced
FROM concept_mastery
WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
  AND last_reviewed_date = '2025-10-29';
```

Expected: **21 rows** (one per concept from the quiz)

---

**Fixed by:** Claude Code
**Date:** 2025-10-29
**Status:** ✅ READY FOR TESTING

**CRITICAL BUGS FIXED:**
1. ✅ Feedback arrays showing `[null]` instead of `[]`
2. ✅ Field name mismatch (concept_tested vs concept_name)
3. ✅ **Spaced Repetition System only processing 1 concept instead of 21** (CRITICAL!)

**FINAL SOLUTION: Split In Batches**
- Added looping mechanism to process all 21 concepts
- Service key stays secure in n8n credentials
- Visual workflow with clear debugging
- Standard n8n pattern (proven & reliable)
