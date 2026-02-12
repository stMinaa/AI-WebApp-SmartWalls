# Testing Requirements

Run these tests after EVERY feature addition. Feature is NOT complete until all tests pass.

## CRITICAL: Always Check Terminals for Errors/Warnings

**BEFORE committing ANY code:**
1. Check frontend terminal for compilation errors/warnings
2. Check backend terminal for runtime errors
3. Run `npm test` in both frontend and backend
4. Verify no ESLint errors in VS Code Problems panel

**Never commit if:**
- ❌ Terminal shows compilation errors
- ❌ Terminal shows webpack errors
- ❌ Any tests are failing
- ❌ ESLint shows errors

## CRITICAL: Test API Calls Immediately After Changes

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
- ✅ Check browser console for GET /api/buildings response
- ✅ Check backend terminal shows "GET /api/buildings - User: direktor"
- ✅ Try creating a building and verify POST /api/buildings works
- ✅ Confirm new building appears in the list

**Don't just write code - VERIFY it works immediately!**

---

## Phase 1: Role Field Tests

### Setup
```bash
# Clear database
db.users.deleteMany({})

# Start backend
cd backend
node index.js

# In another terminal, run tests manually or use API client
```

### Test 1.1: New User Gets Tenant Role
```
POST /api/auth/signup
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}

Expected Response:
{
  "success": true,
  "message": "User created",
  "data": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "TENANT"  ← MUST BE HERE
  }
}

Expected Database:
- User.role === "TENANT"
```

**Status: ⏳ Not Started**

---

### Test 1.2: Login Returns Role Field
```
POST /api/auth/login
{
  "username": "testuser",
  "password": "password123"
}

Expected Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "...",
    "user": {
      "id": "...",
      "username": "testuser",
      "role": "TENANT"  ← MUST BE HERE
    }
  }
}
```

**Status: ⏳ Not Started**

---

### Test 1.3: GET /api/auth/me Returns Role Field
```
GET /api/auth/me
Authorization: Bearer <token>

Expected Response:
{
  "success": true,
  "data": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "TENANT"  ← MUST BE HERE
  }
}
```

**Status: ⏳ Not Started**

---

### Test 1.4: Frontend App.js Shows Role
```
After Login:
- Verify localStorage contains role field
- Check: localStorage.getItem('user')
- Should include: "role": "TENANT"
```

**Status: ⏳ Not Started**

---

### Test 1.5: All Existing Tests Still Pass
```
✅ Signup still works
✅ Login still works
✅ Logout still works
✅ Token persistence works
✅ Password hashing works
✅ Duplicate user prevention works
✅ Invalid input validation works
```

**Status: ⏳ Not Started**

---

## Phase 2: Role-Based Routing Tests

### Test 2.1: Tenant Sees Tenant Dashboard
```
After login with TENANT user:
- Should navigate to TenantDashboard component
- Should NOT see manager/director/associate options
- Should see "Report Issue" button
```

**Status: ⏳ Not Started**

---

### Test 2.2: Manager Sees Manager Dashboard
```
After login with MANAGER user:
- Should navigate to ManagerDashboard component
- Should see "Manage Building" options
- Should NOT see director-only features
```

**Status: ⏳ Not Started**

---

### Test 2.3: Director Sees Director Dashboard
```
After login with DIRECTOR user:
- Should navigate to DirectorDashboard component
- Should see "Create Building" button
- Should see statistics/overview
```

**Status: ⏳ Not Started**

---

### Test 2.4: Cannot Access Other Role's Dashboard
```
Test Scenario:
1. Login as TENANT
2. Try to manually navigate to /dashboard/manager (if routed)
3. Should be denied or redirected to TenantDashboard

Verify:
- Role checks prevent unauthorized access
- LocalStorage role matches current user
```

**Status: ⏳ Not Started**

---

## Phase 3: Building Management Tests

### Test 3.1: Director Can Create Building
```
POST /api/buildings
Authorization: Bearer <director-token>
{
  "name": "Downtown Tower",
  "address": "123 Main St"
}

Expected Response (201):
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Downtown Tower",
    "address": "123 Main St",
    "managerId": null
  }
}

Check Database:
- Building created
- Building.createdAt exists
```

**Status: ⏳ Not Started**

---

