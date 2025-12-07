# Context Size Management Guide

## 📏 Problem: context1.md Too Large to Read

**Error Message:**
```
File content (25453 tokens) exceeds maximum allowed tokens (25000).
Please use offset and limit parameters to read specific portions of the file.
```

## ✅ Solution: Archive Old Sessions to context3.md

This is **expected behavior** when context1.md grows beyond Claude Code's Read tool limit. The automation system is designed to handle this through archiving.

---

## 🔄 Archiving Process (Already Done for You)

**What Happened:**
1. context1.md exceeded 25,000 tokens (25,453 tokens)
2. Old sessions (>30 days) were archived to `context3.md`
3. context1.md Section 4.4 was updated to reference the archive
4. File size reduced from 2554 to 2497 lines

**Files Involved:**
- ✅ `context3.md` - Created with archived sessions
- ✅ `context1.md` - Cleaned up (removed old sessions)
- ✅ `START-SESSION.md` - Updated with note about archiving

---

## 📖 How to Read context1.md Now

### Option 1: Read in Chunks (Recommended for AI agents)

```javascript
// Read first 1000 lines
Read("context1.md", offset: 0, limit: 1000)

// Read next 1000 lines
Read("context1.md", offset: 1000, limit: 1000)

// Read last portion
Read("context1.md", offset: 2000, limit: 500)
```

### Option 2: Search for Specific Content

```javascript
// Find specific sections
Grep("### 4.1 Problems Solved", "context1.md")
Grep("SOLVED-2025-10-05", "context1.md")
Grep("SESSION-2025-10-05", "context1.md")
```

### Option 3: Read Archived Sessions

```javascript
// Read old sessions from archive
Read("context/context3.md")
```

---

## 🎯 What's in Each File Now

### context1.md (Master Context)
- Sections 1-3: Project vision, architecture, database schema
- Section 4.1: Solved problems (all dates)
- Section 4.2: Open problems
- Section 4.3: Decisions log
- Section 4.4: **Recent sessions only** (last 30 days)
- Section 5: TODO structure

### context3.md (Archive)
- SESSION-2025-07-XX: Ultimate Vision & Architecture
- SESSION-2025-01-08: Menu Buttons & Gamification
- (Future old sessions will be added here)

### context2.md (Knowledge Base)
- Permanent reference (never archived)
- Sections 7.1: Key concepts (Jugaad, SRS, etc.)
- Section 9.4: What's already working
- Section 10: Quality protocols
- Section 11: AI agent instructions

---

## 📊 File Size Thresholds

| File | Current Size | Max Readable | Archive Trigger | Action |
|------|--------------|--------------|-----------------|--------|
| context1.md | ~2497 lines | 25,000 tokens | >3000 lines or >25k tokens | Archive old sessions |
| context2.md | ~800 lines | 25,000 tokens | N/A | Never archived |
| context3.md | ~100 lines | 25,000 tokens | N/A | Grows with archives |

---

## 🔧 Manual Archiving (If Needed in Future)

If context1.md exceeds limits again:

### Step 1: Identify Old Sessions
```bash
# Find all sessions
Grep "^#### SESSION-" context1.md

# Check dates - sessions >30 days old should be archived
```

### Step 2: Copy to context3.md
- Read the old session content
- Append to context3.md
- Add archiving metadata (date, reason)

### Step 3: Remove from context1.md
- Edit context1.md
- Remove the archived session content
- Keep the note: "Older sessions archived to context3.md"

### Step 4: Verify Size
```bash
wc -l context/context1.md
# Should be reduced significantly
```

---

## 🚨 Emergency: Can't Read Any Context Files

If multiple files exceed limits:

### Quick Fix for New Sessions:
1. Read `CLAUDE.md` instead (repository guide)
2. Read `TODO.md` (current tasks)
3. Use Grep to search context1.md for specific sections
4. Ask user for context on current priority

### Example:
```javascript
// Instead of full read, search for what you need
Grep("SOLVED-2025-10-05", "context1.md", output_mode: "content", -B: 5, -A: 20)
```

---

## 📋 Updated Session Startup Protocol

**When starting a new session:**

1. Read `.claude-session-config.md` ✓
2. **Try to read `context1.md`:**
   - If successful → Continue normal flow
   - If fails (>25k tokens) → Read in chunks or use Grep
3. Read `context2.md` ✓ (Knowledge Base - always works)
4. Read `TODO.md` ✓ (Current tasks)
5. Read `context3.md` ✓ (Archive - optional)

**Fallback Strategy:**
- Use `CLAUDE.md` as primary guide
- Use Grep to search context1.md for specific sections
- Use TODO.md for current priorities

---

## ✅ Success Criteria

After archiving, you should be able to:
- ✅ Read context2.md completely (Knowledge Base)
- ✅ Read TODO.md completely (Current tasks)
- ✅ Read context3.md completely (Archive)
- ✅ Read context1.md in chunks OR search with Grep
- ✅ Start productive work immediately

---

## 🎯 Key Takeaways

1. **This is expected behavior** - Files grow, archiving is normal
2. **context2.md is permanent** - Never archived, always readable
3. **context3.md holds old sessions** - Reference when needed
4. **Use chunks or Grep** for large context1.md
5. **CLAUDE.md is failsafe** - Always readable, has core guidance

---

**Last Updated:** 2025-10-05
**Reason:** context1.md exceeded 25,000 token Read limit
**Solution:** Created context3.md archive, cleaned context1.md
**Status:** Resolved ✅
