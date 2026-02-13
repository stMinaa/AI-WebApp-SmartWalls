/**
 * Seed Test Associates
 * Creates sample associates/contractors for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

const testAssociates = [
  {
    username: 'branko_vodoinstalater',
    email: 'branko@aquafix.rs',
    password: 'password123',
    firstName: 'Branko',
    lastName: 'Petrović',
    mobile: '0641234567',
    role: 'associate',
    status: 'active',
    company: 'Aqua Fix'
  },
  {
    username: 'milan_elektricar',
    email: 'milan@voltservis.rs',
    password: 'password123',
    firstName: 'Milan',
    lastName: 'Nikolić',
    mobile: '0642345678',
    role: 'associate',
    status: 'active',
    company: 'Volt Servis'
  },
  {
    username: 'jovan_majstor',
    email: 'jovan@mikki.rs',
    password: 'password123',
    firstName: 'Jovan',
    lastName: 'Marković',
    mobile: '0643456789',
    role: 'associate',
    status: 'active',
    company: 'Mikki'
  },
  {
    username: 'nikola_serviser',
    email: 'nikola@termoservis.rs',
    password: 'password123',
    firstName: 'Nikola',
    lastName: 'Jovanović',
    mobile: '0644567890',
    role: 'associate',
    status: 'active',
    company: 'Termo Servis'
  },
  {
    username: 'marko_bravar',
    email: 'marko@metalwork.rs',
    password: 'password123',
    firstName: 'Marko',
    lastName: 'Đorđević',
    mobile: '0645678901',
    role: 'associate',
    status: 'pending',
    company: 'Metal Work'
  }
];

async function seedAssociates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📝 Creating test associates...');
    
    for (const assoc of testAssociates) {
      // Check if already exists
      const existing = await User.findOne({ username: assoc.username });
      if (existing) {
        console.log(`⚠️  ${assoc.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(assoc.password, 10);
      
      // Create associate
      const newAssoc = new User({
        ...assoc,
        password: hashedPassword
      });
      
      await newAssoc.save();
      console.log(`✅ Created: ${assoc.firstName} ${assoc.lastName} (${assoc.company}) - ${assoc.status}`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📊 Summary:');
    const totalAssociates = await User.countDocuments({ role: 'associate' });
    const activeAssociates = await User.countDocuments({ role: 'associate', status: 'active' });
    const pendingAssociates = await User.countDocuments({ role: 'associate', status: 'pending' });
    console.log(`   Total Associates: ${totalAssociates}`);
    console.log(`   Active: ${activeAssociates}`);
    console.log(`   Pending: ${pendingAssociates}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding associates:', error);
    process.exit(1);
  }
}

seedAssociates();
