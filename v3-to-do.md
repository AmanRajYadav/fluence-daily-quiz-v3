# FLUENCE QUIZ V3 - PRIORITIZED TODO LIST
**Last Updated:** November 7, 2025
**Current Sprint:** AI Feedback Integration (COMPLETED ✅)
**Next Sprint:** Teacher Dashboard Development

---

## ✅ **COMPLETED (November 7, 2025)**

### **All Critical Bugs FIXED!** 🎉

**Session Summary:** All student-facing features are now 100% functional!

**Fixed Issues:**
1. ✅ **getTotalPoints()** - Fixed column name (`total_score` → `total_points`)
2. ✅ **Leaderboard Display** - Fixed table name (`leaderboard` → `weekly_leaderboard`)
3. ✅ **Leaderboard Names** - Fixed student name display (`display_name` → `full_name`)
4. ✅ **Weekly Rank** - Fixed column ordering (`weekly_rank` → `rank`)
5. ✅ **FeedbackScreen** - Fixed double-nested n8n response parsing
6. ✅ **HistoricalLeaderboard** - Migrated to V3 weekly_leaderboard table
7. ✅ **Timezone Sync** - Fixed week calculation (local timezone instead of UTC)

**Files Modified:**
- `src/services/quizService.js` - Lines 97-428 (V3 migration complete)
- `src/components/Leaderboard.jsx` - Lines 96-113 (V3 field mapping)
- `src/components/HistoricalLeaderboard.jsx` - Complete V3 conversion
- `src/components/ResultScreen.jsx` - Added debug logging
- `src/App.js` - Lines 393-402 (Double-nested response handling)

**Test Results:**
- ✅ Total Points: 3588 (correct calculation)
- ✅ Weekly Leaderboard: Shows "Anaya" at #1 with 42%
- ✅ FeedbackScreen: Rendering perfectly with AI insights
- ✅ No console errors
- ✅ All features operational

---

## 🎯 CURRENT STATUS SUMMARY

### ✅ **What's Working (100% Student Features!):**
- ✅ V3 authentication (student + teacher login)
- ✅ Quiz gameplay (all 6 question types)
- ✅ Quiz submission to n8n
- ✅ **N8N workflow generating complete analysis** (performance, trends, SRS, feedback)
- ✅ Database updates (quiz_results, concept_mastery, weekly_leaderboard)
- ✅ Quiz history and replay mode
- ✅ **Total Points Display** (showing correct cumulative points)
- ✅ **Weekly Leaderboard** (Monday-Sunday accumulation)
- ✅ **League System** (Beginner/Intermediate/Advanced/Master tiers)
- ✅ **FeedbackScreen** (AI-generated insights, strengths, weaknesses)
- ✅ **Historical Leaderboard** (Weekly Champions view)
- ✅ **Timezone Synchronization** (frontend + n8n using Asia/Kolkata)

### ⚠️ **Known Issues (Non-Critical):**
- ⚠️ Sound files: 403 errors for external URLs (levelup, tick sounds)
- ⚠️ Teacher dashboard: 100% placeholder (only login works)

### 🔍 **No More Console Errors!** ✅
All critical errors resolved on November 7, 2025.

---

## 🏆 WEEKLY LEADERBOARD & LEAGUE SYSTEM ARCHITECTURE

### **Weekly Leaderboard (V3)**

**How It Works:**
- ✅ **Monday-Sunday Accumulation** - Points accumulate throughout the week (resets every Monday)
- ✅ **Database Table:** `weekly_leaderboard` (NOT the old V2 `leaderboard` table)
- ✅ **N8N Handles Updates** - Frontend only READS, n8n workflow handles all writes
- ✅ **Real-time Updates** - Frontend subscribes to changes via Supabase Realtime
- ✅ **Rank Calculation** - PostgreSQL window functions (`ROW_NUMBER()`) for atomic ranking

**Key Fields:**
- `week_start_date` - Monday of current week (YYYY-MM-DD)
- `week_end_date` - Sunday of current week
- `total_points` - Sum of points earned this week
- `quizzes_taken` - Number of quizzes completed
- `avg_score` - Average score percentage
- `rank` - Position in weekly leaderboard (1 = top)
- `weekly_rank` - Same as rank (for compatibility)

**N8N Workflow Nodes:**
1. **Upsert Weekly Leaderboard** - Accumulates points for the week
2. **Get Weekly Scores** - Fetches all students in institution for this week
3. **Update Weekly Ranks** - Calculates ranks using window functions

**Motivation Design:**
- Better than daily leaderboard because students have entire week to improve
- Creates weekly competition cycles (like Duolingo)
- Reduces pressure of daily rankings

---

### **League System (Duolingo-Style Tiers)**

**Implementation:** `src/utils/leagueUtils.js`

**4 League Tiers (Based on Cumulative Total Points):**

1. **🥉 Beginner League** (0 - 1,500 points)
   - Color: Orange gradient
   - Entry tier for all students
   - Goal: Reach 1,500 total points

2. **🥈 Intermediate League** (1,500 - 3,000 points)
   - Color: Silver/Gray gradient
   - Shows consistent engagement
   - Goal: Reach 3,000 total points

3. **🥇 Advanced League** (3,000 - 5,000 points)
   - Color: Gold/Yellow gradient
   - High achiever status
   - Goal: Reach 5,000 total points

4. **👑 Master League** (5,000+ points)
   - Color: Purple-Pink gradient
   - Elite status (top performers)
   - No upper limit

**Key Difference from Weekly Leaderboard:**
- **Weekly Leaderboard** = Competitive ranking WITHIN current week (resets Monday)
- **League Tier** = Long-term achievement based on ALL-TIME cumulative points (never resets)

