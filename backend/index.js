require('dotenv').config({ path: `${__dirname}/.env`, override: true });
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');

const { NODE_ENV } = require('./config/constants');
const { errorMiddleware } = require('./middleware/errorHandler');
const authRoutes = require('./src/adapter/http/routes/auth');
const buildingRoutes = require('./src/adapter/http/routes/buildings');
const invoicesRouter = require('./src/adapter/http/routes/invoices');
const issueRoutes = require('./src/adapter/http/routes/issues');
const noticeRoutes = require('./src/adapter/http/routes/notices');
const pollRoutes = require('./src/adapter/http/routes/polls');
const tenantRoutes = require('./src/adapter/http/routes/tenants');
const testRoutes = require('./src/adapter/http/routes/test');
const userRoutes = require('./src/adapter/http/routes/users');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is required');
  process.exit(1);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

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

// Global error handler (must be after all routes)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await mongoose.connect(MONGO_URI);
  console.info('✅ MONGO RUNNING - Connected to MongoDB');
  app.listen(PORT, () => {
    console.info(`✅ BACKEND RUNNING - Server listening on port ${PORT}`);
    console.info(`📍 API Base URL: http://localhost:${PORT}`);
    console.info(`✅ MONGO RUNNING ✅ BACKEND RUNNING - Ready to accept requests!\n`);
  });
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== NODE_ENV.TEST) {
  startServer().catch((err) => {
    console.error('❌ STARTUP ERROR:', err.message);
    process.exit(1);
  });
}

// Export app for testing
module.exports = app;
