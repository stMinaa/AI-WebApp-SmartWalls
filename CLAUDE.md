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

### 🤖 AI Context (Primary for Claude)

| Document | What's Inside |
|----------|---------------|
| [tdd-mandatory.md](.claude/context/tdd-mandatory.md) | TDD process (RED → GREEN → BLUE), commit rules, connectivity checks, autonomous commit rules |
| [code-quality.md](.claude/context/code-quality.md) | Code health targets, CodeScene commands, complexity limits, JavaScript/React/MongoDB standards |
| [ui-rules.md](.claude/context/ui-rules.md) | Complete design system: colors, fonts, layouts, role-specific styling, Serbian language |
| [role-permissions.md](.claude/context/role-permissions.md) | Authorization matrix, workflows, issue lifecycle, navigation tabs, API endpoints by role |
| [api-endpoints.md](.claude/context/api-endpoints.md) | All API endpoints with request/response examples, status codes, authentication |
| [testing-checklist.md](.claude/context/testing-checklist.md) | Pre-commit checklist, test coverage requirements, system connectivity, manual testing |
| [architecture.md](.claude/context/architecture.md) | Hexagonal architecture, SOLID principles, refactoring plan, complexity reduction |

### 📋 Project Specs

| Document | What's Inside |
|----------|---------------|
| [ROLES.md](docs/specs/ROLES.md) | Role system specification, phase breakdown, data flows, authorization matrix |
| [PROJECT_LOG.md](docs/logs/PROJECT_LOG.md) | Development history, commits, problems & fixes |

### 📦 Archive (Historical)

Original documentation files archived in `docs/archive/` after extraction into AI-optimized context files.

---

## MANDATORY: Agent & Skill System

> **SVE GENERISANJE KODA IDE ISKLJUCIVO KROZ AGENTE.** Nema izuzetaka.

### Agenti (pisu/analiziraju kod)

| Agent | Fajl | Uloga | Pise kod? |
|-------|------|-------|-----------|
| **nodejs-coder** | `.claude/agents/nodejs-coder.md` | Backend implementacija, striktni TDD | **DA - JEDINI za backend** |
| **react-coder** | `.claude/agents/react-coder.md` | Frontend implementacija, TDD | **DA - JEDINI za frontend** |
| **backend-architect** | `.claude/agents/backend-architect.md` | Hexagonalna arhitektura, konsultant | NE - samo preporuke |
| **code-quality-reviewer** | `.claude/agents/code-quality-reviewer.md` | SOLID, kompleksnost, code smells | NE - samo review |
| **database-architect** | `.claude/agents/database-architect.md` | Sheme, migracije, rollback | NE - samo plan |

### Skillovi (orkestriraju agente)

| Skill | Komanda | Koristi agent | Poziva agenta | Kada se koristi |
|-------|---------|---------------|---------------|-----------------|
| **TDD Workflow** | `/tdd` | nodejs-coder, react-coder | - | Bug fix, novi feature (GLAVNI workflow) |
| **API Design** | `/api-design` | nodejs-coder | backend-architect | Novi/promenjen endpoint |
| **Code Quality** | `/quality` | nodejs-coder, react-coder | code-quality-reviewer | Pre-commit, refaktoring, review |
| **DB Migration** | `/db-migration` | nodejs-coder | database-architect | Promena sheme (RETKO) |
| **Documentation** | `/documenting` | react-coder, backend-architect | - | Novi modul, komponenta, arhitektura |
| **Feature Spec** | `/spec` | backend-architect, database-architect | - | Pregled ROLES.md specifikacije |
| **Quality Check** | `/quality-check` | code-quality-reviewer | - | Brza CodeScene provera |

**Kako funkcioniše:** Agenti koriste skillove da pozovu druge agente za konsultacije ili da orkestriraju kompleksne procese.

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

## Agent-Skill Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER ZAHTEV                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
  ┌──────────┐                  ┌──────────┐
  │ Backend  │                  │ Frontend │
  │ Feature  │                  │ Feature  │
  └─────┬────┘                  └─────┬────┘
        │                             │
        ▼                             ▼
  ┌──────────────┐            ┌───────────────┐
  │ nodejs-coder │            │ react-coder   │
  │   (TDD)      │            │     (TDD)     │
  └──────┬───────┘            └───────┬───────┘
         │                            │
         │ koristi /tdd               │ koristi /tdd
         │ koristi /quality           │ koristi /quality
         │ koristi /api-design        │ koristi /documenting
         │                            │
         ├─────────┐                  │
         │         │                  │
         ▼         ▼                  │
  ┌──────────┐ ┌──────────────┐      │
  │backend-  │ │code-quality- │      │
  │architect │ │reviewer      │◄─────┘
  │(consult) │ │(review)      │
  └──────────┘ └──────────────┘
         ▲
         │
         │ koristi /db-migration
         │
  ┌──────────────┐
  │database-     │
  │architect     │
  │(db design)   │
  └──────────────┘
```

**Flow:**
1. **Koder agenti** (`nodejs-coder`, `react-coder`) → Pišu kod, koriste `/tdd` uvek
2. **Koder poziva `/quality`** → Aktivira `code-quality-reviewer`
3. **Koder poziva `/api-design`** → Aktivira `backend-architect` za konsultaciju
4. **Koder poziva `/db-migration`** → Aktivira `database-architect` za plan

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
    ├── agents/            - Agent instrukcije (nodejs-coder, react-coder, backend-architect, code-quality-reviewer, database-architect)
    ├── skills/            - Skillovi (tdd, quality, api-design, db-migration, documenting, spec, quality-check)
    └── commands/          - Specifične komande (codescene-check, codescene-hotspots)
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
