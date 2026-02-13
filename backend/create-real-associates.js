const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function createRealAssociates() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const hashedPassword = await bcrypt.hash('pass123', 10);
    
    // Check if real associates already exist
    const existing = await User.findOne({ username: 'elektricar1' });
    if (existing) {
      console.log('\n✅ Real associates already exist!');
      const real = await User.find({
        role: 'associate',
        username: { $in: ['elektricar1', 'vodoinstalater1', 'bravar1', 'moler1', 'majstor_opsti'] }
      }).select('username email firstName lastName status');
      
      real.forEach((a, i) => {
        console.log(`${i+1}. ${a.firstName} ${a.lastName} (${a.username}) - ${a.status}`);
      });
      
      await mongoose.disconnect();
      return;
    }
    
    const associates = [
      { 
        username: 'elektricar1', 
        email: 'elektricar@firma.rs', 
        firstName: 'Marko', 
        lastName: 'Elektrić',
        mobile: '+381 60 123 4567',
        company: 'ELEKTRO SERVIS DOO'
      },
      { 
        username: 'vodoinstalater1', 
        email: 'vodoinstalater@firma.rs', 
        firstName: 'Petar', 
        lastName: 'Vodić',
        mobile: '+381 63 987 6543',
        company: 'VODA PLUS'
      },
      { 
        username: 'bravar1', 
        email: 'bravar@firma.rs', 
        firstName: 'Jovan', 
        lastName: 'Bravić',
        mobile: '+381 64 555 1234',
        company: 'METALL PLUS DOO'
      },
      { 
        username: 'moler1', 
        email: 'moler@firma.rs', 
        firstName: 'Nikola', 
        lastName: 'Farberić',
        mobile: '+381 61 444 5678',
        company: 'BOJA DECOR'
      },
      { 
        username: 'majstor_opsti', 
        email: 'majstor@firma.rs', 
        firstName: 'Stefan', 
        lastName: 'Majstorović',
        mobile: '+381 62 333 9876',
        company: 'SVE ZA DOM'
      }
    ];
    
    for (const assoc of associates) {
      await User.create({
        username: assoc.username,
        email: assoc.email,
        password: hashedPassword,
        firstName: assoc.firstName,
        lastName: assoc.lastName,
        mobile: assoc.mobile,
        company: assoc.company,
        role: 'associate',
        status: 'active'
      });
      console.log(`✅ Created: ${assoc.firstName} ${assoc.lastName} (${assoc.username})`);
    }
    
    console.log('\n✅ All real associates created!');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createRealAssociates();
