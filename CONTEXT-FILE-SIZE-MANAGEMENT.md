# Context File Size Management System

**Version:** 2.0
**Last Updated:** 2025-10-05
**Purpose:** Ensure all context files stay under 2500-line limit for reliable Claude Code Read operations

---

## 📏 The 2500-Line Rule

**Why 2500 Lines?**
- Claude Code Read tool maximum: ~25,000 tokens
- Average code/documentation: ~10 tokens per line
- Safe limit: 2500 lines = ~25,000 tokens
- Ensures single-read capability without offset/limit pagination

**Rule:** EVERY context file MUST stay under 2500 lines

---

## 📊 Current File Status

**Command to Check:**
```bash
wc -l context/context1A.md context/context1B.md context/context1C.md context/context2.md
```

**Expected Output:**
```
 2497 context/context1A.md  (✅ Safe - 3 lines under limit)
  888 context/context1B.md  (✅ Safe - 1612 lines under limit)
  237 context/context1C.md  (✅ Safe - 2263 lines under limit)
  750 context/context2.md   (✅ Safe - 1750 lines under limit)
 4372 total
```

**Status:** ✅ ALL FILES WITHIN LIMITS

---

## 🗂️ File Structure & Roles

| File | Max Lines | Current | Role | Growth Rate |
|------|-----------|---------|------|-------------|
| **context1A.md** | 2500 | 2497 | 🔒 FROZEN - Core specs (vision, arch, DB, workflows) | LOCKED - No new additions |
| **context1B.md** | 2500 | 888 | Living history (decisions, sessions, roadmap) | Fast - Updates every session |
| **context1C.md** | 2500 | 237 | AI instructions + NEW SOLVED entries (2025-10-05+) | Medium - Grows with bug fixes |
| **context2.md** | 2500 | 750 | Knowledge base (concepts, glossary) | Slow - Adds new concepts occasionally |
| **context3.md** | NO LIMIT | Grows | Archive (old sessions 30+ days) | N/A - Archival storage |
| **TODO.md** | 2500 | ~500 | Current sprint tasks | Medium - Weekly cleanups |

---

## 🚨 Warning Thresholds

### Green Zone: 0-2000 lines
- **Status:** Safe
- **Action:** None required

### Yellow Zone: 2000-2400 lines
- **Status:** Warning - approaching limit
- **Action:** Plan archiving strategy
- **Alert:** Add reminder to session notes

### Red Zone: 2400-2500 lines
- **Status:** Critical - immediate action required
- **Action:** Archive content NOW before next session
- **Alert:** Create issue in TODO.md

### Over Limit: 2500+ lines
- **Status:** BLOCKED - file unreadable in single operation
- **Action:** Emergency archiving (see below)

---

## 📦 Archiving Strategies

### context1A.md (Vision, Architecture, Technical Specs)

**Current:** 2497 lines (🔒 FROZEN - No further additions)

**Status:** LOCKED - Historical reference only

**Strategy Decision (2025-10-05):**
- context1A.md is now FROZEN at current state
- Contains Sections 1-3: Vision, Current State, Technical Implementation
- No new SOLVED entries will be added here
- All new problem solutions → context1C.md or new context1X.md files
- Remains as permanent reference for project foundation

**Rationale:**
- Already contains comprehensive specs (vision, architecture, database schema, workflows)
- These sections are relatively stable and don't need frequent updates
- Freezing preserves historical record without fragmentation
- New dynamic content goes to expandable context files

---

### context1B.md (Problems, Decisions, Roadmap)

**Current:** 888 lines (✅ GREEN ZONE - safe)

**Growth Drivers:**
- Section 4.4: Conversation & Planning History (grows daily)
- Each session adds ~100-200 lines

**Archiving Strategy:**
```
Trigger: When file reaches 2000 lines

Move to context3.md:
- SESSION entries older than 30 days
- Keep only recent sessions (last 30 days)

NEVER Archive:
- Section 4.2: Open Problems (keep ALL)
- Section 4.3: Design Decisions (keep ALL)
- Section 5: TODO & Roadmap (keep current)

Process:
1. Search: Grep "SESSION-2025-0[1-8]" in context1B.md
2. Identify: Sessions older than 30 days
3. Cut: Old session entries
4. Paste: Into context3.md under "## Archived Sessions"
5. Update: Note indicating archive location
```

**Estimated Time to 2000 Lines:**
- Current: 888 lines
- Growth: ~150 lines/session
- Sessions before limit: (2000-888)/150 = ~7 sessions
- Estimated: 2-3 weeks of daily work

---

### context1C.md (AI Agent Instructions + New SOLVED Entries)

**Current:** 237 lines (✅ GREEN ZONE - plenty of room)

**Growth Drivers:**
- Section 6: AI Agent Instructions (static - minimal growth)
- **NEW:** Section 4.1 SOLVED entries (from 2025-10-05 onward)
- Each SOLVED entry: ~50-100 lines
- Estimated capacity: ~22 more SOLVED entries before limit

**Strategy:**
- Section 6: AI Agent Instructions (original content)
- **Section 4.1: Problems Solved Log (NEW - from 2025-10-05 onward)**
- All new debugging lessons go here

**Archiving Strategy:**
```
Trigger: When file reaches 2000 lines

Actions:
1. Create context1D.md for new SOLVED entries
2. Keep Section 6 (AI Instructions) in context1C.md
3. Move SOLVED entries 60+ days old to context3.md
4. Update .claude-session-config.md to read context1D.md
```

**Estimated Time to 2000 Lines:** 3-4 months (assuming ~5 SOLVED entries per week)

