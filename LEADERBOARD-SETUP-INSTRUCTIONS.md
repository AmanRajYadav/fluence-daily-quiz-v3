# Leaderboard Update Workflow - Setup Instructions

## Overview
This document explains how to set up the n8n workflow that automatically updates the leaderboard when quiz results are submitted.

## Why This Approach?
- **Security**: Frontend uses read-only ANON_KEY, all writes use SERVICE_ROLE_KEY in n8n
- **Single Source of Truth**: All data updates happen in n8n
- **Automatic Rank Calculation**: Ranks are always correct and up-to-date
- **Better Error Handling**: n8n can retry failed operations

## Prerequisites
1. n8n instance running at `https://n8n.myworkflow.top`
2. Supabase credentials (already configured in n8n)
3. The workflow JSON file: `Leaderboard-Update-Workflow.json`

## Step 1: Import the Workflow into n8n

1. Open your n8n instance: `https://n8n.myworkflow.top`
2. Click on **"Workflows"** in the left sidebar
3. Click **"Add Workflow"** (or the + button)
4. Click the **three dots menu** (⋮) in the top right
5. Select **"Import from File"**
6. Upload the file: `E:\fluence-quiz-v2\Leaderboard-Update-Workflow.json`
7. Click **"Import"**

## Step 2: Configure Supabase Credentials

The workflow uses PostgreSQL nodes to connect to Supabase. You need to configure the credentials:

1. Click on any **"Check Existing Entry"** node (or any PostgreSQL node)
2. In the **Credentials** section, click **"Create New"**
3. Enter the following details:

   **Connection Details:**
   - **Host**: `wvzvfzjjiamjkibegvip.supabase.co` (or your Supabase project host)
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: `[Your Supabase Database Password]`
   - **Port**: `5432`
   - **SSL**: Enable (check the box)

4. Click **"Save"** and name it: `Supabase PostgreSQL`
5. The credential will now be available for all PostgreSQL nodes in the workflow

## Step 3: Update All PostgreSQL Nodes

After creating the credential, you need to assign it to all PostgreSQL nodes:

1. Go through each PostgreSQL node:
   - Check Existing Entry
   - Update Existing Entry
   - Insert New Entry
   - Get All Today Scores
   - Update Rank

2. For each node:
   - Click on the node
   - In the **Credentials** dropdown, select `Supabase PostgreSQL`
   - Click **"Execute Node"** to test (optional)

## Step 4: Activate the Workflow

1. Click **"Save"** in the top right to save the workflow
2. Toggle the **"Active"** switch in the top right to **ON**
3. The webhook will now be live at: `https://n8n.myworkflow.top/webhook/quiz-leaderboard-update`

## Step 5: Update Your Frontend Webhook URL (Optional)

If you want to use this separate endpoint for leaderboard updates, update your `.env` file:

```env
REACT_APP_N8N_WEBHOOK_URL=https://n8n.myworkflow.top/webhook/quiz-submit
REACT_APP_LEADERBOARD_WEBHOOK_URL=https://n8n.myworkflow.top/webhook/quiz-leaderboard-update
```

**Note**: Currently, the quiz submission webhook should handle both quiz results AND leaderboard updates in a single workflow. You can either:
- **Option A**: Keep this as a separate workflow and call it after quiz submission
- **Option B** (Recommended): Merge this into your existing "Quiz Results Handler" workflow

## Step 6: Test the Workflow

### Test using Postman or curl:

```bash
curl -X POST https://n8n.myworkflow.top/webhook/quiz-leaderboard-update \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "98825c00-fb8f-46dc-bec7-3cdd8880efea",
    "student_name": "Anaya",
    "quiz_date": "2025-10-05",
    "score": 100,
    "time_taken_seconds": 45,
    "total_questions": 10,
    "correct_answers": 10
  }'
```

### Expected Response:

```json
{
  "success": true,
  "message": "Quiz results and leaderboard updated successfully",
  "data": {
    "score": 100,
    "rank": 1,
    "total_students": 3,
    "concepts_to_review": [],
    "next_milestone": "Keep going!"
  }
}
```

### Verify in Supabase:

1. Open Supabase SQL Editor
2. Run: `SELECT * FROM leaderboard WHERE quiz_date = '2025-10-05' ORDER BY rank;`
3. You should see the entry with correct rank

## How It Works

### Workflow Steps:

1. **Webhook Trigger**: Receives quiz results from frontend
2. **Check Existing Entry**: Queries if student already has entry for today
3. **IF Entry Exists**:
   - TRUE → Update existing entry with new score
   - FALSE → Insert new entry
4. **Merge**: Combines both branches
5. **Get All Today's Scores**: Fetches all scores for today, sorted by score DESC
6. **Calculate Ranks**: Assigns rank based on position (1, 2, 3, etc.)
7. **Loop**: Iterates through each entry
8. **Update Rank**: Updates each entry with calculated rank
9. **Prepare Response**: Creates response with student's rank
10. **Respond to Webhook**: Sends response back to frontend

### Data Flow:

```
Frontend Quiz App
    ↓ (submits results)
n8n Webhook
    ↓
Supabase (leaderboard table)
    ↓ (calculates ranks)
n8n Response
    ↓
Frontend (shows rank in real-time)
```

## Troubleshooting

### Error: "Workflow could not be found"
- Make sure you activated the workflow (toggle is ON)

### Error: "Connection failed"
- Check Supabase credentials are correct
- Verify SSL is enabled
- Check firewall allows connection from n8n server

### Error: "Invalid student_id"
- Ensure the student_id is a valid UUID in your students table

### Leaderboard not updating in real-time
- The frontend uses Supabase Realtime subscriptions
- Check that the leaderboard table has Realtime enabled in Supabase

## Integration with Existing Workflow

If you already have a "Quiz Results Handler" workflow, you can merge this logic into it:

1. Open your existing "Quiz Results Handler" workflow
2. After the nodes that save to `quiz_history`, add these nodes:
   - Check Existing Entry
   - IF Entry Exists
   - Update/Insert branches
   - Calculate Ranks
   - Update Rank loop
3. Delete the standalone leaderboard workflow once integrated

## Security Notes

- The workflow uses **SERVICE_ROLE_KEY** credentials with full database access
- Frontend only has **ANON_KEY** with read-only access (via RLS policies)
- Never expose SERVICE_ROLE_KEY in frontend code
- Keep n8n credentials secure

## Next Steps

1. ✅ Import workflow
2. ✅ Configure Supabase credentials
3. ✅ Test with sample data
4. ✅ Integrate with quiz submission
5. ⏭️ Monitor execution logs in n8n
6. ⏭️ Merge into existing quiz results workflow (optional)

---

**Last Updated**: October 5, 2025
**Created By**: Claude Code
