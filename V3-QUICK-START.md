# 🚀 Fluence Quiz V3 - Quick Start Guide

**Status:** ✅ v3 Schema Applied | ⏳ Workflow Setup Needed

---

## 📂 What's Been Created

### Database Files (Already Applied ✅)
- ✅ `database/migrations/001_initial_schema.sql` - 17 tables created
- ✅ `database/seeds/002_seed_fluence_institution.sql` - Institution + Teacher + Class created
- 📝 `database/seeds/004_create_test_students.sql` - **RUN THIS NEXT** (creates Anaya, Kavya)

### n8n Workflow Files (Ready to Import)
- 📦 `n8n-workflows/Quiz-Results-Handler-v3.json` - New workflow with feedback
- 📖 `n8n-workflows/V3-WORKFLOW-SETUP-GUIDE.md` - Complete setup instructions
- 🧪 `n8n-workflows/V3-TEST-PAYLOAD.json` - Test data for workflow

### Documentation
- 📚 `database/MIGRATION-GUIDE.md` - Detailed migration guide
- ✅ `database/SETUP-CHECKLIST.md` - Step-by-step checklist
- 🎯 `V3-QUICK-START.md` - This file!

---

## 🎯 Your Next Steps (30-45 minutes)

### Step 1: Create Test Students (5 minutes)

**Run this in Supabase SQL Editor:**
```sql
-- Copy-paste from: database/seeds/004_create_test_students.sql
```

**This creates:**
- ✅ Anaya (username: `anaya`, PIN: `1234`)
- ✅ Kavya (username: `kavya`, PIN: `1234`)

**Verify:**
```sql
SELECT
  s.username,
  s.full_name,
  c.class_name,
  c.class_code
FROM students s
JOIN student_class_enrollments e ON s.id = e.student_id
JOIN classes c ON e.class_id = c.id
WHERE s.username IN ('anaya', 'kavya');
```

Expected: 2 rows (Anaya and Kavya enrolled in Class 6)

---

### Step 2: Import n8n Workflow (10 minutes)

1. **Open n8n:** https://n8n.myworkflow.top
2. **Import workflow:**
   - Workflows → Import from File
   - Upload: `n8n-workflows/Quiz-Results-Handler-v3.json`
3. **Configure 3 credentials:**
   - **Supabase PostgreSQL** (for database queries)
   - **Supabase API** (for concept mastery)
   - **Gemini API** (for feedback generation)

**Detailed instructions:** See `n8n-workflows/V3-WORKFLOW-SETUP-GUIDE.md`

---

### Step 3: Test Workflow (15 minutes)

1. **Get Required IDs from Supabase:**
   ```sql
   -- Get institution_id
   SELECT id, code FROM institutions WHERE code = 'FLUENCE';

   -- Get class_id
   SELECT id, class_code FROM classes WHERE class_code = 'FLUENCE-CLASS6-2025';

   -- Get student_id
   SELECT id, username FROM students WHERE username = 'anaya';
   ```

2. **Update Test Payload:**
   - Open: `n8n-workflows/V3-TEST-PAYLOAD.json`
   - Replace `REPLACE_WITH_INSTITUTION_ID` with your institution UUID
   - Replace `REPLACE_WITH_CLASS_ID` with your class UUID
   - Replace `REPLACE_WITH_STUDENT_ID` with Anaya's UUID

3. **Test in n8n:**
   - Open workflow in n8n
   - Click "Webhook - Quiz Submit" node
   - Click "Listen for Test Event"
   - Send test payload (use Postman or curl)

4. **Verify Results:**
   ```sql
   -- Check quiz results
   SELECT * FROM quiz_results ORDER BY created_at DESC LIMIT 1;

   -- Check feedback generated
   SELECT * FROM feedback ORDER BY created_at DESC LIMIT 1;

   -- Check weekly leaderboard
   SELECT * FROM weekly_leaderboard ORDER BY created_at DESC LIMIT 1;

   -- Check concept mastery
   SELECT * FROM concept_mastery ORDER BY updated_at DESC LIMIT 5;
   ```

