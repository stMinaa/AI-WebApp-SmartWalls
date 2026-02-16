# Architecture & Refactoring Standards

**Source:** Extracted from `docs/standards/REFACTORING.md`

---

## 🚨 REFACTORING RULES (NON-NEGOTIABLE)

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

---

## Enforcement Timeline

### Phase 1: NOW (Pre-refactoring)
- ✅ All tools installed and configured
- 🔓 Pre-commit hook: Frontend build only (lenient)
- 💡 Manual checks: `npm run quality` anytime (optional)
- 📚 Documentation ready

### Phase 2: Level 1-2 (Easy refactoring)
- 🟡 Activate ESLint in pre-commit hook
- 🔍 Enforce: Code complexity < 9, function length < 50 lines

### Phase 3: Level 3+ (Hexagonal structure)
- 🔴 Activate full architectural tests in pre-commit
- 🏛️ Enforce: Domain purity, layer boundaries, import restrictions
- 🚫 Blocks commits violating hexagonal rules

**Activation Point:** When creating `backend/src/domain/` folder

---

## Automated Quality Gates

### Before Every Commit (Current)

```bash
# Automatic via pre-commit hook
✓ Frontend build check

# Manual (recommended)
npm run quality  # Lint + arch tests (optional)
```

### After Level 3 (Hexagonal Structure Created)

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

---

## Pre-Commit Hook Phases

### Phase 1: Pre-refactoring (NOW)
```bash
git commit -m "..."
🔍 Running quality checks...
📦 Checking frontend build...
✅ All checks passed!
💡 Tip: Run 'npm run quality' manually
```

### Phase 2-3: During refactoring (Level 3+)
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

## Hexagonal Architecture (Target Structure)

### Goal: Clean Separation of Concerns

```
backend/
├── src/
│   ├── domain/              # Core business logic (NO external dependencies)
│   │   ├── entities/        # User, Building, Apartment, Issue
│   │   ├── value-objects/   # Email, Address, Money
│   │   ├── repositories/    # Interfaces only (ports)
│   │   └── services/        # Domain services (pure business logic)
│   │
│   ├── application/         # Use cases (orchestration)
│   │   ├── use-cases/       # CreateBuilding, AssignManager, ReportIssue
│   │   ├── dtos/            # Data transfer objects
│   │   └── ports/           # Input/output ports
│   │
│   ├── infrastructure/      # External concerns (adapters)
│   │   ├── database/        # Mongoose models & repositories
│   │   ├── http/            # Express routes & controllers
│   │   ├── auth/            # JWT, bcrypt
│   │   └── config/          # Environment, database config
│   │
│   └── index.js             # Application entry point
│
└── test/                    # Tests (mirrors src/ structure)
```

### Dependency Rules

**Domain Layer:**
- ✅ Can depend on: NOTHING (100% pure business logic)
- ❌ Cannot import: Express, Mongoose, JWT, bcrypt, axios, etc.

**Application Layer:**
- ✅ Can depend on: Domain
- ❌ Cannot import: Express, Mongoose (only through ports)

**Infrastructure Layer:**
- ✅ Can depend on: Domain, Application
- ✅ Can import: Express, Mongoose, JWT, bcrypt, etc.

---

### Layer Details & Responsibilities

#### Adapters Layer (Infrastructure)
**External world integration - frameworks, databases, APIs**

- **Database Adapters:** Mongoose implementations, repository implementations
- **API Adapters:** Express routes, controllers, HTTP concerns
- **External Service Adapters:** Email clients, SMS providers, payment gateways
- **Ports:** Interfaces that define boundaries between layers

**Key principle:** Adapters implement ports defined by inner layers

#### Application Layer
**Orchestration of use cases**

- **Services:** Coordinate domain logic and external operations
- **Use Case Orchestration:** Execute business workflows
- **DTOs:** Data transfer between layers
- **Ports:** Define interfaces for infrastructure dependencies

**Key principle:** No framework dependencies, only domain and port interfaces

#### Domain Layer (Center)
**Pure business logic - the heart of the application**

- **Entities:** Core business objects (User, Building, Apartment, Issue)
- **Value Objects:** Immutable domain concepts (Email, Money, Address)
- **Domain Services:** Pure functions, business rules
- **Exceptions:** Domain-specific errors
- **Ports (Interfaces):** Define what domain needs from outside world

