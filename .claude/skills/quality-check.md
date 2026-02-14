# Skill: Quality Check (Pre-Commit Gate)

> Detaljna provera kvaliteta pre svakog commita. Pokrece lint, testove, build, i CodeScene analizu.
> Rezultat: **PASS** ili **FAIL** sa detaljnim izvestajem.

---

## Proces

Pokreni SVE korake redom. Ako bilo koji korak FAIL-uje, nastavi sa ostalim ali na kraju prijavi FAIL.

### 1. Backend Static Analysis (ESLint)

```bash
cd backend && npx eslint . --ext .js 2>&1 || true
```

**PASS kriterijum:** 0 errors (warnings su OK)

### 2. Backend Tests

```bash
npm test 2>&1
```

**PASS kriterijum:** Svi testovi prolaze, 0 failures

### 3. Backend Test Coverage (ako postoji)

```bash
npm test -- --coverage --silent 2>&1 || true
```

**PASS kriterijum:** Informativan - prijavi coverage procenat

### 4. Frontend ESLint

```bash
cd frontend && npx eslint src --ext .js,.jsx 2>&1 || true
```

**PASS kriterijum:** 0 errors (warnings su OK)

### 5. Frontend Build

```bash
cd frontend && npx react-scripts build 2>&1
```

**PASS kriterijum:** Build uspesno zavrsen, nema "Failed to compile"

### 6. CodeScene Delta Analysis

```bash
cs delta 2>&1 || true
```

**PASS kriterijum:** Code health score >= 9.0 (ili nema degradacije)

### 7. CodeScene File Review (staged fajlovi)

```bash
# Za svaki staged .js fajl
git diff --cached --name-only --diff-filter=ACMR | grep '\.js$' | head -10 | while read f; do
  echo "--- $f ---"
  cs review "$f" 2>&1 || true
done
```

**PASS kriterijum:** Nema kriticnih code health problema

### 8. Security Quick Check

Proveri staged fajlove za:
- [ ] Nema hardkodiranih kredencijala/tokena
- [ ] Nema `console.log` sa osetljivim podacima u produkcijskom kodu
- [ ] Nema `.env` fajlova u staged promenama

```bash
git diff --cached --name-only | grep -E '\.(env|key|pem|secret)' && echo "SECURITY WARNING: Sensitive files staged!" || true
```

## Output Format

Na kraju prijavi rezultat u ovom formatu:

```
╔══════════════════════════════════════════════╗
║           QUALITY CHECK REPORT               ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Backend Lint:      PASS / FAIL (X errors)   ║
║  Backend Tests:     PASS / FAIL (X/Y)        ║
║  Backend Coverage:  XX% (informational)       ║
║  Frontend Lint:     PASS / FAIL (X errors)   ║
║  Frontend Build:    PASS / FAIL              ║
║  CodeScene Delta:   PASS / FAIL (score X.X)  ║
║  CodeScene Review:  PASS / FAIL              ║
║  Security Check:    PASS / FAIL              ║
║                                              ║
╠══════════════════════════════════════════════╣
║  OVERALL:           PASS / FAIL              ║
╚══════════════════════════════════════════════╝
```

### PASS = svi koraci PASS
### FAIL = bilo koji korak FAIL (sa listom sta treba popraviti)

## Referentni dokumenti

- `docs/standards/CODE_QUALITY.md` - Standardi kvaliteta
- `docs/reference/QUALITY_QUICK_REF.md` - Brza referenca
- `package.json` - Dostupne npm skripte
