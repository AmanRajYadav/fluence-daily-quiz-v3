# n8n Workflow Best Practices - TODO

## Overview
This document outlines security and performance best practices that should be implemented in our n8n workflows.

## 1. SQL Injection Prevention (HIGH PRIORITY)

### Current Issue
PostgreSQL nodes currently use template syntax directly in SQL queries, which could be vulnerable to SQL injection:

```sql
-- ❌ Current (Not recommended)
SELECT * FROM leaderboard WHERE student_id = '{{ $('Parse Quiz Data').item.json.quizResults.student_id }}' AND quiz_date = '{{ $('Parse Quiz Data').item.json.currentDate }}' LIMIT 1;
```

### Recommended Fix
Use parameterized queries with Query Parameters option:

```sql
-- ✅ Recommended
SELECT * FROM leaderboard WHERE student_id = $1 AND quiz_date = $2 LIMIT 1;
```

**Steps to implement:**
1. In each PostgreSQL node, click "Add option" → "Query Parameters"
2. Add parameters with their values from the workflow data
3. Replace direct template insertions with `$1`, `$2`, `$3`, etc.

### Nodes to Update

#### Quiz Results Handler - IMPROVED Workflow

1. **Check Existing Leaderboard Entry** (Line 151)
   - Current Query: Uses direct template insertion
   - Parameters needed:
     - `$1` = `{{ $('Parse Quiz Data').item.json.quizResults.student_id }}`
     - `$2` = `{{ $('Parse Quiz Data').item.json.currentDate }}`
   - New Query:
     ```sql
     SELECT * FROM leaderboard WHERE student_id = $1 AND quiz_date = $2 LIMIT 1;
     ```

2. **Update Leaderboard Entry** (Line 197)
   - Current Query: Uses direct template insertion
   - Parameters needed:
     - `$1` = `{{ $('Parse Quiz Data').item.json.quizResults.score }}`
     - `$2` = `{{ $('Parse Quiz Data').item.json.quizResults.time_taken_seconds }}`
     - `$3` = `{{ $('Parse Quiz Data').item.json.quizResults.student_id }}`
     - `$4` = `{{ $('Parse Quiz Data').item.json.currentDate }}`
   - New Query:
     ```sql
     UPDATE leaderboard
     SET score = $1, time_taken_seconds = $2, rank = 999
     WHERE student_id = $3 AND quiz_date = $4
     RETURNING *;
     ```

3. **Insert Leaderboard Entry** (Line 214)
   - Current Query: Uses direct template insertion
   - Parameters needed:
     - `$1` = `{{ $('Parse Quiz Data').item.json.quizResults.student_id }}`
     - `$2` = `{{ $('Parse Quiz Data').item.json.currentDate }}`
     - `$3` = `{{ $('Parse Quiz Data').item.json.quizResults.score }}`
     - `$4` = `{{ $('Parse Quiz Data').item.json.quizResults.time_taken_seconds }}`
   - New Query:
     ```sql
     INSERT INTO leaderboard (student_id, quiz_date, score, time_taken_seconds, rank)
     VALUES ($1, $2, $3, $4, 999)
     RETURNING *;
     ```

4. **Get All Today Scores** (Line 241)
   - Current Query: Uses direct template insertion
   - Parameters needed:
     - `$1` = `{{ $('Parse Quiz Data').item.json.currentDate }}`
   - New Query:
     ```sql
     SELECT id, student_id, score, time_taken_seconds
     FROM leaderboard
     WHERE quiz_date = $1
     ORDER BY score DESC, time_taken_seconds ASC;
     ```

5. **Update Rank** (Line 279)
   - Current Query: Uses direct template insertion
   - Parameters needed:
     - `$1` = `{{ $json.rank }}`
     - `$2` = `{{ $json.id }}`
   - New Query:
     ```sql
     UPDATE leaderboard SET rank = $1 WHERE id = $2;
     ```

## 2. Error Handling

### Current Issue
No explicit error handling in workflows.

