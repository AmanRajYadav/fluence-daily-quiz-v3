# Context Files Structure - Explained

## 📚 Overview

The Fluence Quiz project uses a **multi-file context system** to organize information efficiently while keeping it accessible to Claude Code.

---

## 🗂️ File Roles

### 1. **context1.md** - Master Living Document
**Role:** Primary working context
**Size:** ~2200 lines (growing)
**Update Frequency:** Every session

**Contains:**
- ✅ Project vision and mission
- ✅ Current architecture overview
- ✅ Database schema (all tables)
- ✅ All SOLVED problems with debugging lessons
- ✅ Open problems and blockers
- ✅ Design decisions log
- ✅ **Recent conversation history (last 30 days)**
- ✅ Current TODO structure

**When to Update:**
- Every debugging session (add SOLVED entries)
- Every major decision (add DECISION entries)
- Every session end (add SESSION summary)

**Archive Trigger:**
- When > 3000 lines → Move old sessions (30+ days) to context3.md

---

### 2. **context2.md** - Knowledge Base (PERMANENT)
**Role:** Reference library
**Size:** ~750 lines (stable)
**Update Frequency:** Rarely (only when adding new concepts)

**Contains:**
- ✅ Key concepts glossary:
  - Context Engineering definition
  - Jugaad philosophy (frugal innovation)
  - Spaced Repetition System (SRS) algorithm
  - Forgetting Curve science
  - First Principles thinking
- ✅ Technical definitions
- ✅ Core philosophies and methodologies
- ✅ Budget constraints and free-tier strategies
- ✅ Foundational principles

**⚠️ CRITICAL:**
- **ALWAYS READ** - Contains crucial foundational knowledge
- **NEVER ARCHIVE** - This is permanent reference material
- Only updated when adding NEW concepts to glossary

**When to Update:**
- Adding new technical concepts
- Defining new methodologies
- Documenting new principles
- Expanding glossary

---

### 3. **context3.md** - Historical Archive
**Role:** Old session storage
**Size:** Created when needed
**Update Frequency:** When context1.md exceeds 3000 lines

**Contains:**
- ✅ Older conversation history (30+ days old)
- ✅ Historical SESSION entries
- ✅ Past decisions (still relevant but not recent)
- ✅ Archived debugging sessions

**Creation Trigger:**
- context1.md > 3000 lines
- Oldest sessions (30+ days) moved from context1 → context3

**Archive Process:**
```
1. Check if context3.md exists
2. If NOT: Create context3.md with header
3. Move SESSION entries older than 30 days
4. Keep recent 30 days in context1.md
5. NEVER move anything from context2.md
```

---

### 4. **TODO.md** - Active Task Tracker
**Role:** Current sprint and tasks
**Size:** ~500 lines (variable)
**Update Frequency:** Every session

**Contains:**
- ✅ Active sprint items
- ✅ Completed tasks (✅)
- ✅ In-progress tasks (🔄)
- ✅ Pending tasks (⏳)
- ✅ Blocked tasks (🔴)
- ✅ Milestone tracking
- ✅ Session summaries

**When to Update:**
- Mark tasks completed
- Update progress percentages
- Add new tasks
- Create session summaries

---

## 🔄 Context Loading Order

**Every session startup, Claude Code reads in this order:**

```
1. .claude-session-config.md     ← Protocols (how to behave)
   ↓
2. context1.md                    ← Master context (what's happening)
   ↓
3. context2.md                    ← Knowledge Base (foundational concepts)
   ↓
4. TODO.md                        ← Current tasks (what to do)
   ↓
5. context3.md (if exists)        ← Archive (historical reference)
```

**Why this order?**
1. Protocols first (know the rules)
2. Current state second (understand project)
3. Foundational knowledge third (understand principles)
4. Tasks fourth (know priorities)
5. History last (optional deep context)

---

## 📊 File Size Management

### Current State:
- `context1.md`: 2,200 lines ✅ (plenty of room)
- `context2.md`: 750 lines ✅ (stable)
- `context3.md`: Not created yet
- `TODO.md`: 500 lines ✅

### Thresholds:
- **context1.md > 3000 lines** → Archive old sessions to context3.md
- **context2.md** → No limit (permanent reference)
- **TODO.md > 1000 lines** → Consider cleaning completed tasks

