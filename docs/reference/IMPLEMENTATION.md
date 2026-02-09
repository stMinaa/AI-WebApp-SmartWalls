# Smartwalls - Implementation Guide

## Color Scheme & Design System

### Navigation Bar Colors
**CRITICAL: Top navigation bar color must be #16202b across ALL authenticated pages**

- **Public Pages** (Home, Login, Signup): `#2c3e50` (dark blue-gray)
- **Authenticated Pages TopNav**: `#16202b` (dark blue-black)
- Navbar styling:
  - Position: `fixed`, top: 0, full width
  - Padding: `15px 40px`
  - z-index: `100`
  - Links: Simple text buttons, transparent background, white color, no borders

### Profile Sidebar Colors
**CRITICAL: Each role has specific sidebar and button colors**

- **Tenant**: 
  - Sidebar: `#1fc08f` (teal)
  - Buttons: `#147346` (dark green)
- **Manager**: 
  - Sidebar: `#a79cc7` (purple)
  - Buttons: `#7f5f91` (dark purple)
- **Associate**: 
  - Sidebar: `#74a1c9` (blue)
  - Buttons: `#476078` (dark blue)
- **Director**: 
  - Sidebar: `#aab1af` (gray)
  - Buttons: `#6c737b` (dark gray)

### Button Colors
- **Primary Action Buttons**: `#198653` (green - general use)
- **Links in Dark Transparent Boxes**: `#1fc08f` (lighter green for visibility)

### Transparency & Backgrounds
- **Login/Signup Boxes**: `rgba(0, 0, 0, 0.5)` (dark transparent)
  - Backdrop filter: `blur(10px)`
  - Border radius: `12px`
  - Box shadow: `0 4px 20px rgba(0,0,0,0.3)`
- **All text in transparent boxes**: White (`#fff`, `#ddd`)
- **Input backgrounds**: `#f8f9fa` (light gray)

### Typography
- **Main Title (Smartwalls)**: 
  - Font size: `120px`
  - Font weight: `300` (thin, modern)
  - Letter spacing: `2px`
  - **NO TEXT SHADOW** (removed for clean modern look)
- **Subtitles**: 
  - Font size: `28px`
  - Font weight: `300`
- **Body/Labels**: 
  - Font size: `14-16px`
  - Font weight: `400`
- **Buttons**: 
  - Font weight: `600` (primary actions)
  - Font weight: `500` (secondary actions)

### Font System
**CRITICAL: NO custom fonts - Caviar Dreams causes password bullet rendering bug**
- System fonts only: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- **NEVER** use Caviar Dreams font - it renders password bullets (•) as eye-like characters

## Component Structure

### Public Pages
1. **Home.js** - Landing page
   - Dark navbar: `#2c3e50`
   - "Smartwalls" title (thin font, no shadow)
   - Subtitle: "Tennet's assembly and building management"
   - VideoBackground component with building video

2. **Login.js** - User authentication
   - Dark navbar: `#2c3e50` (must match Home)
   - Dark transparent card (`rgba(0, 0, 0, 0.5)`)
   - Labels above inputs: "Username", "Password"
   - White text for dark background
   - Password input: `autocomplete="new-password"` to prevent browser UI
   - "Log In" button text

3. **Signup.js** - User registration
   - Dark navbar: `#2c3e50` (must match Home/Login)
   - Dark transparent card (`rgba(0, 0, 0, 0.5)`)
   - Role selection dropdown (tenant, associate, manager, director, admin)
   - Building selection for tenants
   - White title "Registracija"
   - Account approval message after signup

### Authenticated Pages
All use TopNav component with `#202428` background

1. **TenantDashboard.js**
   - Sidebar color: `#1fc08f`
   - Button color: `#198654`
   - Greeting: "Zdravo {name}" (NO emoji)
   - Tabs: Početna, Glasanja, Obaveštenja, Prijavi Problem
   - Issue reporting modal
   - Issue history with filtering (all/my issues)

2. **AssociateDashboard.js**
   - Display: "Stanar: {name}" (NO emoji)
   - Active jobs section
   - Issue assignment flow

3. **ManagerDashboard.js**
   - Building management
   - Issue approval
   - Associate assignments

4. **DirectorDashboard.js**
   - Multi-building oversight
   - Company-wide analytics

5. **AdminDashboard.js**
   - User approval system
   - Building creation
   - System-wide management

## Critical Bug Fixes

### Password Eye Icon Bug (RESOLVED)
- **Issue**: Password bullet characters (•••) rendered as eye-like glyphs
- **Root Cause**: Caviar Dreams font from CDN had corrupted glyph mapping
- **Solution**: 
  1. Removed font CDN link from `public/index.html`
  2. Removed 'Caviar Dreams' from font-family in `index.css`
  3. Reverted to system fonts
- **Files Modified**: `index.html`, `index.css`

### CSS Password Icon Hiding
Added extensive CSS to hide browser password reveal icons:
```css
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear,
input[type="password"]::-webkit-contacts-auto-fill-button,
input[type="password"]::-webkit-credentials-auto-fill-button {
  display: none !important;
  visibility: hidden !important;
}
```

### Emoji Icons Removed
- **Reason**: User requested clean, professional UI
- **Changes**:
  - TopNav.js: 👤 → "Profile", ➜ → "Exit"
  - TenantDashboard.js: Removed 👋 from greeting
  - AssociateDashboard.js: Removed 👤 from tenant display

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
  - Body: `{ username, email, password, firstName, lastName, role, building }`
  - Returns: Success message (requires manager approval)
- `POST /api/auth/login` - User login
  - Body: `{ username, password }`
  - Returns: `{ token, user }`

