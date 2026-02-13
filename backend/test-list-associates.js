const BASE_URL = 'http://localhost:5000';

async function testListAssociates() {
  try {
    console.log('🔄 Step 1: Login as director...\n');
    
    // Login as director first
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'direktor',
        password: 'direktor'
      })
    });
    
    if (!loginRes.ok) {
      console.error('❌ Director login failed:', loginRes.status, loginRes.statusText);
      return;
    }
    
    const loginData = await loginRes.json();
    console.log('✅ Director logged in!');
    
    // Get associates list
    console.log('\n🔄 Step 2: Get associates list...\n');
    
    const associatesRes = await fetch(`${BASE_URL}/api/users?role=associate&includeTest=true`, {
      headers: { Authorization: 'Bearer ' + loginData.token }
    });
    
    if (!associatesRes.ok) {
      console.error('❌ Get associates failed:', associatesRes.status, associatesRes.statusText);
      return;
    }
    
    const associates = await associatesRes.json();
    console.log('Associates count:', associates.length);
    
    // Show first few associates
    console.log('First 5 associates:');
    associates.slice(0, 5).forEach((assoc, i) => {
      console.log(`${i+1}. Username: ${assoc.username}, Name: ${assoc.firstName} ${assoc.lastName}, Company: ${assoc.company || 'N/A'}`);
    });
    
    // Try to find one with a simple username pattern
    const simpleAssociate = associates.find(a => a.username && a.username.length < 20);
    if (simpleAssociate) {
      console.log(`\n✅ Found simple associate: ${simpleAssociate.username}`);
      console.log(`Name: ${simpleAssociate.firstName} ${simpleAssociate.lastName}`);
      console.log(`Company: ${simpleAssociate.company || 'N/A'}`);
    }
    
    console.log('\n✅ SUCCESS! Associates list retrieved');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testListAssociates();