---

### Step 4: Activate Workflow (2 minutes)

1. **In n8n, click "Active" toggle** (top-right)
2. **Webhook URL is now live:**
   ```
   https://n8n.myworkflow.top/webhook/quiz-submit-v3
   ```

---

### Step 5: Update Frontend (10 minutes)

Update your React app to use the new webhook:

#### A. Update `.env`
```bash
REACT_APP_N8N_WEBHOOK_URL=https://n8n.myworkflow.top/webhook/quiz-submit-v3
```

#### B. Update Webhook Service

**File:** `src/services/webhookService.js`

```javascript
export const submitQuizResults = async (quizData) => {
  const payload = {
    // 🆕 v3 required fields
    institution_id: localStorage.getItem('institution_id'),
    class_id: localStorage.getItem('class_id'),
    student_id: localStorage.getItem('student_id'),

    // Quiz data (same as v2)
    quiz_date: new Date().toISOString().split('T')[0],
    total_questions: quizData.totalQuestions,
    correct_answers: quizData.correctAnswers,
    score: quizData.score,
    time_taken_seconds: quizData.timeTaken,
    streak_count: quizData.streak,
    bonus_points: quizData.bonusPoints,
    total_points: quizData.totalPoints,

    // Detailed answers (for AI feedback)
    answers_json: {
      questions: quizData.answers,
      metadata: {
        correct_count: quizData.correctAnswers,
        incorrect_count: quizData.totalQuestions - quizData.correctAnswers,
        questions_attempted: quizData.totalQuestions,
        completion_rate: 100
      }
    }
  };

  const response = await fetch(process.env.REACT_APP_N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  // 🆕 v3 response includes feedback!
  return {
    score: result.data.score,
    weeklyRank: result.data.weekly_rank,
    totalStudents: result.data.total_students,
    feedback: result.data.feedback, // NEW: AI-generated insights
    nextMilestone: result.data.next_milestone
  };
};
```

#### C. Display Feedback on Result Screen

**File:** `src/components/ResultScreen.jsx`

```jsx
// After quiz submission:
const { score, weeklyRank, feedback } = await submitQuizResults(quizData);

// Display feedback:
<div className="feedback-section">
  <h3>Your Feedback</h3>

  {feedback.strengths.length > 0 && (
    <div className="strengths">
      <h4>💪 Strengths:</h4>
      <ul>
        {feedback.strengths.map(concept => (
          <li key={concept}>{concept}</li>
        ))}
      </ul>
    </div>
  )}

  {feedback.weaknesses.length > 0 && (
    <div className="weaknesses">
      <h4>📚 Practice These:</h4>
      <ul>
        {feedback.weaknesses.map(concept => (
          <li key={concept}>{concept}</li>
        ))}
      </ul>
    </div>
  )}

  <div className="ai-insights">
    <h4>💡 AI Insights:</h4>
    <p>{feedback.ai_insights}</p>
  </div>
</div>
```

---

## 🆕 What's New in V3?

### 1. **AI-Generated Feedback**
- ✅ Analyzes student answers
- ✅ Identifies strengths (≥80% accuracy)
- ✅ Identifies weaknesses (<60% accuracy)
- ✅ Gemini generates personalized insights
- ✅ Saved to database for teacher dashboard

### 2. **Weekly Leaderboard (Changed from Daily)**
- ✅ Accumulates points Monday-Sunday
- ✅ Resets every Monday
- ✅ Shows weekly rank (not daily)
- ✅ Better for student motivation

### 3. **Multi-Class Support**
- ✅ Students can join multiple classes
- ✅ Each quiz linked to institution + class
- ✅ Leaderboard per class
- ✅ Concept mastery tracked per student (across all classes)

### 4. **Enhanced Response**
- ✅ Includes feedback in webhook response
- ✅ Frontend can show insights immediately
- ✅ No need for separate API call

---

## 📊 Expected Workflow Response

When frontend submits quiz, it receives:

