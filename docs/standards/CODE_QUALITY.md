# Code Quality Standards

All code must adhere to these standards. Every feature addition must pass this checklist.

---

## CodeScene Integration

### Quick Commands
```bash
# Full project analysis
.\analyze-code.ps1

# Analyze staged changes (before commit)
cs delta --staged

# Analyze current uncommitted changes
cs delta

# Check specific file
cs check backend/routes/users.js

# Review file with score
cs review backend/routes/users.js

# Find all code health problems in a file
cs check-rules backend/routes/users.js
```

### Pre-commit Hook
Automatically configured in `.git/hooks/pre-commit`. Skip with `git commit --no-verify` (not recommended).

### VS Code Integration
CodeScene MCP server configured in `.vscode/mcp.json` - available through Copilot after VS Code restart.

### CI/CD Integration
```yaml
- name: CodeScene Analysis
  run: cs delta --error-on-warnings
```

---

## Code Health Targets

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Code health score | **≥ 9.0** | Refactor before committing |
| Cyclomatic complexity | **< 9** per function | Extract helper functions |
| Function length | **< 50 lines** | Split into smaller functions |
| File length | **< 300 lines** | Split into separate files |

**What CodeScene analyzes:** complexity, maintainability, duplication, function length, nesting, file hotspots.

**What to fix:**
- Duplication in production code (backend/, frontend/src/)
- Complex functions (high cognitive complexity)
- Large functions (>50 lines)
- Bumpy Road issues (deeply nested conditionals)
- Excess function arguments (use options objects instead)

**What to ignore:**
- Test file duplication (tests naturally have repetitive setup)
- Model schemas (repetitive field definitions are acceptable)

---

## JavaScript/Node.js Standards

### Naming Conventions
- Variables/functions: `camelCase`
- Classes/Components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private functions: prefix with `_` (e.g., `_validateInput()`)

### Code Organization
- One responsibility per file
- Imports at top, organized (dependencies → local imports)
- Comments for complex logic, not obvious code

### Error Handling
```javascript
// Good
try {
  const data = await fetch(url);
  if (!data.ok) throw new Error(data.statusText);
  return await data.json();
} catch (err) {
  console.error('Failed to fetch:', err);
  throw err;
}

// Bad - no error handling
const data = await fetch(url);
return data.json();
```

### Async/Await
- Always use try/catch for async operations
- Never use `.then()` chains (use async/await)
- Return Promises, don't swallow errors

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
// Bad
if (password.length < 6) { ... }

// Good
const MIN_PASSWORD_LENGTH = 6;
if (password.length < MIN_PASSWORD_LENGTH) { ... }
```

### Validation
- Validate ALL user inputs on backend
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
- No direct DOM manipulation (`document.getElementById`, etc.)

---

## MongoDB/Mongoose Standards

### Schema Design
- Always include timestamps: `createdAt`, `updatedAt`
- Mark required fields: `required: true`
- Use unique index for email/username: `unique: true`
- Validate data types strictly

### Query Performance
- Use `.lean()` for read-only queries
- Create indexes for frequently queried fields
- Never retrieve password field unless needed

### Error Messages
```javascript
// Good
const user = await User.findById(id);
if (!user) throw new Error('User not found');

// Bad - silent failure
const user = await User.findById(id);
```

---

## API Standards

### Endpoint Naming
```
POST   /api/auth/signup       - Create user
POST   /api/auth/login        - Authenticate user
GET    /api/auth/me           - Get current user
POST   /api/:resource         - Create new resource
GET    /api/:resource/:id     - Get single resource
PATCH  /api/:resource/:id     - Update resource
DELETE /api/:resource/:id     - Delete resource
GET    /api/:resource         - List resources (paginated)
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

## Testing Requirements

### Before Committing
- Happy path (everything works)
- Empty inputs (no data provided)
- Invalid inputs (wrong type/format)
- Edge cases (min/max values)
- Error scenarios (database fails, network error)

### Console Checks
- No `console.log()` in production code
- No warnings in browser console
- No errors in terminal

### CodeScene Before Commit
```bash
cs delta --staged
# Score must be ≥ 9.0
# Review hotspots
# Fix red flags in production code
# Test file warnings are acceptable
```

---

## Security Checklist

- [ ] Passwords hashed (bcryptjs, salt rounds ≥ 10)
- [ ] JWT tokens have expiration (`expiresIn: '24h'`)
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] NoSQL injection prevented (parameterized queries)
- [ ] CORS configured (allow only frontend domain)
- [ ] Secrets not in code (use env vars)

---

## Pre-Commit Checklist

1. Run feature against all sections above
2. Run `cs delta --staged` (score ≥ 9.0)
3. Run `npm test` (all tests pass)
4. Check for red warnings in production code
5. Fix any violations
6. Only then commit

---

*Last updated: February 2026*
