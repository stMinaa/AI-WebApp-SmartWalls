/**
 * Simple test - Login and test building endpoint
 */

const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 5000;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: API_PORT,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
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

async function test() {
  console.log('🧪 Testing Step 2.1 Part 3 Refactoring\n');
  
  // Try login
  console.log('1️⃣  Login as direktor...');
  const loginResp = await makeRequest('POST', '/api/auth/login', {
    username: 'direktor',
    password: 'Test123!'
  });
  
  if (loginResp.status !== 200 || !loginResp.data.success) {
    console.log('   ❌ Login failed:', loginResp.data);
    return;
  }
  
  const token = loginResp.data.data.token;
  console.log('   ✅ Login successful\n');
  
  // Test GET /api/buildings
  console.log('2️⃣  GET /api/buildings (should have apartmentCount)...');
  const buildingsResp = await makeRequest('GET', '/api/buildings', null, token);
  
  if (buildingsResp.status === 200 && buildingsResp.data.success) {
    const buildings = buildingsResp.data.data;
    console.log(`   ✅ ${buildings.length} buildings retrieved`);
    
    if (buildings.length > 0) {
      const b = buildings[0];
      console.log(`   📦 Sample:`, {
        name: b.name,
        apartmentCount: b.apartmentCount,
        hasCount: 'apartmentCount' in b
      });
      
      if ('apartmentCount' in b) {
        console.log('   ✅ apartmentCount field EXISTS\n');
      } else {
        console.log('   ❌ apartmentCount field MISSING\n');
      }
    }
  } else {
    console.log('   ❌ Failed:', buildingsResp.data);
  }
  
  // Test GET /api/issues
  console.log('3️⃣  GET /api/issues (should have flattened building)...');
  const issuesResp = await makeRequest('GET', '/api/issues', null, token);
  
  if (issuesResp.status === 200 && issuesResp.data.success) {
    const issues = issuesResp.data.data;
    console.log(`   ✅ ${issues.length} issues retrieved`);
    
    if (issues.length > 0) {
      const i = issues[0];
      console.log(`   📦 Sample:`, {
        title: i.title,
        building: i.building?.name,
        apartment: i.apartment?.unitNumber,
        hasBuilding: 'building' in i && typeof i.building === 'object'
      });
      
      if ('building' in i && i.building && typeof i.building === 'object') {
        console.log('   ✅ building field FLATTENED\n');
      } else {
        console.log('   ❌ building field NOT flattened\n');
      }
    }
  } else {
    console.log('   ❌ Failed:', issuesResp.data);
  }
  
  console.log('✅ Test complete!');
}

test().catch(err => console.error('Error:', err));
