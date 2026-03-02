const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { JWT_SECRET, TOKEN_EXPIRY, BCRYPT_ROUNDS } = require('../../../config/constants');

class AuthService {
  constructor(userRepository) {
    this.userRepo = userRepository;
  }

  async login(username, password) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken({ id: user.id, username: user.username });

    return { token, user: { id: user.id, username: user.username } };
  }

  async hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY
    });
  }

  validateToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
}

module.exports = AuthService;
