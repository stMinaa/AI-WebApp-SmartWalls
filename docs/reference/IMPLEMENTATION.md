# Implementation Reference

Technical reference for how the Smartwalls application is built. For visual design (colors, typography, layouts), see [UI_UX.md](../standards/UI_UX.md).

---

## Component Structure

### Public Pages

| Component | Purpose | Key Details |
|-----------|---------|-------------|
| **Home.js** | Landing page | VideoBackground, "Smartwalls" title, subtitle |
| **Login.js** | Authentication | Dark transparent card, `autocomplete="new-password"` |
| **Signup.js** | Registration | Role dropdown, building selection (tenants), approval message |

### Authenticated Pages

All authenticated pages use the **TopNav** component.

| Component | Role | Key Details |
|-----------|------|-------------|
| **TenantDashboard.js** | Tenant | Tabs: Početna, Glasanja, Obaveštenja, Prijavi Problem |
| **ManagerDashboard.js** | Manager | 2 tabs only: Profile, Buildings (all actions via building card buttons) |
| **DirectorDashboard.js** | Director | Tabs: Buildings, Managers, Associates, Approvals, Issues |
| **AssociateDashboard.js** | Associate | Active jobs, issue assignment flow |
| **AdminDashboard.js** | Admin | User approval, building creation |

### Shared Components

| Component | Purpose |
|-----------|---------|
| **TopNav.js** | Role-based navigation tabs, profile button, logout |
| **VideoBackground.js** | Looping building video for public pages |
| **ProfileEditor.js** | Edit profile modal/form |

---

## Authentication Flow

```
1. Signup    → User creates account → Status: pending (managers/associates) or active (tenants/directors)
2. Approval  → Director approves staff → Status: active
3. Login     → User logs in → Receives JWT token
4. Storage   → Token saved in localStorage ('token')
5. Auto-load → App.js checks token on mount, fetches user via GET /api/auth/me
6. Logout    → Clear token and user state, navigate to Home
```

**Important:** No auto-login. Only the JWT token is stored in localStorage, NOT the user object.

---

## State Management

### App.js (Root State)
```javascript
const [user, setUser] = useState(null);      // Current user object
const [view, setView] = useState('home');     // Active view/tab
const [token, setToken] = useState(localStorage.getItem('token'));
```

### Login Flow
```javascript
const handleLogin = (newToken, userData) => {
  localStorage.setItem('token', newToken);
  setToken(newToken);
  setUser(userData);
  // Navigate to profile (not dashboard)
};
```

### Logout Flow
```javascript
const handleLogout = () => {
  localStorage.removeItem('token');
  setToken(null);
  setUser(null);
  setView('home');
};
```

### localStorage Keys
```javascript
localStorage.getItem('token')  // JWT token (only key used)
```

---

## API Endpoints

### Authentication
```
POST /api/auth/signup    - Create user (accepts: username, email, password, firstName, lastName, role, building)
POST /api/auth/login     - Authenticate (accepts: username, password → returns: token, user)
GET  /api/auth/me        - Current user info (requires: Bearer token)
PATCH /api/auth/me       - Update profile
```

### Buildings & Apartments
```
POST   /api/buildings                      - Create building (director)
GET    /api/buildings                      - List all buildings
GET    /api/buildings/managed              - Manager's assigned buildings
PATCH  /api/buildings/:id/assign-manager   - Assign manager (director)
POST   /api/buildings/:id/apartments       - Create single apartment
POST   /api/buildings/:id/apartments/bulk  - Bulk create apartments
GET    /api/buildings/:id/apartments       - List apartments in building
GET    /api/buildings/:id/tenants          - List tenants in building
```

### Issues
```
POST  /api/issues                - Report issue (tenant)
GET   /api/issues                - Manager's building issues
GET   /api/issues/my             - Tenant's own issues
PATCH /api/issues/:id/triage     - Forward/reject (manager)
PATCH /api/issues/:id/assign     - Assign to associate (director)
POST  /api/issues/:id/accept     - Accept with cost (associate)
POST  /api/issues/:id/complete   - Mark complete (associate)
GET   /api/associates/me/jobs    - Associate's assigned jobs
```

