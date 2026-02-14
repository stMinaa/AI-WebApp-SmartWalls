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
