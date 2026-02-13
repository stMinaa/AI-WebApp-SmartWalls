const BASE_URL = 'http://localhost:5000';

async function testInvoiceWithCompany() {
  try {
    console.log('🔄 Test invoice creation with updated company info...\n');
    
    // Step 1: Login as director to assign a job
    console.log('Step 1: Login as director...');
    const directorLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'direktor', password: 'direktor' })
    });
    
    const directorData = await directorLogin.json();
    const directorToken = directorData.token;
    console.log('✅ Director logged in');
    
    // Step 2: Get forwarded issue and assign to testsaradnik
    const issuesRes = await fetch(`${BASE_URL}/api/issues`, {
      headers: { Authorization: 'Bearer ' + directorToken }
    });
    const issues = await issuesRes.json();
    const forwardedIssue = issues.find(issue => issue.status === 'forwarded');
    
    if (!forwardedIssue) {
      console.log('❌ No forwarded issues found');
      return;
    }
    
    console.log(`Step 2: Assigning issue ${forwardedIssue._id}...`);
    await fetch(`${BASE_URL}/api/issues/${forwardedIssue._id}/assign`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + directorToken 
      },
      body: JSON.stringify({ 
        action: 'assign', 
        associateId: '6989003385cecdf3fabe2f4d' // testsaradnik ID
      })
    });
    console.log('✅ Issue assigned');
    
    // Step 3: Login as testsaradnik
    console.log('\nStep 3: Login as testsaradnik...');
    const associateLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testsaradnik', password: 'test123' })
    });
    
    const associateData = await associateLogin.json();
    const associateToken = associateData.token;
    console.log('✅ Associate logged in');
    
    // Step 4: Accept and complete the job
    console.log('\nStep 4: Accept job...');
    await fetch(`${BASE_URL}/api/issues/${forwardedIssue._id}/accept`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + associateToken 
      },
      body: JSON.stringify({ estimatedCost: 4500 })
    });
    console.log('✅ Job accepted');
    
    console.log('\nStep 5: Complete job...');
    await fetch(`${BASE_URL}/api/issues/${forwardedIssue._id}/complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + associateToken 
      },
      body: JSON.stringify({ 
        completionNotes: 'Test completion with company info.' 
      })
    });
    console.log('✅ Job completed');
    
    // Step 6: Check if invoice was created with company info
    console.log('\nStep 6: Check invoice with company info...');
    const invoicesRes = await fetch(`${BASE_URL}/api/invoices/unpaid`, {
      headers: { Authorization: 'Bearer ' + directorToken }
    });
    const invoicesData = await invoicesRes.json();
    
    // Find the new invoice
    const newInvoice = invoicesData.data
      .flatMap(group => group.invoices)
      .find(inv => inv.issue === forwardedIssue._id);
    
    if (newInvoice) {
      console.log('✅ Invoice found:');
      console.log(`- Company: ${newInvoice.company || 'N/A'}`);
      console.log(`- Associate: ${newInvoice.associateName}`);
      console.log(`- Amount: ${newInvoice.amount} RSD`);
      console.log(`- Title: ${newInvoice.title}`);
      
      if (newInvoice.company === 'MOJ SERVIS DOO') {
        console.log('\n🎉 SUCCESS! Invoice shows updated company name');
      } else {
        console.log('\n⚠️ Company name not updated in invoice');
      }
    } else {
      console.log('❌ Invoice not found');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testInvoiceWithCompany();