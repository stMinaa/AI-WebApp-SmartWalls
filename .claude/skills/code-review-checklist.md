# Skill: Code Review Checklist

## Opis
Sistematska code review checklist za proveru kvaliteta pre commit-a ili merge-a.

## Komanda
`/code-review-checklist`

## Checklist

### 1. TDD Proces
- [ ] Test napisan PRE produkcijskog koda (RED faza)?
- [ ] Test pada pre implementacije?
- [ ] Test prolazi posle implementacije (GREEN faza)?
- [ ] Refaktoring uradjen bez lomljenja testova (BLUE faza)?

### 2. Domain Integritet
- [ ] Domain sloj nema infrastructure importa?
- [ ] Nema direktnog pristupa bazi iz kontrolera/ruta?
- [ ] Business logika u servisima, ne u rutama?

### 3. Ports & Adapters
- [ ] Portovi koriste domain tipove (ne entity/model direktno)?
- [ ] Adapteri implementiraju portove korektno?

### 4. Kvalitet Koda
- [ ] Nema duplikata koda (DRY princip)?
- [ ] Funkcije < 50 linija?
- [ ] Cyclomatic complexity < 9?
- [ ] Max depth < 4 nivoa ugnezdavanja?

### 5. Build & Testovi
- [ ] Backend bootuje uspesno (`node backend/index.js`)?
- [ ] Svi testovi prolaze (`npm test`)?
- [ ] Nema preskocenih testova bez razloga?

### 6. Formatting & Linting
- [ ] ESLint cist (0 warnings, 0 errors)?
- [ ] Prettier formatiranje primenjeno?
- [ ] `npm run format:check` prolazi?

### 7. Bezbednost
- [ ] Nema hardkodovanih kredencijala ili tokena?
- [ ] Input validacija na API granicama?
- [ ] Nema SQL/NoSQL injection rizika?

## Kako Koristiti

```
# Brza provera pre commit-a
/code-review-checklist

# Agent ce proci kroz svaku tacku i prijaviti probleme
```

## Integracija sa Drugim Skillovima
- Koristi `/quality` za automatsku ESLint + CodeScene proveru
- Koristi `/tdd` za TDD workflow
- Koristi `/quality-check` za brzu CodeScene analizu
