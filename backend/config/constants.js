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

// Issue Status
const ISSUE_STATUS = {
  REPORTED: 'reported',
  TRIAGED: 'triaged',
  FORWARDED: 'forwarded',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
};

// Issue Priority Levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Environment
const NODE_ENV = {
  TEST: 'test',
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
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
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_REQUIRED: 'Token required',
  TOKEN_INVALID: 'Invalid or expired token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  
  // Validation errors
  REQUIRED_FIELDS_MISSING: 'All required fields must be provided',
  USERNAME_PASSWORD_REQUIRED: 'Username and password are required',
  USERNAME_EMAIL_PASSWORD_REQUIRED: 'Username, email, and password are required',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_MOBILE: 'Mobile number must be 7-15 digits',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  INVALID_ROLE: 'Invalid role. Must be one of: tenant, manager, director, associate',
  INVALID_PAYMENT_AMOUNT: 'Invalid payment amount',
  PAYMENT_EXCEEDS_DEBT: 'Payment amount cannot exceed debt',
  INVALID_DEBT_AMOUNT: 'Invalid debt amount',
  INVALID_ASSOCIATE: 'Invalid associate',
  INVALID_MANAGER: 'Invalid manager',
  INVALID_ACTION: 'Invalid action',
  CANNOT_DELETE_YOURSELF: 'Cannot delete yourself',
  
  // User errors
  USER_EXISTS: 'User with this username or email already exists',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_ACTIVE: 'User is already active',
  MANAGER_NOT_ACTIVE: 'Manager is not active',
  
  // Building errors
  BUILDING_NOT_FOUND: 'Building not found',
  ADDRESS_REQUIRED: 'Address is required',
  BUILDING_HAS_APARTMENTS: 'Building already has apartments. Bulk create only works on empty buildings.',
  FLOORS_OR_SPEC_REQUIRED: 'Either (floors + unitsPerFloor) or floorsSpec is required',
  UNIT_NUMBER_REQUIRED: 'unitNumber is required',
  
  // Issue errors
  ISSUE_NOT_FOUND: 'Issue not found',
  ISSUE_NOT_ASSIGNED_TO_YOU: 'This issue is not assigned to you',
  ISSUE_NOT_IN_ASSIGNED_STATUS: 'Issue is not in assigned status',
  ISSUE_MUST_BE_IN_PROGRESS: 'Issue must be in-progress to complete',
  
  // Tenant errors  
  TENANT_NOT_FOUND: 'Tenant not found',
  
  // Permission errors
  ONLY_DIRECTORS: 'Only directors can perform this action',
  ONLY_DIRECTORS_CREATE_BUILDINGS: 'Only directors can create buildings',
  ONLY_DIRECTORS_VIEW_BUILDINGS: 'Only directors can view all buildings',
  ONLY_DIRECTORS_ASSIGN_MANAGERS: 'Only directors can assign managers',
  ONLY_DIRECTORS_VIEW_USERS: 'Only directors can view users',
  ONLY_DIRECTORS_DELETE_USERS: 'Only directors can delete users',
  ONLY_DIRECTORS_APPROVE_MANAGERS: 'Only directors and managers can approve users',
  ONLY_MANAGERS_VIEW_BUILDINGS: 'Only managers can view managed buildings',
  ONLY_MANAGERS_TRIAGE: 'Only managers can triage issues',
  ONLY_MANAGERS_DIRECTORS_ADJUST_DEBT: 'Only directors and managers can adjust debt',
  ONLY_MANAGERS_DIRECTORS_VIEW_PENDING: 'Only managers and directors can view pending users',
  ONLY_MANAGERS_DIRECTORS_VIEW_ISSUES: 'Only managers and directors can view issues',
  ONLY_MANAGERS_DIRECTORS_CREATE_APARTMENTS: 'Only managers and directors can create apartments',
  ONLY_MANAGERS_DIRECTORS_VIEW_TENANTS: 'Only managers and directors can view tenants',
  ONLY_MANAGERS_DIRECTORS_DELETE_TENANTS: 'Only managers and directors can delete tenants',
  ONLY_ASSOCIATES_ACCEPT: 'Only associates can accept jobs',
  ONLY_ASSOCIATES_COMPLETE: 'Only associates can complete jobs',
  ONLY_MANAGERS_APPROVE_TENANTS: 'You can only approve tenants in your buildings',
  
  // General errors
  NETWORK_ERROR: 'Network error occurred',
  SERVER_ERROR: 'Server error',
  ERROR_PROCESSING_PAYMENT: 'Error processing payment',
  ERROR_UPDATING_DEBT: 'Error updating debt',
  ERROR_UPDATING_PROFILE: 'Greška pri ažuriranju profila',
};

module.exports = {
  JWT_SECRET,
  TOKEN_EXPIRY,
  BCRYPT_ROUNDS,
  USER_ROLES,
  VALID_ROLES,
  USER_STATUS,
  ISSUE_STATUS,
  PRIORITY_LEVELS,
  NODE_ENV,
  VALIDATION_RULES,
  HTTP_STATUS,
  ERROR_MESSAGES,
};
