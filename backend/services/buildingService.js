/**
 * Building Service
 * Handles building operations: creation, management, manager assignment, apartment management
 */

const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const User = require('../models/User');

// ============= HELPER FUNCTIONS =============

/**
 * Validate building input data
 * @param {Object} data - { name, address }
 * @throws {Object} Error with status and message
 */
function validateBuildingInput(data) {
  const { name, address } = data;
  if (!name || !name.trim()) {
    throw { status: 400, message: 'Building name required' };
  }
  if (!address || !address.trim()) {
    throw { status: 400, message: 'Address required' };
  }
}

/**
 * Check if building already exists at address
 * @param {string} address - Building address
 * @throws {Object} Error if building exists
 */
async function checkBuildingExists(address) {
  const existing = await Building.findOne({ address: address.trim() });
  if (existing) {
    throw { status: 400, message: 'Building at this address already exists' };
  }
}

// ============= MAIN SERVICE FUNCTIONS =============

/**
 * Create a new building
 * @param {Object} data - { name, address }
 * @returns {Promise<Object>}
 */
async function createBuilding(data) {
  validateBuildingInput(data);
  await checkBuildingExists(data.address);

  const { name, address } = data;
  const building = new Building({
    name: name.trim(),
    address: address.trim()
  });

  await building.save();
  return { message: 'Building created', building };
}

/**
 * Get all buildings with manager info
 * @returns {Promise<Array>}
 */
async function getAllBuildings() {
  return await Building.find()
    .populate({
      path: 'manager',
      select: 'username firstName lastName'
    })
    .sort({ name: 1 });
}

/**
 * Get building by ID with apartments and manager
 * @param {string} buildingId
 * @returns {Promise<Object>}
 */
async function getBuilding(buildingId) {
  const building = await Building.findById(buildingId)
    .populate({
      path: 'manager',
      select: 'username firstName lastName email'
    })
    .populate({
      path: 'apartments',
      populate: { path: 'tenant', select: 'username firstName lastName' }
    });

  if (!building) throw { status: 404, message: 'Building not found' };

  return building;
}

/**
 * Assign manager to building
 * @param {string} buildingId
 * @param {string} managerUsername
 * @returns {Promise<Object>}
 */
async function assignManager(buildingId, managerUsername) {
  const building = await Building.findById(buildingId);
  if (!building) throw { status: 404, message: 'Building not found' };

  const manager = await User.findOne({ username: managerUsername });
  if (!manager || manager.role !== 'manager') {
    throw { status: 400, message: 'Invalid manager username' };
  }

  // Update building manager
  building.manager = manager._id;
  await building.save();

  // Update user's managedBuildings
  if (!manager.managedBuildings) manager.managedBuildings = [];
  if (!manager.managedBuildings.includes(buildingId)) {
    manager.managedBuildings.push(buildingId);
  }
  await manager.save();

  return { message: 'Manager assigned', building };
}

/**
 * Validate number is valid and positive
 * @param {number} num - Number to validate
 * @param {string} fieldName - Field name for error message
 */
function validatePositiveNumber(num, fieldName) {
  if (isNaN(num) || num < 1) {
    throw { status: 400, message: `Invalid ${fieldName} value` };
  }
}

/**
 * Validate bulk apartment creation input
 * @private
 */
function validateBulkApartmentInput(startUnit, count) {
  if (!startUnit || !count) {
    throw { status: 400, message: 'startUnit and count required' };
  }

  const startNum = Number(startUnit);
  const countNum = Number(count);
  
  validatePositiveNumber(startNum, 'startUnit');
  validatePositiveNumber(countNum, 'count');

  return { startNum, countNum };
}

/**
 * Verify building exists and is empty
 * @private
 */
async function verifyBuildingIsEmpty(buildingId) {
  const building = await Building.findById(buildingId);
  if (!building) throw { status: 404, message: 'Building not found' };

  const existing = await Apartment.countDocuments({ building: buildingId });
  if (existing > 0) throw { status: 400, message: 'Building is not empty' };

  return building;
}

/**
 * Generate apartment data array
 * @private
 */
function generateApartmentData(buildingId, startNum, countNum, replicaValue) {
  const apartments = [];
  for (let i = 0; i < countNum; i++) {
    const unitNumber = startNum + i;
    apartments.push({
      building: buildingId,
      unitNumber: unitNumber.toString(),
      replicaValue: replicaValue || null
    });
  }
  return apartments;
}

/**
 * Bulk create apartments in building
 * @param {string} buildingId
 * @param {Object} data - { startUnit, count, replicaValue }
 * @returns {Promise<Object>}
 */
async function bulkCreateApartments(buildingId, data) {
  const { startUnit, count, replicaValue } = data;

  // Validate input
  const { startNum, countNum } = validateBulkApartmentInput(startUnit, count);

  // Verify building and check if empty
  const building = await verifyBuildingIsEmpty(buildingId);

  // Generate apartment data
  const apartments = generateApartmentData(buildingId, startNum, countNum, replicaValue);

  // Create apartments
  const created = await Apartment.insertMany(apartments);

  // Update building apartments array
  building.apartments = created.map(apt => apt._id);
  await building.save();

  return { message: `${created.length} apartments created`, apartments: created };
}

/**
 * Get apartments for a building
 * @param {string} buildingId
 * @returns {Promise<Array>}
 */
async function getApartments(buildingId) {
  const building = await Building.findById(buildingId);
  if (!building) throw { status: 404, message: 'Building not found' };

  return await Apartment.find({ building: buildingId })
    .populate('tenant', 'username firstName lastName')
    .sort({ unitNumber: 1 });
}

/**
 * Get building statistics for manager dashboard
 * @param {string} buildingId
 * @returns {Promise<Object>}
 */
async function getBuildingStats(buildingId) {
  const building = await Building.findById(buildingId);
  if (!building) throw { status: 404, message: 'Building not found' };

  const totalApartments = await Apartment.countDocuments({ building: buildingId });
  const occupiedApartments = await Apartment.countDocuments({
    building: buildingId,
    tenant: { $ne: null }
  });

  return {
    building,
    totalApartments,
    occupiedApartments,
    vacantApartments: totalApartments - occupiedApartments,
    occupancyRate: totalApartments > 0 ? ((occupiedApartments / totalApartments) * 100).toFixed(2) : '0.00'
  };
}

module.exports = {
  createBuilding,
  getAllBuildings,
  getBuilding,
  assignManager,
  bulkCreateApartments,
  getApartments,
  getBuildingStats
};
