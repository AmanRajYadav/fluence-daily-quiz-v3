# Claude Code Automation Guide

## 🎯 Goal
Automate context loading and documentation updates so:
1. Every session starts with full context
2. Documentation updates automatically at 20% token usage
3. All debugging lessons are captured
4. Future sessions can resume exactly where we left off

---

## 📋 How It Works

### 1. **Session Startup (Every New Conversation)**

**What You Do:**
- Open `START-SESSION.md`
- Copy the text
- Paste it as your first message to Claude Code

**What Claude Code Does:**
- Reads `.claude-session-config.md` for protocols
- Reads `context/context1.md` (master context)
- Reads `TODO.md` (current tasks)
- Reads `context/context2.md` (if exists)
- Confirms context loaded
- Shows current status and in-progress tasks

---

### 2. **During Session (Automatic)**

**Token Budget Monitoring:**

| Token Usage | Action |
|-------------|--------|
| **20% (40K)** | 🟡 Auto-update TODO.md and context1.md |
| **50% (100K)** | 🟠 Warning about context limit |
| **75% (150K)** | 🔴 Force update, suggest new session |

**At 20% tokens, Claude Code automatically:**
1. Pauses work
2. Re-reads context files
3. Updates TODO.md (task status)
4. Updates context1.md (adds solved problems, lessons learned)
5. Resumes work

**You don't need to do anything!**

---

### 3. **Session End (Manual Trigger)**

**When ending conversation, say:**
```
/session-summary
```

**Claude Code will:**
1. Create session summary in context1.md Section 4.4
2. Update TODO.md with final task status
3. Suggest next session priorities

---

## 🎮 Quick Commands

You can use these commands anytime:

### `/refresh-context`
- Re-reads all context files
- Useful if you manually edited files
- Shows current status

### `/update-docs`
- Forces documentation update immediately
- Even if token usage < 20%
- Useful before committing code

### `/session-summary`
- Creates detailed session summary
- Updates all documentation
- Suggests next steps

### `/context-status`
- Shows token usage percentage
- Lists files read and timestamps
- Shows current task

---

## 📁 File Structure

```
fluence-quiz-v2/
│
├── .claude-session-config.md    ← Protocol definition (Claude reads this)
├── START-SESSION.md              ← Your startup template (copy-paste this)
├── TODO.md                       ← Task tracking (auto-updated)
│
├── context/
│   ├── context1.md              ← Master context (auto-updated)
│   │                               - Vision, architecture, database schema
│   │                               - Solved problems, open problems
│   │                               - Recent sessions (last 30 days)
│   │
│   ├── context2.md              ← Knowledge Base (PERMANENT - rarely changes)
│   │                               - Key concepts: Jugaad, SRS, Context Engineering
│   │                               - Glossary and principles
│   │                               - Foundational knowledge
│   │                               ⚠️ ALWAYS READ - Contains crucial info
│   │
│   └── context3.md              ← Archive (created when context1 > 3000 lines)
│                                   - Older sessions (30+ days)
│                                   - Historical decisions
│
└── CLAUDE-AUTOMATION-GUIDE.md   ← This file (your reference)
```

**Important Notes:**
- **context2.md ALREADY EXISTS** with crucial knowledge base
- When context1.md grows too large, old sessions move to **context3.md** (not context2!)
- context2.md is the permanent reference library - never modified during archiving

---

## 🚀 Quick Start Checklist

### First Time Setup (Do Once):
- [x] ✅ `.claude-session-config.md` created (protocols defined)
- [x] ✅ `START-SESSION.md` created (startup template)
- [x] ✅ `TODO.md` created (task tracker)
- [x] ✅ `context/context1.md` exists (master context)
- [ ] ⏳ Add to git: `git add .claude-session-config.md START-SESSION.md`

### Every Session:
1. Open `START-SESSION.md`
2. Copy the message
3. Paste as first message to Claude Code
4. Wait for context confirmation
5. Start working!

### Every Session End:
1. Type `/session-summary`
2. Review the summary
3. Commit changes: `git add . && git commit -m "Session: [what we worked on]"`

---

## 💡 Pro Tips

### Tip 1: Bookmark START-SESSION.md
- Keep it open in a browser tab
- Or pin to taskbar
- Quick access for copy-paste

### Tip 2: Use Git Branches for Experiments
```bash
git checkout -b experiment-feature
# Work with Claude Code
# If it works: git checkout main && git merge experiment-feature
# If not: git checkout main && git branch -D experiment-feature
```

### Tip 3: Session Naming Convention
When running `/session-summary`, Claude Code will create:
```
SESSION-2025-10-05-CLAUDE: [Your Session Topic]
```

Name it descriptively:
- "Bug Fixes: Sound Loading and Leaderboard"
- "Feature: Streak Animations Implementation"
- "Debugging: n8n Workflow Rank Calculation"

### Tip 4: Review Before Committing
After `/session-summary`, quickly check:
- `TODO.md` - tasks updated correctly?
- `context/context1.md` - lessons learned captured?
- Code changes - all intentional?

