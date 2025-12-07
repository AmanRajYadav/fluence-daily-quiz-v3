# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**Fluence Quiz v2** - A gamified educational quiz platform built to solve the Forgetting Curve problem through Spaced Repetition System (SRS) and daily engagement.

**Mission:** Create "the greatest teacher ever existed" - an AI system that knows students better than they know themselves, makes learning **beautiful, exciting, and effortless**, and delivers measurable results.

**Domains:**
- **fluence.ac** - Primary domain (quiz platform for students, teachers, institutions)
- **fluence.institute** - Secondary domain (future project - teacher training or similar)

## 📋 Essential Context Files (READ FIRST)

**CRITICAL:** Before making ANY changes, read these files in order:

### Primary Strategic Plan (NEW - October 2025)
1. **`roadmap-guide/MASTER-PLAN-INDEX.md`** ⭐ - Navigation guide for split master plan
2. **`roadmap-guide/MASTER-PLAN-PART-1.md`** - Strategic plan Part 1 (1,276 lines - Sections 1-6)
3. **`roadmap-guide/MASTER-PLAN-PART-2.md`** - Strategic plan Part 2 (1,326 lines - Sections 7-15)

### Quick References
4. **`roadmap-guide/AI-AGENT-QUICK-START.md`** - 30-second context for AI agents
5. **`roadmap-guide/DATABASE-SCHEMA-REFERENCE.md`** - Quick database queries
6. **`roadmap-guide/TECH-STACK-PHILOSOPHY.md`** - Tech research guide (TechCrunch, Reddit, Twitter)

### Historical Context
7. **`.claude-session-config.md`** - Session protocols and automation rules
8. **`context/context1.md`** - Historical context (vision, architecture, solved problems)
9. **`context/context2.md`** - Knowledge Base (Jugaad philosophy, SRS algorithm, quality protocols)
10. **`TODO.md`** - Current task tracking and priorities

**⚠️ FILE SIZE MONITORING:** Always check file sizes before editing. Files >2,500 lines cannot be read by Claude Code. Split at 2,400 lines.

```bash
# Check file size
wc -l filename.md
```

These context files contain critical architectural decisions, solved problems, and lessons learned. **Always check if a problem has been solved before** (Part 2 Section 11: Past Learnings) and **always check if a decision has been made** (context1.md Section 4.3).

## 🛠️ Development Commands

### Start Development Server
```bash
npm start
```
Opens http://localhost:3000 with hot reload.

### Build for Production
```bash
npm run build
```
Creates optimized production build in `build/` folder.

### Run Tests
```bash
npm test
```
Launches Jest test runner in watch mode.

