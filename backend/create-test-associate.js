const BASE_URL = 'http://localhost:5000';

async function createTestAssociate() {
  try {
    console.log('🔄 Step 1: Create test associate...\n');
    
    // Create associate via signup
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testsaradnik',
        password: 'test123',
        firstName: 'Test',
        lastName: 'Saradnik',
        email: 'testsaradnik@test.com',
        role: 'associate',
        mobile: '+381 60 123 4567',
        company: 'TEST SERVIS DOO'
      })
    });
    
    if (!signupRes.ok) {
      console.error('❌ Signup failed:', signupRes.status, signupRes.statusText);
      const errorData = await signupRes.json().catch(() => ({}));
      console.error('Error details:', errorData);
      return;
    }
    
    const signupData = await signupRes.json();
    console.log('✅ Associate created:', signupData.message);
    
    // Now approve the associate (login as director first)
    console.log('\n🔄 Step 2: Login as director to approve associate...\n');
    
    const directorLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'direktor',
        password: 'direktor'
      })
    });
    
    const directorData = await directorLoginRes.json();
    console.log('✅ Director logged in!');
    
    // Get user ID to approve
    const usersRes = await fetch(`${BASE_URL}/api/users?role=associate`, {
      headers: { Authorization: 'Bearer ' + directorData.token }
    });
    
    const users = await usersRes.json();
    const testUser = users.find(u => u.username === 'testsaradnik');
    
    if (!testUser) {
      console.error('❌ Test associate not found in users list');
      return;
    }
    
    console.log(`Found test user: ${testUser._id}, Status: ${testUser.status}`);
    
    if (testUser.status === 'pending') {
      console.log('🔄 Step 3: Approving associate...\n');
      
      const approveRes = await fetch(`${BASE_URL}/api/users/${testUser._id}/approve`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + directorData.token 
        },
        body: JSON.stringify({ status: 'active' })
      });
      
      if (approveRes.ok) {
        console.log('✅ Associate approved!');
      } else {
        console.error('❌ Approval failed');
      }
    }
    
    // Test login
    console.log('\n🔄 Step 4: Test associate login...\n');
    
    const testLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testsaradnik',
        password: 'test123'
      })
    });
    
    if (testLoginRes.ok) {
      const testLoginData = await testLoginRes.json();
      console.log('✅ Associate login successful!');
      console.log('Token length:', testLoginData.token?.length);
      console.log('User role:', testLoginData.user?.role);
    } else {
      console.error('❌ Associate login failed:', testLoginRes.status);
      const errorData = await testLoginRes.json().catch(() => ({}));
      console.error('Login error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

createTestAssociate();