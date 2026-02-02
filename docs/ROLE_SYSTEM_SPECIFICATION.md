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

## 📋 Phase Breakdown (By Role)

### Foundation (Complete)
- ✅ Phase 0: Authentication & User Management
- ✅ Phase 0.1: Role field & status system
- ✅ Phase 0.2: Profile pages & role-based routing

### Phase 1: Director Role (Building the Foundation)
| Sub-Phase | Feature | Status | Dependencies |
|-----------|---------|--------|--------------|
| 1.1 | Create & view buildings | ✅ DONE | None |
| 1.2 | Assign managers to buildings | ✅ DONE | 1.1 |
| 1.3 | View & approve pending managers | ✅ DONE | 1.2 |
| 1.4 | View & approve pending associates | ✅ DONE | 1.3 |
| 1.5 | View all issues (with priority/status filters) | ✅ DONE | Manager 2.5 |
| 1.6 | Assign issues to associates (dropdown) | ✅ DONE | 1.4, 1.5 |

**Phase 1.5-1.6 Details:**
- Directors see only forwarded issues (status: 'forwarded')
- Issues can be filtered by priority (low/medium/high) and status
- Dropdown select for assigning associates (shows name + email)
- Director can reject issues or assign to associates

### Phase 2: Manager Role (Day-to-Day Operations)

**Manager Menu Structure (TopNav):**
- **Profile Tab** - Personal information and settings
- **Buildings Tab** - Main workspace showing all assigned buildings as cards

**Buildings Tab UI (see managerBuildingPage.png reference):**
Each building displays as a card with:
- Building image
- Location (Lokacija): Building name/address  
- Number of apartments (Broj stanova): Auto-calculated count
- 5 action buttons that open specific views for that building:
  1. **Detalji o zgradi** (Building Details) - List of tenants with apartment number, # of people living, debt
  2. **Kvarovi** (Issues) - View and triage tenant-reported issues (forward to director or reject)
  3. **Oglasna tabla** (Bulletin Board) - Create and view notices/announcements
  4. **Ankete** (Polls) - Create polls and view results
  5. **Naplati** (Billing) - Payment and debt management

**IMPORTANT:** Manager has ONLY 2 top-level tabs: Profile and Buildings. All building-specific actions are accessed via buttons on building cards, NOT as separate top-level tabs.

| Sub-Phase | Feature | Status | Dependencies |
|-----------|---------|--------|--------------|
| 2.1 | View assigned buildings | ✅ DONE | Director 1.2 |
| 2.2 | Create apartments (bulk & single) | ✅ DONE | 2.1 |
| 2.3 | View & manage tenants | ✅ DONE | 2.2 |
| 2.4 | Assign tenants to apartments | ✅ DONE | 2.3 |
| 2.5 | View tenant-reported issues | ✅ DONE | Tenant 3.2 |
| 2.6 | Triage issues (assign/forward/reject) | ✅ DONE | 2.5 |
| 2.7 | Create notices (bulletin board) | ✅ DONE | 2.1 |
| 2.8 | Create polls | ✅ DONE | 2.1 |

### Phase 3: Tenant Role (Resident Experience)
| Sub-Phase | Feature | Status | Dependencies |
|-----------|---------|--------|--------------|
| 3.1 | View apartment & building info | ✅ DONE | Manager 2.4 |
| 3.2 | Report issues | ✅ DONE | 3.1 |
| 3.3 | View their reported issues | ✅ DONE | 3.2 |
| 3.4 | View bulletin board (notices) | ✅ DONE | Manager 2.7 |
| 3.5 | Vote on polls | ✅ DONE | Manager 2.8 |

### Phase 4: Associate Role (Issue Resolution)
| Sub-Phase | Feature | Status | Dependencies |
|-----------|---------|--------|--------------|
| 4.1 | View assigned jobs | ✅ DONE | Director 1.6 |
| 4.2 | Accept job with cost estimate | ✅ DONE | 4.1 |
| 4.3 | Mark job as complete | ⬜ TODO | 4.2 |

---

## 🔄 Data Flow Diagrams

### Issue Lifecycle (Complete Flow)
```
1. TENANT creates issue
   ↓ (status: 'reported')
   
2. MANAGER sees issue in their building
   ↓ Decides one of three actions:
   
   2a. Forward to director (status: 'forwarded')
       ↓
       3. DIRECTOR sees forwarded issue
          ↓ Decides:
          - Assign to associate (status: 'assigned')
          - Reject (status: 'rejected')
   
   2b. Assign to associate directly (status: 'assigned')
       ↓
       4. ASSOCIATE sees assigned job
          ↓
          5. Associate accepts job (status: 'in-progress')
          ↓
          6. Associate completes job (status: 'resolved')
   
   2c. Reject (status: 'rejected')
       → Issue closed
```

**Status Values:**
- `reported` - Tenant reported, waiting for manager
- `forwarded` - Manager forwarded to director
- `assigned` - Assigned to associate (by manager or director)
- `in-progress` - Associate accepted and working on it
- `resolved` - Associate completed the job
- `rejected` - Manager or director rejected

### User Approval Flow
```
1. User signs up → status: 'pending'
   ↓
   
2. If TENANT: Auto-approve → status: 'active'

3. If MANAGER/ASSOCIATE:
   ↓ Requires director approval
   
   DIRECTOR reviews → 
   - Approve: status: 'active'
   - Reject: status: 'rejected'
```

