// SUPER minimal test - test just the basic endpoint

async function superMinimalTest() {
  try {
    console.log('🔧 SUPER minimal test...');
    
    // Skip login, just test console log in triage endpoint
    const response = await fetch('http://localhost:5000/api/issues/FAKE_ID/triage', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer FAKE_TOKEN'
      },
      body: JSON.stringify({
        action: 'forward'
      })
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
    
    // The point is just to see if our triage endpoint gets hit and logs something
    // We expect 401 Unauthorized but should see debug log
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

superMinimalTest();