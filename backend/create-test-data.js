/**
 * Create test data directly in MongoDB
 * Run: node create-test-data.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Building = require('./models/Building');
const Apartment = require('./models/Apartment');
const Issue = require('./models/Issue');
const Notice = require('./models/Notice');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/housing-management';

async function createTestData() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create building
    console.log('🏢 Creating test building...');
    let building = await Building.findOne({ name: 'Test Zgrada' });
    if (!building) {
      building = await Building.create({
        name: 'Test Zgrada',
        address: 'Kneza Miloša 10, Beograd',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'
      });
      console.log('✅ Building created:', building.name);
    } else {
      console.log('⚠️  Building already exists');
    }

    // Create apartments
    console.log('\n🚪 Creating test apartments...');
    let apartment1 = await Apartment.findOne({ building: building._id, number: '101' });
    if (!apartment1) {
      apartment1 = await Apartment.create({
        building: building._id,
        number: '101',
        floor: 1,
        size: 65,
        rooms: 2
      });
      console.log('✅ Apartment 101 created');
    }

    let apartment2 = await Apartment.findOne({ building: building._id, number: '102' });
    if (!apartment2) {
      apartment2 = await Apartment.create({
        building: building._id,
        number: '102',
        floor: 1,
        size: 75,
        rooms: 3
      });
      console.log('✅ Apartment 102 created');
    }

    // Create tenant
    console.log('\n👤 Creating test tenant...');
    let tenant = await User.findOne({ username: 'tenant1' });
    if (!tenant) {
      const hashedPassword = await bcrypt.hash('Pass123!', 10);
      tenant = await User.create({
        username: 'tenant1',
        email: 'tenant1@test.com',
        password: hashedPassword,
        firstName: 'Petar',
        lastName: 'Petrović',
        role: 'tenant',
        status: 'active',
        building: building._id,
        apartment: apartment1._id,
        debt: 5000
      });
      console.log('✅ Tenant created: tenant1 / Pass123!');
    } else {
      console.log('⚠️  Tenant already exists');
    }

    // Create issues
    console.log('\n🔧 Creating test issues...');
    const issueCount = await Issue.countDocuments({ apartment: apartment1._id });
    if (issueCount === 0) {
      const testIssues = [
        { title: 'Nema tople vode', description: 'U kupatilu nema tople vode već tri dana', priority: 'high' },
        { title: 'Curi slavina', description: 'Slavina u kuhinji kaplje', priority: 'medium' },
        { title: 'Škripi vrata', description: 'Ulazna vrata škripe', priority: 'low' }
      ];

      for (const issueData of testIssues) {
        await Issue.create({
          ...issueData,
          status: 'forwarded',
          apartment: apartment1._id,
          createdBy: tenant._id
        });
      }
      console.log(`✅ Created ${testIssues.length} test issues`);
    } else {
      console.log('⚠️  Issues already exist');
    }

    // Create notices
    console.log('\n📋 Creating test notices...');
    const noticeCount = await Notice.countDocuments({ building: building._id });
    if (noticeCount === 0) {
      const testNotices = [
        { title: 'Održavanje lifta', content: 'U petak 10.02. biće održavanje lifta od 9-12h. Molimo stanare da koriste stepenice.', priority: 'medium' },
        { title: 'Skupština stanara', content: 'Skupština stanara će se održati 20.02. u 18h u prizemlju zgrade.', priority: 'high' },
        { title: 'Čišćenje dvorišta', content: 'U subotu će biti organizovano zajedničko čišćenje dvorišta.', priority: 'low' }
      ];

      for (const noticeData of testNotices) {
        await Notice.create({
          ...noticeData,
          building: building._id,
          createdBy: tenant._id
        });
      }
      console.log(`✅ Created ${testNotices.length} test notices`);
    } else {
      console.log('⚠️  Notices already exist');
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Username: tenant1');
    console.log('   Password: Pass123!');
    console.log('\n✅ You can now login and see:');
    console.log('   - 3 test issues in "Kvarovi" tab');
    console.log('   - 3 test notices in "Oglasna tabla" tab');

    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTestData();
