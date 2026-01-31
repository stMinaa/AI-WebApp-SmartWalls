# Testing Requirements

Run these tests after EVERY feature addition. Feature is NOT complete until all tests pass.

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