**Example:**
- Student A: 252 total points → 🥉 Beginner League, but could be #1 in Weekly Leaderboard
- Student B: 6,000 total points → 👑 Master League, but could be #5 in Weekly Leaderboard

**UI Display:**
- Progress bar showing: "1,248 more points to reach 🥈 Intermediate League"
- League badge/icon displayed on student profile
- League colors used for visual theming

**Future Feature (Not Yet Implemented):**
- Weekly promotion/demotion mechanics (top 10 promoted to higher league bracket, bottom 5 demoted)
- League-specific competitions (only compete against students in same league tier)

---

## 🔴 CRITICAL (Fix Immediately - Blocking Features)

### **CRIT-1: Fix getTotalPoints() - Wrong Column Name** ⚡ **URGENT**
**Priority:** P0 - Blocking UI display
**Effort:** 2 minutes
**Status:** 🔴 Broken

**Console Error:**
```
Error fetching points: {code: '42703', message: 'column quiz_results.total_score does not exist'}
```

**Root Cause:**
```javascript
// File: src/services/quizService.js line ~275
// WRONG column name:
.select('total_score')  // ❌ Column doesn't exist

// CORRECT column name:
.select('total_points')  // ✅ This is the actual column
```

**Fix:**
```javascript
// Line 275 in quizService.js
export const getTotalPoints = async (studentId) => {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('total_points')  // ✅ FIX: Changed from total_score
    .eq('student_id', studentId)
    .eq('institution_id', session.institution_id);  // ✅ ADD: V3 filter

  if (error) {
    console.error('[getTotalPoints] Error:', error);
    return 0;
  }

  return data?.reduce((sum, result) => sum + (result.total_points || 0), 0) || 0;
};
```

**Acceptance Criteria:**
- [ ] Total Points shows actual sum (not 0)
- [ ] No 400 error in console
- [ ] Points persist after page refresh

---

### **CRIT-2: Fix Leaderboard - Wrong Table Name** ⚡ **URGENT**
**Priority:** P0 - Blocking leaderboard display
**Effort:** 2 minutes
**Status:** 🔴 Broken

**Console Error:**
```
404 Error: /rest/v1/leaderboard
```

**Root Cause:**
```javascript
// File: src/services/quizService.js line ~110
// WRONG table name:
.from('leaderboard')  // ❌ V2 table (doesn't exist in V3)

// CORRECT table name:
.from('weekly_leaderboard')  // ✅ V3 table
```

**Fix:**
```javascript
// Line ~110 in quizService.js
export const getTodaysLeaderboard = async () => {
  const session = getCurrentSession();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weekly_leaderboard')  // ✅ FIX: Changed from 'leaderboard'
    .select('*, students(username, full_name)')
    .eq('quiz_date', today)  // OR use week_start_date for weekly
    .eq('institution_id', session.institution_id)
    .order('rank', { ascending: true });

  if (error) {
    console.error('[getTodaysLeaderboard] Error:', error);
    return [];
  }

  return data || [];
};
```

**Note:** May need to change filter from `quiz_date` to `week_start_date` depending on desired behavior (daily vs weekly).

**Acceptance Criteria:**
- [ ] Leaderboard displays after quiz submission
- [ ] No 404 error in console
- [ ] Shows student's rank correctly

---

### **CRIT-3: Debug FeedbackScreen Rendering** ⚡ **URGENT**
**Priority:** P0 - Blocking user value
**Effort:** 2-4 hours
**Status:** 🔴 Not Working (Pending CRIT-1 & CRIT-2 fixes)

**Issue:**
- N8N is returning complete feedback data ✅
- App.js is receiving the data ✅
- FeedbackScreen component exists ✅
- **BUT FeedbackScreen not rendering on screen ❌**

**Screenshot Evidence:**
```
After quiz completion, screen shows:
✅ Results Submitted Successfully!
✅ Score cards
✅ BACK TO HOME button
❌ NO FeedbackScreen component visible
```

**Diagnostic Steps:**

1. **Check Browser Console (FIRST)**
   ```javascript
   // Open DevTools (F12)
   // After quiz submission, check:
   console.log('Webhook result:', webhookResult);
   console.log('Feedback data:', feedbackData);

   // Expected output:
   // feedbackData = {
   //   strengths: [...],
   //   weaknesses: [...],
   //   ai_insights: "...",
   //   feedback_id: "uuid"
   // }
   ```

2. **Verify App.js State**
   ```javascript
   // Add React DevTools
   // Check component state:
   // - feedbackData: should NOT be null
   // - submitted: should be true
   // - isReplayMode: should be false
   ```

3. **Check ResultScreen Props**
   ```javascript
   // In ResultScreen.jsx, add debug log:
   console.log('ResultScreen received feedback:', feedback);
   console.log('Submitted:', submitted);
   console.log('Replay mode:', isReplayMode);

   // Line 203 condition check:
   console.log('Should render FeedbackScreen?',
     feedback && submitted && !isReplayMode);
   ```

4. **Verify Webhook Response Structure**
   ```javascript
   // In webhookService.js, add logging:
   const response = await fetch(WEBHOOK_URL, { ... });
   const result = await response.json();
   console.log('Full webhook response:', result);

   // Check structure:
   // result.data.feedback should exist
   ```

**Possible Root Causes:**

