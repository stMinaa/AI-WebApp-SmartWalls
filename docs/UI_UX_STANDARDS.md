# UI/UX Design Standards

Design guidelines for the Tenant Management System to ensure consistent, accessible, and user-friendly interface.

---

## 🏠 Landing Page & Authentication

### Landing Page (Public - Home)
**Layout:**
- Full-screen background: Looping video of buildings (overlay with semi-transparent dark gradient)
- Centered content with white text
- Top navigation bar (dark, transparent background)

**Elements:**
- **Logo/Title:** "Smartwalls" (large, bold, white sans-serif font)
- **Tagline:** "Tennet's assembly and building management" (smaller, white, below title)
- **Navigation:** Top-left corner
  - Home (current page)
  - Login (link to login page)
  - Style: White text, dark background (#2C3E50 or darker with transparency)

**Background Video:**
- Looping video of modern buildings/apartments
- Semi-transparent overlay to ensure text readability
- Subtle fade-in animation on page load

---

### Login Page
**Layout:**
- Same full-screen video background as landing page
- Centered modal/card with login form
- Semi-transparent white card (backdrop blur effect)

**Form Elements:**
- **Card:** White/light background with slight transparency, centered
- **Username Field:**
  - Label: "Username" (white text, above input)
  - Input: White background, rounded corners, placeholder: "anja@smartwalls"
- **Password Field:**
  - Label: "Password" (white text, above input)
  - Input: White background, rounded corners, password dots shown
- **Submit Button:**
  - Text: "Log In"
  - Color: Green (#10b981 or similar)
  - Style: Rounded, full-width within card
  - Hover: Darker green

**Navigation:**
- Same top navigation as landing page (Home, Login)

**Signup Page:**
- Similar layout to Login
- Additional fields: firstName, lastName, email, role dropdown
- Submit button: "Sign Up" (same green styling)
- Message below: "Your account requires approval" (small text)

---

## 📸 How to Add Images to This File

```markdown
![Button Example](./images/button-example.png)
or
![Wireframe](https://example.com/image.png)
```

Store design assets in: `docs/images/` folder

---

## 🎨 Color Palette

### Primary Colors
```
Primary Blue:    #2563eb  (General buttons, links)
Dark Blue:       #1e40af  (Hover states)
Light Blue:      #dbeafe  (Backgrounds, highlights)
```

### Background Colors
```
Page Background:     #f5f5f5 or #e8e8e8  (Light gray for profile main area)
Sidebar Background:  [Role-specific - see Role Colors]
Card Background:     #ffffff  (White cards)
```

### Status Colors
```
Success Green:   #10b981  (✅ Completed, approved)
Warning Yellow:  #f59e0b  (⚠️ Pending, urgent)
Error Red:       #ef4444  (❌ Rejected, errors)
Info Gray:       #6b7280  (ℹ️ Neutral information)
```

### Role Colors (Sidebar Backgrounds)
```
Tenant:          #26D07C  (Green/Teal)
Manager:         #B8A3D4  (Purple/Lavender)
Director:        #8A8A8A  (Gray)
Associate:       #6BA3D4  (Light Blue)
Admin:           #64748b  (Slate)
```

### Neutral Colors
```
Background:      #f9fafb  (Page background)
Card:            #ffffff  (Cards, modals)
Border:          #e5e7eb  (Borders, dividers)
Text Primary:    #111827  (Headings, body)
Text Secondary:  #6b7280  (Labels, captions)
```

---

## 📏 Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes
```
Section Heading:  24px / 1.5rem  (INFORMACIJE, letter-spacing: 4px, font-weight: 300)
Heading 1:        32px / 2rem    (Page titles)
Heading 2:        24px / 1.5rem  (Section titles)
Heading 3:        20px / 1.25rem (Card titles)
Body:             16px / 1rem    (Default text, field labels)
Small:            14px / 0.875rem (Role labels, buttons)
Tiny:             12px / 0.75rem  (Timestamps, hints)
Large Display:    48px / 3rem     (Debt amount display)
```

### Font Weights
```
Light:      300  (Section headings like "INFORMACIJE", field values, large numbers)
Regular:    400  (Body text)
Semibold:   600  (Field labels, buttons, user names)
Bold:       700  (Strong emphasis if needed)
```

---

## 🧱 Spacing System (8px Grid)

```
XXS:  4px   (0.25rem)  - Icon padding
XS:   8px   (0.5rem)   - Tight spacing
SM:   16px  (1rem)     - Default spacing
MD:   24px  (1.5rem)   - Section spacing
LG:   32px  (2rem)     - Large gaps
XL:   48px  (3rem)     - Page padding
XXL:  64px  (4rem)     - Major sections
```

**Rule**: All margins, padding, gaps use multiples of 8px

---

## 🔘 Component Standards

### Buttons

#### Primary Button
```css
background: #2563eb
color: #ffffff
padding: 10px 20px
border-radius: 4px
font-weight: 600
```
**Use for**: Main actions (Save, Submit, Create)

#### Secondary Button
```css
background: #ffffff
color: #2563eb
border: 1px solid #2563eb
padding: 10px 20px
border-radius: 4px
```
**Use for**: Cancel, secondary actions

#### Danger Button
```css
background: #ef4444
color: #ffffff
padding: 10px 20px
border-radius: 4px
```
**Use for**: Delete, reject, destructive actions

#### Button States
- **Hover**: Darken background by 10%
- **Disabled**: Opacity 0.5, cursor: not-allowed
- **Loading**: Show spinner, disable interaction

---

### Cards

```css
background: #ffffff
border: 1px solid #e5e7eb
border-radius: 8px
padding: 20px
box-shadow: 0 1px 3px rgba(0,0,0,0.1)
```

**Spacing**:
- Between cards: 16px (1rem)
- Inside card: 20px padding
- Card title margin-bottom: 16px

---

### Forms

#### Input Fields
```css
width: 100%
padding: 10px
border: 1px solid #d1d5db
border-radius: 4px
font-size: 14px
```

**States**:
- **Focus**: Border color #2563eb, outline 2px #dbeafe
- **Error**: Border color #ef4444, red text below
- **Disabled**: Background #f3f4f6, cursor: not-allowed

#### Labels
```css
font-size: 14px
font-weight: 600
color: #374151
margin-bottom: 8px
display: block
```

#### Required Fields
- Add red asterisk (*) after label
- Or use "(required)" text in gray

---

### Navigation (TopNav)

```css
background: #ffffff
border-bottom: 1px solid #e5e7eb
height: 64px
padding: 0 24px
```

**Tabs**:
- Active tab: Border-bottom 2px #2563eb, text #2563eb
- Inactive tab: Text #6b7280
- Hover: Text #111827

**Profile Button**:
- Position: Top right
- Circle avatar or icon
- Dropdown on click

---

### Status Badges

```css
padding: 4px 12px
border-radius: 12px
font-size: 12px
font-weight: 600
text-transform: uppercase
```

**Status Colors**:
- Reported: Gray (#6b7280)
- Forwarded: Yellow (#f59e0b)
- Assigned: Blue (#2563eb)
- In Progress: Orange (#f97316)
- Resolved: Green (#10b981)
- Rejected: Red (#ef4444)

---

### Urgency Badges

- **Urgent**: Red background, white text, pulse animation
- **Not Urgent**: Gray background, dark text

---

## 🖼️ Layout Standards

### Profile Page Layout (After Login Landing)
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

### Page Layout
```
Max width: 1200px
Centered horizontally
Padding: 24px (mobile), 48px (desktop)
```

### Dashboard Grid
```css
display: grid
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
gap: 16px
```

### Building Cards Grid
```css
display: grid
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
gap: 20px
```

---

## 📱 Responsive Breakpoints

```css
Mobile:     < 640px   (1 column)
Tablet:     640-1024px (2 columns)
Desktop:    > 1024px  (3+ columns)
```

### Mobile Adjustments
- Stack cards vertically
- Full-width buttons
- Reduce padding to 16px
- Hide secondary info
- Hamburger menu for navigation

---

## ♿ Accessibility Standards

### Keyboard Navigation
- All interactive elements must be reachable via Tab
- Focus states clearly visible (2px outline)
- Escape key closes modals/dropdowns

### Screen Readers
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Add `aria-label` for icon-only buttons
- Use `role` attributes where needed
- Alt text for all images

### Contrast Ratios (WCAG AA)
- Text: Minimum 4.5:1
- Large text: Minimum 3:1
- Interactive elements: Minimum 3:1

### Color Blindness
- Never use color alone to convey information
- Add icons/text to status badges
- Use patterns in charts

---

## 🎭 User Feedback

### Loading States
```
Skeleton screens for initial load
Spinner for button actions
Progress bar for file uploads
```

### Success Messages
```css
background: #d1fae5
border-left: 4px solid #10b981
padding: 12px 16px
```
**Duration**: 3-5 seconds, then fade out

### Error Messages
```css
background: #fee2e2
border-left: 4px solid #ef4444
padding: 12px 16px
color: #991b1b
```
**Duration**: Persist until dismissed or resolved

### Empty States
```
Icon + Message + Action Button
Example: "No issues reported yet. Report your first issue."
```

---

## 🧩 Component Patterns by Role

### Profile Page Layout (After Login)

All roles follow this layout:

#### Sidebar (Left, 220px width)
```css
background: [Role-specific color]
padding: 32px 16px
min-height: 100vh
text-align: center
```

**Contents (top to bottom)**:
1. **Avatar** - Illustrated character (180x180px, rounded corners)
2. **Role Label** - Small text, centered, uppercase
   ```css
   font-size: 14px
   color: rgba(255,255,255,0.9)
   margin-top: 16px
   ```
3. **Full Name** - User's first and last name
   ```css
   font-size: 20px
   font-weight: 600
   color: #ffffff
   margin-top: 8px
   line-height: 1.3
   ```
4. **Edit Button** - "Izmeni podatke" (Edit Info)
   ```css
   background: rgba(0,0,0,0.2)
   color: #ffffff
   border: none
   border-radius: 4px
   padding: 10px 20px
   margin-top: 20px
   font-size: 14px
   cursor: pointer
   ```

#### Main Content Area (Right side)
```css
background: #f5f5f5 or #e8e8e8 (light gray)
padding: 40px 60px
min-height: 100vh
```

**Contents**:
1. **Section Heading** - "INFORMACIJE" or role-specific heading
   ```css
   font-size: 24px
   font-weight: 300
   letter-spacing: 4px
   color: #333333
   margin-bottom: 32px
   ```

2. **Information Grid** - Two columns
   ```css
   display: grid
   grid-template-columns: 1fr 1fr
   gap: 32px 80px
   ```

3. **Field Labels**
   ```css
   font-size: 16px
   font-weight: 600
   color: #333333
   margin-bottom: 8px
   ```

4. **Field Values**
   ```css
   font-size: 16px
   font-weight: 300
   color: #666666
   ```

---

### Tenant Profile Specifics

**Sidebar**: Green/teal (#26D07C)

**Information Fields**:
- Korisničko ime (Username) - email format
- Zgrada (Building) - address
- Broj stana (Apartment number)
- Broj ukucana (Household members)

**Special Section**: DUGOVANJA (Debt)
```css
margin-top: 48px
```
- Large number display:
  ```css
  font-size: 48px
  font-weight: 300
  color: #333333
  ```
- "Plati" button (Pay):
  ```css
  background: #26D07C (green)
  color: #ffffff
  padding: 12px 32px
  border-radius: 4px
  font-size: 16px
  font-weight: 600
  margin-top: 16px
  ```

---

### Manager Profile Specifics

**Sidebar**: Purple/lavender (#B8A3D4)

**Information Fields**:
- Ime (First name)
- Prezime (Last name)
- Email
- Broj telefona (Phone number)

---

### Director Profile Specifics

**Sidebar**: Gray (#8A8A8A)

**Information Fields**:
- Ime (First name)
- Prezime (Last name)
- Email
- Broj telefona (Phone number)

---

### Associate Profile Specifics

**Sidebar**: Light blue (#6BA3D4)

**Company/Specialty Heading**: Instead of "INFORMACIJE"
- Display company name or specialty (e.g., "ELEKTRO VANJA")
- Same styling as section heading

**Information Fields**:
- Ime (First name)
- Prezime (Last name)
- Email
- Broj telefona (Phone number)

---

### Dashboard Tabs (Not on Profile)
- **Home Tab**: Company info, recent notices
- **Issues Tab**: List of issues with status badges
- **Bulletin Board Tab**: Notices (outlined if manager-posted) + Polls

### Manager Dashboard
- **Home Tab**: Statistics overview
- **Buildings Tab**: Building cards grid with "Manage" button
- **Building Detail**: Tabs for Apartments, Tenants, Issues, Bulletin Board

### Director Dashboard
- **Buildings Tab**: All buildings with assign manager option
- **Managers Tab**: Manager cards with load indicator
- **Associates Tab**: Associate profile cards
- **Approvals Tab**: Pending staff cards with Approve/Reject buttons
- **Issues Tab**: Forwarded issues with assign dropdown

### Associate Dashboard
- **Jobs Tab**: Assigned jobs with accept/reject/complete actions
- Each job card shows: Building address, tenant name, unit number

---

## 🖱️ Interaction Patterns

### Dropdowns
```
Click to open
Click outside to close
Escape key to close
Arrow keys to navigate options
Enter to select
```

### Modals
```
Centered on screen
Dark overlay (rgba(0,0,0,0.5))
Escape key to close
Click outside to close (for non-critical)
```

### Forms
```
Submit on Enter key
Validate on blur (individual fields)
Show all errors on submit
Disable submit during loading
Auto-focus first field on open
```

### Tables
```
Sortable headers (↑↓ arrows)
Row hover effect (background #f9fafb)
Sticky header on scroll
Pagination if > 20 items
```

---

## 🎯 Specific UI Elements

### Issue Card (Tenant)
```
┌─────────────────────────────────────┐
│ [Urgent] 🔴 Water Leak in Kitchen   │
│ Status: [In Progress]               │
│ Reported: Jan 15, 2026              │
│ Cost: $150                          │
│ ETA: Jan 20, 2026                   │
│ [I'll be home ✓]                    │
└─────────────────────────────────────┘
```

### Building Card (Manager/Director)
```
┌─────────────────────────────────────┐
│ [Image]                             │
│ Downtown Tower                      │
│ 123 Main St                         │
│ 24 apartments                       │
│ Manager: John Doe                   │
│                                     │
│ [Manage Apartments] [View Issues]   │
└─────────────────────────────────────┘
```

### Notice Card (Tenant - Manager Posted)
```
┌─────────────────────────────────────┐ ← Outlined border
│ 📢 Elevator Maintenance             │
│ "The elevator will be out of ser... │
│                                     │
│ Posted by: Jane Smith (Manager)     │
│ Jan 10, 2026                        │
│                                     │
│ [Mark as Read]                      │
└─────────────────────────────────────┘
```

### Poll Card (Tenant)
```
┌─────────────────────────────────────┐
│ 🗳️ Best time for building meeting?  │
│                                     │
│ ○ Morning (9-11 AM)                 │
│ ○ Afternoon (2-4 PM)                │
│ ● Evening (6-8 PM) [Selected]       │
│                                     │
│ [Vote]                              │
│                                     │
│ Results: 10 votes                   │
│ Evening: 60% ████████░░             │
│ Morning: 30% ████░░░░░░             │
│ Afternoon: 10% ██░░░░░░░░           │
└─────────────────────────────────────┘
```

---

## 🚀 Animation Guidelines

### Subtle Animations Only
```css
transition: all 0.2s ease-in-out;
```

**Use for**:
- Button hover states
- Card hover elevation
- Modal fade in/out
- Dropdown slide down

**Don't use**:
- Page transitions
- Heavy animations on mobile
- Animations that delay user actions

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

## 📐 Wireframe Examples

Store wireframes as images in `docs/images/` folder:

```markdown
### Tenant Dashboard
![Tenant Dashboard](./images/tenant-dashboard.png)

### Manager Building View
![Manager Building](./images/manager-building.png)

### Director Approvals
![Director Approvals](./images/director-approvals.png)
```

---

## ✅ UI/UX Checklist

Before implementing a new feature:

**Layout**:
- [ ] Uses 8px grid spacing
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Consistent with existing pages

**Typography**:
- [ ] Font sizes match standards
- [ ] Font weights appropriate
- [ ] Text readable (contrast ≥ 4.5:1)

**Colors**:
- [ ] Uses defined color palette
- [ ] Status colors consistent
- [ ] Role colors if applicable

**Components**:
- [ ] Buttons match standards
- [ ] Forms validate properly
- [ ] Cards have proper spacing
- [ ] Status badges correct

**Interactions**:
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Loading states shown
- [ ] Error messages clear

**Accessibility**:
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Alt text on images
- [ ] Color not sole indicator

**User Feedback**:
- [ ] Success messages shown
- [ ] Error messages helpful
- [ ] Empty states defined
- [ ] Loading indicators present

---

## 🎨 Design Tools

Recommended tools for creating mockups/wireframes:
- **Figma** (web-based, free)
- **Excalidraw** (quick sketches)
- **Draw.io** (diagrams)
- **Screenshot + annotate** (for existing UI)

Export as PNG/JPG and save to `docs/images/` folder.

---

## 📝 Design Notes

Add design decisions, rationale, or user feedback here:

### Why outlined borders for manager-posted notices?
> To visually distinguish authoritative building management announcements from other content.

### Why no auto-login?
> Security requirement - users must explicitly authenticate each session.

### Why profile landing after login?
> Ensures users verify their information and understand their role permissions before navigating.

---

## 🔄 Updates

When you add new UI components or change design patterns, update this document:

1. Add screenshots to `docs/images/`
2. Document color choices
3. Add component specifications
4. Update checklist if needed

