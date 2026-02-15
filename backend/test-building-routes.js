/**
 * Manual test for building routes after refactoring
 * Tests building endpoints migrated to routes/buildings.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const DIRECTOR_CREDS = { username: 'direktor', password: 'Test123!' };
const MANAGER_CREDS = { username: 'manager', password: 'Test123!' };

let directorToken = '';
let managerToken = '';
let testBuildingId = '';

async function login(credentials) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    console.log(`✓ Login successful for ${credentials.username}`);
    return response.data.token;
  } catch (error) {
    console.error(`✗ Login failed for ${credentials.username}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testCreateBuilding() {
  console.log('\n--- Test: POST /api/buildings (Create Building) ---');
  try {
    const response = await axios.post(
      `${BASE_URL}/buildings`,
      {
        name: 'Test Building Routes',
        address: 'Test Address 123',
        imageUrl: 'https://example.com/image.jpg'
      },
      { headers: { Authorization: `Bearer ${directorToken}` } }
    );
    
    testBuildingId = response.data.data._id;
    console.log('✓ Building created:', testBuildingId);
    console.log('  Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('✗ Create building failed:', error.response?.data || error.message);
  }
}

async function testListBuildings() {
  console.log('\n--- Test: GET /api/buildings (List All Buildings) ---');
  try {
    const response = await axios.get(`${BASE_URL}/buildings`, {
      headers: { Authorization: `Bearer ${directorToken}` }
    });
    
    console.log('✓ Buildings retrieved:', response.data.data.length, 'buildings');
    if (response.data.data.length > 0) {
      console.log('  First building:', response.data.data[0].name);
    }
  } catch (error) {
    console.error('✗ List buildings failed:', error.response?.data || error.message);
  }
}

async function testGetManagedBuildings() {
  console.log('\n--- Test: GET /api/buildings/managed (Manager\'s Buildings) ---');
  try {
    const response = await axios.get(`${BASE_URL}/buildings/managed`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    
    console.log('✓ Managed buildings retrieved:', response.data.data.length, 'buildings');
  } catch (error) {
    console.error('✗ Get managed buildings failed:', error.response?.data || error.message);
  }
}

async function testAssignManager() {
  console.log('\n--- Test: PATCH /api/buildings/:buildingId/assign-manager ---');
  
  // First, get manager user ID
  try {
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const managerId = meResponse.data.data._id;
    
    const response = await axios.patch(
      `${BASE_URL}/buildings/${testBuildingId}/assign-manager`,
      { managerId },
      { headers: { Authorization: `Bearer ${directorToken}` } }
    );
    
    console.log('✓ Manager assigned to building');
    console.log('  Manager:', response.data.data.manager?.firstName || 'N/A');
  } catch (error) {
    console.error('✗ Assign manager failed:', error.response?.data || error.message);
  }
}

async function testBulkCreateApartments() {
  console.log('\n--- Test: POST /api/buildings/:id/apartments/bulk ---');
  try {
    const response = await axios.post(
      `${BASE_URL}/buildings/${testBuildingId}/apartments/bulk`,
      {
        floors: 3,
        unitsPerFloor: 4
      },
      { headers: { Authorization: `Bearer ${directorToken}` } }
    );
    
    console.log('✓ Apartments created:', response.data.data.count, 'apartments');
  } catch (error) {
    console.error('✗ Bulk create apartments failed:', error.response?.data || error.message);
  }
}

async function testListApartments() {
  console.log('\n--- Test: GET /api/buildings/:id/apartments ---');
  try {
    const response = await axios.get(`${BASE_URL}/buildings/${testBuildingId}/apartments`, {
      headers: { Authorization: `Bearer ${directorToken}` }
    });
    
    console.log('✓ Apartments retrieved:', response.data.data.length, 'apartments');
    if (response.data.data.length > 0) {
      console.log('  First apartment:', response.data.data[0].unitNumber);
    }
  } catch (error) {
    console.error('✗ List apartments failed:', error.response?.data || error.message);
  }
}

async function testListTenants() {
  console.log('\n--- Test: GET /api/buildings/:id/tenants ---');
  try {
    const response = await axios.get(`${BASE_URL}/buildings/${testBuildingId}/tenants`, {
      headers: { Authorization: `Bearer ${directorToken}` }
    });
    
    console.log('✓ Tenants retrieved:', response.data.data.length, 'tenants');
  } catch (error) {
    console.error('✗ List tenants failed:', error.response?.data || error.message);
  }
}

async function testCreateNotice() {
  console.log('\n--- Test: POST /api/buildings/:buildingId/notices ---');
  try {
    const response = await axios.post(
      `${BASE_URL}/buildings/${testBuildingId}/notices`,
      {
        content: 'Test notice from building routes'
      },
      { headers: { Authorization: `Bearer ${managerToken}` } }
    );
    
    console.log('✓ Notice created:', response.data._id);
  } catch (error) {
    console.error('✗ Create notice failed:', error.response?.data || error.message);
  }
}

async function testListNotices() {
  console.log('\n--- Test: GET /api/buildings/:buildingId/notices ---');
  try {
    const response = await axios.get(`${BASE_URL}/buildings/${testBuildingId}/notices`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    
    console.log('✓ Notices retrieved:', response.data.data.length, 'notices');
  } catch (error) {
    console.error('✗ List notices failed:', error.response?.data || error.message);
  }
}

async function testCreatePoll() {
  console.log('\n--- Test: POST /api/buildings/:buildingId/polls ---');
  try {
    const response = await axios.post(
      `${BASE_URL}/buildings/${testBuildingId}/polls`,
      {
        question: 'Test poll from building routes?',
        options: ['Yes', 'No', 'Maybe']
      },
      { headers: { Authorization: `Bearer ${managerToken}` } }
    );
    
    console.log('✓ Poll created:', response.data._id);
  } catch (error) {
    console.error('✗ Create poll failed:', error.response?.data || error.message);
  }
}

async function testListPolls() {
  console.log('\n--- Test: GET /api/buildings/:buildingId/polls ---');
  try {
    const response = await axios.get(`${BASE_URL}/buildings/${testBuildingId}/polls`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    
    console.log('✓ Polls retrieved:', response.data.data.length, 'polls');
  } catch (error) {
    console.error('✗ List polls failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('=== Building Routes Test Suite ===\n');
  
  try {
    // Login
    console.log('--- Authentication ---');
    directorToken = await login(DIRECTOR_CREDS);
    managerToken = await login(MANAGER_CREDS);
    
    // Test building endpoints
    await testCreateBuilding();
    await testListBuildings();
    await testGetManagedBuildings();
    await testAssignManager();
    
    // Test apartment endpoints
    await testBulkCreateApartments();
    await testListApartments();
    await testListTenants();
    
    // Test notice/poll endpoints
    await testCreateNotice();
    await testListNotices();
    await testCreatePoll();
    await testListPolls();
    
    console.log('\n=== All Tests Completed ===');
    process.exit(0);
  } catch (error) {
    console.error('\n=== Tests Failed ===');
    console.error(error);
    process.exit(1);
  }
}

runTests();
