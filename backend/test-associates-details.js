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

async function testAssociatesWithDetails() {
  console.log('🔄 Step 1: Login...\n');
  
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
  
  console.log('🔄 Step 2: GET associates with includeTest=true...\n');
  
  const response = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users?role=associate&includeTest=true',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  
  console.log('Status:', response.statusCode);
  const data = JSON.parse(response.body);
  
  if (Array.isArray(data) && data.length > 0) {
    console.log('\n📋 First 5 associates with details:\n');
    data.slice(0, 5).forEach((a, i) => {
      console.log(`${i+1}. ${a.firstName} ${a.lastName}`);
      console.log(`   Company: ${a.company || 'NOT SET'}`);
      console.log(`   Mobile: ${a.mobile || 'NOT SET'}`);
      console.log(`   Email: ${a.email}`);
      console.log(`   Status: ${a.status}`);
      console.log('');
    });
    
    console.log('✅ Total associates:', data.length);
  } else {
    console.log('❌ No associates returned!');
  }
}

testAssociatesWithDetails().catch(err => {
  console.error('❌ Error:', err.message);
});
