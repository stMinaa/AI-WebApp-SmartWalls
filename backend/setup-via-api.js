/**
 * Create test data via backend API (works with MongoDB Atlas)
 * Make sure backend is running first!
 */

async function createTestData() {
  console.log('🔧 Creating test data via backend API...\n');

  const API_URL = 'http://localhost:5000';

  try {
    // Step 1: Create tenant account
    console.log('1️⃣ Creating tenant account...');
    let token;
    try {
      const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'tenant1',
          email: 'tenant1@test.com',
          password: 'Pass123!',
          role: 'tenant',
          firstName: 'Petar',
          lastName: 'Petrović'
        })
      });

      const signupData = await signupRes.json();
      if (signupRes.ok) {
        token = signupData.token;
        console.log('✅ Tenant account created: tenant1');
      } else if (signupData.message && signupData.message.includes('already exists')) {
        console.log('⚠️  Tenant already exists, logging in...');
        // Login instead
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'tenant1', password: 'Pass123!' })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          token = loginData.token;
          console.log('✅ Logged in as tenant1');
        } else {
          console.error('❌ Login failed:', loginData.message);
          return;
        }
      } else {
        console.error('❌ Signup failed:', signupData.message);
        return;
      }
    } catch (err) {
      console.error('❌ Error creating tenant:', err.message);
      return;
    }

    // Step 2: Create director account (for building creation)
    console.log('\n2️⃣ Creating director account...');
    let directorToken;
    try {
      const dirSignupRes = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'director1',
          email: 'director@test.com',
          password: 'Pass123!',
          role: 'director',
          firstName: 'Milan',
          lastName: 'Direktor'
        })
      });

      const dirSignupData = await dirSignupRes.json();
      if (dirSignupRes.ok) {
        directorToken = dirSignupData.token;
        console.log('✅ Director account created: director1');
      } else if (dirSignupData.message && dirSignupData.message.includes('already exists')) {
        console.log('⚠️  Director already exists, logging in...');
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'director1', password: 'Pass123!' })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          directorToken = loginData.token;
          console.log('✅ Logged in as director1');
        }
      }
    } catch (err) {
      console.error('⚠️  Director creation failed:', err.message);
    }

    // Step 3: Seed issues (using director token)
    if (directorToken) {
      console.log('\n3️⃣ Creating test issues...');
      try {
        const issuesRes = await fetch(`${API_URL}/api/test/seed-issues`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${directorToken}` }
        });

        const issuesData = await issuesRes.json();
        if (issuesRes.ok) {
          console.log(`✅ ${issuesData.message}`);
        } else {
          console.log(`⚠️  ${issuesData.message}`);
        }
      } catch (err) {
        console.log('⚠️  Could not create issues:', err.message);
      }

      // Step 4: Seed notices
      console.log('\n4️⃣ Creating test notices...');
      try {
        const noticesRes = await fetch(`${API_URL}/api/test/seed-notices`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${directorToken}` }
        });

        const noticesData = await noticesRes.json();
        if (noticesRes.ok) {
          console.log(`✅ ${noticesData.message}`);
        } else {
          console.log(`⚠️  ${noticesData.message}`);
        }
      } catch (err) {
        console.log('⚠️  Could not create notices:', err.message);
      }
    }

    console.log('\n🎉 Setup complete!\n');
    console.log('📝 Login credentials:');
    console.log('   Tenant - username: tenant1, password: Pass123!');
    console.log('   Director - username: director1, password: Pass123!');
    console.log('\n✅ Open http://localhost:3000 and login to see the data!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Check if backend is running
fetch('http://localhost:5000/api/test')
  .then(() => {
    console.log('✅ Backend is running\n');
    createTestData();
  })
  .catch(() => {
    console.error('❌ Backend is not running!');
    console.log('\nPlease start the backend first:');
    console.log('  cd backend');
    console.log('  node index.js');
  });
