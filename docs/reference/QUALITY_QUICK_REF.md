# Quick Reference - Architectural Testing

Quick commands for daily development with quality gates.

---

## � ENFORCEMENT STATUS

**Current Mode: PRE-REFACTORING (Lenient)**
- ✅ Frontend build: ENFORCED (pre-commit)
- 🔓 Architectural tests: OPTIONAL (manual `npm run quality`)
- 🔓 Backend ESLint: OPTIONAL (manual `npm run lint`)

**Future Mode: LEVEL 3+ (Strict)**
- To activate: Edit `.husky/pre-commit`, uncomment architectural checks
- When: After creating `backend/src/domain/` (see REFACTORING.md Step 3.1)
- Enforcement: All rules below become blocking

---

## �🚀 Daily Commands

### Before Starting Work
```bash
npm run quality          # Check current state
```

### During Development
```bash
npm run lint             # Check ESLint violations
npm run test:arch        # Quick architectural check (2 seconds)
```

### Before Commit
```bash
npm run quality          # Full backend check
cd frontend && npm run quality  # Full frontend check
git add .
git commit -m "..."      # Pre-commit hook runs automatically
```

---

## 🔍 Quality Commands

| Command | What It Does | When To Use |
|---------|--------------|-------------|
| `npm run quality` | Lint + Arch tests | Before commit |
| `npm run quality:full` | Everything + unit tests | Before push |
| `npm run lint` | ESLint check | During coding |
| `npm run lint:fix` | Auto-fix ESLint | After changes |
| `npm run test:arch` | Architecture tests only | Quick validation |
| `npm run deps:check` | Dependency violations | After imports |
| `npm run deps:graph` | Visualize dependencies | Review architecture |

---

## 🏛️ Architecture Commands

### Check Boundaries
```bash
# Quick check (2 sec)
npm run test:arch

# Detailed check with visualization
npm run deps:check
npm run deps:graph           # Creates dependency-graph.svg
open dependency-graph.svg    # View in browser
```

### What Gets Checked
- ✅ Domain doesn't import Express/Mongoose
- ✅ Use cases don't import controllers
- ✅ Controllers don't access models directly
- ✅ No circular dependencies
- ✅ File size < 300 lines
- ✅ Function size < 50 lines
- ✅ Complexity < 9

---

## 🎨 Frontend Commands

```bash
cd frontend

npm run lint              # React hooks, boundaries
npm run lint:fix          # Auto-fix
npm run test:coverage     # Tests with coverage
npm run quality           # Lint + tests + build
```

### What Gets Checked
- ✅ React hooks rules followed
- ✅ No missing dependencies in useEffect
- ✅ Import boundaries (components → hooks → services)
- ✅ Component size < 250 lines
- ✅ Function size < 40 lines

---

## 📊 Dependency Graph

### Generate Visualization
```bash
npm run deps:graph
```

**Output:** `dependency-graph.svg`

**What You'll See:**
- 🔵 **Blue** - Domain layer (should have NO outgoing arrows to other layers)
- 🟠 **Orange** - Application layer (use cases)
- 🟡 **Yellow** - Ports (interfaces)
- 🟣 **Purple** - Adapters (implementations)
- ⚫ **Gray** - Infrastructure (config, DI)

**Good Architecture:**
```
Domain ← Application ← Adapters
(All arrows point INWARD)
```

**Bad Architecture:**
```
Domain → Adapters  (RED ARROW - VIOLATION!)
```

---

## 🚫 Common Violations & Fixes

### ❌ "Domain imports Mongoose"
```bash
npm run test:arch
# Error: Domain layer must be pure
```

**Fix:**
```javascript
// Remove from domain/issues/Issue.js
const mongoose = require('mongoose');  // DELETE THIS

// Use repository interface instead
// Domain knows WHAT, not HOW
```

---

### ❌ "Circular dependency detected"
```bash
npm run deps:check
# Error: A → B → C → A
```

**Fix:**
- Extract shared code to new file
- Use dependency injection
- Consider if design is wrong

---

### ❌ "React hooks exhaustive deps"
```bash
cd frontend && npm run lint
# Warning: useEffect missing dependency
```

**Fix:**
```javascript
useEffect(() => {
  fetchData(userId);
}, [userId]);  // Add ALL used variables
```

---

### ❌ "Function too complex"
```bash
npm run lint
# Error: Complexity 12 exceeds maximum 9
```

**Fix:**
- Extract helper functions
- Use early returns
- Simplify conditionals

---

## 🔧 Fixing Violations

### Step-by-Step Process

1. **Run check**
   ```bash
   npm run quality
   ```

2. **Read error**
   ```
   ❌ src/domain/Issue.js
      Cannot import from 'mongoose'
   ```

3. **Fix code**
   ```javascript
   // Remove prohibited import
   // Follow hexagonal rules
   ```

4. **Verify fix**
   ```bash
   npm run quality  # Should pass now
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "fix: remove mongoose from domain layer"
   ```

---

## 🎯 Pre-Commit Hook

**Automatically runs:**
```bash
git commit -m "..."
🔍 Running quality checks...
📦 Checking frontend build...
🏛️  Running architectural tests...
✨ Linting backend code...
✅ All quality checks passed!
```

**Blocks commit if:**
- ❌ Architectural test fails
- ❌ ESLint errors
- ❌ Build fails

**Skip hook** (emergency only):
```bash
git commit --no-verify
```

---

## 📈 Success Metrics

### Check Your Progress
```bash
# Code health
npm run quality:full

# File size
wc -l backend/index.js        # Target: < 100 lines

# Test coverage
npm test -- --coverage         # Target: > 85%

# Architecture
npm run deps:graph             # Visual inspection
```

---

## 🆘 Troubleshooting

### "Command not found: depcruise"
```bash
npm install  # Install dependencies
```

### "Cannot find module 'eslint-plugin-boundaries'"
```bash
npm install  # In both root and frontend/
```

### "Tests skipping - structure not created"
```
⏭️  Domain layer not yet created - skipping
```
**Normal during migration.** Tests activate when you create `backend/src/domain/`.

### "Pre-commit hook not running"
```bash
npm run prepare  # Reinstall Husky hooks
```

---

## 📚 Full Documentation

- **[REFACTORING.md](../../docs/standards/REFACTORING.md)** - Complete migration plan
- **[CODE_QUALITY.md](../../docs/standards/CODE_QUALITY.md)** - Quality standards
- **[architecture/README.md](../test/architecture/README.md)** - Test details

---

## 💡 Tips

### Fast Feedback Loop
```bash
# Terminal 1: Watch mode
npm run lint -- --watch

# Terminal 2: Quick arch check after each change
npm run test:arch
```

### Before Opening PR
```bash
npm run quality:full          # Everything
cd frontend && npm run quality
npm run deps:graph            # Attach to PR
```

### Daily Check-in
```bash
# Morning routine
git pull
npm install
npm run quality

# If green, start coding
# If red, fix violations first
```

---

*Last updated: February 12, 2026*