### Test 3.2: Non-Director Cannot Create Building
```
POST /api/buildings
Authorization: Bearer <tenant-token>
{
  "name": "Downtown Tower",
  "address": "123 Main St"
}

Expected Response (403):
{
  "success": false,
  "message": "Only directors can create buildings"
}

Verify:
- Building NOT created in database
```

**Status: ⏳ Not Started**

---

### Test 3.3: Director Can List All Buildings
```
GET /api/buildings
Authorization: Bearer <director-token>

Expected Response (200):
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Downtown Tower",
      "address": "123 Main St",
      "managerId": null
    },
    ...
  ]
}
```

**Status: ⏳ Not Started**

---

### Test 3.4: Can Assign Manager to Building
```
PATCH /api/buildings/:id/manager
Authorization: Bearer <director-token>
{
  "managerId": "<manager-user-id>"
}

Expected Response (200):
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Downtown Tower",
    "managerId": "<manager-user-id>"
  }
}

Verify:
- Manager role user is assigned
- Manager can now access building
```

**Status: ⏳ Not Started**

---

## Phase 1.5-1.6: Issue Management Tests

### Test: Filter Issues by Priority
```
1. Login as director
2. Navigate to "Kvarovi" tab
3. Select "Visok" from priority filter dropdown
4. Verify table shows only high priority issues
5. Select "Srednji" - verify only medium priority issues shown
6. Select "Svi prioriteti" - verify all issues shown
```

### Test: Filter Issues by Status
```
1. Login as director
2. Navigate to "Kvarovi" tab
3. Select "Otvoren" from status filter dropdown
4. Verify table shows only open issues
5. Select "Dodeljen" - verify only assigned issues shown
6. Select "Svi statusi" - verify all issues shown
```

### Test: Combined Filters
```
1. Login as director
2. Navigate to "Kvarovi" tab
3. Select "Visok" priority and "Otvoren" status
4. Verify table shows only high priority open issues
5. Change priority to "Svi prioriteti"
6. Verify table shows all open issues (status filter still active)
```

### Test: Assign Issue via Dropdown
```
POST login as director to get token

GET /api/issues
- Verify returns all issues with populated fields

Click "Dodeli" button on an issue
- Verify modal opens
- Verify dropdown shows all active associates
- Verify format: "FirstName LastName (email@example.com)"

Select an associate from dropdown
Expected:
- PATCH /api/issues/:id/assign with correct associateId
- Issue status changes to "assigned" (if was "open")
- Issue assignedTo field updates
- Table immediately reflects changes
- Modal closes
```

### Test: Remove Issue Assignment
```
1. Login as director
2. Find an already-assigned issue in "Kvarovi" tab
3. Click "Dodeli" button
4. Select "-- Bez dodele --" option from dropdown
5. Verify:
   - PATCH /api/issues/:id/assign with null
   - Issue status changes to "open"
   - Issue assignedTo field clears
   - Table shows "Nedodeljen" in Dodeljen column
```

### Test: Inline Priority Change
```
1. Login as director
2. Navigate to "Kvarovi" tab
3. Click priority dropdown in table row
4. Select different priority
5. Verify:
   - PATCH /api/issues/:id/triage called
   - Priority updates immediately (no page refresh)
   - No errors in console
```

**Status: ⏳ Not Started**

---

## Code Quality Checks (Run Before Declaring Feature Complete)

### Backend Code Quality
```
✅ No console.log() left in code
✅ All error handling uses try/catch
✅ Database queries use proper error handling
✅ Response format consistent (success, message, data)
✅ All inputs validated
✅ No hardcoded values/magic numbers
✅ Functions under 50 lines
✅ Comments for complex logic
✅ Variable names are clear (camelCase)
```

### Frontend Code Quality
```
✅ No console errors in browser DevTools
✅ No console.log() in production code
✅ State properly initialized
✅ useEffect has proper dependencies
✅ Error handling in async calls
✅ Loading state managed
✅ Responsive to small screens
```

### Database Quality
```
✅ Schema has timestamps
✅ Required fields marked
✅ Indexes on frequently queried fields
✅ No orphaned records
✅ Data types correct
```

---

## How to Use This File

1. Before starting a phase, read its tests
2. After implementing feature, run each test
3. Mark test as ✅ PASSING or ❌ FAILING
4. If failing, fix code, re-test
5. Once all tests pass, move to next phase
6. Never skip a phase
7. Never ignore a failing test

---

*Last updated: February 2026*
