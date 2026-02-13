const BASE_URL = 'http://localhost:5000';

async function testPayEndpoint() {
  try {
    console.log('🔄 Step 1: Login...\n');
    
    // Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'direktor',
        password: 'direktor123'
      })
    });
    
    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status, loginRes.statusText);
      return;
    }
    
    const loginData = await loginRes.json();
    console.log('✅ Logged in!');
    
    // Get unpaid invoices to find an invoice to pay
    console.log('\n🔄 Step 2: Get unpaid invoices...\n');
    
    const invoicesRes = await fetch(`${BASE_URL}/api/invoices/unpaid`, {
      headers: { Authorization: 'Bearer ' + loginData.token }
    });
    
    if (!invoicesRes.ok) {
      console.error('❌ Get invoices failed:', invoicesRes.status, invoicesRes.statusText);
      return;
    }
    
    const invoicesData = await invoicesRes.json();
    console.log('✅ Got invoices!');
    
    if (invoicesData.data.length === 0 || invoicesData.data[0].invoices.length === 0) {
      console.log('⚠️ No invoices to test with');
      return;
    }
    
    // Get first invoice to pay
    const firstInvoice = invoicesData.data[0].invoices[0];
    console.log(`\n🔄 Step 3: Pay invoice ${firstInvoice._id} (${firstInvoice.amount} RSD)...\n`);
    
    const payRes = await fetch(`${BASE_URL}/api/invoices/${firstInvoice._id}/pay`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + loginData.token }
    });
    
    console.log('Status:', payRes.status);
    const payData = await payRes.json();
    console.log('Response body:', JSON.stringify(payData, null, 2));
    
    if (payRes.ok) {
      console.log('\n✅ SUCCESS! Pay endpoint works');
    } else {
      console.log('\n❌ FAILED! Pay endpoint error');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPayEndpoint();