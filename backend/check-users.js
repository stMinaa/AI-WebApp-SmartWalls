// Check what users exist
async function checkUsers() {
  console.log('Testing logins...\n');
  
  const testUsers = [
    { username: 'director1', password: 'Pass123!' },
    { username: 'tenant1', password: 'Pass123!' },
    { username: 'manager1', password: 'Pass123!' }
  ];

  for (const creds of testUsers) {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ ${creds.username} - ${data.user.role} - EXISTS`);
      } else {
        const error = await res.json();
        console.log(`❌ ${creds.username} - ${error.message}`);
      }
    } catch (err) {
      console.log(`❌ ${creds.username} - ${err.message}`);
    }
  }
}

checkUsers();
