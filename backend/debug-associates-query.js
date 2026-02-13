const mongoose = require('mongoose');
const User = require('./models/User');

async function debugAssociatesQuery() {
  try {
    await mongoose.connect("mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0");
    console.log('✅ Connected to MongoDB');

    // Test the updated query from API endpoint
    console.log('\n🔍 Testing the UPDATED query from API...');
    
    const associates = await User.find({
      role: 'associate',
      $or: [
        { status: 'active' },
        { status: { $exists: false } },  
        { status: null }
      ]
    }).select('_id username firstName lastName email company status');

    console.log(`📊 Query result: ${associates.length} associates`);
    
    if (associates.length > 0) {
      console.log('\n👥 First 5 associates:');
      associates.slice(0, 5).forEach((assoc, index) => {
        const name = `${assoc.firstName || ''} ${assoc.lastName || ''}`.trim();
        console.log(`   ${index + 1}. ${name} (@${assoc.username})`);
        console.log(`      Company: ${assoc.company || 'None'}`);
        console.log(`      ID: ${assoc._id}`);
        console.log(`      Status: ${assoc.status || 'undefined'}`); // This is critical
      });
        
      // Test if status field actually exists
      const firstAssoc = associates[0];
      console.log('\n🔬 Field analysis of first associate:');
      console.log('   Raw status value:', firstAssoc.status);
      console.log('   Status type:', typeof firstAssoc.status);
      console.log('   All fields:', Object.keys(firstAssoc.toObject()));
    } else {
      console.log('❌ No associates returned by query!');
      
      // Check what associates exist and their statuses
      const allAssociates = await User.find({ role: 'associate' }).select('username firstName lastName status');
      console.log(`\n🔬 Debugging - Total associates: ${allAssociates.length}`);
      
      if (allAssociates.length > 0) {
        console.log('\n📊 Status breakdown:');
        const statusCount = {};
        allAssociates.forEach(assoc => {
          const status = assoc.status || 'undefined';
          statusCount[status] = (statusCount[status] || 0) + 1;
        });
        
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`   ${status}: ${count}`);
        });
        
        console.log('\n👥 First 5 associates (any status):');
        allAssociates.slice(0, 5).forEach((assoc, index) => {
          const name = `${assoc.firstName || ''} ${assoc.lastName || ''}`.trim();
          console.log(`   ${index + 1}. ${name} (@${assoc.username}) - status: "${assoc.status}"`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

debugAssociatesQuery();