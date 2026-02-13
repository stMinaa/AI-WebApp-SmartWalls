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

async function testTwoUsers() {
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
  
  // Test User 1: Ana Jovanovic
  console.log('🔄 Step 2: Approve Ana Jovanovic (6980ed33050c16dd03b4afdc)...\n');
  
  const approve1 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/6980ed33050c16dd03b4afdc/approve',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });
  
  console.log('Status:', approve1.statusCode);
  console.log('Response:', approve1.body);
  
  if (approve1.statusCode === 200) {
    console.log('\n✅ Ana Jovanovic APPROVED!\n');
  } else {
    console.log('\n❌ Ana Jovanovic FAILED!\n');
  }
  
  // Test User 2: Mgr Test
  console.log('🔄 Step 3: Approve Mgr Test (6980f074050c16dd03b4b013)...\n');
  
  const approve2 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/6980f074050c16dd03b4b013/approve',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });
  
  console.log('Status:', approve2.statusCode);
  console.log('Response:', approve2.body);
  
  if (approve2.statusCode === 200) {
    console.log('\n✅ Mgr Test APPROVED!\n');
  } else {
    console.log('\n❌ Mgr Test FAILED!\n');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY:');
  console.log('Ana Jovanovic:', approve1.statusCode === 200 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Mgr Test:', approve2.statusCode === 200 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('='.repeat(50));
}

testTwoUsers().catch(err => {
  console.error('❌ Error:', err.message);
});
