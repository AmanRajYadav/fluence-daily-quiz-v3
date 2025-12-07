# FLUENCE QUIZ V2 - MASTER PLAN (PART 2 of 2)

**⚠️ THIS IS PART 2 OF 2** - Read [MASTER-PLAN-PART-1.md](MASTER-PLAN-PART-1.md) first!

**This file continues from Part 1.**

**Version:** 2.0
**Created:** 2025-10-26
**Last Updated:** 2025-10-26
**File Size:** 1,294 lines (Part 2) | 2,544 total
**Domains:** fluence.ac (primary), fluence.institute (future)

---

## 📋 TABLE OF CONTENTS (PART 2)

7. [Development Roadmap - Week 5-6 continued](#week-5-6-teacher-dashboard)
8. [Development Roadmap - Week 7-12](#week-7-12)
9. [Feature Specifications](#feature-specifications)
10. [Budget & Pricing Strategy](#budget--pricing-strategy)
11. [TODO Tracking](#todo-tracking)
12. [Past Learnings & Solved Problems](#past-learnings--solved-problems)
13. [AI Agent Instructions](#ai-agent-instructions)
14. [Success Metrics](#success-metrics)
15. [Tech Stack Philosophy & Research Strategy](#tech-stack-philosophy--research-strategy)

---

## Continuation from Part 1...

### WEEK 5-6: TEACHER DASHBOARD (Continued)

- ✅ Teacher can edit any question
- ✅ Edits are tracked in database
- ✅ Manual question creation works

---

#### Sprint 3.4: Class Management (Days 31-33)

**Tasks:**
- [ ] Create ClassManagement component
- [ ] List all classes
- [ ] Add "Create Class" button
- [ ] Build CreateClassModal
- [ ] Implement add/remove students
- [ ] Bulk student import (CSV upload)
- [ ] Test with sample CSV
- [ ] Display class analytics

**CSV Format:**
```csv
name,grade,subjects,parent_phone,password
Anaya,6th,"Math,English",+917999502978,anaya123
Kavya,6th,"Math,English,Science",+917999502978,kavya123
```

**Files to Create:**
- `src/components/Teacher/ClassManagement.jsx`
- `src/components/Teacher/CreateClassModal.jsx`
- `src/utils/csvParser.js`

**Acceptance Criteria:**
- ✅ Teacher can create classes
- ✅ Teacher can add/remove students
- ✅ Bulk import works with CSV
- ✅ Class analytics are accurate

---

### WEEK 7-8: WEEKLY REPORTS + VOICE INPUT

**Goal:** Parents get weekly insights, students can speak answers

#### Sprint 4.1: Weekly Leaderboard (Days 34-36)

**Tasks:**
- [ ] Update leaderboard logic (daily → weekly)
- [ ] Implement week start/end dates (Monday-Sunday)
- [ ] Migrate existing leaderboard data
- [ ] Update LeaderboardScreen component
- [ ] Show "This Week" rankings
- [ ] Add "Past Weeks" history
- [ ] Implement Monday reset (n8n cron job)
- [ ] Test across week boundary

**n8n Workflow (New):**
```
Cron Trigger: Every Monday 12:01 AM
  ↓
Calculate last week's rankings
  ↓
Archive to weekly_leaderboard
  ↓
Reset current week counters
```

**Files to Modify:**
- `src/components/LeaderboardScreen.jsx`
- `src/components/HistoricalLeaderboard.jsx`
- `n8n-workflows/weekly-leaderboard-reset.json`

**Acceptance Criteria:**
- ✅ Leaderboard shows weekly rankings
- ✅ Resets every Monday
- ✅ Past weeks are archived
- ✅ Students can see historical winners

---

#### Sprint 4.2: Automated Weekly Reports (Days 37-40)

**Tasks:**
- [ ] Create n8n workflow: "Weekly Report Generator"
- [ ] Cron trigger: Every Sunday 8 PM
- [ ] Query all quizzes from past 7 days
- [ ] Calculate metrics (avg score, total quizzes, concepts)
- [ ] Query concept_mastery for improvements
- [ ] Call Gemini API for AI summary
- [ ] Generate HTML email template
- [ ] Send via WhatsApp (existing setup)
- [ ] Save to weekly_reports table
- [ ] Test with Anaya's parent

**Gemini Prompt for AI Summary:**
```
You are generating a weekly learning report for a student.

Student: Anaya
Grade: 6th
Subject: English Grammar

This week's data:
- Total quizzes: 5/5 (100% completion)
- Average score: 76% (↑ 8% from last week)
- Concepts mastered this week: Indefinite Articles (0% → 82%)
- Concepts struggling: Definite Articles (35%), Past Perfect (58%)

Generate a 2-3 paragraph summary that:
1. Celebrates achievements
2. Identifies areas for practice
3. Gives actionable recommendations
4. Encourages continued effort

Tone: Warm, encouraging, parent-friendly
```

**Email Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Duolingo-inspired email styling */
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Anaya's Weekly Report</h1>
    <p class="date">Week of Jan 20-26, 2025</p>

    <div class="stats">
      <div class="stat">
        <span class="number">5/5</span>
        <span class="label">Quizzes</span>
      </div>
      <div class="stat">
        <span class="number">76%</span>
        <span class="label">Avg Score</span>
      </div>
      <div class="stat">
        <span class="number">340</span>
        <span class="label">Points</span>
      </div>
    </div>

    <h2>🎯 Mastered This Week:</h2>
    <ul>
      <li>Indefinite Articles (82%)</li>
      <li>Subject-Verb Agreement (78%)</li>
    </ul>

    <h2>📚 Needs More Practice:</h2>
    <ul>
      <li>Definite Articles (35%)</li>
      <li>Past Perfect Tense (58%)</li>
    </ul>

    <h2>💡 AI Insights:</h2>
    <p>{{ ai_generated_summary }}</p>

    <div class="actions">
      <a href="...">View Full Report</a>
      <a href="...">Practice Worksheets</a>
    </div>
  </div>
</body>
</html>
```

**Files to Create:**
- `n8n-workflows/weekly-report-generator.json`
- `email-templates/weekly-report.html`

**Acceptance Criteria:**
- ✅ Parents receive report every Sunday
- ✅ Report is accurate and personalized
- ✅ AI insights are helpful
- ✅ Parents can click through to detailed view

---

#### Sprint 4.3: Voice Input (Days 41-44)

**Goal:** Fix typing frustration with voice input (like Duolingo)

**Tasks:**
- [ ] Research Web Speech API
- [ ] Create VoiceInput component
- [ ] Implement voice recording
- [ ] Add waveform visualization
- [ ] Transcribe speech to text
- [ ] Add to ShortAnswerQuestion component
- [ ] Add fallback to typing
- [ ] Test on mobile (Chrome/Safari)
- [ ] Add voice button UI (microphone icon)
- [ ] Handle permissions (microphone access)

**Component Structure:**
```jsx
<VoiceInput
  onTranscript={(text) => setAnswer(text)}
  placeholder="Tap mic to speak or type here..."
/>
```

**Implementation:**
```javascript
const startRecording = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onTranscript(transcript);
  };

  recognition.start();
};
```

**Files to Create:**
- `src/components/VoiceInput/VoiceInput.jsx`
- `src/components/VoiceInput/Waveform.jsx`

**Acceptance Criteria:**
- ✅ Students can tap microphone to speak
- ✅ Speech transcribes accurately
- ✅ Waveform shows during recording
- ✅ Fallback to typing works
- ✅ Works on mobile Chrome
- ✅ Anaya/Kavya confirm it's easier than typing

---

### WEEK 9-10: RAPID FIRE MODE

**Goal:** Infinite quiz based on weak concepts, separate leaderboard

#### Sprint 5.1: Rapid Fire Game Logic (Days 45-48)

**Tasks:**
- [ ] Create RapidFireGame component
- [ ] Implement infinite question generator
- [ ] Query weak concepts (mastery_score < 60%)
- [ ] Pull questions from past quizzes
- [ ] Implement lives system (3 hearts)
- [ ] Lose life on wrong answer
- [ ] Game over at 0 lives
- [ ] Track streak (consecutive correct)
- [ ] Update rapid_fire_leaderboard table
- [ ] Add sound effects (life lost, streak milestone)

**Question Selection Algorithm:**
```
Priority Order:
1. Concepts with mastery_score < 40% (50% of questions)
2. Concepts with mastery_score 40-60% (30%)
3. Random from past quizzes (20%)

Randomize within each category
Never repeat same question in same session
```

**Files to Create:**
- `src/components/RapidFire/RapidFireGame.jsx`
- `src/components/RapidFire/LivesDisplay.jsx`
- `src/services/rapidFireService.js`

**Acceptance Criteria:**
- ✅ Questions pull from weak concepts
- ✅ Lives decrease on wrong answers
- ✅ Game ends at 0 lives
- ✅ Streak counter works
- ✅ Data saves to leaderboard

---

#### Sprint 5.2: Rapid Fire Leaderboard (Days 49-51)

**Tasks:**
- [ ] Create RapidFireLeaderboard component
- [ ] Display all-time highest streaks
- [ ] Show rank based on highest_streak
- [ ] Add "Your Best" section
- [ ] Implement sorting (highest streak first)
- [ ] Add animations for rank changes
- [ ] Test with multiple students

**Files to Create:**
- `src/components/RapidFire/RapidFireLeaderboard.jsx`

**Acceptance Criteria:**
- ✅ Shows all students' best streaks
- ✅ Updates in real-time
- ✅ Student can see their rank
- ✅ Leaderboard is motivating

---

#### Sprint 5.3: Rapid Fire UI (Days 52-54)

**Tasks:**
- [ ] Design game screen (fast-paced, colorful)
- [ ] Add timer visual (countdown bar)
- [ ] Show streak counter prominently
- [ ] Add lives display (hearts)
- [ ] Create game over screen
- [ ] Show stats (questions answered, time played)
- [ ] Add "Play Again" button
- [ ] Style with vibrant colors (orange/red theme)

**Design Reference:**
- Fast-paced arcade game feel
- Bold colors and large text
- Immediate feedback on answers
- Celebration animations on streaks

**Files to Modify:**
- `src/components/RapidFire/RapidFireGame.jsx`
- `src/components/RapidFire/GameOverScreen.jsx`

**Acceptance Criteria:**
- ✅ UI is exciting and fast-paced
- ✅ Lives/streak/timer are clear
- ✅ Game over screen is encouraging
- ✅ Students want to play again

---

### WEEK 11-12: POLISH & DEPLOYMENT

**Goal:** Production-ready, tested with 2-3 teachers

#### Sprint 6.1: Testing & Bug Fixes (Days 55-58)

**Tasks:**
- [ ] Test all features with Anaya/Kavya
- [ ] Collect feedback from 2-3 teacher friends
- [ ] Create bug tracker (GitHub Issues)
- [ ] Fix all critical bugs
- [ ] Optimize performance (React.memo, lazy loading)
- [ ] Test on mobile devices (Chrome, Safari)
- [ ] Test on desktop browsers (Chrome, Firefox, Edge)
- [ ] Load testing (simulate 50 students)
- [ ] Fix any UI glitches
- [ ] Ensure all animations are smooth

**Testing Checklist:**
- [ ] Login/logout works
- [ ] Quiz flow works end-to-end
- [ ] Feedback shows correctly
- [ ] Teacher dashboard loads
- [ ] Weekly reports send
- [ ] Voice input works on mobile
- [ ] Rapid Fire mode works
- [ ] Leaderboard updates in real-time
- [ ] All pages are responsive
- [ ] No console errors

---

#### Sprint 6.2: Teacher Onboarding (Days 59-61)

**Tasks:**
- [ ] Create onboarding tutorial (interactive walkthrough)
- [ ] Write teacher documentation
- [ ] Record video walkthrough (Loom/YouTube)
- [ ] Create FAQ document
- [ ] Set up support system (WhatsApp group)
- [ ] Design quick reference guide (PDF)
- [ ] Test onboarding with non-tech teacher

**Documentation Topics:**
- How to add students
- How to edit questions
- How to view reports
- How to interpret analytics
- Troubleshooting common issues

**Files to Create:**
- `docs/teacher-guide.md`
- `docs/faq.md`
- `public/teacher-onboarding-video.mp4`

---

#### Sprint 6.3: Production Deployment (Days 62-66)

**Tasks:**
- [ ] Configure custom domain (fluence.ac or fluence.institute - already owned!)
- [ ] Deploy to Vercel/Netlify (better than GitHub Pages)
- [ ] Set up SSL certificate (automatic with Vercel/Netlify)
- [ ] Configure environment variables
- [ ] Set up error monitoring (Sentry)
- [ ] Set up analytics (Mixpanel or PostHog)
- [ ] Implement backup system (Supabase backups)
- [ ] Create staging environment for testing
- [ ] Test production deployment
- [ ] Monitor performance

**Deployment Checklist:**
- [ ] Domain configured
- [ ] SSL enabled
- [ ] Environment variables set
- [ ] Database migration ran
- [ ] n8n workflows deployed
- [ ] Error monitoring active
- [ ] Analytics tracking
- [ ] Backup system running

**Monitoring Setup:**
```javascript
// Sentry error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Acceptance Criteria:**
- ✅ App deployed to custom domain
- ✅ HTTPS enabled
- ✅ No errors in production
- ✅ Analytics tracking users
- ✅ 2-3 teachers successfully onboarded
- ✅ Ready for first paying customers

---

## 📋 FEATURE SPECIFICATIONS

### 1. Smart Feedback System

**Purpose:** Help students learn from mistakes with AI-powered insights

**Components:**
1. **Immediate Explanations**
   - Shows after wrong answer
   - 2-3 sentences explaining why correct answer is right
   - Links to concept for more practice

2. **Post-Quiz Feedback Screen**
   - Displays strengths (concepts mastered)
   - Displays weaknesses (concepts to practice)
   - AI-generated insights (Gemini)
   - Downloadable practice worksheet

3. **Practice Worksheets**
   - Auto-generated for weak concepts
   - 10 targeted practice problems
   - PDF format, downloadable
   - Teacher can approve before sending

**Technical Details:**
- n8n workflow generates feedback after quiz submission
- Gemini API analyzes answers_json
- Feedback stored in database
- Frontend displays feedback on ResultScreen

---

### 2. Teacher Dashboard

**Purpose:** Give teachers complete visibility and control

**Sections:**

**A. Overview Dashboard**
- Stats cards (students, quizzes, avg score, engagement)
- Alerts panel (struggling students, missed quizzes, score drops)
- Class performance summary
- Recent activity feed

**B. Student Detail View**
- Individual progress chart (30-day trend)
- Concept mastery heatmap (color-coded)
- Quiz history with filters
- Send custom feedback form

**C. Question Editor**
- View all auto-generated questions
- Edit question text, options, answers, explanations
- Track edits in database
- Approve/reject questions
- Manually create questions

**D. Class Management**
- Create/edit classes
- Add/remove students
- Bulk import from CSV
- Class-level analytics

**Technical Details:**
- Role-based access (admin, teacher, viewer)
- Real-time updates via Supabase Realtime
- Responsive design (mobile + desktop)
- Export data to CSV

---

### 3. Weekly Reports

**Purpose:** Keep parents informed with automated insights

**Content:**
- This week's stats (quizzes, avg score, points, rank)
- Concepts mastered this week
- Concepts needing practice
- AI-generated summary (Gemini)
- Recommended actions
- Links to detailed view and practice worksheets

**Delivery:**
- Sent every Sunday 8 PM
- WhatsApp message with HTML email
- Saved to database for history

**Technical Details:**
- n8n cron job triggers Sunday 8 PM
- Queries quiz_results for past 7 days
- Gemini generates personalized summary
- HTML template rendered
- WhatsApp API sends message

---

### 4. Voice Input

**Purpose:** Reduce typing frustration for short answers

**Implementation:**
- Web Speech API (browser native, free)
- Microphone button on ShortAnswerQuestion
- Waveform visualization during recording
- Transcription displayed in real-time
- Fallback to typing if browser unsupported

**UX Flow:**
1. Student taps microphone icon
2. Browser requests permission
3. Student speaks answer
4. Waveform animates
5. Transcript appears in text field
6. Student can edit or re-record
7. Submit answer

**Technical Details:**
- Uses `SpeechRecognition` API
- Language: 'en-US' (configurable)
- Interim results shown during speaking
- Final transcript saved on end
- HTTPS required (works on GitHub Pages/Vercel)

---

### 5. Rapid Fire Mode

**Purpose:** Infinite practice focused on weak concepts with gamification

**Features:**
- Infinite question generator (pulls from past quizzes)
- Prioritizes weak concepts (mastery_score < 60%)
- Lives system (3 hearts, lose 1 per wrong answer)
- Game over at 0 lives
- Streak counter (consecutive correct)
- Separate leaderboard (highest streak)
- Fast-paced UI (arcade game feel)

**Question Selection:**
```
50% - Concepts with mastery < 40% (struggling)
30% - Concepts with mastery 40-60% (improving)
20% - Random from all past quizzes (variety)
```

**Leaderboard:**
- All-time highest streak per student
- Rank by highest_streak DESC
- Shows total attempts and last played date

**Technical Details:**
- Real-time question fetching from database
- Lives and streak tracked in component state
- Final score saved to rapid_fire_leaderboard
- Sound effects on life lost, streak milestones

---

### 6. History Feature (Access Past Quizzes)

**Purpose:** Students can review and replay past quizzes

**Features:**

**A. Quiz History View**
- Calendar view showing all quiz dates
- Filter by date range (last 7 days, 30 days, 90 days)
- List view with scores and dates
- Search by concept or subject

**B. Quiz Replay Mode**
- Load past quiz questions from database
- Review mode (no points awarded)
- See correct/wrong answers
- View explanations
- Track which questions were answered correctly
- Compare past performance

**C. Notes Access**
- View class notes from any date
- Filter by subject
- Search by keywords/concepts
- Download notes as PDF

**Technical Details:**
- Query `quiz_history` table for past quizzes
- Query `notes_history` table for past notes
- Display in calendar component (react-calendar)
- Replay uses same question components
- Flag `isReplayMode` to disable scoring

**UI Components:**
```
src/components/History/
  ├─ History.jsx               (main container)
  ├─ QuizCalendar.jsx         (calendar view)
  ├─ QuizHistoryList.jsx      (list view)
  ├─ QuizReplay.jsx           (replay mode)
  ├─ NotesHistory.jsx         (past notes)
  └─ ProgressChart.jsx        (already exists)
```

**Database Queries:**
```sql
-- Get all quiz dates for student
SELECT DISTINCT quiz_date
FROM quiz_results
WHERE student_id = $1
ORDER BY quiz_date DESC;

-- Get quiz details for specific date
SELECT qh.*, qr.answers_json
FROM quiz_history qh
JOIN quiz_results qr ON qh.id = qr.id
WHERE qh.student_id = $1 AND qh.quiz_date = $2;

-- Get notes for date range
SELECT * FROM notes_history
WHERE student_id = $1
  AND note_date BETWEEN $2 AND $3
ORDER BY note_date DESC;
```

**Acceptance Criteria:**
- ✅ Students can see all past quiz dates
- ✅ Students can replay any past quiz
- ✅ Replay mode shows explanations
- ✅ Students can access past class notes
- ✅ Search and filtering work correctly

---

## 💰 BUDGET & PRICING STRATEGY

### Monthly Operating Costs

**Phase 1: Testing (Months 1-3, 0-10 students)**
- Supabase: ₹0 (Free tier - 500MB DB, 2GB bandwidth)
- n8n: ₹100 (GCP VM - existing)
- Gemini API: ₹500 (question generation + feedback)
- Domain: ₹70/month (₹800/year)
- **Total: ~₹670/month**

**Phase 2: Beta (Months 4-6, 10-50 students)**
- Supabase: ₹2000 (Pro tier - 8GB DB, 50GB bandwidth)
- n8n: ₹100
- Gemini API: ₹1500 (50 students × ₹30/student)
- Email service: ₹300 (SendGrid/Mailgun)
- Domain: ₹70
- **Total: ~₹3970/month**

**Phase 3: Growth (Months 7+, 50-100 students)**
- Supabase: ₹2000 (Pro tier sufficient up to 100 students)
- n8n: ₹100
- Gemini API: ₹2500 (100 students × ₹25/student)
- Email: ₹500
- CDN/Storage: ₹500
- Monitoring: ₹200 (Sentry)
- **Total: ~₹5800/month**

### Revenue Projections

**Pricing Tiers:**

**Tier 1: Personal Tutors** - ₹100/student/month
- 1 teacher (admin role)
- Up to 20 students
- All core features
- WhatsApp support
- **Target:** 50% of customers

**Tier 2: Coaching Centers** - ₹150/student/month
- Up to 5 teachers
- Up to 100 students
- Teacher dashboard
- Weekly reports
- Email + WhatsApp support
- **Target:** 40% of customers

**Tier 3: Schools** - ₹200/student/month
- Unlimited teachers
- 100+ students
- Class-level analytics
- Custom branding (future)
- Priority support
- **Target:** 10% of customers

**Break-Even Analysis:**

**Month 1-3 (Testing):** ₹670/month cost
- Break-even: 7 students × ₹100/month = ₹700/month
- **Goal:** Validate with 2-3 students (Anaya, Kavya, others)

**Month 4-6 (Beta):** ₹3970/month cost
- Break-even: 27 students × ₹150/month avg = ₹4050/month
- **Goal:** 50 students × ₹150 = ₹7500/month (88% profit margin)

**Month 7-12 (Growth):** ₹5800/month cost
- Break-even: 39 students × ₹150/month avg = ₹5850/month
- **Goal:** 100 students × ₹150 = ₹15,000/month (61% profit margin)

**Year 1 Target:**
- 200 students by Month 12
- Avg ₹150/student/month
- Revenue: ₹30,000/month
- Costs: ₹8,000/month
- **Profit: ₹22,000/month (73% margin)**

---

## 📊 TODO TRACKING

### Current Sprint: Week 1-2 (Foundation & Auth)

**Status:** Planning → In Progress
**Start Date:** [To be filled when starting]
**End Date:** [To be filled]

**Sprint Goal:** Complete institution-based architecture + persistent login

#### Tasks (Detailed)

**Day 1: Database Planning**
- [ ] Review current schema
- [ ] Design new tables (institutions, teachers, etc.)
- [ ] Plan migration strategy
- [ ] Write migration SQL script
- [ ] Create seed data for testing

**Day 2: Database Migration**
- [ ] Execute migration on local database
- [ ] Test all foreign keys
- [ ] Migrate Anaya/Kavya data
- [ ] Verify no data loss
- [ ] Document migration process

**Day 3: Database Testing**
- [ ] Test all existing queries still work
- [ ] Write new queries for institution model
- [ ] Test RLS policies
- [ ] Performance testing
- [ ] Backup database

**Day 4: Auth Service Setup**
- [ ] Install dependencies (bcrypt, jsonwebtoken)
- [ ] Create authService.js
- [ ] Implement password hashing
- [ ] Implement JWT generation
- [ ] Write unit tests

**Day 5: Login UI**
- [ ] Design LoginScreen mockup
- [ ] Build LoginScreen component
- [ ] Implement form validation
- [ ] Add error handling
- [ ] Style with Duolingo colors

**Day 6: Session Management**
- [ ] Implement localStorage persistence
- [ ] Create ProtectedRoute component
- [ ] Add logout functionality
- [ ] Test session expiry
- [ ] Handle token refresh

**Day 7: Role-Based Routing**
- [ ] Create student routes
- [ ] Create teacher routes
- [ ] Implement role detection
- [ ] Test routing logic
- [ ] Fix any bugs

**Day 8: Design System**
- [ ] Install Nunito font
- [ ] Create design-system.css
- [ ] Define CSS variables
- [ ] Create reusable components
- [ ] Test color palette

**Day 9: UI Redesign (Student)**
- [ ] Redesign home screen
- [ ] Build bottom navigation
- [ ] Update all buttons
- [ ] Add animations
- [ ] Test on mobile

**Day 10: UI Polish**
- [ ] Fix any UI bugs
- [ ] Optimize performance
- [ ] Test with Anaya/Kavya
- [ ] Gather feedback
- [ ] Iterate

---

### Upcoming Sprints

**Week 3-4: Smart Feedback System**
- Status: Planned
- Priority: High
- Dependencies: Week 1-2 complete

**Week 5-6: Teacher Dashboard**
- Status: Planned
- Priority: High
- Dependencies: Week 1-4 complete

**Week 7-8: Weekly Reports + Voice Input**
- Status: Planned
- Priority: High
- Dependencies: Week 1-6 complete

**Week 9-10: Rapid Fire Mode**
- Status: Planned
- Priority: Medium
- Dependencies: Week 1-8 complete

**Week 11-12: Polish & Deployment**
- Status: Planned
- Priority: Critical
- Dependencies: All previous weeks complete

---

## 🧠 PAST LEARNINGS & SOLVED PROBLEMS

### From Previous Development (Phase 1)

#### SOLVED: Match Question State Persistence
**Problem:** Match questions auto-submitted on load after first match question
**Root Cause:** React state persisted across question changes
**Solution:** Added useEffect to reset matches when question.id changes
**Files:** `src/components/QuestionTypes/MatchQuestion.jsx`
**Lesson:** Always reset component state when props change, especially for multi-instance question types

#### SOLVED: SQL Quote Escaping in n8n
**Problem:** Questions with single quotes broke SQL inserts
**Root Cause:** PostgreSQL requires quotes to be doubled (`''`)
**Solution:** Replace `'` with `''` in JSON strings before insertion
**Lesson:** Always escape user input in SQL, use `.replace(/'/g, "''")`

#### SOLVED: 50/50 Power-Up Options Not Hidden
**Problem:** 50/50 clicked but options still visible
**Root Cause:** String comparison failed due to whitespace
**Solution:** Use `.some()` with `.trim()` for robust comparison
**Lesson:** Never trust database strings to be clean, always trim

#### SOLVED: Timer Removal for Learning Focus
**Problem:** Timer added pressure, reduced learning quality
**Solution:** Removed timer entirely, focused on streak-based scoring
**Lesson:** Gamification should enhance learning, not stress students

#### SOLVED: Daily Leaderboard Too Frequent
**Problem:** Daily reset felt too rushed, low engagement
**Solution:** Changed to weekly leaderboard (Monday-Sunday)
**Lesson:** Weekly competition feels more achievable and motivating

#### SOLVED: n8n Expression Path Confusion
**Problem:** Data not inserting because wrong expression path
**Root Cause:** Webhook data in `$json.body`, not `$('Node').item.json`
**Solution:** Use correct path based on node type
**Lesson:** Always inspect node output before writing expressions

#### SOLVED: Points Not Persisting on Refresh
**Problem:** Total points showed 0 after page refresh
**Root Cause:** Points only loaded on initial login, not on menu return
**Solution:** Added useEffect to reload points when gameState === 'menu'
**Lesson:** State needs to refresh when component mounts, not just once

#### SOLVED: Short Answer Submit Button Redundant
**Problem:** Two buttons needed (Submit Answer → Next Question)
**Root Cause:** onBlur already submitted answer
**Solution:** Removed Submit button, kept only Next button
**Lesson:** Minimize clicks, trust blur events for form submission

---

### Critical n8n Learnings

**n8n Execution Order:**
- Branches execute **sequentially, top to bottom** (NOT parallel)
- If Node A has 2 branches, top branch executes completely, then bottom branch
- Use this for dependencies (e.g., deactivate old questions BEFORE inserting new)

**n8n Expression Syntax:**
- Use `{{ }}` ONLY for node data references
- NEVER use `{{ }}` for static values (API keys, JWTs)
- For cross-node references: `{{ $('Node Name').first().json.field }}`
- For current node: `{{ $json.field }}`

**n8n Query Parameters:**
- Use dedicated Query Parameters section, not URL string
- Dynamic values need "Expression" mode
- Static values use "Fixed" mode

**PostgreSQL in n8n:**
- Column names must be exact (snake_case)
- Single quotes in strings must be doubled: `'` → `''`
- JSONB casting: `'{"key":"value"}'::jsonb`
- UPSERT pattern: `INSERT ... ON CONFLICT ... DO UPDATE`

---

### UI/UX Learnings

**Student Feedback (3 Months):**
- ✅ Quiz is engaging, students demand it daily
- ✅ Gamification works (streak, points, leaderboard)
- ✅ Questions exactly match class content (Gemini is good)
- 🔴 Typing short answers is frustrating → Need voice input
- 🟡 Daily leaderboard too frequent → Weekly is better
- 🟢 Sound effects and animations appreciated

**Teacher Feedback:**
- ✅ Questions quality impresses teachers
- ✅ Auto-generation saves massive time
- ❌ Need dashboard to see all students at once
- ❌ Need ability to edit questions before they go live
- ❌ Want weekly reports for parents automatically

**Parent Feedback (Indirect):**
- ✅ Parents read the summary reports
- ❌ Want more visibility into what's being learned
- ❌ Want proof of improvement (concept mastery scores)

---

### Technical Debt to Avoid

**DON'T:**
- ❌ Store passwords in plain text (always bcrypt hash)
- ❌ Expose SERVICE_ROLE_KEY in frontend
- ❌ Skip RLS policies for convenience
- ❌ Use student names as primary keys (use UUIDs)
- ❌ Delete data (mark as inactive instead)
- ❌ Mix authentication logic in components (use service layer)

**DO:**
- ✅ Use transactions for multi-table updates
- ✅ Add indexes on frequently queried columns
- ✅ Validate all user input (frontend AND backend)
- ✅ Log all errors to monitoring service
- ✅ Test on mobile devices early and often
- ✅ Keep components small and focused

---

## 🤖 AI AGENT INSTRUCTIONS

### For Claude Code / Future AI Assistants

**When building Fluence Quiz v2, you MUST:**

#### 1. Context Loading (CRITICAL)
- ✅ ALWAYS read this file (`MASTER-PLAN-QUIZ-V2.md`) FIRST
- ✅ Check TODO section for current sprint and tasks
- ✅ Review Past Learnings section before starting work
- ✅ Read original context files for additional details:
  - `context/context1A.md` - Historical context
  - `context/context1B.md` - Recent decisions
  - `context/context1C.md` - Latest solved problems
  - `TODO.md` - Session-based tracking

#### 2. Before Writing Code
- ✅ Verify the task is in the current sprint TODO
- ✅ Check if similar problem was solved before (Past Learnings)
- ✅ Read feature specification from this file
- ✅ Understand the database schema
- ✅ Follow UI/UX design system (Duolingo-style)

#### 3. Coding Standards
- ✅ React 19 with functional components and hooks
- ✅ Use TailwindCSS for styling (with design system CSS variables)
- ✅ Mobile-first responsive design
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Error boundaries for all major components
- ✅ Loading states for async operations
- ✅ PropTypes or TypeScript for type safety

#### 4. Database Operations
- ✅ Never delete data (mark as `active = false`)
- ✅ Use transactions for multi-table updates
- ✅ Always use parameterized queries (prevent SQL injection)
- ✅ Add indexes on foreign keys and frequently queried columns
- ✅ Test queries with EXPLAIN ANALYZE for performance
- ✅ Use UUIDs for all primary keys

#### 5. n8n Workflow Development
- ✅ Document workflow purpose and trigger
- ✅ Use descriptive node names
- ✅ Always escape single quotes in SQL: `'` → `''`
- ✅ Use correct expression paths (`$json.body` vs `$('Node').json`)
- ✅ Test each node individually before connecting
- ✅ Handle errors gracefully (don't let workflows fail silently)

#### 6. UI Development
- ✅ Follow Duolingo design principles (cute, colorful, minimal)
- ✅ Use design system colors and typography
- ✅ Add animations with Framer Motion
- ✅ Test on mobile Chrome and Safari
- ✅ Ensure 60fps animations (use React.memo, lazy loading)
- ✅ Add loading skeletons (not spinners)

#### 7. Testing
- ✅ Test with real data (Anaya, Kavya)
- ✅ Test error states (network failure, empty data)
- ✅ Test edge cases (0 students, 1000 students)
- ✅ Test on slow network (throttle to 3G)
- ✅ Test keyboard navigation
- ✅ Test screen readers (basic accessibility)

#### 8. After Completing Work
- ✅ Update TODO section (mark tasks complete)
- ✅ Add new solved problem to Past Learnings (if applicable)
- ✅ Update this file with any important discoveries
- ✅ List all files changed
- ✅ Provide testing checklist
- ✅ Suggest next tasks

#### 9. Communication Style
- ✅ Be direct and concise
- ✅ Explain WHY, not just WHAT
- ✅ Highlight potential issues proactively
- ✅ Suggest alternatives with trade-offs
- ✅ Ask clarifying questions if requirements unclear

#### 10. When to Ask for Help
- ❓ Unclear requirements or acceptance criteria
- ❓ Multiple valid approaches (need user preference)
- ❓ Breaking change that affects other features
- ❓ Budget implications (new paid service needed)
- ❓ Stuck on same problem for >30 minutes

---

### Common Pitfalls to Avoid

**Authentication:**
- ❌ Don't store JWT in localStorage if it contains sensitive data
- ❌ Don't skip HTTPS in production
- ❌ Don't use weak passwords (enforce 8+ characters)
- ❌ Don't expose password hashing salt

**Database:**
- ❌ Don't use string IDs (use UUIDs)
- ❌ Don't cascade delete critical data
- ❌ Don't forget to add indexes
- ❌ Don't skip migrations (always version database changes)

**React:**
- ❌ Don't fetch in render (use useEffect)
- ❌ Don't mutate state directly
- ❌ Don't forget cleanup in useEffect
- ❌ Don't put functions in useEffect deps without useCallback

**n8n:**
- ❌ Don't use `{{ }}` for static values
- ❌ Don't assume branches run in parallel (they're sequential)
- ❌ Don't skip SQL escaping
- ❌ Don't ignore error handling

---

## ✅ SUCCESS METRICS

### Sprint Milestones

**Week 2 (Auth Complete):**
- [ ] Anaya/Kavya can log in with password
- [ ] Sessions persist across refreshes
- [ ] UI looks like Duolingo
- [ ] No console errors

**Week 4 (Feedback Complete):**
- [ ] Students see explanations after wrong answers
- [ ] Post-quiz feedback screen shows strengths/weaknesses
- [ ] AI insights are personalized
- [ ] Practice worksheets generate automatically

**Week 6 (Teacher Dashboard Complete):**
- [ ] Teacher can log in and see all students
- [ ] Dashboard shows actionable alerts
- [ ] Student detail view shows concept mastery
- [ ] Teacher can edit questions

**Week 8 (Reports + Voice Complete):**
- [ ] Parents receive weekly reports every Sunday
- [ ] Reports are accurate and helpful
- [ ] Students can use voice input instead of typing
- [ ] Weekly leaderboard working

**Week 10 (Rapid Fire Complete):**
- [ ] Rapid Fire mode playable
- [ ] Questions focus on weak concepts
- [ ] Leaderboard shows highest streaks
- [ ] Students find it engaging

**Week 12 (Launch Ready):**
- [ ] 50+ students across 3 institutions
- [ ] 85%+ daily quiz completion
- [ ] Teachers actively use dashboard
- [ ] Parents satisfied with reports
- [ ] Ready for first paid customers

---

### Product Metrics (After 3 Months)

**Engagement:**
- Daily quiz completion rate: **Target 85%+** (currently ~95% with Anaya/Kavya)
- Students demanding quiz daily: **Target 80%+**
- Average session time: **Target 10-15 minutes**
- Rapid Fire plays per week: **Target 3+ per student**

**Learning Outcomes:**
- Average score improvement: **Target +15% month-over-month**
- Concepts mastered per month: **Target 5+ per student**
- School exam score correlation: **Target 70%+ show improvement**

**Teacher Adoption:**
- Dashboard logins per week: **Target 3+ per teacher**
- Questions edited per week: **Target 10%+ reviewed**
- Time saved per week: **Target 10+ hours**
- Teacher satisfaction: **Target 80%+**

**Parent Engagement:**
- Weekly report open rate: **Target 70%+**
- Parent inquiries about progress: **Target 50%+ read reports**
- Willingness to pay: **Target 80%+ after trial**

**Business:**
- Monthly Recurring Revenue: **Target ₹15,000 by Month 6**
- Customer Acquisition Cost: **Target <₹500 per student**
- Churn rate: **Target <10% per month**
- Net Promoter Score: **Target 50+**

---

## 📚 APPENDIX

### Key Files Reference

**Core App:**
- `src/App.js` - Main game controller
- `src/index.js` - App entry point
- `src/index.css` - Global styles + design system

**Authentication:**
- `src/services/authService.js` - Auth logic
- `src/components/Auth/LoginScreen.jsx` - Login UI
- `src/components/Auth/ProtectedRoute.jsx` - Route guard

**Student Components:**
- `src/components/QuestionTypes/` - All question components
- `src/components/ResultScreen.jsx` - Quiz results
- `src/components/Feedback/FeedbackScreen.jsx` - Post-quiz feedback
- `src/components/LeaderboardScreen.jsx` - Weekly leaderboard
- `src/components/History/` - Quiz history and replay
- `src/components/RapidFire/` - Rapid Fire mode

**Teacher Components:**
- `src/components/Teacher/Dashboard.jsx` - Overview
- `src/components/Teacher/StudentDetailView.jsx` - Student analytics
- `src/components/Teacher/QuestionEditor.jsx` - Edit questions
- `src/components/Teacher/ClassManagement.jsx` - Manage classes

**Services:**
- `src/services/supabase.js` - Database client
- `src/services/quizService.js` - Quiz operations
- `src/services/teacherService.js` - Teacher operations
- `src/services/webhookService.js` - n8n integration
- `src/services/soundService.js` - Sound effects

**Database:**
- `database/migrations/` - All schema migrations
- `database/seeds/` - Test data

**n8n Workflows:**
- `n8n-workflows/question-generation.json` - Auto-generate questions
- `n8n-workflows/quiz-results-handler.json` - Process submissions
- `n8n-workflows/post-quiz-feedback.json` - Generate feedback
- `n8n-workflows/weekly-report-generator.json` - Send reports
- `n8n-workflows/weekly-leaderboard-reset.json` - Reset leaderboard

---

### External Resources

**Design:**
- Duolingo: https://www.duolingo.com (UI inspiration)
- Nunito Font: https://fonts.google.com/specimen/Nunito
- Illustrations: https://undraw.co, https://storyset.com
- Icons: https://lucide.dev

**Development:**
- React Docs: https://react.dev
- Framer Motion: https://www.framer.com/motion
- TailwindCSS: https://tailwindcss.com
- Supabase Docs: https://supabase.com/docs
- n8n Docs: https://docs.n8n.io

**Tools:**
- Sentry (Error Monitoring): https://sentry.io
- Mixpanel (Analytics): https://mixpanel.com
- Vercel (Deployment): https://vercel.com

---

### Contact & Support

**Developer:** Aman Raj Yadav
**Email:** aman@fluence.ac
**Phone:** +91 7999502978
**GitHub:** https://github.com/amanrajyadav

**For Teachers:**
- Support WhatsApp: [To be set up]
- Documentation: `docs/teacher-guide.md`
- Video Walkthrough: [To be recorded]

---

## 🎯 FINAL NOTES

**Remember the Vision:**
This is not just a quiz app. This is building "Jarvis for Education" - a system that knows students better than they know themselves.

**Success Means:**
- Students learn more in less time
- Teachers save 10+ hours per week
- Parents see visible proof of improvement
- The product sells itself (pull product)

**Core Principles:**
1. **Student Learning First** - Every feature must enhance learning
2. **Teacher Time Saved** - Automate busy work, not teaching
3. **Parent Visibility** - Show proof, not promises
4. **Jugaad Philosophy** - Free before paid, simple before complex
5. **Duolingo UX** - Cute, colorful, engaging, minimal

**When in Doubt:**
- Would Duolingo do it this way? (UX)
- Does it save teacher time? (Feature)
- Does it actually solve the core problem
- Would steve jobs love it?
- What does first principle thinking say about this?
- Search web look at the lates tech advancements which can help.
- Will parents pay for this? (Business)
- Can non-tech teachers use it? (Usability)

---

**Last Updated:** 2025-10-26
**Version:** 2.0
**Status:** Ready for Development
**Domains:** fluence.ac, fluence.institute

---

*This is your single source of truth. Keep it updated as you build. Future you will thank present you.*
