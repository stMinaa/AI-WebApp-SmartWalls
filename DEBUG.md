# DEBUG GUIDE - Profile Update & Test Data

## Current Status

✅ **Backend server**: Running on http://localhost:5000
✅ **Frontend server**: Running on http://localhost:3000  
✅ **Logging added**: Both frontend and backend have extensive console.log statements
✅ **Test endpoints**: /api/test/seed-issues and /api/test/seed-notices are ready

## Issue 1: Profile Update Not Working

### What to do:
1. Open browser to http://localhost:3000
2. Login as tenant1
3. Go to profile page
4. Click "Izmeni podatke"
5. Change name or mobile number
6. Click "Sačuvaj"
7. **CHECK BOTH TERMINALS** for output

### Expected logs:

**Frontend (Browser Console - F12):**
```
Updating profile with: { firstName: "...", lastName: "...", mobile: "..." }
Token: present
Response status: 200
Response data: { message: "Profile updated", user: {...} }
```

**Backend (Terminal):**
```
PATCH /api/auth/me - User: tenant1 Body: { firstName: "...", lastName: "...", mobile: "..." }
Updating user: tenant1 with: { firstName: "...", lastName: "...", mobile: "..." }
User saved successfully: tenant1
```

### If you see errors:
- **401 Unauthorized**: Token missing or invalid - check if login worked
- **404 User not found**: User doesn't exist in database
- **500 Server error**: Check backend terminal for error details
- **CORS error**: Check if backend is running on port 5000

---

## Issue 2: Test Data Missing

### Problem:
Need test issues and notices to test tenant "Kvarovi" and "Oglasna tabla" pages

### Solution:

#### Option A: Use quick-seed script (RECOMMENDED)
1. Make sure you have a director account. If not, sign up:
   - Go to http://localhost:3000/signup
   - Create account with role="director"
   - Username: director1
   - Password: Pass123!
   
2. Manually approve the director (if approval is required):
   - Open MongoDB Compass or use mongo shell
   - Find user with username="director1"
   - Set `approved: true`

3. Run the seed script:
   ```bash
   cd backend
   node quick-seed.js
   ```

#### Option B: Manually call the endpoints
Use Postman or VS Code REST Client:

```http
### Login as director first
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "director1",
  "password": "Pass123!"
}

### Copy the token from response, then:

### Seed test issues
POST http://localhost:5000/api/test/seed-issues
Authorization: Bearer YOUR_TOKEN_HERE

### Seed test notices
POST http://localhost:5000/api/test/seed-notices
Authorization: Bearer YOUR_TOKEN_HERE
```

#### Option C: Use existing comprehensive seed script
```bash
cd backend
node seed-test-data.js
```
This creates complete test data including users, buildings, apartments, issues, and notices.

---

## Verification Steps

### 1. Check Profile Update Works:
- Login as tenant
- Update profile
- See "Profil ažuriran!" success message
- Refresh page - changes should persist

### 2. Check Test Issues:
- Login as tenant1
- Go to "Kvarovi" tab
- Should see 8 test issues:
  - "Nema tople vode"
  - "Lift ne radi"
  - "Curi slavina u kuhinji"
  - etc.
- Filter "Svi kvarovi" vs "Moji kvarovi" should work

### 3. Check Test Notices:
- Stay logged in as tenant1
- Go to "Oglasna tabla" tab
- Should see 7 test notices about maintenance, cleaning, heating, etc.

---

## Common Issues & Fixes

### "UPDATING STILL DOESNT WORK"
- Open browser console (F12) and check for errors
- Check backend terminal for PATCH /api/auth/me logs
- Verify token is present in localStorage
- Try logging out and back in

### "Forbidden" when seeding data
- Make sure you're logged in as director
- Check user role in database (should be role: "director")
- Verify director account is approved

### "Need at least one apartment and tenant"
- Run the full seed-test-data.js script first
- This creates all necessary data (buildings, apartments, tenants, etc.)

### No logs showing in backend terminal
- Backend might not be running
- Restart: `cd backend && node index.js`
- Check for port 5000 conflicts

---

## Quick Commands Reference

```bash
# Start backend
cd backend
node index.js

# Start frontend (in new terminal)
cd frontend
yarn start

# Seed all test data
cd backend
node seed-test-data.js

# Quick seed just issues & notices
cd backend
node quick-seed.js

# Check MongoDB data
# Use MongoDB Compass or:
mongosh
use housing-management
db.users.find({ role: "tenant" })
db.issues.find()
db.notices.find()
```

---

## Next Steps

1. ✅ Start both servers (already running)
2. 🔍 Test profile update and share terminal output
3. 🌱 Create director account if needed
4. 🌱 Run seed script to create test data
5. ✅ Verify tenant UI shows issues and notices
6. 🎯 Match UI to TennantIssues.png reference image

