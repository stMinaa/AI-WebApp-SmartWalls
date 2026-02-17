const ApartmentModel = require('../../../models/Apartment');

class MongoApartmentRepository {
  async countByBuilding(buildingId) {
    return ApartmentModel.countDocuments({ building: buildingId });
  }

  async findByBuilding(buildingId) {
    return ApartmentModel.find({ building: buildingId }).sort('unitNumber');
  }

  async createSingle({ buildingId, unitNumber, address }) {
    return ApartmentModel.create({
      building: buildingId,
      unitNumber,
      address
    });
  }

  async createBulk(apartments) {
    return ApartmentModel.insertMany(apartments);
  }
}

module.exports = MongoApartmentRepository;