### Building → Apartment → Tenant Flow
```
1. DIRECTOR creates building
   ↓
   
2. DIRECTOR assigns MANAGER to building
   ↓
   
3. MANAGER creates apartments in building
   ↓
   
4. MANAGER assigns TENANT to apartment
   ↓
   
5. TENANT can now report issues for that apartment
```

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
Tabs based on role (top navigation bar):
- TENANT: Home, Issues, Bulletin Board
- MANAGER: Profile, Buildings (ONLY 2 TABS - all actions via building card buttons)
- DIRECTOR: Home, Buildings, Managers, Associates, Approvals, Issues
- ASSOCIATE: Home, Jobs
- ADMIN: Home

Plus: Logout button

CRITICAL FOR MANAGER ROLE:
- DO NOT create separate tabs for Apartments, Tenants, Issues, Bulletin Board, or Polls
- These features are accessed via 5 buttons on each building card in the Buildings tab
- Manager navigation is intentionally minimal: just Profile + Buildings
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

## 📊 Authorization Matrix

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

## 📋 Development Rules

1. **One Phase at a Time** - Complete current sub-phase before next
2. **Test Immediately** - Test API calls after every change (see TESTING_REQUIREMENTS.md)
3. **All Tests Pass** - Run full test suite before moving on
4. **Code Quality** - Follow CODE_QUALITY_STANDARDS.md
5. **UI/UX Standards** - Follow UI_UX_STANDARDS.md (minimal, elegant design)
6. **No Breaking Changes** - Previous phases must continue working
7. **Update Progress** - Mark sub-phases ✅ DONE when complete

---

## 📚 ARCHIVE: Old Phase Details (For Reference Only)

_The detailed specs below are archived for reference. Focus on the role-based phases above._

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

## Phase 4: Manager Assignment (Director)

**Why this comes before apartments:** Buildings need managers before apartments can be created. Managers will create/manage apartments in their assigned buildings.

### Backend Changes

#### Update Endpoints
```javascript
PATCH /api/buildings/:id/assign-manager (director only)
- Body: { managerId: "..." }
- Updates building.manager field
- Returns updated building with manager populated

GET /api/users?role=manager (director only)
- Returns all managers with status 'active'
- Include: buildings count (load), firstName, lastName, email

GET /api/buildings/managed (manager only) [already exists]
- Returns buildings where manager._id matches logged-in manager
```

### Frontend Changes

#### DirectorDashboard - Upravnici Tab
- Display list of all managers (active + pending)
- Show: name, email, status, # of assigned buildings
- Action buttons:
  - "Odobri" for pending managers (changes status to active)
  - "Obriši" to delete manager

#### DirectorDashboard - Zgrade Tab (Update)
- Add "Dodeli upravnika" button on each building card
- Opens modal/dropdown with list of active managers
- Shows current manager if assigned
- Can change/remove manager

### Success Criteria
- ✅ Director sees list of all managers
- ✅ Director can approve pending managers
- ✅ Director can assign manager to building
- ✅ Director can change/remove manager from building
- ✅ Manager sees only their assigned buildings in GET /api/buildings/managed
- ✅ Manager count updates when buildings are assigned/removed

---

## Phase 5: Apartment Management

**Prerequisites:** Buildings must have managers assigned (Phase 4 complete)

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

## Phase 6: Tenant Assignment

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

## 🎨 UI SPECIFICATIONS

### Manager Buildings Tab - Building Cards

**Reference Image:** managerBuildingPage.png

**Building Card Display:**
Each building shows as a card with:
- Building image (top)
- **Lokacija** (Location): Building name/address
- **Broj stanova** (Number of apartments): Auto-calculated from apartments count

**Action Buttons (5 buttons per building card):**

1. **Detalji o zgradi** (Building Details)
   - Opens tenant list view for this building
   - Shows table with columns:
     - Tenant name
     - Apartment number
     - Number of people living
     - Debt amount
   - Actions: Add new tenant, Remove tenant, Edit tenant info

2. **Kvarovi** (Issues/Repairs)
   - Opens issues triage view for this building
   - Shows all tenant-reported issues for this building
   - Filter by: urgency (urgent/not urgent), status
   - Actions for each issue:
     - Forward to director (status → 'forwarded')
     - Reject (status → 'rejected')
     - View issue details and history

3. **Oglasna tabla** (Bulletin Board)
   - Opens notices management view
   - Shows all notices for this building
   - Actions:
     - Create new notice/announcement
     - Edit existing notice
     - Delete notice

4. **Ankete** (Polls)
   - Opens polls management view
   - Shows active and closed polls for this building
   - Actions:
     - Create new poll (question + multiple choice options)
     - Close active poll
     - View poll results

5. **Naplati** (Billing/Payment)
   - Opens billing management view
   - Shows tenant debts and payment tracking
   - Actions:
     - Record payments
     - Add charges
     - Generate payment reports

**Layout:** Building cards displayed in a grid (responsive: 3 columns on desktop, 2 on tablet, 1 on mobile).

**Navigation:** Manager has only 2 top-level tabs (Profile, Buildings). All building-specific views are accessed via the 5 action buttons on each building card.

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