**A. Webpack Response Parsing Issue**
```javascript
// App.js line 384: Check if webhookResult is correct structure
const webhookResult = await webhookService.submitQuizResults(resultsData);

// Add debug:
console.log('Type of webhookResult:', typeof webhookResult);
console.log('webhookResult.data:', webhookResult.data);
console.log('webhookResult.data.feedback:', webhookResult.data.feedback);

// Expected:
// webhookResult = { success: true, data: { feedback: {...} } }

// Check if it's wrapped in extra array:
// webhookResult = [{ success: true, data: { ... } }]
// If so, fix:
const actualResult = Array.isArray(webhookResult)
  ? webhookResult[0]
  : webhookResult;
```

**B. Timing Issue (Async State)**
```javascript
// App.js lines 394-397: State update might not trigger re-render
if (webhookResult.data && webhookResult.data.feedback) {
  setFeedbackData(webhookResult.data.feedback);
  console.log('AI Feedback received:', webhookResult.data.feedback);
}

// Try forcing update:
setTimeout(() => {
  setFeedbackData(webhookResult.data.feedback);
}, 100);
```

**C. ResultScreen Not Re-rendering**
```javascript
// Check if ResultScreen is receiving updated props
// Add useEffect in ResultScreen.jsx:
useEffect(() => {
  console.log('ResultScreen props updated:', { feedback, submitted });
}, [feedback, submitted]);
```

**Fix Plan:**
1. Add console.log statements at each step
2. Identify where data is lost
3. Fix the broken link in the chain
4. Test end-to-end

**Acceptance Criteria:**
- [x] N8N returns feedback data (VERIFIED ✅)
- [ ] App.js receives feedback data
- [ ] feedbackData state is set
- [ ] ResultScreen receives feedback prop
- [ ] FeedbackScreen renders below result cards
- [ ] All sections display: strengths, weaknesses, AI insights

---

### **CRIT-2: Fix Leaderboard Not Updating** ⚡ **URGENT**
**Priority:** P0 - User sees no progress
**Effort:** 2-3 hours
**Status:** 🔴 Not Working

**Issue:**
After quiz submission, leaderboard shows:
```
🏆 LEADERBOARD
No scores yet today. Be the first!

Your score: 47%
Submit to see your rank!
```

**Diagnostic Steps:**

1. **Check N8N Execution Logs**
   ```
   - Go to: https://n8n.myworkflow.top/
   - Find latest "Quiz Results Handler V3" execution
   - Check these nodes for errors:
     - "Upsert Weekly Leaderboard"
     - "Update Weekly Ranks"
     - "Get Weekly Scores"
   - Look for SQL errors or constraint violations
   ```

2. **Check Database Directly**
   ```sql
   -- 1. Check if quiz was saved:
   SELECT * FROM quiz_results
   WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
   ORDER BY created_at DESC
   LIMIT 1;

   -- 2. Check if leaderboard entry exists:
   SELECT * FROM weekly_leaderboard
   WHERE student_id = 'edee9e5a-3bfd-4cc0-87b5-f2334101463f'
     AND week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE;

   -- 3. Check all leaderboard entries for this week:
   SELECT
     sl.username,
     wl.total_quizzes,
     wl.avg_score,
     wl.total_points,
     wl.rank
   FROM weekly_leaderboard wl
   JOIN students sl ON wl.student_id = sl.id
   WHERE wl.week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE
   ORDER BY wl.rank;
   ```

3. **Check RLS Policies**
   ```sql
   -- Test if student can read leaderboard:
   SET LOCAL ROLE anon;
   SET LOCAL request.jwt.claims TO '{"user_id": "edee9e5a-3bfd-4cc0-87b5-f2334101463f"}';

   SELECT * FROM weekly_leaderboard
   WHERE institution_id = 'e5dd424c-3bdb-4671-842c-a9c5b6c8495d';

   -- If query returns nothing, RLS policy is blocking
   ```

4. **Check Frontend Query**
   ```javascript
   // In browser console:
   import { supabase } from './services/supabase';
   import { getCurrentSession } from './services/authService';

   const session = getCurrentSession();
   const { data, error } = await supabase
     .from('weekly_leaderboard')
     .select('*')
     .eq('institution_id', session.institution_id)
     .eq('week_start_date', /* calculate this week's Monday */)
     .order('rank', { ascending: true });

   console.log('Leaderboard data:', data);
   console.log('Leaderboard error:', error);
   ```

**Possible Root Causes:**

**A. Frontend Querying Wrong Table**
```javascript
// quizService.js line 155:
export const getTodaysLeaderboard = async () => {
  const { data } = await supabase
    .from('leaderboard') // ❌ Old table name?
    .select('*')
    ...
};

// Should be:
export const getTodaysLeaderboard = async () => {
  const { data } = await supabase
    .from('weekly_leaderboard') // ✅ New table
    .select('*')
    ...
};
```

**B. N8N Workflow Failing Silently**
```
Check n8n node: "Upsert Weekly Leaderboard"
Expected SQL:
  INSERT INTO weekly_leaderboard (
    institution_id, class_id, student_id,
    week_start_date, week_end_date,
    total_quizzes, total_points, avg_score
  ) VALUES (...)
  ON CONFLICT (student_id, week_start_date)
  DO UPDATE SET
    total_quizzes = weekly_leaderboard.total_quizzes + 1,
    total_points = weekly_leaderboard.total_points + EXCLUDED.total_points,
    avg_score = (weekly_leaderboard.avg_score * weekly_leaderboard.total_quizzes + EXCLUDED.avg_score) / (weekly_leaderboard.total_quizzes + 1);
```

**C. Week Calculation Mismatch**
```javascript
// Frontend might be querying different week than n8n
// Check n8n uses: DATE_TRUNC('week', CURRENT_DATE)::DATE
// Check frontend uses same calculation

// In quizService.js:
const getWeekStartDate = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0]; // "YYYY-MM-DD"
};
```

