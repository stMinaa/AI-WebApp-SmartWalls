const http = require('http');

// Test without auth first to see if endpoint is reachable
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users/693183abc7867a7b49a580a3/approve',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    // Using a fake token to test error handling
    'Authorization': 'Bearer test'
  }
};

console.log('🔄 Testing HTTP PATCH to:', `http://localhost:5000${options.path}`);

const req = http.request(options, (res) => {
  console.log('✅ Got response!');
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse body:');
    console.log(data);
    
    if (res.statusCode === 403 || res.statusCode === 401) {
      console.log('\n✅ Endpoint is reachable! (Got auth error as expected)');
      console.log('This means backend is running and listening on port 5000');
    } else if (res.statusCode === 200) {
      console.log('\n✅ APPROVE WORKED!');
    } else {
      console.log(`\n❓ Unexpected status: ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('Backend is NOT running on port 5000!');
});

req.end();
