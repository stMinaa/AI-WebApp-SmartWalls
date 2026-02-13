const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function updateAssociates() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');
  
  // Update existing associates with company and mobile info
  const updates = [
    { username: 'elektricar1', mobile: '+381 60 123 4567', company: 'ELEKTRO SERVIS DOO' },
    { username: 'vodoinstalater1', mobile: '+381 63 987 6543', company: 'VODA PLUS' },
    { username: 'bravar1', mobile: '+381 64 555 1234', company: 'METALL PLUS DOO' },
    { username: 'moler1', mobile: '+381 61 444 5678', company: 'BOJA DECOR' },
    { username: 'majstor_opsti', mobile: '+381 62 333 9876', company: 'SVE ZA DOM' }
  ];
  
  for (const update of updates) {
    const result = await User.updateOne(
      { username: update.username },
      { $set: { mobile: update.mobile, company: update.company } }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Updated ${update.username}`);
    } else {
      console.log(`⚠️  ${update.username} not found or already updated`);
    }
  }
  
  console.log('\n✅ All associates updated!');
  
  await mongoose.disconnect();
  process.exit(0);
}

updateAssociates();
