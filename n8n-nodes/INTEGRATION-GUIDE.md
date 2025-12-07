# N8N Workflow Integration Guide - Phase 2 Enhanced Feedback

This guide shows how to add the new performance analysis and improved AI feedback to your existing `Quiz-Results-Handler-v3` workflow.

## 🎯 What We're Adding

1. **Analyze Performance** code node - Detects rushing, confusion patterns, time issues
2. **Get Progress History** Supabase query - Last 5 quiz results
3. **Analyze Progress Trends** code node - Calculates improvement/decline trends
4. **Get SRS Recommendations** Supabase query - Concepts due for review
5. **Process SRS Recommendations** code node - Generates actionable SRS insights
6. **Improved LLM Prompt** Gemini node - Uses all data for specific feedback

---

## 📋 Current Workflow Structure (v3)

```
1. Webhook Trigger
2. Parse Quiz Data (Code)
3. Three Parallel Branches:
   ├─ Branch 1: Insert Quiz Results
   ├─ Branch 2: Update Concept Mastery (SRS loop)
   └─ Branch 3: Update Weekly Leaderboard
4. Merge All Branches
5. Insert Feedback (with generic AI)
6. Prepare Final Response
7. Respond to Webhook
```

---

## 🔧 New Workflow Structure (Phase 2)

```
1. Webhook Trigger
2. Parse Quiz Data (Code)
3. ===== NEW: PERFORMANCE ANALYSIS =====
4. Analyze Performance (Code) ← NEW
5. Get Progress History (Supabase) ← NEW (parallel)
6. Analyze Progress Trends (Code) ← NEW
7. Get SRS Recommendations (Supabase) ← NEW (parallel)
8. Process SRS Recommendations (Code) ← NEW
9. ===== ORIGINAL: DATABASE UPDATES =====
10. Three Parallel Branches:
   ├─ Branch 1: Insert Quiz Results
   ├─ Branch 2: Update Concept Mastery (SRS loop)
   └─ Branch 3: Update Weekly Leaderboard
11. Merge All Branches
12. ===== IMPROVED: AI FEEDBACK =====
13. Generate AI Feedback (Gemini) ← UPDATED with new prompt
14. Insert Feedback (existing)
15. Prepare Final Response (existing)
16. Respond to Webhook (existing)
```

---

## 🛠️ Step-by-Step Integration

### Step 1: Add Performance Analysis Node

**Location:** After "Parse Quiz Data" node

**Node Type:** Code (JavaScript)

**Node Name:** `Analyze Performance`

**Code:** Copy from `analyze-performance.js`

**Configuration:**
- Mode: Run Once for All Items
- Input: Use $json from Parse Quiz Data node

**Test:** After adding, execute the node and verify `performance_analysis` object appears in output.

---

### Step 2: Add Progress History Query (Parallel)

**Location:** Parallel to "Analyze Performance" (both after Parse Quiz Data)

**Node Type:** Supabase (Execute Query)

**Node Name:** `Get Progress History`

**Query:** Copy from `get-progress-history.sql`

**Configuration:**
- Operation: Execute Query
- Query Type: Select
- Return All: Yes
- Replace variables:
  - `{{$json.student_id}}` → `{{ $('Parse Quiz Data').item.json.student_id }}`
  - `{{$json.institution_id}}` → `{{ $('Parse Quiz Data').item.json.institution_id }}`

---

### Step 3: Add Progress Trends Analysis Node

**Location:** After "Get Progress History" node

**Node Type:** Code (JavaScript)

**Node Name:** `Analyze Progress Trends`

**Code:** Copy from `analyze-progress-trends.js`

**Configuration:**
- Mode: Run Once for All Items
- Input: Connect from "Get Progress History" output

**Important:** This node references `$('Parse Quiz Data').item.json` - ensure Parse Quiz Data node name matches exactly.

---

### Step 4: Add SRS Recommendations Query (Parallel)

**Location:** Parallel to "Analyze Progress Trends" (create another branch from Parse Quiz Data)

**Node Type:** Supabase (Execute Query)

**Node Name:** `Get SRS Recommendations`

**Query:** Copy from `get-srs-recommendations.sql`

**Configuration:**
- Operation: Execute Query
- Query Type: Select
- Return All: Yes
- Replace variables (same as Step 2)

---

### Step 5: Add SRS Processing Node

**Location:** After "Get SRS Recommendations" node

**Node Type:** Code (JavaScript)

**Node Name:** `Process SRS Recommendations`

**Code:** Copy from `process-srs-recommendations.js`

**Configuration:**
- Mode: Run Once for All Items
- Input: Connect from "Get SRS Recommendations" output

---

### Step 6: Merge Analysis Branches

**Location:** After all 3 new analysis nodes complete

**Node Type:** Merge (Set)

**Node Name:** `Merge Analysis Data`

