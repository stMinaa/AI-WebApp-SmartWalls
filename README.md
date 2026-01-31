# Building & Tenant Management Web App

A full-stack web application for managing buildings, tenants, and maintenance issues, built with **Node.js/Express** (backend) and **React** (frontend), with **MongoDB Atlas** database.

## Current Status

✅ **Basic Authentication Working**
- User signup and login with JWT tokens
- Password hashing with bcryptjs
- MongoDB Atlas integration
- Role field ready for expansion

## Project Structure

```
backend/              - Node.js + Express API
  ├─ index.js        - Main server file
  ├─ models/         - MongoDB schemas (User, Building, Apartment, etc.)
  └─ package.json    - Dependencies

frontend/            - React single-page app
  ├─ src/
  │  ├─ App.js       - Main routing and auth logic
  │  ├─ Login.js     - Login form
  │  ├─ Signup.js    - Signup form
  │  └─ [Dashboards] - Role-based dashboards (coming soon)
  └─ package.json    - Dependencies
```

## Prerequisites

- **Node.js** 16+ installed
- **npm** or **yarn** package manager
- MongoDB Atlas account (connection string provided in backend)

## Quick Start

### 1. Start Backend (Terminal 1)
```bash
cd backend
node index.js
```
Expected output:
```
✅ MONGO RUNNING - Connected to MongoDB
✅ BACKEND RUNNING - Server listening on port 5000
```

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm start
```
The app opens at http://localhost:3000

### 3. Test It
- Go to http://localhost:3000
- Sign up with username, email, password
- Login with your credentials
- View your profile

## API Overview

### Authentication Endpoints
```
POST   /api/auth/signup    - Create new user
POST   /api/auth/login     - Authenticate user
GET    /api/auth/me        - Get current user (requires token)
```

All requests/responses follow consistent JSON format:
```javascript
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ }
}
```

## Database (MongoDB Atlas)

- **Database**: `tennetdb`
- **Collections**: Users (currently only)
- **Connection**: Using connection string with credentials

## Development References

This project is being rebuilt incrementally with a focus on code quality and testing:

- **[docs/DEVELOPMENT_SYSTEM.md](docs/DEVELOPMENT_SYSTEM.md)** - Overview and how to use the docs
- **[docs/CODE_QUALITY_STANDARDS.md](docs/CODE_QUALITY_STANDARDS.md)** - Code style and quality rules
- **[docs/ROLE_SYSTEM_SPECIFICATION.md](docs/ROLE_SYSTEM_SPECIFICATION.md)** - Feature roadmap (7 phases)
- **[docs/TESTING_REQUIREMENTS.md](docs/TESTING_REQUIREMENTS.md)** - Test cases for each phase
- **[docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)** - Process for adding features
- **[docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Useful commands and code snippets

## Next Steps
- Implement entities and API endpoints in the backend for assemblies, buildings, and tenants.
- Build React components to interact with these endpoints.

---

For any issues, please check your Node.js and .NET versions, and ensure all dependencies are installed.
