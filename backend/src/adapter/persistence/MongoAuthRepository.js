const UserModel = require('../../../models/User');

class MongoAuthRepository {
  async findByUsernameOrEmail(identifier) {
    return UserModel.findOne({ $or: [{ username: identifier }, { email: identifier }] });
  }

  async existsByUsernameOrEmail(username, email) {
    return UserModel.findOne({ $or: [{ username }, { email }] });
  }

  async findByUsernameExcludePassword(username) {
    return UserModel.findOne({ username }).select('-password');
  }

  async findByUsername(username) {
    return UserModel.findOne({ username });
  }

  async createUser(userData) {
    const user = new UserModel(userData);
    return user.save();
  }

  async save(user) {
    return user.save();
  }
}

module.exports = MongoAuthRepository;
