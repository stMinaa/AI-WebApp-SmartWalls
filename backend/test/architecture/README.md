# Architectural Testing & Quality Gates

This directory contains automated tests that enforce hexagonal architecture boundaries and code quality rules.

---

## 🎯 Purpose

**Prevent architectural violations BEFORE they enter the codebase:**
- ❌ Domain layer importing Express/Mongoose
- ❌ Use cases importing HTTP adapters
- ❌ Controllers accessing database directly
- ❌ Circular dependencies
- ❌ Overly complex functions
- ❌ React hooks violations

---

## 📁 Test Structure

```
backend/test/
├── architecture/
│   └── boundaries.test.js    # Hexagonal architecture rules
├── auth.test.js              # Integration tests
├── manager.test.js
└── ...
```

---

## 🚀 Running Tests

### Quick Check (During Development)
```bash
npm run test:arch
```

**Output:**
```
🏛️ Hexagonal Architecture - Layer Boundaries
  Domain Layer Purity
    ✓ should NOT import Express in domain layer
    ✓ should NOT import Mongoose in domain layer
    ✓ should NOT import infrastructure adapters
  
  Application Layer Boundaries
    ✓ should NOT import HTTP adapters in use cases
    ✓ should use repositories via interfaces
  
  Controller Layer
    ✓ should NOT import Mongoose models
    ✓ should use dependency injection

  File Size Constraints
    ✓ should keep files under 300 lines

✅ 8 tests passed
```

### Full Quality Check
```bash
npm run quality
```

Runs:
1. ESLint (layer boundaries)
2. Dependency-cruiser (import violations)
3. Architectural tests
4. CodeScene (optional)

---

## 🔒 What Gets Blocked

### Example 1: Domain importing infrastructure
```javascript
// ❌ BLOCKED - Test fails, ESLint errors
// backend/src/domain/issues/Issue.js
const mongoose = require('mongoose');

class Issue {
  save() {
    return mongoose.model('Issue').save(this);
  }
}
```

**Error:**
```
FAIL backend/test/architecture/boundaries.test.js
  ● Domain Layer Purity › should NOT import Mongoose

  expect(content).not.toContain("require('mongoose')")
  
  Expected: not "require('mongoose')"
  Received: "require('mongoose')"
```

**Fix:**
```javascript
// ✅ PASSES - Pure domain logic
class Issue {
  complete(associateId, cost) {
    this._ensureIsInProgress();
    this._ensureIsAssignedTo(associateId);
    this.status = IssueStatus.RESOLVED;
    this.cost = cost;
  }
}
```

---

### Example 2: Use case importing controller
```javascript
// ❌ BLOCKED - Test fails
// backend/src/application/issues/CompleteIssueUseCase.js
const IssueController = require('../../adapters/http/controllers/IssueController');

class CompleteIssueUseCase {
  // ...
}
```

**Error:**
```
FAIL backend/test/architecture/boundaries.test.js
  ● Application Layer › should NOT import HTTP adapters

  Use cases must not know about HTTP layer
```

**Fix:**
```javascript
// ✅ PASSES - Depends on interfaces
class CompleteIssueUseCase {
  constructor(issueRepository, invoiceRepository) {
    this.issueRepository = issueRepository;
    this.invoiceRepository = invoiceRepository;
  }
}
```

---

### Example 3: Controller accessing models directly
```javascript
// ❌ BLOCKED - Test fails
// backend/src/adapters/http/controllers/IssueController.js
const Issue = require('../../../models/Issue');

class IssueController {
  async complete(req, res) {
    const issue = await Issue.findById(req.params.id);
    // ...
  }
}
```

**Error:**
```
FAIL backend/test/architecture/boundaries.test.js
  ● Controller Layer › should NOT import Mongoose models

  Controllers must call use cases, not access database
```

**Fix:**
```javascript
// ✅ PASSES - Uses use case
class IssueController {
  constructor({ completeIssueUseCase }) {
    this.completeIssueUseCase = completeIssueUseCase;
  }
  
  async complete(req, res) {
    const result = await this.completeIssueUseCase.execute({
      issueId: req.params.id,
      cost: req.body.cost
    });
    // ...
  }
}
```

---

## 🛠️ During Migration

### Phase 1: Old Structure (Currently)
```
backend/
├── index.js              # Monolith (2,078 lines)
├── services/             # Business logic
├── routes/               # HTTP handlers
└── models/               # Mongoose schemas
```

**Tests:** Skip (structure not yet created)
```javascript
if (!fs.existsSync('backend/src/domain')) {
  console.log('⏭️  Domain layer not yet created - skipping');
  return;
}
```

---

### Phase 2: Parallel Development
```
backend/
├── index.js              # Still working
├── services/             # Still working
└── src/                  # NEW - Hexagonal structure
    ├── domain/           # Tests ACTIVE here
    ├── application/
    ├── ports/
    └── adapters/
```

**Tests:** Validate new code only
- ✅ New structure follows rules
- ⏭️ Old structure ignored (legacy overrides in ESLint)

---

### Phase 3: Full Migration
```
backend/
├── index.js              # < 100 lines (bootstrap only)
└── src/                  # All logic here
    ├── domain/
    ├── application/
    ├── ports/
    └── adapters/
```

**Tests:** Enforce everywhere
- ✅ All code follows hexagonal rules
- ✅ No exceptions

---

## 🔧 Adding New Tests

### Step 1: Identify Rule
Example: "Use cases should not import validation libraries directly"

### Step 2: Add Test
```javascript
// backend/test/architecture/boundaries.test.js

it('should NOT import joi/yup in use cases', () => {
  const useCaseFiles = findFilesInDir('backend/src/application', '.js');
  
  useCaseFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    expect(content).not.toContain("require('joi')");
    expect(content).not.toContain("require('yup')");
  });
});
```

### Step 3: Run Test
```bash
npm run test:arch
```

### Step 4: Fix Violations
Move validation to validators, inject via constructor

---

## 📊 Integration with CI/CD

### GitHub Actions
Runs on every push/PR:
```yaml
- name: Run architectural tests
  run: npm run test:arch
```

Blocks merge if:
- ❌ Any architectural test fails
- ❌ ESLint boundary violations
- ❌ Dependency-cruiser errors

---

## 🎓 Learning Resources

**Read these for context:**
- [REFACTORING.md](../../docs/standards/REFACTORING.md) - Full migration plan
- [CODE_QUALITY.md](../../docs/standards/CODE_QUALITY.md) - Quality standards
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) - Original article

**Tools documentation:**
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries)
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

## ❓ FAQ

### Q: Tests pass but ESLint fails?
A: Different rules. ESLint checks syntax, tests check file structure.
Run both: `npm run quality`

### Q: Can I skip these tests?
A: No. They prevent architectural violations. If test fails, fix the code.

### Q: Do I need to write these manually?
A: No. Tests are already written. Just run `npm run test:arch`.

### Q: What about legacy code?
A: Legacy code (services/, routes/) has relaxed rules during migration.
New code (src/) must follow strict rules.

### Q: Tests are slow?
A: Architectural tests are fast (~2 seconds). If slow, check:
- Are you running full test suite? Use `npm run test:arch` not `npm test`
- Is your file tree large? Tests scan directories.

---

*Last updated: February 12, 2026*