---

## 🔧 Troubleshooting

### Problem: Claude Code didn't read context files
**Solution:**
- Explicitly say: "Did you read .claude-session-config.md?"
- Or use: `/refresh-context`

### Problem: Token limit reached too fast
**Solution:**
- Use `/session-summary` to end current session
- Start new session with `START-SESSION.md`
- Context will be preserved via documentation

### Problem: Context files getting too large
**Solution:**
- Claude Code will auto-create `context2.md` when context1.md > 3000 lines
- Older sessions move to context2.md
- Recent sessions stay in context1.md

### Problem: Forgot to update docs before ending session
**Solution:**
- Next session, say: "Update docs from last session based on git diff"
- Claude Code will review changes and update documentation

---

## 📊 Success Metrics

**You'll know it's working when:**
- ✅ Every Claude Code session starts with "Context loaded ✅"
- ✅ TODO.md always shows accurate task status
- ✅ context1.md has detailed debugging lessons
- ✅ You can resume work in new session without re-explaining
- ✅ Documentation updates automatically (you see update messages at 20% tokens)
- ✅ Git history shows regular context updates

---

## 🎯 Example Session Flow

**Session Start:**
```
You: [paste START-SESSION.md content]

Claude Code:
Context loaded successfully ✅

Files read:
- .claude-session-config.md ✓ - Protocols
- context1.md (2200 lines) ✓ - Master context, recent sessions
- context2.md (750 lines) ✓ - Knowledge Base (Jugaad, SRS, concepts)
- TODO.md (500 lines) ✓ - Current tasks
- context3.md - Not found (will be created when context1 > 3000 lines)

Current Status:
- Phase: Phase 1 - Invincible Quiz System (70% complete)
- In Progress:
  🔄 Fix sound files 403 error
- Last Updated: 2025-10-05

What would you like to work on today?
```

**During Work (at 20% tokens):**
```
Claude Code:
Context limit at 20%, updating documentation...

Documentation updated ✅
- TODO.md: 1 task completed, 1 in progress
- context1.md: Added 1 solved problem (Sound Files Fix)
- Token usage: 40,000 / 200,000 (20%)

Ready to continue!
```

**Session End:**
```
You: /session-summary

Claude Code:
Session summary created ✅

Added to context1.md Section 4.4:
- SESSION-2025-10-05-CLAUDE: Sound Files Migration to Local Storage

Updated TODO.md:
- ✅ BUG-P1-008: Sound Files 403 Error (COMPLETED)
- 🔄 Next: Streak Animations Implementation

Next session priorities:
1. Implement streak counter with fire icon
2. Add Framer Motion animations
3. Test complete quiz flow

Ready for commit!
```

---

## 🚫 Duplicate Prevention

**How does Claude Code avoid adding the same things twice?**

Before adding ANY entry to documentation, Claude Code:

1. **Searches for existing entries** using Grep tool
2. **Checks dates** - Never adds same-day duplicates of same problem
3. **Verifies uniqueness** - Compares problem descriptions
4. **Updates instead of duplicates** - If entry exists, updates it

### Quick Reference:

| Entry Type | Duplicate Check | Action |
|------------|-----------------|--------|
| SOLVED entry | Search: `SOLVED-{today}` | If found + same problem → Skip |
| SESSION entry | Search: `SESSION-{today}` | If found → Update existing |
| TODO task | Search: keywords | If found → Update status only |
| Session summary | Search: `Summary: {today}` | If found → Replace |

### Examples:

**Scenario 1: Same bug fixed twice (same day)**
```
❌ Won't create duplicate SOLVED entry
✅ Will update existing entry if new insights
```

**Scenario 2: Multiple bugs same day**
```
✅ Will create separate SOLVED entries (different problems)
```

**Scenario 3: Long session with multiple updates**
```
❌ Won't duplicate SESSION entry
✅ Will update existing SESSION with new info
```

**For detailed examples:** See `DUPLICATE-PREVENTION-EXAMPLES.md`

---

## 📚 Related Files

- `.claude-session-config.md` - Protocol definitions (Claude Code reference)
- `START-SESSION.md` - Session starter template (your copy-paste source)
- `TODO.md` - Task tracker (auto-updated)
- `context/context1.md` - Master context (auto-updated)
- `context/context2.md` - Knowledge Base (PERMANENT - Jugaad, SRS, quality protocols)
- `DUPLICATE-PREVENTION-EXAMPLES.md` - Real examples of duplicate prevention
- `KEY-LEARNINGS-FROM-CONTEXT2.md` - Critical insights from knowledge base (NEW!)
- `CONTEXT-FILES-EXPLAINED.md` - File structure guide
- `CLAUDE-AUTOMATION-GUIDE.md` - This guide (your reference)

---

**Last Updated:** 2025-10-05
**Maintained By:** Claude Code automation system
**Questions?** Check `.claude-session-config.md` for detailed protocols
