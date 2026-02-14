# Refactoring Standards - Hexagonal Architecture Migration

Complete reference for refactoring the monolithic backend into clean hexagonal architecture with SOLID principles and automated quality gates.

---

## � ENFORCEMENT TIMELINE

**Phase 1: NOW (Pre-refactoring)**
- ✅ All tools installed and configured
- 🔓 Pre-commit hook: Frontend build only (lenient)
- 💡 Manual checks: `npm run quality` anytime (optional)
- 📚 Documentation ready

**Phase 2: Level 1-2 (Easy refactoring)**
- 🟡 Activate ESLint in pre-commit hook
- 🔍 Enforce: Code complexity < 9, function length < 50 lines

**Phase 3: Level 3+ (Hexagonal structure)**
- 🔴 Activate full architectural tests in pre-commit
- 🏛️ Enforce: Domain purity, layer boundaries, import restrictions
- 🚫 Blocks commits violating hexagonal rules

**Activation Point:** When creating `backend/src/domain/` → see Step 3.1

---

## �🚨 REFACTORING RULES (NON-NEGOTIABLE) 🚨

### Rule 1: Tests Must Pass Before & After
**Every refactoring step must:**
- Start with all tests green
- End with all tests green
- NOT change external behavior
- Add tests FIRST if coverage missing

### Rule 2: One Change at a Time
**You must:**
- Make ONE refactoring change per commit
- NOT mix feature additions with refactoring
- NOT change business logic while restructuring
- Commit frequently (every 30 minutes max)

### Rule 3: Preserve API Contracts
**During migration:**
- Frontend must continue working
- Existing endpoints stay functional
- Use parallel routes (`/api/v2/`) for new structure
- Deprecate old routes ONLY after full migration

### Rule 4: Boy Scout Principle
**Leave code cleaner than you found it:**
- Fix naming when touching code
- Extract functions when moving routes
- Add validation when migrating
- But DON'T over-engineer

### Rule 5: Architectural Gates Enforce Boundaries
**Automated checks prevent violations:**
- Pre-commit hook: Frontend build (always active)
- Pre-commit hook: Arch tests + ESLint (activate at Level 3)
- Manual checks: Available anytime with `npm run quality`
- CI/CD: Full validation on pull requests

**Activation Schedule:**
- **Now (Pre-refactoring):** Frontend build only
- **Level 1-2:** Add ESLint to pre-commit
- **Level 3+:** Full arch tests + ESLint enforcement

---

## ════════════════════════════════
## AUTOMATED QUALITY GATES
## ════════════════════════════════

### Before Every Commit

**Current (Pre-refactoring):**
```bash
# Automatic via pre-commit hook
✓ Frontend build check

# Manual (recommended)
npm run quality  # Lint + arch tests (optional)
```

**After Level 3 (Hexagonal Structure Created):**
```bash
# Activate in .husky/pre-commit (uncomment lines)
✓ Frontend build
✓ Architectural tests
✓ Backend ESLint

# Then run: git commit
```

### During Development

```bash
# Backend checks
npm run lint              # ESLint violations
npm run lint:fix          # Auto-fix issues
npm run test:arch         # Architectural tests only
npm run deps:check        # Dependency violations
npm run deps:graph        # Visualize dependencies

# Frontend checks
cd frontend
npm run lint              # React hooks, boundaries
npm run lint:fix          # Auto-fix
npm run test:coverage     # Test coverage
```

### Pre-Commit Hook

**Phase 1: Pre-refactoring (NOW)**
```bash
git commit -m "..."
🔍 Running quality checks...
📦 Checking frontend build...
✅ All checks passed!
💡 Tip: Run 'npm run quality' manually
```

**Phase 2-3: During refactoring (Level 3+)**
Edit `.husky/pre-commit` - uncomment architectural checks:
```bash
git commit -m "..."
🔍 Running quality checks...
📦 Checking frontend build...
🏛️  Running architectural tests...
✨ Linting backend code...
✅ All quality checks passed!
```

**Blocks commit if:**
- ❌ Frontend build fails (always)
- ❌ Domain imports infrastructure (Level 3+)
- ❌ Use cases import Express/Mongoose (Level 3+)
- ❌ React hooks violated (always)
- ❌ Circular dependencies (Level 3+)
- ❌ Complexity > 9 (Level 3+)
- ❌ Functions > 50 lines (Level 3+)

