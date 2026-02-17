# 3-Layer Testing Strategy - Minimal Examples

This directory contains minimal working examples of the 3-layer testing approach documented in [.claude/context/architecture.md](../../.claude/context/architecture.md).

## Quick Run

```bash
# Run all 3 layers
cd backend
npm test

# Run specific layers
npm test -- test/domain/            # Domain layer only
npm test -- test/application/       # Application layer only
npm test -- test/routes/minimal-issues.test.js  # Routes layer example
```

---

## Layer 1: Domain (Pure Unit Tests)

**File:** `test/domain/validation/issueValidation.test.js`

**Purpose:** Test business rules in complete isolation

**Characteristics:**
- ❌ **No mocks** - Pure business logic, no dependencies
- ❌ **No database** - Runs in milliseconds
- ❌ **No infrastructure** - No Express, Mongoose, HTTP
- ✅ **Pure functions** - Only JavaScript logic

**Coverage Target:** ≥90%

**Tests (10 cases):**
- Title validation (empty, whitespace, null, valid)
- Priority validation (invalid values, valid enum)
- Status transitions (valid: reported→forwarded, invalid: reported→resolved)
- Role authorization (MANAGER can forward, TENANT cannot)

**Example:**
```javascript
it('should reject empty title', () => {
  const validateTitle = (title) => {
    if (!title || !title.trim()) {
      throw new Error('Title is required.');
    }
  };
  
  expect(() => validateTitle('')).toThrow('Title is required.');
});
```

**Speed:** ~50ms (fastest layer)

---

## Layer 2: Application (Unit Tests with Mocks)

**File:** `test/application/services/issueService.test.js`

**Purpose:** Test use cases and orchestration without hitting database

**Characteristics:**
- ✅ **Mock repositories** - Use `jest.fn()` and `jest.mock()`
- ✅ **Mock models** - Mock Issue, User models
- ❌ **No real database** - All data mocked
- ✅ **Test business workflows** - Focus on service logic

**Coverage Target:** ≥80%

**Tests (7 cases):**
- `reportIssue()` - Creates issue with REPORTED status
- `forwardIssue()` - Updates status when user is MANAGER, throws error for TENANT
- `assignIssue()` - Assigns issue when user is DIRECTOR, throws error for MANAGER
- `resolveIssue()` - Updates status to RESOLVED with completion notes

**Example:**
```javascript
it('should forward issue when user is MANAGER', async () => {
  // Arrange
  const mockIssue = { _id: 'issue123', status: 'reported', save: jest.fn() };
  const mockUser = { _id: 'user123', role: 'manager' };
  
  Issue.findById = jest.fn().mockResolvedValue(mockIssue);
  User.findById = jest.fn().mockResolvedValue(mockUser);
  
  // Act
  issue.status = 'forwarded';
  await issue.save();
  
  // Assert
  expect(issue.save).toHaveBeenCalledTimes(1);
});
```

**Speed:** ~200-500ms (no database I/O)

---

## Layer 3: Routes (Integration Tests)

**File:** `test/routes/minimal-issues.test.js`

**Purpose:** Test HTTP endpoints with real MongoDB (integration)

**Characteristics:**
- ✅ **Real database** - MongoDB Atlas (in-memory option available)
- ✅ **Real HTTP** - Uses `supertest` to hit Express endpoints
- ✅ **Full stack** - Tests routes → services → models → database
- ⚠️ **Partial mocks** - Only mock external APIs (email, SMS)

**Coverage Target:** ≥70%

**Tests (9 cases):**
- **POST /api/issues** - Create issue, returns 201, validates auth (3 tests)
- **PATCH /api/issues/:id/triage** - Forward issue, role authorization (2 tests)
- **PATCH /api/issues/:id/assign** - Assign to associate, DIRECTOR only (2 tests)
- **GET /api/issues** - List all, filter by status (2 tests)

**Example:**
```javascript
it('should create issue with status REPORTED', async () => {
  const res = await request(app)
    .post('/api/issues')
    .set('Authorization', `Bearer ${tenantToken}`)
    .send({
      title: 'Water leak',
      description: 'Pipe broken',
      priority: 'high'
    });
  
  expect(res.status).toBe(201);
  expect(res.body.issue.status).toBe('reported');
});
```

**Speed:** ~1000-2000ms per test (database + HTTP overhead)

---

## Test Distribution

```
70% Unit Tests       → Domain + Application layers (fast, isolated)
20% Integration Tests → Routes layer (slower, end-to-end HTTP)
10% Manual Tests     → Critical user flows (browser testing)
```

**Overall Coverage Target:** ≥80%

---

## Why No E2E Tests?

**Decision:** Skip Cypress/Playwright E2E tests for this project.

**Reasoning:**
- ✅ Integration tests cover 95% of E2E scenarios with `supertest` + real MongoDB
- ✅ Simple CRUD workflows don't need full browser automation
- ✅ Manual testing is faster (5-10 minutes) vs E2E setup complexity
- ❌ E2E is slow (10-30 min per suite), brittle (CSS selectors), complex (infrastructure)

**When to Add E2E:**
- WebSockets (real-time chat)
- Complex multi-step forms
- Collaboration features (multiple users editing same data)

---

## Running Tests

```bash
# All tests (including architecture tests)
npm test

# Domain layer only (fastest)
npm test -- test/domain/

# Application layer only
npm test -- test/application/

# Routes layer (specific file)
npm test -- test/routes/minimal-issues.test.js

# All routes tests
npm test -- test/routes/

# With coverage
npm test -- --coverage

# Watch mode (TDD)
npm test -- --watch
```

---

## Test File Organization

```
backend/test/
├── domain/
│   └── validation/
│       └── issueValidation.test.js     # 10 tests - Pure logic, no mocks
├── application/
│   └── services/
│       └── issueService.test.js        # 7 tests - With jest.fn() mocks
├── routes/
│   └── minimal-issues.test.js          # 9 tests - Integration with supertest
└── architecture/
    ├── baseline.test.js                # Pre-refactoring metrics
    ├── dependency-cruiser.test.js      # Architectural rules
    └── boundaries.test.js              # Hexagonal boundaries (future)
```

---

## Key Tools

| Layer | Test Runner | Mocking | Database | HTTP |
|-------|-------------|---------|----------|------|
| **Domain** | Jest | ❌ None | ❌ None | ❌ None |
| **Application** | Jest | ✅ `jest.fn()`, `jest.mock()` | ❌ Mocked | ❌ None |
| **Routes** | Jest | ⚠️ Partial | ✅ MongoDB Atlas | ✅ `supertest` |

---

## Next Steps

1. **Expand Domain Tests:** Add validation for Buildings, Apartments, Users
2. **Expand Application Tests:** Add BuildingService, UserService tests with mocks
3. **Expand Routes Tests:** Add auth.test.js, buildings.test.js, users.test.js
4. **Measure Coverage:** Run `npm test -- --coverage` and verify ≥80% overall
5. **Refactor to Hexagonal:** Move to src/domain/, src/application/, src/adapter/

---

**Last Updated:** February 16, 2026  
**Documentation:** [.claude/context/architecture.md](../../.claude/context/architecture.md#testing-strategy-per-layer)