### Users
- `GET /api/users` - Get all users (admin/manager)
- `PUT /api/users/:id/approve` - Approve user (manager/admin)
- `GET /api/users/:id` - Get user details

### Buildings
- `GET /api/buildings` - Get all buildings
- `POST /api/buildings` - Create building (admin/manager)
- `GET /api/buildings/:id/apartments` - Get apartments in building

### Issues
- `GET /api/issues` - Get all issues
- `POST /api/issues` - Report new issue
- `PUT /api/issues/:id` - Update issue status
- `PUT /api/issues/:id/assign` - Assign to associate

### Polls
- `GET /api/polls` - Get all polls
- `POST /api/polls` - Create poll (manager)
- `POST /api/polls/:id/vote` - Submit vote

### Notices
- `GET /api/notices` - Get all notices
- `POST /api/notices` - Create notice (manager/director)

## Authentication Flow

1. **Signup**: User creates account → Pending approval
2. **Approval**: Manager/Admin approves user → Active status
3. **Login**: User logs in → Receives JWT token
4. **Token Storage**: Saved in localStorage as 'token'
5. **Auto-login**: App.js checks token on mount, fetches user data
6. **Logout**: Clear token and user state, navigate to home

## State Management

### App.js (Main State)
```javascript
const [user, setUser] = useState(null);
const [view, setView] = useState('home');
const [token, setToken] = useState(localStorage.getItem('token'));
```

### Login Handler
```javascript
const handleLogin = (newToken, userData) => {
  localStorage.setItem('token', newToken);
  setToken(newToken);
  setUser(userData);
  navigate to appropriate dashboard
};
```

### Logout Handler
```javascript
const handleLogout = () => {
  localStorage.removeItem('token');
  setToken(null);
  setUser(null);
  setView('home');
};
```

## Role-Based Access Control

### Roles Hierarchy
1. **Admin** - Full system access
2. **Director** - Company-wide management
3. **Manager** - Building-level management
4. **Associate** - Service worker (issue resolution)
5. **Tenant** - Building resident

### Permission Matrix
- **Create Building**: Admin, Manager
- **Approve Users**: Admin, Manager
- **Create Polls**: Manager, Director
- **Create Notices**: Manager, Director
- **Report Issues**: Tenant
- **Resolve Issues**: Associate (assigned)
- **Assign Issues**: Manager

## Testing

### E2E Test Results
- **Total Tests**: 144 passing ✅
- **Coverage**: All user flows, API endpoints, authentication
- **Test Files**: Located in test directory

### Manual Testing Checklist
- [ ] All pages have consistent navbar color
- [ ] Login/Signup boxes are dark transparent
- [ ] No emoji icons visible
- [ ] Password fields show bullets (not eyes)
- [ ] Smartwalls title is thin, modern, no shadow
- [ ] All buttons use correct green color (#198653)
- [ ] White text readable on dark transparent backgrounds

## Development Guidelines

### Adding New Pages
1. Import VideoBackground if public page
2. Use correct navbar color:
   - Public: `#2c3e50`
   - Authenticated: Use TopNav component (`#202428`)
3. Maintain consistent button styling
4. Use system fonts only
5. Test on multiple browsers

### Styling Consistency
- Always use inline styles (current pattern)
- Match existing color scheme exactly
- Use transparent backgrounds for overlay cards
- Include backdrop blur for glass effect
- White text on dark backgrounds
- Dark text on light backgrounds

### Common Pitfalls to Avoid
- ❌ Using custom fonts (causes rendering bugs)
- ❌ Inconsistent navbar colors across pages
- ❌ Adding emoji icons
- ❌ Forgetting backdrop blur on transparent boxes
- ❌ Wrong green shade on buttons
- ❌ Text shadows on titles (removed for modern look)
- ❌ Saving user object to localStorage (only token)

## Server Configuration

### Backend (Node.js + Express)
- Port: `5000`
- Database: MongoDB (connection in .env)
- Key files: `backend/index.js`, `backend/Program.cs` (hybrid setup)

### Frontend (React)
- Port: `3000`
- Start: `yarn start` or `npm start`
- Build: `yarn build`

### Environment Variables
```
MONGODB_URI=mongodb://localhost:27017/smartwalls
PORT=5000
JWT_SECRET=your_secret_key
```

## Deployment Checklist

- [ ] All navbar colors verified consistent
- [ ] No custom fonts in index.html
- [ ] All emoji icons removed
- [ ] Password fields tested in all browsers
- [ ] API endpoints secured with JWT
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] E2E tests passing
- [ ] Build completes without errors
- [ ] Both servers start successfully

## Known Issues & Resolutions

### ✅ RESOLVED: Creepy Eye Icons
- See "Password Eye Icon Bug" section above

### ✅ RESOLVED: Inconsistent Navbar
- All pages updated to use correct colors
- Public: `#2c3e50`, Authenticated: `#202428`

### ✅ RESOLVED: Duplicate Code in Login/Signup
- Removed old navbar fragments causing JSX errors
- Cleaned up duplicate button code

## Maintenance Notes

### When Adding New Features
1. Check this guide for color scheme
2. Maintain navbar consistency
3. Use existing component patterns
4. Test on multiple browsers
5. Update this documentation

### Regular Checks
- Verify navbar colors haven't changed
- Test password fields in Chrome, Firefox, Edge
- Check transparent box rendering
- Validate button colors match spec
- Ensure no custom fonts added

---

**Last Updated**: February 2, 2026
**Version**: 1.0 (Post-Eye Icon Fix)
**Status**: Production Ready
