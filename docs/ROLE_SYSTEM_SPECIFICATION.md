# Role System Specification - Complete Tenant Management System

This specification matches the full requirements for the Tenant Management System, broken down into manageable phases.

---

## 🎯 System Overview

### User Roles
- **TENANT** - Reports issues, views bulletin board, votes on polls
- **MANAGER** - Manages buildings, apartments, tenants, issue triage, posts notices/polls
- **DIRECTOR** - Creates buildings, assigns managers, approves staff, assigns issues to associates
- **ASSOCIATE** - Views assigned jobs, accepts with cost, completes work
- **ADMIN** - Placeholder (not implemented yet)

### Authentication Flow
- No auto-login (token not persisted across sessions)
- After login → lands on **Profile page**
- Logout clears token and returns to public Home

### Status System
- **active** - Can use system
- **pending** - Awaiting approval (manager/associate only)
- **rejected** - Denied access
- Tenants auto-approve on signup; manager/associate require director approval

---

## 📋 Phase Breakdown (14 Phases)

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Basic Auth (login/signup) | ✅ DONE |
| 1 | Role Field & Status System | ⏳ NEXT |
| 2 | Profile Landing & Role-Based Routing | ⬜ After Phase 1 |
| 3 | Building Management (Director) | ⬜ After Phase 2 |
| 4 | Apartment Management (Bulk & Single) | ⬜ After Phase 3 |
| 5 | Manager Assignment | ⬜ After Phase 4 |
| 6 | Tenant Management & Assignment | ⬜ After Phase 5 |
| 7 | Issue Reporting (Tenant) | ⬜ After Phase 6 |
| 8 | Issue Triage (Manager) | ⬜ After Phase 7 |
| 9 | Issue Assignment (Director) | ⬜ After Phase 8 |
| 10 | Job Management (Associate) | ⬜ After Phase 9 |
| 11 | Staff Approvals (Director) | ⬜ After Phase 10 |
| 12 | Notices & Bulletin Board | ⬜ After Phase 11 |
| 13 | Polls System | ⬜ After Phase 12 |
| 14 | ETA & Advanced Features | ⬜ After Phase 13 |

---

## Phase 1: Role Field & Status System

### Backend Changes

#### Update User Schema (`backend/models/User.js`)
Add these fields:
```javascript
role: {
  type: String,
  enum: ['TENANT', 'MANAGER', 'DIRECTOR', 'ASSOCIATE', 'ADMIN'],
  default: 'TENANT'
},
status: {
  type: String,
  enum: ['active', 'pending', 'rejected'],
  default: 'active'
},
mobile: String,

// For tenants
building: { type: ObjectId, ref: 'Building' },
apartment: { type: ObjectId, ref: 'Apartment' },
debt: { type: Number, default: 0 },

// For managers
managedBuildings: [{ type: ObjectId, ref: 'Building' }],

// For associates
specialties: [String],
description: String,
website: String,
serviceAreas: [String],
yearsExperience: Number,
company: String
```

#### Update Signup (`backend/index.js`)
```javascript
POST /api/auth/register

Logic changes:
1. Accept optional 'role' in request body
2. If role is TENANT or not provided → status = 'active'
3. If role is MANAGER or ASSOCIATE → status = 'pending'
4. If role is DIRECTOR → status = 'active' (for bootstrapping)
5. Return role and status in response
```

#### Update Login & Me
Both must return role and status fields

### Frontend Changes

#### Update Signup.js
- Add role dropdown (TENANT, MANAGER, ASSOCIATE, DIRECTOR)
- Show message if manager/associate selected: "Account requires director approval"

#### Update App.js
- Store role in state
- Store role in localStorage

### Success Criteria
- ✅ Tenant signup → role='TENANT', status='active'
- ✅ Manager signup → role='MANAGER', status='pending'
- ✅ Associate signup → role='ASSOCIATE', status='pending'
- ✅ Login returns role and status
- ✅ Frontend displays role

---

## Phase 2: Profile Landing & Role-Based Routing

### Frontend Changes Only

#### Update App.js
- After login → setActiveTab('profile'), NOT 'home'
- Create Dashboard component wrapper
- No auto-login (token only in state, not localStorage)

#### Create Dashboard.js
```javascript
Props: user, role, activeTab, onNavigate, onLogout

If activeTab === 'profile' → render ProfileEditor
If activeTab === 'home' → render CompanyHome (shared)
Otherwise → render role-specific dashboard
```

