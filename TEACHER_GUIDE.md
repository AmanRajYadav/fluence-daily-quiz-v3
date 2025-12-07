# 👨‍🏫 Teacher Guide - Viewing Quiz Results

## 📊 Where to View Student Quiz Results

### **Option 1: Supabase Dashboard (Recommended)**

1. **Login to Supabase**
   - Go to https://supabase.com
   - Login to your project

2. **Navigate to Quiz History**
   - Click on "Table Editor" in the left sidebar
   - Select the `quiz_history` table
   - You'll see all submitted quiz results

3. **Available Data Fields:**
   - `student_id` - Unique student identifier
   - `student_name` - Student's display name
   - `quiz_date` - Date the quiz was taken
   - `total_questions` - Number of questions in the quiz
   - `correct_answers` - Number of correct answers
   - `score` - Percentage score (0-100)
   - `time_taken_seconds` - Total time spent on quiz
   - `lives_remaining` - Lives left at end (0-3)
   - `highest_streak` - Best streak of correct answers
   - `total_score` - Points earned (with bonuses)
   - `power_ups_used` - JSON object showing power-up usage:
     - `fifty_fifty` - Number of 50:50 used
     - `blaster` - Number of Blaster used
     - `extra_time` - Number of Extra Time used
   - `answers_json` - Detailed answer data (see below)
   - `concepts_tested` - Array of concepts covered
   - `created_at` - Timestamp of submission

4. **Viewing Detailed Answers:**
   - Click on any row
   - Click on the `answers_json` field
   - You'll see a JSON object with all questions and answers:
     ```json
     {
       "questions": [
         {
           "question_id": 123,
           "question_text": "What is...",
           "question_type": "multiple_choice",
           "student_answer": "Option A",
           "correct_answer": "Option A",
           "is_correct": true,
           "time_spent": 15,
           "points_earned": 125,
           "concept_tested": "Grammar"
         }
       ]
     }
     ```

5. **Filtering & Searching:**
   - Use the search box to find specific students
   - Filter by date range
   - Sort by score, date, or any column

---

### **Option 2: n8n Webhook Integration**

The quiz automatically sends data to your configured webhook URL.

**What's Sent to Webhook:**
```json
{
  "student_id": "uuid-here",
  "student_name": "John Doe",
  "quiz_date": "2025-10-04",
  "total_questions": 10,
  "correct_answers": 7,
  "score": 70,
  "time_taken_seconds": 300,
  "lives_remaining": 1,
  "highest_streak": 4,
  "total_score": 824,
  "power_ups_used": {
    "fifty_fifty": 1,
    "blaster": 2,
    "extra_time": 0
  },
  "answers_json": {
    "questions": [...]
  },
  "concepts_tested": ["Grammar", "Vocabulary"]
}
```

**Common Webhook Uses:**
1. **Google Sheets** - Automatically log results
2. **Email Notifications** - Get notified of new submissions
3. **Slack/Discord** - Post results to a channel
4. **Custom Dashboard** - Build your own analytics

**Setup Instructions:**
1. Create an n8n workflow
2. Add a Webhook trigger node
3. Copy the webhook URL
4. Add to `.env` file: `REACT_APP_N8N_WEBHOOK_URL=your-url-here`

---

### **Option 3: Export Data**

From Supabase Table Editor:
1. Select rows you want to export
2. Click "Export" button
3. Download as CSV or JSON
4. Analyze in Excel, Google Sheets, or any analytics tool

---

## 📈 Key Metrics to Track

### **Individual Student Performance:**
- Average score over time
- Improvement rate
- Time management (time_taken_seconds)
- Power-up usage patterns
- Lives remaining (indicates difficulty)
- Concept mastery (from concepts_tested)

### **Class Performance:**
- Class average score
- Most challenging questions (from answers_json)
- Common wrong answers
- Concepts needing more focus
- Streak achievements (engagement indicator)

### **Gamification Metrics:**
- Average highest_streak (engagement)
- Power-up usage frequency
- Lives remaining distribution
- Total points earned trends

---

## 🔍 Advanced Queries (Supabase SQL Editor)

### Get Student's Quiz History:
```sql
SELECT * FROM quiz_history
WHERE student_id = 'student-uuid-here'
ORDER BY created_at DESC;
```

### Get Class Average for Today:
```sql
SELECT AVG(score) as average_score
FROM quiz_history
WHERE quiz_date = CURRENT_DATE;
```

### Get Top 10 Students (All Time):
```sql
SELECT student_name, AVG(score) as avg_score, COUNT(*) as quizzes_taken
FROM quiz_history
GROUP BY student_id, student_name
ORDER BY avg_score DESC
LIMIT 10;
```

### Get Concept Mastery Report:
```sql
SELECT
  unnest(concepts_tested) as concept,
  AVG(score) as avg_score,
  COUNT(*) as times_tested
FROM quiz_history
GROUP BY concept
ORDER BY avg_score ASC;
```

---

## 🎯 Understanding the Data

### **Score Calculation:**
- Base: 100 points per correct answer
- Speed Bonus: Up to 50 points (based on time remaining)
- Streak Multiplier: 1x to 2x (increases 0.1x per streak, max 10)
- Formula: `(100 + speedBonus) * streakMultiplier`

### **Lives System:**
- Students start with 3 lives
- Lose 1 life per wrong answer or timeout
- Game ends when lives reach 0

### **Power-Ups:**
- **50:50** - Removes 2 wrong options (2 uses)
- **Blaster** - Shows & auto-selects correct answer (2 uses)
- **Extra Time** - Adds 30 seconds (2 uses)

### **Streaks:**
- Consecutive correct answers
- Resets to 0 on wrong answer
- Milestone celebrations every 5 streaks

---

## 📧 Need Help?

For technical support or questions:
- Check Supabase logs for errors
- Verify webhook URL is configured
- Ensure students have active questions assigned

---

**Last Updated:** 2025-10-04
