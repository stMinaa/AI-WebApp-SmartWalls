const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function testApprovalEndpoint() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');
  
  // Get director credentials
  const director = await User.findOne({ username: 'direktor' });
  console.log('Director:', director ? director.username : 'NOT FOUND');
  
  // Get pending manager
  let pendingManager = await User.findOne({ role: 'manager', status: 'pending' });
  
  if (!pendingManager) {
    console.log('Creating test pending manager...');
    const hashedPassword = await bcrypt.hash('pass123', 10);
    pendingManager = await User.create({
      username: 'test_mgr_' + Date.now(),
      email: 'test_mgr_' + Date.now() + '@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Manager',
      role: 'manager',
      status: 'pending'
    });
  }
  
  console.log('\n📋 Pending Manager:');
  console.log('  ID:', pendingManager._id);
  console.log('  Username:', pendingManager.username);
  console.log('  Status:', pendingManager.status);
  
  // Now test the API with curl
  console.log('\n🔄 Testing via HTTP request...');
  console.log('Run this command in another terminal:');
  console.log(`curl -X PATCH "http://localhost:5000/api/users/${pendingManager._id}/approve" -H "Authorization: Bearer YOUR_TOKEN_HERE"`);
  
  console.log('\n📝 Or test directly in MongoDB:');
  
  // Test direct update
  const result = await User.findByIdAndUpdate(
    pendingManager._id,
    { status: 'active' },
    { new: true, runValidators: false }
  );
  
  console.log('✅ Direct update result:');
  console.log('  Status:', result.status);
  
  if (result.status === 'active') {
    console.log('\n✅✅✅ MongoDB UPDATE WORKS! ✅✅✅');
    console.log('Backend endpoint should also work now!');
  }
  
  // Reset to pending for next test
  await User.findByIdAndUpdate(pendingManager._id, { status: 'pending' });
  console.log('✅ Reset back to pending for frontend testing');
  
  await mongoose.disconnect();
  process.exit(0);
}

testApprovalEndpoint();
