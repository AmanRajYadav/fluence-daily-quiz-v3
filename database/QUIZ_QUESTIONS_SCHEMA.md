# quiz_questions Table Schema

**Last Updated:** 2025-11-18
**Source:** Live Supabase database inspection + Migration 001_initial_schema.sql
**Total Rows:** 120 (30 active, 90 inactive)

## Table Definition (DDL)

```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,

  -- Question content
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'fill_blank', 'match', 'voice')) NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,

  -- Metadata
  concept_name TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  points INT DEFAULT 10,

  -- Status
  active BOOLEAN DEFAULT true,
  created_date DATE DEFAULT CURRENT_DATE,
  edited_by UUID REFERENCES teachers(id),
  approved_by UUID REFERENCES teachers(id),
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NOT NULL | uuid_generate_v4() | Primary key |
| `institution_id` | UUID | NOT NULL | - | FK to institutions (CASCADE delete) |
| `class_id` | UUID | NOT NULL | - | FK to classes (CASCADE delete) |
| `student_id` | UUID | NOT NULL | - | FK to students (CASCADE delete) |
| `question_text` | TEXT | NOT NULL | - | The question being asked |
| `question_type` | TEXT | NOT NULL | - | Type of question (enum) |
| `options` | JSONB | NULL | - | Options for MCQ/Match questions |
| `correct_answer` | TEXT | NOT NULL | - | The correct answer |
| `explanation` | TEXT | NULL | - | Explanation for the answer |
| `concept_name` | TEXT | NOT NULL | - | Concept being tested |
| `difficulty_level` | TEXT | NULL | 'medium' | Difficulty level (enum) |
| `points` | INTEGER | NULL | 10 | Points awarded for correct answer |
| `active` | BOOLEAN | NULL | true | Whether question is active |
| `created_date` | DATE | NULL | CURRENT_DATE | Date question was created |
| `edited_by` | UUID | NULL | - | FK to teachers (who edited) |
| `approved_by` | UUID | NULL | - | FK to teachers (who approved) |
| `approval_status` | TEXT | NULL | 'approved' | Approval status (enum) |
| `created_at` | TIMESTAMP | NULL | NOW() | Timestamp of creation |
| `updated_at` | TIMESTAMP | NULL | NOW() | Timestamp of last update |

## Enum Values (Verified from Database)

### question_type
- `mcq` (35 rows)
- `true_false` (20 rows)
- `short_answer` (25 rows)
- `fill_blank` (24 rows)
- `match` (16 rows)
- `voice` (0 rows - planned but not yet used)

### difficulty_level
- `easy` (57 rows)
- `medium` (40 rows)
- `hard` (23 rows)

### approval_status
- `pending` (0 rows)
- `approved` (120 rows)
- `rejected` (0 rows)

## Foreign Key Relationships

```
quiz_questions.institution_id → institutions.id (ON DELETE CASCADE)
quiz_questions.class_id → classes.id (ON DELETE CASCADE)
quiz_questions.student_id → students.id (ON DELETE CASCADE)
quiz_questions.edited_by → teachers.id (ON DELETE SET NULL)
quiz_questions.approved_by → teachers.id (ON DELETE SET NULL)
```

## Indexes

```sql
-- From 001_initial_schema.sql
CREATE INDEX idx_questions_class ON quiz_questions(class_id);
CREATE INDEX idx_questions_student ON quiz_questions(student_id);
CREATE INDEX idx_questions_active ON quiz_questions(active, created_date);
CREATE INDEX idx_questions_concept ON quiz_questions(concept_name);

