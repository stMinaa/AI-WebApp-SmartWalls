/**
 * Test Step 2.1 Part 3 - Response Formatting Helpers
 * Tests refactored endpoints with addApartmentCounts, populateIssue, and flattenIssueBuildings
 */

const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 5000;

// Test users
const DIRECTOR = { username: 'direktor', password: 'Test123!' };
const MANAGER = { username: 'manager', password: 'Test123!' };
const TENANT = { username: 'stanartestni', password: 'Test123!' };

let directorToken = null;
let managerToken = null;
let tenantToken = null;

/**
 * Make HTTP request
 */
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Login user
 */
async function login(username, password) {
  console.log(`\n🔐 Logging in ${username}...`);
  const response = await makeRequest('POST', '/api/auth/login', { username, password });
  
  if (response.status === 200 && response.data.success) {
    console.log(`   ✅ Login successful - Token received`);
    return response.data.data.token;
  } else {
    console.log(`   ❌ Login failed:`, response.data);
    return null;
  }
}

/**
 * Test GET /api/buildings - should have apartmentCount
 */
async function testBuildingsWithCount() {
  console.log(`\n📋 TEST: GET /api/buildings (Director)`);
  const response = await makeRequest('GET', '/api/buildings', null, directorToken);
  
  if (response.status === 200 && response.data.success) {
    const buildings = response.data.data;
    console.log(`   ✅ Status: 200 - ${buildings.length} buildings retrieved`);
    
    if (buildings.length > 0) {
      const building = buildings[0];
      
      // Check if apartmentCount exists
      if ('apartmentCount' in building) {
        console.log(`   ✅ apartmentCount field present: ${building.apartmentCount}`);
      } else {
        console.log(`   ❌ MISSING apartmentCount field!`);
      }
      
      // Show building structure
      console.log(`   📦 Sample building:`, {
        name: building.name,
        address: building.address,
        apartmentCount: building.apartmentCount,
        manager: building.manager ? `${building.manager.firstName} ${building.manager.lastName}` : 'none'
      });
    } else {
      console.log(`   ⚠️  No buildings found`);
    }
  } else {
    console.log(`   ❌ Request failed:`, response.status, response.data);
  }
}

/**
 * Test GET /api/buildings/managed - should have apartmentCount
 */
async function testManagedBuildingsWithCount() {
  console.log(`\n📋 TEST: GET /api/buildings/managed (Manager)`);
  const response = await makeRequest('GET', '/api/buildings/managed', null, managerToken);
  
  if (response.status === 200 && response.data.success) {
    const buildings = response.data.data;
    console.log(`   ✅ Status: 200 - ${buildings.length} buildings retrieved`);
    
    if (buildings.length > 0) {
      const building = buildings[0];
      
      // Check if apartmentCount exists
      if ('apartmentCount' in building) {
        console.log(`   ✅ apartmentCount field present: ${building.apartmentCount}`);
      } else {
        console.log(`   ❌ MISSING apartmentCount field!`);
      }
    } else {
      console.log(`   ⚠️  No managed buildings found`);
    }
  } else {
    console.log(`   ❌ Request failed:`, response.status, response.data);
  }
}

/**
 * Test GET /api/issues - should have flattened building and populated fields
 */
