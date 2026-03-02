const { USER_ROLES, USER_STATUS, ERROR_MESSAGES } = require('../../../config/constants');
const ValidationError = require('../../domain/exception/ValidationError');

class AuthApplicationService {
  constructor(authRepository, authService) {
    this.authRepo = authRepository;
    this.authService = authService;
  }

  async signup(data) {
    const { username, email, password, firstName, lastName, role } = data;

    const existing = await this.authRepo.existsByUsernameOrEmail(username, email);
    if (existing) {
      const error = new Error('Username or email already exists');
      error.status = 409;
      throw error;
    }

    const hashedPassword = await this.authService.hashPassword(password);
    const status = !role || role === USER_ROLES.DIRECTOR ? USER_STATUS.ACTIVE : USER_STATUS.PENDING;

    const user = await this.authRepo.createUser({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'tenant',
      status,
      building: null,
      apartment: null
    });

    const tokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    };
    const token = this.authService.generateToken(tokenPayload);

    return {
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    };
  }

  async login(username, password) {
    const user = await this.authRepo.findByUsernameOrEmail(username);
    if (!user) {
      const err = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      err.status = 401;
      throw err;
    }

    const isMatch = await this.authService.verifyPassword(password, user.password);
    if (!isMatch) {
      const err = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      err.status = 401;
      throw err;
    }

    const tokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    };
    const token = this.authService.generateToken(tokenPayload);

    return {
      token,
      user: {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    };
  }

  async getProfile(username) {
    const user = await this.authRepo.findByUsernameExcludePassword(username);
    if (!user) {
      this._throwNotFound();
    }
    return user;
  }

  async updateProfile(username, updates) {
    const user = await this.authRepo.findByUsername(username);
    if (!user) {
      this._throwNotFound();
    }

    const { firstName, lastName, mobile, company } = updates;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (mobile !== undefined) user.mobile = mobile;
    if (company !== undefined && user.role !== USER_ROLES.TENANT) {
      user.company = company;
    }

    await this.authRepo.save(user);
    return this.authRepo.findByUsernameExcludePassword(username);
  }

  async payDebt(username, amount) {
    if (!amount || amount <= 0) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);
    }

    const user = await this.authRepo.findByUsername(username);
    if (!user) {
      this._throwNotFound();
    }

    if (amount > user.debt) {
      throw new ValidationError(ERROR_MESSAGES.PAYMENT_EXCEEDS_DEBT);
    }

    user.debt = Math.max(0, user.debt - amount);
    await this.authRepo.save(user);

    const updatedUser = await this.authRepo.findByUsernameExcludePassword(username);
    return { user: updatedUser, remainingDebt: user.debt };
  }

  _throwNotFound() {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.status = 404;
    throw error;
  }
}

module.exports = AuthApplicationService;
