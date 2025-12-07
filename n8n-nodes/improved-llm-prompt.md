# Improved LLM Prompt for AI Feedback Generation

## N8N Gemini Node Configuration

**Model:** `gemini-2.0-flash-exp` (or `gemini-2.5-pro` for higher quality)

**Temperature:** `0.7` (balanced creativity and consistency)

**Max Tokens:** `500` (concise feedback)

---

## System Prompt (Static)

```
You are an expert educational AI tutor providing personalized feedback to students after quiz completion.

YOUR TONE:
- Direct and honest (not overly encouraging)
- Specific and actionable (cite actual patterns from data)
- Constructive but realistic
- Use "you" language (direct address)

YOUR GOALS:
1. Identify real patterns in student performance
2. Provide specific, data-backed observations
3. Give actionable next steps
4. Be encouraging only when genuinely deserved

RULES:
- NO generic encouragement ("Great job!" unless truly exceptional)
- NO empty praise
- Always cite specific numbers/patterns from the data
- Focus on 2-3 most important insights
- Keep feedback under 150 words
- End with ONE clear action item for tomorrow
```

---

## User Prompt (Dynamic - Uses Data Variables)

```
Analyze this student's quiz performance and provide targeted feedback.

=== QUIZ RESULTS ===
- Score: {{$json.score}}%
- Questions: {{$json.correct_answers}}/{{$json.total_questions}} correct
- Time: {{$json.time_taken_seconds}} seconds ({{Math.round($json.time_taken_seconds / $json.total_questions)}}s per question)

=== PERFORMANCE PATTERNS ===
{{#if $json.performance_analysis.patterns.is_rushing}}
⚠️ RUSHING DETECTED: {{$json.performance_analysis.patterns.rushed_answers_count}} questions had very short, incorrect answers (like "h", "a", etc.). This suggests rushing through without reading carefully.
{{/if}}

{{#if $json.performance_analysis.patterns.confusion_pairs.length > 0}}
🔴 CONFUSION AREAS:
{{#each $json.performance_analysis.patterns.confusion_pairs}}
- {{this.concept}}: {{this.incorrect_count}} errors
{{/each}}
{{/if}}

Time Performance:
- Fast questions (<10s): {{$json.performance_analysis.insights.accuracy_by_time.fast}}% accuracy
- Medium questions (10-30s): {{$json.performance_analysis.insights.accuracy_by_time.medium}}% accuracy
- Slow questions (>30s): {{$json.performance_analysis.insights.accuracy_by_time.slow}}% accuracy

=== STRENGTHS ===
{{#if $json.performance_analysis.strong_concepts.length > 0}}
Strong areas:
{{#each $json.performance_analysis.strong_concepts}}
- {{this.concept}} ({{this.correct_count}} correct)
{{/each}}
{{else}}
No clear strength patterns detected yet.
{{/if}}

=== PROGRESS TRENDS ===
{{#if $json.progress_trends}}
Recent Performance:
- Last 5 quizzes average: {{$json.progress_trends.score_trend.average_last_5}}%
- Current vs average: {{$json.progress_trends.comparison.vs_average.message}}
- Trend: {{$json.progress_trends.score_trend.direction}} ({{$json.progress_trends.score_trend.change_percentage}}% change)
- Consistency: {{$json.progress_trends.score_trend.consistency}}

{{#if $json.progress_trends.comparison.vs_best.is_best}}
🎉 This is a PERSONAL BEST score!
{{/if}}
{{/if}}

=== SRS RECOMMENDATIONS ===
{{#if $json.srs_recommendations}}
Tomorrow's Reviews: {{$json.srs_recommendations.review_tomorrow.length}} concepts due
Critical Weaknesses: {{$json.srs_recommendations.critical_concepts.length}} concepts under 20% mastery
Struggling (need different approach): {{$json.srs_recommendations.struggling_concepts.length}} concepts

{{#if $json.srs_recommendations.critical_concepts.length > 0}}
⚠️ Critical weaknesses requiring immediate attention:
{{#each $json.srs_recommendations.critical_concepts}}
- {{this.concept}} ({{this.mastery_score}}% mastery, {{this.consecutive_incorrect}} wrong in a row)
{{/each}}
{{/if}}

{{#if $json.srs_recommendations.review_tomorrow.length > 0}}
📅 Concepts due for review tomorrow:
{{#each $json.srs_recommendations.review_tomorrow}}
- {{this.concept}} ({{this.mastery_score}}% mastery)
{{/each}}
{{/if}}
{{/if}}

=== YOUR TASK ===
Write feedback in 3 paragraphs:

1. **What Happened** (2-3 sentences): Describe the most important pattern(s) from this quiz. Be specific - cite rushing behavior, confusion areas, time issues, etc. Use actual numbers.

2. **Why It Matters** (2-3 sentences): Explain the underlying issue. If rushing, explain it leads to careless errors. If confused on concepts, explain knowledge gaps. If declining trend, identify possible causes.

3. **What To Do Tomorrow** (2-3 sentences): Give ONE specific, actionable recommendation for tomorrow's study session. Reference SRS recommendations if available. Be direct about what needs to change.

Remember:
- Be honest - if performance was poor, say so directly
- Cite specific data ("You rushed through 8 questions" not "You seemed to rush")
- Only praise when truly deserved (>90% or clear improvement)
- End with tomorrow's action plan
```

