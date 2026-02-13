/**
 * QUICK SEED - Test Issues & Notices
 * Run: node quick-seed.js
 */

async function quickSeed() {
  console.log('🌱 Quick seeding test data...\n');

  try {
    // Login as director
    console.log('Logging in as director1...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'director1', password: 'Pass123!' })
    });

    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status);
      const error = await loginRes.text();
      console.error('Error:', error);
      console.log('\n💡 Make sure director1 user exists. Try creating it first:');
      console.log('   POST http://localhost:5000/api/auth/signup');
      console.log('   { username: "director1", email: "director@test.com", password: "Pass123!", role: "director" }');
      return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Logged in as director\n');

    // Seed issues
    console.log('📝 Creating test issues...');
    const issuesRes = await fetch('http://localhost:5000/api/test/seed-issues', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });

    if (!issuesRes.ok) {
      console.error('❌ Seed issues failed:', issuesRes.status);
      const error = await issuesRes.text();
      console.error('Error:', error);
    } else {
      const issues = await issuesRes.json();
      console.log('✅', issues.message, '\n');
    }

    // Seed notices
    console.log('📝 Creating test notices...');
    const noticesRes = await fetch('http://localhost:5000/api/test/seed-notices', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });

    if (!noticesRes.ok) {
      console.error('❌ Seed notices failed:', noticesRes.status);
      const error = await noticesRes.text();
      console.error('Error:', error);
    } else {
      const notices = await noticesRes.json();
      console.log('✅', notices.message, '\n');
    }

    console.log('🎉 Done! Login as tenant1 to test.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

quickSeed();
