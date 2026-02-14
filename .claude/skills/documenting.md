# Skill: Documentation

> Standardi za dokumentaciju. Koristi se kada se dodaje novi modul, feature ili menja arhitektura.

---

## Kada se aktivira

Ovaj skill se koristi kada:
- Dodajes novi modul ili feature
- Menjas arhitekturu ili tok podataka
- Azuriras API endpointe
- Zavrsis veci refaktoring
- Treba azurirati PROJECT_LOG

## Dokumentaciona mapa projekta

```
CLAUDE.md                              - Root navigator (UVEK azuriraj ako dodajes doc)
docs/
├── standards/
│   ├── CODE_QUALITY.md                - Standardi kvaliteta koda
│   ├── REFACTORING.md                 - Hexagonalna arhitektura plan
│   └── UI_UX.md                       - Dizajn sistem, boje, tipografija
├── workflow/
│   ├── DEVELOPMENT.md                 - TDD proces (RED → GREEN → BLUE)
│   └── TESTING.md                     - Test specifikacije po fazama
├── specs/
│   └── ROLES.md                       - Role, faze, data flow, sheme
├── reference/
│   ├── QUICK_REF.md                   - Komande, API format, troubleshooting
│   ├── IMPLEMENTATION.md              - Komponente, auth flow, state management
│   └── QUALITY_QUICK_REF.md           - Brza referenca za quality checks
├── logs/
│   └── PROJECT_LOG.md                 - Istorija razvoja
└── archive/                           - Istorijski dokumenti
```

## Pravila za dokumentaciju

### 1. Jezik
- Dokumentacija moze biti na **engleskom** (tehnicka)
- UI tekst u dokumentaciji na **srpskom** (primeri korisnickog interfejsa)
- Budi konzistentan unutar jednog dokumenta

### 2. Format
- Koristi Markdown
- Naslovi sa `##` hijerarhijom
- Tabele za strukturirane podatke
- Code blokovi sa jezikom (```javascript, ```bash)
- Checkliste sa `- [ ]` za akcione stavke

### 3. Sta dokumentovati

#### Novi feature
```markdown
## [Ime feature-a]

### Opis
[Sta radi, zasto postoji]

### API Endpointi (ako ima)
| Metoda | Putanja | Opis |
|--------|---------|------|
| POST | /api/... | ... |

### Komponente (ako ima frontend)
- `ComponentName.js` - [opis]

### Testovi
- `test/feature.test.js` - [sta pokriva]
```

#### Novi modul
```markdown
## [Ime modula]

### Odgovornost
[Jedna recenica - SRP]

### Fajlovi
- `path/to/file.js` - [opis]

### Zavisnosti
- Koristi: [lista modula od kojih zavisi]
- Koriste ga: [lista modula koji zavise od njega]

### API (ako je servis)
| Funkcija | Parametri | Vraca | Opis |
|----------|-----------|-------|------|
| create() | data, user | Object | ... |
```

### 4. Gde dokumentovati

| Promena | Azuriraj |
|---------|----------|
| Novi feature | `docs/specs/ROLES.md` + `PROJECT_LOG.md` |
| Novi endpoint | `docs/reference/QUICK_REF.md` |
| UI promena | `docs/standards/UI_UX.md` |
| Arhitekturna promena | `docs/standards/REFACTORING.md` |
| Nova komponenta | `docs/reference/IMPLEMENTATION.md` |
| Bug fix | `docs/logs/PROJECT_LOG.md` |
| Novi doc | Dodaj red u tabelu u `CLAUDE.md` |

### 5. PROJECT_LOG format

```markdown
### [Datum] - [Kratak opis]

**Promene:**
- [Sta je uradjeno]

**Fajlovi:**
- `path/to/file.js` - [sta je promenjeno]

**Testovi:**
- [X] tests passing (Y total)

**Napomene:**
- [Bilo sta bitno za buducnost]
```

## Checklist pre zavrsetka

- [ ] Relevantni docs azurirani
- [ ] CLAUDE.md tabela azurirana (ako nov doc)
- [ ] PROJECT_LOG azuriran
- [ ] Primeri koda u dokumentaciji rade
- [ ] Links izmedju dokumenata ispravni
