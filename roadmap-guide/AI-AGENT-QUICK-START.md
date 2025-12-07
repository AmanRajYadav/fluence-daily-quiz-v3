# AI AGENT QUICK START GUIDE

**For:** Claude Code, future AI assistants working on Fluence Quiz v2
**Purpose:** Get context quickly and start building effectively

---

## 🚀 START HERE (30-Second Context)

**What is this project?**
An AI-powered educational platform that transforms how students learn through:
- Daily personalized quizzes (auto-generated from class transcripts)
- Spaced Repetition System (SRS) to beat the forgetting curve
- Smart feedback & concept mastery tracking
- Teacher dashboard for monitoring & management
- Duolingo-inspired UX (cute, engaging, minimal)

**Current Status:**
- ✅ Phase 1 (95% complete): Quiz app with 6 question types, leaderboard, history, progress charts
- 🚀 Phase 2 (Planning): Institution model, auth system, teacher dashboard, weekly reports

**Your Mission:**
Help build an institution-ready platform that schools and coaching centers will pay ₹150/student/month for.

---

## 📖 REQUIRED READING (Before Writing Code)

**Read these files IN ORDER:**

1. **[MASTER-PLAN-QUIZ-V2.md](MASTER-PLAN-QUIZ-V2.md)** ⭐ **MOST IMPORTANT**
   - Complete 12-week strategic plan
   - Database schema
   - UI/UX design system
   - Feature specifications
   - Past learnings & solved problems
   - **Read this FIRST every time you start work**

2. **[TODO.md](TODO.md)** - Current sprint tasks
   - Recently completed features
   - Current priorities
   - Session summaries

3. **[DATABASE-SCHEMA-REFERENCE.md](DATABASE-SCHEMA-REFERENCE.md)** - When writing DB queries
   - Quick schema lookup
   - Common queries
   - Migration checklist

4. **Context files** (if needed for historical reference):
   - `context/context1A.md` - Vision & architecture
   - `context/context1B.md` - Design decisions
   - `context/context1C.md` - Latest solved problems

---

## ⚡ QUICK REFERENCE

### Tech Stack
- **Frontend:** React 19 (functional components + hooks)
- **Styling:** TailwindCSS + Custom design system
- **Database:** Supabase PostgreSQL (RLS enabled)
- **Automation:** n8n workflows (question generation, quiz processing)
- **AI:** Gemini 2.5 Pro (free tier)
- **Deployment:** GitHub Pages / Vercel (pending)
- **Budget:** ₹5000/month

### Key Principles
1. **Duolingo-style UX** - Cute, colorful, minimal, engaging
2. **Institution-first** - Multi-tenant architecture (institutions → teachers → students)
3. **Security** - Frontend read-only (ANON_KEY), n8n handles writes (SERVICE_ROLE_KEY)
4. **Data persistence** - Never delete data, mark as `active = false`
5. **Mobile-first** - Test on phones early and often

### Current Architecture
```
Institution
  ├─ Teachers (admin/teacher/viewer roles)
  │   ├─ Manage students
  │   ├─ Edit questions
  │   └─ View analytics
  └─ Students (take quizzes)
      ├─ Daily quiz (30 questions, SRS-enabled)
      ├─ Progress tracking
      └─ Weekly leaderboard
```

---

## 🎯 CURRENT SPRINT (Week 1-2)

**Goal:** Build foundation for institution model + auth system

**Tasks:**
1. Database migration (new tables: institutions, teachers, classes, etc.)
2. JWT-based authentication
3. Login screen (Duolingo-style)
4. Persistent sessions (localStorage)
5. Role-based routing (student vs teacher)
6. UI redesign with design system

**See:** MASTER-PLAN-QUIZ-V2.md → Section "WEEK 1-2: FOUNDATION & AUTH SYSTEM"

---

## 🚨 CRITICAL RULES (DON'T BREAK THESE)

### Database
- ✅ Always use UUIDs for primary keys
- ✅ Always use parameterized queries ($1, $2)
- ✅ Never delete data (mark as `active = false`)
- ✅ Add institution_id to all new tables (multi-tenancy)
- ✅ Use transactions for multi-table updates
- ❌ Never expose SERVICE_ROLE_KEY in frontend

### n8n Workflows
- ✅ Always escape single quotes: `'` → `''`
- ✅ Use correct expression paths (`$json.body` vs `$('Node').json`)
- ✅ Branches execute sequentially (top → bottom), not parallel
- ✅ Test each node individually before connecting
- ❌ Never use `{{ }}` for static values (API keys, JWTs)

### React Components
- ✅ Functional components with hooks only
- ✅ Use React.memo for performance
- ✅ useCallback for functions in useEffect deps
- ✅ Reset state when props change (especially question components)
- ✅ Add loading states for async operations
- ❌ Never fetch in render (use useEffect)

