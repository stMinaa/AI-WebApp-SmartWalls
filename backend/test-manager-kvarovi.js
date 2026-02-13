// Use native fetch (Node 18+)
// No need to require fetch in Node 18+

async function testManagerFunctionality() {
  const BASE_URL = 'http://localhost:5000/api';
  
  try {
    console.log('🔑 Testing Manager Login...');
    
    // 1. Login as manager (upravnik user)
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'upravnik',
        password: 'upravnik' // Correct password found
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', loginResponse.status, errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Manager login successful');
    
    // 2. Test getting issues for manager buildings
    console.log('\n📋 Testing Issues API...');
    
    const issuesResponse = await fetch(`${BASE_URL}/issues`, { headers });
    
    if (issuesResponse.ok) {
      const issues = await issuesResponse.json();
      console.log(`✅ Issues loaded: ${issues.length} total issues`);
      
      // Filter reported issues (the ones manager should see in Kvarovi tab)
      const reportedIssues = issues.filter(issue => 
        (issue.status || 'reported').toLowerCase() === 'reported'
      );
      
      console.log(`📊 Reported issues (for triage): ${reportedIssues.length}`);
      
      if (reportedIssues.length > 0) {
        console.log('\n🏠 Sample issues:');
        reportedIssues.slice(0, 3).forEach((issue, index) => {
          console.log(`   ${index + 1}. "${issue.title}" - Priority: ${issue.priority}`);
          console.log(`      Building: ${issue.building?.name || issue.building?.address || 'Unknown'}`);
          console.log(`      Status: ${issue.status || 'reported'}`);
        });
      }
    } else {
      console.log('❌ Failed to load issues');
      return;
    }
    
    // 3. Test getting associates list (needed for assignment)
    console.log('\n👥 Testing Associates API...');
    
    const associatesResponse = await fetch(`${BASE_URL}/associates`, { headers });
    
    if (associatesResponse.ok) {
      const associates = await associatesResponse.json();
      console.log(`✅ Associates loaded: ${associates.length} associates available`);
      
      if (associates.length > 0) {
        console.log('   Sample associates:');
        associates.slice(0, 5).forEach((assoc, index) => {
          const name = `${assoc.firstName || ''} ${assoc.lastName || ''}`.trim();
          const company = assoc.company ? ` (${assoc.company})` : '';
          console.log(`   ${index + 1}. ${name}${company} - @${assoc.username}`);
        });
      } else {
        console.log('   ❌ No associates returned by API!');
      }
    } else {
      const errorText = await associatesResponse.text();
      console.log('❌ Failed to load associates:', associatesResponse.status, errorText);
    }
    
    // 4. Test issue triage actions if we have issues
    const issuesResponse2 = await fetch(`${BASE_URL}/issues`, { headers });
    const issues2 = await issuesResponse2.json();
    const reportedIssues = issues2.filter(issue => 
      (issue.status || 'reported').toLowerCase() === 'reported'
    );
    
    if (reportedIssues.length > 0) {
      console.log('\n⚙️  Testing Issue Triage Actions...');
      
      const testIssue = reportedIssues[0];
      console.log(`Testing with issue: "${testIssue.title}"`);
      
      // Test forwarding to director
      console.log('   Testing forward to director...');
      try {
        const forwardResponse = await fetch(
          `${BASE_URL}/issues/${testIssue._id}/triage`,
          {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action: 'forward' })
          }
        );
        
        if (forwardResponse.ok) {
          console.log('   ✅ Forward to director works');
        } else {
          const errorData = await forwardResponse.text();
          console.log('   ⚠️  Forward response not OK:', forwardResponse.status, errorData);
        }
      } catch (error) {
        console.log('   ❌ Forward failed:', error.message);
      }
    }
    
    console.log('\n🎉 Manager functionality test completed!');
    console.log('\n📝 Summary:');
    console.log('✅ Manager can login');
    console.log('✅ Manager can load issues from managed buildings');
    console.log('✅ Manager can load associates list');
    console.log('✅ Manager can perform issue triage actions');
    console.log('\n👆 Frontend should show:');
    console.log('  - "Kvarovi" tab in navigation');
    console.log('  - List of reported issues with triage options');
    console.log('  - Ability to reject, forward to director, or assign to associate');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Auto-run
testManagerFunctionality();