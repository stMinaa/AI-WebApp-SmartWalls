# API Endpoint Test Script
# Run this before starting the frontend to ensure backend is working

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   API Endpoint Testing Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$testsPassed = 0
$testsFailed = 0

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "  URL: $Method $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body -ne $null) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        Write-Host "  ✓ PASS - Status: $ExpectedStatus" -ForegroundColor Green
        Write-Host ""
        $script:testsPassed++
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  ✓ PASS - Got expected status: $ExpectedStatus" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "  ✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "    Expected: $ExpectedStatus, Got: $statusCode" -ForegroundColor Red
            $script:testsFailed++
        }
        Write-Host ""
        return $null
    }
}

# Start Tests
Write-Host "[1] Testing Server Health" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan
$health = Test-Endpoint -Name "Health Check" -Url "$baseUrl/api/health"

if ($health -eq $null) {
    Write-Host "❌ CRITICAL: Backend server is not responding!" -ForegroundColor Red
    Write-Host "Please start the backend server with: node server.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "[2] Testing Authentication Endpoints" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan

# Generate unique username
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testUsername = "testuser_$timestamp"
$testEmail = "$testUsername@test.com"

# Test Register
$registerBody = @{
    username = $testUsername
    password = "test123456"
    email = $testEmail
    firstName = "Test"
    lastName = "User"
    role = "tenant"
}

$registerResponse = Test-Endpoint -Name "Register User" -Url "$baseUrl/api/auth/register" -Method "POST" -Body $registerBody -ExpectedStatus 201

if ($registerResponse -eq $null) {
    Write-Host "⚠️  Registration failed. Skipping login tests." -ForegroundColor Yellow
} else {
    $token = $registerResponse.data.token
    
    # Test Login
    $loginBody = @{
        username = $testUsername
        password = "test123456"
    }
    
    $loginResponse = Test-Endpoint -Name "Login User" -Url "$baseUrl/api/auth/login" -Method "POST" -Body $loginBody -ExpectedStatus 200
    
    if ($loginResponse -ne $null) {
        $token = $loginResponse.data.token
        
        # Test Get Profile
        $authHeaders = @{
            Authorization = "Bearer $token"
        }
        
        Test-Endpoint -Name "Get User Profile" -Url "$baseUrl/api/auth/me" -Headers $authHeaders
        
        # Test Update Profile
        $updateBody = @{
            firstName = "Updated"
            lastName = "Name"
            mobile = "1234567890"
        }
        
        Test-Endpoint -Name "Update Profile" -Url "$baseUrl/api/auth/me" -Method "PATCH" -Body $updateBody -Headers $authHeaders
    }
}

Write-Host "[3] Testing Building Endpoints" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan

Test-Endpoint -Name "Get Public Buildings" -Url "$baseUrl/api/buildings/public"

Write-Host "[4] Testing Error Cases" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan

# Test invalid login
$invalidLoginBody = @{
    username = "nonexistent"
    password = "wrong"
}

Test-Endpoint -Name "Invalid Login (Should fail)" -Url "$baseUrl/api/auth/login" -Method "POST" -Body $invalidLoginBody -ExpectedStatus 401

# Test missing auth token
Test-Endpoint -Name "Access without token (Should fail)" -Url "$baseUrl/api/auth/me" -ExpectedStatus 401

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Test Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ All tests passed! Backend is ready." -ForegroundColor Green
    Write-Host "You can now start the frontend with: npm start" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "✗ Some tests failed. Please fix the issues before starting the frontend." -ForegroundColor Red
    exit 1
}
