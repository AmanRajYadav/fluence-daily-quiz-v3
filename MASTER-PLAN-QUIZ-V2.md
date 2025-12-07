# FLUENCE QUIZ V2 - MASTER STRATEGIC PLAN

**Version:** 2.0
**Created:** 2025-10-26
**Last Updated:** 2025-10-26
**Purpose:** Primary reference for building institution-ready educational platform
**Status:** Phase 1 Complete (95%) → Phase 2 Planning (Institution Model)

---

## 📋 TABLE OF CONTENTS

1. [Project Vision & Identity](#project-vision--identity)
2. [Current State Analysis](#current-state-analysis)
3. [Strategic Architecture Changes](#strategic-architecture-changes)
4. [Complete Database Schema](#complete-database-schema)
5. [UI/UX Design System](#uiux-design-system)
6. [Development Roadmap (12 Weeks)](#development-roadmap-12-weeks)
7. [Feature Specifications](#feature-specifications)
8. [Budget & Pricing Strategy](#budget--pricing-strategy)
9. [TODO Tracking](#todo-tracking)
10. [Past Learnings & Solved Problems](#past-learnings--solved-problems)
11. [AI Agent Instructions](#ai-agent-instructions)
12. [Success Metrics](#success-metrics)

---

## 🎯 PROJECT VISION & IDENTITY

### Mission Statement

**Build "Jarvis for Education"** - An AI-powered learning system that:
1. **Knows students better than they know themselves** (comprehensive data tracking)
2. **Makes learning fun and effortless** (gamification, Duolingo-style UX)
3. **Solves the Forgetting Curve** (SRS + daily engagement + personalized practice)
4. **Provides complete transparency** (progress reports, concept mastery tracking)
5. **Automates teacher's busy work** (question generation, feedback, reports)

### Core Problems Being Solved

1. **The Forgetting Curve** - Students forget 70% within 24 hours, 90% within 7 days
2. **Generic Teaching** - Every student gets same homework despite unique gaps
3. **Teacher Overload** - Manual grading, worksheet creation, parent communication
4. **Lack of Visibility** - Parents/teachers don't know what's actually being learned

### Target Market

**Primary:** Coaching Centers (20-100 students)
**Secondary:** Personal Tutors (5-20 students)
**Tertiary:** Schools (100+ students)

### Revenue Model

**SaaS Subscription:**
- Personal Tutors: ₹100/student/month
- Coaching Centers: ₹150/student/month
- Schools: ₹200/student/month
- 30-day free trial to prove value

### Success Criteria (After 3 Months)

**For Students:**
- ✅ Daily quiz completion: 85%+
- ✅ Average score improvement: +15% month-over-month
- ✅ Students demand it daily (engagement proof)

**For Teachers:**
- ✅ Time saved: 10+ hours/week
- ✅ Non-tech teachers find it easy to use
- ✅ Teachers actively use dashboard 3+ times/week

**For Parents:**
- ✅ Parent engagement: 70%+ read weekly reports
- ✅ Visible proof of learning (concept mastery scores)
- ✅ Willing to pay for it

**For Business:**
- ✅ 50+ paying students across 3 institutions
- ✅ Revenue: ₹7,500+/month
- ✅ Churn rate: <10%/month

---

## 📊 CURRENT STATE ANALYSIS

### What's Built (Phase 1 - 95% Complete) ✅

**Daily Quiz System:**
- ✅ 6 question types: MCQ, True/False, Short Answer, Fill Blank, Match, Voice (placeholder)
- ✅ 30 questions auto-generated from class transcripts (n8n + Gemini)
- ✅ Streak-based scoring (gamified but learning-focused)
- ✅ Sound effects and animations (Framer Motion, Confetti)
- ✅ Mobile responsive, Duolingo-inspired UI

**Leaderboard & Competition:**
- ✅ Real-time leaderboard (daily rankings)
- ✅ Historical champions view
- ✅ Personal stats tracking

**Progress Tracking:**
- ✅ Quiz history with replay mode
- ✅ Progress charts (7/30/90 day trends)
- ✅ Concept mastery tracking in database

**Technical Infrastructure:**
- ✅ React 19 frontend (GitHub Pages deployment)
- ✅ Supabase PostgreSQL (7 tables, RLS enabled)
- ✅ n8n automation workflows:
  - Question generation (transcript → 30 questions)
  - Quiz results processing (SRS updates, leaderboard)
- ✅ Budget-conscious: ~₹500/month running costs

**Deployed:** https://amanrajyadav.github.io/fluence-daily-quiz

### What's Missing for Market Readiness ❌

**Architecture Issues:**
- ❌ Student-centric model (not scalable for institutions)
- ❌ No persistent login (students re-enter name each time)
- ❌ No institution/teacher management
- ❌ No role-based access control

**Feature Gaps:**
- ❌ Teacher Dashboard (monitoring students)
- ❌ Smart Feedback System (personalized after each quiz)
- ❌ Weekly Progress Reports (automated parent emails)
- ❌ Voice Input (students type instead of speak - frustrating)
- ❌ Question Editor (teachers can't edit auto-generated questions)
- ❌ Rapid Fire Mode (infinite quiz based on weak concepts)

**UX Issues:**
- ❌ Daily leaderboard (should be weekly)
- ❌ Short answer typing frustration (need voice input)
- ❌ No "why am I wrong?" explanations during quiz

### Current Traction (3 Months Validation) ✅

**Students:** Anaya, Kavya (daily users for 3 months)
- ✅ "They love it, demanding it daily"
- ✅ "Quiz helped them a lot"
- ✅ Students from 2-3 other teachers also loved it
- ✅ Teachers impressed: "Questions exactly based on their class"

**Pain Points Identified:**
- 🔴 Typing short answers is frustrating → Need voice input
- 🟡 Daily leaderboard feels too frequent → Weekly is better
- 🟢 Otherwise, solid engagement

---

## 🏗️ STRATEGIC ARCHITECTURE CHANGES

### CRITICAL CHANGE: Institution-Centric Model

**Current Architecture (Student-Root):**
```
Students → Quiz Questions → Results
   ↓
Problem: No way to manage multiple students per teacher/institution
```

**New Architecture (Institution-Root):**
```
Institution
  ├─ Teachers (roles: admin, teacher, viewer)
  │   ├─ Manage students
  │   ├─ Edit questions
  │   ├─ View analytics
  │   └─ Generate reports
  │
  └─ Students (belong to classes)
      ├─ Take quizzes
      ├─ See progress
      └─ Compete on leaderboard
```

### Dual Market Strategy

**1. Personal Tutors** (You + small teachers)
- Institution = Teacher's name ("Aman's Classes")
- 1 teacher = admin role
- 5-20 students
- Simplified UI, fewer admin features
- **Pricing:** ₹100-150/student/month

**2. Institutions** (Schools, coaching centers)
- Multiple teachers
- Role hierarchy: Admin > Teacher > Student
- 50-500+ students
- Full dashboard, multi-teacher management
- **Pricing:** ₹150-200/student/month

**Technical Implementation:**
- Same codebase, feature flags for tier differences
- Database: `institutions.type` = 'personal' | 'coaching' | 'school'
- UI: Conditional rendering based on institution type

### Login Flow Changes

**Old Login:**
```
Enter student name → Start quiz
Problem: No persistence, no security, not scalable
```

**New Login:**
```
┌─────────────────────────────┐
│  Institution Code            │
│  BRILLIANT-ACADEMY           │
│                              │
│  Your Name                   │
│  Anaya                       │
│                              │
│  Password                    │
│  ••••••                      │
│                              │
│  [Login - Stay Logged In]    │
└─────────────────────────────┘
```

**Features:**
- JWT-based authentication
- Persistent sessions (localStorage)
- Role-based routing (student vs teacher)
- Secure password hashing (bcrypt)

---

## 💾 COMPLETE DATABASE SCHEMA

### Migration Strategy

**Step 1:** Create new tables (institutions, teachers, classes, etc.)
**Step 2:** Migrate existing students to new schema
**Step 3:** Update all queries to reference institution_id
**Step 4:** Deploy auth system
**Step 5:** Test with Anaya/Kavya before rollout

### Core Tables

#### 1. INSTITUTIONS (Root Entity)

```sql
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,              -- "BRILLIANT-ACADEMY"
  name TEXT NOT NULL,                     -- "Brilliant Coaching Academy"
  type TEXT CHECK (type IN ('personal', 'coaching', 'school')),
  subscription_plan TEXT DEFAULT 'trial', -- 'trial', 'basic', 'premium'
  subscription_status TEXT DEFAULT 'active', -- 'active', 'trial', 'expired'
  subscription_start_date DATE,
  subscription_end_date DATE,
  max_students INT DEFAULT 10,
  max_teachers INT DEFAULT 1,
  features JSONB DEFAULT '{}'::jsonb,     -- Feature flags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_institutions_code ON institutions(code);
CREATE INDEX idx_institutions_status ON institutions(subscription_status);

-- Seed data for migration
INSERT INTO institutions (code, name, type, max_students, max_teachers) VALUES
  ('AMAN-CLASSES', 'Aman''s Personal Classes', 'personal', 50, 1);
```

#### 2. TEACHERS (Manage Students & Content)

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,            -- bcrypt hashed
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'viewer')),
  subjects TEXT[],                        -- ['Math', 'English', 'Science']
  phone TEXT,
  active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teachers_institution ON teachers(institution_id);
CREATE INDEX idx_teachers_email ON teachers(email);

-- Seed data
INSERT INTO teachers (institution_id, name, email, password_hash, role, subjects) VALUES
  (
    (SELECT id FROM institutions WHERE code = 'AMAN-CLASSES'),
    'Aman Raj Yadav',
    'aman@example.com',
    '$2b$10$...',  -- bcrypt hash of initial password
    'admin',
    ARRAY['English', 'Math', 'Science']
  );
```

#### 3. STUDENTS (Modified)

```sql
-- Add new columns to existing students table
ALTER TABLE students
  ADD COLUMN institution_id UUID REFERENCES institutions(id),
  ADD COLUMN password_hash TEXT,
  ADD COLUMN parent_email TEXT,
  ADD COLUMN class_id UUID,
  ADD COLUMN last_login_at TIMESTAMPTZ;

-- Add unique constraint
ALTER TABLE students
  ADD CONSTRAINT unique_student_per_institution
  UNIQUE(institution_id, name);

-- Create indexes
CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_class ON students(class_id);

-- Migrate existing students
UPDATE students SET institution_id = (SELECT id FROM institutions WHERE code = 'AMAN-CLASSES');
```

#### 4. CLASSES (Group Students)

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id),
  name TEXT NOT NULL,                     -- "6th Grade Math - Section A"
  grade TEXT,                             -- "6th", "7th", etc.
  subject TEXT,                           -- "Math", "English", etc.
  student_ids UUID[] DEFAULT ARRAY[]::UUID[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classes_institution ON classes(institution_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
```

#### 5. WEEKLY_LEADERBOARD (Changed from Daily)

```sql
CREATE TABLE weekly_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  student_id UUID NOT NULL REFERENCES students(id),
  week_start_date DATE NOT NULL,          -- Monday of the week
  week_end_date DATE NOT NULL,            -- Sunday of the week
  total_quizzes INT DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  avg_score NUMERIC DEFAULT 0,
  total_points INT DEFAULT 0,
  highest_streak INT DEFAULT 0,
  rank INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, week_start_date)
);

CREATE INDEX idx_weekly_leaderboard_week ON weekly_leaderboard(week_start_date);
CREATE INDEX idx_weekly_leaderboard_institution ON weekly_leaderboard(institution_id);
```

#### 6. RAPID_FIRE_LEADERBOARD (Infinite Mode)

```sql
CREATE TABLE rapid_fire_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  student_id UUID NOT NULL REFERENCES students(id),
  highest_streak INT DEFAULT 0,           -- Max questions answered correctly
  total_attempts INT DEFAULT 0,
  total_questions_attempted INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  last_played_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

CREATE INDEX idx_rapid_fire_institution ON rapid_fire_leaderboard(institution_id);
```

#### 7. FEEDBACK (AI-Generated Insights)

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  quiz_result_id UUID REFERENCES quiz_results(id),
  feedback_type TEXT CHECK (feedback_type IN ('post_quiz', 'weekly_summary', 'manual')),
  strengths TEXT[],                       -- ["Good at fractions", "Fast calculator"]
  weaknesses TEXT[],                      -- ["Struggles with decimals"]
  concepts_mastered TEXT[],               -- Concepts that went 0% → 70%+ this week
  concepts_struggling TEXT[],             -- Concepts with mastery_score < 40%
  ai_insights TEXT,                       -- Gemini-generated paragraph
  practice_worksheet_url TEXT,            -- PDF link (generated by n8n)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_student ON feedback(student_id);
CREATE INDEX idx_feedback_quiz ON feedback(quiz_result_id);
```

#### 8. WEEKLY_REPORTS (Parent Communication)

```sql
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_quizzes INT,
  avg_score NUMERIC,
  score_trend TEXT,                       -- "improving", "declining", "stable"
  concepts_mastered TEXT[],
  concepts_struggling TEXT[],
  ai_summary TEXT,                        -- Gemini-generated weekly insights
  report_html TEXT,                       -- Full HTML email content
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weekly_reports_student ON weekly_reports(student_id);
CREATE INDEX idx_weekly_reports_week ON weekly_reports(week_start_date);
```

#### 9. QUESTION_EDITS (Track Teacher Modifications)

```sql
CREATE TABLE question_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  edit_type TEXT CHECK (edit_type IN ('text', 'options', 'answer', 'explanation', 'disabled')),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_question_edits_question ON question_edits(question_id);
CREATE INDEX idx_question_edits_teacher ON question_edits(teacher_id);
```

### Existing Tables (Modified)

#### quiz_questions (Add institution_id)

```sql
ALTER TABLE quiz_questions
  ADD COLUMN institution_id UUID REFERENCES institutions(id),
  ADD COLUMN edited_by UUID REFERENCES teachers(id),
  ADD COLUMN approved_by UUID REFERENCES teachers(id),
  ADD COLUMN approval_status TEXT DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX idx_quiz_questions_institution ON quiz_questions(institution_id);
```

#### quiz_results (Add institution_id)

```sql
ALTER TABLE quiz_results
  ADD COLUMN institution_id UUID REFERENCES institutions(id);

CREATE INDEX idx_quiz_results_institution ON quiz_results(institution_id);
```

#### concept_mastery (Already good, just add index)

```sql
CREATE INDEX idx_concept_mastery_student_score
  ON concept_mastery(student_id, mastery_score);
```

---

## 🎨 UI/UX DESIGN SYSTEM

### Design Philosophy

**Inspiration:** Duolingo (cute, minimal, engaging)
- ✅ Friendly and approachable (not corporate)
- ✅ Colorful but not overwhelming
- ✅ Animations everywhere (but subtle)
- ✅ Progress visible at all times
- ✅ Celebration of achievements (confetti, sounds)

### Color Palette

```css
/* Primary Colors */
--green-primary: #58CC02;      /* Duolingo green - success, primary actions */
--blue-primary: #1CB0F6;       /* Accents, links */
--yellow-primary: #FFC800;     /* Streak, highlights */

/* Secondary Colors */
--red-error: #FF4B4B;          /* Errors, wrong answers */
--orange-warning: #FF9600;     /* Warnings, alerts */
--purple-accent: #CE82FF;      /* Power-ups, special features */

/* Neutral Colors */
--gray-50: #F7F7F7;            /* Backgrounds */
--gray-100: #E5E5E5;           /* Borders */
--gray-700: #3C3C3C;           /* Text */
--gray-900: #1F1F1F;           /* Headings */

/* Concept Mastery Heatmap */
--mastery-red: #FF4B4B;        /* 0-40% - Struggling */
--mastery-yellow: #FFC800;     /* 41-70% - Improving */
--mastery-green: #58CC02;      /* 71-100% - Mastered */
```

### Typography

```css
/* Font Family */
--font-primary: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Component Styling

```css
/* Border Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

/* Spacing */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
```

### Key UI Components

**1. Button Styles**

```jsx
// Primary Button (Green)
<button className="
  bg-green-primary hover:bg-green-600
  text-white font-bold
  px-6 py-3 rounded-full
  shadow-lg hover:shadow-xl
  transition-all duration-200
  active:scale-95
">
  Start Quiz
</button>

// Secondary Button (Blue)
<button className="
  bg-blue-primary hover:bg-blue-600
  text-white font-medium
  px-4 py-2 rounded-lg
  transition-all duration-200
">
  View Details
</button>

// Outline Button
<button className="
  border-2 border-gray-300 hover:border-gray-400
  text-gray-700 font-medium
  px-4 py-2 rounded-lg
  transition-all duration-200
">
  Cancel
</button>
```

**2. Card Component**

```jsx
<div className="
  bg-white rounded-2xl
  p-6 shadow-md hover:shadow-lg
  transition-all duration-200
  border border-gray-100
">
  {/* Card content */}
</div>
```

**3. Progress Bar**

```jsx
<div className="w-full bg-gray-200 rounded-full h-3">
  <div
    className="bg-green-primary h-3 rounded-full transition-all duration-500"
    style={{ width: `${percentage}%` }}
  />
</div>
```

**4. Concept Mastery Badge**

```jsx
{/* Red: Struggling (0-40%) */}
<span className="
  bg-red-100 text-red-700
  px-3 py-1 rounded-full text-sm font-medium
">
  Struggling
</span>

{/* Yellow: Improving (41-70%) */}
<span className="
  bg-yellow-100 text-yellow-700
  px-3 py-1 rounded-full text-sm font-medium
">
  Improving
</span>

{/* Green: Mastered (71-100%) */}
<span className="
  bg-green-100 text-green-700
  px-3 py-1 rounded-full text-sm font-medium
">
  Mastered
</span>
```

### Animation Patterns

**1. Page Transitions (Framer Motion)**

```jsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  <motion.div
    key={currentPage}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {/* Page content */}
  </motion.div>
</AnimatePresence>
```

**2. Success Celebration**

```jsx
// Confetti on quiz completion
import Confetti from 'react-confetti';

{showConfetti && (
  <Confetti
    width={window.innerWidth}
    height={window.innerHeight}
    recycle={false}
    numberOfPieces={500}
  />
)}
```

**3. Card Hover Effects**

```jsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="cursor-pointer"
>
  {/* Card content */}
</motion.div>
```

### Screen Layouts

**1. Student Login Screen**

```
┌─────────────────────────────────┐
│                                 │
│        🎓 Fluence               │
│     Learn Smarter, Not Harder   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Institution Code        │   │
│  │ BRILLIANT-ACADEMY       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Your Name               │   │
│  │ Anaya                   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Password                │   │
│  │ ••••••                  │   │
│  └─────────────────────────┘   │
│                                 │
│  [ 🔐 Login - Stay Logged In ]  │
│                                 │
│  Need help? Contact teacher     │
│                                 │
└─────────────────────────────────┘
```

**2. Student Home Screen**

```
┌─────────────────────────────────┐
│  Hi Anaya! 👋                   │
│  Streak: 🔥 15 days             │
│  Points: 💰 1,240               │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📚 Today's Quiz          │ │
│  │ English Grammar          │ │
│  │ 30 questions • 10 min    │ │
│  │                          │ │
│  │ ███████░░░ 70% Complete  │ │
│  │                          │ │
│  │ [Start Quiz →]           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🏆 This Week             │ │
│  │ Your Rank: #2            │ │
│  │ Points: 1,240            │ │
│  │ To #1: 80 points         │ │
│  │ [View Leaderboard]       │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🎯 Practice Needed       │ │
│  │ • Definite Articles (35%)│ │
│  │ • Past Perfect (58%)     │ │
│  │ [Practice Now]           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🔥 Rapid Fire            │ │
│  │ Your Best: 47 questions  │ │
│  │ [Play Now]               │ │
│  └───────────────────────────┘ │
│                                 │
│  Bottom Nav:                    │
│  [🏠 Home] [📊 Progress]        │
│  [🔥 Rapid] [⚙️ Settings]      │
└─────────────────────────────────┘
```

**3. Teacher Dashboard (Overview)**

```
┌──────────────────────────────────────────┐
│  Brilliant Academy Dashboard             │
│  Week of Jan 20-26, 2025                 │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 👥 24    │ │ ✅ 168   │ │ 📈 68%   │ │
│  │ Students │ │ Quizzes  │ │ Avg      │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│                                          │
│  🚨 Needs Attention:                     │
│  ┌────────────────────────────────────┐ │
│  │ • Kavya - Missed 3 quizzes         │ │
│  │ • Rahul - Score dropped 25%        │ │
│  │ • Priya - Concept mastery low      │ │
│  │ [View All Alerts]                  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  📊 Class Performance:                   │
│  ┌────────────────────────────────────┐ │
│  │ Average: 68% (↓ 3% from last week) │ │
│  │ Engagement: 85% (20/24 active)     │ │
│  │                                    │ │
│  │ Weak Concepts:                     │ │
│  │ 🔴 Articles (42% avg)              │ │
│  │ 🟡 Past Tense (51% avg)            │ │
│  │                                    │ │
│  │ [Generate Practice Sheet]          │ │
│  └────────────────────────────────────┘ │
│                                          │
│  📋 Recent Quizzes:                      │
│  ┌────────────────────────────────────┐ │
│  │ Anaya - 76% - Jan 26               │ │
│  │ Kavya - 82% - Jan 26               │ │
│  │ ... (more students)                │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Tabs: [Overview] [Students] [Questions]│
│         [Reports] [Settings]             │
└──────────────────────────────────────────┘
```

**4. Student Detail View (Teacher)**

```
┌──────────────────────────────────────────┐
│  ← Back to Dashboard                     │
│                                          │
│  Anaya Sharma                            │
│  6th Grade • English Grammar             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ This Week:                         │ │
│  │ • 5/5 quizzes ✅                   │ │
│  │ • Avg: 76% (↑ 8%)                  │ │
│  │ • Points: 340                      │ │
│  │ • Rank: #2                         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  📈 Progress Chart (Last 30 Days):       │
│  ┌────────────────────────────────────┐ │
│  │ [Line graph showing score trend]   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  🎯 Concept Mastery Heatmap:             │
│  ┌────────────────────────────────────┐ │
│  │ Definite Articles    [████░░░░] 35%│ │
│  │ Indefinite Articles  [████████] 82%│ │
│  │ Superlatives         [██████░░] 58%│ │
│  │ Past Perfect         [███████░] 65%│ │
│  │ Subject-Verb         [████████] 78%│ │
│  └────────────────────────────────────┘ │
│                                          │
│  📝 Recent Quiz Results:                 │
│  ┌────────────────────────────────────┐ │
│  │ Jan 26 - 76% - 23/30 correct       │ │
│  │ Jan 25 - 82% - 25/30 correct       │ │
│  │ [View All Results]                 │ │
│  └────────────────────────────────────┘ │
│                                          │
│  💬 Send Custom Feedback                 │
│  [Text Area]                             │
│  [Send Message]                          │
└──────────────────────────────────────────┘
```

---

## 🚀 DEVELOPMENT ROADMAP (12 WEEKS)

### Overview

**Total Duration:** 12 weeks (3 months)
**Development Time:** 8-9 hours/day
**Budget:** ₹5000/month
**Goal:** Production-ready platform for first paying customers

### Phase Breakdown

**Weeks 1-2:** Foundation (Auth + Institution Model)
**Weeks 3-4:** Smart Feedback System
**Weeks 5-6:** Teacher Dashboard
**Weeks 7-8:** Weekly Reports + Voice Input
**Weeks 9-10:** Rapid Fire Mode
**Weeks 11-12:** Polish + Testing

---

### WEEK 1-2: FOUNDATION & AUTH SYSTEM

**Goal:** Institution-based architecture + persistent login

#### Sprint 1.1: Database Migration (Days 1-3)

**Tasks:**
- [ ] Create migration SQL file for new tables
- [ ] Create institutions table
- [ ] Create teachers table
- [ ] Create classes table
- [ ] Create weekly_leaderboard table
- [ ] Create rapid_fire_leaderboard table
- [ ] Create feedback table
- [ ] Create weekly_reports table
- [ ] Alter existing students table (add institution_id, password_hash)
- [ ] Alter quiz_questions table (add institution_id)
- [ ] Alter quiz_results table (add institution_id)
- [ ] Create seed data (AMAN-CLASSES institution)
- [ ] Migrate Anaya/Kavya to new schema
- [ ] Test all foreign key constraints

**Acceptance Criteria:**
- ✅ All new tables created successfully
- ✅ Existing students migrated to new schema
- ✅ No data loss during migration
- ✅ All queries still work

**Files to Create/Modify:**
- `database/migrations/002_institution_model.sql`
- `database/seeds/001_test_institution.sql`

---

#### Sprint 1.2: Authentication System (Days 4-7)

**Tasks:**
- [ ] Install dependencies: `bcrypt`, `jsonwebtoken`
- [ ] Create auth service (`src/services/authService.js`)
- [ ] Implement password hashing (bcrypt)
- [ ] Implement JWT token generation/validation
- [ ] Create login API endpoint (if needed, or use Supabase Auth)
- [ ] Build LoginScreen component (`src/components/Auth/LoginScreen.jsx`)
- [ ] Implement persistent sessions (localStorage)
- [ ] Create ProtectedRoute component
- [ ] Implement role-based routing (student vs teacher)
- [ ] Add logout functionality
- [ ] Test with Anaya/Kavya credentials

**UI Components:**
- `src/components/Auth/LoginScreen.jsx`
- `src/components/Auth/ProtectedRoute.jsx`
- `src/services/authService.js`

**Acceptance Criteria:**
- ✅ Students can log in with institution code + name + password
- ✅ Sessions persist across page refreshes
- ✅ Teachers can log in with email + password
- ✅ Routing works based on role (student → quiz, teacher → dashboard)
- ✅ Logout clears session

**Design Reference:**
- Duolingo login screen (simple, clean, colorful)
- Green primary button
- Friendly error messages

---

#### Sprint 1.3: UI Redesign Foundation (Days 8-10)

**Tasks:**
- [ ] Install Nunito font from Google Fonts
- [ ] Create design system file (`src/styles/design-system.css`)
- [ ] Define CSS variables (colors, typography, spacing)
- [ ] Build bottom navigation component (`src/components/Navigation/BottomNav.jsx`)
- [ ] Redesign home screen with new color scheme
- [ ] Add animations to home screen (Framer Motion)
- [ ] Update all buttons to new design system
- [ ] Create Card component (`src/components/UI/Card.jsx`)
- [ ] Create Button component (`src/components/UI/Button.jsx`)
- [ ] Create ProgressBar component (`src/components/UI/ProgressBar.jsx`)

**Files to Create:**
- `src/styles/design-system.css`
- `src/components/Navigation/BottomNav.jsx`
- `src/components/UI/Card.jsx`
- `src/components/UI/Button.jsx`
- `src/components/UI/ProgressBar.jsx`

**Acceptance Criteria:**
- ✅ UI looks like Duolingo (cute, colorful, minimal)
- ✅ Nunito font applied throughout
- ✅ Bottom navigation works on mobile
- ✅ All colors match design system
- ✅ Animations are smooth (60fps)

---

### WEEK 3-4: SMART FEEDBACK SYSTEM

**Goal:** Students see WHY they're wrong + get personalized practice

#### Sprint 2.1: Enhanced Explanations (Days 11-13)

**Tasks:**
- [ ] Update n8n question generation prompt
- [ ] Add detailed explanation field to Gemini prompt
- [ ] Test explanation quality with sample questions
- [ ] Update all question type components to show explanation
- [ ] Add "Learn More" section after wrong answer
- [ ] Style explanation box (Duolingo-style)
- [ ] Add "Next Question" button after explanation
- [ ] Test with Anaya/Kavya

**n8n Workflow Changes:**
- Update "Gemini API - Generate Questions" node
- Modify prompt to include: "For each question, provide a detailed 2-3 sentence explanation of why the correct answer is correct and why wrong options are wrong."

**UI Components to Update:**
- `src/components/QuestionTypes/MCQQuestion.jsx`
- `src/components/QuestionTypes/TrueFalseQuestion.jsx`
- `src/components/QuestionTypes/ShortAnswerQuestion.jsx`
- `src/components/QuestionTypes/FillBlankQuestion.jsx`

**Acceptance Criteria:**
- ✅ Every question has a detailed explanation
- ✅ Explanation shows after wrong answer
- ✅ Explanation is clear and educational
- ✅ UI is visually appealing

---

#### Sprint 2.2: Post-Quiz Feedback Screen (Days 14-17)

**Tasks:**
- [ ] Create FeedbackScreen component (`src/components/Feedback/FeedbackScreen.jsx`)
- [ ] Design UI layout (Duolingo-style performance screen)
- [ ] Implement n8n workflow: "Generate Post-Quiz Feedback"
- [ ] Query answers_json to identify weak concepts
- [ ] Call Gemini API for AI insights
- [ ] Save feedback to database
- [ ] Display strengths (concepts with 100% correct)
- [ ] Display weaknesses (concepts with <60% correct)
- [ ] Show AI-generated insights paragraph
- [ ] Add "Practice These Concepts" button
- [ ] Test with real quiz data

**n8n Workflow (New):**
```
Trigger: Quiz submission webhook
  ↓
Parse answers_json
  ↓
Identify weak concepts (correct_rate < 60%)
  ↓
Gemini API: Generate insights
  ↓
Save to feedback table
  ↓
Return feedback JSON to frontend
```

**Files to Create:**
- `src/components/Feedback/FeedbackScreen.jsx`
- `n8n-workflows/post-quiz-feedback.json`

**Acceptance Criteria:**
- ✅ After quiz, student sees feedback screen
- ✅ Strengths and weaknesses clearly shown
- ✅ AI insights are personalized and actionable
- ✅ Student feels encouraged, not discouraged

**Example Feedback:**
```
🎉 Great Job, Anaya!

💪 Your Strengths:
• Indefinite Articles (5/5 correct)
• Subject-Verb Agreement (4/4 correct)

📚 Practice These:
• Definite Articles (2/5 correct)
• Past Perfect Tense (3/6 correct)

💡 AI Insights:
"You show strong understanding of basic grammar rules,
but struggle with articles in complex sentences. Try
practicing fill-in-the-blank exercises focusing on
'the' vs 'a/an' in descriptive phrases."

[Practice Worksheet] [Continue]
```

---

#### Sprint 2.3: Auto-Generated Practice Worksheets (Days 18-20)

**Tasks:**
- [ ] Create n8n workflow: "Generate Practice Worksheet"
- [ ] Trigger: Student scores <60% on a concept
- [ ] Gemini prompt: Generate 10 practice problems
- [ ] Format as markdown/HTML
- [ ] Convert to PDF (using Puppeteer or similar)
- [ ] Upload to cloud storage (Supabase Storage or Google Drive)
- [ ] Save URL in feedback table
- [ ] Add "Download Worksheet" button on feedback screen
- [ ] Test with weak concept data

**n8n Workflow (New):**
```
Trigger: Feedback generated (concept score < 60%)
  ↓
Gemini API: Generate 10 practice problems
  ↓
Format as HTML
  ↓
Convert to PDF (Puppeteer)
  ↓
Upload to Supabase Storage
  ↓
Update feedback table with URL
```

**Acceptance Criteria:**
- ✅ Student struggling with concept → Gets practice worksheet next day
- ✅ Worksheet has 10 targeted problems
- ✅ PDF is downloadable
- ✅ Quality matches teacher-created worksheets

---

### WEEK 5-6: TEACHER DASHBOARD

**Goal:** Teachers can monitor students, edit questions, manage classes

#### Sprint 3.1: Overview Dashboard (Days 21-24)

**Tasks:**
- [ ] Create TeacherDashboard component (`src/components/Teacher/Dashboard.jsx`)
- [ ] Build overview cards (students, quizzes, avg score)
- [ ] Implement alerts panel
- [ ] Query students with missed quizzes (>2 missed)
- [ ] Query students with score drops (>20% decline)
- [ ] Query students with low concept mastery (<40% on any concept)
- [ ] Display recent activity feed
- [ ] Add date range filter (this week, last week, last month)
- [ ] Style with Duolingo colors
- [ ] Make responsive (mobile + desktop)

**Database Queries:**
```sql
-- Students who missed quizzes
SELECT s.name, COUNT(qr.id) as quizzes_taken
FROM students s
LEFT JOIN quiz_results qr ON s.id = qr.student_id
  AND qr.quiz_date >= CURRENT_DATE - 7
WHERE s.institution_id = $1
GROUP BY s.id, s.name
HAVING COUNT(qr.id) < 5;

-- Students with score drops
WITH weekly_scores AS (
  SELECT student_id,
    AVG(score) FILTER (WHERE quiz_date >= CURRENT_DATE - 7) as this_week,
    AVG(score) FILTER (WHERE quiz_date >= CURRENT_DATE - 14
                       AND quiz_date < CURRENT_DATE - 7) as last_week
  FROM quiz_results
  GROUP BY student_id
)
SELECT s.name, ws.this_week, ws.last_week
FROM students s
JOIN weekly_scores ws ON s.id = ws.student_id
WHERE (ws.last_week - ws.this_week) > 20;
```

**Files to Create:**
- `src/components/Teacher/Dashboard.jsx`
- `src/components/Teacher/AlertsPanel.jsx`
- `src/components/Teacher/StatsCards.jsx`
- `src/services/teacherService.js`

**Acceptance Criteria:**
- ✅ Teacher logs in → Sees overview dashboard
- ✅ Alerts show actionable items
- ✅ Stats update in real-time
- ✅ Non-tech teacher finds it intuitive

---

#### Sprint 3.2: Student Detail View (Days 25-27)

**Tasks:**
- [ ] Create StudentDetailView component
- [ ] Display student info card (name, grade, subjects)
- [ ] Build progress chart (last 30 days)
- [ ] Implement concept mastery heatmap
- [ ] Query concept_mastery table
- [ ] Color-code concepts (red/yellow/green)
- [ ] Show quiz history list
- [ ] Add "Send Custom Feedback" form
- [ ] Implement feedback submission
- [ ] Test with Anaya's data

**UI Layout:**
```
Student Info Card
  ↓
Progress Chart (Line Graph)
  ↓
Concept Mastery Heatmap
  ↓
Recent Quiz Results
  ↓
Send Custom Feedback Form
```

**Files to Create:**
- `src/components/Teacher/StudentDetailView.jsx`
- `src/components/Teacher/ConceptMasteryHeatmap.jsx`
- `src/components/Teacher/ProgressChart.jsx`

**Acceptance Criteria:**
- ✅ Teacher clicks student → Sees detailed view
- ✅ Charts are accurate and easy to read
- ✅ Heatmap highlights weak concepts
- ✅ Teacher can send custom feedback

---

#### Sprint 3.3: Question Editor (Days 28-30)

**Tasks:**
- [ ] Create QuestionEditor component
- [ ] List all active questions for institution
- [ ] Filter by student, subject, date
- [ ] Display question card with edit button
- [ ] Implement inline editing for:
  - Question text
  - Options
  - Correct answer
  - Explanation
- [ ] Track edits in question_edits table
- [ ] Add approve/reject workflow
- [ ] Allow manual question creation
- [ ] Test editing flow

**Files to Create:**
- `src/components/Teacher/QuestionEditor.jsx`
- `src/components/Teacher/QuestionCard.jsx`
- `src/components/Teacher/EditQuestionModal.jsx`

**Acceptance Criteria:**
- ✅ Teacher can view all questions
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
- [ ] Purchase custom domain (fluence.app or similar)
- [ ] Deploy to Vercel/Netlify (better than GitHub Pages)
- [ ] Set up SSL certificate
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
- 🟡 Daily leaderboard is good → Weekly is also needed same as duolingo they should get an urge to check it again and again to see who's ahead
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
- [ ] Students can use voice input instead of typing and AI analyzes the answer
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

---

*This is your single source of truth. Keep it updated as you build. Future you will thank present you.*
