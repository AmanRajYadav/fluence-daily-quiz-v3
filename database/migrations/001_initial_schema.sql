-- ============================================
-- FLUENCE QUIZ V3 - INITIAL SCHEMA
-- ============================================
-- Migration: 001_initial_schema.sql
-- Created: 2025-10-27
-- Purpose: Institution-centric architecture with multi-class enrollment
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. INSTITUTIONS (Root Entity)
-- ============================================
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_email TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_institutions_code ON institutions(code);
COMMENT ON TABLE institutions IS 'Root entity - coaching centers, schools, or individual teachers';

-- ============================================
-- 2. TEACHERS
-- ============================================
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,

  -- Auth
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  -- Profile
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'viewer')) DEFAULT 'teacher',

  -- Status
  active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teachers_institution ON teachers(institution_id);
CREATE INDEX idx_teachers_email ON teachers(email);
COMMENT ON TABLE teachers IS 'Teachers can be admin (full control), teacher (manage students), or viewer (read-only)';

-- ============================================
-- 3. CLASSES
-- ============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,

  -- Class identification
  class_code TEXT UNIQUE NOT NULL,
  class_name TEXT NOT NULL,
  session TEXT NOT NULL,
  description TEXT,
  subject TEXT,

  -- Settings
  active BOOLEAN DEFAULT true,
  max_students INT DEFAULT 100,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_classes_code ON classes(class_code);
CREATE INDEX idx_classes_institution ON classes(institution_id);
CREATE INDEX idx_classes_session ON classes(session);
COMMENT ON TABLE classes IS 'Classes are identified by class_code (students use this to join)';
COMMENT ON COLUMN classes.session IS 'Format: 2025-26 OR Sep-Dec';

-- ============================================
-- 4. STUDENTS
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,

  -- Identity
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  pin_hash TEXT NOT NULL,

  -- Contact (for recovery and reports)
  email TEXT,
  phone_number TEXT NOT NULL,
  parent_email TEXT,

  -- Settings
  session TEXT NOT NULL,
  must_change_pin BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,

  -- Activity
  active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints: Username unique per institution (same username across all classes)
  UNIQUE(institution_id, username)
);

CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_username ON students(institution_id, username);
CREATE INDEX idx_students_email ON students(email) WHERE email IS NOT NULL;
CREATE INDEX idx_students_phone ON students(institution_id, phone_number);
CREATE INDEX idx_students_session ON students(session);
COMMENT ON TABLE students IS 'Students can enroll in multiple classes with same username';
COMMENT ON COLUMN students.username IS 'Unique per institution - e.g., anaya01 works across all classes';
COMMENT ON COLUMN students.email IS 'Optional - used for PIN recovery via email';

-- ============================================
-- 5. STUDENT_CLASS_ENROLLMENTS (Many-to-Many)
-- ============================================
CREATE TABLE student_class_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,

  -- Enrollment status
  status TEXT CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',

  joined_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  UNIQUE(student_id, class_id)
);

CREATE INDEX idx_enrollments_student ON student_class_enrollments(student_id);
CREATE INDEX idx_enrollments_class ON student_class_enrollments(class_id);
CREATE INDEX idx_enrollments_status ON student_class_enrollments(status);
COMMENT ON TABLE student_class_enrollments IS 'Allows same student (anaya01) to be in English + Math + Science';

-- ============================================
-- 6. PIN_RESET_TOKENS (Email Recovery)
-- ============================================
CREATE TABLE pin_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reset_tokens_token ON pin_reset_tokens(token);
CREATE INDEX idx_reset_tokens_student ON pin_reset_tokens(student_id);
CREATE INDEX idx_reset_tokens_expires ON pin_reset_tokens(expires_at);
COMMENT ON TABLE pin_reset_tokens IS 'Email-based PIN recovery - tokens expire in 1 hour';

-- ============================================
-- 7. LOGIN_ATTEMPTS (Rate Limiting & Security)
-- ============================================
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  class_code TEXT,
  success BOOLEAN,
  failure_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_identifier ON login_attempts(identifier, attempted_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, attempted_at);
COMMENT ON TABLE login_attempts IS 'Track login attempts for rate limiting (3 attempts per 15 min)';

-- ============================================
-- 8. USER_SESSIONS (Persistent Login)
-- ============================================
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type TEXT CHECK (user_type IN ('student', 'teacher')) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id, user_type);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
COMMENT ON TABLE user_sessions IS 'Persistent login sessions for "Remember me" functionality';

-- ============================================
-- 9. QUIZ_QUESTIONS (Question Bank)
-- ============================================
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

CREATE INDEX idx_questions_class ON quiz_questions(class_id);
CREATE INDEX idx_questions_student ON quiz_questions(student_id);
CREATE INDEX idx_questions_active ON quiz_questions(active, created_date);
CREATE INDEX idx_questions_concept ON quiz_questions(concept_name);
COMMENT ON TABLE quiz_questions IS 'Personalized questions per student, generated by AI';
COMMENT ON COLUMN quiz_questions.options IS 'JSON array for MCQ/Match: ["option1", "option2", ...]';

