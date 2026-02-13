/**
 * COMPREHENSIVE PROFILE UPDATE TEST
 * Tests login and profile update for ALL roles
 */

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProfileForUser(username, password, role) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${role.toUpperCase()}: ${username}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Login
    console.log('\n1️⃣ Logging in...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!loginRes.ok) {
      const error = await loginRes.json();
      console.error('❌ Login failed:', error.message);
      return false;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log('   Token:', token.substring(0, 30) + '...');

    // Step 2: Get current profile
    console.log('\n2️⃣ Getting current profile...');
    const getMeRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!getMeRes.ok) {
      const error = await getMeRes.json();
      console.error('❌ Get profile failed:', error.message);
      return false;
    }

    const currentProfile = await getMeRes.json();
    console.log('✅ Current profile:');
    console.log('   Name:', currentProfile.firstName, currentProfile.lastName);
    console.log('   Mobile:', currentProfile.mobile || '(empty)');

    // Step 3: Update profile
    console.log('\n3️⃣ Updating profile...');
    const newData = {
      firstName: 'Updated' + role,
      lastName: 'Test' + Date.now().toString().slice(-4),
      mobile: '0601234567'
    };
    console.log('   New data:', newData);

    const updateRes = await fetch('http://localhost:5000/api/auth/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newData)
    });

    console.log('   Response status:', updateRes.status);

    if (!updateRes.ok) {
      const error = await updateRes.json();
      console.error('❌ Update failed:', error.message);
      return false;
    }

    const updateResult = await updateRes.json();
    console.log('✅ Update successful!');
    console.log('   Message:', updateResult.message);

    // Step 4: Verify
    console.log('\n4️⃣ Verifying update...');
    const verifyRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const verifiedProfile = await verifyRes.json();
    const isCorrect = 
      verifiedProfile.firstName === newData.firstName &&
      verifiedProfile.lastName === newData.lastName &&
      verifiedProfile.mobile === newData.mobile;

    if (isCorrect) {
      console.log('✅ VERIFIED! Profile updated correctly:');
      console.log('   Name:', verifiedProfile.firstName, verifiedProfile.lastName);
      console.log('   Mobile:', verifiedProfile.mobile);
      return true;
    } else {
      console.error('❌ VERIFICATION FAILED!');
      console.log('   Expected:', newData);
      console.log('   Got:', {
        firstName: verifiedProfile.firstName,
        lastName: verifiedProfile.lastName,
        mobile: verifiedProfile.mobile
      });
      return false;
    }

  } catch (err) {
    console.error('❌ Test error:', err.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 COMPREHENSIVE PROFILE UPDATE TEST');
  console.log('Testing all user roles...\n');

  const users = [
    { username: 'tenant1', password: 'Pass123!', role: 'tenant' },
    { username: 'tenant2', password: 'Pass123!', role: 'tenant' },
    { username: 'manager1', password: 'Pass123!', role: 'manager' },
    { username: 'associate1', password: 'Pass123!', role: 'associate' },
    { username: 'director1', password: 'Pass123!', role: 'director' }
  ];

  const results = [];

  for (const user of users) {
    const success = await testProfileForUser(user.username, user.password, user.role);
    results.push({ ...user, success });
    await sleep(500); // Small delay between tests
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.role.padEnd(10)} - ${r.username}`);
  });

  console.log('\n' + `Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Profile update is working for all roles!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runAllTests();