### UI/UX
- ✅ Follow design system (see MASTER-PLAN-QUIZ-V2.md → Section 5)
- ✅ Use Nunito font
- ✅ Duolingo colors (green primary, blue accents)
- ✅ Rounded corners everywhere (border-radius: 12px+)
- ✅ Animations with Framer Motion
- ✅ Test on mobile Chrome/Safari
- ❌ Don't use harsh colors or corporate design

---

## 🧠 PAST LEARNINGS (Common Pitfalls)

### Match Question State Persistence
**Problem:** State persisted across questions
**Solution:** Reset state when `question.id` changes
**File:** `src/components/QuestionTypes/MatchQuestion.jsx`

### SQL Quote Escaping
**Problem:** Questions with single quotes broke inserts
**Solution:** Replace `'` with `''` in all SQL strings
**Lesson:** Always escape user input

### n8n Expression Paths
**Problem:** Wrong data path caused inserts to fail
**Solution:** Use `$json.body` for webhook data, not `$('Node').item.json`
**Lesson:** Always inspect node output before writing expressions

### Voice Input Frustration
**Problem:** Students frustrated typing short answers
**Solution:** Add Web Speech API (browser native, free)
**Status:** Planned for Week 7-8

### Weekly vs Daily Leaderboard
**Problem:** Daily reset felt too rushed
**Solution:** Changed to weekly (Monday-Sunday)
**Lesson:** Weekly competition more motivating

**See more:** MASTER-PLAN-QUIZ-V2.md → Section 10: Past Learnings

---

## 📝 WORKFLOW CHECKLIST

### Before Starting Work
- [ ] Read MASTER-PLAN-QUIZ-V2.md
- [ ] Check TODO.md for current sprint
- [ ] Review past learnings for similar problems
- [ ] Understand the feature specification
- [ ] Check database schema if writing queries

### While Writing Code
- [ ] Follow design system (colors, typography, components)
- [ ] Add loading states and error handling
- [ ] Write comments for complex logic
- [ ] Test on mobile (Chrome DevTools mobile view)
- [ ] Console.log only for debugging (remove before commit)

### After Completing Work
- [ ] Update TODO.md (mark tasks complete)
- [ ] Add solved problem to MASTER-PLAN-QUIZ-V2.md if significant
- [ ] List all files changed
- [ ] Provide testing checklist
- [ ] Suggest next tasks

---

## 🎨 DESIGN SYSTEM QUICK REF

### Colors
```css
--green-primary: #58CC02;   /* Primary buttons, success */
--blue-primary: #1CB0F6;    /* Accents, links */
--red-error: #FF4B4B;       /* Errors, wrong answers */
--yellow-primary: #FFC800;  /* Streak, highlights */
```

### Typography
- Font: Nunito (from Google Fonts)
- Headings: Bold (700-800), large
- Body: Regular (400), readable (16px base)

### Components
- Border radius: 12px+ (rounded corners everywhere)
- Shadows: Soft, subtle (no harsh borders)
- Animations: Framer Motion (smooth 60fps)
- Cards: bg-white, rounded-2xl, shadow-md

---

## 🤝 COMMUNICATION STYLE

**Be:**
- ✅ Direct and concise
- ✅ Explain WHY, not just WHAT
- ✅ Proactive about potential issues
- ✅ Suggest alternatives with trade-offs

**Ask for help when:**
- ❓ Requirements unclear
- ❓ Multiple valid approaches (need user preference)
- ❓ Breaking change affects other features
- ❓ Budget implications (new service needed)
- ❓ Stuck >30 minutes on same problem

---

## 🎯 SUCCESS METRICS

**You're doing well if:**
- ✅ Code follows design system
- ✅ Mobile UX is smooth
- ✅ No console errors
- ✅ Tests with Anaya/Kavya work
- ✅ Features match specifications
- ✅ Documentation updated

**You need help if:**
- ❌ Not sure what to build next
- ❌ Breaking existing features
- ❌ Code doesn't match design system
- ❌ Tests failing consistently
- ❌ Stuck on same issue >1 hour

---

## 📞 KEY CONTACTS

**Developer:** Aman Raj Yadav
**Phone:** +91 7999502978
**Students:** Anaya, Kavya (daily users, 3 months validation)

---

## 🔗 IMPORTANT LINKS

**Deployed App:** https://amanrajyadav.github.io/fluence-daily-quiz
**GitHub:** https://github.com/amanrajyadav (verify correct repo)
**Supabase:** [Project dashboard - get from user]
**n8n:** https://n8n.myworkflow.top (self-hosted)

---

## 💡 REMEMBER

**This is NOT just a quiz app.**

This is building "Jarvis for Education" - a system that knows students better than they know themselves.

**Every feature must:**
- ✅ Enhance student learning
- ✅ Save teacher time
- ✅ Show parents proof of progress
- ✅ Feel like Duolingo (fun, engaging, minimal)

**Success = Students demand it daily + Teachers save 10hrs/week + Parents see visible improvement**

---

**Last Updated:** 2025-10-26
**Your First Task:** Read MASTER-PLAN-QUIZ-V2.md Section 1-4, then check TODO.md for current sprint
