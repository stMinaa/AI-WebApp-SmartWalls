const Apartment = require('../../../models/Apartment');
const Building = require('../../../models/Building');
const IssueModel = require('../../../models/Issue');
const {
  populateIssue,
  flattenIssueBuildings,
  populateIssueWithCompany,
  flattenIssueBuilding
} = require('../../../utils/responseHelpers');
const Issue = require('../../domain/model/Issue');

class MongoIssueRepository {
  _toDomain(doc) {
    if (!doc) return null;
    return Issue.restore({
      id: doc._id.toString(),
      _id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      priority: doc.priority,
      status: doc.status,
      createdBy: doc.createdBy,
      apartment: doc.apartment,
      building: doc.building,
      assignedTo: doc.assignedTo,
      cost: doc.cost,
      completionNotes: doc.completionNotes,
      completionDate: doc.completionDate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async findById(id) {
    const doc = await IssueModel.findById(id);
    return this._toDomain(doc);
  }

  async findRawById(id) {
    return IssueModel.findById(id);
  }

  async findByFilters(filters, user) {
    const query = { ...filters };

    // Manager scoping: only see issues from their buildings
    if (user && user.role === 'manager') {
      const buildings = await Building.find({ manager: user._id });
      const buildingIds = buildings.map((b) => b._id);
      const apartments = await Apartment.find({ building: { $in: buildingIds } });
      const apartmentIds = apartments.map((a) => a._id);
      query.apartment = { $in: apartmentIds };
    }

    const docs = await populateIssue(IssueModel.find(query)).sort({ createdAt: -1 });
    return flattenIssueBuildings(docs);
  }

  async findByIdPopulated(id) {
    const doc = await populateIssueWithCompany(IssueModel.findById(id));
    if (!doc) return null;
    return flattenIssueBuilding(doc);
  }

  async save(issue) {
    if (issue.id) {
      const updateData = {
        status: issue.status,
        assignedTo: issue.assignedTo,
        cost: issue.cost,
        completionNotes: issue.completionNotes,
        completionDate: issue.completionDate,
        updatedAt: new Date()
      };
      await IssueModel.findByIdAndUpdate(issue.id, updateData, { new: true });
    } else {
      const doc = new IssueModel({
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        createdBy: issue.createdBy,
        apartment: issue.apartment,
        building: issue.building,
        assignedTo: issue.assignedTo,
        cost: issue.cost
      });
      const saved = await doc.save();
      issue.id = saved._id.toString();
    }
    return issue;
  }
}

module.exports = MongoIssueRepository;