**Fix Plan:**
1. Check n8n execution logs
2. Verify database has records
3. Fix table name in quizService.js
4. Ensure week calculation matches
5. Test RLS policies
6. Add error handling in frontend

**Acceptance Criteria:**
- [ ] After quiz submission, leaderboard shows student's score
- [ ] Rank is calculated correctly (1, 2, 3, etc.)
- [ ] "Submit to see your rank!" message disappears
- [ ] Real-time updates work (Supabase Realtime)

---

## 🟡 HIGH PRIORITY (Complete AI Feedback - Quick Wins)

### **HIGH-1: Display Performance Analysis in FeedbackScreen**
**Priority:** P1 - High user value
**Effort:** 1-2 days
**Status:** ⚠️ Data available, UI needed

**Task:**
Update FeedbackScreen.jsx to display performance analysis data from n8n.

**Data Available (from n8n):**
```javascript
performance_analysis: {
  rushing_detected: true,
  rushed_answers_count: 9,
  confusion_pairs: [
    {
      concept: "Madhubani Paintings (Content)",
      incorrect_count: 2,
      examples: [...]
    }
  ],
  accuracy_by_speed: {
    fast: 48, medium: 0, slow: 0
  },
  time_patterns: {
    avg_time_per_question: 4,
    fastest_correct: {...},
    slowest_correct: {...}
  },
  critical_weaknesses: [...],
  moderate_weaknesses: [...],
  strong_concepts: [...]
}
```

**UI Design:**

**A. Rushing Alert (if detected):**
```jsx
{performanceAnalysis.rushing_detected && (
  <motion.div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
    <div className="flex items-center">
      <AlertTriangle className="text-red-500 mr-2" />
      <div>
        <h4 className="font-bold text-red-700">Rushing Detected!</h4>
        <p className="text-red-600">
          You rushed through {performanceAnalysis.rushed_answers_count} questions,
          leading to careless errors. Slow down and read carefully!
        </p>
      </div>
    </div>
  </motion.div>
)}
```

**B. Confusion Pairs Section:**
```jsx
<div className="bg-orange-50 rounded-xl p-6 mb-4">
  <h3 className="text-lg font-bold text-orange-700 mb-3">
    📚 Concepts Needing Practice
  </h3>
  {performanceAnalysis.confusion_pairs.map(pair => (
    <div key={pair.concept} className="mb-3">
      <p className="font-semibold text-orange-600">
        {pair.concept} ({pair.incorrect_count} errors)
      </p>
      <div className="text-sm text-orange-500">
        {pair.examples.slice(0, 1).map(ex => (
          <p key={ex.question_id} className="mt-1">
            Example: "{ex.question_text}"
            <br />
            Your answer: "{ex.student_answer}"
            <br />
            Correct: "{ex.correct_answer}"
          </p>
        ))}
      </div>
    </div>
  ))}
</div>
```

**C. Time Analysis:**
```jsx
<div className="bg-blue-50 rounded-xl p-6 mb-4">
  <h3 className="text-lg font-bold text-blue-700 mb-3">
    ⏱️ Time Performance
  </h3>
  <div className="grid grid-cols-3 gap-4">
    <div className="text-center">
      <p className="text-sm text-blue-500">Fast (<10s)</p>
      <p className="text-2xl font-bold text-blue-600">
        {performanceAnalysis.accuracy_by_speed.fast}%
      </p>
    </div>
    <div className="text-center">
      <p className="text-sm text-blue-500">Medium (10-30s)</p>
      <p className="text-2xl font-bold text-blue-600">
        {performanceAnalysis.accuracy_by_speed.medium}%
      </p>
    </div>
    <div className="text-center">
      <p className="text-sm text-blue-500">Slow (>30s)</p>
      <p className="text-2xl font-bold text-blue-600">
        {performanceAnalysis.accuracy_by_speed.slow}%
      </p>
    </div>
  </div>
  <p className="text-sm text-blue-600 mt-3">
    {performanceAnalysis.time_patterns.avg_time_per_question}s average per question
  </p>
</div>
```

**File Changes:**
1. Update `src/components/Feedback/FeedbackScreen.jsx`
2. Add props: `performanceAnalysis`, `progressTrends`, `srsRecommendations`
3. Design new sections with Duolingo-style cards
4. Update `src/App.js` to pass new props

**Acceptance Criteria:**
- [ ] Rushing alert shows if detected
- [ ] Confusion pairs listed with examples
- [ ] Time analysis displays accuracy by speed
- [ ] All cards have smooth animations
- [ ] Mobile responsive

---

### **HIGH-2: Display Progress Trends**
**Priority:** P1 - High user value
**Effort:** 1 day
**Status:** ⚠️ Data available, UI needed

**Data Available:**
```javascript
progress_trends: {
  trend_direction: "declining",
  change_percentage: -14,
  last_5_scores: [16.67, 80, 80, 80, 46.67],
  average_last_5: 61,
  best_score: 80,
  consistency: "low",
  vs_last_quiz: { diff: 0, improved: false, message: "..." },
  vs_average: { diff: -14, better: false, message: "..." },
  vs_best: { is_best: false, diff: -33, message: "..." },
  insights: [...],
  recommendations: [...]
}
```

**UI Design:**