---

## ════════════════════════════════
## PROGRESSIVE REFACTORING PLAN
## ════════════════════════════════

> **Ordered from EASIEST → HARDEST**
> Each step builds foundation for the next

### LEVEL 1: Foundation (Low Risk, High Impact)

#### Step 1.1: Extract Magic Numbers & Strings ⏱️ 1 day
**What:** Move hardcoded values to constants  
**Target:** `backend/index.js` (2,078 lines)  
**Action:**
- Find: `5000`, `'reported'`, `'active'`, etc.
- Move to: `backend/config/constants.js`
- Replace ALL occurrences

**Validation:**
```bash
npm run lint  # No magic number warnings
grep -r "'reported'" backend/src/  # Should be empty
```

---

#### Step 1.2: Standardize API Responses ⏱️ 2 days
**What:** Uniform format `{ success, message, data }`  
**Target:** All 50+ route handlers  
**Action:**
- Create: `backend/utils/ApiResponse.js`
- Update: All `res.json()` calls
- Frontend: Update API client

**Validation:**
```bash
npm test  # All tests pass with new format
grep "res\.json" backend/index.js  # Should use ApiResponse
```

---

#### Step 1.3: Fix Naming Inconsistencies ⏱️ 1 day
**What:** Rename unclear variables  
**Target:** Entire codebase  
**Action:**
- `usr` → `user`
- `amt` → `amount`
- Choose: `assignedTo` everywhere OR `associateId` everywhere

**Validation:**
```bash
npm run lint  # Camelcase rule enforced
grep -r "\\busr\\b" backend/  # Should be empty
```

---

#### Step 1.4: Add Input Validation ⏱️ 2-3 days
**What:** Validate all inputs at entry  
**Target:** POST/PUT endpoints  
**Action:**
- Create: `backend/validators/IssueValidator.js`, etc.
- Add validation middleware
- Return 400 with clear errors

**Validation:**
```bash
npm test  # Validation tests pass
curl -X POST /api/issues -d "{}" | grep "validation"
```

---

#### Step 1.5: Standardize JWT Payload ⏱️ 1 day
**What:** Single token format  
**Target:** `authHelper.js` + all token usage  
**Action:**
- Define: `{ userId, username, email, role }`
- Update: All `generateToken()` calls
- Update: Frontend token decoder

**Validation:**
```bash
npm test  # Auth tests pass
npm run test:arch  # No token format violations
```

---

### LEVEL 2: Extraction (Medium Risk)

#### Step 2.1: Extract Helper Functions ⏱️ 3-4 days
**What:** Pull inline logic into named functions  
**Target:** Route handlers in `index.js`  
**Action:**
- Identify repeated patterns
- Extract to helpers in same file
- Group related helpers

---

#### Step 2.2: Move Inline Routes to Files ⏱️ 5-7 days
**What:** Modularize all routes  
**Target:** `index.js` → `routes/`  
**Action:**
- Expand: `routes/auth.js`, `routes/issues.js`, etc.
- Result: `index.js` < 150 lines

**Validation:**
```bash
npm run test:arch  # Passes
wc -l backend/index.js  # < 150 lines
```

---

#### Step 2.3: Extract Permission Logic ⏱️ 2 days
**What:** Configuration-based auth  
**Target:** Scattered permission checks  
**Action:**
- Create: `config/permissions.js` with map
- Middleware: `requirePermission('action')`

**Validation:**
```bash
npm run lint  # No hardcoded role checks
npm run deps:check  # Clean
```

---

#### Step 2.4: Move Business Logic to Services ⏱️ 5-7 days
**What:** Thin controllers  
**Target:** Route handlers  
**Action:**
- Expand: `services/issueService.js`
- Controllers: < 15 lines each

---

### LEVEL 3: Architecture Preparation (Medium-High Risk)

#### Step 3.1: Create Domain Entity Classes ⏱️ 7-10 days
**What:** Pure business objects  
**Target:** NEW `backend/src/domain/`  
**Action:**
- Create: `domain/issues/Issue.js` (pure class)
- Methods: `forward()`, `assign()`, `accept()`
- Validation: `canBeTriagedBy()`

**🔥 ACTIVATE STRICT PRE-COMMIT HOOK HERE:**
Edit `.husky/pre-commit` - uncomment architectural checks

