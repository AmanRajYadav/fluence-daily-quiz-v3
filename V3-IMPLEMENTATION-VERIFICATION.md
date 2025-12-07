# 🔍 V3 Implementation Verification Guide

**Purpose:** Verify all changes mentioned in the v2→v3 migration are actually implemented
**Created:** 2025-10-27
**Use with:** Supabase MCP or direct database access

---

## 📋 Original Requirements (From Chat)

### 1. **Add institution_id to All Inserts**

#### Required Changes:

**A. quiz_results table:**
```sql
-- OLD (v2):
INSERT INTO quiz_results (
    student_id,
    quiz_date,
    total_questions,
    ...
)

-- NEW (v3) - REQUIRED:
INSERT INTO quiz_results (
    student_id,
    institution_id,  -- 🆕 ADD THIS
    class_id,        -- 🆕 ADD THIS
    quiz_date,
    total_questions,
    ...
)
```

**Verification Query:**
```sql
-- Check if institution_id and class_id columns exist
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_results'
    AND column_name IN ('institution_id', 'class_id')
ORDER BY column_name;
```

**Expected Result:**
```
column_name      | data_type | is_nullable
-----------------+-----------+------------
class_id         | uuid      | NO
institution_id   | uuid      | NO
```

**Status:** ❓ VERIFY IN DATABASE

---

**B. weekly_leaderboard table:**
```sql
-- Must have institution_id and class_id
INSERT INTO weekly_leaderboard (
  institution_id,  -- 🆕 REQUIRED
  class_id,        -- 🆕 REQUIRED
  student_id,
  week_start_date,
  ...
)
```

**Verification Query:**
```sql
-- Check if weekly_leaderboard table exists with correct columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'weekly_leaderboard'
ORDER BY ordinal_position;
```

**Expected Columns:**
- id (uuid)
- institution_id (uuid, NOT NULL)
- class_id (uuid, NOT NULL)
- student_id (uuid, NOT NULL)
- week_start_date (date, NOT NULL)
- week_end_date (date, NOT NULL)
- total_points (integer)
- quizzes_taken (integer)
- avg_score (numeric)
- rank (integer)
- created_at (timestamp)
- updated_at (timestamp)

**Status:** ❓ VERIFY IN DATABASE

---

### 2. **Database Schema Changes Required**

#### A. feedback table (NEW)

**Required Schema:**
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  quiz_result_id UUID REFERENCES quiz_results(id),
  feedback_type TEXT CHECK (feedback_type IN ('post_quiz', 'weekly_summary', 'manual')),
  strengths TEXT[],
  weaknesses TEXT[],
  ai_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_student ON feedback(student_id);
CREATE INDEX idx_feedback_quiz ON feedback(quiz_result_id);
```

**Verification Query:**
```sql
-- Check if feedback table exists
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'feedback'
    AND table_schema = 'public';
```

**Expected Result:**
```
table_name | table_type
-----------+-----------
feedback   | BASE TABLE
```

**Detailed Column Check:**
```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'feedback'
ORDER BY ordinal_position;
```

**Expected Columns:**
- id (uuid, NOT NULL, default uuid_generate_v4())
- student_id (uuid, NOT NULL)
- quiz_result_id (uuid, nullable)
- feedback_type (text, nullable)
- strengths (ARRAY, nullable)
- weaknesses (ARRAY, nullable)
- ai_insights (text, nullable)
- created_at (timestamp with time zone)

**Check Indexes:**
```sql
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'feedback';
```

**Expected Indexes:**
- idx_feedback_student (on student_id)
- idx_feedback_quiz (on quiz_result_id)

**Status:** ❓ VERIFY IN DATABASE

---

#### B. weekly_leaderboard table (NEW - CHANGED FROM daily_leaderboard)

**Required Schema:**
```sql
CREATE TABLE weekly_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  student_id UUID NOT NULL REFERENCES students(id),

  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,

  total_points INT DEFAULT 0,
  quizzes_taken INT DEFAULT 0,
  avg_score DECIMAL(5,2) DEFAULT 0,
  rank INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, class_id, week_start_date)
);

CREATE INDEX idx_weekly_leaderboard_class ON weekly_leaderboard(class_id, week_start_date);
CREATE INDEX idx_weekly_leaderboard_week ON weekly_leaderboard(week_start_date);
```

**Verification Query:**
```sql
-- Check if weekly_leaderboard table exists
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'weekly_leaderboard'
    AND table_schema = 'public';
