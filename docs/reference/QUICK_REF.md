# Quick Reference Guide

Fast lookup for common tasks while developing.

---

## Essential Files

```
backend/index.js          → Main API server
backend/models/User.js    → User schema

frontend/src/App.js       → Main routing & auth
frontend/src/Login.js     → Login form
frontend/src/Signup.js    → Signup form

ROLE_SYSTEM_SPECIFICATION.md → What to build
TESTING_REQUIREMENTS.md       → How to test
CODE_QUALITY_STANDARDS.md     → Code rules
DEVELOPMENT_WORKFLOW.md       → Process
```

---

## MongoDB Connection String

```javascript
mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0
```

Database: `tennetdb`

---

## Running the System

### Terminal 1: Backend
```bash
cd backend
node index.js

# Expected output:
# ✅ MONGO RUNNING - Connected to MongoDB
# ✅ BACKEND RUNNING - Server listening on port 5000
```

### Terminal 2: Frontend
```bash
cd frontend
npm start

# Opens http://localhost:3000
```

---

## Testing API Endpoints

### Using curl (Windows PowerShell)
```bash
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

# Get current user (replace TOKEN with actual token)
Invoke-WebRequest -Uri http://localhost:5000/api/auth/me `
  -Headers @{'Authorization'='Bearer TOKEN'}
```

### Using Postman
1. Create new request
2. Set method (POST, GET, etc.)
3. Set URL (http://localhost:5000/api/...)
4. Under "Headers" tab, add:
   - `Content-Type: application/json`
   - `Authorization: Bearer <TOKEN>` (if protected)
5. Under "Body" tab, select "raw" → JSON, add data
6. Click Send

---

## Response Format (Always Consistent)

### Success
```javascript
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ }
}
```

### Error
```javascript
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Common Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Request succeeded |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | No/invalid token |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Unexpected error |

---

## Frontend localStorage Keys

```javascript
// After login/signup:
localStorage.getItem('token')     // JWT token
localStorage.getItem('user')      // JSON user object
  // Contains: id, username, email, firstName, lastName, role
```

---

## User Roles

```
TENANT      → Can report issues
MANAGER     → Can manage buildings
DIRECTOR    → Can create buildings
ASSOCIATE   → Can accept jobs
```

---

## Middleware in Backend

### authenticateToken
```javascript
// Used on protected routes
// Checks Authorization header for valid JWT token
// Adds user object to req.user

// Usage:
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});
```

### checkRole
```javascript
// (To be created) Used for role-based authorization
// Checks if user.role === required role

// Usage (will be):
app.post('/api/buildings', authenticateToken, checkRole('DIRECTOR'), (req, res) => {
  // Only directors can access
});
```

---

## Password Security

```javascript
// When storing password:
const bcrypt = require('bcryptjs');
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// When checking password:
const match = await bcrypt.compare(providedPassword, storedHash);
if (match) {
  // Password correct
}
```

---

## JWT Token

```javascript
// When creating token:
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: user._id, username: user.username },
  'your_secret_key_here',
  { expiresIn: '24h' }
);

// When verifying token:
const decoded = jwt.verify(token, 'your_secret_key_here');
const userId = decoded.id;
```

---

## Database Queries (Mongoose)

```javascript
// Create
const user = await User.create({ username, email, password });

// Find
const user = await User.findById(id);
const user = await User.findOne({ username });
const users = await User.find({ role: 'TENANT' });

// Update
await User.findByIdAndUpdate(id, { role: 'MANAGER' });
const user = await User.findByIdAndUpdate(id, { role: 'MANAGER' }, { new: true });

// Delete
await User.findByIdAndDelete(id);

// Count
const count = await User.countDocuments({ role: 'TENANT' });

// Lean (read-only, faster)
const users = await User.find({ role: 'TENANT' }).lean();
```

---

## React Hooks Quick Reference

```javascript
// State
const [value, setValue] = useState(null);

// Effect (run when component mounts)
useEffect(() => {
  fetchData();
}, []); // Empty dependency = run once

// Effect (run when userId changes)
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// Effect (run every render)
useEffect(() => {
  console.log('Rendered');
});
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | No token | Login first |
| 403 Forbidden | Wrong role | Check user.role |
| 404 Not Found | URL wrong | Check endpoint path |
| Network Error | Backend down | Start backend |
| CORS Error | Domain blocked | Check CORS config |
| TypeError in fetch | Response not JSON | Check Content-Type |

---

## Useful Commands

```bash
# Check if port is in use
netstat -ano | findstr :5000

# Kill process on port 5000
Taskkill /PID <PID> /F

# Kill all Node processes
Taskkill /IM node.exe /F

# MongoDB connection test
mongo "mongodb+srv://user:pass@cluster.mongodb.net/database"

# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -r node_modules package-lock.json
npm install
```

---

## Next Phase Checklist

Before starting Phase 1 (Role Field):

- [ ] Current system running (backend + frontend)
- [ ] Can signup/login successfully
- [ ] User.js schema visible and understood
- [ ] Backend index.js endpoints understood
- [ ] All tests in TESTING_REQUIREMENTS.md Phase 1 read

Ready? → Start implementing Phase 1!

