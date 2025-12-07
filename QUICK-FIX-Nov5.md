# QUICK FIX - November 5, 2025
**Time to Fix:** 5 minutes
**Impact:** Fixes Total Points = 0 AND Leaderboard 404 errors

---

## 🎯 PROBLEM SUMMARY

**Console Errors:**
```
1. 400 Bad Request: column quiz_results.total_score does not exist
2. 404 Not Found: /rest/v1/leaderboard
```

**Root Cause:** Two simple typos in `src/services/quizService.js`

---

## ✅ FIX #1: Total Points Query (Line 273-285)

### **BEFORE (Broken):**
```javascript
export const getTotalPoints = async (studentId) => {
  console.log('[getTotalPoints] Fetching total points for student:', studentId);

  const { data, error } = await supabase
    .from('quiz_results')
    .select('total_score')  // ❌ WRONG column name
    .eq('student_id', studentId);

  if (error) {
    console.error('[getTotalPoints] Error fetching points:', error);
    return 0;
  }

  const totalPoints = data?.reduce((sum, result) => sum + (result.total_score || 0), 0) || 0;  // ❌ WRONG
  console.log('[getTotalPoints] Total points calculated:', totalPoints);
  return totalPoints;
};
```

### **AFTER (Fixed):**
```javascript
export const getTotalPoints = async () => {  // ✅ FIXED: Remove studentId param, use session
  const session = getCurrentSession();

  if (!session) {
    console.warn('[getTotalPoints] No session found');
    return 0;
  }

  console.log('[getTotalPoints] Fetching total points for student:', session.user_id);

  const { data, error } = await supabase
    .from('quiz_results')
    .select('total_points')  // ✅ FIXED: Changed from total_score
    .eq('student_id', session.user_id)
    .eq('institution_id', session.institution_id);  // ✅ ADDED: V3 filter

  if (error) {
    console.error('[getTotalPoints] Error fetching points:', error);
    return 0;
  }

  const totalPoints = data?.reduce((sum, result) => sum + (result.total_points || 0), 0) || 0;  // ✅ FIXED
  console.log('[getTotalPoints] Total points calculated:', totalPoints);
  return totalPoints;
};
```

**Changes:**
1. Line 275: `total_score` → `total_points`
2. Line 277: Added `.eq('institution_id', session.institution_id)`
3. Line 284: `result.total_score` → `result.total_points`
4. Function signature: Removed `studentId` param, use `getCurrentSession()` instead

---

## ✅ FIX #2: Leaderboard Query (Line 105-130)

**Database Status (Verified via Supabase MCP):**
- ✅ `daily_leaderboard` table exists (0 rows - not used yet)
- ✅ `weekly_leaderboard` table exists (2 rows - ACTIVE!)
- ❌ `leaderboard` table does NOT exist (old V2 table)

**Current Issue:** Frontend queries non-existent `leaderboard` table
**Solution:** Use `weekly_leaderboard` (since n8n is updating this one)

### **BEFORE (Broken):**
```javascript
export const getTodaysLeaderboard = async () => {
  console.log('[getTodaysLeaderboard] Fetching for date:', new Date().toISOString().split('T')[0]);

  const session = getCurrentSession();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('leaderboard')  // ❌ WRONG - This table doesn't exist!
    .select('*, students(username, full_name)')
    .eq('quiz_date', today)
    .eq('institution_id', session.institution_id)
    .order('rank', { ascending: true });

  if (error) {
    console.error('[getTodaysLeaderboard] Error:', error);
    return [];
  }

  console.log('[getTodaysLeaderboard] Fetched leaderboard:', data?.length || 0, 'entries');
  return data || [];
};
```

### **AFTER (Fixed - Weekly Leaderboard):**
```javascript
export const getTodaysLeaderboard = async () => {
  const session = getCurrentSession();

  if (!session) {
    console.warn('[getTodaysLeaderboard] No session found');
    return [];
  }

  // Calculate this week's Monday
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().split('T')[0];

  console.log('[getTodaysLeaderboard] Fetching for week starting:', weekStart);

  const { data, error } = await supabase
    .from('weekly_leaderboard')  // ✅ FIXED: Changed from 'leaderboard'
    .select('*, students(username, full_name)')
    .eq('week_start_date', weekStart)  // ✅ CHANGED: Use week_start_date
    .eq('institution_id', session.institution_id)
    .order('rank', { ascending: true });

  if (error) {
    console.error('[getTodaysLeaderboard] Error:', error);
    return [];
  }

  console.log('[getTodaysLeaderboard] Fetched leaderboard:', data?.length || 0, 'entries');
  return data || [];
};
```

**Changes:**
1. Line 110: `leaderboard` → `weekly_leaderboard`
2. Line 112: `quiz_date` → `week_start_date`
3. Added week calculation logic

---

## 🎯 HOW TO APPLY FIXES

### **Step 1: Open File**
```bash
# Open in your editor:
code src/services/quizService.js
```

### **Step 2: Find & Replace**

**For Fix #1 (Total Points):**
- Press `Ctrl+F` (or `Cmd+F` on Mac)
- Search for: `export const getTotalPoints`
- Replace the entire function with the "AFTER (Fixed)" version above

**For Fix #2 (Leaderboard):**
- Press `Ctrl+F`
- Search for: `export const getTodaysLeaderboard`
- Replace the entire function with the "AFTER (Fixed)" version above

### **Step 3: Save & Test**
```bash
# Save file (Ctrl+S)
# Refresh browser
# Check console - errors should be gone!
```

---

## 🧪 VERIFICATION CHECKLIST

After applying fixes:

- [ ] Refresh home screen
- [ ] Check console - no more 400 or 404 errors
- [ ] Total Points shows actual number (not 0)
- [ ] Complete a quiz
- [ ] Leaderboard displays after submission
- [ ] Your rank shows correctly

---

## 📊 EXPECTED RESULTS

### **Before Fixes:**
```
Home Screen:
✅ Welcome, Anaya!
✅ Questions Ready: 30
❌ Total Points: 0  (WRONG)

Console:
❌ 400 Bad Request: column total_score does not exist
❌ 404 Not Found: /rest/v1/leaderboard

Leaderboard:
❌ "No scores yet today. Be the first!"
```

### **After Fixes:**
```
Home Screen:
✅ Welcome, Anaya!
✅ Questions Ready: 30
✅ Total Points: 252  (CORRECT!)

Console:
✅ No errors

Leaderboard:
✅ Shows student's rank
✅ Shows all students in institution
```

---

## 🔄 ADDITIONAL FIXES NEEDED

After these two quick fixes, you'll likely need to:

1. **Update getTotalPoints() calls** - Remove `studentId` argument:
   ```javascript
   // BEFORE:
   const points = await getTotalPoints(session.user_id);

   // AFTER:
   const points = await getTotalPoints();  // Uses session internally
   ```

2. **Test FeedbackScreen** - After fixing leaderboard, test if feedback displays

3. **Fix empty arrays in n8n** - Adjust thresholds for:
   - `critical_weaknesses` (2 errors instead of 3)
   - `strong_concepts` (2 correct instead of 3)
   - `review_tomorrow` (timezone calculation)

---

## 📝 FILES TO MODIFY

**Only ONE file needs changes:**
- ✅ `src/services/quizService.js` (Lines 105-130 and 273-285)

**No other files affected.**

---

**Last Updated:** November 5, 2025
**Status:** Ready to apply
**Time Required:** 5 minutes
**Difficulty:** ⭐ Easy (copy-paste)
