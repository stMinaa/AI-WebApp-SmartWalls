const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
// Use Atlas database with test data
const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

// Helpful debug when connecting to MongoDB Atlas
if (!MONGO_URI) {
  console.error('✗ MONGO_URI not set. Check backend/.env');
} else {
  // show only a masked preview of the URI for safety
  try {
    const preview = MONGO_URI.replace(/(mongodb\+srv:\/\/)([^:@]+)(:[^@]+)?@/, '$1$2:***@');
    console.log('Using MONGO_URI:', preview.slice(0, 80) + (preview.length > 80 ? '…' : ''));
  } catch (e) {
    // ignore masking errors
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const buildingRoutes = require('./routes/buildings');
const issueRoutes = require('./routes/issues');
const noticeRoutes = require('./routes/notices');

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => {
    console.error('✗ MongoDB error:', err && err.message ? err.message : err);
  });

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notices', noticeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
