const mongoose = require('mongoose');
const User = require('./models/User');

async function fixAssociatesStatus() {
  try {
    await mongoose.connect("mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0");
    console.log('✅ Connected to MongoDB');

    // Check associates by status
    const allAssociates = await User.find({ role: 'associate' });
    console.log(`📊 Total associates: ${allAssociates.length}`);
    
    const statusBreakdown = {};
    allAssociates.forEach(assoc => {
      const status = assoc.status || 'pending';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });
    
    console.log('📊 Associates by status:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Get active associates (what API should return)
    const activeAssociates = await User.find({ 
      role: 'associate',
      status: 'active'
    }).select('username firstName lastName company');
    
    console.log(`\n✅ Active associates (API will return ${activeAssociates.length}):`);
    if (activeAssociates.length > 0) {
      activeAssociates.forEach((assoc, index) => {
        const name = `${assoc.firstName || ''} ${assoc.lastName || ''}`.trim();
        const company = assoc.company ? ` (${assoc.company})` : '';
        console.log(`   ${index + 1}. ${name}${company} - @${assoc.username}`);
      });
    } else {
      console.log('   ❌ No active associates found!');
      
      // Set first few associates to active for testing
      console.log('\n🔧 Setting first 5 associates to active status...');
      const firstFive = allAssociates.slice(0, 5);
      
      for (const assoc of firstFive) {
        await User.findByIdAndUpdate(assoc._id, { status: 'active' });
        const name = `${assoc.firstName || ''} ${assoc.lastName || ''}`.trim();
        console.log(`   ✅ Set ${name} (@${assoc.username}) to active`);
      }
      
      console.log(`\n🎉 Updated ${firstFive.length} associates to active status`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

fixAssociatesStatus();