```

**Expected Result:**
```
table_name         | table_type
-------------------+-----------
weekly_leaderboard | BASE TABLE
```

**Check Unique Constraint:**
```sql
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'weekly_leaderboard'
    AND constraint_type = 'UNIQUE';
```

**Expected:** Unique constraint on (student_id, class_id, week_start_date)

**Status:** ❓ VERIFY IN DATABASE

---

#### C. Update Existing Tables (Add institution_id)

**Required Changes:**

**students table:**
```sql
ALTER TABLE students
  ADD COLUMN institution_id UUID REFERENCES institutions(id);

CREATE INDEX idx_students_institution ON students(institution_id);
```

**Verification:**
```sql
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
    AND column_name = 'institution_id';
```

**Expected:** institution_id (uuid) exists

**quiz_questions table:**
```sql
ALTER TABLE quiz_questions
  ADD COLUMN institution_id UUID REFERENCES institutions(id),
  ADD COLUMN class_id UUID REFERENCES classes(id);
```

**Verification:**
```sql
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_questions'
    AND column_name IN ('institution_id', 'class_id')
ORDER BY column_name;
```

**Expected:** Both columns exist

**quiz_results table:**
```sql
ALTER TABLE quiz_results
  ADD COLUMN institution_id UUID REFERENCES institutions(id),
  ADD COLUMN class_id UUID REFERENCES classes(id);
```

**Verification:**
```sql
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_results'
    AND column_name IN ('institution_id', 'class_id')
ORDER BY column_name;
```

**Expected:** Both columns exist

**Status:** ❓ VERIFY IN DATABASE

---

### 3. **n8n Workflow Changes**

#### A. Parse Quiz Data Node

**Required:** Must validate institution_id, class_id, student_id

**Code Check:**
```javascript
// Validate required fields
if (!body.student_id) {
  throw new Error('Missing required field: student_id');
}
if (!body.class_id) {
  throw new Error('Missing required field: class_id');  // 🆕 v3
}
if (!body.institution_id) {
  throw new Error('Missing required field: institution_id');  // 🆕 v3
}
```

**Verification:** Check `Quiz-Results-Handler-v3.json` line ~22

**Status:** ✅ IMPLEMENTED (in v3 JSON file)

---

#### B. NEW BRANCH: Feedback Generation

**Required Nodes:**
1. **Analyze Answers (Feedback)** - Code node that:
   - Groups answers by concept
   - Calculates accuracy per concept
   - Identifies strengths (≥80%)
   - Identifies weaknesses (<60%)

2. **Call Gemini (Generate Feedback)** - HTTP Request that:
   - Sends prompt to Gemini API
   - Gets AI-generated insights
   - Returns personalized feedback

3. **Insert Feedback** - PostgreSQL query that:
   - Saves feedback to database
   - Links to quiz_result_id
   - Stores strengths, weaknesses, ai_insights

**Verification:** Check `Quiz-Results-Handler-v3.json` for nodes:
- "Analyze Answers (Feedback)"
- "Call Gemini (Generate Feedback)"
- "Insert Feedback"

**Status:** ✅ IMPLEMENTED (in v3 JSON file)

---

#### C. CHANGED: Daily → Weekly Leaderboard

**Required Changes:**

**Old (v2) - Daily:**
```sql
INSERT INTO leaderboard (student_id, quiz_date, score, ...)
ON CONFLICT (student_id, quiz_date) DO UPDATE ...
```

**New (v3) - Weekly:**
```sql
-- Calculate week start (Monday) and end (Sunday)
WITH week_dates AS (
  SELECT
    DATE_TRUNC('week', CURRENT_DATE)::DATE as week_start,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE as week_end
)
INSERT INTO weekly_leaderboard (
  institution_id,
  class_id,
  student_id,
  week_start_date,
  week_end_date,
  total_points,
  quizzes_taken,
  avg_score
)
SELECT ... FROM week_dates
ON CONFLICT (student_id, class_id, week_start_date) DO UPDATE SET
  total_points = weekly_leaderboard.total_points + EXCLUDED.total_points,
  quizzes_taken = weekly_leaderboard.quizzes_taken + 1,
  avg_score = (weekly_leaderboard.avg_score * weekly_leaderboard.quizzes_taken + EXCLUDED.avg_score) / (weekly_leaderboard.quizzes_taken + 1)
