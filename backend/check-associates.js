const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function checkAssociates() {
  await mongoose.connect(MONGO_URI);
  
  const associates = await User.find({ role: 'associate' });
  
  console.log('\n📋 Associates in database:', associates.length);
  
  if (associates.length === 0) {
    console.log('\n❌ NO ASSOCIATES FOUND!');
  } else {
    associates.forEach((a, idx) => {
      console.log(`\n${idx + 1}. ${a.firstName} ${a.lastName}`);
      console.log(`   ID: ${a._id}`);
      console.log(`   Username: ${a.username}`);
      console.log(`   Email: ${a.email}`);
      console.log(`   Status: ${a.status}`);
    });
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

checkAssociates();
