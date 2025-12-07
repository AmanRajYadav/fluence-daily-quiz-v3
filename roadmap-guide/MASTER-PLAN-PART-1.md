# FLUENCE QUIZ V2 - MASTER PLAN (PART 1 of 2)

**⚠️ THIS IS PART 1 OF 2** - Read [MASTER-PLAN-INDEX.md](MASTER-PLAN-INDEX.md) first!

**Version:** 2.0
**Created:** 2025-10-26
**Last Updated:** 2025-10-26
**Purpose:** Primary reference for building institution-ready educational platform
**Status:** Phase 1 Complete (95%) → Phase 2 Planning (Institution Model)
**File Size:** 1,250 lines (Part 1) | 1,294 lines (Part 2) | 2,544 total
**Domains:** fluence.ac (primary), fluence.institute (future)

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
2. **Makes learning beautiful, exciting, and effortless** (gamification, Duolingo-inspired UX - clean, simple, yet captivating)
3. **Solves the Forgetting Curve** (SRS + daily engagement + personalized practice)
4. **Provides complete transparency** (progress reports, concept mastery tracking)
5. **Automates teacher's busy work** (question generation, feedback, reports)

### Available Domains
- **fluence.ac** - For academic/coaching centers
- **fluence.institute** - For larger institutions/schools

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

**Inspiration:** Duolingo (clean, simple, beautiful, exciting)
- ✅ **Beautiful & Exciting** - Every screen should feel premium and delightful
- ✅ **Clean & Simple** - Minimal clutter, maximum clarity
- ✅ Friendly and approachable (not corporate)
- ✅ Colorful but sophisticated (not overwhelming)
- ✅ Smooth animations everywhere (60fps, subtle but noticeable)
- ✅ Progress visible at all times
- ✅ Celebration of achievements (confetti, sounds, animations)

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


---

## ⚠️ CONTINUED IN PART 2

**This is the end of Part 1.**

**Next:** Read [MASTER-PLAN-PART-2.md](MASTER-PLAN-PART-2.md) for:
- Week 9-12 Development Roadmap
- Feature Specifications
- Budget & Pricing Strategy
- TODO Tracking
- Past Learnings & Solved Problems
- AI Agent Instructions
- Success Metrics
- Tech Stack Philosophy & Research Strategy

---

**Part 1 Size:** 1,250 lines ✅ (Safe - under 2,500 line limit)
**Last Updated:** 2025-10-26

