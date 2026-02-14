# Role Permissions & Workflows

**Source:** Extracted from `docs/specs/ROLES.md`

---

## User Roles Overview

| Role | Primary Function | Status on Signup |
|------|-----------------|------------------|
| **TENANT** | Reports issues, views bulletin, votes on polls | `active` (auto-approved) |
| **MANAGER** | Manages buildings, apartments, tenants, triages issues | `pending` (requires director approval) |
| **DIRECTOR** | Creates buildings, assigns managers, approves staff | `active` (auto-approved) |
| **ASSOCIATE** | Accepts assigned jobs, sets cost, completes work | `pending` (requires director approval) |
| **ADMIN** | System administration (not yet implemented) | — |

---

## Authorization Matrix

| Action | Tenant | Manager | Director | Associate |
|--------|--------|---------|----------|-----------|
| **Report issues** | ✅ | ❌ | ❌ | ❌ |
| **Triage issues** | ❌ | ✅ | ❌ | ❌ |
| **Assign to associate** | ❌ | ✅ | ✅ | ❌ |
| **Accept job** | ❌ | ❌ | ❌ | ✅ |
| **Create building** | ❌ | ❌ | ✅ | ❌ |
| **Bulk apartments** | ❌ | ✅ | ✅ | ❌ |
| **Assign manager** | ❌ | ❌ | ✅ | ❌ |
| **Manage tenants** | ❌ | ✅ | ❌ | ❌ |
| **Approve staff** | ❌ | ❌ | ✅ | ❌ |
| **Post notice** | ❌ | ✅ | ❌ | ❌ |
| **Create poll** | ❌ | ✅ | ❌ | ❌ |
| **Vote on poll** | ✅ | ❌ | ❌ | ❌ |

---

## Issue Lifecycle (Complete Workflow)

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
          5. Associate accepts job (status: 'in-progress', sets cost)
             → Tenant debt increases by cost
          ↓
          6. Associate completes job (status: 'resolved')
   
   2c. Reject (status: 'rejected')
       → Issue closed
```

### Issue Status Values

| Status | Meaning | Who Can Set |
|--------|---------|-------------|
| `reported` | Tenant reported, waiting for manager | Tenant |
| `forwarded` | Manager forwarded to director | Manager |
| `assigned` | Assigned to associate | Manager, Director |
| `in-progress` | Associate working on it | Associate |
| `resolved` | Job completed | Associate |
| `rejected` | Manager or director rejected | Manager, Director |

---

## User Approval Flow

```
1. User signs up → status: 'pending'
   ↓
   
2. If TENANT or DIRECTOR:
   → Auto-approve: status: 'active'

3. If MANAGER or ASSOCIATE:
   ↓ Requires director approval
   
   DIRECTOR reviews → 
   - Approve: status: 'active' (can now login and use system)
   - Reject: status: 'rejected' (403 on login)
```

### Status Values

| Status | Meaning | Access |
|--------|---------|--------|
| `active` | User approved and can use system | ✅ Full access |
| `pending` | Awaiting director approval | ❌ Cannot login |
| `rejected` | Director denied access | ❌ Cannot login |

---

## Building → Apartment → Tenant Flow

```
1. DIRECTOR creates building
   ↓
   
2. DIRECTOR assigns MANAGER to building
   ↓
   
3. MANAGER creates apartments in building
   - Bulk: { floors: 3, unitsPerFloor: 4 }
   - Or single apartments
   ↓
   
4. MANAGER assigns TENANT to apartment
   - Tenant must have status: 'active'
   ↓
   
5. TENANT can now report issues for that apartment
```

---

## Navigation Tabs by Role

### Tenant
- **Home** (Početna)
- **Issues** (Kvarovi)
- **Bulletin Board** (Oglasna tabla)
- **Polls** (Glasanja)
- **Profile**

### Manager
**CRITICAL: ONLY 2 tabs**
- **Profile**
- **Buildings** (Zgrade)

All building actions via 5 buttons on building cards:
1. **Detalji o zgradi** - Tenant list
2. **Kvarovi** - Issue triage
3. **Oglasna tabla** - Notices
4. **Ankete** - Polls
5. **Naplati** - Billing

**DO NOT create separate tabs** for Apartments, Tenants, Issues, etc.

### Director
- **Home**
- **Buildings** (Zgrade)
- **Managers** (Upravnici)
- **Associates** (Saradnici)
- **Approvals** (Odobrenja)
- **Issues** (Kvarovi - forwarded only)
- **Profile**

### Associate
- **Home**
- **Jobs** (Poslovi)
- **Profile**

---

## API Endpoints by Role

### Tenant Endpoints
```
POST   /api/issues                 - Report issue
GET    /api/issues/my              - View own issues
GET    /api/buildings/:id/notices  - View notices
GET    /api/buildings/:id/polls    - View polls
POST   /api/polls/:id/vote         - Vote on poll
GET    /api/tenants/me/apartment   - Get apartment & building info
```

### Manager Endpoints
```
GET    /api/buildings/managed             - View assigned buildings
POST   /api/buildings/:id/apartments      - Create single apartment
POST   /api/buildings/:id/apartments/bulk - Bulk create apartments
GET    /api/buildings/:id/apartments      - List apartments
GET    /api/buildings/:id/tenants         - List tenants
POST   /api/tenants/:id/assign            - Assign tenant to apartment
GET    /api/issues                        - Issues in managed buildings
PATCH  /api/issues/:id/triage             - Forward/assign/reject issue
POST   /api/buildings/:id/notices         - Create notice
POST   /api/buildings/:id/polls           - Create poll
POST   /api/polls/:id/close               - Close poll
```

### Director Endpoints
```
POST   /api/buildings                     - Create building
GET    /api/buildings                     - List all buildings
PATCH  /api/buildings/:id/assign-manager  - Assign manager
GET    /api/users?role=X&status=Y         - Filter users
PATCH  /api/users/:id/approve             - Approve staff
DELETE /api/users/:id                     - Delete user
GET    /api/issues                        - All forwarded issues
PATCH  /api/issues/:id/assign             - Assign to associate
GET    /api/associates                    - List associates
```

### Associate Endpoints
```
GET    /api/associates/me/jobs     - View assigned jobs
POST   /api/issues/:id/accept      - Accept with cost estimate
POST   /api/issues/:id/complete    - Mark job complete
POST   /api/issues/:id/reject      - Reject job
```

---

## Authentication Flow

```
1. Signup    → User creates account
             → Status: 'pending' (manager/associate) or 'active' (tenant/director)

