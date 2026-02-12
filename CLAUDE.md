# CLAUDE.md - Smartwalls Project

> Building & Tenant Management System - Node.js/Express + React + MongoDB Atlas

---

## Quick Start

```bash
# Terminal 1: Backend
cd backend && node index.js
# Expected: "MONGO RUNNING" + "Server listening on port 5000"

# Terminal 2: Frontend
cd frontend && npm start
# Opens http://localhost:3000
```

**Test Credentials:** `direktor` / `Test123!` | `manager` / `Test123!`

---

## Documentation Map

| Category | Document | What's Inside |
|----------|----------|---------------|
| **Standards** | [CODE_QUALITY.md](docs/standards/CODE_QUALITY.md) | Code health rules, CodeScene CLI, pre-commit hooks, targets (score ≥ 9.0) |
| **Standards** | [REFACTORING.md](docs/standards/REFACTORING.md) | Hexagonal architecture migration plan, SOLID principles, automated quality gates |
| **Standards** | [UI_UX.md](docs/standards/UI_UX.md) | Full design system: colors, typography, role themes, components, accessibility |
| **Workflow** | [DEVELOPMENT.md](docs/workflow/DEVELOPMENT.md) | TDD process (RED → GREEN → BLUE), commit rules, connectivity checks |
| **Workflow** | [TESTING.md](docs/workflow/TESTING.md) | Phase-by-phase test specs, manual testing checklists |
| **Specs** | [ROLES.md](docs/specs/ROLES.md) | Role system, phase breakdown, data flows, schemas, authorization matrix |
| **Reference** | [QUICK_REF.md](docs/reference/QUICK_REF.md) | Commands, API format, curl examples, troubleshooting, common errors |
| **Reference** | [IMPLEMENTATION.md](docs/reference/IMPLEMENTATION.md) | Component structure, auth flow, state management, server config |
| **Reference** | [QUALITY_QUICK_REF.md](docs/reference/QUALITY_QUICK_REF.md) | Architecture test commands, quality gates, quick quality checks |
| **Logs** | [PROJECT_LOG.md](docs/logs/PROJECT_LOG.md) | Development history, commits, problems & fixes |

---

## Critical Rules (Details in Linked Docs)

### TDD Workflow → [DEVELOPMENT.md](docs/workflow/DEVELOPMENT.md)
```
RED → GREEN → BLUE (non-negotiable)
```
Before ANY commit: tests pass, backend boots, MongoDB connected, frontend reaches backend, CodeScene ≥ 9.0.

### Code Quality → [CODE_QUALITY.md](docs/standards/CODE_QUALITY.md)
- Cyclomatic complexity < 9 per function, functions < 50 lines
- Run `cs delta --staged` or `.\analyze-code.ps1` before committing

### UI/UX → [UI_UX.md](docs/standards/UI_UX.md)
- ALL UI text in **Serbian**
- System fonts only (NO Caviar Dreams - causes password rendering bug)
- Role-specific colors defined in UI_UX.md

---

## Project Structure

```
project/
├── backend/
│   ├── index.js           - Main server & routes
│   ├── models/            - Mongoose schemas (User, Building, Apartment, Issue, Notice, Poll)
│   ├── services/          - Business logic (issueService, userService, buildingService, noticeService)
│   ├── routes/            - Express route handlers
│   └── test/              - Jest tests (117 passing)
├── frontend/
│   ├── src/
│   │   ├── App.js         - Main routing & auth
│   │   ├── components/    - Shared (TopNav, VideoBackground, ProfileEditor)
│   │   └── *Dashboard.js  - Role-specific dashboards
│   └── public/
├── docs/
│   ├── standards/         - CODE_QUALITY, UI_UX
│   ├── workflow/          - DEVELOPMENT, TESTING
│   ├── specs/             - ROLES
│   ├── reference/         - QUICK_REF, IMPLEMENTATION
│   ├── logs/              - PROJECT_LOG
│   └── archive/           - Historical docs
└── .claude/
    └── commands/          - Slash command skills (quality, tdd, spec)
```

---

## Before Starting Work

1. **Read** the role spec → `docs/specs/ROLES.md`
2. **Check** test requirements → `docs/workflow/TESTING.md`
3. **Follow** TDD process → `docs/workflow/DEVELOPMENT.md`
4. **Verify** code quality → `cs delta --staged`
5. **Update** project log → `docs/logs/PROJECT_LOG.md`

---

*Last updated: February 2026*
