# DATABASE SCHEMA - QUICK REFERENCE

**Reference for:** Database queries, migrations, and schema understanding
**See Also:** MASTER-PLAN-QUIZ-V2.md (Section 4: Complete Database Schema)

---

## 📊 ENTITY RELATIONSHIP DIAGRAM

```
institutions
    ↓ (one-to-many)
teachers, students, classes, quiz_questions, quiz_results
    ↓
leaderboard, concept_mastery, feedback, weekly_reports
```

---

## 🗂️ ALL TABLES OVERVIEW

### 1. INSTITUTIONS (Root)
**Purpose:** Top-level entity for multi-tenant system
**Key Fields:** code (unique), name, type, subscription_status
**Indexes:** code, subscription_status

### 2. TEACHERS
**Purpose:** Manage students, edit content, view analytics
**Key Fields:** institution_id, email, password_hash, role
**Roles:** admin, teacher, viewer
**Indexes:** institution_id, email

### 3. STUDENTS (Modified)
**Purpose:** Take quizzes, track progress
**New Fields:** institution_id, password_hash, class_id, last_login_at
**Indexes:** institution_id, class_id, name

### 4. CLASSES
**Purpose:** Group students for analytics
**Key Fields:** institution_id, teacher_id, name, student_ids[]
**Indexes:** institution_id, teacher_id

### 5. QUIZ_QUESTIONS (Modified)
**Purpose:** Question bank
**New Fields:** institution_id, edited_by, approved_by, approval_status
**Indexes:** institution_id, student_id, active

### 6. QUIZ_RESULTS (Modified)
**Purpose:** Store quiz submissions
**New Fields:** institution_id
**Indexes:** institution_id, student_id, quiz_date

### 7. WEEKLY_LEADERBOARD (New)
**Purpose:** Weekly competition rankings
**Key Fields:** week_start_date, week_end_date, rank
**Unique:** (student_id, week_start_date)
**Indexes:** week_start_date, institution_id

### 8. RAPID_FIRE_LEADERBOARD (New)
**Purpose:** Infinite mode high scores
**Key Fields:** highest_streak, total_attempts
**Unique:** student_id
**Indexes:** institution_id

### 9. FEEDBACK (New)
**Purpose:** AI-generated learning insights
**Key Fields:** feedback_type, strengths[], weaknesses[], ai_insights
**Types:** post_quiz, weekly_summary, manual
**Indexes:** student_id, quiz_result_id

### 10. WEEKLY_REPORTS (New)
**Purpose:** Parent communication
**Key Fields:** week_start_date, ai_summary, report_html, sent_at
**Indexes:** student_id, week_start_date

### 11. CONCEPT_MASTERY (Existing)
**Purpose:** SRS tracking
**Key Fields:** mastery_score, times_practiced, next_review_date
**Indexes:** student_id, mastery_score

### 12. NOTES_HISTORY (Existing)
**Purpose:** Store class notes
**Key Fields:** note_date, content_html, concepts_covered[]

### 13. QUIZ_HISTORY (Existing)
**Purpose:** Complete quiz records for replay
**Key Fields:** questions_json, answers_json, total_score

---

## 🔍 COMMON QUERIES

### Get Institution Students
```sql
SELECT * FROM students
WHERE institution_id = $1 AND active = true
ORDER BY name;
```

### Get Student's Active Quiz
```sql
SELECT * FROM quiz_questions
WHERE student_id = $1 AND active = true
ORDER BY created_date DESC
LIMIT 30;
```

### Get This Week's Leaderboard
```sql
SELECT s.name, wl.rank, wl.total_points, wl.avg_score
FROM weekly_leaderboard wl
JOIN students s ON wl.student_id = s.id
WHERE wl.institution_id = $1
  AND wl.week_start_date = DATE_TRUNC('week', CURRENT_DATE)
ORDER BY wl.rank;
```

### Get Student's Concept Mastery
```sql
SELECT concept_name, mastery_score, next_review_date
FROM concept_mastery
WHERE student_id = $1
ORDER BY mastery_score ASC;
```

### Get Struggling Students (Teacher Dashboard)
```sql
-- Students with low concept mastery
SELECT s.name, cm.concept_name, cm.mastery_score
FROM students s
JOIN concept_mastery cm ON s.id = cm.student_id
WHERE s.institution_id = $1
  AND cm.mastery_score < 40
ORDER BY cm.mastery_score ASC;

-- Students who missed quizzes
SELECT s.name, COUNT(qr.id) as quizzes_taken
FROM students s
LEFT JOIN quiz_results qr ON s.id = qr.student_id
  AND qr.quiz_date >= CURRENT_DATE - 7
WHERE s.institution_id = $1
GROUP BY s.id, s.name
HAVING COUNT(qr.id) < 3;
```

### Get Weekly Report Data
```sql
-- This week's stats
SELECT
  COUNT(*) as total_quizzes,
  AVG(score) as avg_score,
  SUM(total_score) as total_points
FROM quiz_results
WHERE student_id = $1
  AND quiz_date >= DATE_TRUNC('week', CURRENT_DATE);

-- Concepts mastered this week
SELECT cm.concept_name, cm.mastery_score
FROM concept_mastery cm
WHERE cm.student_id = $1
  AND cm.mastery_score >= 70
  AND cm.updated_at >= DATE_TRUNC('week', CURRENT_DATE);
```

---

## 🔧 MIGRATION CHECKLIST

### Pre-Migration
- [ ] Backup current database
- [ ] Test migration on local database
- [ ] Verify all foreign keys
- [ ] Check existing data integrity

### Migration Steps
1. Create new tables (institutions, teachers, classes, etc.)
2. Alter existing tables (add institution_id, password_hash)
3. Create seed institution ("AMAN-CLASSES")
4. Migrate existing students to new schema
5. Create indexes
6. Test all queries
7. Update application code

### Post-Migration
- [ ] Verify data migrated correctly
- [ ] Test all database queries
- [ ] Update RLS policies
- [ ] Test with Anaya/Kavya logins

---

## 📝 NOTES FOR AI AGENTS

**When writing database queries:**
- ✅ Always use parameterized queries ($1, $2, etc.)
- ✅ Add WHERE clauses for institution_id (multi-tenancy)
- ✅ Use transactions for multi-table updates
- ✅ Index foreign keys and frequently queried columns
- ✅ Test with EXPLAIN ANALYZE for performance

**When updating schema:**
- ✅ Write migration SQL files (versioned)
- ✅ Never delete columns (mark deprecated instead)
- ✅ Always provide rollback scripts
- ✅ Test migrations on staging first

---

**Last Updated:** 2025-10-26
