# V2 DATABASE INSPECTION REPORT

**Inspected:** 2025-10-27
**V2 Supabase Project:** https://wvzvfzjjiamjkibegvip.supabase.co
**Purpose:** Understand V2 architecture before building V3

---

## 📊 V2 DATABASE TABLES (6 Tables)

### **1. students**
**Purpose:** Student profiles (student-centric model)
**Key Fields:**
- `id` (UUID) - Primary key
- `display_name` (TEXT) - Student name (e.g., "Anaya")
- `created_at` (TIMESTAMP)

**Used in:**
- `quizService.js` - `getStudentByName()`, `getStudentById()`

**Queries:**
```sql
SELECT * FROM students WHERE display_name ILIKE 'Anaya';
```

---

### **2. quiz_questions**
**Purpose:** Personalized question bank per student
**Key Fields:**
- `id` (UUID)
- `student_id` (UUID) - FK to students
- `question_text` (TEXT)
- `question_type` (TEXT) - mcq, true_false, short_answer, fill_blank, match, voice
- `options` (JSONB) - For MCQ/Match: `["opt1", "opt2", ...]`
- `correct_answer` (TEXT)
- `concept_tested` (TEXT) - e.g., "Article Usage", "Modal Verbs"
- `difficulty_level` (TEXT) - easy/medium/hard
- `explanation` (TEXT) - Why answer is correct
- `active` (BOOLEAN) - Only active questions shown in quiz
- `created_date` (DATE)
- `created_at` (TIMESTAMP)

**Used in:**
- `quizService.js` - `getActiveQuestions(student_id)`
- `historyService.js` - Fetch options/explanations for replay

**Queries:**
```sql
-- Get today's active questions
SELECT * FROM quiz_questions
WHERE student_id = $1 AND active = true
ORDER BY created_at;

-- Deactivate old questions before inserting new
UPDATE quiz_questions
SET active = false
WHERE student_id = $1 AND active = true;
```

**⭐ What Works Well:**
- AI-generated questions from class transcripts (n8n + Gemini)
- 6 question types supported
- Difficulty levels for SRS
- Explanations shown after wrong answers
- Active/inactive flag for question lifecycle

---

### **3. quiz_results**
**Purpose:** Store complete quiz submissions
**Key Fields:**
- `id` (UUID)
- `student_id` (UUID)
- `quiz_date` (DATE)
- `total_questions` (INT) - Usually 30
- `correct_answers` (INT)
- `score` (DECIMAL) - Percentage
- `time_taken_seconds` (INT)
- `answers_json` (JSONB) - Complete quiz data for replay
- `streak_count` (INT)
- `bonus_points` (INT)
- `total_score` (INT) - For gamification
- `created_at` (TIMESTAMP)

**Used in:**
- `historyService.js` - `getQuestionsByDate()` for replay
- `quizService.js` - `getTotalPoints()`
- n8n workflow - Submitted via webhook

**Queries:**
```sql
-- Get quiz for replay
SELECT answers_json FROM quiz_results
WHERE student_id = $1 AND quiz_date = $2
ORDER BY created_at DESC LIMIT 1;

-- Get total points
SELECT SUM(total_score) FROM quiz_results
WHERE student_id = $1;
```

**⭐ What Works Well:**
- Complete quiz data stored in `answers_json` for perfect replay
- Gamification (streak, bonus points)
- Time tracking

---

### **4. leaderboard**
**Purpose:** Daily rankings (real-time competition)
**Key Fields:**
- `id` (UUID)
- `student_id` (UUID)
- `quiz_date` (DATE)
- `score` (DECIMAL)
- `time_taken_seconds` (INT)
- `rank` (INT) - Calculated by n8n using Window Functions
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Unique Constraint:** `(student_id, quiz_date)` - One entry per day

**Used in:**
- `quizService.js` - `getTodaysLeaderboard()`, `subscribeToLeaderboard()`
- Real-time updates via Supabase Realtime

**Queries:**
```sql
-- Get today's leaderboard
SELECT l.*, s.display_name
FROM leaderboard l
JOIN students s ON l.student_id = s.id
WHERE l.quiz_date = CURRENT_DATE
ORDER BY l.rank;

-- Recalculate ranks (done in n8n)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      ORDER BY score DESC, time_taken_seconds ASC
    ) as new_rank
  FROM leaderboard
  WHERE quiz_date = CURRENT_DATE
)
UPDATE leaderboard
SET rank = ranked.new_rank
FROM ranked
WHERE leaderboard.id = ranked.id;
```

