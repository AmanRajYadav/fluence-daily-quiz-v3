# Key Learnings from context2.md

## 📚 Critical Insights for Claude Code

This document summarizes the essential learnings from `context2.md` that every Claude Code session must internalize.

---

## 🎯 Section 9.4: What's Already Working (DON'T BREAK)

### CRITICAL PRINCIPLE: Preserve What Works

**These features are WORKING and must NOT be broken:**

1. **Recording → Transcription → Processing Flow** ✓
   - Teacher workflow is smooth
   - Google Drive sync works
   - Transcription accuracy solved (Faster Whisper Large V3)
   - n8n processing is stable

2. **WhatsApp Message Delivery** ✓
   - Parents receive messages reliably
   - Links work
   - Message format is good

3. **Summary HTML Generation** ✓
   - GitHub Pages hosting works
   - URLs are stable and shareable
   - Visit counter works

4. **Basic Quiz Functionality** ✓
   - Can load questions
   - Can display MCQs
   - Can calculate scores
   - UI is functional (being enhanced, not replaced)

### When Building New Features:
- ✅ Test that quiz still loads questions correctly
- ✅ Verify Supabase connection doesn't break existing flow
- ✅ Ensure WhatsApp messages still send
- ✅ Confirm summaries still publish to GitHub

**Bottom Line:** Don't fix what isn't broken. Build on top of working foundation.

---

## 👨‍💻 Section 9.5: User's Technical Context

### Infrastructure Available:
- **GCP VM**: n8n self-hosted at n8n.myworkflow.top (₹100/month - already paying)
- **Google Drive**: Synced, "Fluence Recordings" folder integrated
- **GitHub**: amanrajyadav account, fluence-quiz-v2 repo, Pages enabled
- **Dev Environment**: Windows, PowerShell, Git, Node.js, Claude Code, Cursor

### User's Technical Level:
- ✅ **Can**: Execute with guidance, understand code, combine AI tools, run batch files, use GitHub Desktop
- ⚠️ **Needs Guidance**: Complex SQL, advanced React patterns, debugging
- ✅ **Comfortable**: n8n visual interface, basic Git operations

**Implication:** Provide clear, step-by-step instructions. Explain complex concepts. Test thoroughly.

---

## 📁 Section 10.5: File Structure Reference

### Expected Project Structure:
```
fluence-quiz-v2/
├── public/sounds/          ← Sound files (correct.mp3, wrong.mp3, etc.)
├── src/
│   ├── components/
│   │   ├── Game/          ← GameHeader, PowerUpBar, Lives, Timer, Streak
│   │   ├── Questions/     ← MCQ, TrueFalse, Short, Voice, FillBlank, Match
│   │   ├── Menu/          ← MenuButtons, Leaderboard, Settings, Bonus, History
│   │   └── Shared/        ← Button, Card, LoadingSpinner
│   ├── utils/             ← supabase.js, sounds.js, animations.js, helpers.js
│   ├── hooks/             ← useTimer, useSound, useLeaderboard, useVoiceInput
│   └── App.js
├── .env                   ← Environment variables (NOT committed)
└── vercel.json            ← Deployment config
```

**Tech Stack Confirmed:**
- Howler.js (sounds)
- Framer Motion (animations)
- Supabase (database)
- n8n (webhooks)
- Vercel (deployment)

---

## ✅ Section 10.6: Testing Checklist Template

### For EVERY Major Feature:

**Functional Tests:**
- Test expected behavior
- Test edge cases (empty input, invalid input, network failure)

**Browser Compatibility:**
- Chrome (Desktop + Mobile)
- Safari (iOS)
- Edge, Firefox

**Performance:**
- Load time < 2s
- 60fps animations
- No memory leaks
- Optimized network requests

**Accessibility:**
- Keyboard navigation
- Screen reader compatible
- Color contrast sufficient
- Focus indicators visible

**Sign-off Criteria:**
- All critical tests pass
- All issues documented
- Ready for deployment

---

## 🚀 Section 10.7: Deployment Checklist

### Pre-Deploy:
- [ ] npm test passes
- [ ] npm run build succeeds
- [ ] No console errors
- [ ] Environment variables documented
- [ ] Database migrations applied
- [ ] Backup production database
- [ ] Git commit with clear message

