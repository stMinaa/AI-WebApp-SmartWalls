# Testing Checklist

**Source:** Extracted from `docs/workflow/TESTING.md`

---

## 🚨 CRITICAL: Test API Calls Immediately

**AFTER making ANY code change (don't wait for commits):**

1. **Identify affected endpoints** - Which API routes does your change touch?
2. **Test those endpoints immediately:**
   - Use browser (for GET requests - check Network tab)
   - Use console.log to verify request/response data
   - Check backend terminal logs for incoming requests
   - Verify database changes if applicable
3. **Check both frontend AND backend terminals** for errors
4. **Verify the full request/response cycle works** before moving on

**Example: After modifying DirectorDashboard buildings UI:**
- ✅ Refresh browser and click "Zgrade" tab
- ✅ Check browser console for `GET /api/buildings` response
- ✅ Check backend terminal shows "GET /api/buildings - User: direktor"
- ✅ Try creating a building and verify `POST /api/buildings` works
- ✅ Confirm new building appears in the list

**Don't just write code - VERIFY it works immediately!**

---

## Before EVERY Commit

### 1. Check Terminals for Errors/Warnings

**Frontend Terminal:**
- ❌ No compilation errors
- ❌ No webpack errors
- ❌ No React warnings

**Backend Terminal:**
- ❌ No runtime errors
- ❌ No MongoDB connection errors
- ❌ No unhandled promise rejections

**VS Code Problems Panel:**
- ❌ No ESLint errors in project files
- ✅ Node_modules errors can be ignored

**Never commit if ANY terminal shows errors.**

---

### 2. Run All Tests

```bash
cd backend
npm test

# Expected: All tests passing
# Example: Jest: 117 tests passing
```

**If tests fail:**
- Read error message carefully
- Fix the failing test or code
- Run tests again
- Do NOT commit until all green

---

### 3. Manual Testing Checklist

**For EVERY feature:**

#### Happy Path (Everything Works)
- ✅ User provides valid inputs
- ✅ Request succeeds
- ✅ Data saved to database
- ✅ Response returned correctly
- ✅ UI updates as expected

#### Empty Inputs (No Data Provided)
- ✅ User submits empty form
- ✅ Backend returns validation error
- ✅ Frontend shows error message
- ✅ No database changes

#### Invalid Inputs (Wrong Type/Format)
- ✅ User provides wrong data type (string instead of number)
- ✅ User provides invalid format (bad email)
- ✅ Backend validates and rejects
- ✅ Frontend shows appropriate error

#### Edge Cases (Min/Max Values)
- ✅ Test minimum values (0, empty arrays)
- ✅ Test maximum values (very long strings)
- ✅ Test boundary conditions

#### Error Scenarios (System Failures)
- ✅ Database unavailable (simulate)
- ✅ Network error (disconnect)
- ✅ Unauthorized access (wrong token)
- ✅ System degrades gracefully

---

### 4. Console Checks

**Browser Console:**
- ❌ No error messages
- ❌ No warning messages
- ❌ No 404 errors for resources
- ❌ No CORS errors

**Backend Terminal:**
- ❌ No `console.log()` left in code
- ❌ No error stack traces
- ❌ No unhandled promise rejections

---

### 5. CodeScene Quality Check

```bash
cd backend
cs delta --staged

# MUST see:
# - Score ≥ 9.0
# - No red flags in production code
# - Review hotspots
```

**If score < 9.0:**
- Refactor complex functions
- Extract helpers
- Reduce nesting
- Run CodeScene again

---

## Test Coverage Requirements

### Backend Tests

**Location:** `backend/test/`

**Coverage:** All critical paths

#### Authentication Tests
```javascript
describe('POST /api/auth/signup', () => {
  it('should create user with role and status', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'MANAGER'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('MANAGER');
    expect(response.body.user.status).toBe('pending');
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await User.create({
      username: 'existing',
      email: 'existing@example.com',
      password: 'pass123'
    });

    // Try to create duplicate
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'existing',
        email: 'new@example.com',
        password: 'pass456'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already exists');
  });
});
```

#### Building Tests
```javascript
describe('POST /api/buildings', () => {
  it('should allow director to create building', async () => {
    const director = await User.create({
      username: 'director',
      email: 'director@example.com',
      password: 'pass123',
      role: 'DIRECTOR',
      status: 'active'
    });

    const token = jwt.sign({ userId: director._id }, process.env.JWT_SECRET);

    const response = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Building A',
        address: '123 Main St'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Building A');
  });

  it('should reject non-director', async () => {
    const tenant = await User.create({
      username: 'tenant',
      email: 'tenant@example.com',
      password: 'pass123',
      role: 'TENANT',
      status: 'active'
    });

    const token = jwt.sign({ userId: tenant._id }, process.env.JWT_SECRET);

    const response = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Building A',
        address: '123 Main St'
      });

    expect(response.status).toBe(403);
  });
});
```

#### Issue Workflow Tests
```javascript
describe('Issue Lifecycle', () => {
  it('should allow tenant to report, manager to forward, director to assign', async () => {
    // Setup users and building
    const tenant = await createTenant();
    const manager = await createManager();
    const director = await createDirector();
    const associate = await createAssociate();
    const building = await createBuilding(director._id, manager._id);
    await assignTenantToApartment(tenant._id, building._id);

    // 1. Tenant reports issue
    const reportResponse = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        title: 'Broken elevator',
        description: 'Not working',
        urgency: 'urgent'
      });

    expect(reportResponse.status).toBe(201);
    expect(reportResponse.body.data.status).toBe('reported');
    const issueId = reportResponse.body.data.id;

    // 2. Manager forwards to director
    const forwardResponse = await request(app)
      .patch(`/api/issues/${issueId}/triage`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        action: 'forward',
        note: 'Needs director approval'
      });

    expect(forwardResponse.status).toBe(200);
    expect(forwardResponse.body.data.status).toBe('forwarded');

    // 3. Director assigns to associate
    const assignResponse = await request(app)
      .patch(`/api/issues/${issueId}/assign`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({
        associateId: associate._id,
        note: 'Fix ASAP'
      });

    expect(assignResponse.status).toBe(200);
    expect(assignResponse.body.data.status).toBe('assigned');
  });
});
```

---

## System Connectivity Tests

### Before Committing - Verify Full Chain

#### 1. Backend Starts Successfully
```bash
cd backend
node index.js

# Expected output:
# MONGO RUNNING - Connected to MongoDB
# Server listening on port 5000
```

**Verify:**
- ✅ No errors on startup
- ✅ MongoDB connection message appears
- ✅ Server listening message appears

---

#### 2. Backend ↔ MongoDB Atlas Connectivity
```bash
# Check MongoDB connection in backend logs:
# "MONGO RUNNING - Connected to MongoDB"

# Or test with a health check:
curl http://localhost:5000/api/health
```

**Verify:**
- ✅ Database connection succeeds
- ✅ No connection errors or retries
- ✅ Can read/write to database

---

#### 3. Frontend ↔ Backend Connectivity
```bash
cd frontend
npm start

# Opens http://localhost:3000
```

**Verify in browser:**
- ✅ Frontend compiles successfully
- ✅ No CORS errors in console
- ✅ Can reach backend (try login/signup)
- ✅ Network tab shows successful API calls

---

## Testing Phases (By Feature)

### Phase 1: Role Field Tests

**Test 1.1: New User Gets Role**
```
POST /api/auth/signup
{ username, email, password }

Expected: Response includes role: 'TENANT'
```

**Test 1.2: Login Returns Role**
```
POST /api/auth/login
{ username, password }

Expected: Response includes user.role
```

**Test 1.3: GET /api/auth/me Returns Role**
```
GET /api/auth/me
Authorization: Bearer <token>

Expected: Response includes role field
```

**Test 1.4: Frontend Shows Role**
```
After login → localStorage contains role
```

---

### Phase 2: Manager Assignment Tests

**Test 2.1: Director Assigns Manager**
```
PATCH /api/buildings/:id/assign-manager
{ managerId: "..." }

Expected: building.manager updated
```

**Test 2.2: Manager Sees Assigned Buildings**
```
GET /api/buildings/managed

Expected: Only buildings where manager is assigned
```

**Test 2.3: Non-manager Cannot Access**
```
GET /api/buildings/managed (as tenant)

Expected: 403 Forbidden
```

---

### Phase 3: Issue Triage Tests

**Test 3.1: Manager Forwards Issue**
```
PATCH /api/issues/:id/triage
{ action: 'forward', note: '...' }

Expected: status → 'forwarded'
```

**Test 3.2: Director Sees Forwarded Issues**
```
GET /api/issues (as director)

Expected: Only issues with status 'forwarded'
```

**Test 3.3: Tenant Cannot Triage**
```
PATCH /api/issues/:id/triage (as tenant)

Expected: 403 Forbidden
```

---

## Pre-Commit Full Checklist

**Run through this EVERY time before committing:**

- [ ] All tests pass (`npm test`)
- [ ] Backend boots without errors
- [ ] MongoDB connection confirmed
- [ ] Frontend compiles without errors
- [ ] Manual test: can signup/login
- [ ] Manual test: can access protected routes
- [ ] CodeScene score ≥ 9.0
- [ ] No console.log() in production code
- [ ] No ESLint errors
- [ ] Browser console clean (no errors)
- [ ] Backend terminal clean (no errors)
- [ ] TDD phase complete (RED → GREEN → BLUE)

**Only commit when ALL boxes checked.**

---

**Remember:** Testing is not optional. Incomplete testing = incomplete feature.