**Key principles:**
- ✅ Pure functions only
- ✅ No framework dependencies (NO Express, NO Mongoose, NO external libs)
- ✅ No annotations, no decorators
- ✅ Clean objects only
- ✅ No mocking needed (pure logic)
- ✅ 100% testable without infrastructure

**DEPENDENCIES ALWAYS FLOW TOWARD CENTER (DOMAIN)**
- Domain depends on NOTHING
- Everything else depends on Domain
- Domain knows NOTHING about any framework

---

### Folder Structure Example

```
backend/
├── src/
│   ├── domain/                    # INNER CIRCLE - Pure business logic
│   │   ├── model/                 # Entities & value objects
│   │   │   ├── User.js
│   │   │   ├── Building.js
│   │   │   ├── Issue.js
│   │   │   └── valueObjects/
│   │   │       ├── Email.js
│   │   │       └── Money.js
│   │   ├── port/                  # Interfaces (what domain needs)
│   │   │   ├── IUserRepository.js
│   │   │   ├── IEmailService.js
│   │   │   └── INotificationService.js
│   │   ├── service/               # Pure domain services
│   │   │   ├── IssueValidator.js  # Pure validation logic
│   │   │   ├── RolePermissions.js # Pure authorization rules
│   │   │   └── PriceCalculator.js # Pure calculation logic
│   │   └── exception/             # Domain errors
│   │       ├── ValidationError.js
│   │       └── AuthorizationError.js
│   │
│   ├── application/               # MIDDLE CIRCLE - Use case orchestration
│   │   └── service/               # Coordinate domain + infrastructure
│   │       ├── UserService.js     # Orchestrates user operations
│   │       ├── IssueService.js    # Orchestrates issue workflows
│   │       └── BuildingService.js # Orchestrates building operations
│   │
│   └── adapter/                   # OUTER CIRCLE - External world
│       ├── persistence/           # Database implementations
│       │   ├── MongoUserRepository.js    # Implements IUserRepository
│       │   ├── MongoIssueRepository.js   # Implements IIssueRepository
│       │   └── models/                   # Mongoose schemas
│       │       ├── UserModel.js
│       │       └── IssueModel.js
│       └── external/              # External services
│           ├── EmailServiceImpl.js       # Implements IEmailService
│           └── SMSServiceImpl.js         # Implements ISMSService
```

---

### When to Use Which Pattern?

#### Full Hexagonal (Domain + Application + Adapters)
**Use for:**
- ✅ Complex business logic
- ✅ Multiple external integrations (payment, email, SMS, etc.)
- ✅ Logic that needs to be framework-agnostic
- ✅ Long-term maintainability critical
- ✅ High test coverage required

**Example:** Issue lifecycle management with notifications, payments, approvals

#### Application Facade (Simplified)
**Use for:**
- ✅ Simple logic
- ✅ Basic coordination between domain and infrastructure
- ✅ CRUD operations without complex rules
- ✅ Limited external dependencies

**Example:** Basic user profile updates, simple list/detail operations

**Don't force full hexagonal for every simple operation!**

---

## SOLID Principles

### Single Responsibility Principle (SRP)
**Each class/function has ONE reason to change**

```javascript
// ❌ BAD - Multiple responsibilities
class UserService {
  async createUser(data) {
    // Validate
    if (!data.email) throw new Error('Email required');
    
    // Hash password
    const hashed = await bcrypt.hash(data.password, 10);
    
    // Save to database
    const user = await User.create({ ...data, password: hashed });
    
    // Send email
    await emailService.sendWelcome(user.email);
    
    return user;
  }
}

// ✅ GOOD - Single responsibility
class CreateUserUseCase {
  constructor(userRepository, passwordHasher, emailService) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.emailService = emailService;
  }
  
  async execute(data) {
    const user = new User(data);
    user.hashPassword(this.passwordHasher);
    await this.userRepository.save(user);
    await this.emailService.sendWelcome(user.email);
    return user;
  }
}
```

---

### Open/Closed Principle (OCP)
**Open for extension, closed for modification**

```javascript
// ❌ BAD - Must modify class to add new notification type
class NotificationService {
  async send(user, message) {
    if (user.preferredChannel === 'email') {
      await this.sendEmail(user.email, message);
    } else if (user.preferredChannel === 'sms') {
      await this.sendSMS(user.phone, message);
    }
    // Adding new channel requires modifying this class
  }
}

// ✅ GOOD - Can add new notifiers without changing service
class NotificationService {
  constructor(notifiers) {
    this.notifiers = notifiers;  // Array of notifier implementations
  }
  
  async send(user, message) {
    const notifier = this.notifiers.find(n => n.supports(user));
    await notifier.send(user, message);
  }
}

class EmailNotifier {
  supports(user) { return user.preferredChannel === 'email'; }
  async send(user, message) { /* email logic */ }
}

class SMSNotifier {
  supports(user) { return user.preferredChannel === 'sms'; }
  async send(user, message) { /* sms logic */ }
}
```

---

### Liskov Substitution Principle (LSP)
**Subtypes must be substitutable for base types**

```javascript
// ❌ BAD - Violates LSP (pending user can't do what active user can)
class User {
  async reportIssue(issue) {
    return await Issue.create(issue);
  }
}

class PendingUser extends User {
  async reportIssue(issue) {
    throw new Error('Pending users cannot report issues');
  }
}

// ✅ GOOD - Status as strategy pattern
class User {
  constructor(status) {
    this.status = status;  // ActiveStatus or PendingStatus
  }
  
  async reportIssue(issue) {
    return await this.status.reportIssue(this, issue);
  }
}

class ActiveStatus {
  async reportIssue(user, issue) {
    return await Issue.create(issue);
  }
}

class PendingStatus {
  async reportIssue(user, issue) {
    throw new Error('Account pending approval');
  }
}
```

---

### Interface Segregation Principle (ISP)
**Clients shouldn't depend on interfaces they don't use**

```javascript
// ❌ BAD - Large interface, not all methods relevant
interface UserRepository {
  findById(id);
  findByEmail(email);
  findByUsername(username);
  findTenantsByBuilding(buildingId);
  findManagersByStatus(status);
  save(user);
  delete(id);
}

// ✅ GOOD - Smaller, focused interfaces
interface UserFinder {
  findById(id);
  findByEmail(email);
}

interface TenantFinder {
  findByBuilding(buildingId);
}

interface ManagerFinder {
  findByStatus(status);
}

interface UserPersistence {
  save(user);
  delete(id);
}
```

---

### Dependency Inversion Principle (DIP)
**Depend on abstractions, not concretions**

```javascript
// ❌ BAD - Use case depends on concrete implementation
class CreateBuildingUseCase {
  async execute(data) {
    const building = new Building(data);
    await MongooseBuildingRepository.save(building);  // Concrete dependency
    return building;
  }
}

// ✅ GOOD - Use case depends on abstraction (port)
class CreateBuildingUseCase {
  constructor(buildingRepository) {
    this.buildingRepository = buildingRepository;  // Abstract interface
  }
  
  async execute(data) {
    const building = new Building(data);
    await this.buildingRepository.save(building);
    return building;
  }
}

// Infrastructure provides concrete implementation
class MongooseBuildingRepository implements BuildingRepository {
  async save(building) {
    return await BuildingModel.create(building);
  }
}
```

---

## Progressive Refactoring Plan

### Level 0: Current (Monolithic)
```
backend/
├── index.js        # All routes + logic
├── models/         # Mongoose schemas
├── services/       # Some business logic
└── test/           # Tests
```

**Status:** Working, but tightly coupled

---

### Level 1: Extract Routes
```
backend/
├── index.js        # Server setup only
├── routes/         # Separate route files
│   ├── auth.js
│   ├── buildings.js
│   ├── issues.js
│   └── users.js
├── models/
├── services/
└── test/
```

**Commit:** `[BLUE] Extract routes into separate files`

---

### Level 2: Extract Controllers
```
backend/
├── index.js
├── routes/
│   └── buildings.js    # Only route definitions
├── controllers/        # NEW
│   └── BuildingController.js  # Request/response handling
├── services/           # Business logic
├── models/
└── test/
```

**Commit:** `[BLUE] Extract controllers from routes`

---

### Level 3: Introduce Hexagonal Structure
```
backend/
├── src/
│   ├── domain/              # NEW
│   │   ├── entities/
│   │   └── repositories/    # Interfaces
│   ├── application/         # NEW
│   │   └── use-cases/
│   ├── infrastructure/      # NEW
│   │   ├── database/        # Mongoose
│   │   └── http/            # Express
│   └── index.js
└── test/
```

**Commit:** `[BLUE] Setup hexagonal architecture structure`

**Activate:** Full architectural tests in pre-commit hook

---

### Level 4: Migrate One Feature
```
src/
├── domain/
│   ├── entities/
│   │   └── Building.js              # Pure entity
│   └── repositories/
│       └── IBuildingRepository.js   # Interface
├── application/
│   └── use-cases/
│       └── CreateBuilding.js        # Use case
└── infrastructure/
    ├── database/
    │   └── MongooseBuildingRepository.js  # Implementation
    └── http/
        ├── routes/
        │   └── buildings.js
        └── controllers/
            └── BuildingController.js
```

**Commit:** `[BLUE] Migrate Building feature to hexagonal architecture`

---

### Level 5: Migrate All Features
Repeat Level 4 for: Users, Issues, Apartments, Notices, Polls

---

### Level 6: Remove Old Code
Delete legacy `models/`, `services/`, move everything to `src/`

**Commit:** `[BLUE] Complete hexagonal migration - remove legacy code`

---

## ArchUnit - Provera Arhitektonskih Pravila

### Overview
**ArchUnit-style testing** enforces architectural boundaries at build/test time, preventing violations before they reach production.

**Goal:** Automatically verify that:
- Domain layer never imports framework code
- Dependencies flow toward domain (center)
- Layer boundaries are respected
- No circular dependencies exist

---

### Tools for Node.js/JavaScript

#### 1. **dependency-cruiser** (RECOMMENDED)
**Best for:** Dependency rule enforcement, circular dependency detection

```bash
npm install -D dependency-cruiser
```

**Configuration:** `.dependency-cruiser.js`
```javascript
module.exports = {
  forbidden: [
    {
      name: 'domain-no-infrastructure',
      comment: 'Domain must not depend on infrastructure',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/(infrastructure|adapter)' }
    },
    {
      name: 'domain-no-frameworks',
      comment: 'Domain must not import Express or Mongoose',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: 'express|mongoose|bcrypt|jsonwebtoken' }
    },
    {
      name: 'application-no-express',
      comment: 'Application layer must not import Express',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: 'express' }
    },
    {
      name: 'no-circular',
      comment: 'Prevent circular dependencies',
      severity: 'error',
      from: {},
      to: { circular: true }
    }
  ]
};
```

**Usage:**
```bash
# Check architecture
npx depcruise --validate .dependency-cruiser.js src

# Generate dependency graph
npx depcruise --include-only "^src" --output-type dot src | dot -T svg > dependencies.svg
```

**Add to package.json:**
```json
{
  "scripts": {
    "deps:check": "depcruise --validate .dependency-cruiser.js src",
    "deps:graph": "depcruise --include-only '^src' --output-type dot src | dot -T svg > dependencies.svg"
  }
}
```

---

#### 2. **eslint-plugin-boundaries**
**Best for:** Import path restrictions, enforcing module boundaries

```bash
npm install -D eslint-plugin-boundaries
```

**Configuration:** `.eslintrc.js`
```javascript
module.exports = {
  plugins: ['boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'domain', pattern: 'src/domain/**' },
      { type: 'application', pattern: 'src/application/**' },
      { type: 'infrastructure', pattern: 'src/infrastructure/**' }
    ]
  },
  rules: {
    'boundaries/element-types': [2, {
      default: 'disallow',
      rules: [
        { from: 'domain', allow: ['domain'] },              // Domain only imports domain
        { from: 'application', allow: ['domain'] },         // App imports domain
        { from: 'infrastructure', allow: ['domain', 'application'] }  // Infra imports all
      ]
    }]
  }
};
```

---

#### 3. **Custom Jest Tests** (SIMPLEST - Start Here)
**Best for:** Quick start, custom validation rules

