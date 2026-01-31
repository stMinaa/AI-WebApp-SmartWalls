/**
 * Backend API Server
 * Tenant Management System - Express.js application
 * 
 * Architecture:
 * - Routes: Request handling and validation (routes/)
 * - Services: Business logic encapsulation (services/)
 * - Models: Mongoose schemas (models/)
 * - Middleware: Cross-cutting concerns (middleware/)
 * 
 * All endpoints use async handlers, consistent error handling, and JSDoc documentation
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tennetdb';
const PORT = process.env.PORT || 3001;

// Database Connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => {
    console.error('✗ MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const issuesRoutes = require('./routes/issues');
const buildingsRoutes = require('./routes/buildings');
const noticesRoutes = require('./routes/notices');
const usersRoutes = require('./routes/users');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/users', usersRoutes);

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    status: 404
  });
});

/**
 * Global error handler (must be last)
 * Catches errors from async route handlers
 */
app.use((err, req, res, next) => {
  const { errorMiddleware } = require('./middleware/errorHandler');
  errorMiddleware(err, req, res, next);
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ API available at http://localhost:${PORT}/api`);
  console.log(`========================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;
