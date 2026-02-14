# Code Quality Standards

**Source:** Extracted from `docs/standards/CODE_QUALITY.md`

---

## 🎯 Code Health Targets

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| **Code health score** | **≥ 9.0** | Refactor before committing |
| **Cyclomatic complexity** | **< 9** per function | Extract helper functions |
| **Function length** | **< 50 lines** | Split into smaller functions |
| **File length** | **< 300 lines** | Split into separate files |

**CRITICAL:** These are hard limits. Code violating them must NOT be committed.

---

## CodeScene Commands

### Quick Commands
```bash
# Full project analysis
.\analyze-code.ps1

# Analyze staged changes (BEFORE commit)
cs delta --staged

# Analyze current uncommitted changes
cs delta

# Check specific file
cs check backend/routes/users.js

# Review file with score
cs review backend/routes/users.js

# Find all problems in file
cs check-rules backend/routes/users.js
```

### Pre-Commit Hook
- Automatically configured in `.git/hooks/pre-commit`
- Skip with `git commit --no-verify` (NOT recommended)

### Before EVERY Commit
```bash
cs delta --staged
# MUST see: Score ≥ 9.0
# Review hotspots
# Fix red flags in production code
```

---

## What CodeScene Analyzes

- **Complexity** - Cyclomatic complexity per function
- **Maintainability** - Code health score
- **Duplication** - Repeated code blocks
- **Function length** - Lines per function
- **Nesting** - Deeply nested conditionals
- **File hotspots** - Frequently changed files with high complexity

---

## What to Fix

**MUST Fix (in production code):**
- ❌ Duplication in `backend/`, `frontend/src/`
- ❌ Complex functions (cyclomatic complexity ≥ 9)
- ❌ Large functions (> 50 lines)
- ❌ Bumpy Road issues (deeply nested conditionals)
- ❌ Excess function arguments (> 5 parameters)
- ❌ Functions > 15 arguments (use options objects)

**Can Ignore:**
- ✅ Test file duplication (repetitive setup is normal)
- ✅ Model schemas (repetitive field definitions acceptable)

---

## JavaScript/Node.js Standards

### Naming Conventions
```javascript
// Variables/functions
const userName = 'John';          // camelCase
function getUserData() {}

// Classes/Components
class UserService {}              // PascalCase
function ProfileEditor() {}

// Constants
const MAX_LOGIN_ATTEMPTS = 5;     // UPPER_SNAKE_CASE

// Private functions
function _validateInput() {}      // prefix with _
```

### Code Organization
- **One responsibility per file**
- **Imports at top** (dependencies → local imports)
- **Comments for complex logic** (not obvious code)

### Error Handling
```javascript
// ✅ GOOD
try {
  const data = await fetch(url);
  if (!data.ok) throw new Error(data.statusText);
  return await data.json();
} catch (err) {
  console.error('Failed to fetch:', err);
  throw err;  // Re-throw, don't swallow
}

// ❌ BAD - no error handling
const data = await fetch(url);
return data.json();
```

### Async/Await
- **Always use try/catch** for async operations
- **Never use `.then()` chains** (use async/await)
- **Return Promises**, don't swallow errors

### Function Structure
```javascript
async function handleUserSignup(username, email, password) {
  // 1. Validate inputs
  if (!username?.trim()) throw new Error('Username required');

  // 2. Check conditions
  const exists = await User.findOne({ username });
  if (exists) throw new Error('Username taken');

  // 3. Execute action
  const user = await User.create({ username, email, password });

  // 4. Return result
  return user;
}
```

### No Magic Numbers/Strings
```javascript
// ❌ BAD
if (password.length < 6) { ... }

// ✅ GOOD
const MIN_PASSWORD_LENGTH = 6;
if (password.length < MIN_PASSWORD_LENGTH) { ... }
```

### Validation
- **Validate ALL user inputs on backend**
- Frontend validation is UX only, never trust it
- Use consistent validation messages

---