```javascript
// test/architecture/architecture.test.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

describe('Architectural Rules', () => {
  
  describe('Domain Layer Purity', () => {
    
    it('Domain must not import Express', () => {
      const domainFiles = glob.sync('src/domain/**/*.js');
      
      domainFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const hasExpress = /require\(['"]express['"]\)|from ['"]express['"]/.test(content);
        
        if (hasExpress) {
          throw new Error(`${file} imports Express (violates domain purity)`);
        }
      });
    });
    
    it('Domain must not import Mongoose', () => {
      const domainFiles = glob.sync('src/domain/**/*.js');
      
      domainFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const hasMongoose = /require\(['"]mongoose['"]\)|from ['"]mongoose['"]/.test(content);
        
        if (hasMongoose) {
          throw new Error(`${file} imports Mongoose (violates domain purity)`);
        }
      });
    });
    
    it('Domain must not import infrastructure', () => {
      const domainFiles = glob.sync('src/domain/**/*.js');
      
      domainFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        // Check for imports from ../infrastructure or ../adapter
        const hasInfraImport = /require\(['"].*\/(infrastructure|adapter)\//.test(content) ||
                               /from ['"].*\/(infrastructure|adapter)\//.test(content);
        
        if (hasInfraImport) {
          throw new Error(`${file} imports from infrastructure (wrong dependency direction)`);
        }
      });
    });
    
  });
  
  describe('Application Layer Rules', () => {
    
    it('Application must not import Express', () => {
      const appFiles = glob.sync('src/application/**/*.js');
      
      appFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const hasExpress = /require\(['"]express['"]\)|from ['"]express['"]/.test(content);
        
        if (hasExpress) {
          throw new Error(`${file} imports Express (should use ports)`);
        }
      });
    });
    
  });
  
  describe('Naming Conventions', () => {
    
    it('Repository interfaces should start with I', () => {
      const portFiles = glob.sync('src/domain/port/**/*Repository.js');
      
      portFiles.forEach(file => {
        const filename = path.basename(file, '.js');
        if (!filename.startsWith('I')) {
          throw new Error(`${file} should start with I (e.g., IUserRepository)`);
        }
      });
    });
    
    it('Service implementations should end with Service', () => {
      const serviceFiles = glob.sync('src/application/service/**/*.js');
      
      serviceFiles.forEach(file => {
        const filename = path.basename(file, '.js');
        if (!filename.endsWith('Service') && filename !== 'index') {
          throw new Error(`${file} should end with Service`);
        }
      });
    });
    
  });
  
});
```

**Add to package.json:**
```json
{
  "scripts": {
    "test:arch": "jest test/architecture --testTimeout=10000"
  }
}
```

---

### Recommended Rules to Enforce

#### Critical (Implement First)
- ✅ Domain must not import Express
- ✅ Domain must not import Mongoose
- ✅ Domain must not import infrastructure/adapter layers
- ✅ Application must not import Express (only through ports)

#### Important (Implement at Level 3)
- ✅ No circular dependencies
- ✅ Infrastructure can only implement ports from domain/application
- ✅ All repository implementations must implement an interface

#### Nice to Have (Implement at Level 5+)
- ✅ Naming conventions (IRepository, *Service, *Entity)
- ✅ Folder structure validation
- ✅ Test coverage per layer (domain ≥ 90%, application ≥ 80%)

---

### Integration with Pre-Commit Hook

**Phase 1 (NOW):** Tests exist, run manually
```bash
npm run test:arch  # Manual
npm run deps:check # Manual
```

**Phase 2 (Level 3+):** Add to pre-commit hook

Edit `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Existing checks...
echo "🏛️  Running architectural tests..."
npm run test:arch || exit 1

echo "📦 Checking dependencies..."
npm run deps:check || exit 1
```

---

### When to Activate

| Phase | ArchUnit Rules | Status |
|-------|----------------|--------|
| **Pre-refactoring (NOW)** | Not active | Write tests, don't enforce |
| **Level 1-2** | Custom Jest tests | Run manually |
| **Level 3** | Full enforcement | Block commits |
| **Level 4+** | dependency-cruiser | Full automation |

---

### Example: Full Setup

```bash
# 1. Install tools
npm install -D dependency-cruiser eslint-plugin-boundaries glob

# 2. Create architectural tests
mkdir -p test/architecture
# (add custom Jest tests from above)

# 3. Create dependency-cruiser config
# (add .dependency-cruiser.js from above)

# 4. Add scripts to package.json
npm pkg set scripts.test:arch="jest test/architecture"
npm pkg set scripts.deps:check="depcruise --validate .dependency-cruiser.js src"
npm pkg set scripts.deps:graph="depcruise --include-only '^src' --output-type dot src | dot -T svg > deps.svg"

# 5. Test manually
npm run test:arch
npm run deps:check

# 6. Activate in pre-commit (when ready)
# Edit .husky/pre-commit (uncomment arch test lines)
```

---

## Architectural Tests (Example)

