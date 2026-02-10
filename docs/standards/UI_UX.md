# UI/UX Design Standards

Design system for Smartwalls - Building & Tenant Management System.

---

## Core Principles

### Language
- **ALL UI text MUST be in Serbian** (Latin script preferred for web readability)
- Includes: labels, buttons, messages, placeholders, navigation, headings, descriptions
- Code/comments can be in English

### UX
- **Intuitive** - Users understand functionality without explanation
- **Easy** - Minimize clicks and steps
- **Clear** - Descriptive labels and obvious action buttons
- **Consistent** - Same patterns across all pages and roles

### UI
- **Elegant & Minimal** - Clean, simple designs
- **Subtle** - Understated colors and spacing
- **Professional** - Business-appropriate styling
- **Refined** - Attention to typography, alignment, whitespace

### Restrictions
- NO gradient colors (e.g., linear-gradient)
- NO bright/vibrant colors (e.g., #FF0000, #00FF00)
- NO colorful emojis (e.g., 🏢 🎉 ✨)
- NO English text in UI
- YES to black/white icons (e.g., ▪ ○ ✓ ✕ ▸)
- YES to subtle grays (#f8f9fa, #e9ecef, #6c757d)

---

## Color Palette

### Navigation Bar
| Context | Color | Notes |
|---------|-------|-------|
| Public Pages (Home, Login, Signup) | `#2c3e50` | Dark blue-gray |
| Authenticated Pages (TopNav) | `#16202b` | Dark blue-black, fixed, full width |

**TopNav styling:** Position fixed, top 0, full width, padding `15px 40px`, z-index 100, links as white text buttons (transparent bg, no borders).

### Role Sidebar Colors (Implemented)
| Role | Sidebar | Buttons |
|------|---------|---------|
| Tenant | `#1fc08f` (teal) | `#147346` (dark green) |
| Manager | `#a79cc7` (purple) | `#7f5f91` (dark purple) |
| Associate | `#74a1c9` (blue) | `#476078` (dark blue) |
| Director | `#aab1af` (gray) | `#6c737b` (dark gray) |

### Action Buttons
| Context | Color |
|---------|-------|
| Primary Action Buttons | `#198653` (green) |
| Links in Dark Transparent Boxes | `#1fc08f` (lighter green for visibility) |

### Status Badge Colors
| Status | Color |
|--------|-------|
| Reported | `#6b7280` (gray) |
| Forwarded | `#f59e0b` (yellow) |
| Assigned | `#2563eb` (blue) |
| In Progress | `#f97316` (orange) |
| Resolved | `#10b981` (green) |
| Rejected | `#ef4444` (red) |

### Transparency & Backgrounds
| Element | Value |
|---------|-------|
| Login/Signup Boxes | `rgba(0, 0, 0, 0.5)` with `backdrop-filter: blur(10px)`, border-radius `12px`, box-shadow `0 4px 20px rgba(0,0,0,0.3)` |
| Text in transparent boxes | White (`#fff`, `#ddd`) |
| Input backgrounds | `#f8f9fa` (light gray) |
| Page background (auth pages) | `#f5f5f5` or `#e8e8e8` |

### Neutral Colors
```
Text Primary:        #2c3e50  (Headings, important text)
Text Secondary:      #7f8c8d  (Descriptions, labels)
Text Muted:          #95a5a6  (Hints, placeholders)
Background Light:    #f8f9fa  (Page backgrounds)
Background Medium:   #e9ecef  (Cards, panels)
Border:              #dee2e6  (Dividers, card borders)
White:               #ffffff  (Containers, inputs)
```

### Accent Colors
```
Success Green:       #27ae60  (Approvals, success messages)
Warning Orange:      #e67e22  (Warnings, pending status)
Error Red:           #c0392b  (Errors, rejections)
Info Gray:           #95a5a6  (Neutral information)
```

---

## Typography

### Font System
**CRITICAL: System fonts ONLY - NO custom fonts**

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

**NEVER use Caviar Dreams** - it renders password bullets (•) as eye-like characters. This was a resolved critical bug.

### Font Sizes
| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Main Title (Smartwalls) | `120px` | `300` (thin) | letter-spacing `2px`, NO text shadow |
| Subtitle | `28px` | `300` | |
| Section Heading (INFORMACIJE) | `24px` | `300` | letter-spacing `4px` |
| Page Title (H1) | `32px` / `2rem` | | |
| Section Title (H2) | `24px` / `1.5rem` | | |
| Card Title (H3) | `20px` / `1.25rem` | | |
| Body / Labels | `16px` / `1rem` | `400` | |
| Small (role labels, buttons) | `14px` / `0.875rem` | | |
| Tiny (timestamps, hints) | `12px` / `0.75rem` | | |
| Large Display (debt amount) | `48px` / `3rem` | `300` | |

### Font Weights
```
Light:      300  (section headings, field values, large numbers, main title)
Regular:    400  (body text)
Semibold:   600  (field labels, buttons, user names, primary actions)
Bold:       700  (strong emphasis if needed)
```

---

## Spacing System (8px Grid)

```
XXS:  4px   (0.25rem)  - Icon padding
XS:   8px   (0.5rem)   - Tight spacing
SM:   16px  (1rem)     - Default spacing
MD:   24px  (1.5rem)   - Section spacing
LG:   32px  (2rem)     - Large gaps
XL:   48px  (3rem)     - Page padding
XXL:  64px  (4rem)     - Major sections
```

**Rule**: All margins, padding, gaps use multiples of 8px.

---

## Component Standards

### Buttons

**Primary:**
```css
background: #198653;
color: #ffffff;
padding: 10px 20px;
border-radius: 4px;
font-weight: 600;
```

**Secondary:**
```css
background: #ffffff;
color: #198653;
border: 1px solid #198653;
padding: 10px 20px;
border-radius: 4px;
```

**Danger:**
```css
background: #ef4444;
color: #ffffff;
padding: 10px 20px;
border-radius: 4px;
```

**States:** Hover = darken 10%, Disabled = opacity 0.5 + cursor not-allowed, Loading = spinner + disabled.

### Cards
```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 8px;
padding: 20px;
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
```
Between cards: `16px`. Card title margin-bottom: `16px`.

### Forms

**Input Fields:**
```css
width: 100%;
padding: 10px;
border: 1px solid #d1d5db;
border-radius: 4px;
font-size: 14px;
```
Focus: border `#2563eb`, outline `2px #dbeafe`. Error: border `#ef4444`. Disabled: bg `#f3f4f6`.

**Labels:**
```css
font-size: 14px;
font-weight: 600;
color: #374151;
margin-bottom: 8px;
display: block;
```

### Status Badges
```css
padding: 4px 12px;
border-radius: 12px;
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
```

### Urgency Badges
- **Urgent**: Red background, white text, pulse animation
- **Not Urgent**: Gray background, dark text

---

## Layout Standards

### Profile Page Layout
```
┌─────────────────────────────────────────────────────┐
│  Sidebar (220px)    │  Main Content                 │
│  [Role Color]       │  [Light Gray Background]      │
│                     │                               │
│  ┌─────────────┐    │  INFORMACIJE                  │
│  │   Avatar    │    │                               │
│  │  180x180    │    │  Ime          Prezime         │
│  └─────────────┘    │  [value]      [value]         │
│                     │                               │
│  Role Label         │  Email        Broj telefona   │
│  Full Name          │  [value]      [value]         │
│                     │                               │
│  [Izmeni podatke]   │  [Tenant only: DUGOVANJA]     │
│                     │  2345                         │
│                     │  [Plati]                      │
└─────────────────────────────────────────────────────┘
```

**Sidebar:**
```css
background: [Role-specific color];
padding: 32px 16px;
min-height: 100vh;
text-align: center;
```

Contents: Avatar (180x180), Role Label (14px, rgba(255,255,255,0.9)), Full Name (20px, #fff, 600), Edit Button ("Izmeni podatke", rgba(0,0,0,0.2) bg).

**Main Content:**
```css
background: #f5f5f5;
padding: 40px 60px;
min-height: 100vh;
```

**Information Grid:**
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 32px 80px;
```

Field Labels: 16px, 600, #333. Field Values: 16px, 300, #666.

### Role-Specific Profile Details

**Tenant** (Sidebar: `#1fc08f`):
- Fields: Korisničko ime, Zgrada, Broj stana, Broj ukucana
- Special: DUGOVANJA section (48px, 300 weight, "Plati" button in `#1fc08f`)

**Manager** (Sidebar: `#a79cc7`):
- Fields: Ime, Prezime, Email, Broj telefona

**Director** (Sidebar: `#aab1af`):
- Fields: Ime, Prezime, Email, Broj telefona

**Associate** (Sidebar: `#74a1c9`):
- Heading: Company name or specialty instead of "INFORMACIJE"
- Fields: Ime, Prezime, Email, Broj telefona

### Page Layout
```
Max width: 1200px
Centered horizontally
Padding: 24px (mobile), 48px (desktop)
```

### Dashboard Grids
```css
/* General dashboard */
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 16px;

/* Building cards */
display: grid;
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: 20px;
```

---

## Landing Page & Authentication

### Home Page
- Full-screen looping video background (buildings)
- Semi-transparent dark overlay
- Navbar: `#2c3e50`
- "Smartwalls" title: 120px, thin, white, no shadow
- Subtitle: "Tennet's assembly and building management"

### Login Page
- Same video background as Home
- Navbar: `#2c3e50`
- Dark transparent card (`rgba(0, 0, 0, 0.5)`)
- Labels above inputs: white text
- Password: `autocomplete="new-password"`
- "Log In" button

### Signup Page
- Same video background
- Navbar: `#2c3e50`
- Dark transparent card
- Role selection dropdown
- Building selection for tenants
- White title "Registracija"
- Account approval message after signup

### CSS: Hide Browser Password Icons
```css
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear,
input[type="password"]::-webkit-contacts-auto-fill-button,
input[type="password"]::-webkit-credentials-auto-fill-button {
  display: none !important;
  visibility: hidden !important;
}
```

---

## Dashboard UI by Role

### Tenant Dashboard
- Sidebar: `#1fc08f`, Buttons: `#198654`
- Greeting: "Zdravo {name}" (NO emoji)
- Tabs: Početna, Glasanja, Obaveštenja, Prijavi Problem
- Issue reporting modal, issue history with filtering

### Manager Dashboard
**CRITICAL: Manager has ONLY 2 top-level tabs: Profile + Buildings**

Buildings tab: grid of building cards, each with:
- Building image, Lokacija, Broj stanova
- 5 action buttons:
  1. **Detalji o zgradi** - Tenant list
  2. **Kvarovi** - Issue triage
  3. **Oglasna tabla** - Notices
  4. **Ankete** - Polls
  5. **Naplati** - Billing

NO separate top-level tabs for Apartments, Tenants, Issues, etc.

### Director Dashboard
- Tabs: Buildings, Managers, Associates, Approvals, Issues
- Forwarded issues with assign dropdown

### Associate Dashboard
- Display: "Stanar: {name}" (NO emoji)
- Active jobs section, issue assignment flow

---

## Responsive Breakpoints

```css
Mobile:     < 640px   (1 column, 16px padding, hamburger menu)
Tablet:     640-1024px (2 columns)
Desktop:    > 1024px  (3+ columns)
```

---

## Accessibility (WCAG AA)

### Keyboard Navigation
- All interactive elements reachable via Tab
- Focus states: 2px outline
- Escape closes modals/dropdowns

### Screen Readers
- Semantic HTML (`<button>`, `<nav>`, `<main>`)
- `aria-label` for icon-only buttons
- Alt text for images

### Contrast
- Text: minimum 4.5:1
- Large text: minimum 3:1
- Never use color alone to convey information

---

## Interaction Patterns

### Dropdowns
- Click to open, click outside/Escape to close
- Arrow keys to navigate, Enter to select
- Full width for form fields, 14px font
- First option: "-- Izaberite --" or "-- Bez dodele --"

### Modals
- Centered, dark overlay `rgba(0,0,0,0.5)`
- Escape to close, click outside for non-critical

### Forms
- Submit on Enter, validate on blur
- Show all errors on submit, disable during loading
- Auto-focus first field on open

### Tables
- Sortable headers (↑↓), row hover `#f9fafb`
- Sticky header, pagination if > 20 items

---

## User Feedback

### Success Messages
```css
background: #d1fae5;
border-left: 4px solid #10b981;
padding: 12px 16px;
```
Duration: 3-5 seconds, fade out.

### Error Messages
```css
background: #fee2e2;
border-left: 4px solid #ef4444;
padding: 12px 16px;
color: #991b1b;
```
Duration: persist until dismissed.

### Loading States
- Skeleton screens for initial load
- Spinner for button actions
- Progress bar for file uploads

### Empty States
- Icon + Message + Action Button
- Example: "Nema prijavljenih kvarova. Prijavite prvi kvar."

---

## Animation Guidelines

```css
transition: all 0.2s ease-in-out;
```

**Use for:** button hover, card hover elevation, modal fade, dropdown slide.
**Don't use:** page transitions, heavy mobile animations, anything that delays user actions.

### Loading Spinner
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
animation: spin 1s linear infinite;
```

### Pulse (Urgent Badge)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
animation: pulse 2s ease-in-out infinite;
```

---

## UI/UX Checklist

Before implementing a new feature:

**Layout:** 8px grid, responsive, consistent with existing pages.
**Typography:** Sizes match, weights appropriate, contrast ≥ 4.5:1.
**Colors:** Defined palette, consistent status colors, role colors.
**Components:** Button standards, form validation, card spacing, status badges.
**Interactions:** Keyboard nav, focus states, loading states, error messages.
**Accessibility:** Semantic HTML, ARIA labels, alt text, color not sole indicator.

---

## Design Notes

- **Outlined borders for manager-posted notices** → distinguish authoritative announcements
- **No auto-login** → security: users must authenticate each session
- **Profile landing after login** → users verify info and understand role before navigating
- **No emoji icons** → clean, professional UI (removed 👤, ➜, 👋)

---

*Last updated: February 2026*
