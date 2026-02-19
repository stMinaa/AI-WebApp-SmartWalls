const ApartmentModel = require('../../../models/Apartment');
const BuildingModel = require('../../../models/Building');
const IssueModel = require('../../../models/Issue');
const NoticeModel = require('../../../models/Notice');
const UserModel = require('../../../models/User');

class MongoTestRepository {
  async findUserByUsername(username) {
    return UserModel.findOne({ username }).select('-password');
  }

  async findFirstApartment() {
    return ApartmentModel.findOne();
  }

  async findFirstTenant() {
    return UserModel.findOne({ role: 'tenant' });
  }

  async findFirstBuilding() {
    return BuildingModel.findOne();
  }

  async findFirstManager() {
    return UserModel.findOne({ role: 'manager' });
  }

  async createIssue(data) {
    const issue = new IssueModel(data);
    return issue.save();
  }

  async createNotice(data) {
    const notice = new NoticeModel(data);
    return notice.save();
  }
}

module.exports = MongoTestRepository;
