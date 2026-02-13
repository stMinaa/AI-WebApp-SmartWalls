# Skill: Code Quality Review

> Aktivira code-quality-reviewer agenta. SOLID, kompleksnost, code smells.
> Koristi se za refaktoring i review pre commita.

---

## Kada se aktivira

Ovaj skill se koristi za:
- Review koda pre commita
- Refaktoring postojeceg koda
- Provera SOLID principa
- Identifikacija code smells-a

## Proces

### 1. Ucitaj agenta
**Ucitaj instrukcije iz:** `.claude/commands/agents/code-quality-reviewer.md`

### 2. Pokreni automatske alate

```bash
# CodeScene analiza staged promena
cs delta --staged

# CodeScene review konkretnog fajla
cs review <putanja>

# PowerShell full analiza
.\analyze-code.ps1

# ESLint provera
cd backend && npm run lint

# Arhitekturni testovi
cd backend && npm run test:arch
```

### 3. Manuelna provera - metrike

| Metrika | Cilj | Alarm |
|---------|------|-------|
| CodeScene score | >= 9.0 | < 9.0 |
| Cyclomatic complexity | < 9 | >= 9 |
| Funkcija duzina | < 50 linija | >= 50 |
| Fajl duzina | < 300 linija | >= 300 |
| Parametri funkcije | <= 3 | > 3 |
| Nesting depth | <= 3 | > 3 |

### 4. SOLID principi (iz REFACTORING.md)

**S - Single Responsibility**
- Svaki modul ima JEDAN razlog za promenu
- Routes: samo HTTP, Services: samo logika, Models: samo podaci

**O - Open/Closed**
- Prosiruj dodavanjem, ne menjanjem
- Permissions: config mapa, ne if/else lanac

**L - Liskov Substitution**
- Podtipovi zamenjivi za bazne tipove
- Repository pattern: MongooseRepo moze se zameniti InMemoryRepo

**I - Interface Segregation**
- Male, fokusirane interfejse
- Jedan use case po klasi, ne "god service"

**D - Dependency Inversion**
- Zavisnost od apstrakcija, ne implementacija
- Constructor injection za zavisnosti

### 5. Code Smells checklist

- [ ] **God Function** - Funkcija radi previse (> 50 linija)
- [ ] **Long Parameter List** - Vise od 3 parametra
- [ ] **Feature Envy** - Koristi podatke drugog modula
- [ ] **Duplicated Logic** - Copy-paste kod
- [ ] **Dead Code** - Nekoristene varijable/importi/funkcije
- [ ] **Magic Numbers** - Hardkodirane vrednosti
- [ ] **Deep Nesting** - Vise od 3 nivoa if/for

### 6. Bezbednosna provera

- [ ] Nema console.log sa osetljivim podacima
- [ ] Nema hardkodiranih kredencijala
- [ ] Passwordi hesirani (bcryptjs, salt >= 10)
- [ ] JWT tokeni imaju expiration
- [ ] Input validacija na svim POST/PUT endpointima

### 7. Output format

Kada zavrsis review, prijavi u formatu:
```
## Code Quality Review

### Ocena: [X/10]

### Kriticni problemi (moraju se popraviti)
1. [Problem] - [Fajl:linija] - [Objasnjenje]

### Upozorenja (preporuceno popraviti)
1. [Problem] - [Fajl:linija]

### Pohvale
1. [Sta je dobro]

### Akcije za nodejs-coder / react-coder
1. [Konkretna stvar za popraviti]
```

## Referentni dokumenti

- `docs/standards/CODE_QUALITY.md` - Puni standardi
- `docs/standards/REFACTORING.md` - SOLID principi i hexagonalna arhitektura
- `docs/reference/QUALITY_QUICK_REF.md` - Brza referenca