**A. Trend Direction Badge:**
```jsx
<div className={`inline-flex items-center px-3 py-1 rounded-full ${
  progressTrends.trend_direction === 'improving' ? 'bg-green-100 text-green-700' :
  progressTrends.trend_direction === 'declining' ? 'bg-red-100 text-red-700' :
  'bg-gray-100 text-gray-700'
}`}>
  {progressTrends.trend_direction === 'improving' ? '📈' :
   progressTrends.trend_direction === 'declining' ? '📉' : '➡️'}
  <span className="ml-2 font-semibold">
    {progressTrends.trend_direction.toUpperCase()}
    {progressTrends.change_percentage !== 0 && (
      <span className="ml-1">
        ({progressTrends.change_percentage > 0 ? '+' : ''}
        {progressTrends.change_percentage}%)
      </span>
    )}
  </span>
</div>
```

**B. Score Comparison Cards:**
```jsx
<div className="grid grid-cols-3 gap-3 mb-4">
  <div className="bg-purple-50 rounded-lg p-3 text-center">
    <p className="text-xs text-purple-500">vs Last Quiz</p>
    <p className="text-lg font-bold text-purple-600">
      {progressTrends.vs_last_quiz.diff > 0 ? '+' : ''}
      {progressTrends.vs_last_quiz.diff}%
    </p>
  </div>
  <div className="bg-blue-50 rounded-lg p-3 text-center">
    <p className="text-xs text-blue-500">vs Average</p>
    <p className="text-lg font-bold text-blue-600">
      {progressTrends.vs_average.diff > 0 ? '+' : ''}
      {progressTrends.vs_average.diff}%
    </p>
  </div>
  <div className="bg-green-50 rounded-lg p-3 text-center">
    <p className="text-xs text-green-500">Best Score</p>
    <p className="text-lg font-bold text-green-600">
      {progressTrends.best_score}%
    </p>
  </div>
</div>
```

**C. Consistency Badge:**
```jsx
<div className={`inline-flex items-center px-3 py-1 rounded-full ${
  progressTrends.consistency === 'high' ? 'bg-green-100 text-green-700' :
  progressTrends.consistency === 'low' ? 'bg-red-100 text-red-700' :
  'bg-yellow-100 text-yellow-700'
}`}>
  Consistency: {progressTrends.consistency.toUpperCase()}
</div>
```

**Acceptance Criteria:**
- [ ] Trend badge shows direction (improving/declining/stable)
- [ ] Comparison cards show vs last quiz, vs average, best score
- [ ] Consistency indicator displays
- [ ] Insights and recommendations shown
- [ ] Smooth animations on reveal

---

### **HIGH-3: Display SRS Recommendations**
**Priority:** P1 - High learning value
**Effort:** 1 day
**Status:** ⚠️ Data available, UI needed

**Data Available:**
```javascript
srs_recommendations: {
  review_tomorrow: [],
  review_this_week: [...24 concepts],
  critical_concepts: [...43 concepts],
  struggling_concepts: [
    {
      concept: "Functions of Vitamins",
      mastery_score: 0,
      consecutive_incorrect: 3,
      needs_different_approach: true
    }
  ],
  mastered_concepts: [
    { concept: "Definite Articles", mastery_score: 90 }
  ],
  summary: {
    total_concepts: 45,
    critical_count: 43,
    mastered_count: 1,
    struggling_count: 1
  },
  action_items: [...]
}
```

**UI Design:**

**A. Tomorrow's Review (if any):**
```jsx
{srsRecommendations.review_tomorrow.length > 0 && (
  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
    <h4 className="font-bold text-yellow-700 mb-2">
      📅 Review Tomorrow ({srsRecommendations.review_tomorrow.length} concepts)
    </h4>
    <div className="grid grid-cols-2 gap-2">
      {srsRecommendations.review_tomorrow.slice(0, 6).map(concept => (
        <div key={concept.concept} className="text-sm text-yellow-600">
          • {concept.concept} ({concept.mastery_score}%)
        </div>
      ))}
    </div>
  </div>
)}
```

**B. Critical Concepts Alert:**
```jsx
<div className="bg-red-50 rounded-xl p-6 mb-4">
  <h3 className="text-lg font-bold text-red-700 mb-3">
    ⚠️ Critical Weaknesses ({srsRecommendations.critical_concepts.length})
  </h3>
  <p className="text-sm text-red-600 mb-3">
    These concepts need immediate attention (mastery &lt;20%)
  </p>
  <div className="space-y-2">
    {srsRecommendations.critical_concepts.slice(0, 5).map(concept => (
      <div key={concept.concept} className="flex justify-between items-center">
        <span className="text-red-600">{concept.concept}</span>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
          {concept.mastery_score}%
        </span>
      </div>
    ))}
    {srsRecommendations.critical_concepts.length > 5 && (
      <p className="text-sm text-red-500 mt-2">
        ...and {srsRecommendations.critical_concepts.length - 5} more
      </p>
    )}
  </div>
</div>
```

**C. Struggling Concepts (Needs Different Approach):**
```jsx
{srsRecommendations.struggling_concepts.length > 0 && (
  <div className="bg-orange-50 rounded-xl p-6 mb-4">
    <h3 className="text-lg font-bold text-orange-700 mb-3">
      🔄 Try a Different Approach
    </h3>
    <p className="text-sm text-orange-600 mb-3">
      Current method isn't working for these concepts:
    </p>
    {srsRecommendations.struggling_concepts.map(concept => (
      <div key={concept.concept} className="mb-3 last:mb-0">
        <p className="font-semibold text-orange-700">{concept.concept}</p>
        <p className="text-sm text-orange-600">
          {concept.consecutive_incorrect} consecutive errors -
          Consider watching a video or asking for help!
        </p>
      </div>
    ))}
  </div>
)}
```

**D. Mastered Concepts (Celebrate!):**
```jsx
{srsRecommendations.mastered_concepts.length > 0 && (
  <div className="bg-green-50 rounded-xl p-6 mb-4">
    <h3 className="text-lg font-bold text-green-700 mb-3">
      🎉 Mastered Concepts ({srsRecommendations.mastered_concepts.length})
    </h3>
    <div className="grid grid-cols-2 gap-2">
      {srsRecommendations.mastered_concepts.map(concept => (
        <div key={concept.concept} className="flex items-center text-green-600">
          <span className="mr-2">✓</span>
          <span className="text-sm">{concept.concept}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

**Acceptance Criteria:**
- [ ] Critical concepts listed (top 5 shown)
- [ ] Struggling concepts highlighted with different approach suggestion
- [ ] Mastered concepts celebrated
- [ ] Summary stats displayed
- [ ] Action items shown

---

## 🟢 MEDIUM PRIORITY (Feature Completion)

### **MED-1: Build Teacher Dashboard**
**Priority:** P2 - Blocking institution adoption
**Effort:** 5-7 days
**Status:** ❌ Placeholder only

**Current State:**
- ✅ Teacher login works
- ✅ Placeholder dashboard renders
- ❌ No actual features

**Components to Build:**

**A. StudentListView.jsx**
```jsx
// Location: src/components/Teacher/StudentListView.jsx
// Features:
// - List all students in institution
// - Filter by class
// - Search by name
// - View student details (click → StudentDetailView)
// - Add/remove students
// Effort: 1-2 days
```

**B. StudentDetailView.jsx**
```jsx
// Location: src/components/Teacher/StudentDetailView.jsx
// Features:
// - Student profile (name, class, enrollment date)
// - Quiz history (all attempts)
// - Progress chart (score trends)
// - Concept mastery heatmap
// - Recent quiz results
// - Send custom feedback
// Effort: 2 days
```

**C. ClassManagement.jsx**
```jsx
// Location: src/components/Teacher/ClassManagement.jsx
// Features:
// - List all classes
// - Create new class
// - Edit class details
// - Add/remove students from class
// - View class analytics
// Effort: 1-2 days
```

**D. QuestionEditor.jsx**
```jsx
// Location: src/components/Teacher/QuestionEditor.jsx
// Features:
// - List all questions (filter by class, subject, date)
// - Edit question text, options, answer
// - Add new questions manually
// - Delete/deactivate questions
// - Preview question
// Effort: 2 days
```

**E. Analytics.jsx**
```jsx
// Location: src/components/Teacher/Analytics.jsx
// Features:
// - Class performance overview
// - Weak concepts across all students
// - Engagement metrics (quiz completion rate)
// - Score distribution charts
// - Export to CSV
// Effort: 2 days
```

**Database Queries Needed:**
```sql
-- List all students in institution:
SELECT * FROM students
WHERE institution_id = ?
ORDER BY username;

-- Get student quiz history:
SELECT qr.*, q.concept_names
FROM quiz_results qr
WHERE qr.student_id = ?
ORDER BY qr.created_at DESC;

-- Get class performance:
SELECT
  AVG(qr.score) as avg_score,
  COUNT(DISTINCT qr.student_id) as active_students,
  COUNT(*) as total_quizzes
FROM quiz_results qr
WHERE qr.class_id = ?
  AND qr.quiz_date >= CURRENT_DATE - 7;

-- Get weak concepts for class:
SELECT
  concept_name,
  AVG(mastery_score) as avg_mastery
FROM concept_mastery
WHERE institution_id = ?
GROUP BY concept_name
HAVING AVG(mastery_score) < 50
ORDER BY avg_mastery ASC;
```

**Acceptance Criteria:**
- [ ] Teacher can view list of all students
- [ ] Teacher can click student to see detailed view
- [ ] Teacher can create/edit classes
- [ ] Teacher can add/remove students from classes
- [ ] Teacher can edit questions
- [ ] Teacher can view class analytics
- [ ] All features work on mobile

---

### **MED-2: Integrate Rapid Fire Mode**
**Priority:** P2 - Student engagement
**Effort:** 2-3 days
**Status:** ⚠️ 30% built, not integrated

**Current State:**
- ✅ rapidFireHandlers.js (220 lines) - Game logic ready
- ✅ RapidFirePowerUpBar.jsx (78 lines) - UI component
- ❌ Not integrated into App.js
- ❌ No menu option

**Integration Plan:**

**A. Add Menu Option (AppV3.js)**
```jsx
function StudentDashboard({ session }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Existing cards */}
      <Card title="📚 Today's Quiz" ... />
      <Card title="🏆 Leaderboard" ... />

      {/* NEW: Rapid Fire Card */}
      <Card
        title="🔥 Rapid Fire"
        description="30-second challenge! Test your speed and accuracy"
        onClick={() => navigate('/rapid-fire')}
      />
    </div>
  );
}
```

**B. Create Rapid Fire Route**
```jsx
// In AppV3.js routing:
{gameState === 'rapid-fire' && (
  <RapidFireGame
    session={session}
    onBack={() => setGameState('menu')}
  />
)}
```

**C. Connect Handlers**
```javascript
// Import rapid fire handlers into App.js
import {
  handleRapidFireStart,
  handleRapidFireAnswer,
  handleRapidFireEnd
} from './components/RapidFire/rapidFireHandlers';

