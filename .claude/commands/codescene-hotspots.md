# Skill: CodeScene Hotspots (Tech Debt Priorities)

> Identifikacija tehnickog duga i prioritizacija za sprint planning.
> Fokus: hotspots (fajlovi sa najvisim rizikom), tech debt ranking, akcioni plan.

---

## Proces

### 1. Identifikuj najcesce menjane fajlove (change frequency)

```bash
# Top 20 fajlova po broju promena u poslednjih 90 dana
git log --since="90 days ago" --name-only --pretty=format: -- '*.js' | sort | uniq -c | sort -rn | head -20
```

### 2. Code health score za hotspot fajlove

Za svaki fajl iz koraka 1, pokreni CodeScene review:

```bash
# Za svaki hotspot fajl
git log --since="90 days ago" --name-only --pretty=format: -- '*.js' | sort | uniq -c | sort -rn | head -10 | awk '{print $2}' | while read f; do
  if [ -f "$f" ]; then
    echo ""
    echo "=========================================="
    echo "HOTSPOT: $f ($(git log --since='90 days ago' --oneline -- "$f" | wc -l) commits)"
    echo "=========================================="
    cs review "$f" 2>&1
    echo "Lines: $(wc -l < "$f")"
  fi
done
```

### 3. Velicina fajlova (kompleksnost rizik)

```bash
# Backend fajlovi sortirani po velicini
find backend -name '*.js' -not -path '*/node_modules/*' -not -path '*/test/*' | xargs wc -l | sort -rn | head -15

# Frontend fajlovi sortirani po velicini
find frontend/src -name '*.js' -o -name '*.jsx' | xargs wc -l | sort -rn | head -15
```

### 4. Procena tehnickog duga

Za svaki hotspot, oceni:

| Fajl | Velicina | CS Score | Promena freq | Rizik | Prioritet |
|------|----------|----------|--------------|-------|-----------|
| ... | X linija | X.X | X commits/90d | H/M/L | 1-5 |

**Rizik formula:**
- **HIGH**: CS score < 7.0 AND change freq > 10/90d
- **MEDIUM**: CS score < 9.0 OR change freq > 5/90d
- **LOW**: CS score >= 9.0 AND change freq <= 5/90d

### 5. Akcioni plan za sprint

Na osnovu analize, predlozi konkretne refaktoring taskove:

```
## Tech Debt Sprint Plan

### P1 - Kriticno (ova nedelja)
1. [Fajl] - [Problem] - [Predlozeno resenje] - [Procena: Xh]

### P2 - Visok prioritet (ovaj sprint)
1. [Fajl] - [Problem] - [Predlozeno resenje] - [Procena: Xh]

### P3 - Srednji prioritet (sledeci sprint)
1. [Fajl] - [Problem] - [Predlozeno resenje] - [Procena: Xh]

### P4 - Nizak prioritet (backlog)
1. [Fajl] - [Problem] - [Predlozeno resenje] - [Procena: Xh]
```

## Output Format

```
╔══════════════════════════════════════════════╗
║       TECH DEBT & HOTSPOTS REPORT            ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Hotspot fajlovi:   N                        ║
║  Kriticni (P1):     N                        ║
║  Ukupan tech debt:  ~Xh procena              ║
║                                              ║
║  Top 5 Hotspots:                             ║
║  #1 file.js    (Score: X.X, 15 commits)      ║
║  #2 file2.js   (Score: X.X, 12 commits)      ║
║  #3 ...                                      ║
║                                              ║
║  Preporuka za sledeci sprint:                ║
║    - [Konkretni taskovi]                     ║
║                                              ║
╚══════════════════════════════════════════════╝
```

## Referentni dokumenti

- `docs/standards/CODE_QUALITY.md` - Ciljevi kvaliteta
- `docs/standards/REFACTORING.md` - Hexagonalna migracija plan
- `docs/logs/PROJECT_LOG.md` - Istorija promena
