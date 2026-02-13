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

async function testInvoicesEndpoint() {
  console.log('🔄 Step 1: Login...\n');
  
  const loginResponse = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'direktor', password: 'direktor' }));
  
  if (loginResponse.statusCode !== 200) {
    console.log('❌ Login failed!', loginResponse.body);
    return;
  }
  
  const token = JSON.parse(loginResponse.body).token;
  console.log('✅ Logged in!\n');
  
  console.log('🔄 Step 2: GET /api/invoices/unpaid...\n');
  
  const response = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/invoices/unpaid',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  
  console.log('Status:', response.statusCode);
  console.log('Response body:', response.body);
  
  if (response.statusCode === 401) {
    console.log('\n❌ UNAUTHORIZED! Problem with auth middleware');
  } else if (response.statusCode === 200) {
    console.log('\n✅ SUCCESS! Invoices endpoint works');    
    // Test pay endpoint
    const responseData = JSON.parse(response.body);
    if (responseData.data && responseData.data.length > 0 && responseData.data[0].invoices && responseData.data[0].invoices.length > 0) {
      const firstInvoice = responseData.data[0].invoices[0];
      
      console.log(`\\n🔄 Step 3: Test pay invoice ${firstInvoice._id} (${firstInvoice.amount} RSD)...\\n`);
      
      const payResponse = await httpRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/invoices/${firstInvoice._id}/pay`,
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      
      console.log('Pay Status:', payResponse.statusCode);
      console.log('Pay Response:', payResponse.body);
      
      if (payResponse.statusCode === 200) {
        console.log('\\n✅ SUCCESS! Pay endpoint works');
      } else {
        console.log('\\n❌ Pay endpoint failed');
      }
    }  } else {
    console.log('\n⚠️  Unexpected status:', response.statusCode);
  }
}

testInvoicesEndpoint().catch(err => {
  console.error('❌ Error:', err.message);
});