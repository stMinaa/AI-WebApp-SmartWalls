const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = 'your_secret_key_here';

async function testApprove() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create director
    let director = await User.findOne({ role: 'director' });
    if (!director) {
      console.log('Creating director...');
      const hashedPassword = await bcrypt.hash('pass123', 10);
      director = await User.create({
        username: 'director1',
        email: 'director@example.com',
        password: hashedPassword,
        firstName: 'Director',
        lastName: 'One',
        role: 'director',
        status: 'active'
      });
      console.log('✅ Director created');
    }
    console.log('Director:', director.username);

    // Find pending manager
    let pendingManager = await User.findOne({ role: 'manager', status: 'pending' });
    
    if (!pendingManager) {
      console.log('No pending manager found, creating one...');
      const hashedPassword = await bcrypt.hash('pass123', 10);
      pendingManager = await User.create({
        username: 'test_manager_' + Date.now(),
        email: 'testmanager' + Date.now() + '@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Manager',
        role: 'manager',
        status: 'pending'
      });
      console.log('✅ Test manager created');
    }
    
    console.log('\n📋 Manager to approve:');
    console.log('  ID:', pendingManager._id);
    console.log('  Username:', pendingManager.username);
    console.log('  Status:', pendingManager.status);
    console.log('  Building:', pendingManager.building);
    console.log('  Apartment:', pendingManager.apartment);

    // Test approval
    console.log('\n🔄 Testing approval (using findByIdAndUpdate)...');
    
    const updated = await User.findByIdAndUpdate(
      pendingManager._id,
      { status: 'active' },
      { new: true, runValidators: false }
    );
    
    console.log('✅ Update successful!');
    
    // Verify
    console.log('\n✅ Verification:');
    console.log('  Status:', updated.status);
    
    if (updated.status === 'active') {
      console.log('\n✅✅✅ APPROVAL WORKS! ✅✅✅');
    } else {
      console.log('\n❌ APPROVAL FAILED - status still:', updated.status);
    }

  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('Error name:', err.name);
    console.error('Full error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testApprove();
