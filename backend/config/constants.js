/**
 * Backend Configuration Constants
 * Centralized configuration for consistent access
 */

// Authentication Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '1h';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

// User Roles
const USER_ROLES = {
  TENANT: 'tenant',
  MANAGER: 'manager',
  DIRECTOR: 'director',
  ADMIN: 'admin',
  ASSOCIATE: 'associate',
};

const VALID_ROLES = Object.values(USER_ROLES);

// User Status
const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

// Validation Rules
const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  MOBILE_REGEX: /^\d{7,15}$/,
  EMAIL_REGEX: /^\S+@\S+\.\S+$/,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

// Error Messages
const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid username or password',
  TOKEN_REQUIRED: 'Authentication token required',
  TOKEN_INVALID: 'Invalid or expired token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  
  // Validation errors
  REQUIRED_FIELDS_MISSING: 'All required fields must be provided',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_MOBILE: 'Mobile number must be 7-15 digits',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  INVALID_ROLE: 'Invalid user role',
  
  // User errors
  USER_EXISTS: 'User with this username or email already exists',
  USER_NOT_FOUND: 'User not found',
  
  // General errors
  NETWORK_ERROR: 'Network error occurred',
  SERVER_ERROR: 'Internal server error',
};

module.exports = {
  JWT_SECRET,
  TOKEN_EXPIRY,
  BCRYPT_ROUNDS,
  USER_ROLES,
  VALID_ROLES,
  USER_STATUS,
  VALIDATION_RULES,
  HTTP_STATUS,
  ERROR_MESSAGES,
};