### Users & Approvals
```
GET   /api/users?role=X&status=Y   - Filter users
PATCH /api/users/:id/approve       - Approve staff (director)
POST  /api/tenants/:id/assign      - Assign tenant to apartment
DELETE /api/tenants/:id             - Delete tenant
GET   /api/tenants/me/apartment    - Tenant's apartment & building info
```

### Bulletin Board
```
POST /api/buildings/:id/notices    - Create notice (manager)
GET  /api/buildings/:id/notices    - Get notices
POST /api/buildings/:id/polls      - Create poll (manager)
GET  /api/buildings/:id/polls      - Get polls
POST /api/polls/:id/vote           - Vote on poll (tenant)
```

### Response Format
```javascript
// Success
{ "success": true, "message": "...", "data": { /* payload */ } }

// Error
{ "success": false, "message": "...", "code": "ERROR_CODE" }
```

---

## Issue Workflow

```
TENANT reports issue
    ↓ (status: 'reported')
MANAGER triages
    ├── Forward → DIRECTOR (status: 'forwarded')
    │       └── Assign to ASSOCIATE (status: 'assigned')
    ├── Assign directly to ASSOCIATE (status: 'assigned')
    └── Reject (status: 'rejected')
            ↓
ASSOCIATE accepts (status: 'in-progress', sets cost, adds to tenant debt)
            ↓
ASSOCIATE completes (status: 'resolved', sets completionDate)
```

**Status values:** reported → forwarded → assigned → in-progress → resolved | rejected

---

## Server Configuration

### Backend (Node.js + Express)
- **Port:** 5000
- **Entry point:** `backend/index.js`
- **Database:** MongoDB Atlas (connection string in .env)
- **Auth:** JWT with 24h expiration, bcryptjs password hashing

### Frontend (React)
- **Port:** 3000
- **Start:** `npm start`
- **Build:** `npm run build`
- **Styling:** Inline styles (current pattern)

### Environment Variables
```
MONGODB_URI=mongodb+srv://...
PORT=5000
JWT_SECRET=your_secret_key
```

---

## Role-Based Access Control

| Action | Tenant | Manager | Director | Associate |
|--------|--------|---------|----------|-----------|
| Report issues | yes | | | |
| Triage issues | | yes | | |
| Assign to associate | | yes | yes | |
| Accept job | | | | yes |
| Create building | | | yes | |
| Bulk apartments | | yes | yes | |
| Assign manager | | | yes | |
| Manage tenants | | yes | | |
| Approve staff | | | yes | |
| Post notice | | yes | | |
| Create poll | | yes | | |
| Vote on poll | yes | | | |

---

## Known Issues & Resolutions

### Password Eye Icon Bug (RESOLVED)
- **Cause:** Caviar Dreams font from CDN had corrupted glyph mapping
- **Fix:** Removed font CDN from `index.html`, reverted to system fonts in `index.css`

### Inconsistent Navbar Colors (RESOLVED)
- **Fix:** All pages updated. Public: `#2c3e50`, Authenticated: `#16202b`

### Emoji Icons (RESOLVED)
- **Fix:** Removed all emoji from UI (👤 → "Profile", ➜ → "Exit", 👋 removed from greetings)

---

## Deployment Checklist

- [ ] All navbar colors verified consistent
- [ ] No custom fonts in index.html
- [ ] Password fields tested in all browsers
- [ ] API endpoints secured with JWT
- [ ] Environment variables configured
- [ ] E2E tests passing
- [ ] Build completes without errors
- [ ] Both servers start successfully

---

## Pitfalls to Avoid

- Using custom fonts (causes rendering bugs)
- Inconsistent navbar colors across pages
- Adding emoji icons to UI
- Forgetting backdrop blur on transparent boxes
- Wrong green shade on buttons (must be `#198653`)
- Text shadows on titles
- Saving user object to localStorage (only token)

---

*Last updated: February 2026*
