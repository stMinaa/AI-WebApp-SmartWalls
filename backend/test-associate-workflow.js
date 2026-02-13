const BASE_URL = 'http://localhost:5000';

async function testAssociateWorkflow() {
  try {
    console.log('🔄 Step 1: Login as associate...\n');
    
    // Login as associate
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testsaradnik',
        password: 'test123'
      })
    });
    
    if (!loginRes.ok) {
      console.error('❌ Associate login failed:', loginRes.status, loginRes.statusText);
      return;
    }
    
    const loginData = await loginRes.json();
    console.log('✅ Associate logged in!');
    
    // Get assigned jobs
    console.log('\n🔄 Step 2: Get assigned jobs...\n');
    
    const jobsRes = await fetch(`${BASE_URL}/api/associates/me/jobs`, {
      headers: { Authorization: 'Bearer ' + loginData.token }
    });
    
    if (!jobsRes.ok) {
      console.error('❌ Get jobs failed:', jobsRes.status, jobsRes.statusText);
      return;
    }
    
    const jobs = await jobsRes.json();
    console.log('Jobs response:', jobs);
    console.log('Jobs count:', jobs.length);
    
    if (jobs.length === 0) {
      console.log('⚠️ No jobs assigned to this associate');
      return;
    }
    
    // Find assigned job
    const assignedJob = jobs.find(job => job.status === 'assigned');
    if (!assignedJob) {
      console.log('⚠️ No "assigned" status jobs found');
      console.log('Available jobs statuses:', jobs.map(j => j.status));
      return;
    }
    
    console.log(`\n🔄 Step 3: Accept job ${assignedJob._id} with cost estimate...\n`);
    
    const acceptRes = await fetch(`${BASE_URL}/api/issues/${assignedJob._id}/accept`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + loginData.token 
      },
      body: JSON.stringify({ estimatedCost: 5000 })
    });
    
    console.log('Accept Status:', acceptRes.status);
    const acceptData = await acceptRes.json();
    console.log('Accept Response:', acceptData);
    
    if (!acceptRes.ok) {
      console.log('❌ Accept job failed');
      return;
    }
    
    console.log('\n🔄 Step 4: Complete the job...\n');
    
    const completeRes = await fetch(`${BASE_URL}/api/issues/${assignedJob._id}/complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + loginData.token 
      },
      body: JSON.stringify({ 
        completionNotes: 'Kvar je uspešno rešen. Zamenjen je defektni deo.' 
      })
    });
    
    console.log('Complete Status:', completeRes.status);
    const completeData = await completeRes.json();
    console.log('Complete Response:', completeData);
    
    if (completeRes.ok) {
      console.log('\n✅ SUCCESS! Associate workflow works');
      console.log('- Job accepted with cost estimate');
      console.log('- Job completed with notes');
      console.log('- Invoice should be created for director');
    } else {
      console.log('\n❌ Complete job failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAssociateWorkflow();