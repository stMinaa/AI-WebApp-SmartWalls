module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/backend/test/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/frontend/'],
  testTimeout: 30000,
  verbose: true
};