### Post-Deploy Verification:
- [ ] Visit production URL
- [ ] Test critical user flow (student takes quiz)
- [ ] Check console for errors
- [ ] Test on mobile device
- [ ] Verify database writes
- [ ] Check webhook submissions
- [ ] Verify leaderboard updates
- [ ] Test all 6 question types

### Rollback Plan:
- Know previous working commit hash
- Have rollback command ready: `git revert [hash]`

---

## 🐛 Section 10.8: Common Errors & Solutions

### 1. "Failed to fetch questions from Supabase"
**Causes:** API key incorrect, RLS blocking, table doesn't exist, network issue
**Solution:** Verify API key, test query in Supabase dashboard, check RLS policies

### 2. "Webhook submission failed: 500 Internal Server Error"
**Causes:** n8n workflow error, payload format incorrect, database constraint violation
**Solution:** Check n8n execution history, validate payload schema, check constraints

### 3. "Cannot read property 'id' of undefined"
**Causes:** Accessing data before it loads, student not found, null check missing
**Solution:** Add loading state, check for null before accessing properties

### 4. "Sound not playing"
**Causes:** Audio files missing, browser autoplay blocked, Howler.js not initialized
**Solution:** Add error handling, resume audio context on user interaction

**Key Pattern:** Always add loading states, null checks, and error boundaries.

---

## ⚡ Section 10.9: Performance Optimization

### Database Optimization:
```sql
-- ✅ GOOD: Use indexed columns
SELECT * FROM quiz_questions WHERE student_id = '[uuid]' AND active = true;

-- Add indexes:
CREATE INDEX idx_quiz_questions_student_active ON quiz_questions(student_id, active);
CREATE INDEX idx_concept_mastery_review ON concept_mastery(next_review_date);
```

### Frontend Performance:
```javascript
// Code Splitting
const History = lazy(() => import('./components/Menu/History'));

// Memoization
const memoizedValue = useMemo(() => expensiveCalculation(questions), [questions]);
const memoizedCallback = useCallback(() => handleSubmit(), [dependencies]);
```

---

## 🔒 Section 10.10: Security Considerations

### NEVER Expose in Frontend:
- ✗ Supabase SERVICE_ROLE_KEY (backend only)
- ✗ n8n credentials
- ✗ API keys with write access
- ✗ Database passwords

### Safe to Expose:
- ✓ Supabase ANON_KEY (read-only via RLS)
- ✓ n8n webhook URL (POST endpoint)
- ✓ Public URLs

### RLS Policies (Critical):
```sql
-- Students can only see their own data
CREATE POLICY "Students view own quiz results"
ON quiz_results FOR SELECT
USING (student_id = auth.uid());

-- Prevent unauthorized writes from frontend
CREATE POLICY "Only backend can insert results"
ON quiz_results FOR INSERT
WITH CHECK (false); -- Disable direct inserts
```

**All writes go through n8n with SERVICE_ROLE_KEY, not from frontend.**

---

## 📖 Section 11.1: How to Use Context Documents

### Every Session Start:
1. Load entire context into memory
2. Scan Open Problems (context1.md Section 4.2) - what needs solving?
3. Review TODO list - what's current priority?
4. Check Recent Sessions (Section 4.4) - what happened recently?

### Before Proposing Solutions:
1. Check DECISIONS (Section 4.3) - was this already decided?
2. Review SOLVED (Section 4.1) - was this already solved?
3. Consider Budget (Section 8) - does this fit Jugaad philosophy?
4. Reference Knowledge Base - using proven patterns?

### When Writing Code:
1. Follow Technical Implementation specifications
2. Match patterns in Technical Patterns section
3. Verify against AI Agent Instructions
4. Test using Testing Checklist

### After Completing Work:
1. Update relevant TODO items
2. Add to SOLVED if problem fixed
3. Create DECISION entry if architectural
4. Update context if anything changed

---

## 🎯 Section 11.2: Critical Success Factors

### The System WORKS If:
1. ✅ Students take quiz DAILY (engagement)
2. ✅ All data flows to database (no stateless gaps)
3. ✅ SRS automatically schedules reviews (intelligence)
4. ✅ Parents see value (transparency)
5. ✅ Teacher time saved (automation)
6. ✅ Scores improve over time (effectiveness)
7. ✅ Learning increases infinitely (Jarvis-level teacher)

