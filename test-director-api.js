// Test script za Director funkcionalnosti
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRpcmVjdG9yIiwicm9sZSI6ImRpcmVjdG9yIiwiaWF0IjoxNjAwMDAwMDAwfQ.test'; // Placeholder token

async function testDirectorApis() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 TESTIRANJE DIRECTOR API-ja...\n');

  // Test 1: GET /api/buildings
  try {
    console.log('1️⃣ Testiram GET /api/buildings...');
    const res = await fetch(`${baseUrl}/api/buildings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Broj zgrada: ${Array.isArray(data) ? data.length : 'N/A'}`);
    console.log(`   ✅ OK\n`);
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}\n`);
  }

  // Test 2: GET /api/users?role=manager
  try {
    console.log('2️⃣ Testiram GET /api/users?role=manager...');
    const res = await fetch(`${baseUrl}/api/users?role=manager`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Broj upravnika: ${Array.isArray(data) ? data.length : 'N/A'}`);
    console.log(`   ✅ OK\n`);
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}\n`);
  }

  // Test 3: GET /api/users?role=associate
  try {
    console.log('3️⃣ Testiram GET /api/users?role=associate...');
    const res = await fetch(`${baseUrl}/api/users?role=associate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Broj saradnika: ${Array.isArray(data) ? data.length : 'N/A'}`);
    console.log(`   ✅ OK\n`);
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}\n`);
  }

  // Test 4: GET /api/issues
  try {
    console.log('4️⃣ Testiram GET /api/issues (director treba da ima pristup)...');
    const res = await fetch(`${baseUrl}/api/issues`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    if (res.status === 403) {
      console.log(`   ❌ PROBLEM: Director nema pristup!`);
      console.log(`   Message: ${data.message || data.error}\n`);
    } else {
      console.log(`   Broj kvarova: ${Array.isArray(data) ? data.length : 'N/A'}`);
      console.log(`   ✅ OK\n`);
    }
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}\n`);
  }

  // Test 5: GET /api/invoices/unpaid
  try {
    console.log('5️⃣ Testiram GET /api/invoices/unpaid...');
    const res = await fetch(`${baseUrl}/api/invoices/unpaid`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    if (data.data && Array.isArray(data.data)) {
      console.log(`   Broj grupa firmi: ${data.data.length}`);
      console.log(`   ✅ OK\n`);
    } else {
      console.log(`   ⚠️  Response format: ${JSON.stringify(data).substring(0, 100)}...\n`);
    }
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}\n`);
  }

  console.log('🏁 Testiranje završeno!\n');
}

// Ne možemo pokrenuti ovaj fajl jer nema validnog tokena
// Ali možemo da proverimo da li routes postoje
console.log('✅ Test file kreiran');
console.log('⚠️  Napomena: Treba pravi director token za testiranje');
console.log('💡 Alternativa: Logiraj se u frontend kao director i koristi njegov token');
