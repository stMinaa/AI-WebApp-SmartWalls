# Code Quality Standards

All code must adhere to these standards. Every feature addition must pass this checklist.

---

## 📊 CodeScene Quality (Target: ≥8.0)

**CodeScene analyzes:**
- Code complexity and maintainability
- Code duplication
- Function length and nesting
- File hotspots (frequently changed areas)

**What to fix:**
- ❌ Duplication in production code (backend/, frontend/src/)
- ❌ Complex functions (high cognitive complexity)
- ❌ Large functions (>50 lines)

**What to ignore:**
- ✅ Test file duplication (tests naturally have repetitive setup/assertions)
- ✅ Model schemas (repetitive field definitions are clear)

**Action:** If CodeScene score <8.0, refactor before committing.

---

## ✅ JavaScript/Node.js Standards

### 1. **Naming Conventions**
- Variables/functions: `camelCase`
- Classes/Components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private functions: prefix with `_` (e.g., `_validateInput()`)

### 2. **Code Organization**
- One responsibility per file
- Max 300 lines per file (split larger files)
- Imports at top, organized (dependencies → local imports)
- Comments for complex logic, not obvious code

### 3. **Error Handling**
```javascript
// ✅ Good
try {
  const data = await fetch(url);
  if (!data.ok) throw new Error(data.statusText);
  return await data.json();
} catch (err) {
  console.error('Failed to fetch:', err);
  throw err;
}

// ❌ Bad
const data = await fetch(url);
return data.json();
```

### 4. **Async/Await**
- Always use try/catch for async operations
- Never use `.then()` chains (use async/await instead)
- Return Promises, don't swallow errors

### 5. **Function Structure**
```javascript
// ✅ Good
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

### 6. **No Magic Numbers/Strings**
```javascript
// ❌ Bad
if (password.length < 6) { ... }

// ✅ Good
const MIN_PASSWORD_LENGTH = 6;
if (password.length < MIN_PASSWORD_LENGTH) { ... }
```

### 7. **Validation**
- Validate ALL user inputs on backend
- Frontend validation is UX only, never trust it
- Use consistent validation messages

---

## ✅ React Standards

### 1. **Component Structure**
```javascript
// ✅ Good structure
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

### 2. **Props Validation**
- Document what props component expects
- Always validate in handlers before using

### 3. **State Management**
- Keep state local when possible
- Use context only for global app state (auth, theme)
- Never pass functions through context multiple levels

### 4. **No Direct DOM Manipulation**
- Use React state/props only
- Never use `document.getElementById()` etc.

---

## ✅ MongoDB/Mongoose Standards

### 1. **Schema Design**
- Always include timestamps: `createdAt`, `updatedAt`
- Mark required fields: `required: true`
- Use unique index for email/username: `unique: true`
- Validate data types strictly

### 2. **Query Performance**
- Use `.lean()` for read-only queries
- Create indexes for frequently queried fields
- Never retrieve password field unless needed

### 3. **Error Messages**
```javascript
// ✅ Good
const user = await User.findById(id);
if (!user) throw new Error('User not found');

// ❌ Bad
const user = await User.findById(id);
```

---

## ✅ API Standards

### 1. **Endpoint Naming**
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

### 2. **Response Format**
```javascript
// ✅ Success
{
  "success": true,
  "message": "User created",
  "data": { "id": "...", "username": "..." }
}

// ✅ Error
{
  "success": false,
  "message": "Username already taken",
  "code": "DUPLICATE_USERNAME"
}
```

### 3. **HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (no/bad token)
- `403` - Forbidden (no permission)
- `404` - Not found
- `500` - Server error

### 4. **Authentication**
- All protected routes require `Authorization: Bearer <token>`
- Verify token before processing
- Return `401` if token invalid/missing

---

## ✅ Testing Requirements

### 1. **Manual Testing**
Before committing new feature, test:
- Happy path (everything works)
- Empty inputs (no data provided)
- Invalid inputs (wrong type/format)
- Edge cases (min/max values)
- Error scenarios (database fails, network error)

### 2. **Console Checks**
- No `console.log()` in production code
- No warnings in browser console
- No errors in terminal

### 3. **Data Validation**
- Run through TESTING_REQUIREMENTS.md checklist
- Verify database contains expected data
- Verify API responses match documented format

### 4. **CodeScene Analysis**
- Run CodeScene extension analysis before committing
- Check for code health issues
- Review complexity warnings
- Address hotspots (frequently changed complex code)
- Fix technical debt warnings
- **Aim for code quality score ≥ 8.0** (minimum acceptable)
- Never commit with score < 8.0
- Red warnings must be fixed before merging

---

## ✅ Security Checklist

- [ ] Passwords hashed (bcryptjs, salt rounds ≥ 10)
- [ ] JWT tokens have expiration (`expiresIn: '24h'`)
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] SQL/NoSQL injection prevented (use parameterized queries)
- [ ] CORS configured (allow only frontend domain)
- [ ] Secrets not in code (use env vars)

---

## How to Use This

Before committing code:
1. Run feature against all sections above
2. Mark any violations
3. Fix violations
4. Run CodeScene analysis (check for red warnings)
5. Run TESTING_REQUIREMENTS.md tests
6. Only then merge

