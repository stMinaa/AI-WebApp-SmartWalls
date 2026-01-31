# Development Workflow - Strict TDD Edition

This is your process for adding features safely. Follow this EVERY time.

---

## 🚨 AUTONOMOUS COMMIT RULES (NON-NEGOTIABLE) 🚨

**You may ONLY commit on your own if ALL conditions are met:**

1. ✅ Test suite passes (`npm test`)
2. ✅ All TDD rules respected (see below)
3. ✅ Backend boots successfully
4. ✅ MongoDB Atlas connection confirmed
5. ✅ Frontend can reach backend
6. ✅ Commit represents exactly ONE TDD step:
   - **RED** → tests only
   - **GREEN** → minimal implementation
   - **BLUE** → refactor only

**If ANY condition is unmet:** DO NOT commit. Stop and ask for guidance.

---

## ════════════════════════════════
## CORE TDD RULES (NON-NEGOTIABLE)
## ════════════════════════════════

### Rule 1: Tests First, Always
**You must NEVER modify production code before:**
- Discovering all existing tests
- Identifying which tests are failing

### Rule 2: Missing Behavior = Write Test First
**If required behavior is missing:**
- You must FIRST propose or write tests
- You must NOT implement code yet

### Rule 3: Only Implement What Tests Require
**You must ONLY implement behavior required by failing tests:**
- Do not add speculative or defensive logic
- Do not introduce untested behavior

### Rule 4: Assume Continuous Testing
**You must assume tests are executed after every change:**
- Red tests → fix only what is failing
- Green tests → do not add behavior

### Rule 5: Refactor Only When Green
**Refactoring is allowed ONLY when:**
- All tests pass
- No behavior changes

---

## ════════════════════════════════
## SYSTEM CONNECTIVITY REQUIREMENTS
## ════════════════════════════════

### Before Committing, You MUST Verify:

**1. Backend starts successfully**
- Server boots without runtime errors
- Required environment variables are present

**2. Backend ↔ MongoDB Atlas connectivity**
- Database connection succeeds
- No connection errors or retries on startup
- Health check or startup log confirms connection

**3. Frontend ↔ Backend connectivity**
- Frontend is configured with correct API base URL
- A known backend endpoint is reachable
- No CORS or network errors occur

**4. Connectivity checks must be:**
- Non-destructive
- Read-only
- Executed via health checks or smoke tests

### You Must NOT:
- Modify production data in Atlas
- Use Atlas in unit tests
- Bypass connectivity checks

---

## ════════════════════════════════
## TESTING & ITERATION PROCESS
## ════════════════════════════════

### For Every Iteration, Explicitly State:

```
- Existing tests: [list or state "none found"]
- Failing tests: [list specific failures]
- Missing tests (if any): [list what behavior needs tests]
- Connectivity status:
  - Backend ↔ MongoDB: [✅ CONNECTED / ❌ FAILED]
  - Frontend ↔ Backend: [✅ CONNECTED / ❌ FAILED]
- Decision: [what TDD step: RED/GREEN/BLUE]
- Change applied: [describe changes]
- Expected outcome: [what should happen]
```

**Make ONE logical change per iteration.**

---

## ════════════════════════════════
## GIT COMMIT RULES (STRICT)
## ════════════════════════════════

### Commit Message Format:
```
[RED/GREEN/BLUE] Brief description

- Reference test file(s)
- Describe tested behavior
- Note connectivity verification (if applicable)

Example:
[GREEN] Implement role field in User signup
- Tests: test/auth.test.js (signup with role)
- Connectivity: Backend+MongoDB verified
```

### Commit Types:
- **RED**: Test-only commit (tests fail intentionally)
- **GREEN**: Minimal implementation to pass tests
- **BLUE**: Refactoring (no behavior change, all tests pass)

---

## ════════════════════════════════
## STRICT PROHIBITIONS
## ════════════════════════════════

### You Must NOT:
- ❌ Commit failing tests (except intentional RED test-only commits)
- ❌ Mix tests and implementation in one commit
- ❌ Touch MongoDB Atlas in unit tests
- ❌ Add debug logs or commented-out code
- ❌ Hardcode credentials or secrets
- ❌ Silence or ignore errors

---

## Before You Start ANY Feature

