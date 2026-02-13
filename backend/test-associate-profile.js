const BASE_URL = 'http://localhost:5000';

async function testAssociateProfile() {
  try {
    console.log('🔄 Test associate profile update with mobile and company...\n');
    
    // Step 1: Login as associate
    console.log('Step 1: Login as testsaradnik...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testsaradnik', password: 'test123' })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Associate logged in');
    
    // Step 2: Get current profile
    console.log('\nStep 2: Get current profile...');
    const profileRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const profileData = await profileRes.json();
    
    console.log('Current profile:');
    console.log(`- Name: ${profileData.firstName} ${profileData.lastName}`);
    console.log(`- Mobile: ${profileData.mobile || 'Not set'}`);
    console.log(`- Company: ${profileData.company || 'Not set'}`);
    
    // Step 3: Update profile with mobile and company
    console.log('\nStep 3: Update profile with mobile and company...');
    const updateRes = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token 
      },
      body: JSON.stringify({ 
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        mobile: '+381 60 123 4567',
        company: 'MOJ SERVIS DOO'
      })
    });
    
    console.log(`Update status: ${updateRes.status}`);
    const updateData = await updateRes.json();
    
    if (updateRes.ok) {
      console.log('✅ Profile updated successfully');
      console.log('Updated profile:');
      console.log(`- Name: ${updateData.user.firstName} ${updateData.user.lastName}`);
      console.log(`- Mobile: ${updateData.user.mobile || 'Not set'}`);
      console.log(`- Company: ${updateData.user.company || 'Not set'}`);
      
      // Verify the update by fetching profile again
      console.log('\nStep 4: Verify update...');
      const verifyRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const verifyData = await verifyRes.json();
      
      if (verifyData.mobile === '+381 60 123 4567' && verifyData.company === 'MOJ SERVIS DOO') {
        console.log('🎉 SUCCESS! Mobile and company fields are working correctly');
      } else {
        console.log('❌ FAILED! Fields not saved correctly');
        console.log(`Expected mobile: +381 60 123 4567, Got: ${verifyData.mobile}`);
        console.log(`Expected company: MOJ SERVIS DOO, Got: ${verifyData.company}`);
      }
    } else {
      console.log('❌ Profile update failed:', updateData);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAssociateProfile();