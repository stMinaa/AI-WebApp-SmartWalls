const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const { connectTestDB, disconnectTestDB } = require('./setup');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Phase 2.4: Assign Tenants to Apartments', () => {
  let directorToken, managerToken, tenantToken;
  let directorId, managerId, tenantId;
  let buildingId, apartmentId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Building.deleteMany({});
    await Apartment.deleteMany({});

    // Create director
    const directorRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'director1',
        email: 'director1@example.com',
        password: 'password123',
        firstName: 'Director',
        lastName: 'One',
        role: 'director'
      });
    
    directorId = directorRes.body.user._id;

    const directorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'director1',
        password: 'password123'
      });
    directorToken = directorLogin.body.token;

    // Verify director
    const director = await User.findById(directorId);

    // Create and approve manager
    const managerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'manager1',
        email: 'manager1@example.com',
        password: 'password123',
        firstName: 'Manager',
        lastName: 'One',
        role: 'manager'
      });
    managerId = managerRes.body.user._id;

    const approveRes = await request(app)
      .patch(`/api/users/${managerId}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'manager1',
        password: 'password123'
      });
    managerToken = managerLogin.body.token;

    // Create building and assign manager
    const buildingRes = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({
        name: 'Test Building',
        address: '123 Main St'
      });
    buildingId = buildingRes.body._id;

    await request(app)
      .patch(`/api/buildings/${buildingId}/assign-manager`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ managerId });

    // Create apartment
    const apartmentRes = await request(app)
      .post(`/api/buildings/${buildingId}/apartments`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        unitNumber: '101',
        address: '123 Main St, Unit 101'
      });
    apartmentId = apartmentRes.body._id;

    // Create tenant
    const tenantRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'tenant1',
        email: 'tenant1@example.com',
        password: 'password123',
        firstName: 'Tenant',
        lastName: 'One',
        role: 'tenant'
      });
    tenantId = tenantRes.body.user._id;

    const tenantLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'tenant1',
        password: 'password123'
      });
    tenantToken = tenantLogin.body.token;
  });

  describe('POST /api/tenants/:id/assign', () => {
    it('should assign tenant to apartment and update both records', async () => {
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 3
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Tenant assigned successfully');

      // Verify tenant updated
      const tenant = await User.findById(tenantId);
      expect(tenant.apartment.toString()).toBe(apartmentId);
      expect(tenant.building.toString()).toBe(buildingId);

      // Verify apartment updated
      const apartment = await Apartment.findById(apartmentId);
      expect(apartment.tenant.toString()).toBe(tenantId);
      expect(apartment.numPeople).toBe(3);
    });

    it('should update numPeople if already assigned to same apartment', async () => {
      // First assignment
      await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      // Update numPeople
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 4
        });

      expect(res.status).toBe(200);

      const apartment = await Apartment.findById(apartmentId);
      expect(apartment.numPeople).toBe(4);
    });

    it('should free old apartment when reassigning to new apartment', async () => {
      // Create second apartment
      const apartment2Res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          unitNumber: '102',
          address: '123 Main St, Unit 102'
        });
      const apartment2Id = apartment2Res.body._id;

      // First assignment to apartment 1
      await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      // Reassign to apartment 2
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId: apartment2Id,
          buildingId,
          numPeople: 3
        });

      expect(res.status).toBe(200);

      // Verify old apartment freed
      const apartment1 = await Apartment.findById(apartmentId);
      expect(apartment1.tenant).toBeNull();
      expect(apartment1.numPeople).toBe(0);

      // Verify new apartment assigned
      const apartment2 = await Apartment.findById(apartment2Id);
      expect(apartment2.tenant.toString()).toBe(tenantId);
      expect(apartment2.numPeople).toBe(3);

      // Verify tenant updated
      const tenant = await User.findById(tenantId);
      expect(tenant.apartment.toString()).toBe(apartment2Id);
    });

    it('should return 400 if apartment already occupied by another tenant', async () => {
      // Create second tenant
      const tenant2Res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'tenant2',
          email: 'tenant2@example.com',
          password: 'password123',
          firstName: 'Tenant',
          lastName: 'Two',
          role: 'tenant'
        });
      const tenant2Id = tenant2Res.body.user._id;

      // Assign first tenant to apartment
      await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      // Try to assign second tenant to same apartment
      const res = await request(app)
        .post(`/api/tenants/${tenant2Id}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 1
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already occupied');
    });

    it('should return 400 if apartmentId or buildingId missing', async () => {
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          numPeople: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('apartmentId and buildingId are required');
    });

    it('should return 404 if tenant not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/tenants/${fakeId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Tenant not found');
    });

    it('should return 404 if apartment not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId: fakeId,
          buildingId,
          numPeople: 2
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Apartment not found');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      expect(res.status).toBe(403);
    });

    it('should allow director to assign tenants', async () => {
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Tenant assigned successfully');
    });
  });
});
