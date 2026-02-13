const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function createAssociates() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check existing associates
    const existing = await User.countDocuments({ role: 'associate' });
    console.log('Existing associates:', existing);
    
    if (existing > 0) {
      console.log('\n✅ Associates already exist!');
      const all = await User.find({ role: 'associate' }).select('username email firstName lastName status');
      all.forEach((a, i) => {
        console.log(`${i+1}. ${a.firstName} ${a.lastName} - ${a.email} (${a.status})`);
      });
      await mongoose.disconnect();
      return;
    }
    
    // Create test associates
    const hashedPassword = await bcrypt.hash('pass123', 10);
    
    const associates = [
      { username: 'elektricar1', email: 'elektricar@firma.rs', firstName: 'Marko', lastName: 'Elektrić', company: 'ELEKTRO SERVIS' },
      { username: 'vodoinstalater1', email: 'vodoinstalater@firma.rs', firstName: 'Petar', lastName: 'Vodić', company: 'VODA+' },
      { username: 'bravar1', email: 'bravar@firma.rs', firstName: 'Jovan', lastName: 'Bravić', company: 'METALL PLUS' },
      { username: 'moler1', email: 'moler@firma.rs', firstName: 'Nikola', lastName: 'Farberić', company: 'BOJA DECOR' },
      { username: 'majstor1', email: 'majstor@firma.rs', firstName: 'Stefan', lastName: 'Majstorović', company: 'SVE ZA DOM' }
    ];
    
    for (const assoc of associates) {
      await User.create({
        username: assoc.username,
        email: assoc.email,
        password: hashedPassword,
        firstName: assoc.firstName,
        lastName: assoc.lastName,
        role: 'associate',
        status: 'active'
      });
      console.log(`✅ Created: ${assoc.firstName} ${assoc.lastName}`);
    }
    
    console.log('\n✅ All associates created successfully!');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAssociates();
