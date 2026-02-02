# Building Management System - E2E Test Results

## Test Execution Summary
**Date:** February 2, 2026  
**Status:** ✅ ALL TESTS PASSING  
**Total Tests:** 27  
**Pass Rate:** 100%

---

## Test Phases

### ✅ Phase 1: Authentication (2 tests)
- [x] Director Registration
- [x] Director Login

**Validated:**
- JWT token generation
- Role-based account activation (director active immediately)
- Password hashing and validation
- Login credentials acceptance

---

### ✅ Phase 2: Buildings & Manager Management (6 tests)
- [x] Create Building
- [x] Get All Buildings
- [x] Register Manager
- [x] Get Pending Managers
- [x] Director Approves Manager
- [x] Assign Manager to Building

**Validated:**
- Building creation with floor/apartment specs
- Manager registration (pending status)
- Director approval workflow
- Manager-building assignment
- Authorization checks (director-only operations)

---

### ✅ Phase 3: Apartments & Tenant Management (4 tests)
- [x] Manager Login
- [x] Create Apartment
- [x] Get Apartments in Building
- [x] Register Tenant
- [x] Assign Tenant to Apartment

**Validated:**
- Manager authentication
- Apartment creation under building
- Apartment querying by building
- Tenant registration (active immediately)
- Tenant-apartment assignment

---

### ✅ Phase 4: Issue Reporting & Triage (3 tests)
- [x] Tenant Reports Issue
- [x] Manager Gets Reported Issues
- [x] Manager Forwards Issue to Director

**Validated:**
- Issue creation by tenants
- Issue status tracking (reported → forwarded)
- Manager triage workflow
- Priority levels (high/medium/low)

---

### ✅ Phase 5: Associate Job Workflow (7 tests)
- [x] Register Associate
- [x] Director Approves Associate
- [x] Director Assigns Issue to Associate
- [x] Associate Login
- [x] Associate Gets Assigned Jobs
- [x] Associate Accepts Job (with cost estimate)
- [x] Associate Completes Job

**Validated:**
- Associate registration and approval
- Issue assignment to associate
- Job acceptance with cost estimation
- Job completion workflow
- Status transitions (assigned → in-progress → completed)

---

### ✅ Phase 6: Bulletin Board (5 tests)
- [x] Manager Creates Notice
- [x] Tenant Gets Notices
- [x] Manager Creates Poll
- [x] Tenant Votes on Poll
- [x] Get Poll Results

**Validated:**
- Notice creation and distribution
- Poll creation with multiple options
- Voting mechanism
- Vote tracking and results

---

## API Endpoints Verified

### Authentication
- `POST /api/auth/signup` - User registration with role
- `POST /api/auth/login` - User authentication

### Buildings
- `POST /api/buildings` - Create building (director/manager)
- `GET /api/buildings` - List all buildings
- `PATCH /api/buildings/:id/assign-manager` - Assign manager (director)

### Apartments
- `POST /api/buildings/:buildingId/apartments` - Create apartment (manager)
- `GET /api/buildings/:buildingId/apartments` - List apartments

### Users
- `GET /api/users?role=X&status=Y` - Filter users by role/status
- `PATCH /api/users/:id/approve` - Approve user (director)

### Tenants
- `POST /api/tenants/:id/assign` - Assign tenant to apartment (manager)

### Issues
- `POST /api/issues` - Report issue (tenant)
- `GET /api/issues?status=X` - Get issues by status (manager)
- `PATCH /api/issues/:id/triage` - Triage issue (manager)
- `PATCH /api/issues/:id/assign` - Assign to associate (director)

### Associates
- `GET /api/associates/me/jobs` - Get assigned jobs (associate)
- `POST /api/issues/:id/accept` - Accept job with cost (associate)
- `POST /api/issues/:id/reject` - Reject job (associate)
- `POST /api/issues/:id/complete` - Complete job (associate)

### Bulletin Board
- `POST /api/buildings/:buildingId/notices` - Create notice (manager)
- `GET /api/buildings/:buildingId/notices` - Get notices
- `POST /api/buildings/:buildingId/polls` - Create poll (manager)
- `GET /api/buildings/:buildingId/polls` - Get polls
- `POST /api/polls/:pollId/vote` - Vote on poll (tenant)

---

## Complete Workflow Tested

```
1. DIRECTOR creates building "Zgrada Sunce"
   ↓
2. MANAGER registers (pending status)
   ↓
3. DIRECTOR approves manager
   ↓
4. DIRECTOR assigns manager to building
   ↓
5. MANAGER creates apartment "101"
   ↓
6. TENANT registers (active immediately)
   ↓
7. MANAGER assigns tenant to apartment
   ↓
8. TENANT reports issue "Kvar na grejanju"
   ↓
9. MANAGER forwards issue to director
   ↓
10. ASSOCIATE registers (pending status)
    ↓
11. DIRECTOR approves associate
    ↓
12. DIRECTOR assigns issue to associate
    ↓
13. ASSOCIATE accepts job (estimated cost: 5000 RSD)
    ↓
14. ASSOCIATE completes job
    ↓
15. MANAGER creates notice about lift maintenance
    ↓
16. MANAGER creates poll about renovations
    ↓
17. TENANT views notices and votes on poll
```

---

## Test Data Created

| Entity | ID | Details |
|--------|-----|---------|
| Building | 6980f1e6050c16dd03b4b2f2 | "Test Building" |
| Apartment | 6980f1e8050c16dd03b4b322 | Unit "101" |
| Issue | 6980f1e9050c16dd03b4b330 | "Test Issue" (completed) |
| Director | - | Username: dir* |
| Manager | - | Username: mgr* |
| Tenant | - | Username: ten* |
| Associate | - | Username: asc* |

---

## Known Behaviors

1. **Director accounts** are activated immediately upon registration
2. **Tenant accounts** are activated immediately upon registration  
3. **Manager accounts** require director approval before activation
4. **Associate accounts** require director approval before activation
5. **Issues** follow workflow: reported → forwarded → assigned → in-progress → completed
6. **Polls** accept string options (not indices)
7. **Apartments** require only `unitNumber` field (address inherited from building)

---

## Test Script Location
`run-e2e-tests.ps1`

## How to Run Tests
```powershell
# Start backend
cd backend
node index.js

# Start frontend (in another terminal)
cd frontend
yarn start

# Run E2E tests (in another terminal)
.\run-e2e-tests.ps1
```

---

## Next Steps
- [ ] UI/UX manual testing in browser
- [ ] Serbian language verification
- [ ] Flat design verification
- [ ] Responsive layout testing
- [ ] Form validation testing
- [ ] Error handling verification
