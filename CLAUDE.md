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

## MANDATORY: Agent & Skill System

> **SVE GENERISANJE KODA IDE ISKLJUCIVO KROZ AGENTE.** Nema izuzetaka.

### Agenti (pisu/analiziraju kod)

| Agent | Fajl | Uloga | Pise kod? |
|-------|------|-------|-----------|
| **nodejs-coder** | `.claude/commands/agents/nodejs-coder.md` | Backend implementacija, striktni TDD | **DA - JEDINI za backend** |
| **react-coder** | `.claude/commands/agents/react-coder.md` | Frontend implementacija, TDD | **DA - JEDINI za frontend** |
| **backend-architect** | `.claude/commands/agents/backend-architect.md` | Hexagonalna arhitektura, konsultant | NE - samo preporuke |
| **code-quality-reviewer** | `.claude/commands/agents/code-quality-reviewer.md` | SOLID, kompleksnost, code smells | NE - samo review |
| **database-architect** | `.claude/commands/agents/database-architect.md` | Sheme, migracije, rollback | NE - samo plan |

### Skillovi (orkestriraju agente)

| Skill | Komanda | Poziva agenta | Kada se koristi |
|-------|---------|---------------|-----------------|
| **TDD Workflow** | `/tdd` | nodejs-coder ILI react-coder | Bug fix, novi feature |
| **API Design** | `/api-design` | backend-architect → nodejs-coder | Novi/promenjen endpoint |
| **Code Quality** | `/quality` | code-quality-reviewer | Refaktoring, review, pre-commit |
| **DB Migration** | `/db-migration` | database-architect → nodejs-coder | Promena sheme (RETKO) |
| **Documentation** | `/documenting` | - | Novi modul, feature, arhitektura |
| **Feature Spec** | `/spec` | - | Pregled specifikacije rola |

### Rutiranje (OBAVEZNO)

```
Backend kod (routes, services, models, tests) → nodejs-coder (TDD: RED→GREEN→BLUE)
Frontend kod (components, dashboards, styles)  → react-coder  (TDD: RED→GREEN→BLUE)
Arhitekturna pitanja                           → backend-architect (samo preporuke)
Code review / refaktoring                      → code-quality-reviewer (samo analiza)
DB shema promena                               → database-architect (samo plan)
```

**ZLATNO PRAVILO:** nodejs-coder i react-coder NE SMEJU da pisu produkcijski kod dok ne napisu testove koji PADAJU (RED faza).

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
    └── commands/
        ├── agents/        - Agent instrukcije (nodejs-coder, react-coder, backend-architect, code-quality-reviewer, database-architect)
        ├── tdd.md         - TDD Workflow skill
        ├── api-design.md  - API Design skill
        ├── quality.md     - Code Quality skill
        ├── db-migration.md - DB Migration skill
        ├── documenting.md - Documentation skill
        └── spec.md        - Feature Specification skill
```

---

## Before Starting Work

1. **Read** the role spec → `docs/specs/ROLES.md`
2. **Check** test requirements → `docs/workflow/TESTING.md`
3. **Follow** TDD process → `docs/workflow/DEVELOPMENT.md`
4. **Use agents** → Backend: nodejs-coder | Frontend: react-coder
5. **Verify** code quality → `/quality` or `cs delta --staged`
6. **Update** project log → `docs/logs/PROJECT_LOG.md`

---

*Last updated: February 2026*
