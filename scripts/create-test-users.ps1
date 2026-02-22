# UI Testing Script - Create test users for manual browser testing

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CREATING TEST USERS FOR UI TESTING" -ForegroundColor Cyan  
Write-Host "========================================`n" -ForegroundColor Cyan

# Test credentials
$script:testPassword = "Test123!"
$script:buildingId = $null
$script:apartmentId = $null

function Invoke-ApiCall {
    param([string]$Method, [string]$Uri, [hashtable]$Headers = @{}, [string]$Body = $null)
    try {
        $params = @{Method = $Method; Uri = $Uri; Headers = $Headers}
        if ($Body) { $params.ContentType = "application/json"; $params.Body = $Body }
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        throw
    }
}

# Create Director
Write-Host "Creating Director..." -NoNewline
$dirBody = @{username="direktor";email="direktor@test.com";password=$testPassword;firstName="Milan";lastName="Kovačević";role="director"} | ConvertTo-Json
$director = Invoke-ApiCall -Method POST -Uri "http://localhost:5000/api/auth/signup" -Body $dirBody
$dirToken = $director.token
Write-Host " ✓" -ForegroundColor Green
Write-Host "  Username: direktor" -ForegroundColor Gray
Write-Host "  Password: $testPassword" -ForegroundColor Gray

# Director creates building
Write-Host "`nCreating Building..." -NoNewline
$buildBody = @{name="Zgrada Sunce";address="Knez Mihailova 15, Beograd";floors=5;apartmentsPerFloor=4} | ConvertTo-Json
$building = Invoke-ApiCall -Method POST -Uri "http://localhost:5000/api/buildings" -Headers @{Authorization="Bearer $dirToken"} -Body $buildBody
$script:buildingId = $building._id
Write-Host " ✓" -ForegroundColor Green
Write-Host "  Building: Zgrada Sunce" -ForegroundColor Gray

# Create Manager
Write-Host "`nCreating Manager..." -NoNewline
$mgrBody = @{username="manager";email="manager@test.com";password=$testPassword;firstName="Ana";lastName="Jovanović";role="manager"} | ConvertTo-Json
$manager = Invoke-ApiCall -Method POST -Uri "http://localhost:5000/api/auth/signup" -Body $mgrBody
$managerId = $manager.user._id
Write-Host " ✓" -ForegroundColor Green
Write-Host "  Username: manager" -ForegroundColor Gray
Write-Host "  Password: $testPassword" -ForegroundColor Gray

# Approve Manager
Write-Host "  Approving..." -NoNewline
$approveBody = @{status="active"} | ConvertTo-Json
Invoke-ApiCall -Method PATCH -Uri "http://localhost:5000/api/users/$managerId/approve" -Headers @{Authorization="Bearer $dirToken"} -Body $approveBody | Out-Null
Write-Host " ✓" -ForegroundColor Green

# Assign Manager to Building
Write-Host "  Assigning to building..." -NoNewline
$assignBody = @{managerId=$managerId} | ConvertTo-Json
Invoke-ApiCall -Method PATCH -Uri "http://localhost:5000/api/buildings/$script:buildingId/assign-manager" -Headers @{Authorization="Bearer $dirToken"} -Body $assignBody | Out-Null
Write-Host " ✓" -ForegroundColor Green

# Manager login and create apartment
$mgrLogin = Invoke-ApiCall -Method POST -Uri "http://localhost:5000/api/auth/login" -Body (@{username="manager";password=$testPassword} | ConvertTo-Json)
$mgrToken = $mgrLogin.token

Write-Host "`nCreating Apartment..." -NoNewline
$aptBody = @{unitNumber="301"} | ConvertTo-Json
$apt = Invoke-ApiCall -Method POST -Uri "http://localhost:5000/api/buildings/$script:buildingId/apartments" -Headers @{Authorization="Bearer $mgrToken"} -Body $aptBody
$script:apartmentId = $apt._id
Write-Host " ✓" -ForegroundColor Green
Write-Host "  Apartment: 301" -ForegroundColor Gray

# Create Tenant
Write-Host "`nCreating Tenant..." -NoNewline
$tenBody = @{username="tenant";email="tenant@test.com";password=$testPassword;firstName="Petar";lastName="Nikolić";role="tenant"} | ConvertTo-Json
$tenant = Invoke-ApiCall -Method POST -Uri "http://localhost:5000/api/auth/signup" -Body $tenBody
$tenantId = $tenant.user._id
Write-Host " ✓" -ForegroundColor Green
Write-Host "  Username: tenant" -ForegroundColor Gray
Write-Host "  Password: $testPassword" -ForegroundColor Gray

# Assign Tenant to Apartment
Write-Host "  Assigning to apartment..." -NoNewline
$assignTenBody = @{apartmentId=$script:apartmentId;buildingId=$script:buildingId} | ConvertTo-Json
Invoke-ApiCall -Method POST -Uri "http://localhost:5000/api/tenants/$tenantId/assign" -Headers @{Authorization="Bearer $mgrToken"} -Body $assignTenBody | Out-Null
Write-Host " ✓" -ForegroundColor Green

# Create Associate
Write-Host "`nCreating Associate..." -NoNewline
$ascBody = @{username="associate";email="associate@test.com";password=$testPassword;firstName="Marko";lastName="Stojanović";role="associate"} | ConvertTo-Json
$associate = Invoke-ApiCall -Method POST -Uri "http://localhost:5000/api/auth/signup" -Body $ascBody
$associateId = $associate.user._id
Write-Host " ✓" -ForegroundColor Green
Write-Host "  Username: associate" -ForegroundColor Gray
Write-Host "  Password: $testPassword" -ForegroundColor Gray

# Approve Associate
Write-Host "  Approving..." -NoNewline
$approveAscBody = @{status="active"} | ConvertTo-Json
Invoke-ApiCall -Method PATCH -Uri "http://localhost:5000/api/users/$associateId/approve" -Headers @{Authorization="Bearer $dirToken"} -Body $approveAscBody | Out-Null
Write-Host " ✓" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "TEST USERS CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nLogin Credentials for UI Testing:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Director:" -ForegroundColor Cyan
Write-Host "  Username: direktor" -ForegroundColor White
Write-Host "  Password: $testPassword" -ForegroundColor White
Write-Host ""
Write-Host "Manager:" -ForegroundColor Cyan  
Write-Host "  Username: manager" -ForegroundColor White
Write-Host "  Password: $testPassword" -ForegroundColor White
Write-Host ""
Write-Host "Tenant:" -ForegroundColor Cyan
Write-Host "  Username: tenant" -ForegroundColor White
Write-Host "  Password: $testPassword" -ForegroundColor White
Write-Host ""
Write-Host "Associate:" -ForegroundColor Cyan
Write-Host "  Username: associate" -ForegroundColor White
Write-Host "  Password: $testPassword" -ForegroundColor White
Write-Host ""
Write-Host "Building: Zgrada Sunce" -ForegroundColor Gray
Write-Host "Apartment: 301" -ForegroundColor Gray
Write-Host ""
Write-Host "Open browser to: http://localhost:3001" -ForegroundColor Green
Write-Host ""
