const BuildingModel = require('../../../models/Building');
const { addApartmentCounts } = require('../../../utils/responseHelpers');
const Building = require('../../domain/model/Building');

class MongoBuildingRepository {
  _toDomain(doc) {
    if (!doc) return null;
    return Building.restore({
      id: doc._id.toString(),
      _id: doc._id.toString(),
      name: doc.name,
      address: doc.address,
      imageUrl: doc.imageUrl,
      director: doc.director,
      manager: doc.manager,
      createdAt: doc.createdAt
    });
  }

  async findById(id) {
    const doc = await BuildingModel.findById(id);
    return this._toDomain(doc);
  }

  async findRawById(id) {
    return BuildingModel.findById(id);
  }

  async findAll(filter = {}) {
    const buildings = await BuildingModel.find(filter)
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return addApartmentCounts(buildings);
  }

  async findByManager(managerId) {
    const buildings = await BuildingModel.find({ manager: managerId })
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return addApartmentCounts(buildings);
  }

  async save(building) {
    if (building.id) {
      const updateData = {
        name: building.name,
        address: building.address,
        imageUrl: building.imageUrl,
        manager: building.manager
      };
      await BuildingModel.findByIdAndUpdate(building.id, updateData, { new: true });
    } else {
      const doc = new BuildingModel({
        name: building.name,
        address: building.address,
        imageUrl: building.imageUrl,
        director: building.director,
        manager: building.manager
      });
      const saved = await doc.save();
      building.id = saved._id.toString();
    }
    return building;
  }

  async findByIdPopulated(id) {
    return BuildingModel.findById(id)
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email');
  }
}

module.exports = MongoBuildingRepository;
