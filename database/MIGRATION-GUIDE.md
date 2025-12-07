# 🚀 Supabase Migration Guide - V2 to V3

## ⚠️ IMPORTANT: Backup First!

Before running any migrations, **backup your current Supabase database**:
1. Go to Supabase Dashboard → Database → Backups
2. Create manual backup
3. Download backup file

---

## 📋 Migration Steps

### Step 1: Check Current Schema

First, check if you already have v3 tables in Supabase:

```sql
-- Run this in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**If you see `institutions`, `teachers`, `classes` tables:**
✅ You already have v3 schema → Skip to Step 3 (Verify Data)

**If you only see `students`, `quiz_questions`, `quiz_results`, `leaderboard`:**
❌ You have v2 schema → Continue to Step 2

---

### Step 2: Apply V3 Schema Migration

#### Option A: Fresh Start (Recommended for Testing)

**⚠️ WARNING: This will DROP all existing tables!**

```sql
-- Run in Supabase SQL Editor
-- Only use this if you're starting fresh or have backed up data

-- Drop all existing tables (if any)
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS concept_mastery CASCADE;
DROP TABLE IF EXISTS quiz_history CASCADE;
DROP TABLE IF EXISTS notes_history CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Now run the migration
```

Then copy-paste the entire content of:
- `database/migrations/001_initial_schema.sql`

#### Option B: Preserve Existing Data (Production)

If you have existing students (Anaya, Kavya) and want to keep their data:

1. **Create new v3 tables first** (they won't conflict):
   - Run `database/migrations/001_initial_schema.sql`

2. **Migrate existing student data**:
   - See `database/migrations/003_migrate_v2_to_v3_data.sql` (we'll create this next)

---

### Step 3: Apply Seed Data

Run this to create the Fluence institution, teacher account, and Class 6:

```sql
-- Copy-paste content from:
-- database/seeds/002_seed_fluence_institution.sql
```

**This creates:**
- ✅ Institution: `FLUENCE`
- ✅ Teacher: `aman@fluence.ac` / Password: `aman@123`
- ✅ Class 6: `FLUENCE-CLASS6-2025`

---

### Step 4: Verify Migration

Run these verification queries:

```sql
-- 1. Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: 17 tables

-- 2. Verify institution
SELECT * FROM institutions WHERE code = 'FLUENCE';

-- 3. Verify teacher
SELECT
  t.full_name,
  t.email,
  t.role,
  i.name as institution
FROM teachers t
JOIN institutions i ON t.institution_id = i.id;

-- 4. Verify class
SELECT
  c.class_code,
  c.class_name,
  c.session,
  t.full_name as teacher
FROM classes c
JOIN teachers t ON c.teacher_id = t.id;
```

**Expected Output:**
- Institution: Fluence (code: FLUENCE)
- Teacher: Aman Raj Yadav (aman@fluence.ac, role: admin)
- Class: Class 6 (FLUENCE-CLASS6-2025, session: 2025-26)

---

### Step 5: Set Up RLS (Row Level Security)

```sql
-- Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy for students (read own data)
CREATE POLICY students_select_own
  ON students FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy for quiz_results (students insert own results via n8n)
CREATE POLICY quiz_results_insert
  ON quiz_results FOR INSERT
  WITH CHECK (true); -- n8n uses service_role_key

-- Policy for feedback (students read own feedback)
CREATE POLICY feedback_select_own
  ON feedback FOR SELECT
  USING (student_id IN (
    SELECT id FROM students WHERE auth.uid()::text = id::text
  ));

-- Add more policies as needed for your use case
```

---

### Step 6: Update Supabase Configuration

1. **Get your Supabase credentials:**
   - Go to Supabase Dashboard → Settings → API
   - Copy:
     - Project URL: `https://wvzvfzjjiamjkibegvip.supabase.co`
     - `anon` key (for frontend)
     - `service_role` key (for n8n - **keep secret!**)

2. **Update n8n credentials:**
   - Go to n8n → Credentials
   - Update "Supabase account" with new project URL + service_role key
   - Update "Supabase PostgreSQL" with database connection details

3. **Update frontend `.env`:**
   ```bash
   REACT_APP_SUPABASE_URL=https://wvzvfzjjiamjkibegvip.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJ...
   REACT_APP_N8N_WEBHOOK_URL=https://n8n.myworkflow.top/webhook/quiz-submit
   ```

---

## 🔄 Migrating Existing Student Data (V2 → V3)

If you have existing students (Anaya, Kavya) in v2, create this migration:

