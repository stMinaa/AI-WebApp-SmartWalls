const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function resetPending() {
  await mongoose.connect(MONGO_URI);
  
  await User.findByIdAndUpdate(
    '693183abc7867a7b49a580a3',
    { status: 'pending' }
  );
  
  console.log('✅ User reset to pending');
  await mongoose.disconnect();
  process.exit(0);
}

resetPending();
