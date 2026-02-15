/**
 * Apartment Validator Tests
 * Tests for apartment input validation (create, assign tenant)
 */

const ApartmentValidator = require('../../validators/ApartmentValidator');

describe('ApartmentValidator - Create', () => {
  test('valid apartment data should pass', () => {
    const data = {
      unitNumber: '101'
    };

    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('missing unitNumber should fail', () => {
    const data = {};

    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Unit number is required');
  });

  test('empty unitNumber should fail', () => {
    const data = {
      unitNumber: '   '
    };

    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Unit number is required');
  });

  test('valid apartment with alphanumeric unitNumber should pass', () => {
    const data = {
      unitNumber: 'B1'
    };

    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(true);
  });
});

describe('ApartmentValidator - Assign Tenant', () => {
  test('valid assignment with tenantId should pass', () => {
    const data = {
      tenantId: '507f1f77bcf86cd799439011'
    };

    const result = ApartmentValidator.validateAssignTenant(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('missing tenantId should fail', () => {
    const data = {};

    const result = ApartmentValidator.validateAssignTenant(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Tenant ID is required');
  });

  test('empty tenantId should fail', () => {
    const data = {
      tenantId: '   '
    };

    const result = ApartmentValidator.validateAssignTenant(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Tenant ID is required');
  });

  test('invalid ObjectId format should fail', () => {
    const data = {
      tenantId: 'not-an-objectid'
    };

    const result = ApartmentValidator.validateAssignTenant(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid tenant ID format'))).toBe(true);
  });

  test('valid ObjectId with different format should pass', () => {
    const data = {
      tenantId: '507f191e810c19729de860ea'
    };

    const result = ApartmentValidator.validateAssignTenant(data);
    expect(result.valid).toBe(true);
  });
});
