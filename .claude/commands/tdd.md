# TDD Workflow

Load and follow the TDD workflow from `docs/workflow/DEVELOPMENT.md`.

## Process

1. **RED Phase** - Write failing tests first
   - Create test file in `backend/test/`
   - Run `npm test` to confirm tests fail
   - Optional commit: `[RED] Add tests for [feature]`

2. **GREEN Phase** - Minimal implementation
   - Only implement what tests require
   - Run `npm test` to confirm tests pass
   - Verify connectivity (Backend + MongoDB + Frontend)
   - Required commit: `[GREEN] Implement [feature]`

3. **BLUE Phase** - Refactor (optional)
   - All tests must stay passing
   - No behavior changes
   - Optional commit: `[BLUE] Refactor [what]`

## Before Every Commit

```bash
npm test                    # All tests passing
cs delta --staged           # CodeScene score >= 8.0
node index.js               # Backend starts
```

## Connectivity Checklist

- [ ] Backend starts without errors
- [ ] MongoDB connection confirmed
- [ ] Frontend can reach backend
- [ ] No CORS errors

## Reference

Full details: [docs/workflow/DEVELOPMENT.md](../docs/workflow/DEVELOPMENT.md)
