# FLUENCE QUIZ V2 - MASTER PLAN INDEX

**⚠️ IMPORTANT:** The master plan is split into 2 parts to stay under Claude Code's 2,500-line Read limit.

---

## 📖 HOW TO READ THE MASTER PLAN

**Always read BOTH parts in order:**

### Part 1 (Lines 1-1,250)
**File:** [MASTER-PLAN-PART-1.md](MASTER-PLAN-PART-1.md)

**Contains:**
1. Project Vision & Identity
2. Current State Analysis
3. Strategic Architecture Changes
4. Complete Database Schema
5. UI/UX Design System
6. Development Roadmap (Weeks 1-8)

**Read this first!**

---

### Part 2 (Lines 1,251-2,544)
**File:** [MASTER-PLAN-PART-2.md](MASTER-PLAN-PART-2.md)

**Contains:**
7. Development Roadmap (Weeks 9-12)
8. Feature Specifications
9. Budget & Pricing Strategy
10. TODO Tracking
11. Past Learnings & Solved Problems
12. AI Agent Instructions
13. Success Metrics
14. Tech Stack Philosophy & Research Strategy

**Read this second!**

---

## 🎯 QUICK NAVIGATION

### Planning a Sprint?
→ Read **Part 1** (Section 6: Development Roadmap)

### Writing Database Queries?
→ Read **Part 1** (Section 4: Database Schema)
→ Or use [DATABASE-SCHEMA-REFERENCE.md](DATABASE-SCHEMA-REFERENCE.md)

### Building UI Components?
→ Read **Part 1** (Section 5: UI/UX Design System)

### Implementing Specific Feature?
→ Read **Part 2** (Section 8: Feature Specifications)

### Checking Past Problems?
→ Read **Part 2** (Section 11: Past Learnings)

### Need AI Agent Instructions?
→ Read **Part 2** (Section 12: AI Agent Instructions)
→ Or use [AI-AGENT-QUICK-START.md](AI-AGENT-QUICK-START.md)

### Researching Tech Decisions?
→ Read **Part 2** (Section 14: Tech Stack Philosophy)

---

## ⚠️ FILE SIZE MONITORING

**Claude Code Read Limit:** ~2,500 lines per file

**Current Status:**
- Part 1: **1,250 lines** ✅ (Safe)
- Part 2: **1,294 lines** ✅ (Safe)
- Combined: 2,544 lines (split required)

### When to Split Again?

**Watch these files:**
- Any file approaching **2,400 lines** (yellow zone)
- Any file exceeding **2,500 lines** (red zone - must split)

**How to Check:**
```bash
wc -l roadmap-guide/*.md
```

**How to Split:**
```bash
# If file exceeds 2,500 lines, split it:
head -1250 file.md > file-PART-1.md
tail -n +1251 file.md > file-PART-2.md
# Then create INDEX file like this one
```

---

## 🌐 DOMAIN USAGE

### Primary Domain: fluence.ac
**Purpose:** Main quiz platform for students, teachers, institutions
**Target:** Coaching centers, personal tutors, schools
**Deploy Here:** Production app

### Secondary Domain: fluence.institute
**Purpose:** Reserved for future project (Teacher Training Institute or similar)
**Status:** Backup / Future expansion

---

## 🔬 TECH STACK PHILOSOPHY

### Core Principles

**1. Modern & Efficient First**
- Always research latest best practices
- Use modern frameworks and tools
- Stay updated with tech trends

**2. Stability & Security Second**
- Don't compromise on reliability
- Security is non-negotiable
- Test thoroughly before deploying

**3. Research Before Building**
- Web search for every major tech decision
- Check TechCrunch for industry trends
- Follow "Build in Public" on Twitter/X
- Browse relevant Reddit communities (r/webdev, r/reactjs, r/node, etc.)
- Read official documentation
- Check GitHub stars, issues, and activity

**4. Budget-Conscious**
- Free tier before paid service
- Open source before proprietary
- Self-hosted before SaaS (if cost-effective)

### Research Sources (Priority Order)

**For Technical Decisions:**
1. **Official Documentation** (always first!)
2. **GitHub** (stars, issues, recent activity)
3. **Stack Overflow** (real-world problems)
4. **Dev.to / Medium** (tutorials, comparisons)
5. **Reddit** (r/webdev, r/reactjs, r/nodejs, r/devops)
6. **Twitter/X** (#buildinpublic, #webdev, #reactjs)

**For Product Strategy:**
1. **TechCrunch** (industry trends, funding, exits)
2. **Indie Hackers** (revenue models, growth tactics)
3. **Y Combinator** (startup best practices)
4. **ProductHunt** (competitor research)

**For UI/UX Inspiration:**
1. **Dribbble** (design trends)
2. **Behance** (case studies)
3. **Mobbin** (mobile UI patterns)
4. **Real competitors** (Duolingo, Khan Academy, Quizlet)

**For EdTech Insights:**
1. **EdSurge** (education technology news)
2. **TeachThought** (pedagogy + technology)
3. **Education Week** (teacher perspectives)

---

## 📋 AI AGENT CHECKLIST

**Before starting any session:**

- [ ] Read MASTER-PLAN-PART-1.md (or relevant sections)
- [ ] Read MASTER-PLAN-PART-2.md (or relevant sections)
- [ ] Check file sizes (ensure no file exceeds 2,500 lines)
- [ ] Review current sprint in TODO.md
- [ ] Check Past Learnings for similar problems

**During development:**

- [ ] Web search for any new technology/library
- [ ] Check official documentation
- [ ] Verify stability and security
- [ ] Test on mobile devices

**After completing work:**

- [ ] Update TODO.md
- [ ] Add learnings to Part 2 (Section 11)
- [ ] Check if any file needs splitting
- [ ] Document tech decisions made

---

## 🚨 CRITICAL: File Management Rules

### For AI Agents

**ALWAYS check file size before editing:**
```bash
wc -l filename.md
```

**If file is >2,400 lines:**
1. ⚠️ **WARNING:** File approaching Read limit
2. Plan to split after current session
3. Notify user about splitting need

**If file is >2,500 lines:**
1. 🚨 **CRITICAL:** File exceeds Read limit
2. Cannot read full file in next session
3. Must split immediately before continuing
4. Create INDEX file like this one

**How to Add Content to Split Files:**
- For new sections 1-6: Edit Part 1
- For new sections 7-14: Edit Part 2
- If Part 2 approaches 2,400 lines, create Part 3

### Monitoring Schedule

**Weekly Check:**
```bash
# Check all planning docs
wc -l roadmap-guide/*.md
```

**Before Major Updates:**
```bash
# Check specific file
wc -l roadmap-guide/MASTER-PLAN-PART-2.md
```

---

## 📞 QUICK REFERENCE

**Primary Plan:** Part 1 + Part 2 (read both!)
**Database Queries:** DATABASE-SCHEMA-REFERENCE.md
**Quick Context:** AI-AGENT-QUICK-START.md
**File Organization:** README.md

**Domains:**
- fluence.ac (primary - quiz platform)
- fluence.institute (secondary - future use)

**Research Before Building:**
- TechCrunch (trends)
- Twitter #buildinpublic
- Reddit r/webdev, r/reactjs
- GitHub (check stars, activity)
- Official docs (always!)

---

**Last Updated:** 2025-10-26
**Total Lines:** 2,544 (split into 2 files)
**Status:** Active Planning
