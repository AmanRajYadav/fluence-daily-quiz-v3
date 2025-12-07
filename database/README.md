# Fluence Quiz V3 - Database Setup Guide

## 🎯 Quick Start

### Step 1: Run Migrations on Supabase V3

1. **Open Supabase SQL Editor:**
   - Go to: [https://supabase.com/dashboard/project/qhvxijsrtzpirjbuoicy/sql](https://supabase.com/dashboard/project/qhvxijsrtzpirjbuoicy/sql)

2. **Run Schema Migration:**
   - Copy contents of `migrations/001_initial_schema.sql`
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for success message: "Fluence Quiz V3 schema created successfully!"

3. **Run Seed Data:**
   - Copy contents of `seeds/002_seed_fluence_institution.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Verify output shows:
     - ✅ Institution: Fluence (FLUENCE)
     - ✅ Teacher: Aman Raj Yadav
     - ✅ Class: Class 6 (FLUENCE-CLASS6-2025)

---

## 📊 Database Structure

### **17 Tables Created:**

1. **institutions** - Root entity (Fluence)
2. **teachers** - Teacher accounts with roles
3. **classes** - Class 6, with class codes
4. **students** - Tech-savvy students
5. **student_class_enrollments** - Multi-class support
6. **pin_reset_tokens** - Email recovery
7. **login_attempts** - Rate limiting
8. **user_sessions** - Persistent login
9. **quiz_questions** - Question bank
10. **quiz_results** - Quiz submissions
11. **concept_mastery** - SRS tracking
12. **daily_leaderboard** - Daily rankings
13. **weekly_leaderboard** - Weekly rankings
14. **feedback** - AI insights
15. **weekly_reports** - Parent emails
16. **quiz_history** - Replay mode
17. **notes_history** - Class notes

---

## 🔑 Default Credentials

### **Teacher Login:**
```
Email: aman@fluence.ac
Password: aman@123
```
⚠️ **CHANGE PASSWORD ON FIRST LOGIN!**

### **Student Registration:**
Students use class code: `FLUENCE-CLASS6-2025`

---

## ✅ Verification Queries

Run these in Supabase SQL Editor to verify setup:

### Check Institution:
```sql
SELECT * FROM institutions WHERE code = 'FLUENCE';
```

### Check Teacher:
```sql
SELECT t.*, i.name as institution_name
FROM teachers t
JOIN institutions i ON t.institution_id = i.id
WHERE t.email = 'aman@fluence.ac';
```

### Check Class:
```sql
SELECT c.*, t.full_name as teacher_name
FROM classes c
JOIN teachers t ON c.teacher_id = t.id
WHERE c.class_code = 'FLUENCE-CLASS6-2025';
```

### Count Tables:
```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';
```
Expected: 17 tables

---

## 🚀 Next Steps After Migration

1. ✅ Update `.env` with V3 credentials
2. ✅ Build React authentication components
3. ✅ Test teacher login
4. ✅ Test student registration flow
5. ✅ Connect to n8n workflows

---

## 📝 Key Design Decisions

### **Multi-Class Enrollment:**
- Same student (username: anaya01) can join multiple classes
- Uses `student_class_enrollments` table
- Student registers once, joins classes via class codes

### **Authentication:**
- **Students:** Class Code + Username + 4-digit PIN
- **Teachers:** Email + Strong Password
- **Recovery:** Email-based PIN reset (if email provided)

### **Security:**
- Rate limiting: 3 attempts per 15 minutes
- PIN hashing with bcrypt
- Session tokens for persistent login
- Separate teacher/student portals

---

## 🔧 Troubleshooting

### "Function uuid_generate_v4() does not exist"
**Solution:** Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` first

### "Relation already exists"
**Solution:** Drop existing tables or use a fresh Supabase project

### "Cannot insert null into column"
**Solution:** Check all NOT NULL fields are provided in seed data

---

## 📚 Additional Resources

- **V2 Database (Reference):** https://wvzvfzjjiamjkibegvip.supabase.co
- **V3 Database (New):** https://qhvxijsrtzpirjbuoicy.supabase.co
- **Schema Documentation:** See `migrations/001_initial_schema.sql` for detailed comments

---

**Created:** 2025-10-27
**Version:** 3.0
**Status:** Ready to deploy 🚀