1. **Discover** existing tests in test/ folder
2. **Read** the phase description in ROLE_SYSTEM_SPECIFICATION.md
3. **Read** the tests for that phase in TESTING_REQUIREMENTS.md
4. **Plan** tests needed for missing behavior
5. **Verify** connectivity: Backend → MongoDB → Frontend

---

## Step-by-Step TDD Feature Addition Process

### 🔴 RED PHASE: Write Failing Tests First

**Step 1: Discover Existing Tests**
```
Location: test/ folder (or package.json test script)

Actions:
- Run `npm test` to see current test status
- List all test files
- Identify what's already tested
- Identify what's NOT tested yet

Document:
- Existing tests: [list files]
- Passing tests: [count]
- Failing tests: [list specific failures]
```

**Step 2: Write Tests for Missing Behavior**
```
Location: test/auth.test.js (or appropriate test file)

For each new feature:
1. Write test that describes expected behavior
2. Test should FAIL (feature not implemented yet)
3. Run test to confirm it fails for the right reason

Example:
describe('User Signup with Role', () => {
  it('should accept role parameter and set status to pending', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'test', email: 'test@test.com', password: 'pass123', role: 'tenant' });
    
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('tenant');
    expect(response.body.user.status).toBe('pending');
  });
});

Then run:
✅ Test fails (expected - feature not implemented)
✅ Test fails for correct reason (not random error)
```

**Step 3: Verify Connectivity Before Implementation**
```
Before writing production code:
1. Start backend: `npm start` in backend/
2. Check MongoDB connection in startup logs
3. Verify frontend can reach backend (health check or existing endpoint)

Document:
- Backend ↔ MongoDB: [✅ CONNECTED / ❌ FAILED]
- Frontend ↔ Backend: [✅ CONNECTED / ❌ FAILED]
```

**RED PHASE COMMIT (Optional):**
```
git add test/
git commit -m "[RED] Add tests for user role and status system
- Tests: test/auth.test.js (signup, login, me with role/status)
- Expected: Tests fail - feature not implemented yet"
```

---

### 🟢 GREEN PHASE: Minimal Implementation

**Step 4: Update Database Schema (Minimal)**
```
Location: backend/models/User.js (or new model)

ONLY add what's needed to pass failing tests:
- Add new fields required by tests
- Add minimal validations
- Do NOT add "nice to have" features

Example:
role: { type: String, enum: ['tenant', 'manager', 'director', 'associate'], default: 'tenant' },
status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' }

Then verify:
✅ Schema compiles without errors
✅ Can create document with new fields
✅ No breaking changes to existing code
```

**Step 5: Implement Backend Endpoint Changes (Minimal)**
```
Location: backend/index.js (or new route file)

ONLY implement what tests require:
- Modify endpoint to accept new parameters
- Add logic to pass tests
- Do NOT add extra validation or features

Example:
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;
  // ... existing validation ...
  
  const user = new User({
    username,
    email, 
    password: hashedPassword,
    firstName,
    lastName,
    role: role || 'tenant',  // NEW: accept role
    status: 'pending'        // NEW: set pending status
  });
  
  // ... rest of existing code ...
});

Then verify:
✅ Endpoint compiles without errors
✅ Can call endpoint successfully
✅ No console.log() left in code
```

**Step 6: Run Tests - Verify They Pass**
```
Run: npm test

Expected:
✅ Previously failing tests now PASS
✅ All existing tests still PASS
✅ No new failures introduced

If tests fail:
- Read error message carefully
- Fix ONLY what's needed to pass tests
- Do NOT add extra features
- Run tests again
```

**Step 7: Verify System Connectivity**
```
1. Start backend: npm start (backend/)
   ✅ No errors on startup
   ✅ MongoDB connection confirmed in logs

2. Start frontend: npm start (frontend/)
   ✅ Compiles successfully
   ✅ No CORS errors in browser console

3. Test a flow manually:
   ✅ Frontend → Backend → MongoDB → Response
   ✅ No errors in browser or terminal

4. Check VS Code Problems panel:
   ✅ No errors from project code
   ✅ Node_modules errors can be ignored (excluded in jsconfig.json)
   ✅ No TypeScript config errors in project files
```