```sql
-- database/migrations/003_migrate_v2_to_v3_data.sql

DO $$
DECLARE
  fluence_institution_id UUID;
  class6_id UUID;
  anaya_student_id UUID;
  kavya_student_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO fluence_institution_id FROM institutions WHERE code = 'FLUENCE';
  SELECT id INTO class6_id FROM classes WHERE class_code = 'FLUENCE-CLASS6-2025';

  -- Migrate Anaya
  INSERT INTO students (
    institution_id,
    full_name,
    username,
    pin_hash,
    phone_number,
    session,
    active
  ) VALUES (
    fluence_institution_id,
    'Anaya',
    'anaya',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- bcrypt hash of "1234"
    '+917999502978',
    '2025-26',
    true
  ) RETURNING id INTO anaya_student_id;

  -- Enroll Anaya in Class 6
  INSERT INTO student_class_enrollments (student_id, class_id, status)
  VALUES (anaya_student_id, class6_id, 'active');

  -- Migrate Kavya
  INSERT INTO students (
    institution_id,
    full_name,
    username,
    pin_hash,
    phone_number,
    session,
    active
  ) VALUES (
    fluence_institution_id,
    'Kavya',
    'kavya',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- bcrypt hash of "1234"
    '+917999502978',
    '2025-26',
    true
  ) RETURNING id INTO kavya_student_id;

  -- Enroll Kavya in Class 6
  INSERT INTO student_class_enrollments (student_id, class_id, status)
  VALUES (kavya_student_id, class6_id, 'active');

  RAISE NOTICE 'Students migrated successfully!';
  RAISE NOTICE 'Anaya username: anaya, PIN: 1234';
  RAISE NOTICE 'Kavya username: kavya, PIN: 1234';
END $$;
```

---

## 🧪 Testing the Migration

After migration, test these scenarios:

### 1. Test Student Login Flow
```sql
-- Verify students exist
SELECT
  s.username,
  s.full_name,
  i.name as institution,
  c.class_name
FROM students s
JOIN institutions i ON s.institution_id = i.id
JOIN student_class_enrollments e ON s.id = e.student_id
JOIN classes c ON e.class_id = c.id
WHERE s.username IN ('anaya', 'kavya');
```

### 2. Test Quiz Submission (Manual Insert)
```sql
-- Insert a test quiz result
INSERT INTO quiz_results (
  institution_id,
  class_id,
  student_id,
  quiz_date,
  total_questions,
  correct_answers,
  score,
  time_taken_seconds,
  answers_json,
  streak_count,
  total_points
)
SELECT
  i.id as institution_id,
  c.id as class_id,
  s.id as student_id,
  CURRENT_DATE,
  10,
  7,
  70.00,
  120,
  '{"questions": []}'::jsonb,
  3,
  100
FROM students s
JOIN institutions i ON s.institution_id = i.id
JOIN student_class_enrollments e ON s.id = e.student_id
JOIN classes c ON e.class_id = c.id
WHERE s.username = 'anaya'
LIMIT 1;

-- Verify inserted
SELECT * FROM quiz_results ORDER BY created_at DESC LIMIT 1;
```

### 3. Test Weekly Leaderboard
```sql
-- Insert test leaderboard entry
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
SELECT
  i.id as institution_id,
  c.id as class_id,
  s.id as student_id,
  DATE_TRUNC('week', CURRENT_DATE)::DATE,
  (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
  100,
  1,
  70.00
FROM students s
JOIN institutions i ON s.institution_id = i.id
JOIN student_class_enrollments e ON s.id = e.student_id
JOIN classes c ON e.class_id = c.id
WHERE s.username = 'anaya'
LIMIT 1;

-- Verify
SELECT * FROM weekly_leaderboard;
```

---

## ✅ Success Checklist

After migration, verify:

- [ ] 17 tables created in Supabase
- [ ] Fluence institution exists (code: FLUENCE)
- [ ] Teacher account exists (aman@fluence.ac)
- [ ] Class 6 exists (FLUENCE-CLASS6-2025)
- [ ] Students migrated (if applicable)
- [ ] RLS policies applied
- [ ] n8n credentials updated
- [ ] Frontend .env updated
- [ ] Test quiz submission works
- [ ] Test weekly leaderboard works

---

## 🆘 Troubleshooting

### Issue: "relation already exists"
**Solution:** You're running migration on an already-migrated database. Check Step 1.

### Issue: "password authentication failed"
**Solution:** Update PostgreSQL credentials in n8n with correct Supabase password.

### Issue: "foreign key constraint violation"
**Solution:** Ensure institution and class are created before students.

### Issue: RLS prevents insert
**Solution:** Use `service_role` key in n8n (bypasses RLS), not `anon` key.

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Database → Logs
2. Check n8n execution history for errors
3. Verify all foreign keys exist before inserting
4. Ensure proper UUID types (not strings)

---

**Last Updated:** 2025-10-27
**Migration Version:** v2 → v3
**Estimated Time:** 15-30 minutes
