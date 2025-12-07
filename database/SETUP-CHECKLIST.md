# ✅ Supabase V3 Setup Checklist

## 🎯 Goal
Apply v3 schema to Supabase and configure n8n workflow for feedback generation + weekly leaderboard.

---

## 📋 Pre-Migration Checklist

- [ ] **Backup current database** (if you have data)
  - Go to Supabase Dashboard → Database → Backups
  - Create manual backup

- [ ] **Document current credentials**
  - [ ] Supabase URL: `https://wvzvfzjjiamjkibegvip.supabase.co`
  - [ ] Supabase `anon` key (for frontend)
  - [ ] Supabase `service_role` key (for n8n)
  - [ ] Database password

---

## 🚀 Migration Steps

### Step 1: Apply V3 Schema to Supabase

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard
   - Navigate to your project
   - Click **SQL Editor** in left sidebar

2. **Run Schema Migration**
   - Copy entire content from: `database/migrations/001_initial_schema.sql`
   - Paste in SQL Editor
   - Click **Run**
   - ✅ Should see: "Fluence Quiz V3 schema created successfully!"
   - ✅ Should show: "Total tables: 17"

3. **Verify Schema Created**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   Expected: 17 tables

### Step 2: Create Institution + Teacher + Class

1. **Run Seed Script**
   - Copy content from: `database/seeds/002_seed_fluence_institution.sql`
   - Paste in SQL Editor
   - Click **Run**
   - ✅ Should see: Institution, Teacher, Class created

2. **Verify Seed Data**
   ```sql
   -- Check institution
   SELECT * FROM institutions WHERE code = 'FLUENCE';

   -- Check teacher
   SELECT * FROM teachers WHERE email = 'aman@fluence.ac';

   -- Check class
   SELECT * FROM classes WHERE class_code = 'FLUENCE-CLASS6-2025';
   ```

   Expected:
   - ✅ Institution: Fluence (code: FLUENCE)
   - ✅ Teacher: aman@fluence.ac (password: aman@123)
   - ✅ Class: FLUENCE-CLASS6-2025

### Step 3: Migrate Existing Students (Anaya, Kavya)

1. **Run Student Migration**
   - Copy content from: `database/migrations/003_migrate_v2_students.sql`
   - Paste in SQL Editor
   - Click **Run**
   - ✅ Should see: Anaya and Kavya created + enrolled

2. **Verify Students**
   ```sql
   SELECT
     s.username,
     s.full_name,
     c.class_name,
     e.status
   FROM students s
   JOIN student_class_enrollments e ON s.id = e.student_id
   JOIN classes c ON e.class_id = c.id
   WHERE s.username IN ('anaya', 'kavya');
   ```

   Expected:
   - ✅ Anaya - enrolled in Class 6 - active
   - ✅ Kavya - enrolled in Class 6 - active

---

## 🔐 Step 4: Configure n8n Credentials

### Supabase PostgreSQL Credential

1. **Go to n8n → Credentials → Add Credential → PostgreSQL**
2. **Fill in details:**
   ```
   Host: db.wvzvfzjjiamjkibegvip.supabase.co
   Port: 5432
   Database: postgres
   User: postgres.wvzvfzjjiamjkibegvip
   Password: [Your Supabase DB Password]
   SSL Mode: Require
   ```
3. **Test connection** → Should succeed
4. **Save** with name: "Supabase PostgreSQL"

### Supabase API Credential

1. **Go to n8n → Credentials → Add Credential → Supabase**
2. **Fill in details:**
   ```
   Host: https://wvzvfzjjiamjkibegvip.supabase.co
   Service Role Secret: [Your SERVICE_ROLE_KEY]
   ```
3. **Test connection** → Should succeed
4. **Save** with name: "Supabase account"

### Gemini API Credential (if not already configured)

1. **Go to n8n → Credentials → Add Credential → HTTP Header Auth**
2. **Fill in:**
   ```
   Name: x-goog-api-key
   Value: [Your Gemini API Key]
   ```
3. **Save** with name: "Gemini API"

---

## 📊 Step 5: Test Database Access

Run these test queries in Supabase SQL Editor:

```sql
-- Test 1: Get institution ID
SELECT id, code, name FROM institutions WHERE code = 'FLUENCE';

-- Test 2: Get class ID
SELECT id, class_code, class_name FROM classes WHERE class_code = 'FLUENCE-CLASS6-2025';

-- Test 3: Get student IDs
SELECT id, username, full_name FROM students WHERE username IN ('anaya', 'kavya');

-- Test 4: Insert test quiz result
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
  i.id,
  c.id,
  s.id,
  CURRENT_DATE,
  10,
  7,
  70.00,
  120,
  '{"questions": [{"concept_tested": "Test Concept", "is_correct": true}]}'::jsonb,
  3,
  100
FROM students s
CROSS JOIN institutions i
CROSS JOIN classes c
WHERE s.username = 'anaya'
  AND i.code = 'FLUENCE'
  AND c.class_code = 'FLUENCE-CLASS6-2025'
LIMIT 1;

-- Test 5: Insert test feedback
INSERT INTO feedback (
  student_id,
  quiz_result_id,
  feedback_type,
  strengths,
  weaknesses,
  ai_insights
)
SELECT
  s.id,
  qr.id,
  'post_quiz',
  ARRAY['Test Concept'],
  ARRAY['Weak Concept'],
  'Great job on Test Concept! Keep practicing Weak Concept.'
FROM students s
CROSS JOIN quiz_results qr
WHERE s.username = 'anaya'
ORDER BY qr.created_at DESC
LIMIT 1;

-- Test 6: Verify inserts
SELECT * FROM quiz_results ORDER BY created_at DESC LIMIT 1;
SELECT * FROM feedback ORDER BY created_at DESC LIMIT 1;
```

**All tests should pass without errors!**

---

## ✅ Final Verification

Run this comprehensive check:

```sql
-- Summary query
SELECT
  'Institutions' as entity,
  COUNT(*) as count
FROM institutions
UNION ALL
SELECT 'Teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM student_class_enrollments
UNION ALL
SELECT 'Quiz Results', COUNT(*) FROM quiz_results
UNION ALL
SELECT 'Feedback', COUNT(*) FROM feedback;
```

**Expected minimum:**
- Institutions: 1
- Teachers: 1
- Classes: 1
- Students: 2 (Anaya, Kavya)
- Enrollments: 2
- Quiz Results: 1+ (from tests)
- Feedback: 1+ (from tests)

---

## 📝 Next Steps After Database Setup

- [ ] **Import v3 n8n workflow**
  - File: `Quiz Results Handler (v3).json` (will be created next)
  - Configure credentials in workflow
  - Test with sample data

- [ ] **Update Frontend**
  - Add class_code to login flow
  - Add institution_id to webhook payload
  - Update to weekly leaderboard UI

- [ ] **Test End-to-End**
  - Student login → Take quiz → Submit
  - Verify feedback generated
  - Check weekly leaderboard updated

---

## 🆘 Troubleshooting

### Issue: "extension uuid-ossp does not exist"
**Solution:** Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue: "relation already exists"
**Solution:** Schema already applied, skip to Step 2

### Issue: "password authentication failed"
**Solution:** Check database password in n8n credentials

### Issue: Foreign key constraint violation
**Solution:** Run migrations in order: 001 → 002 → 003

---

## 📞 Support

If stuck, check:
1. Supabase Dashboard → Database → Logs
2. n8n Execution History
3. MIGRATION-GUIDE.md for detailed troubleshooting

---

**Estimated Time:** 20-30 minutes
**Last Updated:** 2025-10-27
