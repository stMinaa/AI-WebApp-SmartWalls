# API Endpoints Reference

**Source:** Extracted from `docs/reference/IMPLEMENTATION.md` and `docs/reference/QUICK_REF.md`

---

## Base URL

```
Backend: http://localhost:5000
Frontend: http://localhost:3000
```

---

## Authentication Endpoints

### POST /api/auth/signup
**Create new user account**

**Request:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TENANT",              // Optional: TENANT, MANAGER, DIRECTOR, ASSOCIATE
  "building": "buildingId"       // Required for tenants
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created",
  "data": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "TENANT",
    "status": "active"            // 'active' for tenant/director, 'pending' for manager/associate
  }
}
```

**Status Logic:**
- Tenant, Director → `status: 'active'` (auto-approved)
- Manager, Associate → `status: 'pending'` (requires director approval)

---

### POST /api/auth/login
**Authenticate user and receive JWT token**

**Request:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "role": "TENANT",
      "status": "active"
    }
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Error (403):**
```json
{
  "success": false,
  "message": "Account pending approval"
}
```

---

### GET /api/auth/me
**Get current user info**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "TENANT",
    "status": "active",
    "building": { "name": "Building A", "address": "..." },
    "apartment": { "unitNumber": "101", "floor": 1 }
  }
}
```

---

### PATCH /api/auth/me
**Update current user profile**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "mobile": "+381641234567"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated",
  "data": { /* updated user */ }
}
```

---

## Buildings Endpoints

### POST /api/buildings
**Create new building (Director only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Building A",
  "address": "123 Main St",
  "imageUrl": "https://example.com/building.jpg"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Building created",
  "data": {
    "id": "...",
    "name": "Building A",
    "address": "123 Main St",
    "imageUrl": "https://example.com/building.jpg",
    "director": "...",
    "apartmentCount": 0
  }
}
```

---

### GET /api/buildings
**List all buildings (Director only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Building A",
      "address": "123 Main St",
      "apartmentCount": 12,
      "manager": { "name": "John Doe", "email": "john@example.com" }
    }
  ]
}
```

---

### GET /api/buildings/managed
**Get buildings assigned to current manager (Manager only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Building A",
      "address": "123 Main St",
      "apartmentCount": 12
    }
  ]
}
```

---

### PATCH /api/buildings/:id/assign-manager
**Assign manager to building (Director only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "managerId": "..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Manager assigned",
  "data": {
    "id": "...",
    "name": "Building A",
    "manager": { "name": "John Doe", "email": "john@example.com" }
  }
}
```

---

## Apartments Endpoints

### POST /api/buildings/:id/apartments
**Create single apartment (Manager/Director)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "unitNumber": "101",
  "floor": 1,
  "numPeople": 3
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Apartment created",
  "data": {
    "id": "...",
    "unitNumber": "101",
    "floor": 1,
    "building": "...",
    "tenant": null
  }
}
```

---

### POST /api/buildings/:id/apartments/bulk
**Bulk create apartments (Manager/Director)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request (Simple):**
```json
{
  "floors": 3,
  "unitsPerFloor": 4
}
```
Creates apartments: 101-104, 201-204, 301-304

**Request (Advanced):**
```json
{
  "floorsSpec": "3,4,5"
}
```
Creates: 301-304, 401-404, 501-504

**Response (201):**
```json
{
  "success": true,
  "message": "12 apartments created",
  "data": {
    "count": 12,
    "apartments": [ /* array of created apartments */ ]
  }
}
```

**Constraint:** Only allowed if `building.apartmentCount === 0`

---

### GET /api/buildings/:id/apartments
**List apartments in building (Manager/Director)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "unitNumber": "101",
      "floor": 1,
      "tenant": { "name": "Jane Doe", "email": "jane@example.com" },
      "numPeople": 3
    }
  ]
}
```

---

## Issues Endpoints

### POST /api/issues
**Report issue (Tenant only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Broken elevator",
  "description": "The elevator on the 3rd floor is not working",
  "urgency": "urgent"     // or "not urgent"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Issue reported",
  "data": {
    "id": "...",
    "title": "Broken elevator",
    "status": "reported",
    "tenant": "...",
    "building": "...",
    "urgency": "urgent",
    "createdAt": "2026-02-14T10:00:00Z"
  }
}
```

---

### GET /api/issues
**List issues**

**Manager:** Issues in their managed buildings
**Director:** All forwarded issues only
**Tenant:** Use `/api/issues/my` instead

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
```
?status=reported        - Filter by status
?priority=high          - Filter by priority
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Broken elevator",
      "status": "reported",
      "urgency": "urgent",
      "tenant": { "name": "Jane Doe", "apartment": "101" },
      "building": { "name": "Building A" }
    }
  ]
}
```

---

