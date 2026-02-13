const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function resetUsers() {
  await mongoose.connect(MONGO_URI);
  
  const result = await User.updateMany(
    {
      _id: {
        $in: [
          '6980ed33050c16dd03b4afdc', // Ana Jovanovic
          '6980f074050c16dd03b4b013'  // Mgr Test
        ]
      }
    },
    { $set: { status: 'pending' } }
  );
  
  console.log('✅ Reset', result.modifiedCount, 'users back to pending');
  
  await mongoose.disconnect();
  process.exit(0);
}

resetUsers();
