# n8n Execution Patterns & Best Practices

**Created:** 2025-10-13
**Last Updated:** 2025-10-13
**Purpose:** Quick reference for n8n workflow patterns learned during Fluence Quiz automation

---

## 🔄 Execution Order (CRITICAL)

### **Rule: Branches Execute Top-to-Bottom, Sequentially**

n8n does **NOT** execute branches in parallel by default. If a node has multiple output branches, they execute in order from top to bottom.

**Example:**
```
Node A
  ├─ Branch 1 (executes FIRST)
  ├─ Branch 2 (executes SECOND)
  └─ Branch 3 (executes THIRD)
```

### **Why This Matters:**

**Scenario 1: Deactivate Before Insert**
```
✅ CORRECT ORDER:
Data Processing
  ↓
Deactivate Old Questions (executes first - active=false)
  ↓
Generate New Questions
  ↓
Insert New Questions (executes last - active=true)

❌ WRONG ORDER:
Data Processing
  ↓
Insert New Questions (executes first - active=true)
  ↓
Deactivate Old Questions (executes last - active=false)
Result: New questions get deactivated too!
```

**Scenario 2: Calculate Before Use**
```
✅ CORRECT ORDER:
Fetch Data
  ↓
Calculate Total (executes first)
  ↓
Use Total in Query (executes second)

❌ WRONG ORDER:
Fetch Data
  ↓
Use Total in Query (executes first - Total is undefined!)
  ↓
Calculate Total (executes second - too late!)
```

### **Visual Placement Best Practice:**

Arrange nodes **vertically** in execution order:
```
[Node 1]
   ↓
[Node 2]
   ↓
[Node 3]
```

Don't arrange horizontally:
```
[Node 1] → [Node 2] → [Node 3]
```

Horizontal arrangement makes it harder to see execution order when multiple branches exist.

---

## 📝 Expression Syntax Rules

### **Use {{...}} for Node Data ONLY**

✅ **CORRECT:**
```javascript
// Referencing node data
{{ $json.field_name }}
{{ $('Node Name').first().json.field }}
{{ $input.all() }}
```

❌ **WRONG:**
```javascript
// Static values (API keys, JWTs, hardcoded strings)
{{YOUR_API_KEY}}  // n8n tries to evaluate this as expression!
{{Bearer eyJhbGc...}}  // Will fail!
```

**Rule:** If it's not dynamic data from a node, don't use {{...}}

---

### **Cross-Node References: Use .first()**

✅ **CORRECT:**
```javascript
{{ $('Data Processing').first().json.transcription }}
{{ $('Calculate Total').first().json.total }}
```

❌ **AVOID:**
```javascript
{{ $('Data Processing').item.json.transcription }}  // Less reliable
{{ $json.transcription }}  // Only works for adjacent nodes
```

**Why .first()?**
- More explicit and reliable
- Works even when node isn't directly before current node
- Always gets first item from output array

---

### **Node Names Must Match EXACTLY**

❌ **COMMON MISTAKES:**
```javascript
$('data processing')      // Wrong: lowercase
$('Data Processing2')     // Wrong: added number
$('Data  Processing')     // Wrong: double space
$(' Data Processing')     // Wrong: leading space
```

✅ **CORRECT:**
```javascript
$('Data Processing')  // Must match node name exactly
```

**Tips:**
- Node names are case-sensitive
- Spaces, numbers, special characters must match exactly
- Use console.log to debug node references
- Rename nodes carefully - update all references

---

## 🔗 Query Parameters vs URL Strings

### **Use Query Parameters Section**

✅ **CORRECT:**
```
URL: https://api.supabase.co/rest/v1/table

Query Parameters:
- Name: student_id
  Mode: Expression
  Value: eq.{{ $json.student_id }}

- Name: active
  Mode: Fixed
  Value: eq.true
```

❌ **WRONG:**
```
URL: https://api.supabase.co/rest/v1/table?student_id=eq.{{ $json.student_id }}
```

**Why?**
- n8n doesn't always evaluate expressions in URL strings
- Query Parameters section properly encodes values
- Easier to debug and modify
- Better error messages

---

## 🗄️ PostgreSQL/Supabase Patterns

### **Column Naming Convention**

PostgreSQL uses **snake_case** by default:

✅ **CORRECT:**
```json
{
  "student_id": "...",
  "question_text": "...",
  "correct_answer": "..."
}
```

❌ **WRONG:**
```json
{
  "student-id": "...",      // kebab-case (Postgres won't find this)
  "studentId": "...",       // camelCase (Postgres won't find this)
  "QuestionText": "..."     // PascalCase (Postgres won't find this)
}
```

### **UPSERT Pattern**

For idempotent inserts (insert or update if exists):

```
Method: POST
URL: /rest/v1/table_name?on_conflict=column1,column2

Headers:
- Prefer: resolution=merge-duplicates,return=representation

Body:
{
  "column1": "value1",
  "column2": "value2",
  "column3": "value3"
}
```

