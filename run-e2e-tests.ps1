# E2E Testing Script - Building Management System
# Comprehensive tests for all functionality

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "E2E TESTING - Building Management System"  -ForegroundColor Cyan  
Write-Host "========================================`n" -ForegroundColor Cyan

# Global test data
$script:directorToken = $null
$script:managerToken = $null
$script:tenantToken = $null
$script:associateToken = $null
$script:buildingId = $null
$script:managerId = $null
$script:tenantId = $null
$script:associateId = $null
$script:apartmentId = $null
$script:issueId = $null

function Invoke-Test {
    param([string]$Name, [string]$Method, [string]$Uri, [hashtable]$Headers = @{}, [string]$Body = $null)
    Write-Host "  Testing: $Name" -NoNewline
    try {
        $params = @{Method = $Method; Uri = $Uri; Headers = $Headers}
        if ($Body) { $params.ContentType = "application/json"; $params.Body = $Body }
        $response = Invoke-RestMethod @params
        Write-Host " PASS" -ForegroundColor Green
        return $response
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# PHASE 1: Authentication
Write-Host "`nPHASE 1: AUTHENTICATION" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow

$dirBody = @{username="dir$timestamp";email="dir$timestamp@test.com";password="Test123!";firstName="Dir";lastName="Test";role="director"} | ConvertTo-Json
$dir = Invoke-Test -Name "Register Director" -Method POST -Uri "http://localhost:5000/api/auth/signup" -Body $dirBody
$script:directorToken = $dir.token
$script:directorUsername = "dir$timestamp"

$loginBody = @{username="dir$timestamp";password="Test123!"} | ConvertTo-Json  
$login = Invoke-Test -Name "Director Login" -Method POST -Uri "http://localhost:5000/api/auth/login" -Body $loginBody
$script:directorToken = $login.token

$dHeaders = @{Authorization="Bearer $script:directorToken"}

Write-Host "PHASE 1 COMPLETE`n" -ForegroundColor Green

# PHASE 2: Buildings & Managers
Write-Host "PHASE 2: BUILDINGS & MANAGERS" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow

$buildBody = @{name="Test Building";address="Test St 1";floors=5;apartmentsPerFloor=4} | ConvertTo-Json
$building = Invoke-Test -Name "Create Building" -Method POST -Uri "http://localhost:5000/api/buildings" -Headers $dHeaders -Body $buildBody
$script:buildingId = $building._id
Write-Host "  Building ID: $script:buildingId" -ForegroundColor Gray

$buildings = Invoke-Test -Name "Get Buildings" -Method GET -Uri "http://localhost:5000/api/buildings" -Headers $dHeaders

$mgrBody = @{username="mgr$timestamp";email="mgr$timestamp@test.com";password="Test123!";firstName="Mgr";lastName="Test";role="manager"} | ConvertTo-Json
$mgr = Invoke-Test -Name "Register Manager" -Method POST -Uri "http://localhost:5000/api/auth/signup" -Body $mgrBody
$script:managerId = $mgr.user._id
$script:managerToken = $mgr.token

$uri = 'http://localhost:5000/api/users?role=manager&status=pending'
$pending = Invoke-Test -Name "Get Pending Managers" -Method GET -Uri $uri -Headers $dHeaders

$approveBody = @{status="active"} | ConvertTo-Json
$approved = Invoke-Test -Name "Approve Manager" -Method PATCH -Uri "http://localhost:5000/api/users/$script:managerId/approve" -Headers $dHeaders -Body $approveBody

$assignBody = @{managerId=$script:managerId} | ConvertTo-Json
$assigned = Invoke-Test -Name "Assign Manager" -Method PATCH -Uri "http://localhost:5000/api/buildings/$script:buildingId/assign-manager" -Headers $dHeaders -Body $assignBody

Write-Host "PHASE 2 COMPLETE`n" -ForegroundColor Green

# PHASE 3: Apartments & Tenants
Write-Host "PHASE 3: APARTMENTS & TENANTS" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow

$mLoginBody = @{username="mgr$timestamp";password="Test123!"} | ConvertTo-Json
$mLogin = Invoke-Test -Name "Manager Login" -Method POST -Uri "http://localhost:5000/api/auth/login" -Body $mLoginBody
$script:managerToken = $mLogin.token
$mHeaders = @{Authorization="Bearer $script:managerToken"}

$aptBody = @{unitNumber="101"} | ConvertTo-Json
$apt = Invoke-Test -Name "Create Apartment" -Method POST -Uri "http://localhost:5000/api/buildings/$script:buildingId/apartments" -Headers $mHeaders -Body $aptBody
$script:apartmentId = $apt._id
Write-Host "  Apartment ID: $script:apartmentId" -ForegroundColor Gray

$uri = "http://localhost:5000/api/buildings/$script:buildingId/apartments"
$apts = Invoke-Test -Name "Get Apartments" -Method GET -Uri $uri -Headers $mHeaders

$tenBody = @{username="ten$timestamp";email="ten$timestamp@test.com";password="Test123!";firstName="Ten";lastName="Test";role="tenant"} | ConvertTo-Json
$ten = Invoke-Test -Name "Register Tenant" -Method POST -Uri "http://localhost:5000/api/auth/signup" -Body $tenBody
$script:tenantId = $ten.user._id
$script:tenantToken = $ten.token

$assignTenBody = @{apartmentId=$script:apartmentId;buildingId=$script:buildingId} | ConvertTo-Json
$assignedTen = Invoke-Test -Name "Assign Tenant" -Method POST -Uri "http://localhost:5000/api/tenants/$script:tenantId/assign" -Headers $mHeaders -Body $assignTenBody

$tHeaders = @{Authorization="Bearer $script:tenantToken"}

Write-Host "PHASE 3 COMPLETE`n" -ForegroundColor Green

# PHASE 4: Issues
Write-Host "PHASE 4: ISSUE REPORTING & TRIAGE" -ForegroundColor Yellow
Write-Host "----------------------------------" -ForegroundColor Yellow

$issueBody = @{title="Test Issue";description="Test";priority="high";buildingId=$script:buildingId;apartmentId=$script:apartmentId} | ConvertTo-Json
$issueResp = Invoke-Test -Name "Report Issue" -Method POST -Uri "http://localhost:5000/api/issues" -Headers $tHeaders -Body $issueBody
$script:issueId = $issueResp.issue._id
Write-Host "  Issue ID: $script:issueId" -ForegroundColor Gray

$uri = 'http://localhost:5000/api/issues?status=reported'
$reported = Invoke-Test -Name "Get Reported Issues" -Method GET -Uri $uri -Headers $mHeaders

$forwardBody = @{action="forward"} | ConvertTo-Json
$forwarded = Invoke-Test -Name "Forward Issue" -Method PATCH -Uri "http://localhost:5000/api/issues/$script:issueId/triage" -Headers $mHeaders -Body $forwardBody

Write-Host "PHASE 4 COMPLETE`n" -ForegroundColor Green

# PHASE 5: Associates
Write-Host "PHASE 5: ASSOCIATE WORKFLOW" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$assocBody = @{username="asc$timestamp";email="asc$timestamp@test.com";password="Test123!";firstName="Asc";lastName="Test";role="associate"} | ConvertTo-Json
$assoc = Invoke-Test -Name "Register Associate" -Method POST -Uri "http://localhost:5000/api/auth/signup" -Body $assocBody
$script:associateId = $assoc.user._id
$script:associateToken = $assoc.token

$approveAscBody = @{status="active"} | ConvertTo-Json
$approvedAsc = Invoke-Test -Name "Approve Associate" -Method PATCH -Uri "http://localhost:5000/api/users/$script:associateId/approve" -Headers $dHeaders -Body $approveAscBody

$assignIssBody = @{action="assign";associateId=$script:associateId} | ConvertTo-Json
$assignedIss = Invoke-Test -Name "Assign Issue" -Method PATCH -Uri "http://localhost:5000/api/issues/$script:issueId/assign" -Headers $dHeaders -Body $assignIssBody

$aLoginBody = @{username="asc$timestamp";password="Test123!"} | ConvertTo-Json
$aLogin = Invoke-Test -Name "Associate Login" -Method POST -Uri "http://localhost:5000/api/auth/login" -Body $aLoginBody
$script:associateToken = $aLogin.token
$aHeaders = @{Authorization="Bearer $script:associateToken"}

$uri = 'http://localhost:5000/api/associates/me/jobs'
$jobs = Invoke-Test -Name "Get Assigned Jobs" -Method GET -Uri $uri -Headers $aHeaders

$acceptBody = @{estimatedCost=5000} | ConvertTo-Json
$accepted = Invoke-Test -Name "Accept Job" -Method POST -Uri "http://localhost:5000/api/issues/$script:issueId/accept" -Headers $aHeaders -Body $acceptBody

$completeBody = @{completionNotes="Fixed"} | ConvertTo-Json
$completed = Invoke-Test -Name "Complete Job" -Method POST -Uri "http://localhost:5000/api/issues/$script:issueId/complete" -Headers $aHeaders -Body $completeBody

Write-Host "PHASE 5 COMPLETE`n" -ForegroundColor Green

# PHASE 6: Bulletin Board
Write-Host "PHASE 6: NOTICES & POLLS" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow

$noticeBody = @{title="Test Notice";content="Important update";buildingId=$script:buildingId} | ConvertTo-Json
$notice = Invoke-Test -Name "Create Notice" -Method POST -Uri "http://localhost:5000/api/buildings/$script:buildingId/notices" -Headers $mHeaders -Body $noticeBody

$uri = "http://localhost:5000/api/buildings/$script:buildingId/notices"
$notices = Invoke-Test -Name "Get Notices" -Method GET -Uri $uri -Headers $tHeaders

$pollBody = @{question="Test Poll - Which option?";options=@("A","B","C")} | ConvertTo-Json
$poll = Invoke-Test -Name "Create Poll" -Method POST -Uri "http://localhost:5000/api/buildings/$script:buildingId/polls" -Headers $mHeaders -Body $pollBody
$pollId = $poll._id

$voteBody = @{option="A"} | ConvertTo-Json
$voted = Invoke-Test -Name "Vote on Poll" -Method POST -Uri "http://localhost:5000/api/polls/$pollId/vote" -Headers $tHeaders -Body $voteBody

$pollResult = Invoke-Test -Name "Get Poll Results" -Method GET -Uri "http://localhost:5000/api/buildings/$script:buildingId/polls" -Headers $tHeaders

Write-Host "PHASE 6 COMPLETE`n" -ForegroundColor Green

# SUMMARY
Write-Host "========================================" -ForegroundColor Green
Write-Host "ALL E2E TESTS PASSED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nTest Summary:"
Write-Host "  Phase 1: Authentication (2 tests)" -ForegroundColor Green
Write-Host "  Phase 2: Buildings & Managers (6 tests)" -ForegroundColor Green
Write-Host "  Phase 3: Apartments & Tenants (4 tests)" -ForegroundColor Green
Write-Host "  Phase 4: Issue Reporting (3 tests)" -ForegroundColor Green
Write-Host "  Phase 5: Associate Workflow (7 tests)" -ForegroundColor Green
Write-Host "  Phase 6: Bulletin Board (5 tests)" -ForegroundColor Green
Write-Host "`nTotal: 27 tests PASSED" -ForegroundColor Green
Write-Host ""