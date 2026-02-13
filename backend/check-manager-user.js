const mongoose = require('mongoose');
const User = require('./models/User');

async function checkManagerUser() {
  try {
    await mongoose.connect("mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0");
    console.log('✅ Connected to MongoDB');

    // Find the upravnik user
    const manager = await User.findOne({ username: 'upravnik' });
    
    if (!manager) {
      console.log('❌ User "upravnik" not found');
      
      // List all users to see what exists
      const users = await User.find({}, 'username role firstName lastName');
      console.log('\n📋 Available users:');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.role}) - ${user.firstName} ${user.lastName}`);
      });
      
    } else {
      console.log(`✅ Found user: ${manager.firstName} ${manager.lastName}`);
      console.log(`   Username: ${manager.username}`);
      console.log(`   Email: ${manager.email}`);
      console.log(`   Role: ${manager.role}`);
      console.log(`   Password hash: ${manager.password ? 'Set' : 'Not set'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkManagerUser();