// Create director and seed data
async function createAndSeed() {
  console.log('🔧 Creating director account and seeding data...\n');

  // Step 1: Create director account
  console.log('1️⃣ Creating director account...');
  try {
    const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'director1',
        email: 'director@test.com',
        password: 'Pass123!',
        role: 'director',
        firstName: 'Test',
        lastName: 'Director'
      })
    });

    const signupData = await signupRes.json();
    
    if (!signupRes.ok) {
      if (signupData.message && signupData.message.includes('already exists')) {
        console.log('⚠️  Director account already exists, logging in instead...');
      } else {
        console.log('❌ Signup failed:', signupData.message);
        return;
      }
    } else {
      console.log('✅ Director account created!');
    }
  } catch (err) {
    console.log('❌ Signup error:', err.message);
    return;
  }

  // Step 2: Login to get token
  console.log('\n2️⃣ Logging in...');
  let token;
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'director1',
        password: 'Pass123!'
      })
    });

    if (!loginRes.ok) {
      const error = await loginRes.json();
      console.log('❌ Login failed:', error.message);
      return;
    }

    const loginData = await loginRes.json();
    token = loginData.token;
    console.log('✅ Logged in as director1');
  } catch (err) {
    console.log('❌ Login error:', err.message);
    return;
  }

  // Step 3: Seed issues
  console.log('\n3️⃣ Creating test issues...');
  try {
    const issuesRes = await fetch('http://localhost:5000/api/test/seed-issues', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const issuesData = await issuesRes.json();
    if (issuesRes.ok) {
      console.log(`✅ ${issuesData.message}`);
    } else {
      console.log(`❌ ${issuesData.message}`);
    }
  } catch (err) {
    console.log('❌ Seed issues error:', err.message);
  }

  // Step 4: Seed notices
  console.log('\n4️⃣ Creating test notices...');
  try {
    const noticesRes = await fetch('http://localhost:5000/api/test/seed-notices', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const noticesData = await noticesRes.json();
    if (noticesRes.ok) {
      console.log(`✅ ${noticesData.message}`);
    } else {
      console.log(`❌ ${noticesData.message}`);
    }
  } catch (err) {
    console.log('❌ Seed notices error:', err.message);
  }

  console.log('\n🎉 All done! Now login as tenant to see the data.');
}

createAndSeed();
