# Skill: CodeScene Check (Code Health Analysis)

> Code health analiza pomocu CodeScene CLI. Koristi se pre commita i za PR review.
> Fokus: code health score, kompleksnost, code smells.

---

## Dostupne CodeScene CLI komande

```
cs delta          - Analiza promena u git repo (staged/unstaged)
cs review <file>  - Oceni fajl i daj review
cs check <file>   - Proveri fajl za code health probleme
cs check-rules <file> - Nadji code health rule poklapanja
```

## Proces

### 1. Delta analiza (promene od poslednjeg commita)

```bash
cs delta 2>&1
```

Prikazuje:
- Code health score promena
- Degradacije (ako ih ima)
- Poboljsanja

### 2. Review kriticnih fajlova

Identifikuj fajlove sa najvise promena i pokreni review:

```bash
# Staged fajlovi
git diff --cached --name-only --diff-filter=ACMR | grep '\.js$' | while read f; do
  echo ""
  echo "=========================================="
  echo "REVIEW: $f"
  echo "=========================================="
  cs review "$f" 2>&1
done
```

### 3. Check za specificne probleme

```bash
# Za svaki fajl sa promenama
git diff --cached --name-only --diff-filter=ACMR | grep '\.js$' | while read f; do
  echo ""
  echo "--- CHECK: $f ---"
  cs check "$f" 2>&1
done
```

### 4. Analiza po metrici

| Metrika | Cilj | Alarm | Akcija |
|---------|------|-------|--------|
| Code Health Score | >= 9.0 | < 9.0 | Refaktorisi pre commita |
| Cyclomatic Complexity | < 9 | >= 9 | Razbij funkciju |
| Function Length | < 50 linija | >= 50 | Extract function |
| File Length | < 300 linija | >= 300 | Extract module |
| Nesting Depth | <= 3 | > 3 | Early return, extract |
| Parameter Count | <= 3 | > 3 | Koristi options object |

### 5. PR Review mod

Kada se koristi za PR review, analiziraj sve fajlove u PR-u:

```bash
# Svi fajlovi promenjeni od main brancha
git diff main...HEAD --name-only --diff-filter=ACMR | grep '\.js$' | while read f; do
  echo ""
  echo "=========================================="
  echo "PR REVIEW: $f"
  echo "=========================================="
  cs review "$f" 2>&1
  cs check "$f" 2>&1
done
```

## Output Format

```
╔══════════════════════════════════════════════╗
║         CODESCENE HEALTH REPORT              ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Delta Score:       X.X → Y.Y (↑/↓/→)       ║
║  Files Analyzed:    N                        ║
║  Degradations:      N (list if any)          ║
║  Improvements:      N                        ║
║                                              ║
║  Per-File Scores:                            ║
║    backend/index.js:          X.X            ║
║    backend/services/xyz.js:   X.X            ║
║                                              ║
║  Issues Found:                               ║
║    [CRITICAL] file.js:42 - Complex function  ║
║    [WARNING]  file.js:89 - Long function     ║
║                                              ║
╠══════════════════════════════════════════════╣
║  VERDICT:           HEALTHY / NEEDS WORK     ║
╚══════════════════════════════════════════════╝
```

### HEALTHY = score >= 9.0, nema degradacija
### NEEDS WORK = score < 9.0 ili ima degradacija (sa preporukama)

## Referentni dokumenti

- `docs/standards/CODE_QUALITY.md` - Code health ciljevi
- `docs/standards/REFACTORING.md` - Strategije refaktorisanja
- `analyze-code.ps1` - PowerShell analiza skript
