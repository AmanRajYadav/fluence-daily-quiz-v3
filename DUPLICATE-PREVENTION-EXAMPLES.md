# Duplicate Prevention - Practical Examples

## 🎯 How Claude Code Prevents Duplicates

This document shows exactly how the duplicate prevention protocol works with real examples.

---

## Example 1: Preventing Duplicate SOLVED Entries

### Scenario: Fixing the same bug twice in one day

**Context:** You're working with Claude Code and fix a fill-blank bug. Later in the same session, you think you found another issue with fill-blank and fix it again.

### What Claude Code Does:

**Step 1: Before adding SOLVED entry**
```bash
# Claude Code runs Grep search
Grep pattern: "SOLVED-2025-10-05"
File: context1.md
Output mode: content

# Results found:
SOLVED-2025-10-05-004: Fill-Blank Question Lives Deducted on Keystroke
```

**Step 2: Compare problem descriptions**
```
Existing: "Fill-blank questions deducted lives on every keystroke"
New attempt: "Fill-blank question causing lives to decrease on typing"

Analysis: Same problem, different wording → DUPLICATE
```

**Step 3: Decision**
```
❌ DO NOT ADD - Already documented
✅ Instead: Update existing entry if new insights discovered
```

**Claude Code responds:**
```
This issue is already documented in context1.md as:
SOLVED-2025-10-05-004: Fill-Blank Question Lives Deducted on Keystroke

No duplicate entry added. Existing entry already contains the solution.
```

---

## Example 2: Preventing Duplicate SESSION Entries

### Scenario: Long session with multiple `/update-docs` calls

**Context:** You're in a long session. At 20% tokens, auto-update triggers. Later at 50%, you manually run `/update-docs`.

### What Claude Code Does:

**First Update (20% tokens):**
```bash
# Search for today's session
Grep pattern: "SESSION-2025-10-05-CLAUDE"
File: context1.md

# Result: Not found
# Action: Create new session entry
✅ SESSION-2025-10-05-CLAUDE: n8n Workflow Optimization
```

**Second Update (50% tokens):**
```bash
# Search for today's session
Grep pattern: "SESSION-2025-10-05-CLAUDE"
File: context1.md

# Result: FOUND (line 1681)
SESSION-2025-10-05-CLAUDE: n8n Workflow Optimization & Documentation Automation

# Action: UPDATE existing entry (don't create new)
✅ Updated existing session with new completed tasks
```

**Claude Code responds:**
```
Documentation updated ✅
- Updated existing SESSION-2025-10-05-CLAUDE entry
- Added 2 new completed tasks
- No duplicate created
```

---

## Example 3: Preventing Duplicate TODO Tasks

### Scenario: Same task mentioned multiple times

**Context:** You tell Claude Code: "Fix the sound files", then later: "We need to fix those 403 sound errors"

### What Claude Code Does:

**First Request:**
```bash
# Search TODO.md for similar tasks
Grep pattern: "sound|403|audio"
File: TODO.md
Output: files_with_matches

# Result: Not found
# Action: Add new task
✅ BUG-P1-008: Sound Files 403 Error
```

**Second Request:**
```bash
# Search TODO.md for similar tasks
Grep pattern: "sound files|403 sound errors"
File: TODO.md
Output: content

# Result: FOUND
#### ⏳ BUG-P1-008: Sound Files 403 Error
- **Status:** IN PROGRESS
- **Description:** External sound URLs from mixkit.co are blocked (403 Forbidden)

# Action: Update status only (don't create new)
✅ Updated existing task status
```

**Claude Code responds:**
```
This task already exists: BUG-P1-008: Sound Files 403 Error
Status updated to IN PROGRESS. No duplicate created.
```

---

## Example 4: Preventing Duplicate Session Summaries in TODO.md

### Scenario: Running `/session-summary` twice

**Context:** You run `/session-summary` to end session, then realize you want to add more details and run it again.

### What Claude Code Does:

**First `/session-summary`:**
```bash
# Search for today's summary
Grep pattern: "Session Summary: 2025-10-05"
File: TODO.md

# Result: Not found
# Action: Create new summary section
✅ Added session summary to TODO.md
```

**Second `/session-summary`:**
```bash
# Search for today's summary
Grep pattern: "Session Summary: 2025-10-05"
File: TODO.md

# Result: FOUND (line 531)
## 📝 Session Summary: 2025-10-05

# Action: Replace existing summary (don't duplicate)
✅ Updated existing session summary
```

**Claude Code responds:**
```
Session summary updated ✅
- Replaced existing 2025-10-05 summary
- Added new insights discovered
- No duplicate created
```

---

## Example 5: Allowing Legitimate Duplicates

### Scenario: Same bug occurs on different days

**Context:** On Oct 5, you fix a leaderboard bug. On Oct 12, the same type of bug appears but with different root cause.

### What Claude Code Does:

**Oct 5 Entry:**
```
SOLVED-2025-10-05-006: Leaderboard Infinite Loop
Root Cause: loadLeaderboard function recreated on every render
Solution: useCallback hook
```

**Oct 12 - New occurrence:**
```bash
# Search for today's date
Grep pattern: "SOLVED-2025-10-12"
File: context1.md

# Result: Not found for Oct 12
# Check problem similarity
Grep pattern: "Leaderboard Infinite Loop"
File: context1.md

# Result: FOUND but different date (Oct 5)
SOLVED-2025-10-05-006: Leaderboard Infinite Loop

# Analysis: Same problem type, different date
# Decision: Could be regression or new instance
```

