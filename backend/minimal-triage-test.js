// Minimal test - just try to update issue without populate

async function minimalTest() {
  try {
    console.log('🔧 Minimal triage test (no populate)...');
    
    // Login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'upravnik',
        password: 'upravnik'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data ? loginData.data.token : loginData.token;
    console.log('✅ Login successful');
    console.log('📝 Token payload inspect:', JSON.stringify(loginData, null, 2));
    
    // Get first issue
    console.log('📝 Making issues request with token:', token.substring(0, 20) + '...');
    const issuesResponse = await fetch('http://localhost:5000/api/issues', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const issuesData = await issuesResponse.json();
    console.log('📝 Issues response:', issuesData);
    
    // Handle both array and object responses
    const issues = Array.isArray(issuesData) ? issuesData : (issuesData.data || []);
    const reportedIssues = issues.filter(i => (i.status || 'reported').toLowerCase() === 'reported');
    
    if (reportedIssues.length === 0) {
      console.log('❌ No reported issues');
      return;
    }
    
    const testIssue = reportedIssues[0];
    console.log(`📝 Using issue: ${testIssue.title}`);
    
    // Simple assignment test
    console.log('\n🎯 Testing triage assignment...');
    const response = await fetch(`http://localhost:5000/api/issues/${testIssue._id}/triage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'assign',
        associateId: 'assosiate'
      })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS!');
      console.log('Updated issue status:', result.status);
      console.log('Assigned to ID:', result.assignedTo);
    } else {
      const errorText = await response.text();
      console.log('❌ Failed:');
      console.log('Status:', response.status);
      console.log('Response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

minimalTest();