# Your Development System

This document explains your new development reference system.

---

## � MOST IMPORTANT: TDD Rules

**Before you do ANYTHING, read [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)**

This system now operates under **STRICT Test-Driven Development (TDD)** rules:
- ✅ Write tests FIRST, before any production code
- ✅ Only implement what failing tests require
- ✅ Verify connectivity before every commit
- ✅ Follow RED → GREEN → BLUE cycle
- ❌ NO commits without passing tests
- ❌ NO production code without tests
- ❌ NO skipping connectivity checks

**Autonomous commits allowed ONLY if all TDD conditions met.**

---

## 📚 Documentation Files (What You Have)

### 1. **DEVELOPMENT_WORKFLOW.md** ⭐ START HERE
Your TDD process guide. This is the EXACT process to follow for every feature.

**Contains:**
- 🚨 Autonomous commit rules (when you can commit on your own)
- Core TDD rules (non-negotiable)
- System connectivity requirements
- RED Phase: Write failing tests first
- GREEN Phase: Minimal implementation to pass tests
- BLUE Phase: Refactor (optional)
- Git commit rules (strict)
- Code quality checks
- Phase completion checklist
- Problem troubleshooting

**When to use:** EVERY TIME before starting work, before commits

**Why it's first:** This enforces TDD discipline and prevents broken commits

---

### 2. **PROJECT_LOG.md** 📝 UPDATE AFTER EACH COMMIT
Progress tracking document. Update this after EVERY successful commit.

**Contains:**
- Date, commit hash, and phase for each entry
- 1-paragraph summary of completed work
- Problems encountered during implementation
- Fixes/solutions applied
- Test results and connectivity status
- Chronological record of all development work

**When to use:** After every successful GREEN or BLUE commit

**Why it's important:** Provides audit trail and assignment documentation

---

### 3. **CODE_QUALITY_STANDARDS.md**
Your code quality guideline. Check every piece of code against this before submitting.

**Contains:**
- Naming conventions (camelCase, PascalCase, etc.)
- JavaScript/React/Node.js standards
- MongoDB schema patterns
- API response formats
- Security checklist
- CodeScene requirements (score ≥ 8.0)

**When to use:** Before coding, during code review, before testing

---

### 4. **ROLE_SYSTEM_SPECIFICATION.md**
Your feature roadmap. Breaks role-based system into 14 phases.

**Contains:**
- Complete role hierarchy (Tenant → Manager → Director → Associate → Admin)
- Each phase in detail:
  - What to add
  - What endpoints to create
  - Required database changes
  - Required tests
- Current progress tracker

**When to use:** Before starting each phase, understand what you're building

---

### 5. **TESTING_REQUIREMENTS.md**
Your test checklist. Every feature must pass these tests.

**Contains:**
- Test 1.1, 1.2, 1.3... for each phase
- Exact API requests and expected responses
- What to check in database
- What to verify in frontend
- Code quality checks
- Common issues & solutions

**When to use:** During RED phase (writing tests), after GREEN phase (verifying)

---

### 6. **QUICK_REFERENCE.md**
Quick lookup for commands, code snippets, common errors.

**Contains:**
- Essential file list
- MongoDB connection string
- How to start backend/frontend
- How to test API endpoints
- Response format templates
- Common status codes
- How to use middleware
- Common errors & fixes
- Useful commands

**When to use:** When you need quick answers, testing APIs, debugging

---

### 7. **UI_UX_STANDARDS.md**
Design and user experience guidelines.

