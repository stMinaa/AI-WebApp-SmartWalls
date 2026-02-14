// Quick validator test
const UserValidator = require('./validators/UserValidator');
const IssueValidator = require('./validators/IssueValidator');
const BuildingValidator = require('./validators/BuildingValidator');

console.log('Testing UserValidator...');
const signupResult = UserValidator.validateSignup({
  username: 'test',
  email: 'test@example.com',
  password: 'Test123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'tenant'
});
console.log('Valid signup:', signupResult.valid ? '✓ PASS' : '✗ FAIL');

const invalidSignup = UserValidator.validateSignup({
  username: 'test',
  password: 'Test123!'
});
console.log('Invalid signup (missing fields):', !invalidSignup.valid ? '✓ PASS' : '✗ FAIL');

console.log('\nTesting IssueValidator...');
const reportResult = IssueValidator.validateReport({
  title: 'Broken window',
  description: 'Window is broken'
});
console.log('Valid issue report:', reportResult.valid ? '✓ PASS' : '✗ FAIL');

const invalidReport = IssueValidator.validateReport({
  title: 'Test'
});
console.log('Invalid issue (missing description):', !invalidReport.valid ? '✓ PASS' : '✗ FAIL');

console.log('\nTesting BuildingValidator...');
const buildingResult = BuildingValidator.validateCreate({
  name: 'Building A',
  address: '123 Main St',
  city: 'Belgrade'
});
console.log('Valid building:', buildingResult.valid ? '✓ PASS' : '✗ FAIL');

console.log('\n✅ All quick tests completed!');
