const BASE_URL = 'http://localhost:5000';

async function testFullWorkflow() {
  try {
    console.log('🔄 Full workflow test: Create invoice when associate completes job\n');
    
    // Step 1: Login as director
    console.log('Step 1: Login as director...');
    const directorLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'direktor', password: 'direktor' })
    });
    
    const directorData = await directorLogin.json();
    const directorToken = directorData.token;
    console.log('✅ Director logged in');
    
    // Step 2: Check current invoices count
    console.log('\nStep 2: Check current invoices...');
    const invoicesBeforeRes = await fetch(`${BASE_URL}/api/invoices/unpaid`, {
      headers: { Authorization: 'Bearer ' + directorToken }
    });
    const invoicesBefore = await invoicesBeforeRes.json();
    const totalInvoicesBefore = invoicesBefore.data.reduce((sum, group) => sum + group.invoices.length, 0);
    console.log(`✅ Current invoices count: ${totalInvoicesBefore}`);
    
    // Step 3: Get a forwarded issue to assign
    console.log('\nStep 3: Get issues...');
    const issuesRes = await fetch(`${BASE_URL}/api/issues`, {
      headers: { Authorization: 'Bearer ' + directorToken }
    });
    const issues = await issuesRes.json();
    const forwardedIssue = issues.find(issue => issue.status === 'forwarded');
    
    if (!forwardedIssue) {
      console.log('❌ No forwarded issues found to assign');
      return;
    }
    
    console.log(`✅ Found forwarded issue: ${forwardedIssue._id}`);
    
    // Step 4: Assign issue to testsaradnik
    console.log('\nStep 4: Assign issue to testsaradnik...');
    const assignRes = await fetch(`${BASE_URL}/api/issues/${forwardedIssue._id}/assign`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + directorToken 
      },
      body: JSON.stringify({ 
        action: 'assign', 
        associateId: '6989003385cecdf3fabe2f4d' // testsaradnik ID from logs
      })
    });
    
    if (!assignRes.ok) {
      console.log('❌ Failed to assign issue');
      return;
    }
    console.log('✅ Issue assigned to testsaradnik');
    
    // Step 5: Login as testsaradnik
    console.log('\nStep 5: Login as testsaradnik...');
    const associateLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testsaradnik', password: 'test123' })
    });
    
    const associateData = await associateLogin.json();
    const associateToken = associateData.token;
    console.log('✅ Associate logged in');
    
    // Step 6: Accept the job
    console.log('\nStep 6: Accept job with cost estimate...');
    const acceptRes = await fetch(`${BASE_URL}/api/issues/${forwardedIssue._id}/accept`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + associateToken 
      },
      body: JSON.stringify({ estimatedCost: 3500 })
    });
    
    if (!acceptRes.ok) {
      console.log('❌ Failed to accept job');
      return;
    }
    console.log('✅ Job accepted with cost 3500 RSD');
    
    // Step 7: Complete the job
    console.log('\nStep 7: Complete the job...');
    const completeRes = await fetch(`${BASE_URL}/api/issues/${forwardedIssue._id}/complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + associateToken 
      },
      body: JSON.stringify({ 
        completionNotes: 'Test completion - kvar je rešen uspešno.' 
      })
    });
    
    console.log(`Complete status: ${completeRes.status}`);
    const completeData = await completeRes.json();
    
    if (!completeRes.ok) {
      console.log('❌ Failed to complete job:', completeData);
      return;
    }
    console.log('✅ Job completed successfully');
    
    // Step 8: Check invoices again (should have +1)
    console.log('\nStep 8: Check invoices after completion...');
    const invoicesAfterRes = await fetch(`${BASE_URL}/api/invoices/unpaid`, {
      headers: { Authorization: 'Bearer ' + directorToken }
    });
    const invoicesAfter = await invoicesAfterRes.json();
    const totalInvoicesAfter = invoicesAfter.data.reduce((sum, group) => sum + group.invoices.length, 0);
    
    console.log(`Invoices before: ${totalInvoicesBefore}`);
    console.log(`Invoices after: ${totalInvoicesAfter}`);
    
    if (totalInvoicesAfter > totalInvoicesBefore) {
      console.log('\n🎉 SUCCESS! Invoice was created when associate completed the job');
      
      // Show the new invoice
      const newInvoices = [];
      invoicesAfter.data.forEach(group => {
        group.invoices.forEach(inv => {
          if (inv.issue === forwardedIssue._id) {
            newInvoices.push(inv);
          }
        });
      });
      
      if (newInvoices.length > 0) {
        const newInvoice = newInvoices[0];
        console.log(`New invoice details:`);
        console.log(`- Amount: ${newInvoice.amount} RSD`);
        console.log(`- Company: ${newInvoice.company || 'N/A'}`);
        console.log(`- Associate: ${newInvoice.associateName}`);
        console.log(`- Title: ${newInvoice.title}`);
      }
    } else {
      console.log('\n❌ FAILED! No new invoice was created');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFullWorkflow();