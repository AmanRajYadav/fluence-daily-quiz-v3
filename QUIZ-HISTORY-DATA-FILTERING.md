# Quiz History Data Filtering - Clean Separation

**Date:** 2025-10-29
**Issue:** Sending wrong fields to quiz_history causing schema errors
**Solution:** Filter data to only send fields that exist in database

---

## 🎯 Problem

**Original Approach:**
```javascript
// ❌ BAD - Sending everything to both webhook AND history
const resultsData = { /* all quiz data */ };
await submitQuizResults(resultsData);
await saveQuizToHistory(resultsData); // ERROR: extra fields!
```

**Issues:**
- `highest_streak` not in quiz_history table → Error
- `student_name` not needed in history
- `power_ups_used` not needed in history
- `incorrect_answers` not needed (can be calculated)
- Missing `questions_json` needed for replay

---

## ✅ Solution - Explicit Field Mapping

**New Approach:**
```javascript
// ✅ GOOD - Explicit data filtering
const resultsData = { /* all data for webhook */ };
await submitQuizResults(resultsData);

// Filter to only what quiz_history needs
const historyData = {
  student_id: resultsData.student_id,
  class_id: student.class_id || null,
  institution_id: student.institution_id || null,
  quiz_date: resultsData.quiz_date,
  questions_json: questions, // Add actual questions for replay
  answers_json: resultsData.answers_json,
  total_questions: resultsData.total_questions,
  correct_answers: resultsData.correct_answers,
  score: resultsData.score,
  time_taken_seconds: resultsData.time_taken_seconds,
  total_score: resultsData.total_score,
  concept_names: resultsData.concept_names,
  streak_count: 0, // Not tracking in history
  bonus_points: 0,
  total_points: resultsData.total_score
};

await saveQuizToHistory(historyData);
```

---

## 📊 Data Flow Comparison

### Webhook (n8n) - Gets Everything
Used for: Leaderboard, Analytics, Notifications

**Fields Sent:**
- ✅ student_id
- ✅ student_name (for display)
- ✅ quiz_date
- ✅ total_questions
- ✅ correct_answers
- ✅ incorrect_answers (analytics)
- ✅ score
- ✅ time_taken_seconds
- ✅ highest_streak (for stats)
- ✅ total_score
- ✅ power_ups_used (gamification tracking)
- ✅ answers_json (detailed responses)
- ✅ concept_names

**Purpose:** Complete quiz analytics and leaderboard updates

---

### History (quiz_history table) - Filtered Data
Used for: Quiz replay, student progress review

**Fields Sent:**
- ✅ student_id
- ✅ class_id
- ✅ institution_id
- ✅ quiz_date
- ✅ questions_json (for replay)
- ✅ answers_json
- ✅ total_questions
- ✅ correct_answers
- ✅ score
- ✅ time_taken_seconds
- ✅ total_score
- ✅ concept_names
- ✅ streak_count (0 - not tracking)
- ✅ bonus_points (0 - not tracking)
- ✅ total_points

**Removed Fields:**
- ❌ student_name (not needed, can JOIN from students table)
- ❌ incorrect_answers (can calculate: total - correct)
- ❌ highest_streak (not storing in history)
- ❌ power_ups_used (not needed for replay)

**Purpose:** Enable quiz replay and historical review

---

## 🔍 Field-by-Field Justification

### Included in History

| Field | Why Included |
|-------|-------------|
| student_id | Required - identifies who took quiz |
| class_id | V3 multi-tenancy - which class |
| institution_id | V3 multi-tenancy - which institution |
| quiz_date | When quiz was taken |
| questions_json | **Critical for replay** - actual questions shown |
| answers_json | **Critical for replay** - student responses |
| total_questions | Quick stat without counting JSON |
| correct_answers | Quick stat without parsing JSON |
| score | Percentage score |
| time_taken_seconds | How long quiz took |
| total_score | Total points earned |
| concept_names | What concepts were tested |
| streak_count | Set to 0 (not tracking) |
| bonus_points | Set to 0 (not tracking) |
| total_points | Same as total_score |

### Excluded from History

| Field | Why Excluded |
|-------|-------------|
| student_name | Can JOIN from students table |
| incorrect_answers | Can calculate: total_questions - correct_answers |
| highest_streak | Not needed for replay, only for real-time stats |
| power_ups_used | Not needed for replay (in answers_json if needed) |

---

## 💡 Benefits of This Approach

### 1. **Clean Separation of Concerns**
- Webhook gets analytics data
- History gets replay data
- No confusion about what goes where

### 2. **Database Schema Flexibility**
- Can change webhook data without affecting history
- Can change history schema without affecting webhook
- No forced alignment between different purposes

### 3. **Explicit Over Implicit**
- Clear what fields are being sent
- Easy to see what's missing
- Self-documenting code

### 4. **Future-Proof**
- Easy to add new fields to webhook without breaking history
- Easy to add new history fields without breaking webhook
- Version changes are isolated

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This
```javascript
// Sending same object everywhere
const data = { /* everything */ };
submitQuizResults(data);
saveQuizToHistory(data); // ERROR: schema mismatch!
```

### ✅ Do This Instead
```javascript
// Explicit data for each destination
const webhookData = { /* everything for analytics */ };
const historyData = { /* only replay fields */ };

submitQuizResults(webhookData);
saveQuizToHistory(historyData);
```

---

## 📝 Developer Notes

### When Adding New Fields

**Step 1:** Decide where it belongs
- Analytics/Stats → Add to webhook data only
- Replay/Review → Add to both webhook AND history
- Real-time only → Webhook only, not persisted

**Step 2:** Update the appropriate mapping
- If webhook: Add to `resultsData` object
- If history: Add to `historyData` object
- If both: Add to both

**Step 3:** Update database if needed
- If history: Run migration to add column
- If webhook only: No database change needed

**Step 4:** Document the decision
- Update this file
- Add comment in code explaining why

---

## 🔗 Related Files

**Code Files:**
- `src/App.js:390-410` - Data filtering implementation
- `src/services/webhookService.js` - Webhook submission
- `src/services/historyService.js` - History saving

**Database:**
- `quiz_results` table - Webhook data destination
- `quiz_history` table - History data destination

**Documentation:**
- `CONCEPT-NAMING-STANDARDIZATION.md` - Related schema fixes
- This file - Data filtering approach

---

## ✅ Final Status

**Problem:** ✅ Fixed
**Approach:** Explicit field filtering
**Testing:** ⏳ Pending user test

**Key Change:**
Instead of sending all data everywhere, we now:
1. Send complete data to webhook (for analytics)
2. Send filtered data to history (for replay)
3. Explicitly map each field (no assumptions)

**Ready for testing!** 🚀

---

**Last Updated:** 2025-10-29
**Issue Fixed:** "Could not find 'highest_streak' column"
**Solution:** Explicit data filtering instead of passing everything
