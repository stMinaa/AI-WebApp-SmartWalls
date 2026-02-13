// Test manager triage assignment functionality

async function testManagerAssignment() {
  const BASE_URL = 'http://localhost:5000/api';
  
  try {
    console.log('🔑 Testing Manager Login...');
    
    // 1. Login as manager
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'upravnik',
        password: 'upravnik'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', loginResponse.status, errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Manager login successful');
    
    // 2. Get available issues
    console.log('\n📋 Getting reported issues...');
    const issuesResponse = await fetch(`${BASE_URL}/issues`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!issuesResponse.ok) {
      console.log('❌ Failed to get issues');
      return;
    }
    
    const issues = await issuesResponse.json();
    const reportedIssues = issues.filter(issue => 
      (issue.status || 'reported').toLowerCase() === 'reported'
    );
    
    console.log(`✅ Found ${reportedIssues.length} reported issues`);
    
    if (reportedIssues.length === 0) {
      console.log('❌ No reported issues for testing assignment');
      return;
    }
    
    const testIssue = reportedIssues[0];
    console.log(`📝 Testing with issue: "${testIssue.title}"`);
    
    // 3. Get associates list
    console.log('\n👥 Getting associates...');
    const associatesResponse = await fetch(`${BASE_URL}/associates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!associatesResponse.ok) {
      console.log('❌ Failed to get associates');
      return;
    }
    
    const associates = await associatesResponse.json();
    console.log(`✅ Found ${associates.length} associates`);
    
    if (associates.length === 0) {
      console.log('❌ No associates available for testing assignment');
      return;
    }
    
    const testAssociate = associates[0];
    const associateName = `${testAssociate.firstName || ''} ${testAssociate.lastName || ''}`.trim();
    console.log(`👤 Testing assignment to: ${associateName} (@${testAssociate.username})`);
    
    // 4. Test assignment
    console.log('\n🎯 Testing issue assignment...');
    const assignResponse = await fetch(`${BASE_URL}/issues/${testIssue._id}/triage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'assign',
        associateId: testAssociate.username  // This is what frontend sends
      })
    });
    
    console.log('   Response status:', assignResponse.status);
    
    if (assignResponse.ok) {
      const updatedIssue = await assignResponse.json();
      console.log('✅ Assignment successful!');
      console.log('   Updated issue status:', updatedIssue.status);
      console.log('   Assigned to:', updatedIssue.assignedTo?.firstName, updatedIssue.assignedTo?.lastName);
      
      // Verify the issue was assigned correctly
      if (updatedIssue.status === 'assigned' && updatedIssue.assignedTo) {
        console.log('🎉 Issue assignment working correctly!');
        console.log('   ✅ Status changed to "assigned"');
        console.log('   ✅ assignedTo field populated');
      } else {
        console.log('⚠️  Assignment partially successful but data inconsistent');
      }
      
    } else {
      const errorData = await assignResponse.json().catch(() => assignResponse.text());
      console.log('❌ Assignment failed:');
      console.log('   Status:', assignResponse.status);
      console.log('   Response:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testManagerAssignment();