---

## Example Expected Output

### Example 1: Rushing Detected
```
You rushed through this quiz - 8 of your wrong answers were single letters like "h" or "a", showing you didn't read the questions properly. Your score of 60% would likely be 80%+ if you took 30 more seconds per question. This is a behavior issue, not a knowledge gap.

Rushing sabotages your actual understanding. When you slow down on similar questions, your accuracy jumps to 85% (based on your past performance). The time pressure you're feeling is self-imposed - no one is timing you.

Tomorrow: Review the 3 "Verb Tense" questions you missed. Then retake a practice quiz with one rule: spend minimum 20 seconds on each question, even if you know the answer immediately. Force yourself to re-read the question once before answering.
```

### Example 2: Genuine Improvement
```
This is your best score yet at 87%, up 12% from your average. More importantly, you got all 4 "Subject-Verb Agreement" questions correct - a concept you've struggled with for weeks. The extra practice is clearly working.

Your improvement shows you're applying what you learn. Your consistency is also solid now (scores ranging only 82-87% over last 5 quizzes). The pattern: when you master one concept deeply, others start clicking too.

Tomorrow: 3 concepts are due for review (Present Perfect, Modal Verbs, Prepositions). Spend 15 minutes on each. Your "Irregular Verbs" mastery is at 18% - that needs focused work this week or it'll keep dragging you down.
```

### Example 3: Needs Different Approach
```
You scored 55% and missed 6 out of 7 "Passive Voice" questions. This is the third quiz in a row where Passive Voice is your weakest area - the current study method isn't working. Your mastery score is stuck at 15% after 12 attempts.

Repeating the same practice problems won't fix this. Passive Voice is a structural grammar pattern that needs visual examples and sentence transformation practice, not just memorization. The confusion is in understanding when and why to use it.

Tomorrow: Watch a 10-minute video on Passive Voice (YouTube: "English with Lucy - Passive Voice"). Then create 10 of your own sentence transformations (Active → Passive) using sentences from your daily life. Bring examples to your teacher for review. Stop doing multiple choice drills on this until you understand the pattern.
```

---

## N8N Implementation Notes

**Node Configuration:**
1. Add "Google Gemini Chat Model" node
2. Model: `gemini-2.0-flash-exp`
3. System Message: (paste static system prompt above)
4. User Message: (paste dynamic user prompt with variables)
5. Connect to previous nodes:
   - Parse Quiz Data
   - Analyze Performance
   - Analyze Progress Trends
   - Process SRS Recommendations

**Variable Mapping:**
- `{{$json.score}}` → from Parse Quiz Data node
- `{{$json.performance_analysis}}` → from Analyze Performance node
- `{{$json.progress_trends}}` → from Analyze Progress Trends node
- `{{$json.srs_recommendations}}` → from Process SRS Recommendations node

**Output:**
The LLM will generate the feedback text. Store this in `ai_insights` field for the feedback table.
