/**
 * Direct MongoDB seed - creates test issues and notices
 * Run this while backend is NOT running
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Building = require('./models/Building');
const Apartment = require('./models/Apartment');
const Issue = require('./models/Issue');
const Notice = require('./models/Notice');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/housing-management';

async function seedData() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    // Find a tenant
    const tenant = await User.findOne({ role: 'tenant' });
    if (!tenant) {
      console.log('❌ No tenant found. Please create users first.');
      process.exit(1);
    }
    console.log('✅ Found tenant:', tenant.username);

    // Find an apartment
    const apartment = await Apartment.findOne();
    if (!apartment) {
      console.log('❌ No apartment found. Please create buildings/apartments first.');
      process.exit(1);
    }
    console.log('✅ Found apartment:', apartment._id);

    // Find a building
    const building = await Building.findOne();
    if (!building) {
      console.log('❌ No building found.');
      process.exit(1);
    }
    console.log('✅ Found building:', building.name, '\n');

    // Create test issues
    console.log('📝 Creating test issues...');
    const testIssues = [
      { title: 'Nema tople vode', description: 'U kupatilu nema tople vode već tri dana', priority: 'high', status: 'forwarded' },
      { title: 'Lift ne radi', description: 'Lift je zaglavio između spratova', priority: 'high', status: 'forwarded' },
      { title: 'Curi slavina u kuhinji', description: 'Slavina u kuhinji kaplje celu noć', priority: 'medium', status: 'forwarded' },
      { title: 'Pukla sijalica u hodniku', description: 'Sijalica na trećem spratu je pregorela', priority: 'low', status: 'forwarded' },
      { title: 'Nezatvoren prozor na stepeništu', description: 'Prozor na drugom spratu ne može da se zatvori', priority: 'medium', status: 'forwarded' },
      { title: 'Nema grejanja u stanu', description: 'Radijatori su hladni već dva dana', priority: 'high', status: 'forwarded' },
      { title: 'Prljav ulaz zgrade', description: 'Ulaz nije čišćen nedelju dana', priority: 'low', status: 'forwarded' },
      { title: 'Škripi vrata na ulazu', description: 'Glavna vrata jako škripe i teško se otvaraju', priority: 'medium', status: 'forwarded' }
    ];

    for (const issueData of testIssues) {
      const issue = new Issue({
        ...issueData,
        apartment: apartment._id,
        createdBy: tenant._id
      });
      await issue.save();
    }
    console.log(`✅ Created ${testIssues.length} test issues\n`);

    // Create test notices
    console.log('📝 Creating test notices...');
    const testNotices = [
      { title: 'Održavanje lifta', content: 'U petak 10.02. biće održavanje lifta od 9-12h. Molimo stanare da koriste stepenice.', priority: 'medium' },
      { title: 'Čišćenje dvorišta', content: 'U subotu će biti organizovano zajedničko čišćenje dvorišta. Pozivaju se svi stanari.', priority: 'low' },
      { title: 'Isključenje vode', content: 'U četvrtak od 8-10h biće isključena voda zbog popravke cevi.', priority: 'high' },
      { title: 'Skupština stanara', content: 'Skupština stanara će se održati 20.02. u 18h u prizemlju zgrade.', priority: 'high' },
      { title: 'Grejanje', content: 'Grejanje će biti pojačano zbog niskih temperatura naredne nedelje.', priority: 'medium' },
      { title: 'Parking', content: 'Molimo stanare da ne blokiraju ulaz parkinga. Vozila će biti odslikana.', priority: 'low' },
      { title: 'Renoviranje ulaza', content: 'Ulaz zgrade će biti renoviran u martu. Detalji će biti objavljeni naknadno.', priority: 'medium' }
    ];

    for (const noticeData of testNotices) {
      const notice = new Notice({
        ...noticeData,
        building: building._id,
        createdBy: tenant._id
      });
      await notice.save();
    }
    console.log(`✅ Created ${testNotices.length} test notices\n`);

    console.log('🎉 Seeding complete!');
    console.log('Now you can:');
    console.log('  - Login as tenant to see issues and notices');
    console.log('  - Check "Kvarovi" tab for issues');
    console.log('  - Check "Oglasna tabla" tab for notices');

    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedData();
