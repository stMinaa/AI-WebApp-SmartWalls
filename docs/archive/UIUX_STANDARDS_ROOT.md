# Smartwalls - UI/UX Standards & Design Guidelines

## Design Philosophy

**Modern. Clean. Transparent. Professional.**

The Smartwalls interface prioritizes clarity, ease of use, and visual consistency. All design decisions should enhance user productivity and reduce cognitive load.

---

## Color Palette

### Primary Colors
```css
Primary Green:    #198653  /* General action buttons */
```

### Role-Specific Profile Sidebar Colors
```css
Tenant Sidebar:       #1fc08f  /* Teal */
Tenant Buttons:       #147346  /* Dark green */

Manager Sidebar:      #a79cc7  /* Purple */
Manager Buttons:      #7f5f91  /* Dark purple */

Associate Sidebar:    #74a1c9  /* Blue */
Associate Buttons:    #476078  /* Dark blue */

Director Sidebar:     #aab1af  /* Gray */
Director Buttons:     #6c737b  /* Dark gray */
```

### Neutral Colors
```css
Navigation Bar:   #16202b  /* Dark blue-black (TopNav for authenticated) */
Public Navbars:   #2c3e50  /* Dark blue-gray (Home, Login, Signup) */
Black Semi:       rgba(0, 0, 0, 0.5)  /* Card backgrounds */
White:            #ffffff
Light Gray:       #f8f9fa  /* Input backgrounds */
Text White:       #fff     /* Labels on dark */
Text Light:       #ddd     /* Secondary text on dark */
Text Dark:        #666     /* Labels on light */
```

### Semantic Colors
```css
Error Red:        #e74c3c  /* Error messages */
Success Green:    #198653  /* Success messages */
Warning Orange:   #f39c12  /* Warnings (if needed) */
Info Blue:        #3498db  /* Info messages (if needed) */
```

### Accessibility Requirements
- **Minimum contrast ratio**: 4.5:1 for normal text
- **Large text contrast**: 3:1 minimum (18pt+)
- All interactive elements must be keyboard accessible
- Focus states must be clearly visible
- Color should not be the only indicator of state

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

**CRITICAL: NEVER use Caviar Dreams or custom fonts**
- Caviar Dreams font renders password bullets (•) as eye-like characters
- System fonts only to prevent rendering bugs and ensure consistency

### Type Scale

#### Headings
```css
H1 (Hero Title):
  font-size: 120px
  font-weight: 300
  letter-spacing: 2px
  NO TEXT SHADOW

H2 (Page Titles):
  font-size: 28px
  font-weight: 400-600
  margin-bottom: 30px

H3 (Section Headers):
  font-size: 20-24px
  font-weight: 500

H4 (Subsections):
  font-size: 18px
  font-weight: 500
```

#### Body Text
```css
Body Large:       18px, weight 400
Body Regular:     16px, weight 400
Body Small:       14px, weight 400
Caption:          12px, weight 400
```

#### UI Elements
```css
Button Text:      16px, weight 600 (primary)
                  15px, weight 500 (secondary)
Input Labels:     14px, weight 400
Input Text:       15px, weight 400
Link Text:        15px, weight 500
```

### Line Heights
- Headings: 1.2
- Body text: 1.5
- UI elements: 1.4

---

## Spacing System

### Base Unit: 5px

All spacing should be multiples of 5 for visual consistency.

### Spacing Scale
```css
xs:   5px    /* Tight spacing */
sm:   10px   /* Close elements */
md:   15px   /* Default spacing */
lg:   20px   /* Section spacing */
xl:   30px   /* Large gaps */
2xl:  40px   /* Major sections */
3xl:  50px   /* Page padding */
```

### Component Spacing

#### Cards/Containers
```css
padding: 40px 50px
border-radius: 12px
margin-bottom: 20px (between cards)
```

#### Forms
```css
Input margin-bottom: 15-20px
Label margin-bottom: 8px
Button margin-top: 25px
```

#### Navigation
```css
Navbar padding: 15px 40px
Nav item gap: 30px
```

#### Sections
```css
Section padding: 20px
Min height for centering: 100vh
```

---

## Component Standards

### Buttons

#### Primary Button
```javascript
style={{
  padding: '14px',
  background: '#198653',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.3s'
}}
// Hover: #146b42
```

#### Secondary Button
```javascript
style={{
  padding: '12px 20px',
  background: 'transparent',
  color: '#198653',
  border: '1px solid #198653',
  borderRadius: 6,
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer'
}}
```

#### Text/Link Button
```javascript
style={{
  background: 'none',
  border: 'none',
  color: '#1fc08f',
  cursor: 'pointer',
  textDecoration: 'underline',
  fontSize: 15,
  fontWeight: 500
}}
```

#### Disabled State
```javascript
disabled={loading}
style={{
  background: '#95a5a6',
  cursor: 'not-allowed'
}}
```

### Input Fields

#### Standard Input
```javascript
style={{
  width: '100%',
  padding: '12px 15px',
  borderRadius: 6,
  border: '1px solid #ddd',
  fontSize: 15,
  boxSizing: 'border-box',
  background: '#f8f9fa'
}}
```

#### With Label (Preferred)
```javascript
<div style={{ marginBottom: 20 }}>
  <label style={{ 
    display: 'block', 
    marginBottom: 8, 
    fontSize: 14, 
    color: '#fff',  // or #666 on light backgrounds
    fontWeight: 400 
  }}>Label Text</label>
  <input {...} />
</div>
```

#### Focus State
```css
outline: 2px solid #198653
outline-offset: 2px
```

### Cards/Containers

#### Transparent Card (Login/Signup)
```javascript
style={{
  background: 'rgba(0, 0, 0, 0.5)',
  padding: '40px 50px',
  borderRadius: 12,
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  maxWidth: 400-450
}}
```

#### Solid Card (Dashboards)
```javascript
style={{
  background: 'white',
  padding: '30px',
  borderRadius: 10,
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
}}
```

### Navigation Bars

#### Public Pages Navbar
```javascript
style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  padding: '15px 40px',
  background: '#2c3e50',
  zIndex: 100,
  display: 'flex',
  gap: 30
}}
```

#### Dashboard Navbar (TopNav)
```javascript
style={{
  background: '#202428',
  padding: '15px 40px',
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: 100
}}
```

### Modals

#### Modal Overlay
```javascript
style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}}
```

#### Modal Content
```javascript
style={{
  background: 'white',
  padding: '40px',
  borderRadius: 12,
  maxWidth: 500,
  width: '90%',
  maxHeight: '90vh',
  overflow: 'auto'
}}
```

---

## Interaction Patterns

### Hover States
- **Buttons**: Background color darkens (0.3s transition)
- **Links**: Underline appears or color brightens
- **Cards**: Subtle shadow increase
- **Scale effects**: Only on hero/CTA elements

### Click/Active States
- Visual feedback within 100ms
- Scale down slightly (0.98) for buttons
- Loading state should replace button text

### Loading States
```javascript
{loading ? 'Loading...' : 'Submit'}
disabled={loading}
cursor: loading ? 'not-allowed' : 'pointer'
```

### Error States
```javascript
{error && (
  <div style={{
    color: '#e74c3c',
    marginTop: 15,
    fontSize: 14,
    textAlign: 'center'
  }}>
    {error}
  </div>
)}
```

### Success States
```javascript
{success && (
  <div style={{
    color: '#198653',
    marginTop: 15,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 500
  }}>
    {success}
  </div>
)}
```

### Empty States
- Show helpful message
- Provide action to populate (if applicable)
- Use subtle icon or illustration
- Center content vertically and horizontally

---

## Layout Principles

### Grid System
- Use flexbox for layouts
- Default gap: 20-30px
- Responsive breakpoints (future):
  - Mobile: 320-767px
  - Tablet: 768-1023px
  - Desktop: 1024px+

