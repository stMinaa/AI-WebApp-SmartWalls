const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../backend/models/User');
const { getData, assertSuccess, assertError } = require('../backend/test/helpers/responseHelpers');

// We'll need to export the app from index.js for testing
let app;
let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB for tests
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);

  // Import app after DB connection
  app = require('../backend/index');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  // Clean up database after each test
  await User.deleteMany({});
});

describe('Phase 1: Role Field & Status System', () => {

  describe('POST /api/auth/signup', () => {

    it('should create user with default role "tenant" when no role provided', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      assertSuccess(response, 201);
      const data = getData(response);
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('tenant');
      expect(data.user.status).toBe('active');
    });

    it('should create user with specified role (manager)', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'manager1',
          email: 'manager@example.com',
          password: 'password123',
          firstName: 'Manager',
          lastName: 'User',
          role: 'manager'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('manager');
      expect(response.body.user.status).toBe('pending');
    });

    it('should create user with role "director"', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'director1',
          email: 'director@example.com',
          password: 'password123',
          firstName: 'Director',
          lastName: 'User',
          role: 'director'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('director');
      expect(response.body.user.status).toBe('active');
    });

    it('should create user with role "associate"', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'associate1',
          email: 'associate@example.com',
          password: 'password123',
          firstName: 'Associate',
          lastName: 'User',
          role: 'associate'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('associate');
      expect(response.body.user.status).toBe('pending');
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'baduser',
          email: 'bad@example.com',
          password: 'password123',
          firstName: 'Bad',
          lastName: 'User',
          role: 'superadmin'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should set status to "pending" for all new users', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: 'tenant'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.status).toBe('active');

      // Verify in database
      const user = await User.findOne({ username: 'newuser' });
      expect(user.status).toBe('active');
    });
  });

  describe('POST /api/auth/login', () => {

    it('should return user with role and status fields', async () => {
      // Create a user first
      await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'password123',
          firstName: 'Login',
          lastName: 'Test',
          role: 'manager'
        });

      // Now login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe('manager');
      expect(response.body.user.status).toBe('pending');
      expect(response.body.token).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {

    it('should return current user with role and status', async () => {
      // Signup
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'metest',
          email: 'me@example.com',
          password: 'password123',
          firstName: 'Me',
          lastName: 'Test',
          role: 'director'
        });

      const token = signupResponse.body.token;

      // Get current user
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('director');
      expect(response.body.status).toBe('active');
      expect(response.body.username).toBe('metest');
    });
  });

  describe('User Model Validation', () => {

    it('should have role field with valid enum values', async () => {
      const user = new User({
        username: 'validationtest',
        email: 'validation@example.com',
        password: 'hashedpassword',
        role: 'tenant',
        status: 'pending'
      });

      await expect(user.save()).resolves.toBeDefined();
      expect(user.role).toBe('tenant');
    });

    it('should reject invalid role value in model', async () => {
      const user = new User({
        username: 'invalidrole',
        email: 'invalid@example.com',
        password: 'hashedpassword',
        role: 'invalidrole',
        status: 'pending'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should have status field with valid enum values', async () => {
      const user = new User({
        username: 'statustest',
        email: 'status@example.com',
        password: 'hashedpassword',
        role: 'manager',
        status: 'active'
      });

      await expect(user.save()).resolves.toBeDefined();
      expect(user.status).toBe('active');
    });

    it('should default role to "tenant" if not provided', async () => {
      const user = new User({
        username: 'defaultrole',
        email: 'default@example.com',
        password: 'hashedpassword',
        status: 'pending'
      });

      await user.save();
      expect(user.role).toBe('tenant');
    });

    it('should default status to "pending" if not provided', async () => {
      const user = new User({
        username: 'defaultstatus',
        email: 'defaultstatus@example.com',
        password: 'hashedpassword',
        role: 'tenant'
      });

      await user.save();
      expect(user.status).toBe('pending');
    });
  });
});