```

**Verification:** Check `Quiz-Results-Handler-v3.json` node "Upsert Weekly Leaderboard"

**Status:** ✅ IMPLEMENTED (in v3 JSON file)

---

#### D. Enhanced Final Response

**Required:** Response must include feedback

**Code Check:**
```javascript
return [{
  json: {
    success: true,
    message: "Quiz submitted successfully! Check your feedback below.",
    data: {
      score: webhookData.score,
      weekly_rank: rank,  // Changed from daily_rank
      total_students: totalStudents,

      // 🆕 NEW: Feedback in response
      feedback: {
        strengths: feedback.strengths || [],
        weaknesses: feedback.weaknesses || [],
        ai_insights: feedback.ai_insights,
        feedback_id: feedback.id
      },

      next_milestone: "..."
    }
  }
}];
```

**Verification:** Check `Quiz-Results-Handler-v3.json` node "Prepare Final Response"

**Status:** ✅ IMPLEMENTED (in v3 JSON file)

---

## 🔍 Complete Verification Checklist

Run these queries in **Supabase SQL Editor** or **Supabase MCP**:

### 1. Check All Required Tables Exist

```sql
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'institutions',
        'teachers',
        'classes',
        'students',
        'student_class_enrollments',
        'quiz_questions',
        'quiz_results',
        'concept_mastery',
        'weekly_leaderboard',  -- NEW
        'feedback',            -- NEW
        'daily_leaderboard',   -- Should exist for backward compat
        'weekly_reports',
        'quiz_history',
        'notes_history'
    )
ORDER BY table_name;
```

**Expected:** At least 14 tables (including new feedback and weekly_leaderboard)

---

### 2. Verify feedback Table Schema

```sql
-- Full schema check
SELECT
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
    ON c.table_name = kcu.table_name
    AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc
    ON kcu.constraint_name = tc.constraint_name
WHERE c.table_name = 'feedback'
ORDER BY c.ordinal_position;
```

**Expected Columns:**
- ✅ id (uuid, PRIMARY KEY)
- ✅ student_id (uuid, NOT NULL, FOREIGN KEY → students)
- ✅ quiz_result_id (uuid, FOREIGN KEY → quiz_results)
- ✅ feedback_type (text)
- ✅ strengths (ARRAY)
- ✅ weaknesses (ARRAY)
- ✅ ai_insights (text)
- ✅ created_at (timestamp with time zone)

---

### 3. Verify weekly_leaderboard Table Schema

```sql
-- Full schema check
SELECT
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_name = 'weekly_leaderboard'
ORDER BY c.ordinal_position;
```

**Expected Columns:**
- ✅ id (uuid, PRIMARY KEY)
- ✅ institution_id (uuid, NOT NULL, FOREIGN KEY)
- ✅ class_id (uuid, NOT NULL, FOREIGN KEY)
- ✅ student_id (uuid, NOT NULL, FOREIGN KEY)
- ✅ week_start_date (date, NOT NULL)
- ✅ week_end_date (date, NOT NULL)
- ✅ total_points (integer)
- ✅ quizzes_taken (integer)
- ✅ avg_score (numeric)
- ✅ rank (integer)
- ✅ created_at (timestamp)
- ✅ updated_at (timestamp)

**Check Unique Constraint:**
```sql
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'weekly_leaderboard'
    AND tc.constraint_type = 'UNIQUE'
ORDER BY kcu.ordinal_position;
```

**Expected:** UNIQUE constraint on (student_id, class_id, week_start_date)

---

### 4. Verify institution_id Added to Existing Tables

```sql
-- Check students table
SELECT 'students' as table_name,
       EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'students'
           AND column_name = 'institution_id'
       ) as has_institution_id

UNION ALL

-- Check quiz_questions table
SELECT 'quiz_questions',
       EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'quiz_questions'
           AND column_name = 'institution_id'
       )

UNION ALL

-- Check quiz_results table
SELECT 'quiz_results',
       EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'quiz_results'
           AND column_name = 'institution_id'
       );
```

**Expected Result:**
```
table_name      | has_institution_id
----------------+-------------------
students        | true
quiz_questions  | true
quiz_results    | true
```

---

### 5. Verify class_id Added to Required Tables

```sql
-- Check quiz_questions table
SELECT 'quiz_questions' as table_name,
       EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'quiz_questions'
           AND column_name = 'class_id'
       ) as has_class_id

UNION ALL

-- Check quiz_results table
SELECT 'quiz_results',
       EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'quiz_results'
           AND column_name = 'class_id'
       );
```

**Expected Result:**
```
table_name      | has_class_id
----------------+-------------
quiz_questions  | true
quiz_results    | true
```

---

### 6. Check All Foreign Key Constraints

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('feedback', 'weekly_leaderboard', 'quiz_results', 'quiz_questions', 'students')
ORDER BY tc.table_name, kcu.column_name;
```