-- ============================================
-- 10. QUIZ_RESULTS (Quiz Submissions)
-- ============================================
CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,

  -- Quiz data
  quiz_date DATE DEFAULT CURRENT_DATE,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  time_taken_seconds INT,

  -- Detailed answers (for replay)
  answers_json JSONB NOT NULL,

  -- Gamification
  streak_count INT DEFAULT 0,
  bonus_points INT DEFAULT 0,
  total_points INT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quiz_results_student ON quiz_results(student_id, quiz_date);
CREATE INDEX idx_quiz_results_class ON quiz_results(class_id, quiz_date);
CREATE INDEX idx_quiz_results_date ON quiz_results(quiz_date);
COMMENT ON TABLE quiz_results IS 'Stores complete quiz submissions with answers for replay';

-- ============================================
-- 11. CONCEPT_MASTERY (SRS Tracking)
-- ============================================
CREATE TABLE concept_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,

  -- Mastery tracking
  mastery_score INT DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  times_practiced INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  times_wrong INT DEFAULT 0,

  -- SRS (Spaced Repetition System)
  next_review_date DATE,
  last_reviewed_date DATE,

  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(student_id, concept_name)
);

CREATE INDEX idx_concept_mastery_student ON concept_mastery(student_id);
CREATE INDEX idx_concept_mastery_score ON concept_mastery(mastery_score);
CREATE INDEX idx_concept_mastery_review ON concept_mastery(next_review_date);
COMMENT ON TABLE concept_mastery IS 'Tracks student understanding per concept using SRS algorithm';

-- ============================================
-- 12. DAILY_LEADERBOARD (Daily Rankings)
-- ============================================
CREATE TABLE daily_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,

  quiz_date DATE NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  time_taken_seconds INT,
  rank INT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(student_id, class_id, quiz_date)
);

CREATE INDEX idx_daily_leaderboard_class ON daily_leaderboard(class_id, quiz_date);
CREATE INDEX idx_daily_leaderboard_date ON daily_leaderboard(quiz_date);
COMMENT ON TABLE daily_leaderboard IS 'Daily rankings per class';

-- ============================================
-- 13. WEEKLY_LEADERBOARD (Weekly Rankings)
-- ============================================
CREATE TABLE weekly_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,

  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,

  total_points INT DEFAULT 0,
  quizzes_taken INT DEFAULT 0,
  avg_score DECIMAL(5,2) DEFAULT 0,
  rank INT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(student_id, class_id, week_start_date)
);

CREATE INDEX idx_weekly_leaderboard_class ON weekly_leaderboard(class_id, week_start_date);
CREATE INDEX idx_weekly_leaderboard_week ON weekly_leaderboard(week_start_date);
COMMENT ON TABLE weekly_leaderboard IS 'Weekly rankings per class';

-- ============================================
-- 14. FEEDBACK (AI-Generated Insights)
-- ============================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  quiz_result_id UUID REFERENCES quiz_results(id) ON DELETE CASCADE,

  feedback_type TEXT CHECK (feedback_type IN ('post_quiz', 'weekly_summary', 'manual')) NOT NULL,

  strengths TEXT[],
  weaknesses TEXT[],
  ai_insights TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_student ON feedback(student_id);
CREATE INDEX idx_feedback_quiz ON feedback(quiz_result_id);
COMMENT ON TABLE feedback IS 'AI-generated personalized feedback after quizzes';

-- ============================================
-- 15. WEEKLY_REPORTS (Parent Communication)
-- ============================================
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,

  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,

  ai_summary TEXT,
  report_html TEXT,

  sent_at TIMESTAMP,
  sent_to_email TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(student_id, week_start_date)
);

CREATE INDEX idx_weekly_reports_student ON weekly_reports(student_id);
CREATE INDEX idx_weekly_reports_week ON weekly_reports(week_start_date);
COMMENT ON TABLE weekly_reports IS 'Automated weekly progress reports sent to parents';

-- ============================================
-- 16. QUIZ_HISTORY (Replay Mode)
-- ============================================
CREATE TABLE quiz_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,

  questions_json JSONB NOT NULL,
  answers_json JSONB NOT NULL,
  total_score DECIMAL(5,2) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quiz_history_student ON quiz_history(student_id, quiz_date);
CREATE INDEX idx_quiz_history_class ON quiz_history(class_id, quiz_date);
COMMENT ON TABLE quiz_history IS 'Complete quiz data for replay functionality';

-- ============================================
-- 17. NOTES_HISTORY (Class Notes Archive)
-- ============================================
CREATE TABLE notes_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,

  note_date DATE NOT NULL,
  content_html TEXT NOT NULL,
  concepts_covered TEXT[],

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_history_class ON notes_history(class_id, note_date);
CREATE INDEX idx_notes_history_student ON notes_history(student_id, note_date);
COMMENT ON TABLE notes_history IS 'AI-generated class notes from transcripts';

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fluence Quiz V3 schema created successfully!';
  RAISE NOTICE 'Total tables: 17';
  RAISE NOTICE 'Next step: Run 002_seed_fluence_institution.sql';
END $$;
