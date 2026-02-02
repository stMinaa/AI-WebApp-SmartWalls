/**
 * Phase 4.3: Associate marks job as complete
 * Tests for POST /api/issues/:id/complete
 * 
 * TDD Phase: RED - All tests should fail initially (404 or endpoint not implemented)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const Issue = require('../models/Issue');
const bcrypt = require('bcryptjs');

let mongoServer;
let director, associate1, associate2, manager, tenant;
let directorToken, associate1Token, associate2Token, managerToken, tenantToken;
let building, apartment, inProgressIssue, assignedIssue;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 4.3: Associate Marks Job as Complete', () => {
  describe('POST /api/issues/:id/complete', () => {
    beforeEach(async () => {
      await User.deleteMany({});
      await Building.deleteMany({});
      await Apartment.deleteMany({});
      await Issue.deleteMany({});

      // Create users
      const directorRes = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'director1',
          email: 'director1@test.com',
          password: 'password123',
          role: 'director',
          firstName: 'Director',
          lastName: 'One'
        });
      directorToken = directorRes.body.token;
      director = await User.findOne({ username: 'director1' });

      const associate1Res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'associate1',
          email: 'associate1@test.com',
          password: 'password123',
          role: 'associate',
          firstName: 'Associate',
          lastName: 'One',
          company: 'Plumbing Co'
        });
      associate1Token = associate1Res.body.token;
      associate1 = await User.findOne({ username: 'associate1' });

      const associate2Res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'associate2',
          email: 'associate2@test.com',
          password: 'password123',
          role: 'associate',
          firstName: 'Associate',
          lastName: 'Two',
          company: 'Electric Co'
        });
      associate2Token = associate2Res.body.token;
      associate2 = await User.findOne({ username: 'associate2' });

      const managerRes = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'manager1',
          email: 'manager1@test.com',
          password: 'password123',
          role: 'manager',
          firstName: 'Manager',
          lastName: 'One',
          company: 'Management Co'
        });
      managerToken = managerRes.body.token;
      manager = await User.findOne({ username: 'manager1' });

      const tenantRes = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'tenant1',
          email: 'tenant1@test.com',
          password: 'password123',
          role: 'tenant',
          firstName: 'Tenant',
          lastName: 'One'
        });
      tenantToken = tenantRes.body.token;
      tenant = await User.findOne({ username: 'tenant1' });

      // Approve manager and associates
      await request(app)
        .post(`/api/users/${manager._id}/approve`)
        .set('Authorization', 'Bearer ' + directorToken);
      
      await request(app)
        .post(`/api/users/${associate1._id}/approve`)
        .set('Authorization', 'Bearer ' + directorToken);

      await request(app)
        .post(`/api/users/${associate2._id}/approve`)
        .set('Authorization', 'Bearer ' + directorToken);

      // Create building, apartment
      building = await Building.create({
        name: 'Test Building',
        address: '123 Test St',
        manager: manager._id
      });

      apartment = await Apartment.create({
        building: building._id,
        unitNumber: '101',
        address: '123 Test St, Apt 101',
        numPeople: 2,
        tenant: tenant._id
      });

      // Create issues
      inProgressIssue = await Issue.create({
        apartment: apartment._id,
        building: building._id,
        createdBy: tenant._id,
        title: 'Leaking faucet',
        description: 'Kitchen faucet is leaking',
        priority: 'high',
        status: 'in-progress',
        assignedTo: associate1._id,
        cost: 150
      });

      assignedIssue = await Issue.create({
        apartment: apartment._id,
        building: building._id,
        createdBy: tenant._id,
        title: 'Broken window',
        description: 'Bedroom window is broken',
        priority: 'medium',
        status: 'assigned',
        assignedTo: associate1._id
      });
    });

    it('should mark job as complete and update status to resolved', async () => {
      const res = await request(app)
        .post(`/api/issues/${inProgressIssue._id}/complete`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ completionNotes: 'Fixed the leak and replaced washers' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('resolved');
      expect(res.body.completionNotes).toBe('Fixed the leak and replaced washers');
      expect(res.body.completionDate).toBeDefined();
      expect(res.body._id).toBe(inProgressIssue._id.toString());

      // Verify in database
      const updated = await Issue.findById(inProgressIssue._id);
      expect(updated.status).toBe('resolved');
      expect(updated.completionNotes).toBe('Fixed the leak and replaced washers');
      expect(updated.completionDate).toBeDefined();
      expect(updated.completionDate).toBeInstanceOf(Date);
    });

    it('should return updated issue with populated fields', async () => {
      const res = await request(app)
        .post(`/api/issues/${inProgressIssue._id}/complete`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ completionNotes: 'All done' });

      expect(res.status).toBe(200);
      expect(res.body.apartment).toBeDefined();
      expect(res.body.apartment.unitNumber).toBe('101');
      expect(res.body.building).toBeDefined();
      expect(res.body.building.name).toBe('Test Building');
      expect(res.body.createdBy).toBeDefined();
      expect(res.body.createdBy.email).toBe('tenant1@test.com');
      expect(res.body.createdBy.password).toBeUndefined();
    });

    it('should allow completing without notes (notes optional)', async () => {
      const res = await request(app)
        .post(`/api/issues/${inProgressIssue._id}/complete`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('resolved');
      expect(res.body.completionDate).toBeDefined();
      expect(res.body.completionNotes).toBeUndefined();
    });

    it('should reject if issue is not assigned to the associate', async () => {
      const res = await request(app)
        .post(`/api/issues/${inProgressIssue._id}/complete`)
        .set('Authorization', 'Bearer ' + associate2Token) // Different associate
        .send({ completionNotes: 'Done' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('not assigned');
    });

    it('should reject if issue is not in in-progress status', async () => {
      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/complete`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ completionNotes: 'Done' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('in-progress');
    });

    it('should reject if issue is already resolved', async () => {
      // Mark as resolved first
      inProgressIssue.status = 'resolved';
      inProgressIssue.completionDate = new Date();
      await inProgressIssue.save();

      const res = await request(app)
        .post(`/api/issues/${inProgressIssue._id}/complete`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ completionNotes: 'Done again' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('in-progress');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/issues/${inProgressIssue._id}/complete`)
        .send({ completionNotes: 'Done' });

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not an associate', async () => {
      const res = await request(app)
        .post(`/api/issues/${inProgressIssue._id}/complete`)
        .set('Authorization', 'Bearer ' + tenantToken)
        .send({ completionNotes: 'Done' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('associate');
    });

    it('should return 404 if issue does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/issues/${fakeId}/complete`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ completionNotes: 'Done' });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should preserve cost field when marking complete', async () => {
      const res = await request(app)
        .post(`/api/issues/${inProgressIssue._id}/complete`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ completionNotes: 'Fixed' });

      expect(res.status).toBe(200);
      expect(res.body.cost).toBe(150); // Cost from inProgressIssue
      expect(res.body.status).toBe('resolved');
    });
  });
});