async function testIssuesWithBuilding() {
  console.log(`\n📋 TEST: GET /api/issues (Director)`);
  const response = await makeRequest('GET', '/api/issues', null, directorToken);
  
  if (response.status === 200 && response.data.success) {
    const issues = response.data.data;
    console.log(`   ✅ Status: 200 - ${issues.length} issues retrieved`);
    
    if (issues.length > 0) {
      const issue = issues[0];
      
      // Check if building is at top level (flattened)
      if ('building' in issue && issue.building && typeof issue.building === 'object' && 'name' in issue.building) {
        console.log(`   ✅ building field flattened: ${issue.building.name}`);
      } else {
        console.log(`   ❌ building field NOT flattened or missing!`);
      }
      
      // Check if apartment is populated
      if ('apartment' in issue && issue.apartment && typeof issue.apartment === 'object') {
        console.log(`   ✅ apartment populated: Unit ${issue.apartment.unitNumber}`);
      } else {
        console.log(`   ❌ apartment NOT populated!`);
      }
      
      // Check if users are populated
      if ('createdBy' in issue && issue.createdBy && typeof issue.createdBy === 'object') {
        console.log(`   ✅ createdBy populated: ${issue.createdBy.firstName} ${issue.createdBy.lastName}`);
      } else {
        console.log(`   ❌ createdBy NOT populated!`);
      }
      
      // Show issue structure
      console.log(`   📦 Sample issue:`, {
        title: issue.title,
        status: issue.status,
        apartment: issue.apartment?.unitNumber,
        building: issue.building?.name,
        createdBy: `${issue.createdBy?.firstName} ${issue.createdBy?.lastName}`
      });
    } else {
      console.log(`   ⚠️  No issues found`);
    }
  } else {
    console.log(`   ❌ Request failed:`, response.status, response.data);
  }
}

/**
 * Test GET /api/issues/my - Tenant sees their issues with flattened building
 */
async function testTenantIssues() {
  console.log(`\n📋 TEST: GET /api/issues/my (Tenant)`);
  const response = await makeRequest('GET', '/api/issues/my', null, tenantToken);
  
  if (response.status === 200 && response.data.success) {
    const issues = response.data.data;
    console.log(`   ✅ Status: 200 - ${issues.length} issues retrieved`);
    
    if (issues.length > 0) {
      const issue = issues[0];
      
      // Check if building is flattened
      if ('building' in issue && issue.building && typeof issue.building === 'object') {
        console.log(`   ✅ building field flattened: ${issue.building.name}`);
      } else {
        console.log(`   ❌ building field NOT flattened!`);
      }
    } else {
      console.log(`   ⚠️  Tenant has no issues`);
    }
  } else {
    console.log(`   ❌ Request failed:`, response.status, response.data);
  }
}

/**
 * Test GET /api/tenants/me/apartment - should have apartmentCount in building
 */
async function testTenantApartment() {
  console.log(`\n📋 TEST: GET /api/tenants/me/apartment (Tenant)`);
  const response = await makeRequest('GET', '/api/tenants/me/apartment', null, tenantToken);
  
  if (response.status === 200 && response.data.success) {
    const data = response.data.data;
    console.log(`   ✅ Status: 200 - Apartment info retrieved`);
    
    if (data.building && 'apartmentCount' in data.building) {
      console.log(`   ✅ building.apartmentCount present: ${data.building.apartmentCount}`);
    } else {
      console.log(`   ❌ MISSING building.apartmentCount field!`);
    }
    
    // Show structure
    console.log(`   📦 Apartment data:`, {
      apartment: data.apartment?.unitNumber,
      building: data.building?.name,
      apartmentCount: data.building?.apartmentCount
    });
  } else {
    console.log(`   ❌ Request failed:`, response.status, response.data);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 STEP 2.1 PART 3 - Response Formatting Helpers Test');
  console.log('=' .repeat(60));
  
  try {
    // Login all users
    directorToken = await login(DIRECTOR.username, DIRECTOR.password);
    managerToken = await login(MANAGER.username, MANAGER.password);
    tenantToken = await login(TENANT.username, TENANT.password);
    
    if (!directorToken || !managerToken || !tenantToken) {
      console.log('\n❌ Failed to login all test users. Exiting.');
      return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING REFACTORED ENDPOINTS');
    console.log('=' .repeat(60));
    
    // Test building endpoints with apartmentCount
    await testBuildingsWithCount();
    await testManagedBuildingsWithCount();
    await testTenantApartment();
    
    // Test issue endpoints with population and flattening
    await testIssuesWithBuilding();
    await testTenantIssues();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETE');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
  }
}

// Run tests
runTests();