**⭐ What Works Well:**
- Real-time updates (WebSocket subscriptions)
- Atomic rank calculation in n8n (Window Functions)
- UPSERT pattern (keeps best score if student retakes)

---

### **5. quiz_history**
**Purpose:** Archive complete quizzes for replay mode
**Key Fields:**
- `id` (UUID)
- `student_id` (UUID)
- `quiz_date` (DATE)
- `questions_json` (JSONB) - All questions
- `answers_json` (JSONB) - Student's answers
- `total_score` (DECIMAL)
- `subject` (TEXT) - Optional filter
- `created_at` (TIMESTAMP)

**Used in:**
- `historyService.js` - `getQuizHistory()`, `saveQuizToHistory()`

**Queries:**
```sql
-- Get quiz history (past 30 days)
SELECT * FROM quiz_history
WHERE student_id = $1
  AND quiz_date >= CURRENT_DATE - 30
ORDER BY quiz_date DESC;
```

**⭐ What Works Well:**
- Perfect quiz replay functionality
- Safeguard: If data missing, fetches from quiz_questions table

---

### **6. notes_history**
**Purpose:** AI-generated class notes from transcripts
**Key Fields:**
- `id` (UUID)
- `student_id` (UUID)
- `note_date` (DATE)
- `content_html` (TEXT) - Rich formatted notes
- `subject` (TEXT) - Optional
- `created_at` (TIMESTAMP)

**Used in:**
- `historyService.js` - `getNotesHistory()`

**Queries:**
```sql
-- Get recent notes
SELECT * FROM notes_history
WHERE student_id = $1
ORDER BY note_date DESC;
```

---

## 🔄 V2 DATA FLOW

### **Quiz Submission Flow:**
```
Student completes quiz (React App)
  ↓
Submit to n8n webhook (webhookService.js)
  ↓
n8n workflow processes:
  1. INSERT quiz_results
  2. UPDATE concept_mastery (SRS algorithm)
  3. UPSERT leaderboard + recalculate ranks
  ↓
Supabase Real-time broadcasts changes
  ↓
React app updates leaderboard live
```

---

## 📦 V2 n8n WORKFLOWS

### **Quiz Results Handler (IMPROVED)**
**File:** `Quiz-Results-Handler-IMPROVED.json`
**Webhook:** https://n8n.myworkflow.top/webhook/quiz-submit

**Steps:**
1. Receive quiz data (POST)
2. Parse & validate
3. **Parallel execution** (3 branches):
   - Insert into `quiz_results`
   - Update `concept_mastery` (SRS)
   - Upsert `leaderboard` + calculate ranks
4. Return response with rank

**SQL Optimization:**
- Uses Window Functions for rank calculation
- UPSERT pattern: `INSERT ... ON CONFLICT ... DO UPDATE`
- Single atomic query (no loops)

---

## ✅ WHAT'S WORKING WELL IN V2

### **1. Question Generation**
- ✅ Gemini 2.5 Pro generates 30 personalized questions from class transcripts
- ✅ 6 question types supported
- ✅ Difficulty levels (easy/medium/hard) for SRS
- ✅ Detailed explanations for learning

### **2. Quiz Experience**
- ✅ 30 questions per quiz
- ✅ Streak-based scoring (gamification)
- ✅ Sound effects (Howler.js)
- ✅ Animations (Framer Motion)
- ✅ Confetti on completion
- ✅ Mobile responsive

### **3. Leaderboard**
- ✅ Real-time updates (Supabase Realtime)
- ✅ Daily rankings
- ✅ Atomic rank calculation (Window Functions)
- ✅ Historical champions view

### **4. Progress Tracking**
- ✅ Quiz history with calendar view
- ✅ Replay mode (with safeguards for missing data)
- ✅ Progress charts (7/30/90 day trends)
- ✅ Concept mastery tracking (SRS algorithm)

### **5. Data Architecture**
- ✅ Frontend read-only (ANON_KEY security)
- ✅ n8n handles all writes (SERVICE_ROLE_KEY)
- ✅ Complete quiz data in `answers_json` for replay
- ✅ Active/inactive flag for question lifecycle

---

## ❌ LIMITATIONS IN V2 (Why We Need V3)

