const http = require('http');

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testAssociatesEndpoint() {
  console.log('🔄 Step 1: Login as director...\n');
  
  const loginResponse = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'direktor', password: 'direktor' }));
  
  if (loginResponse.statusCode !== 200) {
    console.log('❌ Login failed!');
    return;
  }
  
  const token = JSON.parse(loginResponse.body).token;
  console.log('✅ Logged in!\n');
  
  // Test without includeTest
  console.log('🔄 Step 2: GET /api/users?role=associate (without includeTest)...\n');
  
  const response1 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users?role=associate',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  
  console.log('Status:', response1.statusCode);
  const data1 = JSON.parse(response1.body);
  console.log('Associates returned:', Array.isArray(data1) ? data1.length : 0);
  
  if (Array.isArray(data1) && data1.length > 0) {
    console.log('\nFirst 5 associates:');
    data1.slice(0, 5).forEach((a, i) => {
      console.log(`  ${i+1}. ${a.firstName} ${a.lastName} (${a.username})`);
    });
  } else {
    console.log('❌ No associates returned!');
  }
  
  // Test WITH includeTest
  console.log('\n🔄 Step 3: GET /api/users?role=associate&includeTest=true...\n');
  
  const response2 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users?role=associate&includeTest=true',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  
  console.log('Status:', response2.statusCode);
  const data2 = JSON.parse(response2.body);
  console.log('Associates returned:', Array.isArray(data2) ? data2.length : 0);
  
  if (Array.isArray(data2) && data2.length > 0) {
    console.log('\nFirst 5 associates:');
    data2.slice(0, 5).forEach((a, i) => {
      console.log(`  ${i+1}. ${a.firstName} ${a.lastName} (${a.username})`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log('Without includeTest:', Array.isArray(data1) ? data1.length : 0, 'associates');
  console.log('With includeTest:', Array.isArray(data2) ? data2.length : 0, 'associates');
  console.log('='.repeat(60));
}

testAssociatesEndpoint().catch(err => {
  console.error('❌ Error:', err.message);
});
