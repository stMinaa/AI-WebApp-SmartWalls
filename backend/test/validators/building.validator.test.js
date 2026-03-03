/**
 * Building Validator Tests
 * RED Phase: Tests for building input validation (create, bulk apartments)
 */

const BuildingValidator = require('../../validators/BuildingValidator');

describe('BuildingValidator - Create', () => {
  test.each([
    [{ name: 'Zgrada A', address: 'Bulevar kralja Aleksandra 73' }],
    [{ name: 'B', address: 'A' }]
  ])('valid building data should pass', (data) => {
    const result = BuildingValidator.validateCreate(data);
    expect(result.valid).toBe(true);
  });

  test.each([
    [{ address: 'Bulevar kralja Aleksandra 73' }, 'Building name is required'],
    [{ name: '   ', address: 'Bulevar kralja Aleksandra 73' }, 'Building name is required'],
    [{ name: 'Zgrada A' }, 'Address is required'],
    [{ name: 'Zgrada A', address: '   ' }, 'Address is required']
  ])('invalid building data should fail', (data, expectedError) => {
    const result = BuildingValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });
});

describe('BuildingValidator - Bulk Apartments', () => {
  test.each([
    [
      {
        apartments: [
          { number: '1', floor: 0 },
          { number: '2', floor: 0 },
          { number: '3', floor: 1 }
        ]
      }
    ],
    [
      {
        apartments: Array.from({ length: 20 }, (_, i) => ({
          number: String(i + 1),
          floor: Math.floor(i / 4)
        }))
      }
    ]
  ])('valid bulk apartments should pass', (data) => {
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(true);
  });

  test.each([
    [{}, 'Apartments array is required'],
    [{ apartments: [] }, 'At least one apartment is required'],
    [{ apartments: 'not-an-array' }, 'Apartments must be an array']
  ])('invalid apartments container should fail', (data, expectedError) => {
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });

  test.each([
    [{ apartments: [{ floor: 0 }] }, 'Apartment #1: number is required'],
    [{ apartments: [{ number: '1' }] }, 'Apartment #1: floor is required'],
    [{ apartments: [{ number: '1', floor: 'ground' }] }, 'Apartment #1: floor must be a number']
  ])('invalid apartment field should fail', (data, errorFragment) => {
    const result = BuildingValidator.validateBulkApartments(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes(errorFragment))).toBe(true);
  });

  test('multiple apartments with some invalid should fail', () => {
    const result = BuildingValidator.validateBulkApartments({
      apartments: [{ number: '1', floor: 0 }, { floor: 1 }, { number: '3', floor: 'two' }]
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
