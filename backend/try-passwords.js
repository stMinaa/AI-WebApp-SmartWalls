// Try multiple passwords for upravnik user

async function tryPasswords() {
  const BASE_URL = 'http://localhost:5000/api';
  const passwords = ['password', 'password123', 'upravnik', 'upravnik123', '123456', 'admin', 'test'];
  
  for (const password of passwords) {
    try {
      console.log(`🔑 Trying password: "${password}"`);
      
      const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'upravnik',
          password: password
        })
      });
      
      if (loginResponse.ok) {
        console.log(`✅ SUCCESS! Password is: "${password}"`);
        const data = await loginResponse.json();
        console.log(`User:`, data.user?.firstName, data.user?.lastName);
        return password;
      } else {
        const errorText = await loginResponse.text();
        console.log(`❌ Failed: ${loginResponse.status} ${errorText}`);
      }
      
    } catch (error) {
      console.log(`❌ Error with "${password}":`, error.message);
    }
  }
  
  console.log('❌ All passwords failed');
  return null;
}

tryPasswords();