// Add rapid fire state:
const [rapidFireMode, setRapidFireMode] = useState(false);
const [rapidFireLives, setRapidFireLives] = useState(3);
const [rapidFireStreak, setRapidFireStreak] = useState(0);
```

**D. Add Bottom Navigation**
```jsx
<BottomNav>
  <NavItem icon="🏠" label="Home" onClick={() => navigate('/')} />
  <NavItem icon="📊" label="Progress" onClick={() => navigate('/progress')} />
  <NavItem icon="🔥" label="Rapid Fire" onClick={() => navigate('/rapid-fire')} />
  <NavItem icon="⚙️" label="Settings" onClick={() => navigate('/settings')} />
</BottomNav>
```

**Features:**
- 30-second timer per question
- 3 lives (lose 1 on wrong answer)
- Infinite questions (pulls from weak concepts)
- Separate leaderboard (rapid_fire_leaderboard table)
- Power-ups enabled (50:50, +15s)

**Acceptance Criteria:**
- [ ] Menu has "Rapid Fire" option
- [ ] Game starts with 30s timer
- [ ] Lives decrease on wrong answers
- [ ] Game ends at 0 lives
- [ ] Score saves to rapid_fire_leaderboard
- [ ] Separate leaderboard displays best streaks

---

### **MED-3: Weekly Leaderboard Component**
**Priority:** P2 - Better engagement
**Effort:** 1-2 days
**Status:** ⚠️ Table exists, no UI

**Current State:**
- ✅ weekly_leaderboard table in database
- ✅ N8N updating weekly ranks
- ❌ No frontend component

**Component Design:**

```jsx
// Location: src/components/WeeklyLeaderboard.jsx

function WeeklyLeaderboard({ institutionId }) {
  const [view, setView] = useState('weekly'); // 'daily' or 'weekly'
  const [leaderboard, setLeaderboard] = useState([]);

  const loadWeeklyLeaderboard = async () => {
    const weekStart = getWeekStartDate(); // Monday
    const { data } = await supabase
      .from('weekly_leaderboard')
      .select('*, students(username)')
      .eq('institution_id', institutionId)
      .eq('week_start_date', weekStart)
      .order('rank', { ascending: true });
    setLeaderboard(data);
  };

  return (
    <div className="bg-white rounded-2xl p-6">
      {/* Tab Switcher */}
      <div className="flex mb-4">
        <button
          className={view === 'daily' ? 'active' : ''}
          onClick={() => setView('daily')}
        >
          Today
        </button>
        <button
          className={view === 'weekly' ? 'active' : ''}
          onClick={() => setView('weekly')}
        >
          This Week
        </button>
      </div>

      {/* Week Display */}
      {view === 'weekly' && (
        <p className="text-sm text-gray-500 mb-4">
          Week of {formatWeekRange(weekStart, weekEnd)}
        </p>
      )}

      {/* Leaderboard List */}
      {leaderboard.map((entry, index) => (
        <LeaderboardRow
          key={entry.id}
          rank={entry.rank}
          username={entry.students.username}
          totalQuizzes={entry.total_quizzes}
          avgScore={entry.avg_score}
          totalPoints={entry.total_points}
          isCurrentUser={entry.student_id === session.user_id}
        />
      ))}
    </div>
  );
}
```

**Utilities Needed:**
```javascript
// Get Monday of current week:
const getWeekStartDate = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

// Format week range: "Nov 4 - Nov 10"
const formatWeekRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};
```

**Acceptance Criteria:**
- [ ] Tab switcher between daily and weekly
- [ ] Weekly view shows week range (Mon-Sun)
- [ ] Displays: rank, username, quizzes taken, avg score, total points
- [ ] Current user highlighted
- [ ] Real-time updates via Supabase Realtime
- [ ] Mobile responsive

---

## 🔵 LOW PRIORITY (Polish & Extras)

### **LOW-1: Fix Sound Files**
**Priority:** P3 - Nice to have
**Effort:** 1 hour
**Status:** ⚠️ 403 errors

**Issue:**
External sound URLs from mixkit.co are blocked by CORS.

**Fix:**
```bash
# 1. Download sounds locally:
mkdir -p public/sounds
cd public/sounds

# Download from mixkit.co:
wget https://assets.mixkit.co/active_storage/sfx/2000/2000.wav -O correct.wav
wget https://assets.mixkit.co/active_storage/sfx/2001/2001.wav -O wrong.wav
wget https://assets.mixkit.co/active_storage/sfx/2003/2003.wav -O complete.wav
wget https://assets.mixkit.co/active_storage/sfx/2010/2010.wav -O levelup.wav
wget https://assets.mixkit.co/active_storage/sfx/2015/2015.wav -O powerup.wav

# 2. Update soundService.js:
const sounds = {
  correct: new Howl({ src: ['/sounds/correct.wav'] }),
  wrong: new Howl({ src: ['/sounds/wrong.wav'] }),
  complete: new Howl({ src: ['/sounds/complete.wav'] }),
  levelup: new Howl({ src: ['/sounds/levelup.wav'] }),
  powerup: new Howl({ src: ['/sounds/powerup.wav'] })
};
```

**Acceptance Criteria:**
- [ ] All sound files load without 403 errors
- [ ] Sounds play on correct answer
- [ ] Sounds play on wrong answer
- [ ] Sounds play on quiz completion

---

### **LOW-2: Voice Input Integration**
**Priority:** P3 - Nice to have
**Effort:** 3-5 days
**Status:** ❌ Placeholder only

**Current State:**
- ⚠️ VoiceAnswerQuestion.jsx exists but doesn't work

**Implementation:**
```javascript
// Use Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'en-US';
recognition.continuous = false;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  onAnswerSelect(transcript);
};

recognition.start();
```

**UI:**
```jsx
<button onClick={startRecording} disabled={isRecording}>
  {isRecording ? (
    <>
      <Mic className="animate-pulse" />
      <span>Listening...</span>
    </>
  ) : (
    <>
      <Mic />
      <span>Tap to Speak</span>
    </>
  )}
