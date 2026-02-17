const { USER_ROLES, USER_STATUS } = require('../../../config/constants');
const Apartment = require('../../../models/Apartment');
const Building = require('../../../models/Building');
const Issue = require('../../../models/Issue');
const UserModel = require('../../../models/User');
const {
  populateIssueWithCompany,
  flattenIssueBuildings
} = require('../../../utils/responseHelpers');

class MongoUserRepository {
  async findByUsername(username) {
    return UserModel.findOne({ username });
  }

  async findById(id) {
    return UserModel.findById(id);
  }

  async findApartmentById(apartmentId) {
    return Apartment.findById(apartmentId);
  }

  async findTenantsByBuilding(buildingId) {
    return UserModel.find({
      building: buildingId,
      role: USER_ROLES.TENANT
    })
      .populate('apartment', 'unitNumber')
      .populate('building', 'name address')
      .select('username email firstName lastName apartment building createdAt');
  }

  async save(user) {
    return user.save();
  }

  async updateStatus(userId, status) {
    return UserModel.updateOne({ _id: userId }, { $set: { status } });
  }

  async findPending(buildingIds) {
    const query = { status: USER_STATUS.PENDING };
    if (buildingIds) {
      query.building = { $in: buildingIds };
    }
    return UserModel.find(query)
      .select('-password')
      .populate('building', 'name address')
      .sort({ createdAt: -1 });
  }

  async findWithFilters(filter, select, sort) {
    return UserModel.find(filter)
      .select(select || '')
      .sort(sort || { createdAt: -1 });
  }

  async deleteById(userId) {
    return UserModel.findByIdAndDelete(userId);
  }

  async deleteMany(filter) {
    return UserModel.deleteMany(filter);
  }

  async findTestUsers(excludeId) {
    return UserModel.find({
      _id: { $ne: excludeId },
      $or: [
        { username: /^test/i },
        { firstName: /^(name|test)\d+$/i },
        { lastName: /^(last|test)\d+$/i }
      ]
    });
  }

  async findAssociates() {
    return UserModel.find({
      role: USER_ROLES.ASSOCIATE,
      $or: [{ status: USER_STATUS.ACTIVE }, { status: { $exists: false } }, { status: null }]
    }).select('_id username firstName lastName email company status');
  }

  async countBuildingsByManager(managerId) {
    return Building.countDocuments({ manager: managerId });
  }

  async findBuildingsByManager(managerId) {
    return Building.find({ manager: managerId });
  }

  async clearManagerFromBuildings(managerIds) {
    const filter = Array.isArray(managerIds)
      ? { manager: { $in: managerIds } }
      : { manager: managerIds };
    return Building.updateMany(filter, { $set: { manager: null } });
  }

  async updateApartmentTenant(aptId, tenantId, numPeople) {
    return Apartment.findByIdAndUpdate(aptId, {
      tenant: tenantId,
      numPeople: numPeople !== undefined ? numPeople : 0
    });
  }

  async findApartmentWithBuilding(apartmentId) {
    return Apartment.findById(apartmentId);
  }

  async findBuildingWithManager(buildingId) {
    return Building.findById(buildingId).populate('manager', 'firstName lastName email');
  }

  async findBuildingWithManagerAndCount(buildingId) {
    const building = await Building.findById(buildingId).populate(
      'manager',
      'firstName lastName email'
    );
    if (!building) return null;
    const apartmentCount = await Apartment.countDocuments({ building: building._id });
    return { ...building.toObject(), apartmentCount };
  }

  async findAssociateJobs(userId, filters) {
    const filter = { assignedTo: userId };
    if (filters.status) filter.status = filters.status;
    if (filters.priority) filter.priority = filters.priority;

    const jobs = await populateIssueWithCompany(Issue.find(filter)).sort({ createdAt: -1 });
    return flattenIssueBuildings(jobs);
  }
}

module.exports = MongoUserRepository;
