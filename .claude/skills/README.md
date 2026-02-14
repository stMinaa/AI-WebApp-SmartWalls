# Skills - Agent Orchestration System

Skills su orkestratori koji omogućavaju agentima da pozivaju jedan drugog i koordiniraju složene procese.

---

## 📋 Lista Skillova

| Skill | Fajl | Ko koristi | Poziva |
|-------|------|------------|--------|
| **TDD Workflow** | `tdd.md` | nodejs-coder, react-coder | - |
| **API Design** | `api-design.md` | nodejs-coder | backend-architect |
| **Code Quality** | `quality.md` | nodejs-coder, react-coder | code-quality-reviewer |
| **Quality Check** | `quality-check.md` | code-quality-reviewer | - |
| **DB Migration** | `db-migration.md` | nodejs-coder | database-architect |
| **Documentation** | `documenting.md` | react-coder, backend-architect | - |
| **Feature Spec** | `spec.md` | backend-architect, database-architect | - |

---

## 🔄 Kako Funkcionišu Skillovi

### Pattern 1: TDD Workflow (Glavni Process)
```
User: "Dodaj novi feature X"
  ↓
/tdd skill aktiviran
  ↓
Identifikuje backend ili frontend
  ↓
Aktivira nodejs-coder ili react-coder
  ↓
Agent prati RED → GREEN → BLUE
```

### Pattern 2: Konsultacija (Agent poziva drugog agenta)
```
nodejs-coder piše novi endpoint
  ↓
Aktivira /api-design skill
  ↓
/api-design poziva backend-architect
  ↓
backend-architect daje preporuke
  ↓
nodejs-coder implementira po preporukama
```

### Pattern 3: Pre-Commit Review
```
nodejs-coder završio feature
  ↓
Aktivira /quality skill
  ↓
/quality poziva code-quality-reviewer
  ↓
code-quality-reviewer analizira kod
  ↓
Vraća ocenu i feedback
```

---

## 🎯 Kada Koristiti Koji Skill

### `/tdd` - TDD Workflow
**Koristi:** UVEK za nove feature-e ili bug fix-eve  
**Ko koristi:** nodejs-coder, react-coder  
**Poziva:** Niko (glavni workflow)

---

### `/api-design` - API Design Consultation
**Koristi:** Kada praviš NOVI endpoint ili menjaaš postojeći  
**Ko koristi:** nodejs-coder  
**Poziva:** backend-architect za arhitekturnu konsultaciju

**Primer:**
```
nodejs-coder: "Trebam kreirati POST /api/buildings/:id/apartments/bulk"
  ↓
Aktivira: /api-design
  ↓
backend-architect: "Predlažem sledeću strukturu..."
  ↓
nodejs-coder: Implementira po preporukama
```

---

### `/quality` - Code Quality Review
**Koristi:** PRE COMMITA (obavezno!)  
**Ko koristi:** nodejs-coder, react-coder  
**Poziva:** code-quality-reviewer za analizu

**Primer:**
```
nodejs-coder: Feature implementiran, tests pass
  ↓
Aktivira: /quality
  ↓
code-quality-reviewer: 
  - CodeScene score: 9.2/10 ✓
  - Complexity: 7 (< 9) ✓
  - Funkcije: 45 linija (< 50) ✓
  - Preporuka: OK za commit
```

---

### `/quality-check` - Quick Quality Verification
**Koristi:** Brza provera bez detaljna analiza  
**Ko koristi:** code-quality-reviewer  
**Poziva:** Niko (samostalan check)

---

### `/db-migration` - Database Migration Planning
**Koristi:** Kada menjaš MongoDB schema (RETKO!)  
**Ko koristi:** nodejs-coder  
**Poziva:** database-architect za migration plan

**Primer:**
```
nodejs-coder: "Treba dodati 'rating' polje u Associate modelu"
  ↓
Aktivira: /db-migration
  ↓
database-architect: 
  - Impact analiza
  - Migration plan (koraci)
  - Rollback strategija
  ↓
nodejs-coder: Implementira po planu
```

---

### `/documenting` - Documentation
**Koristi:** Nova komponenta, modul ili arhitekturna odluka  
**Ko koristi:** react-coder, backend-architect  
**Poziva:** Niko (piše dokumentaciju)

**Primer:**
```
react-coder: Kreirao novu BuildingCard komponentu
  ↓
Aktivira: /documenting
  ↓
Generiše: 
  - Props dokumentacija
  - Usage examples
  - UI patterns
```

---

### `/spec` - Feature Specification Review
**Koristi:** Pre početka rada na velikoj funkcionalnosti  
**Ko koristi:** backend-architect, database-architect  
**Poziva:** Niko (čita ROLES.md)

**Primer:**
```
backend-architect: "Trebam razumeti Issue lifecycle"
  ↓
Aktivira: /spec
  ↓
Čita: docs/specs/ROLES.md
  ↓
Identifikuje: Status flow, role permissions, data dependencies
```

---

## 🚨 Error Handling

### Šta ako skill pozove nepostojećeg agenta?
**Greška:** Skill fajl ima pogrešnu referencu  
**Rešenje:** Proveri `.claude/agents/` folder i ispravi putanju

### Šta ako agent koristi skill koji ne postoji?
**Greška:** Agent ima pogrešnu komandu  
**Rešenje:** Proveri `.claude/skills/` folder i ispravi naziv

### Šta ako cirkularni poziv agenata?
**Greška:** Agent A poziva skill koji poziva agenta B koji poziva agenta A  
**Rešenje:** Skills ne smeju praviti cirkule. Redesign flow.

---

## 📚 Dodatne Reference

- **Agent fajlovi:** `.claude/agents/`
- **Context dokumentacija:** `.claude/context/`
- **Commands:** `.claude/commands/`

---

*Ovaj fajl objašnjava kako agenti komuniciraju kroz skillove.*
