# Fluence Quiz v2 - Documentation Index

**Last Updated:** 2025-10-15
**Purpose:** Quick reference guide to all project documentation

---

## 📚 QUICK START GUIDE

### For Daily Development
1. **Check:** [TODO.md](TODO.md) - Today's tasks and recent completions
2. **Reference:** [MASTER-PLAN.md](MASTER-PLAN.md) - Big picture and long-term roadmap
3. **Need context?** Read [context1A.md](context/context1A.md) - Master context document

### For New Claude Code Sessions
1. Read [.claude-session-config.md](.claude-session-config.md) - Session startup protocol
2. Follow the mandatory context loading sequence
3. Confirm context loaded before starting work

---

## 📁 DOCUMENTATION STRUCTURE

### Tier 1: Master Context (Vision & Architecture)

#### [context/context1A.md](context/context1A.md) - FROZEN
**Lines:** ~2500 | **Status:** Read-only reference

**Contents:**
- Section 1: Project Identity & Vision (Mission, philosophy, success criteria)
- Section 2: Current Project State (Architecture, students, content)
- Section 3: Technical Implementation (Database schema, n8n workflows, quiz app specs)

**When to read:** Understanding project vision, checking database schema, reviewing n8n workflows

---

#### [context/context1B.md](context/context1B.md) - FROZEN
**Lines:** ~900 | **Status:** Read-only reference

**Contents:**
- Section 4.1: Problems Solved Log (pre-2025-10-05)
- Section 4.2: Open Problems Log (current blockers)
- Section 4.3: Design Decisions Log (architectural choices)
- Section 4.4: Conversation History (sessions before 2025-10-05)
- Section 5: TO-DO & Roadmap (old format, superseded by MASTER-PLAN.md)

**When to read:** Checking if a problem was solved before, understanding design decisions

---

#### [context/context1C.md](context/context1C.md) - FROZEN
**Lines:** ~2300 | **Status:** Read-only reference

**Contents:**
- Section 4.1: Problems Solved Log (2025-10-05 to 2025-10-14)
- Section 4.4: Session Summaries (2025-10-05 to 2025-10-13)
- Section 6: AI Agent Instructions (how to use context docs, coding guidelines)

**When to read:** Checking recently solved problems, understanding coding patterns

---

#### [context/context1D.md](context/context1D.md) - ACTIVE ⚡
**Lines:** ~852 | **Status:** Updates frequently

**Contents:**
- Section 4.1: Problems Solved Log (2025-10-15 onward)
- Section 4.4: Session Summaries (2025-10-15 onward)

**When to read:** Checking today's solved problems, reviewing recent sessions

**⚠️ Important:** All new SOLVED problems and SESSION summaries go here!

---

### Tier 2: Knowledge Base

#### [context/context2.md](context/context2.md) - REFERENCE
**Lines:** ~750 | **Status:** Permanent reference

**Contents:**
- Section 7: Jugaad Philosophy & Budget Constraints
- Section 8: SRS Algorithm Deep Dive
- Section 9: Quiz App Architecture
- Section 10: Quality Standards & Testing Protocols
- Section 11: AI Agent Instructions

**When to read:** ALWAYS read this! Contains foundational principles and standards

---

### Tier 3: Planning & Tracking

#### [MASTER-PLAN.md](MASTER-PLAN.md) - NEW ⭐
**Lines:** ~600 | **Status:** Strategic planning document

**Contents:**
- **Executive Summary:** Vision, current state, critical metrics
- **Phase Overview:** All 10 phases (1-10) with completion tracking
- **Phase 1 Details:** Complete breakdown of Invincible Quiz System
- **Open Problems:** All blockers from context1A.md Section 4.2
- **Architecture Tracking:** Database tables, n8n workflows, API integrations
- **Budget Tracking:** Monthly costs, headroom, planned expenses
- **Metrics Dashboard:** Current vs target metrics
- **Detailed TODO Items:** Organized by priority (P0-P3)
- **Quality Protocols:** Testing, deployment, performance standards
- **Reference Links:** All key documentation and deployment URLs

**When to read:**
- Planning sprints or phases
- Understanding long-term roadmap
- Checking architecture status
- Reviewing budget or metrics
- Need comprehensive project overview

