const http = require('http');

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testFullFlow() {
  console.log('🔄 Step 1: Login as director...\n');
  
  // Try to login with director account
  const loginResponse = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'direktor', password: 'direktor' }));
  
  console.log('Login response status:', loginResponse.statusCode);
  console.log('Login response body:', loginResponse.body);
  
  if (loginResponse.statusCode !== 200) {
    console.log('\n❌ Login failed! Try different password...');
    console.log('Try again with password: sifra123, direktor123, or 123456');
    return;
  }
  
  const loginData = JSON.parse(loginResponse.body);
  const token = loginData.token;
  console.log('✅ Logged in! Token:', token.substring(0, 30) + '...\n');
  
  console.log('🔄 Step 2: Approve pending manager...\n');
  
  const approveResponse = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/693183abc7867a7b49a580a3/approve',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });
  
  console.log('Approve response status:', approveResponse.statusCode);
  console.log('Approve response body:', approveResponse.body);
  
  if (approveResponse.statusCode === 200) {
    console.log('\n✅✅✅ APPROVAL WORKS PERFECTLY! ✅✅✅');
    console.log('Backend is working correctly!');
    console.log('Make sure frontend is connecting to the right backend!');
  } else {
    console.log('\n❌ Approval failed with status:', approveResponse.statusCode);
  }
}

testFullFlow().catch(err => {
  console.error('❌ Error:', err.message);
});