#### Create TopNav.js
```javascript
Tabs based on role:
- TENANT: Home, Issues, Bulletin Board
- MANAGER: Home, Buildings
- DIRECTOR: Home, Buildings, Managers, Associates, Approvals, Issues
- ASSOCIATE: Home, Jobs
- ADMIN: Home

Plus: Profile button (top right), Logout button
```

#### Create Placeholder Dashboards
- TenantDashboard.js
- ManagerDashboard.js
- DirectorDashboard.js
- AssociateDashboard.js
- AdminDashboard.js
- CompanyHome.js (shared)

### Success Criteria
- ✅ After login → lands on Profile page
- ✅ Correct tabs shown for each role
- ✅ Profile button works
- ✅ Logout works
- ✅ No auto-login on refresh

---

## Phase 3: Building Management (Director)

### Backend Changes

#### Create Building Model (`backend/models/Building.js`)
```javascript
{
  name: String,
  address: String (required),
  imageUrl: String,
  manager: { type: ObjectId, ref: 'User' },
  director: { type: ObjectId, ref: 'User' },
  createdAt, updatedAt
}
```

#### Create Endpoints
```javascript
POST /api/buildings (director only)
GET /api/buildings (director only) - include apartmentCount
GET /api/buildings/managed (manager only)
```

### Frontend Changes
- Update DirectorDashboard with Building tab
- Create building form
- Display building cards

### Success Criteria
- ✅ Director can create building
- ✅ Director sees all buildings
- ✅ Non-director gets 403

---

## Phase 4: Apartment Management

### Backend Changes

#### Create Apartment Model
```javascript
{
  unitNumber: String (required),
  building: ObjectId (required),
  address: String,
  tenant: ObjectId (nullable),
  numPeople: Number,
  floor: Number,
  createdAt, updatedAt
}
```

#### Create Endpoints
```javascript
POST /api/buildings/:id/apartments/bulk (manager/director)
- Only if building.apartmentCount === 0
- Supports:
  1. Simple: { floors: 3, unitsPerFloor: 4 }
  2. Advanced: { floorsSpec: "3,4,5" }

POST /api/buildings/:id/apartments (manager/director)
GET /api/buildings/:id/apartments (manager/director)
```

### Success Criteria
- ✅ Bulk create works (empty buildings only)
- ✅ Simple replication works
- ✅ Advanced spec works
- ✅ Single apartment creation works

---

## Phase 5: Manager Assignment

### Backend Changes
```javascript
PATCH /api/buildings/:id/assign-manager (director only)
GET /api/managers (director only) - with load (# buildings)
```

### Frontend Changes
- Director can assign manager to building
- Manager list shows load

### Success Criteria
- ✅ Director assigns manager
- ✅ Manager sees managed buildings
- ✅ Manager list sorted by load

---

## Phase 6: Tenant Management

### Backend Changes
```javascript
GET /api/buildings/:id/tenants (manager)
GET /api/tenants/pending (manager)
POST /api/tenants/:id/assign (manager)
POST /api/tenants/:id/approve (manager)
DELETE /api/tenants/:id (manager)
```

### Success Criteria
- ✅ Manager assigns tenant to apartment
- ✅ Manager approves pending tenant
- ✅ Manager removes tenant

---

## Phase 7: Issue Reporting (Tenant)

### Backend Changes

#### Create Issue Model
```javascript
{
  tenant: ObjectId (required),
  title: String (required),
  description: String,
  urgency: enum ['urgent', 'not urgent'],
  status: enum ['reported', 'forwarded', 'assigned', 'in progress', 'resolved', 'rejected'],
  assignee: String (username),
  cost: Number,
  eta: Date,
  etaAckByTenant: Boolean,
  history: [{ by, action, note, at }],
  building: ObjectId,
  createdAt, updatedAt
}
```

#### Create Endpoints
```javascript
POST /api/issues (tenant only)
GET /api/issues/my (tenant only)
```

### Success Criteria
- ✅ Tenant reports issue
- ✅ Tenant views own issues

---

## Phase 8: Issue Triage (Manager)

### Backend Changes
```javascript
GET /api/issues (manager) - issues in managed buildings
POST /api/issues/:id/status (manager)
- Actions: forward, assign, reject
```

### Success Criteria
- ✅ Manager forwards to director
- ✅ Manager assigns to associate
- ✅ Manager rejects issue