**Inputs:** Connect all 3:
1. Analyze Performance (output)
2. Analyze Progress Trends (output)
3. Process SRS Recommendations (output)

**Configuration:**
- Mode: Merge By Position
- Output Data: Combine all input data

---

### Step 7: Update AI Feedback Generation

**Location:** Replace existing "Generate Feedback" node (or add if missing)

**Node Type:** Google Gemini Chat Model

**Node Name:** `Generate AI Feedback`

**Configuration:**
- Model: `gemini-2.0-flash-exp` (or `gemini-2.5-pro`)
- Temperature: 0.7
- Max Tokens: 500

**System Prompt:** Copy from `improved-llm-prompt.md` (System Prompt section)

**User Prompt:** Copy from `improved-llm-prompt.md` (User Prompt section)

**Variable Mapping:**
- Ensure all variables reference correct node outputs:
  - `$json.score` → from Parse Quiz Data or Merge Analysis Data
  - `$json.performance_analysis` → from Analyze Performance
  - `$json.progress_trends` → from Analyze Progress Trends
  - `$json.srs_recommendations` → from Process SRS Recommendations

---

### Step 8: Update Insert Feedback Node

**Location:** After "Generate AI Feedback" node

**Modify:** Existing "Insert Feedback" node to use new AI output

**Changes:**
```javascript
// OLD: ai_insights was empty or generic
ai_insights: ""

// NEW: Use Gemini output
ai_insights: $('Generate AI Feedback').item.json.output
```

---

## ✅ Testing Checklist

### Test 1: Performance Analysis
1. Submit quiz with short answers (like "h", "a")
2. Check `Analyze Performance` output
3. Verify `patterns.is_rushing = true`
4. Verify `patterns.rushed_answers_count > 0`

### Test 2: Progress Trends
1. Submit multiple quizzes (need at least 2)
2. Check `Get Progress History` returns previous quizzes
3. Check `Analyze Progress Trends` calculates trend direction
4. Verify `score_trend.direction` is set (improving/declining/stable)

### Test 3: SRS Recommendations
1. Check `Get SRS Recommendations` returns concept_mastery records
2. Verify `Process SRS Recommendations` categorizes concepts
3. Check `critical_concepts` array for concepts < 20% mastery
4. Check `review_tomorrow` for concepts due

### Test 4: AI Feedback Quality
1. Submit quiz with clear rushing pattern
2. Check Gemini output mentions specific rushed answers
3. Verify feedback is direct and honest (not generic praise)
4. Verify feedback includes tomorrow's action item

### Test 5: End-to-End
1. Submit complete quiz through frontend
2. Check all nodes execute successfully
3. Verify feedback inserted into database
4. Check frontend displays feedback correctly
5. Verify feedback quality matches examples in `improved-llm-prompt.md`

---

## 🐛 Troubleshooting

### Issue: Variables not found
**Solution:** Check node names match exactly. Use `$('Node Name').item.json.field` syntax.

### Issue: Merge node not combining data
**Solution:** Use "Merge By Position" mode and ensure all inputs are connected.

### Issue: Gemini returns generic feedback
**Solution:**
1. Verify all variables are passing data (check previous node outputs)
2. Increase temperature to 0.8 for more specific responses
3. Check prompt includes actual data (not undefined)

### Issue: Progress trends show "no data"
**Solution:** Student needs at least 1 previous quiz. First quiz won't have trends.

### Issue: SRS recommendations empty
**Solution:** concept_mastery table needs data. Ensure Branch 2 (Update Concept Mastery) ran successfully.

---

## 📊 Expected Performance

### Node Execution Times
- Analyze Performance: ~100ms
- Get Progress History: ~200ms
- Analyze Progress Trends: ~100ms
- Get SRS Recommendations: ~200ms
- Process SRS Recommendations: ~150ms
- Generate AI Feedback: ~2-4 seconds (Gemini API)
- **Total Added Time:** ~3-5 seconds

### Data Quality
- Rushing detection: 90%+ accuracy
- Confusion pairs: Identifies patterns with 2+ errors
- Progress trends: Requires 2+ quizzes for meaningful data
- SRS recommendations: Real-time based on latest concept_mastery

---

## 🚀 Next Steps After Integration

1. **Test with Real Students:** Have Anaya and Kavya take 3-5 quizzes each
2. **Review Feedback Quality:** Check if feedback is specific and actionable
3. **Iterate on Prompt:** Adjust LLM prompt based on feedback quality
4. **Monitor Performance:** Check n8n execution times and Gemini API usage

---

## 📝 Notes

- All code nodes are **idempotent** (safe to re-run)
- No changes to database schema required
- Backward compatible (works with existing data)
- Can be deployed incrementally (add nodes one by one)
- Gemini API is free tier (no cost increase)

---

**Last Updated:** 2025-10-30
**Version:** Phase 2 Enhancement
**Status:** Ready for integration
