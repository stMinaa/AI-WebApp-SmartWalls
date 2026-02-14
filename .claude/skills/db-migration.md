# Skill: Database Migration

> Aktivira database-architect agenta. Koristi se RETKO - samo kada se menja shema baze.
> Flyway stil, rollback strategije obavezne.

---

## Kada se aktivira

Ovaj skill se koristi **RETKO** - samo kada:
- Dodajes novo polje u Mongoose shemu
- Menjas tip postojeceg polja
- Dodajes novi model/kolekciju
- Menjas indekse ili relacije izmedju kolekcija
- Migriras postojece podatke

**NE koristi** za obicne CRUD operacije ili citanje podataka.

## Proces

### 1. Ucitaj agenta
**Ucitaj instrukcije iz:** `.claude/commands/agents/database-architect.md`

### 2. Analiza uticaja (OBAVEZNA pre bilo kakve promene)

Odgovori na ova pitanja:
1. Koje kolekcije se menjaju?
2. Koji servisi koriste te kolekcije?
3. Koji testovi pokrivaju te kolekcije?
4. Ima li postojecih podataka koji ce biti pogodeni?
5. Da li je promena backward-compatible?

### 3. Trenutne sheme (referenca)

```
backend/models/
├── User.js       - username, email, password, role, status, building, apartment
├── Building.js   - name, address, manager, apartments[]
├── Apartment.js  - number, floor, building, tenant, rent
├── Issue.js      - title, description, status, reporter, building, assignedTo
├── Notice.js     - title, content, building, author, expiresAt
└── Poll.js       - question, options[], building, author, voters[]
```

### 4. Plan migracije (popuni pre implementacije)

```markdown
## Migration Plan

### Promena
[Opis sta se menja u shemi]

### Razlog
[Zasto je ova promena potrebna]

### Uticaj
- Kolekcije: [lista pogodenih kolekcija]
- Servisi: [lista pogodenih servisa]
- Testovi: [lista pogodenih testova]
- Frontend: [da li frontend treba promene]

### Backward compatibility
[Da/Ne - objasnjenje]

### Koraci migracije
1. [Korak 1]
2. [Korak 2]
3. ...

### Rollback strategija (OBAVEZNA)
1. [Korak za vracanje na prethodno stanje]
2. [Korak 2]

### Validacija posle migracije
- [ ] Postojeci podaci citljivi
- [ ] Novi podaci se pravilno zapisuju
- [ ] Svi testovi prolaze
- [ ] Frontend radi bez gresaka
```

### 5. Pravila za sheme (iz CODE_QUALITY.md)

- **Timestamps**: Uvek `timestamps: true`
- **Required**: Oznaci obavezna polja sa `required: true`
- **Unique**: Email/username imaju `unique: true`
- **Enum**: Koristi `enum` za status polja (ne string)
- **Ref**: Koristi `ref` za medjukolekcione veze
- **Indeksi**: Dodaj za polja koja se cesto pretrazuju
- **Imenovanje**: camelCase za polja, PascalCase za modele

### 6. Posle plana - rutiranje na implementaciju

Kada je plan odobren, implementacija ide kroz:
**Ucitaj instrukcije iz:** `.claude/commands/agents/nodejs-coder.md`

Redosled:
1. RED - Napisi test za novu shemu
2. GREEN - Azuriraj model, servis, rutu
3. BLUE - Refaktorisi
4. Pokreni migraciju podataka (ako je potrebna)
5. Validiraj rollback strategiju

## Referentni dokumenti

- `backend/models/` - Trenutne Mongoose sheme
- `docs/specs/ROLES.md` - Data flow izmedju rola
- `backend/config/constants.js` - DB konekcija
- `docs/standards/CODE_QUALITY.md` - MongoDB/Mongoose standardi
