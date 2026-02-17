const { HTTP_STATUS } = require('../config/constants');
const Apartment = require('../models/Apartment');
const Building = require('../models/Building');
const Issue = require('../models/Issue');

async function findBuildingById(buildingId) {
  const building = await Building.findById(buildingId);
  if (!building) {
    const error = new Error('Building not found');
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return building;
}

async function findIssueById(issueId) {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    const error = new Error('Issue not found');
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return issue;
}

async function findApartmentById(apartmentId) {
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    const error = new Error('Apartment not found');
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return apartment;
}

module.exports = {
  findBuildingById,
  findIssueById,
  findApartmentById
};