```javascript
// test/architecture/domain-purity.test.js
const path = require('path');
const fs = require('fs');

describe('Domain Layer Purity', () => {
  it('should not import Express', () => {
    const domainFiles = getAllFilesInDirectory('src/domain');
    
    domainFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain("require('express')");
      expect(content).not.toContain("from 'express'");
    });
  });
  
  it('should not import Mongoose', () => {
    const domainFiles = getAllFilesInDirectory('src/domain');
    
    domainFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain("require('mongoose')");
      expect(content).not.toContain("from 'mongoose'");
    });
  });
});
```

---

## Testing Strategy (Per Layer)

### Overview

This project uses a **3-layer testing approach** adapted from Spring Boot patterns to Node.js/Express/MongoDB stack. We focus on **Domain**, **Application**, and **Routes** layers, with minimal manual testing for critical user flows.

**❌ NO E2E Tests:** For simple CRUD workflows with single-user scenarios, integration testing with `supertest` and in-memory MongoDB provides sufficient coverage without the complexity of full E2E suites (Cypress/Playwright).

---

### Testing Stack Comparison

| Framework | Node.js/Express (THIS PROJECT) | Spring Boot/Kotlin (Reference) |
|-----------|-------------------------------|-------------------------------|
| **Test Runner** | Jest | JUnit 5 |
| **Mocking** | `jest.fn()`, `jest.mock()` | MockK |
| **Integration** | `supertest` + `@shelf/jest-mongodb` | `@SpringBootTest` + TestContainers |
| **DB** | MongoDB (in-memory) | MySQL (in-memory) |
| **E2E** | ❌ None (not needed) | ❌ None (not needed) |

---

### Testing Stack by Layer

| Layer | Tools | Mocking | Coverage Target | What to Test |
|-------|-------|---------|----------------|--------------|
| **Domain** | Jest | ❌ No mocks (pure logic) | **≥ 90%** | Business rules, validation, entities, value objects |
| **Application** | Jest + `jest.fn()` | ✅ Mock repositories/ports | **≥ 80%** | Use cases, orchestration, business workflows |
| **Routes** | Jest + `supertest` + `@shelf/jest-mongodb` | ⚠️ Partial (mock external APIs only) | **≥ 70%** | HTTP endpoints, request/response, auth, status codes |
| **Manual** | Browser (Chrome/Firefox) | N/A | N/A | Critical user flows (login, issue creation, voting) |

---

### Test Distribution Target

```
70% Unit Tests       → Domain + Application layers (fast, isolated)
20% Integration Tests → Routes layer (with real HTTP + in-memory DB)
10% Manual Tests     → Critical flows (login, CRUD, role switching)
```

**Overall Coverage Target:** ≥ 80%

---

### Domain Layer Testing (Pure Unit Tests)

**Purpose:** Validate business rules and domain logic in complete isolation.

**No Mocks:** Domain code should not depend on infrastructure (Express, Mongoose), so no mocking is needed.

**Example:**
```javascript
// test/domain/entities/Issue.test.js
const Issue = require('../../../src/domain/entities/Issue');

describe('Issue Entity', () => {
  it('should initialize with PENDING status', () => {
    const issue = new Issue({ title: 'Broken pipe', description: 'Water leak' });
    expect(issue.status).toBe('PENDING');
  });
  
  it('should not allow TENANT to forward issues', () => {
    const issue = new Issue({ title: 'Test' });
    expect(() => issue.forward('TENANT')).toThrow('Only MANAGER can forward');
  });
  
  it('should validate severity is valid enum', () => {
    expect(() => new Issue({ severity: 'INVALID' })).toThrow('Invalid severity');
  });
});
```

**Coverage Target:** ≥ 90% (business logic is critical)

---

### Application Layer Testing (Unit Tests with Mocks)

**Purpose:** Validate use cases and orchestration logic without hitting real databases or external services.

**Mock Repositories:** Use `jest.fn()` to mock repository methods and verify service behavior.

