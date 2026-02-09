# Code Quality Check

Before committing, verify code quality standards.

## Quick Commands

```bash
# Analyze staged changes
cs delta --staged

# Review specific file
cs review backend/services/issueService.js

# Full project analysis
.\analyze-code.ps1
```

## Quality Targets

| Metric | Target |
|--------|--------|
| Code health score | >= 8.0 |
| Cyclomatic complexity | < 9 per function |
| Function length | < 50 lines |
| Complex Method warnings | 0 |

## Checklist

### Backend
- [ ] No `console.log()` in production code
- [ ] All errors caught with try/catch
- [ ] All inputs validated
- [ ] Response format consistent (`success`, `message`, `data`)
- [ ] Functions under 50 lines
- [ ] Clear variable names (camelCase)

### Frontend
- [ ] No console errors in browser
- [ ] State properly managed
- [ ] Loading states shown
- [ ] Error messages in Serbian
- [ ] Responsive layout

### Security
- [ ] Passwords hashed (bcryptjs)
- [ ] JWT tokens have expiration
- [ ] No sensitive data logged
- [ ] Secrets in env vars, not code

## Reference

Full standards: [docs/standards/CODE_QUALITY.md](../docs/standards/CODE_QUALITY.md)