**Claude Code asks:**
```
Found similar issue: SOLVED-2025-10-05-006: Leaderboard Infinite Loop (Oct 5)

Is this:
A) Same issue (regression) - I'll reference original
B) New occurrence (different cause) - I'll create new entry

User confirms: "Different cause - missing dependency in useEffect"

✅ Creating new entry: SOLVED-2025-10-12-001: Leaderboard Infinite Loop (Missing Dependency)
✅ Adding reference to previous occurrence (Oct 5)
```

---

## Example 6: Multiple Problems Same Day (OK)

### Scenario: You fix 5 different bugs in one day

**Context:** Productive debugging day - multiple unrelated issues fixed.

### What Claude Code Does:

```bash
# Search for today's SOLVED entries
Grep pattern: "SOLVED-2025-10-05"
File: context1.md

# Results found:
SOLVED-2025-10-05-003: n8n Leaderboard Workflow Rank Update Failure
SOLVED-2025-10-05-004: Fill-Blank Question Lives Deducted on Keystroke
SOLVED-2025-10-05-005: Match Question Auto-Submit on First Match
SOLVED-2025-10-05-006: Leaderboard Infinite Loop

# New bug: Sound Files 403 Error
# Check if duplicate
Grep pattern: "Sound Files|403 Error"
File: context1.md in SOLVED section

# Result: Not found
# Action: Add new entry (different problem, same day = OK)
✅ SOLVED-2025-10-05-008: Sound Files 403 Error
```

**This is ALLOWED because:**
- Different problem (sound vs leaderboard vs fill-blank)
- Same day is OK if problems are different
- Proper numbering (003, 004, 005, 006, 008...)

---

## Duplicate Detection Algorithm

### Claude Code's Decision Tree:

```
Before adding entry:
├─ Search for today's date (YYYY-MM-DD)
│  ├─ Not found? → Safe to add
│  └─ Found? → Continue checks
│     ├─ Compare problem titles
│     │  ├─ Exact match? → DUPLICATE (skip)
│     │  └─ Similar? → Check descriptions
│     │     ├─ Same root cause? → DUPLICATE (skip)
│     │     ├─ Same solution? → DUPLICATE (skip)
│     │     └─ Different? → New entry (OK)
│     └─ Completely different problem? → New entry (OK)
```

### SESSION Entry Logic:

```
Before adding SESSION:
├─ Search: "SESSION-{today's date}"
│  ├─ Not found? → Create new
│  └─ Found? → UPDATE existing (don't duplicate)
```

### TODO Task Logic:

```
Before adding task:
├─ Search keywords in TODO.md
│  ├─ Not found? → Create new task
│  └─ Found? → Check status
│     ├─ If completed? → Consider if new instance needed
│     ├─ If in-progress? → Update progress % only
│     └─ If pending? → Update details only
```

---

## What YOU Can Do

### Help Claude Code Avoid Duplicates:

1. **Be Specific When Describing Issues:**
   - ❌ "Fix the bug" (vague)
   - ✅ "Fix the sound loading 403 error" (specific)

2. **Mention If It's a Regression:**
   - "The leaderboard loop is back" → Claude checks previous fix
   - "New bug in leaderboard" → Claude knows it's different

3. **Check TODO.md Before Requesting:**
   - Review in-progress tasks
   - See if already being tracked

4. **Use Task IDs When Referencing:**
   - "Update BUG-P1-008 status" (clear)
   - "That sound thing" (unclear - might create duplicate)

---

## Verification Commands

### You Can Check for Duplicates:

**Search for today's SOLVED entries:**
```bash
grep "SOLVED-2025-10-05" context/context1.md
```

**Search for today's SESSION:**
```bash
grep "SESSION-2025-10-05" context/context1.md
```

**Search for specific task:**
```bash
grep -i "sound files" TODO.md
```

**Count how many times something appears:**
```bash
grep -c "SOLVED-2025-10-05" context/context1.md
# Should return count of today's solved problems
```

---

## Edge Cases

### Case 1: Session Spans Midnight

**Scenario:** You start session at 11 PM, work past midnight.

**Solution:**
- SESSION entry uses START date (Oct 5)
- Any updates after midnight still update Oct 5 SESSION
- Next session (even if same day) is separate

### Case 2: Multiple Sessions Same Day

**Scenario:** Morning session, then separate afternoon session.

**Solution:**
- First session: `SESSION-2025-10-05-CLAUDE-001`
- Second session: `SESSION-2025-10-05-CLAUDE-002`
- Number suffix differentiates

### Case 3: Partial Duplicate (Different Aspect)

**Scenario:** Bug in same component but different symptom.

**Example:**
- Existing: "Fill-Blank deducts lives on keystroke"
- New: "Fill-Blank doesn't accept Enter key"

**Solution:**
- Check root cause
- If different cause → New entry
- If same fix solves both → Update existing entry to mention both symptoms

---

## Summary

### Claude Code WILL Prevent:
✅ Same problem, same day (exact duplicates)
✅ Multiple SESSION entries same day (updates instead)
✅ Duplicate tasks in TODO.md (updates status)
✅ Duplicate session summaries (replaces instead)

### Claude Code WILL Allow:
✅ Same problem, different days (regressions)
✅ Different problems, same day (productive day)
✅ Same component, different bugs (separate issues)
✅ Follow-up entries referencing previous (linked issues)

### Your Safety Net:
- Grep tool searches before every add
- Date-based duplicate detection
- Content comparison for similar entries
- Update-instead-of-add when appropriate

**The system is designed to be smart, not just mechanical!**

---

**Last Updated:** 2025-10-05
**Part of:** Claude Code Session Automation System
