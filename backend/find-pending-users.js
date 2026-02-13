const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function findUsers() {
  await mongoose.connect(MONGO_URI);
  
  const users = await User.find({
    $or: [
      { email: 'mgr20260202194401@test.com' },
      { email: 'upravnik@zgrada.rs' },
      { firstName: 'Mgr', lastName: 'Test' },
      { firstName: 'Ana', lastName: 'Jovanovic' }
    ]
  }).select('_id username email firstName lastName role status');
  
  console.log('\n📋 Found users:');
  users.forEach(u => {
    console.log(`\n  ID: ${u._id}`);
    console.log(`  Name: ${u.firstName} ${u.lastName}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Username: ${u.username}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Status: ${u.status}`);
  });
  
  if (users.length === 0) {
    console.log('\n❌ No users found with those criteria');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

findUsers();
