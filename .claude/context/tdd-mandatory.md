# TDD Workflow (Non-Negotiable)

**Source:** Extracted from `docs/workflow/DEVELOPMENT.md`

---

## 🚨 CORE TDD RULES (MANDATORY)

### Rule 1: Tests First, Always
- **NEVER modify production code before:**
  - Discovering all existing tests
  - Identifying which tests are failing
- **NO EXCEPTIONS**

### Rule 2: Missing Behavior = Write Test First
- If required behavior is missing:
  - FIRST propose or write tests
  - DO NOT implement code yet

### Rule 3: Only Implement What Tests Require
- ONLY implement behavior required by failing tests
- Do not add speculative or defensive logic
- Do not introduce untested behavior

### Rule 4: Assume Continuous Testing
- Assume tests are executed after every change:
  - Red tests → fix only what is failing
  - Green tests → do not add behavior

### Rule 5: Refactor Only When Green
- Refactoring allowed ONLY when:
  - All tests pass
  - No behavior changes

---

## 🔴 RED PHASE: Write Failing Tests

### Step 1: Discover Existing Tests
```bash
# Location: backend/test/ folder
npm test

# Document:
- Existing tests: [list files]
- Passing tests: [count]
- Failing tests: [list specific failures]
```

### Step 2: Write Tests for Missing Behavior
```javascript
// Example: test/auth.test.js
describe('User Signup with Role', () => {
  it('should accept role parameter and set status', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ 
        username: 'test', 
        email: 'test@test.com', 
        password: 'pass123', 
        role: 'MANAGER' 
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('MANAGER');
    expect(response.body.user.status).toBe('pending');
  });
});
```

### Step 3: Verify Tests Fail (Correctly)
```bash
npm test
# ✅ Test fails (expected - feature not implemented)
# ✅ Test fails for correct reason (not random error)
```

### RED Commit (Optional)
```bash
git add test/
git commit -m "[RED] Add tests for user role system
- Tests: test/auth.test.js
- Expected: Tests fail - feature not implemented yet"
```

---

## 🟢 GREEN PHASE: Minimal Implementation

### Step 4: Update Schema (Minimal)
```javascript
// backend/models/User.js
// ONLY add what's needed to pass tests

role: {
  type: String,
  enum: ['TENANT', 'MANAGER', 'DIRECTOR', 'ASSOCIATE', 'ADMIN'],
  default: 'TENANT'
},
status: {
  type: String,
  enum: ['active', 'pending', 'rejected'],
  default: 'pending'
}
```

### Step 5: Implement Endpoint (Minimal)
```javascript
// backend/routes/auth.js or index.js
// ONLY implement what tests require

app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;
  
  // Existing validation...
  
  const user = new User({
    username,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role: role || 'TENANT',           // NEW
    status: (role === 'MANAGER' || role === 'ASSOCIATE') 
      ? 'pending' 
      : 'active'                       // NEW
  });
  
  // Rest of existing code...
});
```

### Step 6: Run Tests - Verify Pass
```bash
npm test

# Expected:
# ✅ Previously failing tests now PASS
# ✅ All existing tests still PASS
# ✅ No new failures
```

### Step 7: Verify System Connectivity
```bash
# 1. Backend starts
cd backend
node index.js
# ✅ No errors
# ✅ "MONGO RUNNING" message

# 2. Frontend compiles
cd frontend
npm start
# ✅ No compilation errors
# ✅ Browser opens without errors

# 3. Test flow manually
# ✅ Try signup, login, fetch user
# ✅ Check browser console (no errors)
# ✅ Check backend terminal (requests logged)
```

### GREEN Commit (Required)
```bash
git add backend/ test/
git commit -m "[GREEN] Implement role and status in User signup
- Tests: test/auth.test.js (all passing)
- Backend: User schema + signup endpoint updated
- Connectivity: Backend+MongoDB+Frontend verified"
```

---

## 🔵 BLUE PHASE: Refactor (Optional)

### Step 8: Refactor Code (Only if Needed)
**Allowed ONLY when:**
- ✅ All tests passing
- ✅ No behavior change

**Examples:**
- Extract repeated code into functions
- Rename variables for clarity
- Reorganize file structure
- Add JSDoc comments
- Remove dead code

### Verify After Refactoring
```bash
npm test
# ✅ All tests still passing
# ✅ Backend boots successfully
# ✅ Frontend compiles
```

### BLUE Commit (If refactored)
```bash
git add backend/
git commit -m "[BLUE] Refactor user validation into helper function
- Tests: All passing
- No behavior change
- Improved: Code readability"
```

---

## 🚨 AUTONOMOUS COMMIT RULES

**You may ONLY commit autonomously if ALL are met:**

1. ✅ Test suite passes (`npm test`)
2. ✅ All TDD rules respected
3. ✅ Backend boots successfully
4. ✅ MongoDB Atlas connection confirmed
5. ✅ Frontend can reach backend
6. ✅ CodeScene score ≥ 9.0
7. ✅ Commit represents exactly ONE TDD step (RED/GREEN/BLUE)

**If ANY condition unmet:** STOP and ask for guidance.

---

## Commit Message Format

```
[RED/GREEN/BLUE] Brief description

- Tests: [list test files]
- Behavior: [what was tested/implemented]
- Connectivity: [verification status]

Examples:

[RED] Add tests for building creation
- Tests: test/buildings.test.js
- Expected: Tests fail (feature not implemented)

[GREEN] Implement POST /api/buildings endpoint
- Tests: test/buildings.test.js (all passing)
- Connectivity: Backend+MongoDB verified
- Behavior: Directors can create buildings

[BLUE] Extract building validation into service
- Tests: All passing
- No behavior change
- Improved: Separation of concerns
```

---

## Testing & Iteration Process

**For every iteration, state:**

```
- Existing tests: [list or "none found"]
- Failing tests: [specific failures]
- Missing tests: [what needs testing]
- Connectivity:
  - Backend ↔ MongoDB: [✅/❌]
  - Frontend ↔ Backend: [✅/❌]
- CodeScene: [score/hotspots]
- Decision: [RED/GREEN/BLUE]
- Change: [what was done]
- Outcome: [expected result]
```

**Make ONE logical change per iteration.**

---

## Strict Prohibitions

### NEVER:
- ❌ Commit failing tests (except RED-phase test-only commits)
- ❌ Mix tests and implementation in one commit
- ❌ Touch MongoDB Atlas in unit tests
- ❌ Add debug logs or commented-out code
- ❌ Hardcode credentials or secrets
- ❌ Silence or ignore errors
- ❌ Skip connectivity verification
- ❌ Commit without CodeScene check

---

## Before Starting ANY Feature

1. **Discover** existing tests in test/ folder
2. **Read** phase description in ROLES.md
3. **Read** test specs in TESTING.md
4. **Plan** tests needed
5. **Verify** connectivity chain

---

*This is the ONLY accepted workflow. No shortcuts, no exceptions.*
