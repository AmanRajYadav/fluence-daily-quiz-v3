# Manual Questions Directory

This directory stores manually generated quiz questions before n8n automation.

## File Structure

```
manual-questions/
├── README.md (this file)
├── questions-[student-name]-[date].json    # AI-generated JSON
├── questions-[student-name]-[date].sql     # Auto-generated SQL (from json-to-sql.js)
└── test-feedback-[date].md                 # Testing notes
```

## Workflow

1. Generate questions using AI (Gemini/Claude) with prompt from `MANUAL-QUIZ-GENERATION-WORKFLOW.md`
2. Save JSON output here: `questions-[student-name]-[date].json`
3. Run converter: `node ../scripts/json-to-sql.js questions-anaya-2025-10-05.json [student-uuid]`
4. Copy generated SQL to Supabase SQL Editor
5. Execute and verify
6. Test in quiz app
7. Document feedback in `test-feedback-[date].md`

## Example Files

- `questions-anaya-2025-10-05.json` - Generated questions
- `questions-anaya-2025-10-05.sql` - SQL INSERT statements
- `test-feedback-2025-10-05.md` - Testing notes

## Once Perfected

Move to n8n automation when:
- ✅ 25-question format stable
- ✅ All question types work correctly
- ✅ Answer validation accurate
- ✅ Process documented with learnings