**Validation:**
```bash
npm run test:arch  # Domain purity tests pass
npm run deps:check  # No Express/Mongoose imports
git commit          # Hook now enforces boundaries
```

**Blocker:** Domain CANNOT import Express, Mongoose, or adapters
```javascript
// ❌ BLOCKED by ESLint
// src/domain/issues/Issue.js
const mongoose = require('mongoose');  // ERROR!

// ✅ ALLOWED
class Issue {
  forward(managerId) {
    // Pure business logic
  }
}
```

---

#### Step 3.2: Create Value Objects ⏱️ 2-3 days
**What:** Type-safe enums  
**Target:** Status/role strings  
**Action:**
- Create: `IssueStatus`, `UserRole` classes
- Immutable with `Object.freeze()`

**Blocker:** Cannot use string literals in domain
```javascript
// ❌ BLOCKED by ESLint
issue.status = 'reported';

// ✅ ALLOWED
issue.status = IssueStatus.REPORTED;
```

---

#### Step 3.3: Define Repository Interfaces ⏱️ 3-4 days
**What:** Contracts for data access  
**Target:** NEW `backend/src/ports/repositories/`  
**Action:**
- Create: `IUserRepository.js` (interface)
- Define: `findById()`, `save()`, etc.

---

#### Step 3.4: Create Mongoose Adapters ⏱️ 7-10 days
**What:** Implement repository interfaces  
**Target:** NEW `backend/src/adapters/persistence/`  
**Action:**
- Create: `MongooseUserRepository.js`
- Mappers: Domain ↔ Mongoose

**Blocker:** Repositories must implement interfaces
```javascript
// ❌ BLOCKED - not implementing interface
class UserRepo {
  findUser(id) { }  // Wrong method name
}

// ✅ ALLOWED
class MongooseUserRepository extends IUserRepository {
  async findById(id) { }  // Matches interface
}
```

---

#### Step 3.5: Create Use Case Layer ⏱️ 10-14 days
**What:** Application operations  
**Target:** NEW `backend/src/application/`  
**Action:**
- Create: `CompleteIssueUseCase.js`
- One `execute()` method per use case

**Blocker:** Use cases CANNOT import adapters
```javascript
// ❌ BLOCKED by boundaries plugin
// src/application/CompleteIssueUseCase.js
const IssueController = require('../../adapters/http/controllers/IssueController');

// ✅ ALLOWED
class CompleteIssueUseCase {
  constructor(issueRepository) {  // Interface injection
    this.issueRepository = issueRepository;
  }
}
```

---

### LEVEL 4: Integration (High Risk)

#### Step 4.1: DI Container ⏱️ 3-4 days
**What:** Wire dependencies  
**Action:**
- Install: `awilix`
- Create: `infrastructure/container.js`
- Register: Repos, use cases, controllers

---

#### Step 4.2: Create Controllers ⏱️ 5-7 days
**What:** Thin HTTP layer  
**Action:**
- Create: `adapters/http/controllers/IssueController.js`
- Controllers: Call use cases only

**Blocker:** Controllers CANNOT access models directly
```javascript
// ❌ BLOCKED by ESLint
const User = require('../../../models/User');  // ERROR!

// ✅ ALLOWED
class IssueController {
  constructor({ completeIssueUseCase }) {
    this.completeIssueUseCase = completeIssueUseCase;
  }
}
```

---

#### Step 4.3: Parallel Routes (v2) ⏱️ 7-10 days
**What:** New endpoints alongside old  
**Action:**
- Create: `/api/v2/issues` routes
- Keep: Old routes functional
- Feature flag: Switch versions

---

#### Step 4.4: Migrate Frontend ⏱️ 7-10 days
**What:** Update API calls  
**Action:**
- One dashboard at a time
- Update: `frontend/src/services/api.js`

---

### LEVEL 5: Completion

#### Step 5.1: Migrate Remaining Contexts ⏱️ 14-21 days
- Building, Invoice, Notice domains

#### Step 5.2: Delete Old Code ⏱️ 2-3 days
- Remove: `backend/services/`, old routes
- Result: `index.js` < 100 lines

#### Step 5.3: Configuration Service ⏱️ 2 days
- Externalize: MongoDB URI, JWT secret

#### Step 5.4: Performance & Monitoring ⏱️ 3-5 days
- Add: Logging, metrics, health checks

