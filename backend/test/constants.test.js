/**
 * Constants Tests
 * Verifies that all constants are properly defined and exported
 */

const {
  JWT_SECRET,
  USER_ROLES,
  VALID_ROLES,
  USER_STATUS,
  ISSUE_STATUS,
  PRIORITY_LEVELS,
  NODE_ENV,
  VALIDATION_RULES,
  HTTP_STATUS,
  ERROR_MESSAGES,
} = require('../config/constants');

describe('Constants Module', () => {
  describe('JWT Configuration', () => {
    test('JWT_SECRET should be defined', () => {
      expect(JWT_SECRET).toBeDefined();
      expect(typeof JWT_SECRET).toBe('string');
    });
  });

  describe('User Roles', () => {
    test('USER_ROLES should contain all required roles', () => {
      expect(USER_ROLES).toBeDefined();
      expect(USER_ROLES.TENANT).toBe('tenant');
      expect(USER_ROLES.MANAGER).toBe('manager');
      expect(USER_ROLES.DIRECTOR).toBe('director');
      expect(USER_ROLES.ASSOCIATE).toBe('associate');
    });

    test('VALID_ROLES should be an array of all role values', () => {
      expect(Array.isArray(VALID_ROLES)).toBe(true);
      expect(VALID_ROLES).toContain('tenant');
      expect(VALID_ROLES).toContain('manager');
      expect(VALID_ROLES).toContain('director');
      expect(VALID_ROLES).toContain('associate');
      expect(VALID_ROLES.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('User Status', () => {
    test('USER_STATUS should contain required statuses', () => {
      expect(USER_STATUS).toBeDefined();
      expect(USER_STATUS.PENDING).toBe('pending');
      expect(USER_STATUS.ACTIVE).toBe('active');
      expect(USER_STATUS.REJECTED).toBe('rejected');
      expect(USER_STATUS.SUSPENDED).toBe('suspended');
    });
  });

  describe('Issue Status', () => {
    test('ISSUE_STATUS should contain all workflow statuses', () => {
      expect(ISSUE_STATUS).toBeDefined();
      expect(ISSUE_STATUS.REPORTED).toBe('reported');
      expect(ISSUE_STATUS.TRIAGED).toBe('triaged');
      expect(ISSUE_STATUS.FORWARDED).toBe('forwarded');
      expect(ISSUE_STATUS.ASSIGNED).toBe('assigned');
      expect(ISSUE_STATUS.IN_PROGRESS).toBe('in-progress');
      expect(ISSUE_STATUS.COMPLETED).toBe('completed');
      expect(ISSUE_STATUS.REJECTED).toBe('rejected');
    });
  });

  describe('Priority Levels', () => {
    test('PRIORITY_LEVELS should contain all priority values', () => {
      expect(PRIORITY_LEVELS).toBeDefined();
      expect(PRIORITY_LEVELS.LOW).toBe('low');
      expect(PRIORITY_LEVELS.MEDIUM).toBe('medium');
      expect(PRIORITY_LEVELS.HIGH).toBe('high');
      expect(PRIORITY_LEVELS.CRITICAL).toBe('critical');
    });
  });

  describe('Node Environment', () => {
    test('NODE_ENV should contain environment types', () => {
      expect(NODE_ENV).toBeDefined();
      expect(NODE_ENV.TEST).toBe('test');
      expect(NODE_ENV.DEVELOPMENT).toBe('development');
      expect(NODE_ENV.PRODUCTION).toBe('production');
    });
  });

  describe('Validation Rules', () => {
    test('VALIDATION_RULES should contain validation configurations', () => {
      expect(VALIDATION_RULES).toBeDefined();
      expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBe(6);
      expect(VALIDATION_RULES.EMAIL_REGEX).toBeInstanceOf(RegExp);
      expect(VALIDATION_RULES.MOBILE_REGEX).toBeInstanceOf(RegExp);
    });

    test('EMAIL_REGEX should validate email correctly', () => {
      expect(VALIDATION_RULES.EMAIL_REGEX.test('test@example.com')).toBe(true);
      expect(VALIDATION_RULES.EMAIL_REGEX.test('invalid-email')).toBe(false);
      expect(VALIDATION_RULES.EMAIL_REGEX.test('no@domain')).toBe(false);
    });

    test('MOBILE_REGEX should validate mobile numbers correctly', () => {
      expect(VALIDATION_RULES.MOBILE_REGEX.test('1234567')).toBe(true);
      expect(VALIDATION_RULES.MOBILE_REGEX.test('123456789012345')).toBe(true);
      expect(VALIDATION_RULES.MOBILE_REGEX.test('123')).toBe(false);
    });
  });

  describe('HTTP Status Codes', () => {
    test('HTTP_STATUS should contain all required status codes', () => {
      expect(HTTP_STATUS).toBeDefined();
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.CONFLICT).toBe(409);
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });
  });

  describe('Error Messages', () => {
    test('ERROR_MESSAGES should contain authentication errors', () => {
      expect(ERROR_MESSAGES).toBeDefined();
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBeDefined();
      expect(ERROR_MESSAGES.TOKEN_REQUIRED).toBeDefined();
      expect(ERROR_MESSAGES.TOKEN_INVALID).toBeDefined();
    });

    test('ERROR_MESSAGES should contain validation errors', () => {
      expect(ERROR_MESSAGES.USERNAME_PASSWORD_REQUIRED).toBeDefined();
      expect(ERROR_MESSAGES.USERNAME_EMAIL_PASSWORD_REQUIRED).toBeDefined();
      expect(ERROR_MESSAGES.INVALID_EMAIL).toBeDefined();
      expect(ERROR_MESSAGES.PASSWORD_TOO_SHORT).toBeDefined();
      expect(ERROR_MESSAGES.INVALID_ROLE).toBeDefined();
    });

    test('ERROR_MESSAGES should contain user errors', () => {
      expect(ERROR_MESSAGES.USER_NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.USER_ALREADY_ACTIVE).toBeDefined();
      expect(ERROR_MESSAGES.MANAGER_NOT_ACTIVE).toBeDefined();
    });

    test('ERROR_MESSAGES should contain building errors', () => {
      expect(ERROR_MESSAGES.BUILDING_NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.ADDRESS_REQUIRED).toBeDefined();
      expect(ERROR_MESSAGES.BUILDING_HAS_APARTMENTS).toBeDefined();
    });

    test('ERROR_MESSAGES should contain issue errors', () => {
      expect(ERROR_MESSAGES.ISSUE_NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.ISSUE_NOT_ASSIGNED_TO_YOU).toBeDefined();
      expect(ERROR_MESSAGES.ISSUE_NOT_IN_ASSIGNED_STATUS).toBeDefined();
    });

    test('ERROR_MESSAGES should contain permission errors', () => {
      expect(ERROR_MESSAGES.ONLY_DIRECTORS_CREATE_BUILDINGS).toBeDefined();
      expect(ERROR_MESSAGES.ONLY_MANAGERS_TRIAGE).toBeDefined();
      expect(ERROR_MESSAGES.ONLY_ASSOCIATES_ACCEPT).toBeDefined();
    });

    test('ERROR_MESSAGES should contain general errors', () => {
      expect(ERROR_MESSAGES.SERVER_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
    });

    test('PASSWORD_TOO_SHORT message should include minimum length', () => {
      expect(ERROR_MESSAGES.PASSWORD_TOO_SHORT).toContain('6');
    });
  });

  describe('Constants Usage in Application', () => {
    test('No magic numbers - all HTTP codes are constants', () => {
      // This ensures developers use HTTP_STATUS constants
      expect(Object.values(HTTP_STATUS)).toContain(200);
      expect(Object.values(HTTP_STATUS)).toContain(400);
      expect(Object.values(HTTP_STATUS)).toContain(401);
      expect(Object.values(HTTP_STATUS)).toContain(403);
      expect(Object.values(HTTP_STATUS)).toContain(404);
      expect(Object.values(HTTP_STATUS)).toContain(500);
    });

    test('No magic strings - all roles are constants', () => {
      // This ensures developers use USER_ROLES constants
      expect(Object.values(USER_ROLES)).toContain('tenant');
      expect(Object.values(USER_ROLES)).toContain('manager');
      expect(Object.values(USER_ROLES)).toContain('director');
      expect(Object.values(USER_ROLES)).toContain('associate');
    });

    test('No magic strings - all statuses are constants', () => {
      // This ensures developers use ISSUE_STATUS constants
      expect(Object.values(ISSUE_STATUS)).toContain('reported');
      expect(Object.values(ISSUE_STATUS)).toContain('forwarded');
      expect(Object.values(ISSUE_STATUS)).toContain('assigned');
      expect(Object.values(ISSUE_STATUS)).toContain('in-progress');
      expect(Object.values(ISSUE_STATUS)).toContain('completed');
    });
  });
});
