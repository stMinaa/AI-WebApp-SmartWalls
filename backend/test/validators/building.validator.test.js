/**
 * Building Validator Tests
 * RED Phase: Tests for building input validation (create, bulk apartments)
 */

const BuildingValidator = require('../../validators/BuildingValidator');

describe('BuildingValidator - Create', () => {
  test('valid building data should pass', () => {
    const data = {
      name: 'Zgrada A',
      address: 'Bulevar kralja Aleksandra 73',
      city: 'Beograd'
    };
    
    const result = BuildingValidator.validateCreate(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('missing name should fail', () => {
    const data = {
      address: 'Bulevar kralja Aleksandra 73',
      city: 'Beograd'
    };
    
    const result = BuildingValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Building name is required');
  });

  test('empty name should fail', () => {
    const data = {
      name: '   ',
      address: 'Bulevar kralja Aleksandra 73',
      city: 'Beograd'
    };
    
    const result = BuildingValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Building name is required');
  });

  test('missing address should fail', () => {
    const data = {
      name: 'Zgrada A',
      city: 'Beograd'
    };
    
    const result = BuildingValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Address is required');
  });

  test('empty address should fail', () => {
    const data = {
      name: 'Zgrada A',
      address: '   ',
      city: 'Beograd'
    };
    
    const result = BuildingValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Address is required');
  });

  test('missing city should fail', () => {
    const data = {
      name: 'Zgrada A',
      address: 'Bulevar kralja Aleksandra 73'
    };
    
    const result = BuildingValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('City is required');
  });

  test('empty city should fail', () => {
    const data = {
      name: 'Zgrada A',
      address: 'Bulevar kralja Aleksandra 73',
      city: '   '
    };
    
    const result = BuildingValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('City is required');
  });
});

describe('BuildingValidator - Bulk Apartments', () => {
  test('valid bulk apartments data should pass', () => {
    const data = {
      apartments: [
        { number: '1', floor: 0 },
        { number: '2', floor: 0 },
        { number: '3', floor: 1 }
      ]
    };
    
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('missing apartments array should fail', () => {
    const data = {};
    
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Apartments array is required');
  });

  test('empty apartments array should fail', () => {
    const data = {
      apartments: []
    };
    
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one apartment is required');
  });

  test('non-array apartments should fail', () => {
    const data = {
      apartments: 'not-an-array'
    };
    
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Apartments must be an array');
  });

  test('apartment missing number should fail', () => {
    const data = {
      apartments: [
        { floor: 0 }
      ]
    };
    
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Apartment #1: number is required'))).toBe(true);
  });

  test('apartment missing floor should fail', () => {
    const data = {
      apartments: [
        { number: '1' }
      ]
    };
    
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Apartment #1: floor is required'))).toBe(true);
  });

  test('apartment with invalid floor should fail', () => {
    const data = {
      apartments: [
        { number: '1', floor: 'ground' }
      ]
    };
    
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Apartment #1: floor must be a number'))).toBe(true);
  });

  test('multiple apartments with some invalid should fail', () => {
    const data = {
      apartments: [
        { number: '1', floor: 0 },
        { floor: 1 }, // Missing number
        { number: '3', floor: 'two' } // Invalid floor
      ]
    };
    
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('valid bulk apartments with many apartments should pass', () => {
    const apartments = [];
    for (let i = 1; i <= 20; i++) {
      apartments.push({ number: i.toString(), floor: Math.floor((i - 1) / 4) });
    }
    
    const data = { apartments };
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(true);
  });
});