---

## ════════════════════════════════
## CLEAN CODE PRINCIPLES
## ════════════════════════════════

### Naming Rules

| Type | Convention | Example |
|------|------------|---------|
| **Variables** | camelCase, noun | `issueStatus`, `userRole` |
| **Functions** | camelCase, verb | `createInvoice`, `validateInput` |
| **Classes** | PascalCase | `Issue`, `IssueRepository` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_DEBT_LIMIT` |
| **Booleans** | is/has/can | `isResolved`, `canAssign` |
| **Private** | underscore | `_validateTransition` |

**Enforced by:** ESLint `camelcase` rule

---

### Function Rules

| Rule | Limit | Enforced By |
|------|-------|-------------|
| **Length** | < 50 lines | ESLint `max-lines-per-function` |
| **Parameters** | ≤ 3 | ESLint `max-params` |
| **Complexity** | < 9 | ESLint `complexity` |
| **Nesting** | < 3 levels | ESLint `max-depth` |

---

### File Rules

| Rule | Limit | Enforced By |
|------|-------|-------------|
| **File size** | < 300 lines | ESLint `max-lines` |
| **Statements** | < 15 per function | ESLint `max-statements` |

---

## ════════════════════════════════
## SOLID PRINCIPLES
## ════════════════════════════════

### S - Single Responsibility
**One reason to change**

**Before:**
```javascript
// backend/index.js - 2,078 lines, many responsibilities
```

**After:**
```javascript
// backend/index.js - < 100 lines, just bootstrapping
// backend/src/domain/ - Business logic
// backend/src/adapters/ - HTTP, DB
```

---

### O - Open/Closed
**Open for extension, closed for modification**

**Implementation:** Permission system
```javascript
// backend/config/permissions.js
const PERMISSIONS = {
  'issue.report': ['tenant', 'manager'],
  'issue.assign': ['director']
};

// Add new permission WITHOUT changing code
PERMISSIONS['invoice.pay'] = ['director'];
```

**Enforced by:** No need to modify `PermissionService` class

---

### L - Liskov Substitution
**Subtypes must be substitutable**

**Implementation:** Repository pattern
```javascript
// Can swap implementations
const repo = process.env.NODE_ENV === 'test'
  ? new InMemoryUserRepository()
  : new MongooseUserRepository();
```

**Enforced by:** Interface contracts

---

### I - Interface Segregation
**Don't depend on unused methods**

**Implementation:** Separate use cases
```javascript
// ❌ BLOATED
class UserService {
  register() { }
  login() { }
  updateProfile() { }
  approveUser() { }  // Director only
}

// ✅ FOCUSED
class RegisterUserUseCase { execute() { } }
class LoginUserUseCase { execute() { } }
```

**Enforced by:** One class per file, small file limit

---

### D - Dependency Inversion
**Depend on abstractions**

**Implementation:**
```javascript
// ❌ BLOCKED by ESLint
class CompleteIssueUseCase {
  constructor() {
    this.Issue = require('../../models/Issue');  // Concrete
  }
}

// ✅ ALLOWED
class CompleteIssueUseCase {
  constructor(issueRepository) {  // Abstraction
    this.issueRepository = issueRepository;
  }
}
```

**Enforced by:** Boundaries plugin, architectural tests

---

## ════════════════════════════════
## HEXAGONAL ARCHITECTURE LAYERS
## ════════════════════════════════

### Dependency Flow

```
┌──────────────────────────────┐
│   HTTP Request (Express)     │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   ADAPTER: Controller        │  ← ESLint: Can call use cases
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   APPLICATION: Use Case      │  ← ESLint: CANNOT import Express
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   DOMAIN: Entity             │  ← ESLint: CANNOT import Mongoose
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   PORT: Repository Interface │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   ADAPTER: Mongoose Repo     │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   MongoDB Atlas              │
└──────────────────────────────┘
```

**Enforced by:**
- ESLint `boundaries/element-types`
- Dependency-cruiser rules
- Architectural tests

---

## ════════════════════════════════
## TESTING REQUIREMENTS
## ════════════════════════════════

### Coverage Targets

| Layer | Target | Command |
|-------|--------|---------|
| **Domain** | 95%+ | `npm test src/domain/` |
| **Application** | 90%+ | `npm test src/application/` |
| **Overall** | 85%+ | `npm test -- --coverage` |

### Test Types

**Unit Tests** (Fast, no DB)
```bash
npm test src/domain/  # Pure domain logic
```

**Integration Tests** (Real dependencies)
```bash
npm test backend/test/  # Full flow
```

**Architectural Tests** (Structure validation)
```bash
npm run test:arch  # Boundary checks
```

---

## ════════════════════════════════
## COMMIT MESSAGE FORMAT
## ════════════════════════════════

### Refactoring Commits

```
refactor(scope): extract magic numbers to constants