-- From 006_add_institution_indexes.sql
CREATE INDEX idx_quiz_questions_institution ON quiz_questions(institution_id);
```

### Index Usage
- **idx_questions_class**: Fast lookups for all questions in a class
- **idx_questions_student**: Fast lookups for personalized questions per student
- **idx_questions_active**: Fast filtering for active questions by date
- **idx_questions_concept**: Fast grouping by concept for analytics
- **idx_quiz_questions_institution**: Multi-tenant performance (10-100x faster at scale)

## Options Column Format (JSONB)

The `options` column stores question choices in JSON format:

### MCQ (Multiple Choice)
```json
["Option 1", "Option 2", "Option 3", "Option 4"]
```
**Example:**
```json
["Apple", "Banana", "Cherry", "Date"]
```

### True/False
```json
["True", "False"]
```

### Match
```json
{
  "left": ["Item A", "Item B", "Item C"],
  "right": ["Match 1", "Match 2", "Match 3"]
}
```
**Alternative format (observed in database):**
```json
{
  "1": "The total length of the sides...",
  "2": "The area covered by all the faces...",
  "3": "How much space it takes inside...",
  "4": "The base line for height measurement"
}
```

### Fill Blank / Short Answer
```json
null
```
(No options needed)

## Correct Answer Format

### MCQ
Exact match of the correct option:
```
"Option 2"
```

### True/False
```
"True"
or
"False"
```

### Match
Comma-separated pairs:
```
"A-4, B-1, C-2, D-3"
```

### Fill Blank / Short Answer
Expected answer text (case-insensitive matching recommended):
```
"photosynthesis"
```

## Data Integrity Rules

### Required Fields (NOT NULL)
- `id` (auto-generated)
- `institution_id`
- `class_id`
- `student_id`
- `question_text`
- `question_type`
- `correct_answer`
- `concept_name`

### Optional Fields (NULL allowed)
- `options` (required for mcq/true_false/match, null for others)
- `explanation`
- `difficulty_level` (defaults to 'medium')
- `points` (defaults to 10)
- `active` (defaults to true)
- `created_date` (defaults to CURRENT_DATE)
- `edited_by`
- `approved_by`
- `approval_status` (defaults to 'approved')
- `created_at` (defaults to NOW())
- `updated_at` (defaults to NOW())

### Check Constraints
```sql
CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'fill_blank', 'match', 'voice'))
CHECK (difficulty_level IN ('easy', 'medium', 'hard'))
CHECK (approval_status IN ('pending', 'approved', 'rejected'))
```

## Current Data Statistics

**Total Questions:** 120
- **Active:** 30 (25%)
- **Inactive:** 90 (75%)

**By Question Type:**
- MCQ: 35 (29.2%)
- Short Answer: 25 (20.8%)
- Fill Blank: 24 (20.0%)
- True/False: 20 (16.7%)
- Match: 16 (13.3%)
- Voice: 0 (0%)

**By Difficulty:**
- Easy: 57 (47.5%)
- Medium: 40 (33.3%)
- Hard: 23 (19.2%)

**By Approval Status:**
- Approved: 120 (100%)
- Pending: 0 (0%)
- Rejected: 0 (0%)

## Differences from Migration Files

### ❌ Columns NOT Found in Actual Database
- `created_by` (referenced in docs but doesn't exist)
- `concept_id` (referenced in docs but doesn't exist)

### ✅ Columns Found in Actual Database
All other columns from the migration file are present and match the schema.

## Common Queries

### Get Active Questions for a Student Today
```sql
SELECT *
FROM quiz_questions
WHERE student_id = 'uuid-here'
  AND active = true
  AND created_date = CURRENT_DATE
ORDER BY concept_name, difficulty_level;
```

### Get All Questions for a Class
```sql
SELECT *
FROM quiz_questions
WHERE class_id = 'uuid-here'
  AND active = true
ORDER BY created_date DESC;
```

### Get Questions by Concept
```sql
SELECT concept_name, COUNT(*) as question_count
FROM quiz_questions
WHERE institution_id = 'uuid-here'
GROUP BY concept_name
ORDER BY question_count DESC;
```

### Get Unapproved Questions
```sql
SELECT *
FROM quiz_questions
WHERE approval_status = 'pending'
ORDER BY created_at ASC;
```

## Notes

1. **Personalization**: Each question is tied to a specific student via `student_id` (AI-generated personalized content)
2. **Multi-tenancy**: All questions are scoped by `institution_id` for data isolation
3. **Approval Workflow**: Questions can be reviewed by teachers before becoming active
4. **Soft Delete**: Use `active` flag instead of DELETE for historical tracking
5. **JSONB Performance**: `options` column uses JSONB for flexible schema and efficient querying
6. **Cascade Deletes**: Deleting an institution/class/student removes all associated questions
7. **Missing Columns**: `created_by` and `concept_id` are referenced in code but don't exist in actual schema

## Related Tables

- `institutions` - Parent institution
- `classes` - Class the question belongs to
- `students` - Student the question is personalized for
- `teachers` - Teachers who edited/approved the question
- `quiz_results` - Quiz submissions that answered these questions
- `concept_mastery` - SRS tracking linked by concept_name

---

**Generated by:** Claude Code schema inspection script
**Script Location:** `e:\fluence-quiz-v2\scripts\get-schema.js`
**Verification Method:** Live database query + DDL review
