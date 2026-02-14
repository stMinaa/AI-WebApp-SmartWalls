# Skill: API Design

> Aktivira se kada se radi na API endpointima. Konsultuje backend-architect agenta za arhitekturu, rutira implementaciju na nodejs-coder.

---

## Kada se aktivira

Ovaj skill se koristi kada:
- Kreiras novi API endpoint
- Menjas postojeci endpoint
- Dodajes novu rutu
- Menjas response format

## Proces

### 1. Arhitekturna konsultacija
**Ucitaj instrukcije iz:** `.claude/commands/agents/backend-architect.md`

Pre bilo kakve implementacije, analiziraj:
- Da li endpoint postuje hexagonalnu arhitekturu (Routes → Services → Models)
- Da li ruta pripada postojecem modulu ili treba novi
- Da li se postuje REST konvencija imenovanja

### 2. API standardi (iz CODE_QUALITY.md)

#### Imenovanje endpointa
```
POST   /api/auth/signup       - Kreiranje korisnika
POST   /api/auth/login        - Autentifikacija
GET    /api/auth/me           - Trenutni korisnik
POST   /api/:resource         - Kreiranje resursa
GET    /api/:resource/:id     - Pojedinacni resurs
PATCH  /api/:resource/:id     - Azuriranje resursa
DELETE /api/:resource/:id     - Brisanje resursa
GET    /api/:resource         - Lista resursa
```

#### Response format (OBAVEZAN)
```javascript
// Uspeh
{ "success": true, "message": "Opis", "data": { /* payload */ } }

// Greska
{ "success": false, "message": "Opis greske", "code": "ERROR_CODE" }
```

#### HTTP status kodovi
| Kod | Znacenje | Kada |
|-----|----------|-----|
| 200 | OK | Uspesno |
| 201 | Created | Novi resurs kreiran |
| 400 | Bad Request | Validaciona greska |
| 401 | Unauthorized | Nema/los token |
| 403 | Forbidden | Nema permisiju |
| 404 | Not Found | Resurs ne postoji |
| 500 | Server Error | Neocekivana greska |

### 3. Rutiranje na implementaciju
**Ucitaj instrukcije iz:** `.claude/commands/agents/nodejs-coder.md`

Implementacija IDE ISKLJUCIVO kroz nodejs-coder agenta sa TDD procesom:
1. RED - Napisi test za novi endpoint
2. GREEN - Implementiraj endpoint
3. BLUE - Refaktorisi

### 4. Struktura rute (thin controller)

```javascript
// routes/issues.js - MAKSIMUM 10-15 linija po handleru
router.post('/', authenticateToken, async (req, res) => {
  try {
    const result = await issueService.create(req.body, req.user);
    res.status(201).json(ApiResponse.success('Kvar prijavljen', result));
  } catch (err) {
    res.status(400).json(ApiResponse.error(err.message));
  }
});
```

### 5. Checklist pre zavrsetka

- [ ] Endpoint prati REST konvencije
- [ ] Response koristi ApiResponse format
- [ ] Ruta je thin (< 15 linija) - logika u servisu
- [ ] authenticateToken middleware gde treba
- [ ] Input validacija na ulasku
- [ ] Test pokrivenost (RED → GREEN → BLUE)
- [ ] HTTP status kodovi ispravni

## Referentni dokumenti

- `docs/standards/CODE_QUALITY.md` - API standardi
- `docs/reference/QUICK_REF.md` - Curl primeri i troubleshooting
- `docs/standards/REFACTORING.md` - Hexagonalna arhitektura
- `backend/utils/ApiResponse.js` - Response helper