**GREEN PHASE COMMIT (Required):**
```
git add backend/ test/ docs/ .gitignore jsconfig.json
git commit -m "[GREEN] Implement role and status in User signup
- Tests: test/auth.test.js (all passing)
- Backend: User schema + signup endpoint updated
- Connectivity: Backend+MongoDB+Frontend verified"
```

---

### 🔵 BLUE PHASE: Refactor (Optional)

**Step 8: Refactor Code (Only if Needed)**
```
Refactoring is allowed ONLY when:
✅ All tests are passing
✅ You don't change behavior
✅ You improve code quality

Examples of safe refactoring:
- Extract repeated code into functions
- Rename variables for clarity
- Reorganize file structure
- Add JSDoc comments
- Remove dead code

Then verify:
✅ npm test still passes
✅ Connectivity still works
✅ No behavior changed
```

**BLUE PHASE COMMIT (If refactoring was done):**
```
git add backend/
git commit -m "[BLUE] Refactor user validation into helper function
- Tests: All tests still passing
- No behavior change
- Improved: Code readability and reusability"
```

---

## Code Quality Checks (Before Every Commit)

```
Backend:
✅ No console.log() (except errors)
✅ All errors caught (try/catch)
✅ All inputs validated
✅ Response format consistent
✅ Functions under 50 lines
✅ Variable names clear
✅ CodeScene score ≥ 8.0

Frontend:
✅ No console errors
✅ No console.log()
✅ State properly managed
✅ Error messages clear
✅ Loading indicators shown
✅ Responsive on mobile

Tests:
✅ All tests passing (npm test)
✅ Code coverage maintained or improved
✅ No skipped or disabled tests

VS Code Problems Panel:
✅ Zero errors in YOUR code (backend/, frontend/, test/)
✅ Ignore node_modules errors (dependencies managed by .vscode/settings.json)
✅ Ignore tsconfig.json warnings in node_modules
✅ Ignore CodeScene duplication warnings in test files (test repetition is acceptable)
⚠️ If Problems panel shows node_modules errors: Reload VS Code window (Ctrl+Shift+P → "Reload Window")
```

---

## Manual End-to-End Testing (After GREEN Commit)

```
1. Open http://localhost:3000
2. Test the feature end-to-end:
   - Sign up or login
   - Try the new feature
   - Verify it works
   - Test edge cases
3. Open DevTools Console:
   - No red errors
   - No warnings
4. Check Network tab:
   - API calls have 200/201/400 status
   - Response has correct format
5. Check Application > LocalStorage:
   - Token is valid
   - User object has all fields
```

---

## Update Progress Documentation (After Successful Commit)

```
1. Update ROLE_SYSTEM_SPECIFICATION.md:
   - Mark phase as ✅ DONE
   - Update "Current Progress" table
   
2. Update TESTING_REQUIREMENTS.md:
   - Mark tests as ✅ PASSING

3. Add comments in code if complex
```

### Step 9: Commit/Save Work
```
✅ All tests passing
✅ Code quality checked
✅ Documentation updated
✅ No breaking changes
✅ Feature works in browser

Now safe to move to next feature!
```

---

## Checklist Template (Copy This for Each Feature)

```markdown
## Phase [N]: [Feature Name]

### Pre-Implementation
- [ ] Read specification in ROLE_SYSTEM_SPECIFICATION.md
- [ ] Read tests in TESTING_REQUIREMENTS.md
- [ ] Understand database changes needed
- [ ] Plan implementation

### Database Changes
- [ ] Schema updated
- [ ] Validations added
- [ ] Indexes added if needed
- [ ] Timestamps present
- [ ] Test schema compiles
   - Mark tests as ✅ PASSING
   
3. Update docs/PROJECT_LOG.md (Progress Summary):
   - Add 1 paragraph summary of completed work
   - Include problems encountered and fixes applied
   - Document date and commit hash
```

---

## Phase Completion Checklist

