# Quick Reference Guide

Fast lookup for common tasks while developing.

---

## Essential Files

```
Backend:
  backend/index.js              → Main API server & routes
  backend/models/User.js        → User schema (role, status, building, apartment)
  backend/models/Building.js    → Building schema
  backend/models/Apartment.js   → Apartment schema
  backend/models/Issue.js       → Issue schema (status workflow)
  backend/models/Notice.js      → Notice schema
  backend/models/Poll.js        → Poll schema
  backend/services/             → Business logic (issueService, userService, buildingService, noticeService)
  backend/test/                 → Jest tests (117 passing)

Frontend:
  frontend/src/App.js           → Main routing & auth state
  frontend/src/Login.js         → Login form
  frontend/src/Signup.js        → Signup form with role selection
  frontend/src/*Dashboard.js    → Role-specific dashboards

Documentation:
  CLAUDE.md                     → Root navigator (start here)
  docs/standards/               → CODE_QUALITY, UI_UX
  docs/workflow/                → DEVELOPMENT (TDD), TESTING
  docs/specs/ROLES.md           → Role system specification
  docs/reference/               → QUICK_REF (this file), IMPLEMENTATION
  docs/logs/PROJECT_LOG.md      → Development history
```

---

## Running the System

### Terminal 1: Backend
```bash
cd backend
node index.js

# Expected output:
# MONGO RUNNING - Connected to MongoDB
# Server listening on port 5000
```

### Terminal 2: Frontend
```bash
cd frontend
npm start
# Opens http://localhost:3000
```

### Running Tests
```bash
cd backend
npm test
# Expected: 117 tests passing
```

---

## Testing API Endpoints

### Using PowerShell
```powershell
# Signup
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/auth/signup `
  -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body

# Login
$body = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
  -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body

# Get current user (replace TOKEN)
Invoke-WebRequest -Uri http://localhost:5000/api/auth/me `
  -Headers @{'Authorization'='Bearer TOKEN'}
```

### Using Postman
1. Set method (POST, GET, etc.) and URL
2. Headers: `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`
3. Body: raw → JSON
4. Send

---

## Response Format

### Success
```javascript
{ "success": true, "message": "Operation successful", "data": { /* payload */ } }
```

### Error
```javascript
{ "success": false, "message": "Error description", "code": "ERROR_CODE" }
```

---

## HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Request succeeded |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input / validation error |
| 401 | Unauthorized | Missing or expired token |
| 403 | Forbidden | User lacks required role |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected backend error |

---

## User Roles & Status

### Roles
```
TENANT      → Reports issues, votes on polls, views notices
MANAGER     → Manages buildings, triages issues, creates notices/polls
DIRECTOR    → Creates buildings, assigns managers, approves staff, assigns issues
ASSOCIATE   → Accepts jobs, sets cost, marks complete
```

### Status on Signup
```
Tenant/Director  → status: 'active' (immediate access)
Manager/Associate → status: 'pending' (requires director approval)
```

---

## Middleware

### authenticateToken
```javascript
// Checks Authorization header for valid JWT
// Adds decoded user to req.user
// Returns 401 if missing/invalid

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});
```

---

## Code Snippets

### Password Hashing (bcryptjs)
```javascript
const bcrypt = require('bcryptjs');
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Verify
const match = await bcrypt.compare(providedPassword, storedHash);
```

### JWT Token
```javascript
const jwt = require('jsonwebtoken');

// Create
const token = jwt.sign({ id: user._id, username: user.username }, SECRET, { expiresIn: '24h' });

// Verify
const decoded = jwt.verify(token, SECRET);
```

### Mongoose Queries
```javascript
const user = await User.findById(id);
const user = await User.findOne({ username });
const users = await User.find({ role: 'TENANT' }).lean();
await User.findByIdAndUpdate(id, { role: 'MANAGER' }, { new: true });
const count = await User.countDocuments({ role: 'TENANT' });
```

### React Hooks
```javascript
const [value, setValue] = useState(null);

useEffect(() => { fetchData(); }, []);       // Run once on mount
useEffect(() => { fetchUser(id); }, [id]);   // Run when id changes
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check if port in use
netstat -ano | findstr :5000

# Kill Node processes
Taskkill /IM node.exe /F

# Kill specific PID
Taskkill /PID <PID> /F
```

### 401 Unauthorized
- Token missing or expired
- Check `localStorage.getItem('token')`
- Login again to get fresh token

### 403 Forbidden
- User doesn't have required role
- Check `user.role` matches endpoint requirement
- Check if user status is 'active' (not 'pending')

### CORS Errors
- Backend not running on port 5000
- Check CORS configuration in `backend/index.js`

### MongoDB Connection Failed
- Check MongoDB Atlas connection string in .env
- Verify network access in Atlas dashboard
- Check username/password in connection string

### Frontend Not Updating
- Check browser DevTools console for errors
- Check Network tab for failed API calls
- Verify state is being set (add console.log temporarily)
- Check if useEffect dependencies are correct

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Network Error | Backend down | Start backend |
| CORS Error | Domain blocked | Check CORS config |
| TypeError in fetch | Response not JSON | Check Content-Type |
| ValidationError | Schema mismatch | Check field types |

---

## Useful Commands

```bash
# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -r node_modules package-lock.json && npm install

# CodeScene analysis
cs delta --staged
cs review backend/services/issueService.js
.\analyze-code.ps1
```

---

*Last updated: February 2026*