**Key Sections:**
- "Next Actions" - Immediate priorities (This Week, Next Sprint)
- "Open Problems" - Current blockers with severity ratings
- "Budget Tracking" - Monthly costs and headroom
- "Critical Success Factors" - What makes the system work/fail

---

#### [TODO.md](TODO.md) - DAILY TRACKER
**Lines:** ~375 | **Status:** Updates every session

**Contents:**
- **Current Status:** Component completion table
- **Recently Completed:** Today's/this session's completed tasks
- **Pending Tasks:** Organized by priority (High/Medium/Low)
- **Session Summary:** What was built today
- **Milestones:** Major achievement tracking
- **Technical Decisions:** Recent architectural choices
- **Project Status:** Phase completion overview

**When to read:**
- Starting work (check "Pending Tasks")
- Ending session (update statuses)
- Daily standup (review "Recently Completed")

**Relationship with MASTER-PLAN.md:**
- TODO.md = Short-term (today/this week)
- MASTER-PLAN.md = Long-term (all phases/comprehensive)

---

### Tier 4: Session Management

#### [.claude-session-config.md](.claude-session-config.md) - PROTOCOL
**Lines:** ~500 | **Status:** Session automation rules

**Contents:**
- **Phase 1:** Context Loading Protocol (mandatory startup sequence)
- **Phase 2:** Context Monitoring (20% token threshold triggers)
- **Phase 3:** Session End Protocol (documentation requirements)
- **Special Commands:** `/refresh-context`, `/update-docs`, `/session-summary`
- **File Hierarchy:** How all context files relate
- **2500-Line Limit Protocol:** File size management rules

**When to read:**
- Starting any Claude Code session (mandatory!)
- Understanding automation rules
- Learning special commands

---

### Tier 5: Archive

#### [context/context3.md](context/context3.md) - ARCHIVE
**Lines:** Grows indefinitely | **Status:** Historical reference

**Contents:**
- Old session summaries (>30 days)
- Old solved problems (>60 days)
- Historical decisions

**When to read:** Researching old decisions or patterns

---

## 🎯 USAGE PATTERNS

### Scenario 1: Starting a New Session
```
1. Read .claude-session-config.md
2. Follow context loading protocol:
   - context1A.md (vision + architecture)
   - context1B.md (decisions + open problems)
   - context1C.md (recent solved problems + AI guidelines)
   - context1D.md (latest solved problems + sessions)
   - context2.md (knowledge base - ALWAYS!)
   - MASTER-PLAN.md (comprehensive plan)
   - TODO.md (today's tasks)
3. Confirm context loaded
4. Check TODO.md for today's priorities
5. Start work!
```

---

### Scenario 2: Planning a New Feature
```
1. Check MASTER-PLAN.md:
   - Is it in the roadmap? Which phase?
   - Any open problems blocking it?
   - Budget implications?
2. Check context1A.md Section 3:
   - Database schema needed?
   - n8n workflow changes?
3. Check context1B.md Section 4.3:
   - Any relevant design decisions?
4. Check context2.md Section 10:
   - Testing checklist
   - Deployment checklist
5. Add to TODO.md
6. Start implementation
```

---

### Scenario 3: Debugging an Issue
```
1. Check context1D.md Section 4.1:
   - Was this solved recently?
2. Check context1C.md Section 4.1:
   - Was this solved last week?
3. Check context1A.md Section 4.1:
   - Was this solved earlier?
4. Check context1B.md Section 4.2:
   - Is this a known open problem?
5. Check context2.md Section 10.8:
   - Common error messages & solutions
6. Solve it!
7. Document in context1D.md
```

---

### Scenario 4: Checking Budget/Metrics
```
1. Open MASTER-PLAN.md
2. Go to "Budget Tracking" section
   - Current costs vs limit
   - Headroom available
3. Go to "Metrics Dashboard" section
   - Current metrics
   - Target metrics
   - Success indicators
```

---

### Scenario 5: Understanding a Design Decision
```
1. Check context1B.md Section 4.3
   - Design Decisions Log
   - Options considered
   - Rationale
2. Cross-reference with context1A.md Section 3
   - How it was implemented
```

---

## 🔄 DOCUMENT UPDATE RULES

### Who Updates What:

**context1A.md** - FROZEN (no updates, read-only reference)
**context1B.md** - FROZEN (no updates, read-only reference)
**context1C.md** - FROZEN (no updates, read-only reference)