---

### context2.md (Knowledge Base)

**Current:** 750 lines (✅ GREEN ZONE - safe)

**Growth Drivers:**
- New concept definitions
- New technical patterns
- Protocol updates

**Archiving Strategy:**
```
Trigger: When file reaches 2000 lines

Split by sections:
- context2A.md: Sections 7-8 (Glossary, Technical Concepts)
- context2B.md: Sections 9-11 (Protocols, Quality, AI Instructions)

Update .claude-session-config.md:
4. **E:\fluence-quiz-v2\context\context2A.md** (Knowledge Base Part 1)
5. **E:\fluence-quiz-v2\context\context2B.md** (Knowledge Base Part 2)

NEVER move to context3.md:
- Knowledge Base is PERMANENT reference
- Must always be accessible
```

**Estimated Time to 2000 Lines:** 3-6 months (slow growth)

---

### context3.md (Archive)

**Current:** ~100 lines (historical sessions)

**Max Lines:** NO LIMIT - can grow indefinitely

**Purpose:** Long-term archival storage for:
- Sessions older than 30 days
- Solved problems older than 60 days
- Historical decisions/context

**Structure:**
```markdown
# Context Archive (context3.md)

## Archived Solved Problems (60+ days old)
[Moved from context1A.md Section 4.1]

## Archived Sessions (30+ days old)
[Moved from context1B.md Section 4.4]

## Metadata
- Last Updated: YYYY-MM-DD
- Items Archived: [count]
- Source: context1A.md, context1B.md
```

---

## ⚡ Emergency Archiving Protocol

**IF file exceeds 2500 lines and Claude Code can't read it:**

### Step 1: Immediate Triage
```bash
# Check which file is over limit
wc -l context/*.md

# Identify the problem file
```

### Step 2: Emergency Archive
```bash
# For context1A.md (if over limit):
# Move ALL solved problems older than 30 days (not 60)

# For context1B.md (if over limit):
# Move ALL sessions older than 14 days (not 30)
```

### Step 3: Quick Cleanup
```bash
# Verify file now readable
wc -l context/context1A.md
# Should be well under 2500 after emergency archive
```

### Step 4: Update Documentation
- Add note in affected file: "Emergency archive performed on YYYY-MM-DD due to size limit"
- Update context3.md with archive metadata
- Create SOLVED entry documenting the emergency

---

## 🔄 Automated Monitoring

### Weekly Check (User Responsibility)
```bash
# Every Sunday, run this command:
wc -l context/*.md TODO.md

# If any file > 2000 lines:
# - Yellow alert → Plan archiving next week
# - Red alert (>2400) → Archive immediately
```

### Claude Code Auto-Check (Built-in)
At 20% token usage, Claude Code checks file sizes and warns user if any file approaching limit.

---

## 📋 Archiving Checklist

When archiving content, follow this checklist:

- [ ] **Identify:** Which file needs archiving?
- [ ] **Measure:** `wc -l` to confirm size
- [ ] **Search:** Find entries meeting age threshold
- [ ] **Backup:** Commit current state to git first
- [ ] **Cut:** Remove old entries from source file
- [ ] **Paste:** Add to context3.md with metadata
- [ ] **Note:** Add archive reference in source file
- [ ] **Verify:** `wc -l` to confirm under 2500
- [ ] **Test:** Try reading file with Read tool
- [ ] **Commit:** Save changes with descriptive message
- [ ] **Update:** Document archiving in session notes

---

## 🎯 Long-Term Strategy

**Goal:** Maintain sustainable context system that scales indefinitely

**Principles:**
1. **2500-line hard limit** - Never exceed, archive proactively
2. **Age-based archiving** - Older content moves to context3.md
3. **Permanent knowledge stays** - context2.md never archived, splits if needed
4. **Active files stay lean** - Regular cleanup prevents bloat
5. **Archive searchable** - context3.md organized for easy reference

**Future Enhancements:**
- Automated archiving script (Python/Node)
- Git hooks to warn on file size before commit
- Dashboard showing file sizes and growth trends
- Compression techniques for archived content

---

## 🛠️ Tools & Commands

### Check All File Sizes
```bash
wc -l context/*.md TODO.md
```

### Find Old SOLVED Entries
```bash
# Find SOLVED entries from specific months
Grep pattern: "SOLVED-2025-0[1-7]" in context1A.md
```

### Find Old SESSION Entries
```bash
# Find SESSION entries older than 30 days
# Manual calculation: If today is 2025-10-05, 30 days ago is 2025-09-05
Grep pattern: "SESSION-2025-0[1-8]" in context1B.md
```

### Count Lines in Specific Section
```bash
# Read file, find section, count lines
# Example: Count SOLVED entries
Grep pattern: "^#### SOLVED" in context1A.md output_mode: count
```

---

## ✅ Success Criteria

Context size management is working when:
- ✅ All context files stay under 2500 lines
- ✅ Claude Code can read all files in single operation
- ✅ Archiving happens proactively (not emergency)
- ✅ No context loss - old content accessible in context3.md
- ✅ New sessions start smoothly with full context load

---

## 📞 When to Escalate

**Ask user for guidance if:**
- Multiple files approaching limit simultaneously
- Archiving doesn't reduce file size enough
- context3.md becomes too large to manage (>10,000 lines)
- Need to archive content that's still frequently referenced
- Structural changes needed (new file splits)

---

**Last Updated:** 2025-10-05
**Next Review:** When context1A.md archived (currently at limit)
**Status:** ⚠️ context1A.md at 2497/2500 - ARCHIVE NEEDED SOON
