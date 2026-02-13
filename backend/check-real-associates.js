const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function checkRealAssociates() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');
  
  const usernames = ['elektricar1', 'vodoinstalater1', 'bravar1', 'moler1', 'majstor_opsti'];
  
  for (const username of usernames) {
    const user = await User.findOne({ username });
    if (user) {
      console.log(`\n✅ ${username}:`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Mobile: ${user.mobile || 'NOT SET'}`);
      console.log(`   Company: ${user.company || 'NOT SET'}`);
    } else {
      console.log(`\n❌ ${username} NOT FOUND`);
    }
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

checkRealAssociates();
