# CodeScene analiza - Korisne komande

✅ **CodeScene CLI je instaliran i konfigurisan!** (verzija 1.0.17)
✅ **MCP Server je povezan sa VS Code**
✅ **Pre-commit hook je postavljen**
✅ **Environment token je konfigurisan**

## 🚀 Brzi start

### Brza analiza celog projekta
```bash
.\analyze-code.ps1
```

### Analiziraj trenutne promene
```bash
cs delta
```

### Analiziraj staged promene
```bash
cs delta --staged
```

### Analiziraj specifičan fajl
```bash
cs check backend/routes/users.js
```

### Review fajla sa ocenom
```bash
cs review backend/routes/users.js
```

### Pronađi sve code health probleme u fajlu
```bash
cs check-rules backend/routes/users.js
```

## Pre-commit integracija

Pre-commit hook je automatski postavljen u `.git/hooks/pre-commit`

Ako želite da preskočite analizu:
```bash
git commit --no-verify -m "poruka"
```

## CI/CD integracija

Dodajte u CI/CD pipeline:
```yaml
- name: CodeScene Analysis
  run: cs delta --error-on-warnings
```

## VS Code integracija

CodeScene MCP server je konfigurisan u `.vscode/mcp.json`
Nakon restarta VS Code-a, moći ćete da koristite CodeScene kroz Copilot.