</button>

{/* Waveform visualization while recording */}
{isRecording && <Waveform />}
```

**Acceptance Criteria:**
- [ ] Microphone permission requested
- [ ] Recording starts on button click
- [ ] Waveform shows while recording
- [ ] Transcript displayed in real-time
- [ ] Answer submitted on recognition end
- [ ] Works on Chrome (desktop + mobile)
- [ ] Fallback to typing if not supported

---

### **LOW-3: Weekly Reports Automation**
**Priority:** P3 - Future feature
**Effort:** 3-4 days
**Status:** ❌ Not started

**Task:**
Create N8N workflow to send automated weekly reports to parents.

**Workflow:**
```
Cron Trigger: Every Friday 8 PM
  ↓
Get all students with parent_email
  ↓
For each student:
  ├─ Query quiz_results (last 7 days)
  ├─ Query concept_mastery
  ├─ Calculate metrics (avg score, trend, concepts mastered)
  ├─ Call Gemini API for AI summary
  ├─ Generate HTML email
  ├─ Send via WhatsApp/Email
  └─ Save to weekly_reports table
```

**Acceptance Criteria:**
- [ ] N8N workflow runs every Friday
- [ ] Parents receive email/WhatsApp report
- [ ] Report includes: quiz count, avg score, concepts mastered, AI insights
- [ ] PDF attachment option
- [ ] Report saved to database

---

## 📋 BACKLOG (Future Enhancements)

### **Notes System**
- Upload class notes (PDF/text)
- Display in calendar view
- Search functionality
**Effort:** 5-7 days

### **PDF Reports**
- Generate quiz report as PDF
- Download option
- Email to parent
**Effort:** 2-3 days

### **Mobile App**
- React Native wrapper
- Push notifications
- Offline mode
**Effort:** 3-4 weeks

### **Parent Portal**
- Separate login for parents
- View child's progress
- Receive notifications
**Effort:** 2-3 weeks

---

## 🎯 SPRINT PLANNING

### **Sprint 1 (Week 1): Fix Feedback & Leaderboard** ⚡ **CURRENT**
**Goal:** Get AI feedback displaying and leaderboard updating

**Tasks:**
1. Debug FeedbackScreen rendering (CRIT-1) - 4 hours
2. Fix leaderboard update (CRIT-2) - 3 hours
3. Display performance analysis (HIGH-1) - 1 day
4. Display progress trends (HIGH-2) - 1 day
5. Display SRS recommendations (HIGH-3) - 1 day

**Deliverables:**
- [ ] FeedbackScreen renders after quiz
- [ ] All analysis data displayed
- [ ] Leaderboard updates in real-time
- [ ] Students see personalized insights

**Duration:** 5-7 days
**Status:** 🔴 Critical

---

### **Sprint 2 (Week 2-3): Teacher Dashboard**
**Goal:** Build core teacher features

**Tasks:**
1. StudentListView.jsx (MED-1a) - 2 days
2. StudentDetailView.jsx (MED-1b) - 2 days
3. ClassManagement.jsx (MED-1c) - 2 days
4. QuestionEditor.jsx (MED-1d) - 2 days
5. Analytics.jsx (MED-1e) - 2 days

**Deliverables:**
- [ ] Teacher can view/manage students
- [ ] Teacher can view student details
- [ ] Teacher can create/edit classes
- [ ] Teacher can edit questions
- [ ] Teacher can view analytics

**Duration:** 10-12 days
**Status:** 🟡 High Priority

---

### **Sprint 3 (Week 4): Polish & Launch**
**Goal:** Complete remaining features

**Tasks:**
1. Integrate Rapid Fire mode (MED-2) - 3 days
2. Weekly Leaderboard component (MED-3) - 2 days
3. Fix sound files (LOW-1) - 1 hour
4. Testing & bug fixes - 2 days

**Deliverables:**
- [ ] Rapid Fire mode accessible
- [ ] Weekly leaderboard working
- [ ] Sounds working
- [ ] All features tested

**Duration:** 7-8 days
**Status:** 🟢 Medium Priority

---

## 🚀 NEXT SESSION START HERE

### **Immediate Actions (First 30 Minutes):**

1. **Open browser console** (F12)
2. **Complete a quiz**
3. **Check console logs:**
   ```javascript
   // Look for:
   console.log('AI Feedback received:', webhookResult.data.feedback);
   // If you see this log, feedback IS being received

   // Check FeedbackScreen condition:
   console.log('Should render?', feedback && submitted && !isReplayMode);
   ```

4. **If feedback is NULL:**
   - Check webhookService.js response parsing
   - Check if response is wrapped in array: `[{...}]` instead of `{...}`
   - Add console.log to every step

5. **If feedback is NOT NULL but FeedbackScreen not rendering:**
   - Check ResultScreen.jsx line 203
   - Verify all conditions: `feedback && submitted && !isReplayMode`
   - Check React DevTools for component state

6. **Fix the broken link**
7. **Test end-to-end**
8. **Move to leaderboard debugging**

### **Priority Stack:**
1. 🔴 Fix FeedbackScreen rendering (blocks everything)
2. 🔴 Fix leaderboard update (user sees no progress)
3. 🟡 Display all analysis data (high user value)
4. 🟢 Build teacher dashboard (institution adoption)

---

**Last Updated:** November 5, 2025
**Next Review:** After Sprint 1 completion
**Estimated Time to MVP:** 3-4 weeks
**Estimated Time to Full Launch:** 6-8 weeks