### Deploy to Production
```bash
npm run deploy
```
**Current:** GitHub Pages (https://amanrajyadav.github.io/fluence-quiz)
**Future (Week 12):** Vercel/Netlify with custom domain (fluence.ac)

## 🏗️ Architecture Overview

### Core Data Flow

```
Student Quiz Attempt
    ↓
Quiz App (React) - Frontend with read-only ANON_KEY
    ↓
n8n Webhook (https://n8n.myworkflow.top/webhook/quiz-submit)
    ↓
n8n Workflow (SERVICE_ROLE_KEY) - Handles all database writes
    ├─ INSERT quiz_results
    ├─ UPDATE concept_mastery (SRS algorithm)
    └─ UPSERT leaderboard (atomic rank calculation)
    ↓
Supabase PostgreSQL Database
    ↓
Real-time Updates via Supabase Realtime (read-only)
    ↓
Quiz App displays leaderboard
```

**CRITICAL SECURITY RULE:** Frontend NEVER writes to database directly. All writes go through n8n with SERVICE_ROLE_KEY.

**⚠️ ARCHITECTURE EVOLUTION (Phase 2 - In Progress):**
Current architecture is **student-centric**. Transitioning to **institution-centric** model:
```
Institution
  ├─ Teachers (admin/teacher/viewer roles)
  │   ├─ Manage students
  │   ├─ Edit questions
  │   └─ View analytics
  └─ Students (take quizzes)
```
See `roadmap-guide/MASTER-PLAN-PART-1.md` Section 3 for complete architecture changes.

### Component Architecture

**App.js** - Main game controller:
- Game state management (menu, playing, results)
- Lives system (3 hearts)
- Timer (60s per question with visual countdown)
- Power-ups (50:50, Blaster, +30s)
- Streak tracking
- Score calculation
- Question flow control

**Question Types** (in `src/components/QuestionTypes/`):
- **MCQQuestion.jsx** - Multiple choice
- **TrueFalseQuestion.jsx** - True/False
- **ShortAnswerQuestion.jsx** - Short text answers
- **FillBlankQuestion.jsx** - Fill in the blank (**Fixed:** onBlur/onKeyPress submission, not onChange)
- **MatchQuestion.jsx** - Match pairs (**Fixed:** Only auto-submits when ALL items matched)
- **VoiceAnswerQuestion.jsx** - Voice input (placeholder)

**Services** (in `src/services/`):
- **supabaseClient.js** - Supabase configuration (ANON_KEY)
- **quizService.js** - Fetch questions, student data (read-only)
- **webhookService.js** - Submit quiz results to n8n
- **historyService.js** - Save quiz history
- **soundService.js** - Howler.js sound management (⚠️ Currently has 403 errors on external URLs)

**Hooks** (in `src/hooks/`):
- **useTimer.js** - 60-second countdown timer
- **usePowerUps.js** - Power-up state management

**Utilities** (in `src/utils/`):
- **answerChecker.js** - Validate student answers
- **scoreCalculator.js** - Calculate final scores
- **timeUtils.js** - Time formatting utilities

### Database Architecture (Supabase PostgreSQL)

**Current (Phase 1): 7 Core Tables**
1. **students** - Student profiles
2. **quiz_questions** - Question bank (student_id, active flag)
3. **quiz_results** - Complete quiz submissions
4. **leaderboard** - Daily rankings (UNIQUE: student_id + quiz_date)
5. **concept_mastery** - SRS tracking (mastery_score, next_review_date)
6. **quiz_history** - Historical quiz data
7. **notes_history** - Class notes archive

**Planned (Phase 2): 13 Tables Total**
- Adding: institutions, teachers, classes, weekly_leaderboard, rapid_fire_leaderboard, feedback, weekly_reports
- See `roadmap-guide/DATABASE-SCHEMA-REFERENCE.md` for complete schema

**RLS Policies:**
- Frontend has **read-only access** (ANON_KEY)
- All writes handled by n8n (SERVICE_ROLE_KEY)
- Students can only view their own data
- Multi-tenancy via institution_id (Phase 2)

### n8n Workflow (Quiz Results Handler - IMPROVED)

**Location:** `Quiz-Results-Handler-IMPROVED.json`

**Process Flow:**
1. Webhook receives quiz results
2. Parse & validate data
3. **Parallel branches** (execute sequentially: top → middle → bottom):
   - Branch 1: INSERT quiz_results
   - Branch 2: UPDATE concept_mastery (SRS algorithm)
   - Branch 3: UPSERT leaderboard + atomic rank calculation
4. Prepare response with rank
5. Return to frontend

**Key Optimizations:**
- UPSERT pattern: `INSERT ... ON CONFLICT ... DO UPDATE` (idempotent)
- Atomic rank calculation using Window Functions: `ROW_NUMBER() OVER (ORDER BY score DESC, time_taken_seconds ASC)`
- Single SQL query instead of loops (10x faster)

## 🐛 Known Issues & Solutions

### Sound Files 403 Error
**Issue:** External sound URLs from mixkit.co are blocked
**Solution:** Download local sound files to `public/sounds/` and update Howler.js paths
**Status:** Pending (TODO-BUG-P1-008)

### Fill-Blank Keystroke Bug (FIXED)
**Issue:** Lives deducted on every keystroke
**Solution:** Changed to onBlur/onKeyPress submission instead of onChange
**File:** `src/components/QuestionTypes/FillBlankQuestion.jsx`

### Match Question Auto-Submit (FIXED)
**Issue:** Auto-submitted on first match
**Solution:** Only auto-submits when `matchedCount === leftItemsCount`
**File:** `src/components/QuestionTypes/MatchQuestion.jsx`

### Leaderboard Infinite Loop (FIXED)
**Issue:** "Maximum update depth exceeded" error
**Solution:** Wrapped `loadLeaderboard` with `useCallback`
**File:** `src/components/Leaderboard.jsx`

## 🎨 Tech Stack

**Frontend:**
- React 19 (functional components with hooks)
- TailwindCSS (utility-first styling)
- Framer Motion (animations)
- Howler.js (sound effects)
- Lucide React (icons)
- React Confetti (celebrations)

**Backend/Services:**
- Supabase (PostgreSQL + Realtime + Auth)
- n8n (self-hosted at n8n.myworkflow.top)
- Gemini 2.5 Pro (question generation, AI feedback)

**Deployment:**
- Current: GitHub Pages
- Future: Vercel/Netlify (fluence.ac domain)

**Monitoring (Planned):**
- Sentry (error tracking)
- Mixpanel/PostHog (analytics)

**Key Libraries:**
```json
{
  "@supabase/supabase-js": "^2.58.0",
  "framer-motion": "^12.23.22",
  "howler": "^2.2.4",
  "lucide-react": "^0.525.0",
  "react": "^19.1.0",
  "react-confetti": "^6.4.0"
}
```

## 📐 Design Patterns & Conventions

### Answer Submission Pattern
```javascript
// ❌ DON'T: Submit on every onChange
const handleChange = (e) => {
  onAnswerSelect(e.target.value); // Triggers on every keystroke!
};

// ✅ DO: Submit on blur or Enter key
const handleBlur = () => {
  if (answer.trim() && !showResult) {
    onAnswerSelect(answer);
  }
};

const handleKeyPress = (e) => {
  if (e.key === 'Enter' && answer.trim() && !showResult) {
    onAnswerSelect(answer);
  }
};
```

### Auto-Submit Validation
```javascript
// ✅ Always check completion state before auto-submitting
useEffect(() => {
  const totalItems = options.left?.length || 0;
  const matchedCount = Object.keys(matches).length;

  if (matchedCount === totalItems && matchedCount > 0 && !showResult) {
    onAnswerSelect(JSON.stringify(matches));
  }
}, [matches, options.left, onAnswerSelect, showResult]);
```

### useCallback for Functions in useEffect
```javascript
// ✅ Prevent infinite loops
const loadLeaderboard = useCallback(async () => {
  const data = await getTodaysLeaderboard();
  setLeaderboard(data);
}, []);

useEffect(() => {
  loadLeaderboard();
  const subscription = subscribeToLeaderboard(loadLeaderboard);
  return () => subscription.unsubscribe();
}, [loadLeaderboard]); // Dependency won't change
```

## 🔒 Security Rules

### Environment Variables
```bash
# .env (NEVER commit)
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...  # Read-only key
REACT_APP_N8N_WEBHOOK_URL=https://n8n.myworkflow.top/webhook/quiz-submit
```

**NEVER expose in frontend:**
- ✗ Supabase SERVICE_ROLE_KEY (backend only)
- ✗ n8n credentials
- ✗ Database passwords

**Safe to expose:**
- ✓ Supabase ANON_KEY (read-only via RLS)
- ✓ n8n webhook URL (POST endpoint)

## 💰 Tech Stack Philosophy (Budget: ₹5,000/month)

### Core Principles

**1. Modern & Efficient FIRST ⚡**
- Always research latest best practices
- Use modern frameworks and tools
- Stay current with tech trends
- **Research Sources:** TechCrunch, Reddit (r/webdev, r/reactjs), Twitter (#buildinpublic), GitHub

**2. Stability & Security SECOND 🔒**
- Don't compromise on reliability
- Security is non-negotiable
- Test thoroughly before deploying

**3. Budget-Conscious ALWAYS 💰**
- Free tier before paid service
- Open source before proprietary
- Self-hosted if cost-effective

**Mantra:** *"Modern first, stable always, cheap when possible."*

### Research Before Building

**Before choosing ANY technology:**
1. Web search (2-3 hours minimum)
2. Check GitHub (stars, issues, activity)
3. Read Reddit threads (real experiences)
4. Check TechCrunch (industry trends)
5. Document decision

See `roadmap-guide/TECH-STACK-PHILOSOPHY.md` for complete research process.

### Current Budget
- **Testing (0-10 students):** ~₹670/month
- **Beta (10-50 students):** ~₹4,000/month
- **Production (50-100 students):** ~₹5,800/month

**Examples:**
- ✅ Gemini 2.5 Pro (FREE) instead of Claude API ($500/mo)
- ✅ Supabase free tier instead of AWS RDS ($50/mo)
- ✅ Web Speech API (FREE) instead of AssemblyAI ($1000/mo)
- ✅ Self-hosted n8n on existing GCP VM (₹100/mo)

## 📝 Documentation Requirements

### After Fixing a Bug
1. Add entry to `context/context1.md` Section 4.1 (SOLVED-YYYY-MM-DD-XXX)
2. Update `TODO.md` (mark task completed)
3. Document lessons learned

### After Making Architectural Decision
1. Add entry to `context/context1.md` Section 4.3 (DECISION-YYYY-MM-DD-XXX)
2. Explain rationale and alternatives considered

### Session End
1. Run `/session-summary` (or trigger manually)
2. Updates `context/context1.md` Section 4.4 (SESSION entries)
3. Updates `TODO.md` with session summary

## 🚨 Critical Success Factors

**System WORKS if:**
- ✅ Students take quiz DAILY (engagement is everything)
- ✅ All data flows to database (no stateless gaps)
- ✅ SRS schedules reviews automatically
- ✅ Real-time leaderboard updates working

**System FAILS if:**
- ❌ Students avoid quiz (poor UX)
- ❌ Data gets lost (technical issues)
- ❌ Budget exceeded (cost overruns)

**Measure Success:**
- Daily Active Users: 100% of enrolled students
- Quiz Completion Rate: >90%
- Concept Mastery Score: Trending up

## 🔧 Debugging Checklist

### Quiz Not Loading
1. Check Supabase connection (API key correct?)
2. Check RLS policies (student can read?)
3. Check console for errors
4. Verify `active=true` flag on questions

### Webhook Submission Fails
1. Check n8n execution history for errors
2. Validate payload format
3. Check database constraints (valid UUIDs?)
4. Verify n8n server running

### Leaderboard Not Updating
1. Check Supabase Realtime enabled on table
2. Verify subscription in `Leaderboard.jsx`
3. Check n8n workflow completed successfully
4. Verify Window Function query in n8n

## 📚 Additional Resources

**Strategic Planning Docs (roadmap-guide/):**
- `MASTER-PLAN-INDEX.md` ⭐ - Navigation guide (START HERE)
- `MASTER-PLAN-PART-1.md` - Vision, database, UI/UX, roadmap weeks 1-8
- `MASTER-PLAN-PART-2.md` - Roadmap weeks 9-12, features, budget, learnings
- `DATABASE-SCHEMA-REFERENCE.md` - Quick database reference
- `TECH-STACK-PHILOSOPHY.md` - Research process, approved sources
- `AI-AGENT-QUICK-START.md` - 30-second context

**Reference Files:**
- `N8N-BEST-PRACTICES.md` - SQL injection prevention, security, performance
- `LEADERBOARD-SETUP-INSTRUCTIONS.md` - n8n workflow setup
- `DUPLICATE-PREVENTION-EXAMPLES.md` - How duplicate detection works
- `CONTEXT-FILES-EXPLAINED.md` - File structure guide
- `KEY-LEARNINGS-FROM-CONTEXT2.md` - Quick reference from knowledge base

**Important Sections in context2.md:**
- Section 9.4: What's Already Working (DON'T BREAK)
- Section 10.6: Testing Checklist Template
- Section 10.7: Deployment Checklist
- Section 10.8: Common Error Messages & Solutions
- Section 11: AI Agent Instructions (how to use context docs, when to ask for help)

**Important Sections in MASTER-PLAN-PART-2.md:**
- Section 11: Past Learnings & Solved Problems (check BEFORE solving similar problems)
- Section 12: AI Agent Instructions (how to work with this codebase)
- Section 15: Tech Stack Philosophy & Research Strategy

## 🎯 When to Ask for Help

**ASK if:**
- Unclear requirements or acceptance criteria
- Need to make architectural decision (affects cost/scale)
- Hit blocker that can't resolve with available info
- Stuck on same problem for >30 minutes

**DON'T ASK if:**
- Information is in context documents (search first!)
- Problem has been solved before (check context1.md Section 4.1)
- Standard development decision (code patterns, naming)

## 🚀 Quick Start Workflow

### For New Session (AI Agents)
1. **Read strategic plan** (`roadmap-guide/MASTER-PLAN-INDEX.md` → Part 1 & 2)
2. **Check TODO.md** for current sprint priorities
3. **Review past learnings** (MASTER-PLAN-PART-2.md Section 11) - don't repeat solutions
4. **Check DECISIONS** (context1.md Section 4.3) - understand architectural choices
5. **Verify file sizes** (`wc -l *.md`) - split if >2,400 lines
6. **Make changes** following established patterns
7. **Test thoroughly** using Section 10.6 checklist from context2.md
8. **Document** in TODO.md and update past learnings if significant

### For Tech Decisions
1. **Research first** (TechCrunch, Reddit, Twitter, GitHub)
2. **Follow process** in `roadmap-guide/TECH-STACK-PHILOSOPHY.md`
3. **Document decision** with reasoning and alternatives
4. **Set review date** (3-6 months)

---

## 🎯 Product Vision (Updated October 2025)

**Remember:** This is NOT just a quiz app. It's building "Jarvis for Education" - a system that knows students better than they know themselves.

**Phase 1 (COMPLETE - 95%):** Student quiz app with gamification
**Phase 2 (IN PROGRESS):** Institution-ready platform with teacher dashboard

**12-Week Roadmap:**
- Weeks 1-2: Auth + Institution model
- Weeks 3-4: Smart feedback system
- Weeks 5-6: Teacher dashboard
- Weeks 7-8: Weekly reports + Voice input
- Weeks 9-10: Rapid Fire mode
- Weeks 11-12: Polish + Launch

**Target:** First paying customers by Month 4 (₹150/student/month)

**UI/UX Philosophy:**
- **Beautiful & Exciting** (premium, delightful)
- **Clean & Simple** (minimal clutter)
- **Duolingo-inspired** (cute, colorful, engaging)
- **60fps animations** (smooth, modern)

**Engagement is everything.** If students don't use it daily, we've failed.

**Domains:** fluence.ac (primary), fluence.institute (future)

---

**Last Updated:** 2025-10-26
**Current Focus:** Strategic planning complete, ready to start Week 1 development
**See:** `roadmap-guide/MASTER-PLAN-INDEX.md` for complete strategic plan
