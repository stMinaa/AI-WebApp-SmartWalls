# Brza CodeScene analiza projekta
# Analizira sve promene i prikazuje rezultate

Write-Host "🔍 CodeScene Analiza Projekta" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Analiza svih ne-committovanih promena
Write-Host "📊 Analiziram sve promene..." -ForegroundColor Yellow
cs delta

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Analiza ključnih fajlova
$files = @(
    "backend/index.js",
    "backend/routes/users.js",
    "backend/routes/auth.js",
    "backend/routes/buildings.js"
)

Write-Host "📋 Detaljna analiza ključnih fajlova:" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📄 $file" -ForegroundColor Cyan
        cs review $file
        Write-Host ""
    }
}

Write-Host "✅ Analiza završena!" -ForegroundColor Green
