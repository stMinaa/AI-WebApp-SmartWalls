/**
 * Apartment Validator Tests
 * RED Phase: Tests for apartment input validation (create, assign tenant)
 */

const ApartmentValidator = require('../../validators/ApartmentValidator');

describe('ApartmentValidator - Create', () => {
  test('valid apartment data should pass', () => {
    const data = {
      number: '101',
      floor: 1
    };
    
    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('missing number should fail', () => {
    const data = {
      floor: 1
    };
    
    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Apartment number is required');
  });

  test('empty number should fail', () => {
    const data = {
      number: '   ',
      floor: 1
    };
    
    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Apartment number is required');
  });

  test('missing floor should fail', () => {
    const data = {
      number: '101'
    };
    
    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Floor is required');
  });

  test('invalid floor type should fail', () => {
    const data = {
      number: '101',
      floor: 'first'
    };
    
    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Floor must be a number');
  });

  test('valid apartment with floor 0 should pass', () => {
    const data = {
      number: '1',
      floor: 0
    };
    
    const result = ApartmentValidator.validateCreate(data);
    expect(result.valid).toBe(true);
  });

  test('valid apartment with negative floor should pass', () => {
    const data = {
      number: 'B1',
      floor: -1
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
