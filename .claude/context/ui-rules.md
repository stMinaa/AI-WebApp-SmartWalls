# UI/UX Design Standards

**Source:** Extracted from `docs/standards/UI_UX.md`

---

## 🚨 CRITICAL RULES

### Language
- **ALL UI text MUST be in Serbian** (Latin script)
- Includes: labels, buttons, messages, placeholders, navigation, headings
- Code/comments can be English

### Font System
**MANDATORY: System fonts ONLY**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

**NEVER use Caviar Dreams** - causes password rendering bug (bullets render as eyes).

### Design Restrictions
- **NO gradient colors** (e.g., `linear-gradient`)
- **NO bright/vibrant colors** (e.g., `#FF0000`, `#00FF00`)
- **NO colorful emojis** (e.g., 🏢 🎉 ✨)
- **NO English text in UI**
- **YES to black/white icons** (e.g., ▪ ○ ✓ ✕ ▸)
- **YES to subtle grays** (#f8f9fa, #e9ecef, #6c757d)

---

## Color Palette

### Navigation Bar Colors
| Context | Background Color | Notes |
|---------|------------------|-------|
| **Public Pages** (Home, Login, Signup) | `#2c3e50` | Dark blue-gray |
| **Authenticated Pages** (TopNav) | `#16202b` | Dark blue-black, fixed, full width |

**TopNav Styling:**
```css
position: fixed;
top: 0;
width: 100%;
padding: 15px 40px;
z-index: 100;
background: #16202b;
```
Links: White text buttons, transparent bg, no borders.

---

### Role Sidebar Colors

| Role | Sidebar Background | Button Color |
|------|-------------------|--------------|
| **Tenant** | `#1fc08f` (teal) | `#147346` (dark green) |
| **Manager** | `#a79cc7` (purple) | `#7f5f91` (dark purple) |
| **Associate** | `#74a1c9` (blue) | `#476078` (dark blue) |
| **Director** | `#aab1af` (gray) | `#6c737b` (dark gray) |

**Usage:** Profile page sidebars, role-specific visual identity.

---

### Action Button Colors

| Context | Color | Usage |
|---------|-------|-------|
| **Primary Action** | `#198653` (green) | Main action buttons |
| **Links in Dark Boxes** | `#1fc08f` (lighter green) | Better visibility on dark backgrounds |

---

### Status Badge Colors

| Status | Color | Context |
|--------|-------|---------|
| **Reported** | `#6b7280` (gray) | Issue just reported |
| **Forwarded** | `#f59e0b` (yellow) | Issue forwarded to director |
| **Assigned** | `#2563eb` (blue) | Issue assigned to associate |
| **In Progress** | `#f97316` (orange) | Associate working on it |
| **Resolved** | `#10b981` (green) | Issue completed |
| **Rejected** | `#ef4444` (red) | Issue rejected |

---

### Transparency & Backgrounds

| Element | CSS Value |
|---------|-----------|
| **Login/Signup Boxes** | `background: rgba(0, 0, 0, 0.5);` |
|  | `backdrop-filter: blur(10px);` |
|  | `border-radius: 12px;` |
|  | `box-shadow: 0 4px 20px rgba(0,0,0,0.3);` |
| **Text in Transparent Boxes** | White (`#fff`, `#ddd`) |
| **Input Backgrounds** | `#f8f9fa` (light gray) |
| **Page Background (auth)** | `#f5f5f5` or `#e8e8e8` |

---

### Neutral Colors

```css
/* Text */
--text-primary:    #2c3e50;   /* Headings, important text */
--text-secondary:  #7f8c8d;   /* Descriptions, labels */
--text-muted:      #95a5a6;   /* Hints, placeholders */

/* Backgrounds */
--bg-light:        #f8f9fa;   /* Page backgrounds */
--bg-medium:       #e9ecef;   /* Cards, panels */
--border:          #dee2e6;   /* Dividers, borders */
--white:           #ffffff;   /* Containers, inputs */

/* Accents */
--success-green:   #27ae60;   /* Approvals, success */
--warning-orange:  #e67e22;   /* Warnings, pending */
--error-red:       #c0392b;   /* Errors, rejections */
--info-gray:       #95a5a6;   /* Neutral info */
```

---

## Typography

### Font Sizes

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| **Main Title** (Smartwalls) | `120px` | `300` | `letter-spacing: 2px`, NO text shadow |
| **Subtitle** | `28px` | `300` |  |
| **Section Heading** (INFORMACIJE) | `24px` | `300` | `letter-spacing: 4px` |
| **Page Title (H1)** | `32px` / `2rem` | — |  |
| **Section Title (H2)** | `24px` / `1.5rem` | — |  |
| **Card Title (H3)** | `20px` / `1.25rem` | — |  |
| **Body / Labels** | `16px` / `1rem` | `400` |  |
| **Small** (role labels, buttons) | `14px` / `0.875rem` | — |  |
| **Tiny** (timestamps, hints) | `12px` / `0.75rem` | — |  |
| **Large Display** (debt) | `48px` / `3rem` | `300` |  |

### Font Weights

```
Light:      300   → Section headings, field values, large numbers, main title
Regular:    400   → Body text
Semibold:   600   → Field labels, buttons, user names, primary actions
Bold:       700   → Strong emphasis (rare)
```

---

## Spacing System (8px Grid)

**ALL margins, padding, gaps use multiples of 8px:**

```css
--spacing-xxs:  4px;    /* 0.25rem  - Icon padding */
--spacing-xs:   8px;    /* 0.5rem   - Tight spacing */
--spacing-sm:   16px;   /* 1rem     - Default spacing */
--spacing-md:   24px;   /* 1.5rem   - Section spacing */
--spacing-lg:   32px;   /* 2rem     - Large gaps */
--spacing-xl:   48px;   /* 3rem     - Page padding */
--spacing-xxl:  64px;   /* 4rem     - Major sections */
```

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
border: none;
cursor: pointer;
```

**Secondary:**
```css
background: #ffffff;
color: #198653;
border: 1px solid #198653;
padding: 10px 20px;
border-radius: 4px;
font-weight: 600;
```

**Danger:**
```css
background: #ef4444;
color: #ffffff;
padding: 10px 20px;
border-radius: 4px;
```

**Button States:**
- **Hover:** Darken 10%
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`
- **Loading:** Spinner + disabled

---

### Cards

```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 8px;
padding: 20px;
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
```

- **Between cards:** `16px` gap
- **Card title margin-bottom:** `16px`

---

### Forms

**Input Fields:**
```css
width: 100%;
padding: 10px;
border: 1px solid #d1d5db;
border-radius: 4px;
font-size: 14px;
```

**States:**
- **Focus:** `border: #2563eb`, `outline: 2px #dbeafe`
- **Error:** `border: #ef4444`
- **Disabled:** `background: #f3f4f6`

**Labels:**
```css
font-size: 14px;
font-weight: 600;
color: #374151;
margin-bottom: 8px;
display: block;
```

---

### Status Badges

```css
padding: 4px 12px;
border-radius: 12px;
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
```

**Urgency Badges:**
- **Urgent:** Red background, white text, pulse animation
- **Not Urgent:** Gray background, dark text

---

## Layout Standards

### Profile Page Layout

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (220px)    │  Main Content                  │
│  [Role Color]       │  [Light Gray Background]       │
│                     │                                │
│  ┌─────────────┐    │  INFORMACIJE                   │
│  │   Avatar    │    │                                │
│  │  180×180    │    │  Ime          Prezime          │
│  └─────────────┘    │  [value]      [value]          │
│                     │                                │
│  Role Label         │  Email        Broj telefona    │
│  Full Name          │  [value]      [value]          │
│                     │                                │
│  [Izmeni podatke]   │  [Tenant only: DUGOVANJA]      │
│                     │  2345                          │
│                     │  [Plati]                       │
└──────────────────────────────────────────────────────┘
```

**Sidebar:**
```css
background: [Role color];
padding: 32px 16px;
min-height: 100vh;
text-align: center;
```

Contents:
- Avatar (180×180px)
- Role Label (14px, `rgba(255,255,255,0.9)`)
- Full Name (20px, `#fff`, weight 600)
- Edit Button ("Izmeni podatke", `rgba(0,0,0,0.2)` bg)

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

- **Field Labels:** 16px, weight 600, `#333`
- **Field Values:** 16px, weight 300, `#666`

---

### Role-Specific Profile Details

**Tenant** (Sidebar: `#1fc08f`):
- Fields: Korisničko ime, Zgrada, Broj stana, Broj ukucana
- Special: DUGOVANJA section (48px, weight 300, green "Plati" button)

**Manager** (Sidebar: `#a79cc7`):
- Fields: Ime, Prezime, Email, Broj telefona

**Director** (Sidebar: `#aab1af`):
- Fields: Ime, Prezime, Email, Broj telefona

**Associate** (Sidebar: `#74a1c9`):
- Heading: Company name or specialty instead of "INFORMACIJE"
- Fields: Ime, Prezime, Email, Broj telefona

---

### Page Layout

```css
max-width: 1200px;
margin: 0 auto;
padding: 48px; /* 24px on mobile */
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

## Landing & Authentication Pages

### Home Page
- Full-screen looping video background (buildings)
- Semi-transparent dark overlay
- Navbar: `#2c3e50`
- "Smartwalls" title: 120px, thin, white, NO shadow
- Subtitle: "Tenant's assembly and building management"

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

## Manager Dashboard - Building Cards

**CRITICAL: Manager has ONLY 2 top-level tabs:**
1. **Profile**
2. **Buildings**

All building actions accessed via **5 buttons on each building card:**

1. **Detalji o zgradi** - Tenant list
2. **Kvarovi** - Issue triage
3. **Oglasna tabla** - Notices
4. **Ankete** - Polls
5. **Naplati** - Billing

**NO separate top-level tabs** for Apartments, Tenants, Issues, etc.

**Building Card Display:**
- Building image (top)
- **Lokacija** (Location): Building name/address
- **Broj stanova** (Number of apartments): Auto-calculated

---

## Responsive Breakpoints

```css
Mobile:    < 640px     /* 1 column, 16px padding, hamburger menu */
Tablet:    640-1024px  /* 2 columns */
Desktop:   > 1024px    /* 3+ columns */
```

---

## Accessibility (WCAG AA)

### Keyboard Navigation
- All interactive elements reachable via Tab
- Focus states: 2px outline `#2563eb`

### Color Contrast
- Text on white: minimum 4.5:1
- Text on images: use overlays

### Screen Readers
- Alt text on images
- Aria labels on icon-only buttons

---

**Remember:** UI standards are strict. Serbian text, system fonts, no exceptions.