**Example:**
```javascript
// test/application/services/IssueService.test.js
const IssueService = require('../../../src/application/services/IssueService');

describe('IssueService', () => {
  let mockIssueRepo;
  let mockUserRepo;
  let service;
  
  beforeEach(() => {
    mockIssueRepo = {
      findById: jest.fn(),
      save: jest.fn()
    };
    mockUserRepo = {
      findById: jest.fn()
    };
    service = new IssueService(mockIssueRepo, mockUserRepo);
  });
  
  it('should forward issue when user is MANAGER', async () => {
    mockIssueRepo.findById.mockResolvedValue({ id: '123', status: 'PENDING' });
    mockUserRepo.findById.mockResolvedValue({ id: 'user1', role: 'MANAGER' });
    mockIssueRepo.save.mockResolvedValue({ id: '123', status: 'FORWARDED' });
    
    const result = await service.forwardIssue('123', 'user1');
    
    expect(result.status).toBe('FORWARDED');
    expect(mockIssueRepo.save).toHaveBeenCalledTimes(1);
  });
  
  it('should throw error when user is not MANAGER', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'user1', role: 'TENANT' });
    
    await expect(service.forwardIssue('123', 'user1')).rejects.toThrow('Not authorized');
  });
});
```

**Coverage Target:** ≥ 80% (focus on business workflows)

---

### Routes Layer Testing (Integration Tests)

**Purpose:** Validate HTTP endpoints, authentication, request/response handling with real MongoDB (in-memory).

**Tools:** `supertest` for HTTP requests, `@shelf/jest-mongodb` for in-memory database.

**Partial Mocking:** Only mock external APIs (email, SMS, payment gateways). Use real database for routes.

**Example:**
```javascript
// test/routes/issues.test.js
const request = require('supertest');
const app = require('../../../backend/index');
const User = require('../../../backend/models/User');
const Issue = require('../../../backend/models/Issue');

describe('Issues API', () => {
  let authToken;
  
  beforeEach(async () => {
    // Seed test data
    const user = await User.create({ username: 'manager', password: 'Test123!', role: 'MANAGER' });
    const res = await request(app).post('/auth/login').send({ username: 'manager', password: 'Test123!' });
    authToken = res.body.token;
  });
  
  it('POST /issues should create issue', async () => {
    const res = await request(app)
      .post('/issues')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test Issue', description: 'Test', severity: 'HIGH' });
    
    expect(res.status).toBe(201);
    expect(res.body.issue.title).toBe('Test Issue');
    expect(res.body.issue.status).toBe('PENDING');
  });
  
  it('PATCH /issues/:id/forward should require MANAGER role', async () => {
    const issue = await Issue.create({ title: 'Test', description: 'Test', status: 'PENDING' });
    
    const tenantRes = await request(app).post('/auth/login').send({ username: 'tenant', password: 'Test123!' });
    
    const res = await request(app)
      .patch(`/issues/${issue._id}/forward`)
      .set('Authorization', `Bearer ${tenantRes.body.token}`);
    
    expect(res.status).toBe(403);
  });
});
```

**Coverage Target:** ≥ 70% (focus on critical endpoints)

---

### Manual Testing (Critical Flows)

**Purpose:** Verify end-to-end user experience in browser for workflows that are hard to automate.

**When:** Before releases, after major refactoring, when UI changes.

**Critical Flows:**
1. **Login & Role Switching:** Login as TENANT, MANAGER, DIRECTOR (verify dashboards load)
2. **Issue Lifecycle:** TENANT creates → MANAGER forwards → DIRECTOR assigns → ASSOCIATE completes
3. **Building Management:** DIRECTOR creates building → assigns MANAGER → adds apartments
4. **Voting:** DIRECTOR creates poll → TENANTs vote → Poll closes (verify results)
5. **Notices:** MANAGER creates notice for building → TENANTs see notification

**No Automation:** These flows are covered by integration tests, manual testing is for final validation only.

---

### Why No E2E Tests?

**Decision:** Skip Cypress/Playwright E2E tests for this project.

**Reasoning:**
- ✅ **Integration tests cover 95% of E2E scenarios:** `supertest` tests HTTP endpoints with real MongoDB, catching most bugs
- ✅ **Simple workflows:** No complex multi-step workflows requiring full browser automation
- ✅ **Single-user scenarios:** No collaboration features needing multiple browser sessions
- ✅ **Manual testing is fast:** 5-10 minutes to verify critical flows manually
- ❌ **E2E is slow:** 10-30 minutes per test suite run
- ❌ **E2E is brittle:** CSS selectors break on UI changes
- ❌ **E2E is complex:** Requires separate infrastructure (headless browsers, video recording, screenshots)

**When to Add E2E:** If project grows to include WebSockets (real-time chat), complex workflows (multi-step forms), or collaboration features (multiple users editing same data), reconsider E2E.

---

### Mocking Strategy Summary

