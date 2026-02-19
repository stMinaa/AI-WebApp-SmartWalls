require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

const { NODE_ENV } = require('./config/constants');
const authRoutes = require('./src/adapter/http/routes/auth');
const buildingRoutes = require('./src/adapter/http/routes/buildings');
const invoicesRouter = require('./src/adapter/http/routes/invoices');
const issueRoutes = require('./src/adapter/http/routes/issues');
const noticeRoutes = require('./src/adapter/http/routes/notices');
const pollRoutes = require('./src/adapter/http/routes/polls');
const tenantRoutes = require('./src/adapter/http/routes/tenants');
const testRoutes = require('./src/adapter/http/routes/test');
const userRoutes = require('./src/adapter/http/routes/users');

const app = express();

// MongoDB connection string (hardcoded for simplicity)
const MONGO_URI =
  'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== NODE_ENV.TEST) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.info('✅ MONGO RUNNING - Connected to MongoDB'))
    .catch((err) => {
      console.error('❌ MONGO ERROR:', err.message);
      process.exit(1);
    });
}

// ===== REGISTER ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api', userRoutes);
app.use('/api', tenantRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/test', testRoutes);
app.use('/api/invoices', invoicesRouter);

app.get('/', (req, res) => {
  res.send('Backend API is running');
});

const PORT = process.env.PORT || 5000;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.info(`✅ BACKEND RUNNING - Server listening on port ${PORT}`);
    console.info(`📍 API Base URL: http://localhost:${PORT}`);
    console.info(`✅ MONGO RUNNING ✅ BACKEND RUNNING - Ready to accept requests!\n`);
  });
}

// Export app for testing
module.exports = app;
