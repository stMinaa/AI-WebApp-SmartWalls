# Skill: TDD Workflow

> Orkestrator za TDD proces. Aktivira se za bug fixes i nove funkcionalnosti.
> Zna kog agenta da pozove za koji deo sistema.

---

## Kako radi ovaj skill

Kada se aktivira `/tdd`, ovaj skill:
1. Utvrdi da li je zadatak **backend** ili **frontend**
2. Pozove odgovarajuceg agenta
3. Prati TDD proces RED → GREEN → BLUE

## Rutiranje

### Backend zadatak?
**Ucitaj i prati instrukcije iz:** `.claude/commands/agents/nodejs-coder.md`

Prepoznajes backend zadatak po:
- Rad na fajlovima u `backend/` direktorijumu
- API endpointi, rute, servisi, modeli
- MongoDB operacije
- Testovi u `backend/test/`

### Frontend zadatak?
**Ucitaj i prati instrukcije iz:** `.claude/commands/agents/react-coder.md`

Prepoznajes frontend zadatak po:
- Rad na fajlovima u `frontend/src/`
- React komponente, Dashboard-ovi
- UI/UX promene, stilovi
- Korisnicko okruzenje

## TDD Proces (RED → GREEN → BLUE)

### 1. RED - Napisi testove PRVO
```bash
# Backend
cd backend && npm test -- --testPathPattern="<test-file>"

# Frontend
cd frontend && npm test -- --testPathPattern="<test-file>"
```
- Testovi MORAJU da padnu. Ako prolaze - testovi su losi.
- NE NASTAVLJAJ dok ne potvrds da testovi padaju.

### 2. GREEN - Minimalna implementacija
- Napisi SAMO kod koji testovi zahtevaju
- Pokreni testove - moraju da prodju
- Nema bonus funkcionalnosti

### 3. BLUE - Refaktoring (opciono)
- Testovi ostaju zeleni
- Poboljsaj strukturu, ne ponasanje

## Pre zavrsetka - pozovi druge skillove

```
/quality    - Proveri kvalitet napisanog koda
```

## Connectivity Checklist

- [ ] Backend starts: `cd backend && node index.js`
- [ ] MongoDB: "MONGO RUNNING" poruka
- [ ] Frontend: `cd frontend && npm start`
- [ ] Nema CORS gresaka

## Referentni dokumenti

- `docs/workflow/DEVELOPMENT.md` - Puni TDD proces
- `docs/workflow/TESTING.md` - Test specifikacije po fazama
