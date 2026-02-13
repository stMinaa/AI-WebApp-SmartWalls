const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function testLogin() {
  await mongoose.connect(MONGO_URI);
  
  const director = await User.findOne({ username: 'direktor' });
  if (!director) {
    console.log('❌ Director not found');
    process.exit(1);
  }
  
  console.log('Director found:', director.username);
  console.log('Password hash:', director.password);
  
  // Test different passwords
  const passwords = ['sifra123', 'pass123', 'direktor123', '123456', 'admin', 'direktor', 'password'];
  
  let found = false;
  for (const pwd of passwords) {
    const match = await bcrypt.compare(pwd, director.password);
    console.log(`Testing "${pwd}":`, match ? '✅' : '❌');
    if (match) {
      console.log(`\n✅✅✅ CORRECT PASSWORD: "${pwd}" ✅✅✅\n`);
      found = true;
    }
  }
  
  if (!found) {
    console.log('\n❌ None of the test passwords matched!');
    console.log('You may need to reset the password or create new director account');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

testLogin();