**Contains:**
- Color palette (#2C3E50, #3498DB, etc.)
- Typography standards
- Component patterns for profiles
- Layout specifications from user screenshots
- Responsive design requirements

**When to use:** When implementing frontend components

---

### 8. **README.md**
Updated project overview (now matches your current system)

**Contains:**
- Current status
- Project structure
- Prerequisites
- Quick start (3 steps)
- API overview
- Links to all documentation

**When to use:** Project overview, onboarding new developers

---

## 🎯 How to Use This System (TDD Workflow)

### Starting a New Feature (RED → GREEN → BLUE)

**STEP 1: Discover & Plan (Pre-RED)**
1. **Read DEVELOPMENT_WORKFLOW.md** - Review TDD rules
2. **Read ROLE_SYSTEM_SPECIFICATION.md** - Find the phase you're building
3. **Read TESTING_REQUIREMENTS.md** - Understand required tests
4. **Check existing tests** - Run `npm test` to see current state
5. **Verify connectivity** - Ensure Backend ↔ MongoDB ↔ Frontend working

**STEP 2: RED Phase (Write Failing Tests)**
1. **Open/create test file** - `test/auth.test.js` or appropriate file
2. **Write tests first** - Describe expected behavior in tests
3. **Run tests** - Verify they FAIL for the right reason
4. **Optional commit** - `[RED] Add tests for [feature]`
5. **Update PROJECT_LOG.md** if committed

**STEP 3: GREEN Phase (Minimal Implementation)**
1. **Update database schema** - Only add what tests require (backend/models/)
2. **Update backend endpoints** - Minimal code to pass tests (backend/index.js)
3. **Run tests** - Verify they now PASS
4. **Verify connectivity** - Backend + MongoDB + Frontend all working
5. **Check code quality** - Use CODE_QUALITY_STANDARDS.md
6. **Required commit** - `[GREEN] Implement [feature]`
7. **Update PROJECT_LOG.md** - Add entry with summary, problems, fixes

**STEP 4: BLUE Phase (Refactor - Optional)**
1. **Only if needed** - All tests passing, improve code structure
2. **No behavior change** - Don't add features, just clean up
3. **Run tests again** - Must still pass
4. **Verify connectivity** - Must still work
5. **Optional commit** - `[BLUE] Refactor [what you improved]`
6. **Update PROJECT_LOG.md** if committed

**STEP 5: Frontend (If Phase Requires)**
1. **Update components** - Only after backend tests pass
2. **Test manually** - Browser DevTools, check console
3. **Verify end-to-end** - Complete user flow works
4. **Commit if separate** - Or include in GREEN commit

**STEP 6: Documentation**
1. **Update ROLE_SYSTEM_SPECIFICATION.md** - Mark phase ✅ DONE
2. **Update TESTING_REQUIREMENTS.md** - Mark tests ✅ PASSING
3. **Update PROJECT_LOG.md** - Already done after each commit

### When Tests Fail

1. **Read error message carefully** - Don't guess
2. **Go to DEVELOPMENT_WORKFLOW.md** - "What to Do If Tests Fail" section
3. **Follow debug steps** - Identify root cause
4. **Fix ONLY what's needed** - Minimal change
5. **Re-run test** - Verify fix worked
6. **Continue only when test passes** - Don't move forward with broken tests

### Before Every Commit (Checklist)

```
✅ All tests passing (npm test)
✅ Backend starts without errors
✅ MongoDB connection confirmed
✅ Frontend can reach backend
✅ Code quality standards met
✅ CodeScene score ≥ 8.0
✅ No console.log() in production code
✅ No hardcoded credentials
✅ Commit message follows [RED/GREEN/BLUE] format
✅ PROJECT_LOG.md updated
```

### If You're Stuck

1. Check QUICK_REFERENCE.md "Common Issues & Solutions"
2. Check DEVELOPMENT_WORKFLOW.md "Common Issues & Solutions"
3. Check browser DevTools Console and Network tab
4. Check backend terminal for errors

---

## 📋 Your Phases (In Order)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Role Field & Status System | 📝 NEXT |
| 2 | Profile Landing & Role-Based Routing | ⏳ PENDING |
| 3 | Building Management (Director) | ⏳ PENDING |
| 4 | Apartment Management with Bulk Creation | ⏳ PENDING |
| 5 | Manager Assignment to Buildings | ⏳ PENDING |
| 6 | Tenant Assignment to Apartments | ⏳ PENDING |
| 7 | Issue Reporting System | ⏳ PENDING |
| 8 | Issue Triage & Prioritization | ⏳ PENDING |
| 9 | Associate Job Management | ⏳ PENDING |
| 10 | Job Completion & Payment Tracking | ⏳ PENDING |
| 11 | Manager Tenant Approval | ⏳ PENDING |
| 12 | Director Staff Approval | ⏳ PENDING |
| 13 | Building Notice & Poll System | ⏳ PENDING |
| 14 | Associate ETA Updates | ⏳ PENDING |

**Current Focus: Phase 1 - Role Field & Status System**

---

## ✅ Before You Start Coding (TDD Checklist)

```
Pre-Flight Checks:
- [ ] Read DEVELOPMENT_WORKFLOW.md (TDD rules)
- [ ] Backend running (`node index.js` shows "✅ BACKEND RUNNING")
- [ ] MongoDB connected (startup logs show connection success)
- [ ] Frontend running (`npm start` opens http://localhost:3000)
- [ ] Can signup/login successfully
- [ ] Understand current system structure

Phase Preparation:
- [ ] Read ROLE_SYSTEM_SPECIFICATION.md (for current phase)
- [ ] Read TESTING_REQUIREMENTS.md (for current phase)
- [ ] Checked existing tests: `npm test`
- [ ] Identified what tests are missing
- [ ] Ready to follow RED → GREEN → BLUE cycle

Connectivity Verified:
- [ ] Backend ↔ MongoDB: ✅ CONNECTED
- [ ] Frontend ↔ Backend: ✅ CONNECTED
```

---

## 🚀 Key Principles (TDD Edition)

1. **Tests first, always** - Never write production code before tests
2. **Minimal implementation** - Only implement what tests require
3. **One phase at a time** - Don't start Phase 2 until Phase 1 complete
4. **Test after each change** - RED → GREEN → refactor cycle
5. **Code quality first** - Check against CODE_QUALITY_STANDARDS.md (≥8.0)
6. **Verify connectivity** - Before every commit: Backend+MongoDB+Frontend
7. **No breaking changes** - All existing features must still work
8. **Documentation updates** - Update PROJECT_LOG.md after each commit
9. **Incremental development** - Small steps, frequent testing
10. **Autonomous commits only when safe** - All TDD conditions must be met

---

## 📞 Quick Help

| Question | Answer |
|----------|--------|
| What are the TDD rules? | Check DEVELOPMENT_WORKFLOW.md (top section) |
| What should I build next? | Check ROLE_SYSTEM_SPECIFICATION.md Phase 1 |
| How do I test it? | Check TESTING_REQUIREMENTS.md Phase 1 |
| What process should I follow? | Follow DEVELOPMENT_WORKFLOW.md RED-GREEN-BLUE cycle |
| When can I commit on my own? | When ALL TDD conditions met (see DEVELOPMENT_WORKFLOW.md) |
| How do I track progress? | Update PROJECT_LOG.md after each commit |
| What code quality rules apply? | Check CODE_QUALITY_STANDARDS.md (CodeScene ≥8.0) |
| How do I test an API? | Check QUICK_REFERENCE.md "Testing API Endpoints" |
| What's my MongoDB string? | Check QUICK_REFERENCE.md "MongoDB Connection String" |
| What if tests fail? | DEVELOPMENT_WORKFLOW.md "What to Do If Tests Fail" |
| Tests are failing, what do I do? | Check DEVELOPMENT_WORKFLOW.md "What to Do If Tests Fail" |

---

## 🎓 Learning This System

If you're new to this:

1. **First day**: Read README.md and understand current system
2. **Second day**: Read ROLE_SYSTEM_SPECIFICATION.md (understand what you're building)
3. **Third day**: Read TESTING_REQUIREMENTS.md Phase 1 (understand what tests you need)
4. **Fourth day**: Read DEVELOPMENT_WORKFLOW.md (understand the process)
5. **Fifth day**: Start Phase 1 following the workflow

Take your time. This system ensures you build quality code without breaking things.

---

## 📈 Progress Tracking

As you complete each phase, update ROLE_SYSTEM_SPECIFICATION.md:

From:
```
| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Role Field | ⏳ NEXT |
```

To:
```
| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Role Field | ✅ DONE |
```

And update TESTING_REQUIREMENTS.md:

From:
```
**Status: ⏳ Not Started**
```

To:
```
**Status: ✅ PASSING**
```

This lets you (and me) see your progress at a glance.

---

## 🎯 Success Criteria

Your development is successful when:

1. ✅ You can start a new feature by reading the specification
2. ✅ You understand what tests must pass before moving on
3. ✅ You follow the workflow without skipping steps
4. ✅ Code passes all quality standards
5. ✅ All tests pass before moving to next phase
6. ✅ No breaking changes introduced
7. ✅ Features work in browser
8. ✅ Documentation stays updated

**This ensures:** Clean code, working features, no regressions, sustainable growth.

---

## Ready to Build?

Yes? Then:

1. Open [ROLE_SYSTEM_SPECIFICATION.md](ROLE_SYSTEM_SPECIFICATION.md)
2. Read Phase 1 carefully
3. Open [TESTING_REQUIREMENTS.md](TESTING_REQUIREMENTS.md)
4. Read Phase 1 tests
5. Open [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)
6. Follow Step 1: Update database

Let's build this right! 🚀

