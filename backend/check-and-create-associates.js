const mongoose = require('mongoose');
const User = require('./models/User');

async function checkAssociates() {
  try {
    await mongoose.connect("mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0");
    console.log('✅ Connected to MongoDB');

    // Find all associates
    const associates = await User.find({ role: 'associate' });
    
    console.log(`📊 Found ${associates.length} associates in database`);
    
    if (associates.length === 0) {
      console.log('\n❌ No associates found! Creating test associates...');
      
      // Create test associates
      const testAssociates = [
        {
          username: 'serviser1',
          email: 'serviser1@email.com',
          password: '$2b$12$hashedpassword', // We'll hash this properly
          firstName: 'Marko',
          lastName: 'Petrović',
          role: 'associate',
          mobile: '+381 64 123 4567',
          company: 'Petrović Servis DOO'
        },
        {
          username: 'serviser2', 
          email: 'serviser2@email.com',
          password: '$2b$12$hashedpassword',
          firstName: 'Stefan',
          lastName: 'Nikolić',
          role: 'associate',
          mobile: '+381 63 987 6543', 
          company: 'Nikolić Tehnik'
        },
        {
          username: 'serviser3',
          email: 'serviser3@email.com', 
          password: '$2b$12$hashedpassword',
          firstName: 'Ana',
          lastName: 'Jovanović',
          role: 'associate',
          mobile: '+381 65 555 1234',
          company: 'Ana Fix Servis'
        }
      ];

      // Hash passwords properly
      const bcrypt = require('bcrypt');
      for (const assoc of testAssociates) {
        assoc.password = await bcrypt.hash('password', 12); // Use simple password
      }

      // Create associates
      await User.insertMany(testAssociates);
      console.log('✅ Created 3 test associates');
      
      const newCount = await User.countDocuments({ role: 'associate' });
      console.log(`📊 Total associates now: ${newCount}`);
      
    } else {
      console.log('\n👥 Existing associates:');
      associates.forEach((assoc, index) => {
        const name = `${assoc.firstName || ''} ${assoc.lastName || ''}`.trim();
        const company = assoc.company ? ` (${assoc.company})` : '';
        console.log(`   ${index + 1}. ${name}${company} - @${assoc.username}`);
        console.log(`      Email: ${assoc.email}`);
        console.log(`      Mobile: ${assoc.mobile || 'Not set'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

checkAssociates();