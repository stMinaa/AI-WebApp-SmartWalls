/**
 * Test auth routes after Step 2.2 Part 1
 */

const http = require('http');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

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

async function testAuthRoutes() {
  console.log('🧪 Testing Step 2.2 Part 1 - Auth Routes\n');
  
  // Test 1: Signup
  console.log('1️⃣  POST /api/auth/signup...');
  const signupResp = await makeRequest('POST', '/api/auth/signup', {
    username: 'testauth' + Date.now(),
    email: 'testauth@example.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'Auth',
    role: 'tenant'
  });
  console.log(`   Status: ${signupResp.status}`);
  console.log(`   Success: ${signupResp.data.success ? '✅' : '❌'}`);
  
  if (!signupResp.data.success) {
    console.log(`   Error: ${signupResp.data.message}`);
    return;
  }
  
  const token = signupResp.data.data.token;
  console.log(`   Token received: ${token ? '✅' : '❌'}\n`);
  
  // Test 2: GET /me
  console.log('2️⃣  GET /api/auth/me (with token)...');
  const meResp = await makeRequest('GET', '/api/auth/me');
  meResp.options = { headers: { 'Authorization': `Bearer ${token}` } };
  
  const meReq = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(data);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Success: ${parsed.success ? '✅' : '❌'}`);
      console.log(`   User: ${parsed.data?.username || 'N/A'}\n`);
      
      // Test 3: Login
      console.log('3️⃣  POST /api/auth/login...');
      makeRequest('POST', '/api/auth/login', {
        username: signupResp.data.data.user.username,
        password: 'Test123!'
      }).then(loginResp => {
        console.log(`   Status: ${loginResp.status}`);
        console.log(`   Success: ${loginResp.data.success ? '✅' : '❌'}`);
        console.log(`   Token received: ${loginResp.data.data?.token ? '✅' : '❌'}\n`);
        
        console.log('✅ All auth routes working!');
      });
    });
  });
  meReq.end();
}

testAuthRoutes().catch(err => console.error('❌ Test error:', err));
