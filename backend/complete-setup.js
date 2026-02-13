/**
 * Complete setup: Creates director, building, apartments, tenant, assigns tenant, seeds data
 */

const API_URL = 'http://localhost:5000';

async function completeSetup() {
  console.log('🏗️  COMPLETE SETUP - Creating full test environment\n');

  try {
    // Step 1: Create/login director
    console.log('1️⃣ Setting up director account...');
    let directorToken;
    const dirSignup = await fetch(`${API_URL}/api/auth/signup`, {
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
    
    const dirData = await dirSignup.json();
    if (dirSignup.ok) {
      directorToken = dirData.token;
      console.log('✅ Director created');
    } else if (dirData.message?.includes('exists')) {
      const dirLogin = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'director1', password: 'Pass123!' })
      });
      const loginData = await dirLogin.json();
      directorToken = loginData.token;
      console.log('✅ Director logged in');
    }

    // Step 2: Create building
    console.log('\n2️⃣ Creating test building...');
    const buildingRes = await fetch(`${API_URL}/api/buildings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${directorToken}`
      },
      body: JSON.stringify({
        name: 'Test Zgrada 1',
        address: 'Bulevar Kralja Aleksandra 73',
        city: 'Beograd'
      })
    });
    
    const building = await buildingRes.json();
    console.log('✅ Building created:', building.name, '(ID:', building._id, ')');
    const buildingId = building._id;

    // Step 3: Create apartments
    console.log('\n3️⃣ Creating apartments...');
    const apartmentRes = await fetch(`${API_URL}/api/buildings/${buildingId}/apartments/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${directorToken}`
      },
      body: JSON.stringify({
        floors: 5,
        unitsPerFloor: [4, 4, 4, 4, 4],
        startNumber: 1
      })
    });
    
    const apartments = await apartmentRes.json();
    console.log('✅ Created', apartments.created || 20, 'apartments');

    // Step 4: Get apartment ID for tenant (apartment #1)
    const apartmentsListRes = await fetch(`${API_URL}/api/buildings/${buildingId}/apartments`, {
      headers: { 'Authorization': `Bearer ${directorToken}` }
    });
    const apartmentsList = await apartmentsListRes.json();
    const apartment1 = apartmentsList.find(a => a.unitNumber === 1);
    console.log('✅ Found apartment #1 (ID:', apartment1._id, ')');

    // Step 5: Create/login tenant
    console.log('\n4️⃣ Setting up tenant account...');
    let tenantToken, tenantId;
    const tenantSignup = await fetch(`${API_URL}/api/auth/signup`, {
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
    
    const tenantData = await tenantSignup.json();
    if (tenantSignup.ok) {
      tenantToken = tenantData.token;
      tenantId = tenantData.user._id;
      console.log('✅ Tenant created:', tenantData.user.username);
    } else if (tenantData.message?.includes('exists')) {
      const tenantLogin = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'tenant1', password: 'Pass123!' })
      });
      const loginData = await tenantLogin.json();
      tenantToken = loginData.token;
      tenantId = loginData.user._id;
      console.log('✅ Tenant logged in:', loginData.user.username);
    }

    // Step 6: Assign tenant to building and apartment
    console.log('\n5️⃣ Assigning tenant to building and apartment...');
    const assignRes = await fetch(`${API_URL}/api/buildings/${buildingId}/tenants/pending/${tenantId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${directorToken}`
      },
      body: JSON.stringify({
        apartmentId: apartment1._id
      })
    });
    
    if (assignRes.ok) {
      console.log('✅ Tenant assigned to apartment #1');
    } else {
      // Try alternative: update user directly
      console.log('⚠️  Assignment endpoint failed, updating user directly...');
      const updateRes = await fetch(`${API_URL}/api/users/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${directorToken}`
        },
        body: JSON.stringify({
          building: buildingId,
          apartment: apartment1._id,
          debt: 5000
        })
      });
      if (updateRes.ok) {
        console.log('✅ Tenant updated with building and apartment');
      }
    }

    // Step 7: Seed test issues
    console.log('\n6️⃣ Creating test issues...');
    const issuesRes = await fetch(`${API_URL}/api/test/seed-issues`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${directorToken}` }
    });
    const issuesData = await issuesRes.json();
    console.log('✅', issuesData.message || 'Test issues created');

    // Step 8: Seed test notices
    console.log('\n7️⃣ Creating test notices...');
    const noticesRes = await fetch(`${API_URL}/api/test/seed-notices`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${directorToken}` }
    });
    const noticesData = await noticesRes.json();
    console.log('✅', noticesData.message || 'Test notices created');

    console.log('\n🎉 COMPLETE SETUP FINISHED!\n');
    console.log('📝 Login credentials:');
    console.log('   👤 Tenant: tenant1 / Pass123!');
    console.log('   🏢 Director: director1 / Pass123!');
    console.log('\n🏗️  Building:', building.name);
    console.log('🏠 Apartment: #1');
    console.log('📊 Issues: 8 test issues created');
    console.log('📋 Notices: 7 test notices created');
    console.log('\n✅ Open http://localhost:3000 and login as tenant1!');

  } catch (err) {
    console.error('\n❌ Error during setup:', err.message);
    console.error(err.stack);
  }
}

// Check backend and run
fetch(`${API_URL}/api/test`)
  .then(() => {
    console.log('✅ Backend is running\n');
    completeSetup();
  })
  .catch(() => {
    console.error('❌ Backend is not running!');
    console.log('\nStart backend first:');
    console.log('  cd backend');
    console.log('  node index.js');
  });