## React Standards

### Component Structure
```javascript
function UserProfile({ userId }) {
  // 1. State
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // 2. Effects
  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  // 3. Handlers
  const handleLogout = () => { ... };

  // 4. Render
  return (
    <div className="profile">
      {user && <p>{user.name}</p>}
    </div>
  );
}
```

### State Management
- Keep state local when possible
- Use context only for global app state (auth, theme)
- Never pass functions through context multiple levels
- **NO direct DOM manipulation** (`document.getElementById`, etc.)

---

## MongoDB/Mongoose Standards

### Schema Design
- **Always include timestamps:** `createdAt`, `updatedAt`
- **Mark required fields:** `required: true`
- **Use unique index** for email/username: `unique: true`
- **Validate data types** strictly

### Query Performance
- Use `.lean()` for read-only queries
- Create indexes for frequently queried fields
- **Never retrieve password field** unless needed

### Error Messages
```javascript
// ✅ GOOD
const user = await User.findById(id);
if (!user) throw new Error('User not found');

// ❌ BAD - silent failure
const user = await User.findById(id);
```

---

## API Standards

### Endpoint Naming
```
POST   /api/auth/signup       - Create user
POST   /api/auth/login        - Authenticate
GET    /api/auth/me           - Get current user
POST   /api/:resource         - Create resource
GET    /api/:resource/:id     - Get single resource
PATCH  /api/:resource/:id     - Update resource
DELETE /api/:resource/:id     - Delete resource
GET    /api/:resource         - List resources
```

### Response Format
```javascript
// Success
{
  "success": true,
  "message": "User created",
  "data": { "id": "...", "username": "..." }
}

// Error
{
  "success": false,
  "message": "Username already taken",
  "code": "DUPLICATE_USERNAME"
}
```

### HTTP Status Codes
| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Request succeeded |
| 201 | Created | New resource created |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | No/bad token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Unexpected error |

### Authentication
- All protected routes require `Authorization: Bearer <token>`
- Verify token before processing
- Return 401 if token invalid/missing

---

## Testing Requirements (Before Commit)

### Test Coverage
- **Happy path** (everything works)
- **Empty inputs** (no data provided)
- **Invalid inputs** (wrong type/format)
- **Edge cases** (min/max values)
- **Error scenarios** (database fails, network errors)

### Console Checks
- ❌ No `console.log()` in production code
- ❌ No warnings in browser console
- ❌ No errors in terminal

---

## Security Checklist

- [ ] Passwords hashed (bcryptjs, salt rounds ≥ 10)
- [ ] JWT tokens have expiration (`expiresIn: '24h'`)
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] NoSQL injection prevented (parameterized queries)
- [ ] CORS configured (allow only frontend domain)
- [ ] Secrets not in code (use .env)

---

## Pre-Commit Checklist

**BEFORE EVERY COMMIT:**

1. ✅ Run `npm test` (all passing)
2. ✅ Run `cs delta --staged` (score ≥ 9.0)
3. ✅ Check for red warnings in production code
4. ✅ Backend boots without errors
5. ✅ Frontend compiles without errors
6. ✅ No console.log() left in code
7. ✅ Fix any violations

**Only then commit.**

---

## Complexity Limits (Enforced)

```javascript
// ❌ TOO COMPLEX (complexity ≥ 9)
function processUser(user) {
  if (user.role === 'MANAGER') {
    if (user.status === 'pending') {
      if (user.building) {
        if (user.building.apartments.length > 0) {
          // ... more nesting
        }
      }
    }
  }
}

// ✅ GOOD (complexity < 9)
function processUser(user) {
  if (!isValidManager(user)) return null;
  return assignBuilding(user);
}

function isValidManager(user) {
  return user.role === 'MANAGER' 
    && user.status === 'active' 
    && user.building;
}

function assignBuilding(user) {
  // Simple logic
}
```

---

**Remember:** Code quality is NOT optional. Score < 9.0 = NO commit.
