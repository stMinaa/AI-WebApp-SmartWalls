# Pre-Commit Hook Configuration

Konfiguracija Husky pre-commit hook-a za quality gates.

---

## 📅 Faze Aktivacije

### Faza 1: SADA (Pre-refactoring)
**Status:** 🔓 Lenient  
**Blokira commit:** Samo frontend build failures  
**Razlog:** Hexagonalna arhitektura još ne postoji  

**Omogućava:**
- ✅ Sve commit-ove prolaze (osim frontend build greške)
- 💡 Manual `npm run quality` u bilo kom trenutku

### Faza 2: Level 1-2 (Laka refaktorizacija)
**Status:** 🟡 Srednje strogo  
**Aktivacija:** Odkomentiraj ESLint u `pre-commit`  
**Blokira:** Complexity > 9, function length > 50 lines  

### Faza 3: Level 3+ (Domain kreiran)
**Status:** 🔴 Strogo  
**Aktivacija:** Odkomentiraj SVE provere u `pre-commit`  
**Blokira:** Domain importing infrastructure, layer violations  
**Pokretač:** Kreiranje `backend/src/domain/` (Step 3.1)

---

## 🎯 Trenutna Konfiguracija (Faza 1)

**Aktivan:**
- ✅ Frontend build check (blokira commit ako build ne prolazi)

**Neaktivan (zakomentarisano):**
- ⏸️ Arhitekturalni testovi
- ⏸️ Backend ESLint

**Razlog:** Arhitekturalni testovi aktiviraju se tek kada počne hexagonal refactoring.

---

## 🔄 Kako Aktivirati Strože Provere

### Kada Počneš sa Level 1 Refaktoringom:

**Ažuriraj:** `.husky/pre-commit`

**Odkomentiraj:**
```bash
echo ""
echo "🏛️  Running architectural tests..."
npm run test:arch || exit 1

echo ""
echo "✨ Linting backend code..."
npm run lint || exit 1
```

**Ili koristi ovu verziju:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running quality checks..."
echo ""

# Frontend build check
echo "📦 Checking frontend build..."
node .husky/pre-commit-check.js || exit 1

# Architectural checks (ACTIVE during refactoring)
echo ""
echo "🏛️  Running architectural tests..."
npm run test:arch || exit 1

echo ""
echo "✨ Linting backend code..."
npm run lint || exit 1

echo ""
echo "✅ All quality checks passed!"
```

---

## 🚀 Ručno Pokretanje (Uvek Dostupno)

Čak i bez pre-commit hook-a, možeš pokrenuti:

```bash
# Brza provera
npm run quality

# Puna provera
npm run quality:full

# Samo arhitektura
npm run test:arch

# Samo lint
npm run lint
```

---

## 📅 Faze Aktivacije

### Faza 1: Pre-refactoring (TRENUTNO)
```bash
Pre-commit: Frontend build only
Manual: npm run quality (opciono)
```

### Faza 2: Level 1-2 Refactoring (Extract & Organize)
```bash
Pre-commit: Frontend build + ESLint
Manual: npm run quality (redovno)
```

### Faza 3: Level 3+ Hexagonal Implementation
```bash
Pre-commit: Frontend build + Arch tests + ESLint
Manual: npm run quality:full (pre svakog push-a)
```

---

## 🔓 Zaobilaženje Hook-a (Emergency)

Ako hook blokira, a hitno treba commit:

```bash
git commit --no-verify -m "commit message"
```

**⚠️ Koristi samo u izuzetnim slučajevima!**

---

## ✅ Testiranje Hook-a

### Testuj trenutnu konfiguraciju:
```bash
git add .
git commit -m "test: verify pre-commit hook"
```

**Očekivano:**
- ✅ Frontend build check se izvršava
- ⏭️ Architectural tests preskočeni
- ⏭️ Linting preskočen
- ✅ Commit uspešan

### Testuj punu konfiguraciju (bez commit-a):
```bash
npm run quality:full
```

---

## 📖 Povezana Dokumentacija

- [REFACTORING.md](../docs/standards/REFACTORING.md) - Kada aktivirati provere za svaki Level
- [QUALITY_QUICK_REF.md](../docs/reference/QUALITY_QUICK_REF.md) - Komande i workflow
- [CODE_QUALITY.md](../docs/standards/CODE_QUALITY.md) - Standardi koji se proveravaju

---

*Last updated: February 12, 2026*
