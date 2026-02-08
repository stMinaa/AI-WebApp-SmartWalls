/**
 * Test Setup Helper
 * Uses real MongoDB Atlas instead of MongoMemoryServer
 */

const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb_test?retryWrites=true&w=majority&appName=Cluster0';

/**
 * Connect to test database
 */
async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas for testing');
  }
}

/**
 * Disconnect from test database
 */
async function disconnectTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB Atlas');
  }
}

/**
 * Clear all collections in test database
 */
async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearTestDB
};