### The System FAILS If:
1. ❌ Students avoid the quiz (poor UX)
2. ❌ Data gets lost (technical issues)
3. ❌ Budget exceeded (cost overruns)
4. ❌ Teacher needs to do manual work (defeats purpose)
5. ❌ No measurable improvement (product doesn't work)

### Measure Success By:
- Daily Active Users (DAU): 100% of enrolled students
- Quiz Completion Rate: >90%
- Average Concept Mastery Score: Trending up over time
- Parent Engagement: Weekly report views
- Teacher Time Saved: 2-3 hours/week
- Student Performance: School exam scores improve

**Bottom Line:** If students don't use it daily, we've failed. Engagement is everything.

---

## 🆘 Section 11.3: When to Ask for Help

### ASK User If:
- Unclear requirements or acceptance criteria
- Need to make architectural decision (affects cost/scale)
- Hit blocker that can't resolve with available info
- Need access to credentials/keys
- Stuck on same problem for >30 minutes
- Need user testing/feedback

### DON'T Ask If:
- Information is in context documents (search first!)
- Problem has been solved before (check SOLVED section)
- Standard development decision (code patterns, naming)
- Temporary blockers (API rate limits - just wait)

### Deep Research Mode:
- If problem persists for >2 hours
- If multiple approaches tried and failed
- If architectural pivot might be needed
- User will say: "Do deep research on this"

**Rule:** Search docs thoroughly before asking. User's time is valuable.

---

## 💰 Section 11.4: Jugaad Philosophy

### Budget Rule:
- **Total budget:** ₹1500-2000/month
- **If it costs money:** Justify why free option won't work
- **If >₹500/month:** Needs strong justification

### The Pattern:
1. Identify the core requirement (not the tool)
2. Search for free tier / open source alternatives
3. Combine free tools creatively
4. Only pay when absolutely necessary or at scale

### Examples:
- ❌ Claude API ($500/mo) → ✅ Gemini 2.5 Pro (FREE)
- ❌ AWS RDS ($50/mo) → ✅ Supabase free tier ($0)
- ❌ AssemblyAI ($1000/mo) → ✅ Web Speech API (FREE)
- ❌ Custom webhook server → ✅ Existing n8n on GCP VM ($0)
- ❌ Paid chart library → ✅ Chart.js / Recharts (FREE)
- ❌ Paid auth service → ✅ Supabase Auth (FREE)

**Principle:** Reuse before buy, free before paid, simple before complex.

---

## 📝 Section 11.5: Document Maintenance

### Update Context When:
- New feature completed (add to SOLVED)
- Architecture decision made (add to DECISIONS)
- New problem discovered (add to OPEN)
- Major session with insights (add to SESSION history)
- Phase completed (update roadmap progress)
- Costs change (update budget section)

### Version Control:
- Keep in GitHub repo
- Commit whenever updated
- Tag major versions (v1.0, v1.1, etc.)

---

## 🤝 Section 11.6: Handoff Protocol

### When User Works with Claude Code:

User says: "I need to work on [feature] with Claude Code"

Claude Code should:
1. Read relevant sections of master context
2. Follow specifications
3. Test using checklist

### When Claude Code Completes Work:

Report: "Feature complete"

Then:
1. Move TODO to COMPLETED
2. Add solution to SOLVED
3. Update relevant sections
4. Suggest next priority

---

## 🎓 Summary: The Golden Rules

1. **DON'T BREAK** what's already working
2. **READ CONTEXT FIRST** before proposing solutions
3. **TEST THOROUGHLY** using checklists
4. **JUGAAD MINDSET** - free before paid
5. **DOCUMENT EVERYTHING** - update context after work
6. **ENGAGEMENT IS KEY** - if students don't use it daily, we've failed
7. **SECURITY FIRST** - never expose SERVICE_ROLE_KEY
8. **ASK FOR HELP** when stuck >30 min, not before searching docs

---

**Remember:** context2.md is the PERMANENT KNOWLEDGE BASE. It contains:
- Vision & Mission (Section 1)
- Core Concepts (Section 7.1): Jugaad, SRS, Forgetting Curve, Master Assessment
- Quality Protocols (Section 10): Testing, Deployment, Errors, Performance, Security
- AI Agent Instructions (Section 11): How to use docs, success factors, when to ask help

**This knowledge must be internalized and applied to every task.**

---

**Last Updated:** 2025-10-05
**Source:** E:\fluence-quiz-v2\context\context2.md
**Purpose:** Quick reference for critical learnings from permanent knowledge base