### Content Width
```css
max-width: 400px   /* Login/Signup cards */
max-width: 450px   /* Signup with more fields */
max-width: 700px   /* Subtitle text */
max-width: 1200px  /* Dashboard content */
```

### Centering
```javascript
// Vertical & Horizontal
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
minHeight: '100vh'

// Horizontal only
display: 'flex',
justifyContent: 'center'

// Text only
textAlign: 'center'
```

### Z-Index Scale
```css
z-index: 1       /* Subtle overlays */
z-index: 10      /* Dropdowns */
z-index: 100     /* Fixed navbars */
z-index: 1000    /* Modals */
z-index: 10000   /* Tooltips, popovers */
```

---

## Accessibility Standards

### Keyboard Navigation
- All interactive elements must be focusable
- Tab order must be logical
- Enter/Space should activate buttons
- Escape should close modals
- Arrow keys for navigation within components

### Focus Indicators
```css
outline: 2px solid #198653
outline-offset: 2px
border-radius: 4px
```

### Screen Readers
- Use semantic HTML when possible
- Add aria-labels to icon buttons
- Provide alt text for images
- Use aria-live for dynamic content
- Label form inputs properly

### Color Contrast
✅ **Pass**: 
- White text on #2c3e50 (7.8:1)
- White text on rgba(0,0,0,0.5) (8.5:1)
- #198653 buttons with white text (4.7:1)

❌ **Avoid**:
- Light text on light backgrounds
- Low contrast grays

### Motion & Animation
- Respect `prefers-reduced-motion`
- Keep transitions subtle (0.2-0.3s)
- Avoid auto-playing videos with sound
- Provide pause controls for animations

---

## Form Design Standards

### Field Grouping
- Related fields together
- Logical order (top to bottom)
- Clear visual separation between groups

### Label Placement
**Preferred**: Above input field
```javascript
<label>Username</label>
<input type="text" />
```

**Avoid**: Placeholder-only (accessibility issue)

### Validation
- Real-time for format errors (email, etc.)
- On submit for required fields
- Clear error messages
- Show success states

