# CLAUDE.md - Smartwalls Project Guide

> Building & Tenant Management System - Node.js/Express + React + MongoDB Atlas

---

## Quick Start

```bash
# Terminal 1: Start Backend
cd backend && node index.js
# Expected: "MONGO RUNNING" + "Server listening on port 5000"

# Terminal 2: Start Frontend
cd frontend && npm start
# Opens http://localhost:3000
```

**Test Credentials:**
- Director: `direktor` / `Test123!`
- Manager: `manager` / `Test123!`

---

## Documentation Index

### Standards
| Document | Purpose |
|----------|---------|
| [docs/standards/CODE_QUALITY.md](docs/standards/CODE_QUALITY.md) | Code quality rules, CodeScene target ≥8.0 |
| [docs/standards/UI_UX.md](docs/standards/UI_UX.md) | Design system, colors, typography, components |

### Workflow
| Document | Purpose |
|----------|---------|
| [docs/workflow/DEVELOPMENT.md](docs/workflow/DEVELOPMENT.md) | TDD process: RED → GREEN → BLUE cycle |
| [docs/workflow/TESTING.md](docs/workflow/TESTING.md) | Test checklist for each phase |

### Specifications
| Document | Purpose |
|----------|---------|
| [docs/specs/ROLES.md](docs/specs/ROLES.md) | Role system: Director, Manager, Tenant, Associate |

### Reference
| Document | Purpose |
|----------|---------|
| [docs/reference/QUICK_REF.md](docs/reference/QUICK_REF.md) | Commands, API format, common errors |
| [docs/reference/IMPLEMENTATION.md](docs/reference/IMPLEMENTATION.md) | Color scheme, component structure, API endpoints |

### Logs
| Document | Purpose |
|----------|---------|
| [docs/logs/PROJECT_LOG.md](docs/logs/PROJECT_LOG.md) | Development history, commits, fixes |

---

## Critical Rules

### 1. TDD Workflow (Non-Negotiable)
```
RED   → Write failing tests first
GREEN → Minimal implementation to pass
BLUE  → Refactor (no behavior change)
```

**Before ANY commit:**
- All tests pass (`npm test`)
- Backend starts without errors
- MongoDB Atlas connected
- Frontend reaches backend
- CodeScene score ≥ 8.0

### 2. Code Quality
```bash
# Analyze before commit
cs delta --staged

# Check specific file
cs review backend/services/issueService.js

# Full analysis
.\analyze-code.ps1
```

**Targets:**
- Code health score ≥ 8.0
- Cyclomatic complexity < 9 per function
- Functions < 50 lines
- No Complex Method warnings

### 3. UI/UX Standards

**Colors:**
```
Primary Green:     #198653  (buttons, actions)
Nav Authenticated: #16202b  (TopNav background)
Nav Public:        #2c3e50  (Home, Login, Signup)
```

**Role Sidebar Colors:**
```
Tenant:    #1fc08f (teal)    → Buttons: #147346
Manager:   #a79cc7 (purple)  → Buttons: #7f5f91
Associate: #74a1c9 (blue)    → Buttons: #476078
Director:  #aab1af (gray)    → Buttons: #6c737b
```

**Font:** System fonts only - NO custom fonts (Caviar Dreams causes password rendering bug)

**Language:** ALL UI text MUST be in Serbian

---

## Current Status

**Phase Completion:**
- Phase 1: Director ✅ (Buildings, managers, associates, issues)
- Phase 2: Manager ✅ (Buildings, apartments, tenants, triage)
- Phase 3: Tenant ✅ (Apartment info, issue reporting, bulletin board)
- Phase 4: Associate ✅ (View jobs, accept with cost, complete)

**Test Results:**
- Backend: 117 tests passing (100%)
- E2E: 27 tests passing (100%)

---

## API Overview

### Authentication
```
POST /api/auth/signup   - Create user (role, status)
POST /api/auth/login    - Get JWT token
GET  /api/auth/me       - Current user info
PATCH /api/auth/me      - Update profile
```

### Buildings & Apartments
```
POST   /api/buildings                    - Create building (director)
GET    /api/buildings                    - List buildings
GET    /api/buildings/managed            - Manager's buildings
PATCH  /api/buildings/:id/assign-manager - Assign manager
POST   /api/buildings/:id/apartments     - Create apartment
GET    /api/buildings/:id/apartments     - List apartments
```

### Issues
```
POST  /api/issues              - Report issue (tenant)
GET   /api/issues              - Manager's building issues
GET   /api/issues/my           - Tenant's own issues
PATCH /api/issues/:id/triage   - Forward/reject (manager)
PATCH /api/issues/:id/assign   - Assign to associate (director)
POST  /api/issues/:id/accept   - Accept with cost (associate)
POST  /api/issues/:id/complete - Mark complete (associate)
```

### Users & Approvals
```
GET   /api/users?role=X&status=Y  - Filter users
PATCH /api/users/:id/approve      - Approve staff (director)
POST  /api/tenants/:id/assign     - Assign to apartment
```

### Bulletin Board
```
POST /api/buildings/:id/notices  - Create notice (manager)
GET  /api/buildings/:id/notices  - Get notices
POST /api/buildings/:id/polls    - Create poll (manager)
GET  /api/buildings/:id/polls    - Get polls
POST /api/polls/:id/vote         - Vote (tenant)
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
ASSOCIATE accepts (status: 'in-progress', sets cost)
            ↓
ASSOCIATE completes (status: 'resolved')
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check if port in use
netstat -ano | findstr :5000

# Kill Node processes
Taskkill /IM node.exe /F
```

### 401 Unauthorized
- Token missing or expired
- Check `localStorage.getItem('token')`
- Try logging in again

### 403 Forbidden
- User doesn't have required role
- Check `user.role` matches endpoint requirement

### CORS Errors
- Backend not running on port 5000
- Check CORS configuration in backend/index.js

### MongoDB Connection Failed
- Check MongoDB Atlas connection string in .env
- Verify network access in Atlas dashboard

---

## Project Structure

```
project/
├── backend/
│   ├── index.js           - Main server & routes
│   ├── models/            - Mongoose schemas
│   ├── services/          - Business logic
│   └── test/              - Jest tests
├── frontend/
│   ├── src/
│   │   ├── App.js         - Main routing
│   │   ├── components/    - Shared components
│   │   └── [Role]Dashboard.js
│   └── public/
├── docs/
│   ├── standards/         - CODE_QUALITY, UI_UX
│   ├── workflow/          - DEVELOPMENT, TESTING
│   ├── specs/             - ROLES
│   ├── reference/         - QUICK_REF, IMPLEMENTATION
│   ├── logs/              - PROJECT_LOG
│   └── archive/           - Historical docs
└── .claude/
    └── commands/          - Slash command skills
```

---

## Response Format

All API responses follow this format:

```javascript
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { /* payload */ }
}

// Error
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Before Starting Work

1. **Read** the relevant spec in `docs/specs/ROLES.md`
2. **Check** tests in `docs/workflow/TESTING.md`
3. **Follow** TDD in `docs/workflow/DEVELOPMENT.md`
4. **Verify** code quality with `cs delta --staged`
5. **Update** `docs/logs/PROJECT_LOG.md` after commits

---

*Last updated: February 2026*
