const Apartment = require('../models/Apartment');

async function addApartmentCount(building) {
  const apartmentCount = await Apartment.countDocuments({ building: building._id });
  return {
    ...building.toObject(),
    apartmentCount
  };
}

async function addApartmentCounts(buildings) {
  return Promise.all(buildings.map(building => addApartmentCount(building)));
}

function flattenIssueBuilding(issue) {
  const issueObj = issue.toObject();
  if (issueObj.apartment && issueObj.apartment.building) {
    issueObj.building = issueObj.apartment.building;
  }
  return issueObj;
}

function flattenIssueBuildings(issues) {
  return issues.map(issue => flattenIssueBuilding(issue));
}

function populateIssue(query) {
  return query
    .populate('apartment', 'unitNumber address')
    .populate({
      path: 'apartment',
      populate: {
        path: 'building',
        select: 'name address'
      }
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email');
}

function populateIssueWithCompany(query) {
  return query
    .populate('apartment', 'unitNumber address')
    .populate({
      path: 'apartment',
      populate: {
        path: 'building',
        select: 'name address'
      }
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'username firstName lastName email company');
}

module.exports = {
  addApartmentCount,
  addApartmentCounts,
  flattenIssueBuilding,
  flattenIssueBuildings,
  populateIssue,
  populateIssueWithCompany
};