---

## Phase 9: Issue Assignment (Director)

### Backend Changes
```javascript
GET /api/issues (director) - all issues
POST /api/issues/:id/status (director)
- Actions: assign, reject
GET /api/associates (director) - active associates
```

### Success Criteria
- ✅ Director assigns to associate
- ✅ Director rejects issue

---

## Phase 10: Job Management (Associate)

### Backend Changes
```javascript
GET /api/issues/assigned-to-me (associate only)
POST /api/issues/:id/status (associate only)
- Actions: accept (with cost), reject, resolve
```

### Logic
- Accept → status='in progress', tenant.debt += cost
- Resolve → status='resolved'

### Success Criteria
- ✅ Associate accepts with cost
- ✅ Tenant debt increases
- ✅ Associate completes job

---

## Phase 11: Staff Approvals (Director)

### Backend Changes
```javascript
GET /api/pending/staff (director only)
POST /api/users/:id/approve (director only)
POST /api/users/:id/reject (director only)
DELETE /api/users/:id (director only)
```

### Success Criteria
- ✅ Director approves pending staff
- ✅ Approved staff can login
- ✅ Rejected staff get 403

---

## Phase 12: Notices & Bulletin Board

### Backend Changes

#### Create Notice Model
```javascript
{
  building: ObjectId,
  content: String,
  author: ObjectId,
  authorName: String,
  authorRole: String,
  createdAt,
  expiresAt,
  type: enum ['general', 'service', 'elevator', 'delivery'],
  priority: enum ['low', 'medium', 'high'],
  readBy: [ObjectId]
}
```

#### Create Endpoints
```javascript
GET /api/buildings/:id/notices (tenant/manager)
POST /api/buildings/:id/notices (manager only)
DELETE /api/notices/:id (manager only)
POST /api/notices/:id/read (tenant only)
```

### Success Criteria
- ✅ Manager posts notice
- ✅ Tenant views notices
- ✅ Manager notices have outline styling

---

## Phase 13: Polls System

### Backend Changes

#### Create Poll Model
```javascript
{
  building: ObjectId,
  question: String,
  options: [String],
  votes: [{ option, voter }],
  createdBy: ObjectId,
  closedAt: Date,
  createdAt
}
```

#### Create Endpoints
```javascript
GET /api/buildings/:id/polls (tenant/manager)
POST /api/buildings/:id/polls (manager only)
POST /api/polls/:id/vote (tenant only)
POST /api/polls/:id/close (manager only)
GET /api/polls/:id/results (tenant/manager)
```

### Success Criteria
- ✅ Manager creates poll
- ✅ Tenant votes
- ✅ Manager closes poll
- ✅ Results show percentages

---

## Phase 14: ETA & Advanced Features

### Backend Changes
```javascript
POST /api/issues/:id/eta (manager only)
POST /api/issues/:id/eta-ack (tenant only)
PATCH /api/auth/me - update apartment.numPeople
```

### Success Criteria
- ✅ Manager sets ETA
- ✅ Tenant acknowledges ETA
- ✅ Tenant sets household size

---

## Authorization Matrix

| Action | Tenant | Manager | Director | Associate |
|--------|--------|---------|----------|-----------|
| Report issues | ✅ | ❌ | ❌ | ❌ |
| Triage issues | ❌ | ✅ | ❌ | ❌ |
| Assign to associate | ❌ | ✅ | ✅ | ❌ |
| Accept job | ❌ | ❌ | ❌ | ✅ |
| Create building | ❌ | ❌ | ✅ | ❌ |
| Bulk apartments | ❌ | ✅ | ✅ | ❌ |
| Assign manager | ❌ | ❌ | ✅ | ❌ |
| Manage tenants | ❌ | ✅ | ❌ | ❌ |
| Approve staff | ❌ | ❌ | ✅ | ❌ |
| Post notice | ❌ | ✅ | ❌ | ❌ |
| Create poll | ❌ | ✅ | ❌ | ❌ |
| Vote on poll | ✅ | ❌ | ❌ | ❌ |

---

## Development Rules

1. **One Phase at a Time** - Complete current phase before next
2. **All Tests Pass** - Run TESTING_REQUIREMENTS.md tests
3. **Code Quality** - Check CODE_QUALITY_STANDARDS.md
4. **No Breaking Changes** - Previous phases must work
5. **Update Progress** - Mark phases ✅ DONE when complete