- Moved hardcoded values from index.js to config/constants.js
- Updated all references to use named constants
- No behavior change

Tests: ✓ All pass (117/117)
Lint: ✓ No violations
Arch: ✓ Boundaries respected
```

### Architecture Commits

```
arch(domain): add Issue entity with state machine

- Created src/domain/issues/Issue.js
- Implemented forward(), assign(), accept(), complete()
- Added validation methods (canBeTriagedBy, etc.)
- 100% test coverage

Pattern: Hexagonal Architecture - Domain Layer
Tests: ✓ 15 new tests pass
Arch: ✓ No infrastructure dependencies
```

---

## ════════════════════════════════
## SUCCESS METRICS
## ════════════════════════════════

### Code Quality

| Metric | Before | Target | Check |
|--------|--------|--------|-------|
| Lines in index.js | 2,078 | < 100 | `wc -l backend/index.js` |
| Avg function length | ~50 | < 15 | `npm run lint` |
| Test coverage | 60% | 85%+ | `npm test -- --coverage` |
| CodeScene score | 7.5 | 9.0+ | `cs delta --staged` |
| Complexity | 15+ | < 9 | `npm run lint` (complexity rule) |

### Architecture

| Metric | Check |
|--------|-------|
| Domain independence | `npm run test:arch` |
| No circular deps | `npm run deps:check` |
| Layer separation | `npm run lint` |

---

## ════════════════════════════════
## TROUBLESHOOTING
## ════════════════════════════════

### "Domain layer imports Express" Error

**Symptom:**
```bash
npm run lint
❌ src/domain/Issue.js: Cannot import from 'adapters'
```

**Fix:**
```javascript
// Remove Express import from domain
// Domain entities must be pure JavaScript
```

---

### "Circular dependency detected"

**Symptom:**
```bash
npm run deps:check
❌ Circular: A → B → C → A
```

**Fix:**
- Extract interface
- Move shared code to separate file
- Use dependency injection

---

### "React hooks exhaustive deps"

**Symptom:**
```bash
npm run lint
⚠️ useEffect has missing dependency
```

**Fix:**
```javascript
// Add dependency to array
useEffect(() => {
  fetchData(userId);
}, [userId]);  // Include all used vars
```

---

## ════════════════════════════════
## QUICK COMMANDS REFERENCE
## ════════════════════════════════

```bash
# Before coding
npm run quality         # Run all checks

# During coding
npm run lint            # Check violations
npm run lint:fix        # Auto-fix
npm run test:arch       # Architectural tests

# Before commit
npm run quality         # Full check
git add .
git commit -m "..."     # Hook runs automatically

# Visualize architecture
npm run deps:graph      # Creates dependency-graph.svg

# Full test suite
npm run quality:full    # Everything including unit tests
```

---

## ════════════════════════════════
## BEFORE YOU START
## ════════════════════════════════

### Prerequisites

- [x] Tools installed (`dependency-cruiser`, ESLint plugins)
- [x] Configs created (`.eslintrc.js`, `.dependency-cruiser.js`)
- [x] Scripts added to `package.json`
- [x] Pre-commit hook configured
- [ ] Read this entire document
- [ ] Run baseline: `npm run quality`
- [ ] Create branch: `git checkout -b refactor/level-1-foundation`

### First Task

**Start with:** Level 1, Step 1.1 - Extract Magic Numbers

```bash
# 1. Create branch
git checkout -b refactor/extract-constants

# 2. Run baseline
npm run quality  # Should pass

# 3. Make changes
# ... edit files ...

# 4. Validate
npm run quality

# 5. Commit
git add .
git commit -m "refactor: extract magic numbers to constants"
```

---

*Last updated: February 12, 2026*  
*Target completion: April 2026 (12 weeks)*  
*Review weekly during refactoring*