**Expected Foreign Keys:**
- feedback.student_id → students.id
- feedback.quiz_result_id → quiz_results.id
- weekly_leaderboard.institution_id → institutions.id
- weekly_leaderboard.class_id → classes.id
- weekly_leaderboard.student_id → students.id
- quiz_results.institution_id → institutions.id
- quiz_results.class_id → classes.id
- quiz_results.student_id → students.id
- (and more...)

---

### 7. Verify Institution, Teacher, Class Exist

```sql
-- Check institution
SELECT
    'Institution' as entity,
    id,
    code,
    name,
    subscription_status
FROM institutions
WHERE code = 'FLUENCE';

-- Check teacher
SELECT
    'Teacher' as entity,
    t.id,
    t.email,
    t.full_name,
    t.role,
    i.code as institution_code
FROM teachers t
JOIN institutions i ON t.institution_id = i.id
WHERE t.email = 'aman@fluence.ac';

-- Check class
SELECT
    'Class' as entity,
    c.id,
    c.class_code,
    c.class_name,
    c.session,
    i.code as institution_code
FROM classes c
JOIN institutions i ON c.institution_id = i.id
WHERE c.class_code = 'FLUENCE-CLASS6-2025';
```

**Expected:**
- ✅ 1 institution (FLUENCE)
- ✅ 1 teacher (aman@fluence.ac)
- ✅ 1 class (FLUENCE-CLASS6-2025)

---

### 8. Check Indexes Exist

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('feedback', 'weekly_leaderboard', 'quiz_results', 'students', 'quiz_questions')
ORDER BY tablename, indexname;
```

**Expected Indexes:**
- idx_feedback_student
- idx_feedback_quiz
- idx_weekly_leaderboard_class
- idx_weekly_leaderboard_week
- idx_quiz_results_institution
- idx_quiz_results_class
- idx_students_institution
- idx_quiz_questions_institution
- idx_quiz_questions_class

---

## 📊 Summary Checklist

After running all verification queries, check:

### Database Schema:
- [ ] ✅ feedback table exists with correct schema
- [ ] ✅ weekly_leaderboard table exists with correct schema
- [ ] ✅ students.institution_id column exists
- [ ] ✅ quiz_questions.institution_id and class_id exist
- [ ] ✅ quiz_results.institution_id and class_id exist
- [ ] ✅ All foreign keys correctly configured
- [ ] ✅ All indexes created
- [ ] ✅ UNIQUE constraint on weekly_leaderboard(student_id, class_id, week_start_date)

### Seed Data:
- [ ] ✅ FLUENCE institution exists
- [ ] ✅ aman@fluence.ac teacher exists
- [ ] ✅ FLUENCE-CLASS6-2025 class exists

### n8n Workflow (in JSON file):
- [ ] ✅ Parse Quiz Data validates institution_id, class_id
- [ ] ✅ Analyze Answers (Feedback) node exists
- [ ] ✅ Call Gemini (Generate Feedback) node exists
- [ ] ✅ Insert Feedback node exists
- [ ] ✅ Upsert Weekly Leaderboard (not daily) exists
- [ ] ✅ Prepare Final Response includes feedback

---

## 🚨 Common Issues to Check

### Issue 1: Missing Columns
**Symptom:** Column 'institution_id' does not exist
**Fix:** Run `001_initial_schema.sql` again (or just the ALTER TABLE parts)

### Issue 2: Missing Tables
**Symptom:** Table 'feedback' does not exist
**Fix:** Run `001_initial_schema.sql` again

### Issue 3: Wrong Leaderboard Table
**Symptom:** Still using 'leaderboard' or 'daily_leaderboard'
**Fix:** Check workflow JSON uses 'weekly_leaderboard'

### Issue 4: Missing Foreign Keys
**Symptom:** Insert fails with "violates foreign key constraint"
**Fix:** Ensure institution, class, student exist before inserting quiz results

---

## 📝 Next Steps After Verification

**If ALL checks pass ✅:**
1. Create test students (004_create_test_students.sql)
2. Import n8n workflow
3. Test with sample payload
4. Activate workflow

**If ANY check fails ❌:**
1. Note which check failed
2. Run the specific fix (see Common Issues)
3. Re-run verification
4. Continue when all pass

---

**Last Updated:** 2025-10-27
**Total Verification Queries:** 8
**Estimated Time:** 10-15 minutes