### GET /api/issues/my
**Get tenant's own issues (Tenant only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [ /* tenant's issues */ ]
}
```

---

### PATCH /api/issues/:id/triage
**Triage issue (Manager only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request (Forward):**
```json
{
  "action": "forward",
  "note": "Needs director approval"
}
```

**Request (Assign):**
```json
{
  "action": "assign",
  "assigneeId": "...",
  "note": "Assigned to John"
}
```

**Request (Reject):**
```json
{
  "action": "reject",
  "note": "Not a valid issue"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Issue forwarded",
  "data": { /* updated issue */ }
}
```

---

### PATCH /api/issues/:id/assign
**Assign issue to associate (Director only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "associateId": "...",
  "note": "High priority - fix today"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Issue assigned",
  "data": {
    "id": "...",
    "status": "assigned",
    "assignee": { "name": "Tech Service", "email": "tech@example.com" }
  }
}
```

---

### POST /api/issues/:id/accept
**Accept job with cost (Associate only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "cost": 5000,
  "note": "Will fix tomorrow"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Job accepted",
  "data": {
    "id": "...",
    "status": "in-progress",
    "cost": 5000
  }
}
```

**Side Effect:** Tenant's debt increases by `cost`

---

### POST /api/issues/:id/complete
**Mark job complete (Associate only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "note": "Fixed and tested"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Job completed",
  "data": {
    "id": "...",
    "status": "resolved",
    "completionDate": "2026-02-14T15:00:00Z"
  }
}
```

---

### GET /api/associates/me/jobs
**Get associate's assigned jobs (Associate only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Broken elevator",
      "status": "assigned",
      "building": { "name": "Building A", "address": "..." },
      "tenant": { "name": "Jane Doe", "apartment": "101" }
    }
  ]
}
```

---

## Users Endpoints

### GET /api/users
**Filter users (Director only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
```
?role=MANAGER           - Filter by role
?status=pending         - Filter by status
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "MANAGER",
      "status": "pending"
    }
  ]
}
```

---

### PATCH /api/users/:id/approve
**Approve pending user (Director only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User approved",
  "data": { /* user with status: 'active' */ }
}
```

---

### DELETE /api/users/:id
**Delete user (Director only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted"
}
```

---

## Notices Endpoints

### POST /api/buildings/:id/notices
**Create notice (Manager only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "content": "Water will be shut off tomorrow 9-11 AM",
  "type": "service",         // general, service, elevator, delivery
  "priority": "high"         // low, medium, high
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Notice created",
  "data": {
    "id": "...",
    "content": "Water will be shut off tomorrow 9-11 AM",
    "author": { "name": "Manager Name" },
    "createdAt": "2026-02-14T10:00:00Z"
  }
}
```

---

### GET /api/buildings/:id/notices
**Get notices for building (Tenant/Manager)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "content": "Water will be shut off tomorrow 9-11 AM",
      "author": { "name": "Manager Name", "role": "MANAGER" },
      "type": "service",
      "priority": "high",
      "createdAt": "2026-02-14T10:00:00Z"
    }
  ]
}
```

---

## Polls Endpoints

### POST /api/buildings/:id/polls
**Create poll (Manager only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "question": "Should we paint the entrance?",
  "options": ["Yes", "No", "Need more info"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Poll created",
  "data": {
    "id": "...",
    "question": "Should we paint the entrance?",
    "options": ["Yes", "No", "Need more info"],
    "votes": [],
    "createdAt": "2026-02-14T10:00:00Z"
  }
}
```

---

### GET /api/buildings/:id/polls
**Get polls for building (Tenant/Manager)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "question": "Should we paint the entrance?",
      "options": ["Yes", "No", "Need more info"],
      "votes": [
        { "option": "Yes", "voter": "..." },
        { "option": "Yes", "voter": "..." }
      ],
      "closedAt": null
    }
  ]
}
```

---

### POST /api/polls/:id/vote
**Vote on poll (Tenant only)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "option": "Yes"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Vote recorded",
  "data": { /* updated poll */ }
}
```

**Constraint:** One vote per tenant per poll

---

## Response Format Standards

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* payload */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"          // Optional
}
```

---

## HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| **200** | OK | Request succeeded |
| **201** | Created | New resource created |
| **400** | Bad Request | Invalid input, validation error |
| **401** | Unauthorized | Missing or expired token |
| **403** | Forbidden | User lacks required role/permission |
| **404** | Not Found | Resource doesn't exist |
| **500** | Server Error | Unexpected backend error |

---

## Testing Endpoints (PowerShell)

### Signup
```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
    role = "TENANT"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/auth/signup `
  -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body
```

### Login
```powershell
$body = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
  -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body

$token = ($response.Content | ConvertFrom-Json).data.token
```

### Protected Endpoint
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/auth/me `
  -Headers @{'Authorization'="Bearer $token"}
```

---

**Remember:** All protected endpoints require `Authorization: Bearer <token>` header.