**Key Points:**
- `on_conflict` in URL specifies conflict columns
- `Prefer` header with `merge-duplicates` enables upsert
- `return=representation` returns the inserted/updated data

---

## 🔐 Authentication Patterns

### **Supabase HTTP Requests**

✅ **CORRECT:**
```
Headers:
- apikey: <redacted – set via env/credentials>
- Authorization: Bearer <redacted – set via env/credentials>
- Content-Type: application/json
- Prefer: return=representation
```

❌ **WRONG:**
```
Headers:
- apikey: {{YOUR_JWT_TOKEN}}
- Authorization: Bearer {{YOUR_JWT_TOKEN}}
```

**Error if using {{...}}:**
```
"Expected 3 parts in JWT; got 1"
```

**Why?** n8n treats {{...}} as an expression to evaluate, not a literal string.

---

## 🐛 Debugging Workflow

### **Step-by-Step Debugging Process:**

1. **Test Individual Nodes**
   - Click "Execute Node" instead of "Execute Workflow"
   - Verify each node's output before moving to next
   - Check Input/Output tabs in execution history

2. **Inspect Data Structure**
   - Click on node in execution history
   - View JSON tab to see exact structure
   - Verify field names match your expressions

3. **Use Console Logs**
   ```javascript
   console.log('=== DEBUG ===');
   console.log('Field value:', someVariable);
   console.log('Full object:', JSON.stringify(data, null, 2));
   ```

4. **Check Execution Order**
   - Look at workflow visually
   - Confirm branches are in correct top-to-bottom order
   - Verify dependencies execute before dependent nodes

5. **Fix One Thing at a Time**
   - Don't change multiple nodes at once
   - Test after each fix
   - Document what worked

---

## 📊 Data Flow Patterns

### **Pattern 1: Linear Flow**
```
Webhook → Process → Transform → Insert → Response
```
Simple, single path. Easy to debug.

### **Pattern 2: Branch and Merge**
```
Process
  ├─ Branch 1 → Transform A ─┐
  └─ Branch 2 → Transform B ─┴─ Merge → Continue
```
Branches execute sequentially (top first), then merge.

### **Pattern 3: Loop Pattern**
```
Get Array → Loop → Process Item → Insert Item → (repeat 30x)
```
Each iteration uses `$json` to access current item.

### **Pattern 4: Conditional Routing**
```
Fetch Data → IF Node
              ├─ True → Branch A
              └─ False → Branch B
```
Only one branch executes based on condition.

---

## ⚠️ Common Pitfalls

### **1. Assuming Parallel Execution**
```
❌ WRONG ASSUMPTION:
"All branches will run at the same time"

✅ REALITY:
"Branches execute top-to-bottom sequentially"
```

### **2. Using .item Instead of .first()**
```
❌ FRAGILE:
{{ $('Node').item.json.field }}

✅ ROBUST:
{{ $('Node').first().json.field }}
```

### **3. Wrapping Static Values in {{...}}**
```
❌ BREAKS:
apikey: {{eyJhbGc...}}

✅ WORKS:
apikey: eyJhbGc...
```

### **4. Mismatched Column Names**
```
❌ BREAKS:
{ "student-id": "..." }  // kebab-case

✅ WORKS:
{ "student_id": "..." }  // snake_case
```

### **5. Missing Prefer Header**
```
❌ NO RESPONSE DATA:
Prefer: (not set)

✅ RETURNS DATA:
Prefer: return=representation
```

---

## 🎯 Production Checklist

Before deploying an n8n workflow:

- [ ] All node names are unique and descriptive
- [ ] Branches are arranged top-to-bottom in execution order
- [ ] Cross-node references use `.first()` syntax
- [ ] No {{...}} around static values (API keys, JWTs)
- [ ] Query Parameters section used for dynamic URLs
- [ ] PostgreSQL column names use snake_case
- [ ] Prefer headers set for Supabase requests
- [ ] Console.log statements added for debugging
- [ ] Each node tested individually
- [ ] Full workflow tested end-to-end
- [ ] Error handling implemented (try-catch where needed)
- [ ] Workflow documented (comments, README)

---

## 📚 Related Documentation

- **N8N-QUIZ-GENERATION-WORKFLOW.md** - Complete workflow setup guide
- **N8N-BEST-PRACTICES.md** - Security, performance, SQL injection prevention
- **context1C.md (SOLVED-2025-10-13-024)** - Detailed problem-solving documentation
- **LEADERBOARD-SETUP-INSTRUCTIONS.md** - Quiz Results Handler workflow

---

## 🔄 Version History

- **v1.0 (2025-10-13):** Initial documentation based on Question Generation Workflow debugging
  - Added execution order patterns
  - Documented expression syntax rules
  - Added PostgreSQL/Supabase patterns
  - Added common pitfalls and solutions

---

**Remember:** When in doubt, test the node individually and inspect the output structure. n8n's execution is predictable once you understand the sequential top-to-bottom pattern! 🚀