**context1D.md** - Claude Code updates:
- Add new SOLVED problems (Section 4.1)
- Add new SESSION summaries (Section 4.4)
- **When:** At 20% token usage or session end

**MASTER-PLAN.md** - Claude Code updates:
- Phase completion percentages
- Open problems status changes
- Budget adjustments
- Metrics updates
- TODO item status changes
- **When:** Weekly or bi-weekly reviews

**TODO.md** - Claude Code updates:
- Task status changes (⏳ → 🟡 → ✅)
- Recently completed items
- Session summaries
- **When:** Throughout session, at session end

**.claude-session-config.md** - Manual updates only:
- Protocol changes
- New file additions
- Automation rules
- **When:** Major process changes

---

## 📊 FILE SIZE MONITORING

### Current Status (2025-10-15):

| File | Lines | Limit | Status |
|------|-------|-------|--------|
| context1A.md | ~2500 | 2500 | ⚠️ FULL - FROZEN |
| context1B.md | ~900 | 2500 | ✅ OK - FROZEN |
| context1C.md | ~2300 | 2500 | ⚠️ FULL - FROZEN |
| context1D.md | ~852 | 2500 | ✅ OK - ACTIVE |
| context2.md | ~750 | 2500 | ✅ OK |
| MASTER-PLAN.md | ~600 | - | ✅ OK |
| TODO.md | ~375 | - | ✅ OK |

### Actions Needed:
- ✅ context1D.md created (Oct 15) - receiving new entries
- ⏳ When context1D.md reaches 2500: Create context1E.md
- ⏳ Monitor all files monthly

---

## 💡 BEST PRACTICES

### For Claude Code:
1. **Always read .claude-session-config.md first**
2. **Always read context2.md** (knowledge base)
3. **Check context1D.md** before adding SOLVED entries (avoid duplicates)
4. **Update TODO.md** throughout session
5. **Create session summary** at end
6. **Reference MASTER-PLAN.md** for big picture

### For Developers:
1. **Check TODO.md** for today's priorities
2. **Reference MASTER-PLAN.md** for phase planning
3. **Read context1A.md** to understand architecture
4. **Check context2.md** for quality standards
5. **Update TODO.md** when completing tasks
6. **Request Claude Code to update docs** at session end

---

## 🔗 QUICK LINKS

### Live Deployments
- **Quiz App:** https://amanrajyadav.github.io/fluence-daily-quiz
- **GitHub Repo:** https://github.com/amanrajyadav/fluence-quiz-v2
- **Supabase:** https://wvzvfzjjiamjkibegvip.supabase.co
- **n8n:** https://n8n.myworkflow.top

### Key Files
- [MASTER-PLAN.md](MASTER-PLAN.md) - Comprehensive project plan
- [TODO.md](TODO.md) - Daily task tracker
- [context1A.md](context/context1A.md) - Master context
- [context2.md](context/context2.md) - Knowledge base
- [.claude-session-config.md](.claude-session-config.md) - Session protocols

---

**Last Updated:** 2025-10-15
**Maintained By:** Claude Code
**Review Frequency:** Monthly

---

## ❓ FAQ

**Q: Which file do I check first each day?**
A: TODO.md for today's tasks, MASTER-PLAN.md for big picture

**Q: Where do new solved problems go?**
A: context1D.md Section 4.1 (2025-10-15 onward)

**Q: How do I know which phase we're in?**
A: Check TODO.md or MASTER-PLAN.md header

**Q: What's the difference between TODO.md and MASTER-PLAN.md?**
A: TODO.md = day-to-day tasks, MASTER-PLAN.md = comprehensive long-term plan

**Q: Can I edit context1A.md?**
A: No, it's FROZEN. New entries go to context1D.md

**Q: How do I start a Claude Code session?**
A: Read .claude-session-config.md and follow the startup protocol

**Q: Where are the open problems listed?**
A: context1B.md Section 4.2 and MASTER-PLAN.md "Open Problems" section

**Q: How do I check the budget?**
A: MASTER-PLAN.md "Budget Tracking" section

**Q: Where are the design decisions?**
A: context1B.md Section 4.3

**Q: What if a file exceeds 2500 lines?**
A: Follow the protocol in .claude-session-config.md to create a new file (e.g., context1E.md)
