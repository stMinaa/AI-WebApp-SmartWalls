const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function forceUpdateAssociates() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');
  
  const updates = [
    { username: 'elektricar1', mobile: '+381 60 123 4567', company: 'ELEKTRO SERVIS DOO' },
    { username: 'vodoinstalater1', mobile: '+381 63 987 6543', company: 'VODA PLUS' },
    { username: 'bravar1', mobile: '+381 64 555 1234', company: 'METALL PLUS DOO' },
    { username: 'moler1', mobile: '+381 61 444 5678', company: 'BOJA DECOR' },
    { username: 'majstor_opsti', mobile: '+381 62 333 9876', company: 'SVE ZA DOM' }
  ];
  
  for (const update of updates) {
    const user = await User.findOne({ username: update.username });
    
    if (user) {
      user.mobile = update.mobile;
      user.company = update.company;
      await user.save();
      console.log(`✅ Updated and saved ${update.username}`);
      
      // Verify
      const verified = await User.findOne({ username: update.username });
      console.log(`   Mobile: ${verified.mobile}, Company: ${verified.company}`);
    } else {
      console.log(`❌ ${update.username} not found`);
    }
  }
  
  console.log('\n✅ All associates force updated!');
  
  await mongoose.disconnect();
  process.exit(0);
}

forceUpdateAssociates();