### Recommended Implementation
- Add "Error Trigger" nodes to catch and log errors
- Implement retry logic for transient failures
- Send error notifications (email/Slack) for critical failures

### Steps to implement:
1. Add "Error Trigger" node to workflow
2. Connect to a "Set" node to format error data
3. Add conditional logic to retry or alert based on error type

## 3. Logging and Monitoring

### Recommended Additions
- Add structured logging nodes after critical operations
- Log all quiz submissions with timestamps
- Track workflow execution times
- Monitor failed executions

### Implementation:
1. Add "Set" nodes after key operations to log:
   - Student ID
   - Timestamp
   - Operation result
   - Execution time
2. Store logs in a dedicated Supabase table or external logging service

## 4. Rate Limiting and Validation

### Input Validation
Add validation in "Parse Quiz Data" node to check:
- Required fields are present
- Data types are correct
- Score is within valid range (0-100)
- Time taken is reasonable (not negative, not excessively long)
- Student ID is valid UUID format

### Example Validation Code:
```javascript
const body = $input.item.json.body;

// Validate required fields
if (!body.student_id || !body.quiz_date || body.score === undefined) {
  throw new Error('Missing required fields: student_id, quiz_date, or score');
}

// Validate student_id is UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(body.student_id)) {
  throw new Error('Invalid student_id format. Must be UUID.');
}

// Validate score range
if (body.score < 0 || body.score > 100) {
  throw new Error('Score must be between 0 and 100');
}

// Validate time taken
if (body.time_taken_seconds < 0 || body.time_taken_seconds > 3600) {
  throw new Error('Time taken must be between 0 and 3600 seconds');
}

// Continue with normal processing...
```

## 5. Performance Optimization

### Database Connection Pooling
- Currently using Transaction Pooler (✅ Good)
- Ensure connection limits are appropriate for concurrent load

### Batch Operations
- For rank updates, consider using a single UPDATE query with CASE statement instead of loop
- Example:
  ```sql
  UPDATE leaderboard
  SET rank = CASE id
    WHEN $1 THEN $2
    WHEN $3 THEN $4
    ...
  END
  WHERE id IN ($1, $3, ...);
  ```

## 6. Security Enhancements

### Environment Variables
Move sensitive data to n8n environment variables:
- Supabase host
- Webhook paths
- API keys

### Webhook Authentication
Add authentication to webhook endpoints:
1. Generate a secret token
2. Store in environment variable
3. Validate token in webhook requests

### Example:
```javascript
const body = $input.item.json.body;
const headers = $input.item.json.headers;

const expectedToken = $env.WEBHOOK_SECRET_TOKEN;
const receivedToken = headers['x-webhook-token'];

if (receivedToken !== expectedToken) {
  throw new Error('Unauthorized: Invalid webhook token');
}
```

## 7. Data Retention and Cleanup

### Implement Scheduled Cleanup
- Create a scheduled workflow to archive old quiz results
- Keep only last 90 days in active tables
- Move older data to archive tables

## Implementation Priority

1. **High Priority** (Implement within 1 week)
   - [ ] SQL Injection Prevention (parameterized queries)
   - [ ] Input validation in Parse Quiz Data
   - [ ] Webhook authentication

2. **Medium Priority** (Implement within 1 month)
   - [ ] Error handling and retry logic
   - [ ] Structured logging
   - [ ] Performance optimization (batch rank updates)

3. **Low Priority** (Implement as needed)
   - [ ] Data retention policies
   - [ ] Advanced monitoring and alerting
   - [ ] Rate limiting

## Testing Checklist

Before deploying changes:
- [ ] Test with valid quiz submission
- [ ] Test with invalid data (missing fields)
- [ ] Test with malicious input (SQL injection attempts)
- [ ] Test concurrent submissions (multiple students at once)
- [ ] Test error scenarios (database down, network issues)
- [ ] Verify rank calculation accuracy
- [ ] Check response times under load

---

**Last Updated**: October 5, 2025
**Created By**: Claude Code
**Status**: Pending Implementation
