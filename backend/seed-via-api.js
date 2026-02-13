// Seed via API (backend must be running)
async function seedViaAPI() {
  console.log('🌱 Seeding via API...\n');

  // Try different director accounts
  const directors = [
    { username: 'director1', password: 'Pass123!' },
    { username: 'director', password: 'Pass123!' },
    { username: 'admin', password: 'Pass123!' }
  ];

  let token = null;
  let directorName = null;

  // Try to login with each director account
  for (const creds of directors) {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user.role === 'director') {
          token = data.token;
          directorName = creds.username;
          console.log(`✅ Logged in as ${directorName} (director)\n`);
          break;
        }
      }
    } catch (err) {
      // Try next
    }
  }

  if (!token) {
    console.log('❌ No director account found. Available options:\n');
    console.log('1. Create a director account via Signup page');
    console.log('2. Or login to the app and run this in browser console:');
    console.log('   const token = localStorage.getItem("token");');
    console.log('   fetch("http://localhost:5000/api/test/seed-issues", {');
    console.log('     method: "POST",');
    console.log('     headers: { "Authorization": "Bearer " + token }');
    console.log('   }).then(r => r.json()).then(console.log);');
    return;
  }

  // Seed issues
  console.log('📝 Creating test issues...');
  try {
    const issuesRes = await fetch('http://localhost:5000/api/test/seed-issues', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (issuesRes.ok) {
      const data = await issuesRes.json();
      console.log(`✅ ${data.message}\n`);
    } else {
      const error = await issuesRes.json();
      console.log(`❌ ${error.message}\n`);
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}\n`);
  }

  // Seed notices
  console.log('📝 Creating test notices...');
  try {
    const noticesRes = await fetch('http://localhost:5000/api/test/seed-notices', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (noticesRes.ok) {
      const data = await noticesRes.json();
      console.log(`✅ ${data.message}\n`);
    } else {
      const error = await noticesRes.json();
      console.log(`❌ ${error.message}\n`);
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}\n`);
  }

  console.log('🎉 Done! Now login as tenant to see the data.');
}

seedViaAPI();
