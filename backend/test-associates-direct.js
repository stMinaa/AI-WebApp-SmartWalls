// Direct test of associates endpoint

async function testAssociatesEndpoint() {
  try {
    // First login
    console.log('🔑 Logging in as manager...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'upravnik',
        password: 'upravnik'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', loginResponse.status, errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('   User role:', loginData.user?.role);
    console.log('   User username:', loginData.user?.username);
    
    // Test associates endpoint
    console.log('\n📞 Calling associates endpoint...');
    const associatesResponse = await fetch('http://localhost:5000/api/associates', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Response status:', associatesResponse.status);
    console.log('   Response headers:', Object.fromEntries(associatesResponse.headers.entries()));
    
    if (associatesResponse.ok) {
      const data = await associatesResponse.json();
      console.log('✅ SUCCESS - Associates data received');
      console.log('   Count:', Array.isArray(data) ? data.length : 'Not an array');
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('\n👥 First 3 associates:');
        data.slice(0, 3).forEach((assoc, index) => {
          const name = `${assoc.firstName || ''} ${assoc.lastName || ''}`.trim();
          console.log(`   ${index + 1}. ${name} (@${assoc.username})`);
          console.log(`      Company: ${assoc.company || 'None'}`);
        });
      } else {
        console.log('❌ No associates in response');
      }
    } else {
      const errorText = await associatesResponse.text();
      console.log('❌ Associates endpoint failed');
      console.log('   Status:', associatesResponse.status);
      console.log('   Response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAssociatesEndpoint();