/**
 * Test Profile Update API
 * This script tests login and profile update to diagnose the issue
 */

async function testProfileUpdate() {
  console.log('🧪 Testing Profile Update API\n');

  try {
    // Step 1: Login as tenant1
    console.log('1️⃣ Testing login...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'tenant1', 
        password: 'Pass123!' 
      })
    });

    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status);
      const error = await loginRes.text();
      console.error('Error:', error);
      console.log('\n💡 Try these users:');
      console.log('   - tenant1 / Pass123!');
      console.log('   - tenant2 / Pass123!');
      console.log('   - manager1 / Pass123!');
      return;
    }

    const loginData = await loginRes.json();
    console.log('✅ Login successful!');
    console.log('   User:', loginData.user?.username, '(' + loginData.user?.role + ')');
    console.log('   Token:', loginData.token ? loginData.token.substring(0, 30) + '...' : 'MISSING');

    if (!loginData.token) {
      console.error('❌ No token received from login!');
      return;
    }

    const token = loginData.token;

    // Step 2: Get current user info
    console.log('\n2️⃣ Getting current user info...');
    const getMeRes = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    });

    if (!getMeRes.ok) {
      console.error('❌ GET /api/auth/me failed:', getMeRes.status);
      const error = await getMeRes.text();
      console.error('Error:', error);
    } else {
      const meData = await getMeRes.json();
      console.log('✅ Current user data:');
      console.log('   Username:', meData.username);
      console.log('   Name:', meData.firstName, meData.lastName);
      console.log('   Mobile:', meData.mobile || '(empty)');
    }

    // Step 3: Update profile
    console.log('\n3️⃣ Testing profile update (PATCH /api/auth/me)...');
    const updateData = {
      firstName: 'TestFirst',
      lastName: 'TestLast',
      mobile: '1234567890'
    };
    console.log('   Updating with:', updateData);

    const updateRes = await fetch('http://localhost:5000/api/auth/me', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(updateData)
    });

    console.log('   Response status:', updateRes.status);

    if (!updateRes.ok) {
      console.error('❌ Profile update failed!');
      const error = await updateRes.text();
      console.error('   Error:', error);
      
      if (updateRes.status === 403) {
        console.log('\n🔍 403 Forbidden means:');
        console.log('   - Token is invalid or expired');
        console.log('   - Token not being parsed correctly');
        console.log('   - authenticateToken middleware failing');
      }
    } else {
      const updateResult = await updateRes.json();
      console.log('✅ Profile updated successfully!');
      console.log('   Message:', updateResult.message);
      console.log('   Updated user:', updateResult.user?.firstName, updateResult.user?.lastName);
    }

    // Step 4: Verify update
    console.log('\n4️⃣ Verifying update...');
    const verifyRes = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    });

    if (verifyRes.ok) {
      const verifiedData = await verifyRes.json();
      console.log('✅ Verified user data:');
      console.log('   Name:', verifiedData.firstName, verifiedData.lastName);
      console.log('   Mobile:', verifiedData.mobile);
      
      if (verifiedData.firstName === updateData.firstName && 
          verifiedData.lastName === updateData.lastName) {
        console.log('\n🎉 SUCCESS! Profile update is working correctly!');
      } else {
        console.log('\n⚠️  Update did not persist correctly');
      }
    }

  } catch (err) {
    console.error('❌ Test error:', err.message);
    console.error(err.stack);
  }
}

// Run the test
testProfileUpdate();
