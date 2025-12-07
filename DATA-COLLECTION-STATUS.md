# Quiz Data Collection Status - SRS System

**Date:** 2025-01-08
**Purpose:** Document current data collection vs SRS requirements

---

## ✅ CRITICAL DATA FOR SRS - FULLY IMPLEMENTED

The following data is **currently being collected and saved** to the database, which is **sufficient for the SRS (Spaced Repetition System) to function**:

### Per-Question Data (in `answers_json.questions` array)

```javascript
{
  question_id: "uuid",
  question_text: "Complete: Mount Everest is ___ tallest mountain",
  question_type: "fill_blank",
  student_answer: "tha",              // ✅ SAVES WRONG ANSWERS TOO!
  correct_answer: "the",
  is_correct: false,                  // ✅ SRS knows it was wrong
  time_spent: 45,                     // seconds
  points_earned: 0,
  concept_tested: "Definite Articles" // ✅ SRS can track concept mastery
}
```

### Top-Level Submission Data

```javascript
{
  student_id: "uuid",
  student_name: "Anaya",
  quiz_date: "2025-01-08",
  total_questions: 30,
  correct_answers: 25,
  incorrect_answers: 5,               // ✅ Total count
  score: 83.33,
  time_taken_seconds: 1200,
  highest_streak: 12,
  total_score: 2500,
  power_ups_used: {
    fifty_fifty: 1,
    blaster: 0,
    extra_time: 1
  },
  answers_json: {
    questions: [...],                 // Array of per-question data above
    metadata: {
      correct_count: 25,              // ✅ Tracked
      incorrect_count: 5,             // ✅ Tracked
      questions_attempted: 30,
      completion_rate: 100
    }
  },
  concepts_tested: ["Articles", "Tenses", "Prepositions"]
}
```

**Verified in:** `src/App.js` lines 286-343

---

## ⚠️ EXTENSIVE DATA - NOT YET IMPLEMENTED (Future Enhancement)

According to `context/context1A.md` (lines 427-477), the following fields are **planned but not yet implemented**:

### Advanced Error Tracking (TODO)

```javascript
{
  // Current: Basic tracking ✅
  student_answer: "tha",
  is_correct: false,

  // Future: Deep analysis 🔜
  hesitation_detected: true,          // ⏳ TODO
  answer_changed_times: 2,            // ⏳ TODO
  grammar_errors: ["spelling"],       // ⏳ TODO
  spelling_errors: ["tha → the"],     // ⏳ TODO
  conceptual_gap: "Article usage before superlatives", // ⏳ TODO (AI analysis)

  ai_evaluation: {                    // ⏳ TODO (for voice/paragraph)
    score: 60,
    feedback: "...",
    key_points_covered: [],
    key_points_missed: []
  }
}
```

**Why these are TODOs:**
1. **hesitation_detected** - Needs timestamp tracking per keystroke/input change
2. **answer_changed_times** - Needs edit history tracking
3. **grammar_errors** - Needs grammar checking API (e.g., LanguageTool API)
4. **spelling_errors** - Needs spell checker integration
5. **conceptual_gap** - Needs AI analysis (Gemini API) on wrong answers
6. **ai_evaluation** - Needed for voice/paragraph questions (Web Speech API + Gemini)

**Marked in code:** `src/App.js` has inline comments marking these as TODOs

---

## 🎯 SRS System Requirements - VERIFIED ✅

### What the SRS Algorithm Needs (from `context/context1A.md` lines 355-366)

**Minimum Required Data:**
1. ✅ **Concept identification** → We have `concept_tested`
2. ✅ **Correct/Incorrect status** → We have `is_correct`
3. ✅ **Student answer** → We save `student_answer` (including wrong answers)
4. ✅ **Time tracking** → We have `time_spent`

**SRS Algorithm Logic:**
```
After each quiz:
- Correct answer: mastery_score += 15 (max 100)
- Wrong answer: mastery_score -= 10 (min 0)

Review scheduling:
- mastery_score < 40:  next_review = today + 1 day
- mastery_score 40-59: next_review = today + 3 days
- mastery_score 60-74: next_review = today + 7 days
- mastery_score 75-89: next_review = today + 14 days
- mastery_score >= 90: next_review = today + 30 days
```

**Verdict:** ✅ **Current data collection is SUFFICIENT for SRS to function**

---

## 📊 Data Flow Verification

### Frontend → n8n → Database

1. **Quiz Completion** (`App.js:277-348`)
   - Calculates detailed answers including wrong answers
   - Packages into `answers_json` structure
   - Calls `submitQuizResults(data)`

2. **Webhook Submission** (`src/services/webhookService.js`)
   - POSTs to `https://n8n.myworkflow.top/webhook/quiz-submit`
   - Receives response with rank

3. **n8n Workflow** (`Quiz-Results-Handler-IMPROVED.json`)
   - **Branch 1:** INSERT into `quiz_results` table (saves complete `answers_json`)
   - **Branch 2:** UPDATE `concept_mastery` (SRS algorithm)
   - **Branch 3:** UPSERT `leaderboard` (atomic rank calculation)

4. **Database Tables** (Supabase PostgreSQL)
   - `quiz_results.answers_json` → JSONB column stores all question data
   - `concept_mastery` → Tracks per-concept mastery scores
   - `leaderboard` → Real-time rankings

**Verification:** Wrong answers ARE being saved in `answers_json.questions[].student_answer`

---

## 🎓 Learning Features - IMPLEMENTED ✅

### Explanations After Every Question

**Status:** ✅ **FULLY IMPLEMENTED**

All question types now show explanations after submission:

1. ✅ **MCQQuestion.jsx** (lines 84-94)
2. ✅ **TrueFalseQuestion.jsx** (lines 69-79)
3. ✅ **ShortAnswerQuestion.jsx** (lines 86-94)
4. ✅ **FillBlankQuestion.jsx** (explanation section exists)
5. ✅ **MatchQuestion.jsx** (lines 155-163)

**Implementation:**
```jsx
{showResult && question.explanation && (
  <div className="mt-6 p-5 rounded-2xl ...">
    <div className="flex items-start gap-3">
      <Lightbulb className="w-5 h-5 text-cyan-400 mt-1 shrink-0" />
      <div>
        <p className="text-cyan-300 text-sm font-semibold mb-1">Explanation:</p>
        <p className="text-white/90 text-sm leading-relaxed">{question.explanation}</p>
      </div>
    </div>
  </div>
)}
```

**User Feedback:** "explanation should be given for every kind of questions as it helps in learning" ✅ DONE

---

## 📝 Next Steps for Enhanced Data Collection

**Priority 1 - AI Evaluation for Short Answers (HIGH PRIORITY)**
- Integrate Gemini API for semantic answer checking
- Compare student answer vs correct answer for meaning (not just exact match)
- Add to TODO.md as: `TODO-FEATURE-P1-001`

**Priority 2 - Answer Change Tracking (MEDIUM PRIORITY)**
- Track edit history in input fields
- Count number of times answer was changed
- Detect hesitation (time before first input)

**Priority 3 - Grammar/Spelling Analysis (MEDIUM PRIORITY)**
- Integrate LanguageTool API (free tier)
- Analyze wrong short answers for patterns
- Build per-student error profiles

**Priority 4 - Conceptual Gap Analysis (FUTURE)**
- Send wrong answers + question + concept to Gemini
- Ask: "Why did the student get this wrong? What's the conceptual gap?"
- Store insights for teacher dashboard

---

## ✅ CONCLUSION

### Current Status: **FULLY FUNCTIONAL FOR SRS** ✓

**What Works:**
1. ✅ Wrong answers are being saved
2. ✅ Correct/incorrect tracking per concept
3. ✅ Time tracking per question
4. ✅ Explanations shown for all question types
5. ✅ Data structure matches SRS requirements

**What's Missing (but not blocking SRS):**
- ⏳ Deep error analysis (grammar, spelling, conceptual gaps)
- ⏳ Answer change tracking
- ⏳ AI semantic evaluation for short answers

**Teacher/System Can Already:**
- See which concepts student got wrong
- See exact wrong answers given
- Track mastery scores per concept
- Schedule reviews using SRS algorithm
- View leaderboard and engagement

**Next Feature:** AI evaluation for short answer questions (allowing semantic matching vs exact matching)