### Archive Strategy:
```
When context1.md hits 3000 lines:
├─ Keep: Recent 30 days of sessions
├─ Move: Sessions older than 30 days → context3.md
├─ Never touch: context2.md (permanent)
└─ Result: context1.md back to ~2000 lines
```

---

## 🎯 What Goes Where?

### Add to context1.md:
- ✅ New SOLVED problem entries
- ✅ New DECISION entries
- ✅ New SESSION summaries
- ✅ Architecture updates
- ✅ New open problems

### Add to context2.md:
- ✅ New concepts/glossary terms
- ✅ New methodologies
- ✅ New principles
- ⚠️ Rare - only fundamental additions

### Add to context3.md:
- ✅ Old SESSION entries (30+ days)
- ✅ Archived decisions
- ⚠️ Automatic - via archiving process

### Add to TODO.md:
- ✅ New tasks
- ✅ Task status updates
- ✅ Session summaries
- ✅ Milestone progress

---

## 🚫 What NOT to Do

### ❌ Don't:
- Move content FROM context2.md (it's permanent)
- Delete SOLVED entries (they're lessons)
- Archive recent sessions (<30 days)
- Create context4.md (use context3.md for all archives)
- Mix session history in context2.md (that's for context1/context3)

### ✅ Do:
- Keep context2.md as pure knowledge base
- Archive old sessions to context3.md when needed
- Update context1.md with recent work
- Keep TODO.md current
- Read all files at session start

---

## 🔍 Quick Reference

**Find something:**

| Looking for... | Check... |
|---------------|----------|
| Recent bug fix | context1.md Section 4.1 (SOLVED entries) |
| Concept definition | context2.md Section 7.1 (Glossary) |
| Old session | context3.md (if created) or context1.md Section 4.4 |
| Current task status | TODO.md |
| Architecture | context1.md Section 2 & 3 |
| Philosophy (Jugaad) | context2.md |
| SRS algorithm | context2.md |

---

## 📝 Example Scenario

**Scenario:** You fix a new bug and end the session

**What happens:**

1. **During session:**
   - Bug fixed
   - Claude Code documents solution

2. **At 20% tokens (auto-update):**
   ```
   ✅ context1.md updated:
      - Added: SOLVED-2025-10-05-009: [Bug description]
   ✅ TODO.md updated:
      - Marked task as completed
   ✅ context2.md: No changes (not needed)
   ✅ context3.md: Doesn't exist yet
   ```

3. **Session end (/session-summary):**
   ```
   ✅ context1.md updated:
      - Added: SESSION-2025-10-05-CLAUDE summary
   ✅ TODO.md updated:
      - Added session summary at end
   ✅ context2.md: No changes
   ```

4. **Next session (30 days later):**
   - context1.md still < 3000 lines
   - No archiving needed
   - All files read normally

5. **When context1.md hits 3000 lines:**
   ```
   ✅ Create context3.md
   ✅ Move old sessions (30+ days) → context3.md
   ✅ Keep recent sessions in context1.md
   ✅ context2.md untouched (permanent)
   ✅ context1.md back to ~2000 lines
   ```

---

## ⚡ Quick Facts

1. **context2.md ALREADY EXISTS** - Contains crucial knowledge base
2. **context3.md will be NEXT** - When context1.md > 3000 lines
3. **No context4.md** - context3.md grows to hold all archives
4. **context2.md is SACRED** - Never archive or modify unless adding concepts
5. **Read order matters** - Protocols → Context → Knowledge → Tasks → Archive

---

## 🎓 For Future AI Agents

When you start a new session:

1. ✅ Read `.claude-session-config.md` first
2. ✅ Read `context1.md` (master + recent sessions)
3. ✅ Read `context2.md` (ALWAYS - has Jugaad, SRS, concepts)
4. ✅ Read `TODO.md` (current tasks)
5. ✅ Read `context3.md` if exists (archive)

**Remember:**
- context1 = WHAT (current state)
- context2 = WHY (principles & concepts)
- context3 = WHEN (historical archive)
- TODO = NOW (current tasks)

---

**Last Updated:** 2025-10-05
**Created By:** Claude Code
**Part of:** Session Automation System
