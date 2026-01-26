# Tennet's Assembly and Building Management Web App

This project is a full-stack web application for managing assemblies, buildings, and tenants, built with ASP.NET Core (backend) and React (frontend).

## Project Structure

- `backend/` - ASP.NET Core Web API for business logic and data management
- `frontend/` - React PWA for user interface

## Prerequisites
- Node.js 20.x (for frontend)
- Yarn (for frontend)
- .NET 7 or later (for backend)

## Setup Instructions

### Backend
1. Navigate to the `backend` folder:
   ```powershell
   cd backend
   ```
2. Run the backend API:
   ```powershell
   dotnet run
   ```
   The API will start on `https://localhost:5001` (default).

### Frontend
1. Navigate to the `frontend` folder:
   ```powershell
   cd frontend
   ```
2. Install dependencies (if not already done):
   ```powershell
   yarn install
   ```
3. Start the React app:
   ```powershell
   yarn start
   ```
   The app will open at `http://localhost:3000`.

## Connecting Frontend and Backend
- Update API URLs in the React app to point to the backend (see `src` folder in `frontend`).
- For development, you may need to set up a proxy in `frontend/package.json`:
  ```json
  "proxy": "https://localhost:5001"
  ```

## Next Steps
- Implement entities and API endpoints in the backend for assemblies, buildings, and tenants.
- Build React components to interact with these endpoints.

---

For any issues, please check your Node.js and .NET versions, and ensure all dependencies are installed.