| Layer | Mock Level | Examples |
|-------|-----------|----------|
| **Domain** | ❌ No mocks | Pure business logic, no dependencies |
| **Application** | ✅ Mock all ports/repos | `jest.fn()` for `IssueRepository`, `UserRepository` |
| **Routes** | ⚠️ Partial mocking | Real MongoDB (in-memory), mock external APIs (email, SMS) |

---

### Running Tests

```bash
# All tests
npm test

# Unit tests only (Domain + Application)
npm test -- --testPathPattern="test/(domain|application)"

# Integration tests only (Routes)
npm test -- --testPathPattern="test/routes"

# Architectural tests
npm run test:arch

# Coverage report
npm test -- --coverage
```

---

### Test File Organization

```
backend/
├── test/
│   ├── domain/
│   │   ├── entities/          # Entity tests (Issue, User, Building)
│   │   ├── value-objects/     # Value object tests (Address, Phone)
│   │   └── services/          # Domain service tests (IssueValidator)
│   ├── application/
│   │   ├── services/          # Use case tests (IssueService, UserService)
│   │   └── workflows/         # Complex workflow tests
│   ├── routes/
│   │   ├── auth.test.js       # Auth endpoints
│   │   ├── issues.test.js     # Issue endpoints
│   │   ├── buildings.test.js  # Building endpoints
│   │   └── users.test.js      # User management endpoints
│   └── architecture/
│       ├── baseline.test.js            # Pre-refactoring metrics
│       ├── dependency-cruiser.test.js  # Architectural rule validation
│       └── boundaries.test.js          # Hexagonal boundaries (future)
```

---

## Complexity Reduction Strategies

### Extract Function
```javascript
// ❌ BEFORE (complexity: 12)
async function processIssue(issueId, action, userId) {
  const issue = await Issue.findById(issueId);
  if (!issue) throw new Error('Issue not found');
  
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  if (action === 'forward') {
    if (user.role !== 'MANAGER') throw new Error('Not authorized');
    issue.status = 'forwarded';
  } else if (action === 'assign') {
    if (user.role !== 'DIRECTOR') throw new Error('Not authorized');
    issue.status = 'assigned';
  } else if (action === 'accept') {
    if (user.role !== 'ASSOCIATE') throw new Error('Not authorized');
    issue.status = 'in-progress';
  }
  
  await issue.save();
  return issue;
}

// ✅ AFTER (complexity: 3 per function)
async function processIssue(issueId, action, userId) {
  const issue = await findIssueOrFail(issueId);
  const user = await findUserOrFail(userId);
  
  validateAction(user, action);
  updateIssueStatus(issue, action);
  
  await issue.save();
  return issue;
}

async function findIssueOrFail(id) {
  const issue = await Issue.findById(id);
  if (!issue) throw new Error('Issue not found');
  return issue;
}

async function findUserOrFail(id) {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  return user;
}

function validateAction(user, action) {
  const permissions = {
    forward: 'MANAGER',
    assign: 'DIRECTOR',
    accept: 'ASSOCIATE'
  };
  
  if (user.role !== permissions[action]) {
    throw new Error('Not authorized');
  }
}

function updateIssueStatus(issue, action) {
  const statusMap = {
    forward: 'forwarded',
    assign: 'assigned',
    accept: 'in-progress'
  };
  
  issue.status = statusMap[action];
}
```

---

## Common Refactoring Patterns

### Extract Configuration
```javascript
// ❌ BEFORE
if (password.length < 6) throw new Error('Password too short');
if (password.length > 50) throw new Error('Password too long');

// ✅ AFTER
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 50;

if (password.length < PASSWORD_MIN_LENGTH) {
  throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
}
```

### Replace Conditionals with Polymorphism
```javascript
// ❌ BEFORE
function getPermissions(role) {
  if (role === 'TENANT') return ['report_issue', 'vote'];
  if (role === 'MANAGER') return ['triage_issue', 'create_notice'];
  if (role === 'DIRECTOR') return ['create_building', 'approve_user'];
}

// ✅ AFTER
const rolePermissions = {
  TENANT: ['report_issue', 'vote'],
  MANAGER: ['triage_issue', 'create_notice'],
  DIRECTOR: ['create_building', 'approve_user']
};

function getPermissions(role) {
  return rolePermissions[role] || [];
}
```

---

**Remember:** Refactoring is NOT feature work. Keep them separate. Test always green.