```
### Database Schema
- [ ] Schema updated with required fields
- [ ] Validations added
- [ ] No breaking changes
- [ ] Schema matches tests

### Backend Implementation
- [ ] Endpoint created/updated
- [ ] Authorization check added (role-based)
- [ ] Input validation added
- [ ] Error handling added
- [ ] Response format consistent
- [ ] Manual API test passed
- [ ] No console.log() left
- [ ] No hardcoded values

### Frontend Implementation (if needed)
- [ ] Component created/updated
- [ ] State management working
- [ ] API calls functional
- [ ] Error handling working
- [ ] Loading states shown
- [ ] Responsive design verified
- [ ] No console errors

### Testing (TDD)
- [ ] All tests discovered
- [ ] Tests written before implementation
- [ ] All tests passing (npm test)
- [ ] No skipped tests
- [ ] All existing tests still pass

### Connectivity Verification
- [ ] Backend starts without errors
- [ ] MongoDB Atlas connection confirmed
- [ ] Frontend can reach backend
- [ ] No CORS errors
- [ ] End-to-end flow works

### Code Quality
- [ ] No console.log()
- [ ] All errors caught
- [ ] All inputs validated
- [ ] Response format correct
- [ ] Functions clean and short
- [ ] Variable names clear
- [ ] CodeScene score ≥ 8.0
- [ ] Comments added for complex logic

### Final Verification
- [ ] Feature works in browser
- [ ] DevTools console clean (no errors)
- [ ] Network requests successful
- [ ] Database records correct
- [ ] Documentation updated
- [ ] PROJECT_LOG.md updated

### Git Commit Status
- [ ] [RED/GREEN/BLUE] commit made
- [ ] Commit message follows format
- [ ] Only related files included
- [ ] No sensitive data committed

### Status
✅ READY FOR NEXT PHASE
```

---

## What to Do If Tests Fail

1. **Don't Skip It** - Fix the failing test
2. **Debug**:
   - Check backend logs
   - Check browser DevTools Console
   - Check Network tab requests
   - Check database directly
3. **Identify Root Cause**:
   - Is it backend logic?
   - Is it frontend UI?
   - Is it API format mismatch?
4. **Fix**:
   - Apply minimal fix
   - Don't change other code
5. **Re-Test**:
   - Run the failing test again
   - Make sure all tests still pass

---

## Common Issues & Solutions

### Backend not responding
```
- Check: Is Node running? (terminal shows "Server listening on port 5000")
- Check: Is MongoDB connected? (terminal shows "✅ MONGO RUNNING")
- Fix: Kill and restart backend: Taskkill /IM node.exe /F
```

### 401 Unauthorized
```
- Check: Is token in Authorization header?
- Check: Is token valid? (logged in recently)
- Check: Is authenticateToken middleware working?
- Fix: Login again, get fresh token
```

### 403 Forbidden
```
- Check: Does user have correct role?
- Check: Is role check in endpoint? (if (user.role !== 'DIRECTOR') ...)
- Fix: Create user with correct role, or adjust role check
```

### Data not in database
```
- Check: Did save() finish? (check response)
- Check: Is connection string correct?
- Fix: Verify MongoDB Atlas connection, check username/password
```

### Frontend not updating
```
- Check: Is state set? (console.log state)
- Check: Is useEffect running? (add console.log)
- Check: Is API call returning? (check Network tab)
- Fix: Add error logging, check promise chain
```

---

## Files You May Need to Edit

| File | Purpose | When |
|------|---------|------|
| `backend/models/User.js` | User schema | When adding role field |
| `backend/models/Building.js` | Building schema | Phase 3 |
| `backend/models/Apartment.js` | Apartment schema | Phase 4 |
| `backend/models/Issue.js` | Issue schema | Phase 6 |
| `backend/index.js` | Main API routes | Every phase |
| `frontend/src/App.js` | Routing logic | Phase 2 |
| `frontend/src/TenantDashboard.js` | Tenant UI | Phase 2 |
| `frontend/src/ManagerDashboard.js` | Manager UI | Phase 3 |
| `frontend/src/DirectorDashboard.js` | Director UI | Phase 3 |
| `frontend/src/AssociateDashboard.js` | Associate UI | Phase 2 |

---

## Success Criteria for Each Phase

Phase is COMPLETE when:
1. ✅ All tests in TESTING_REQUIREMENTS.md pass
2. ✅ Code passes CODE_QUALITY_STANDARDS.md
3. ✅ Feature works in browser (manual test)
4. ✅ No breaking changes to previous phases
5. ✅ Documentation updated

THEN move to next phase.

