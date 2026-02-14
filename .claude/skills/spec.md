# Feature Specification

Load the role specification from `docs/specs/ROLES.md`.

## Current Phase Status

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Director Role | DONE |
| 2 | Manager Role | DONE |
| 3 | Tenant Role | DONE |
| 4 | Associate Role | DONE |

## Role Capabilities

### Director
- Create buildings
- Assign managers to buildings
- Approve pending managers/associates
- Assign issues to associates

### Manager
- View assigned buildings
- Create apartments (bulk & single)
- Manage tenants
- Triage issues (forward/reject)
- Create notices and polls

### Tenant
- View apartment & building info
- Report issues
- View bulletin board
- Vote on polls

### Associate
- View assigned jobs
- Accept job with cost estimate
- Mark job complete

## Issue Workflow

```
reported → forwarded → assigned → in-progress → resolved
                  └→ rejected
```

## Authorization Matrix

| Action | Tenant | Manager | Director | Associate |
|--------|--------|---------|----------|-----------|
| Report issues | YES | - | - | - |
| Triage issues | - | YES | - | - |
| Assign to associate | - | YES | YES | - |
| Accept job | - | - | - | YES |
| Create building | - | - | YES | - |
| Approve staff | - | - | YES | - |

## Reference

Full specification: [docs/specs/ROLES.md](../docs/specs/ROLES.md)
