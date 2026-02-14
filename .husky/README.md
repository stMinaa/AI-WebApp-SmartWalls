# Pre-Commit Hook Configuration

Konsolidovani Husky pre-commit hook sa lint-staged, testovima i CodeScene.

---

## Sta hook radi

Pre-commit hook pokrece 3 koraka redom. Ako bilo koji padne, commit je blokiran.

### Korak 1: lint-staged (prettier + eslint)
- **Prettier** formatira staged `.js`/`.jsx` fajlove
- **ESLint** proverava i fiksira probleme (`--fix --max-warnings 0`)
- Konfiguracija: `lint-staged` sekcija u root `package.json`

### Korak 2: Backend testovi
- Pokrece `jest backend/test/ --bail --forceExit --runInBand`
- `--bail` zaustavlja na prvom failed testu

### Korak 3: CodeScene delta (opcionalno)
- Ako je `cs` CLI dostupan, pokrece `cs delta --staged`
- Ako `cs` nije instaliran, preskace korak

---

## Konfiguracija

| Fajl | Uloga |
|------|-------|
| `.husky/pre-commit` | Glavni hook skript |
| `package.json` > `lint-staged` | Prettier + ESLint pravila po fajl tipu |
| `.prettierrc.json` | Prettier konfiguracija |
| `.prettierignore` | Fajlovi koje Prettier preskace |

---

## Rucno pokretanje

```bash
# Samo formatting provera (bez izmena)
npm run format:check

# Formatiranje svih fajlova
npm run format

# Puna quality provera
npm run quality:full
```

---

## Zaobilazenje (Emergency)

```bash
git commit --no-verify -m "commit message"
```

**Koristi samo u izuzetnim slucajevima!**

---

*Last updated: February 2026*