```json
{
  "success": true,
  "message": "Quiz submitted successfully! Check your feedback below.",
  "data": {
    "score": 70.0,
    "weekly_rank": 2,
    "total_students": 5,

    "feedback": {
      "strengths": ["Indefinite Articles", "Subject-Verb Agreement"],
      "weaknesses": ["Definite Articles", "Past Perfect Tense"],
      "ai_insights": "Great job on mastering indefinite articles! Your understanding of subject-verb agreement is solid. However, I noticed you're struggling with definite articles—try practicing the difference between 'the' and 'a/an' in context. Keep up the effort!"
    },

    "next_milestone": "💪 Keep going! 1 spot to top!"
  }
}
```

---

## ✅ Success Checklist

**Database:**
- [ ] ✅ 17 tables exist in Supabase
- [ ] ✅ Institution: FLUENCE
- [ ] ✅ Teacher: aman@fluence.ac
- [ ] ✅ Class: FLUENCE-CLASS6-2025
- [ ] 📝 Test students created (Anaya, Kavya)

**n8n Workflow:**
- [ ] Workflow imported
- [ ] Credentials configured (Supabase PostgreSQL, Supabase API, Gemini API)
- [ ] Test payload executed successfully
- [ ] Feedback generated with AI insights
- [ ] Weekly leaderboard updated
- [ ] Workflow activated

**Frontend:**
- [ ] `.env` updated with new webhook URL
- [ ] `webhookService.js` sends institution_id, class_id, student_id
- [ ] Result screen displays feedback
- [ ] Weekly leaderboard (not daily)

---

## 🔄 Migration Path

### If Coming from V2:

**Option A: Fresh Start (Recommended)**
- ✅ Already done! You applied v3 schema fresh
- No old data to migrate
- Ready to go!

**Option B: Migrate Old Data (Not Recommended)**
- You have old quiz results for Anaya/Kavya
- Would need to run data migration scripts
- Probably not worth it for testing

**Your Choice:** Fresh start ✅

---

## 🆘 Need Help?

**Documentation:**
- `n8n-workflows/V3-WORKFLOW-SETUP-GUIDE.md` - Complete n8n setup
- `database/MIGRATION-GUIDE.md` - Database migration details
- `database/SETUP-CHECKLIST.md` - Step-by-step checklist

**Troubleshooting:**
- Check Supabase logs: Dashboard → Database → Logs
- Check n8n execution history: Dashboard → Executions
- Verify credentials are correct
- Check UUIDs are valid (not strings)

**Common Issues:**
- **Gemini 400 Error:** Check API key, verify quota (15 req/min)
- **Missing institution_id:** Frontend must send from login
- **Feedback not generated:** Check Gemini credential, answers_json format
- **Leaderboard not updating:** Verify PostgreSQL credential

---

## 🎯 Next Steps After Setup

Once v3 is working:

1. **Test with Anaya/Kavya**
   - Login → Take quiz → Check feedback
   - Verify weekly leaderboard updates
   - Check teacher can view feedback in database

2. **Build Feedback UI**
   - Show strengths/weaknesses on result screen
   - Make it beautiful (Duolingo-style)
   - Add animations for feedback reveal

3. **Build Teacher Dashboard**
   - View all student feedback
   - Download weekly reports as PDF
   - Edit questions before they go live

4. **Add Voice Input (Week 7-8)**
   - Replace typing with voice for short answers
   - Much better UX for students

---

## 💡 Remember the Vision

This is **Jarvis for Education**:
- ✅ AI knows students better than they know themselves (concept mastery tracking)
- ✅ Makes learning beautiful and exciting (gamification + feedback)
- ✅ Solves Forgetting Curve (SRS algorithm)
- ✅ Provides complete transparency (feedback + reports)
- ✅ Automates teacher's busy work (AI feedback, auto-grading)

**Every feature must enhance learning, save teacher time, and show proof to parents.**

---

**Ready to start? Run Step 1! 🚀**

**Estimated Total Time:** 30-45 minutes

**Last Updated:** 2025-10-27
