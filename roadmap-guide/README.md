# Roadmap & Planning Documents

This folder contains all strategic planning documents for Fluence Quiz v2.

---

## 📋 FILES IN THIS FOLDER

### 1. MASTER-PLAN-INDEX.md ⭐ (START HERE)
**Read this first!** Index and navigation guide for the split master plan.

**What it contains:** How to read Parts 1 & 2, quick navigation, file size monitoring

---

### 2. MASTER-PLAN-PART-1.md (Primary Strategic Plan - Part 1)
**Read second!** First half of complete 12-week strategic plan.

**Size:** 1,276 lines ✅ (Safe - under 2,500 limit)
**Last Updated:** 2025-10-26

**Contains:**
1. Project Vision & Identity
2. Current State Analysis
3. Strategic Architecture Changes
4. Complete Database Schema (13 tables)
5. UI/UX Design System (Duolingo-inspired)
6. Development Roadmap (Weeks 1-8)

**Use for:** Vision, database, UI design, early sprints

---

### 3. MASTER-PLAN-PART-2.md (Primary Strategic Plan - Part 2)
**Read third!** Second half of complete 12-week strategic plan.

**Size:** 1,326 lines ✅ (Safe - under 2,500 limit)
**Last Updated:** 2025-10-26

**Contains:**
7. Development Roadmap (Weeks 9-12)
8. Feature Specifications
9. Budget & Pricing Strategy
10. TODO Tracking
11. Past Learnings & Solved Problems
12. AI Agent Instructions
13. Success Metrics
14. Tech Stack Philosophy & Research Strategy

**Use for:** Feature specs, budget, past learnings, tech decisions

---

---

### 4. DATABASE-SCHEMA-REFERENCE.md
Quick reference for database structure and common queries.

**Use for:** Writing SQL queries, understanding relationships, migration planning

---

### 5. AI-AGENT-QUICK-START.md
30-second context for AI agents working on the project.

**Use for:** Quick onboarding, critical rules reminder, past learnings summary

---

### 6. TECH-STACK-PHILOSOPHY.md
Guide for making technology decisions with research process and approved sources.

**Use for:** Before choosing any new library/service, tech stack decisions

---

### 7. CORRECTIONS-APPLIED.md
Record of corrections made on 2025-10-26 (file splits, date fixes, domain updates).

**Use for:** Reference only, shows what was fixed today

---

## 🎯 HOW TO USE THESE DOCS

### For Developers (You + AI Agents)

**Day 1 of Sprint:**
1. Read MASTER-PLAN-QUIZ-V2.md → Current sprint section
2. Check TODO.md in root folder → Day-to-day tasks
3. Start building!

**When Writing Database Queries:**
1. Open DATABASE-SCHEMA-REFERENCE.md
2. Find relevant table/query example
3. Adapt to your needs

**When Onboarding New AI Agent:**
1. Share AI-AGENT-QUICK-START.md first
2. Then point to MASTER-PLAN-QUIZ-V2.md
3. Then context files in /context folder

---

## 🔄 KEEPING DOCS UPDATED

**When you complete a task:**
- Update TODO.md (in root folder)
- If significant learning, add to MASTER-PLAN-QUIZ-V2.md → Section 10

**When you make architectural decision:**
- Add to context/context1B.md (Design Decisions)
- Reference in MASTER-PLAN-QUIZ-V2.md if critical

**When you solve a bug:**
- Add to context/context1C.md (Solved Problems)
- Add key lesson to MASTER-PLAN-QUIZ-V2.md → Section 10

---

## 📚 OTHER IMPORTANT DOCS (Outside This Folder)

**In Root Folder:**
- `TODO.md` - Session-based task tracking
- `MASTER-PLAN.md` - Original 10-phase plan (still relevant)
- `CLAUDE.md` - Project overview for Claude Code
- `.claude-session-config.md` - Automation protocols

**In /context Folder:**
- `context1A.md` - Master context (vision, architecture)
- `context1B.md` - Design decisions log
- `context1C.md` - Latest solved problems
- `context2.md` - Knowledge base (SRS, Jugaad, quality protocols)

---

## 🚀 QUICK START FOR NEW SPRINT

```bash
# 1. Read the plan
cat roadmap-guide/MASTER-PLAN-QUIZ-V2.md | grep "WEEK 1-2"

# 2. Check current tasks
cat TODO.md | grep "NEXT PHASE"

# 3. Review database schema
cat roadmap-guide/DATABASE-SCHEMA-REFERENCE.md

# 4. Start building!
```

---

## 💡 TIPS

**For AI Agents:**
- Always read MASTER-PLAN-QUIZ-V2.md at start of session
- Check Past Learnings section before solving similar problems
- Follow AI Agent Instructions (Section 11)

**For Human Developers:**
- This folder is your strategic reference
- Day-to-day work tracked in root TODO.md
- Don't edit these files during sprints (only at planning sessions)

---

**Created:** 2025-10-26
**Purpose:** Central planning hub for Fluence Quiz v2 development
**Domains:** fluence.ac, fluence.institute