### **Architecture Issues:**
1. ❌ **Student-centric model** - Not scalable for institutions
   - No institution/teacher hierarchy
   - No multi-teacher support
   - No class grouping

2. ❌ **No authentication** - Students enter name each time
   - No persistent login
   - No password protection
   - No role-based access control

3. ❌ **No teacher dashboard**
   - Teachers can't view student progress
   - Can't edit questions
   - Can't generate reports

4. ❌ **Single class only**
   - Student can't be in English + Math + Science
   - No session management (2025-26 vs 2026-27)

5. ❌ **No parent communication**
   - No weekly reports
   - No automated emails

---

## 🎯 V3 REQUIREMENTS (Based on V2 Insights)

### **Preserve from V2:**
- ✅ All 6 question types
- ✅ AI question generation workflow
- ✅ Quiz replay functionality
- ✅ Real-time leaderboard (with optimizations)
- ✅ SRS algorithm (concept_mastery)
- ✅ Frontend read-only + n8n writes architecture
- ✅ Gamification (streak, bonus points)

### **Add in V3:**
- ➕ **Institution-centric architecture**
  - institutions → teachers → classes → students
  - Multi-tenant system (institution_id everywhere)

- ➕ **Authentication system**
  - Students: Class Code + Username + 4-digit PIN
  - Teachers: Email + Strong Password
  - Persistent login (session tokens)
  - Email-based PIN recovery (optional)

- ➕ **Multi-class enrollment**
  - Same student (anaya01) in English + Math + Science
  - `student_class_enrollments` table (many-to-many)

- ➕ **Teacher dashboard**
  - View all students in class
  - Reset PINs, view activity logs
  - Edit questions, approve AI-generated ones
  - Generate reports

- ➕ **Separate portals**
  - Student portal (quiz, history, leaderboard)
  - Teacher portal (dashboard, analytics, management)

- ➕ **Weekly leaderboard** (instead of daily)
  - Per class rankings
  - Weekly champions

- ➕ **Parent communication**
  - Weekly progress reports (automated emails)
  - AI-generated insights

- ➕ **Session management**
  - 2025-26, Sep-Dec formats
  - Migrate classes between sessions

---

## 🔧 MIGRATION STRATEGY (V2 → V3)

### **Database:**
1. ❌ **Don't migrate V2 data** (student-centric → institution-centric incompatible)
2. ✅ **Start V3 clean** with new schema
3. ✅ **Preserve V2 architecture patterns** that work well

### **Code:**
1. ✅ **Reuse question type components** (MCQQuestion.jsx, etc.)
2. ✅ **Reuse quiz logic** (scoring, validation, animations)
3. ✅ **Keep n8n workflow pattern** (webhook → parallel processing)
4. ✅ **Keep real-time leaderboard** (with V3 optimizations)

### **n8n:**
1. ✅ **Create new V3 workflows** with new Supabase credentials
2. ✅ **Keep same logic** (quiz submission, SRS updates, leaderboard)
3. ✅ **Add new workflows** (weekly reports, feedback generation)

---

## 📊 V2 VS V3 SCHEMA COMPARISON

| Feature | V2 (6 tables) | V3 (17 tables) |
|---------|---------------|----------------|
| **Root Entity** | students | institutions |
| **Auth** | None (name only) | Class Code + Username + PIN |
| **Teachers** | None | teachers table (admin/teacher/viewer roles) |
| **Classes** | Implicit (one per student) | classes table (with class_codes) |
| **Multi-class** | ❌ | ✅ student_class_enrollments |
| **Leaderboard** | Daily only | Daily + Weekly |
| **Recovery** | None | pin_reset_tokens (email) |
| **Sessions** | None | login_attempts, user_sessions |
| **Reports** | None | weekly_reports, feedback |

---

## ✅ CONCLUSION

**V2 is solid foundation!** The architecture works well for single-student use:
- Question generation is excellent
- Quiz experience is polished
- Real-time leaderboard works
- SRS algorithm tracks mastery
- Replay mode is perfect

**V3 builds on this foundation** with:
- Institution-centric multi-tenant architecture
- Authentication & persistent login
- Teacher dashboard & student management
- Multi-class enrollment support
- Weekly reports & AI feedback

**Strategy:** Keep V2 running for current classes, build V3 clean from scratch using V2's proven patterns.

---

**Next Step:** Create V3 migrations based on these insights! 🚀
