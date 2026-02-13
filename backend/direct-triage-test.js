// Simple direct test of the triage endpoint

async function directTest() {
  try {
    console.log('🔧 Direct triage test...');
    
    // Test specific issue ID and associate - use actual data
    const issueId = '69890c28d75c9ab082b03cb2'; // Get from previous test
    const associateUsername = 'assosiate'; // Get from associates list
    
    const response = await fetch(`http://localhost:5000/api/issues/${issueId}/triage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVwcmF2bmlrIiwiZW1haWwiOiJ1cHJhdm5pa0BlbWFpbC5jb20iLCJpYXQiOjE3Mzg5Njk2NzIsImV4cCI6MTczOTA1NjA3Mn0.8XeJY-hNU_GRaaj1dtNY6O0SckJRULMNSv9oOS1iSjM'
      },
      body: JSON.stringify({
        action: 'assign',
        associateId: associateUsername
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Success!');
    } else {
      console.log('❌ Failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Get fresh token first
async function getFreshToken() {
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'upravnik',
      password: 'upravnik'
    })
  });
  
  if (loginResponse.ok) {
    const data = await loginResponse.json();
    return data.token;
  } else {
    throw new Error('Login failed');
  }
}

(async () => {
  try {
    console.log('🔑 Getting fresh token...');
    const token = await getFreshToken();
    console.log('✅ Got token:', token.substring(0, 20) + '...');
    
    // Get fresh issue ID
    console.log('\n📋 Getting issue ID...');
    const issuesResponse = await fetch('http://localhost:5000/api/issues', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (issuesResponse.ok) {
      const issues = await issuesResponse.json();
      const reportedIssues = issues.filter(i => (i.status || 'reported').toLowerCase() === 'reported');
      if (reportedIssues.length > 0) {
        const testIssue = reportedIssues[0];
        console.log('✅ Using issue:', testIssue._id, '-', testIssue.title);
        
        // Now test assignment
        console.log('\n🎯 Testing assignment...');
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
        
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);
        
      } else {
        console.log('❌ No reported issues found');
      }
    } else {
      console.log('❌ Failed to get issues');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();