2. Approval  → Director approves manager/associate
             → Status: 'active'

3. Login     → User logs in with username + password
             → Receives JWT token

4. Storage   → Token saved in localStorage ('token')

5. Auto-load → App.js checks token on mount
             → Fetches user via GET /api/auth/me

6. Logout    → Clear token and user state
             → Navigate to Home (public)
```

**Important:** NO auto-login. Only JWT token stored in localStorage.

---

## Profile Page Details by Role

### Tenant Profile
- **Sidebar color:** `#1fc08f` (teal)
- **Fields:**
  - Korisničko ime
  - Zgrada (Building name)
  - Broj stana (Apartment number)
  - Broj ukucana (Number of people)
- **Special section:** DUGOVANJA (Debt)
  - Display debt amount (48px, weight 300)
  - "Plati" button (`#1fc08f`)

### Manager Profile
- **Sidebar color:** `#a79cc7` (purple)
- **Fields:**
  - Ime (First name)
  - Prezime (Last name)
  - Email
  - Broj telefona (Phone)

### Director Profile
- **Sidebar color:** `#aab1af` (gray)
- **Fields:**
  - Ime
  - Prezime
  - Email
  - Broj telefona

### Associate Profile
- **Sidebar color:** `#74a1c9` (blue)
- **Heading:** Company name or specialty (instead of "INFORMACIJE")
- **Fields:**
  - Ime
  - Prezime
  - Email
  - Broj telefona
  - (Optional: Specialties, Website, Service Areas, Years Experience)

---

## Development Phase Progression

### Foundation (Complete)
- ✅ Phase 0: Authentication & User Management
- ✅ Phase 0.1: Role field & status system
- ✅ Phase 0.2: Profile pages & role-based routing

### Phase 1: Director Role (Complete)
- ✅ 1.1: Create & view buildings
- ✅ 1.2: Assign managers to buildings
- ✅ 1.3: View & approve pending managers
- ✅ 1.4: View & approve pending associates
- ✅ 1.5: View all issues (forwarded only)
- ✅ 1.6: Assign issues to associates

### Phase 2: Manager Role (Complete)
- ✅ 2.1: View assigned buildings
- ✅ 2.2: Create apartments (bulk & single)
- ✅ 2.3: View & manage tenants
- ✅ 2.4: Assign tenants to apartments
- ✅ 2.5: View tenant-reported issues
- ✅ 2.6: Triage issues (forward/reject/assign)
- ✅ 2.7: Create notices
- ✅ 2.8: Create polls

### Phase 3: Tenant Role (Complete)
- ✅ 3.1: View apartment & building info
- ✅ 3.2: Report issues
- ✅ 3.3: View own issues
- ✅ 3.4: View bulletin board
- ✅ 3.5: Vote on polls

### Phase 4: Associate Role (Complete)
- ✅ 4.1: View assigned jobs
- ✅ 4.2: Accept job with cost
- ✅ 4.3: Mark job complete

---

## Common Permission Checks (Backend)

```javascript
// Check if user is authenticated
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
};

// Check if user has specific role
const requireRole = (roles) => {
  return async (req, res, next) => {
    const user = await User.findById(req.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    req.user = user;
    next();
  };
};

// Check if user status is 'active'
const requireActive = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user || user.status !== 'active') {
    return res.status(403).json({ message: 'Account not active' });
  }
  req.user = user;
  next();
};

// Usage examples:
app.post('/api/buildings', verifyToken, requireRole(['DIRECTOR']), createBuilding);
app.post('/api/issues', verifyToken, requireRole(['TENANT']), requireActive, reportIssue);
```

---

**Remember:** Role checks are mandatory. Never skip authorization.