### Error Messages
- Specific and actionable
- Near the relevant field
- In plain language
- Red color (#e74c3c)

### Placeholders
- Use for examples: "anja@smartwalls"
- Never as replacement for labels
- Keep them short
- Light gray color

---

## Dashboard Layouts

### Sidebar Navigation
```javascript
width: 250px
background: #1fc08f (tenant)
position: fixed
height: 100vh
padding: 20px
```

### Main Content Area
```javascript
marginLeft: 250px (if sidebar)
padding: 20px
minHeight: 100vh
```

### Tab Navigation
```javascript
// Active tab
background: '#198653'
color: 'white'

// Inactive tab
background: 'transparent'
color: '#666'
border: '1px solid #ddd'
```

### Data Tables
- Zebra striping for readability
- Hover highlight on rows
- Clear column headers
- Responsive scrolling
- Action buttons right-aligned

---

## Icon Usage

### General Rules
❌ **NO EMOJI ICONS** - They are inconsistent across platforms
✅ Use text labels instead
✅ If icons needed: Use SVG icon library (React Icons)

### Button Icons
- Icon + text for clarity
- Icon size: 16-20px
- 8px gap between icon and text

### Status Indicators
- Use color + text, not just color
- Examples: "Active" (green), "Pending" (orange)

---

## Animation & Motion

### Transitions
```css
transition: background 0.3s ease
transition: transform 0.2s ease
transition: opacity 0.3s ease
```

### Hover Effects
```javascript
onMouseOver={(e) => e.target.style.background = '#146b42'}
onMouseOut={(e) => e.target.style.background = '#198653'}

// Or scale
transform: 'scale(1.05)'
```

### Page Transitions
- Keep minimal
- Fade in/out: 200-300ms
- Avoid jarring movements

### Loading Indicators
- Spinner for < 5 seconds
- Progress bar for longer operations
- Skeleton screens for content loading

---

## Responsive Design (Future)

### Mobile First
- Design for 320px width minimum
- Touch targets: 44x44px minimum
- Larger text for readability
- Simplified navigation

### Breakpoints
```css
Mobile:  max-width: 767px
Tablet:  768px - 1023px
Desktop: min-width: 1024px
```

### Considerations
- Hamburger menu for mobile
- Stack cards vertically
- Full-width inputs on mobile
- Larger tap targets
- Simplified tables (card view)

---

## Performance Guidelines

### Image Optimization
- Use WebP format
- Lazy load images
- Provide alt text
- Max file size: 200KB per image

### Video Backgrounds
- Compress videos heavily
- Provide fallback image
- Don't autoplay on mobile
- Max duration: 30 seconds loop

### CSS Performance
- Minimize inline styles (current pattern OK for now)
- Avoid expensive properties (blur, shadow in moderation)
- Use transform for animations
- Limit z-index usage

---

## Content Guidelines

### Microcopy
- Be concise and clear
- Use active voice
- Avoid jargon
- Friendly but professional

### Button Text
✅ Good: "Log In", "Submit", "Save Changes"
❌ Avoid: "Click Here", "OK", "Submit Form"

### Error Messages
✅ Good: "Korisničko ime i lozinka su obavezni"
❌ Avoid: "Error 401", "Invalid input"

### Success Messages
✅ Good: "Nalog kreiran! Vaš nalog zahteva odobrenje upravnika."
❌ Avoid: "Success", "Done"

---

## Testing Checklist

### Visual Testing
- [ ] All colors match design system
- [ ] Navbar colors consistent across pages
- [ ] Transparent boxes render correctly
- [ ] Text readable on all backgrounds
- [ ] Button hover states work
- [ ] No text shadows on main titles
- [ ] System fonts loading properly

### Functional Testing
- [ ] All buttons clickable
- [ ] Forms validate correctly
- [ ] Error messages display
- [ ] Loading states show
- [ ] Modals open/close
- [ ] Navigation works
- [ ] Logout clears state

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Color contrast passes WCAG AA
- [ ] Forms have labels
- [ ] Alt text on images

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Device Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Common Mistakes to Avoid

### Design Mistakes
❌ Using custom fonts (causes bugs)
❌ Inconsistent navbar colors
❌ Emoji icons
❌ Text shadows on modern designs
❌ Low contrast text
❌ Placeholder-only labels
❌ Color as only indicator
❌ Too many z-index values

### Code Mistakes
❌ Forgetting backdrop-filter on transparent cards
❌ Missing hover states on buttons
❌ Not disabling buttons during loading
❌ Hardcoding colors (use variables)
❌ Inline styles without consistency
❌ Missing key props in lists
❌ Not handling error states

### UX Mistakes
❌ No loading feedback
❌ Unclear error messages
❌ Tiny click targets
❌ Hidden navigation
❌ No empty states
❌ Confusing button labels
❌ Too many steps in flows

---

## Design Handoff Checklist

When implementing new features:

1. **Colors**: Verify all colors from palette
2. **Spacing**: Use 5px base unit
3. **Typography**: Check font sizes/weights
4. **States**: Implement hover, active, disabled, loading
5. **Responsive**: Consider mobile (future)
6. **Accessibility**: Add labels, focus states, ARIA
7. **Consistency**: Match existing patterns
8. **Testing**: Cross-browser, keyboard nav
9. **Documentation**: Update this guide if needed

---

## Version History

**Version 1.0** - February 2, 2026
- Initial UI/UX standards documentation
- Post-eye icon bug fix
- Transparent card system established
- System fonts only policy
- Navbar color consistency rules

---

## Resources & References

### Design Tools
- Figma (for mockups)
- Chrome DevTools (color picker, accessibility)
- WebAIM Contrast Checker

### Code Standards
- React inline styles (current approach)
- Component-based architecture
- Props-driven styling

### Accessibility
- WCAG 2.1 Level AA compliance target
- Keyboard navigation priority
- Screen reader compatibility

---

**Maintained by**: Development Team  
**Last Review**: February 2, 2026  
**Next Review**: When adding major features

For implementation details, see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
