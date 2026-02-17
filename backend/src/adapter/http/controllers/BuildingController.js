const { ERROR_MESSAGES } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');
const AuthorizationError = require('../../../domain/exception/AuthorizationError');
const ValidationError = require('../../../domain/exception/ValidationError');

class BuildingController {
  constructor(buildingService) {
    this.buildingService = buildingService;
  }

  async createBuilding(req, res) {
    try {
      console.info('POST /api/buildings - User:', req.user?.username, 'Body:', req.body);
      const { name, address, imageUrl } = req.body;

      if (!address) {
        return ApiResponse.badRequest(res, ERROR_MESSAGES.ADDRESS_REQUIRED);
      }

      const building = await this.buildingService.createBuilding(req.user.username, {
        name,
        address,
        imageUrl
      });

      // Return raw saved doc to match original format
      const saved = await this.buildingService.buildingRepo.findRawById(building.id);
      console.info('Building created:', building.id);
      return ApiResponse.created(res, saved, 'Building created successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async listBuildings(req, res) {
    try {
      console.info('GET /api/buildings - User:', req.user?.username, 'Query:', req.query);
      const user = await this.buildingService.userRepo.findByUsername(req.user.username);

      const filter = {};
      if (req.query.managerId) {
        filter.manager = req.query.managerId;
      }

      const buildings = await this.buildingService.listBuildings(
        { role: user.role, _id: user._id },
        filter
      );

      console.info('Returning buildings:', buildings.length);
      return ApiResponse.success(res, buildings, 'Buildings retrieved');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async listManagedBuildings(req, res) {
    try {
      const user = await this.buildingService.userRepo.findByUsername(req.user.username);

      const buildings = await this.buildingService.listManagedBuildings({
        role: user.role,
        _id: user._id
      });

      return ApiResponse.success(res, buildings, 'Managed buildings retrieved');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async assignManager(req, res) {
    try {
      console.info(
        'PATCH /api/buildings/:buildingId/assign-manager - User:',
        req.user?.username,
        'Body:',
        req.body
      );
      const { managerId } = req.body;

      const updated = await this.buildingService.assignManager(
        req.user.username,
        req.params.buildingId,
        managerId
      );

      console.info('Manager assigned:', managerId ? managerId : 'removed');
      return ApiResponse.success(res, updated, 'Manager assigned successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async bulkCreateApartments(req, res) {
    try {
      console.info(
        'POST /api/buildings/:id/apartments/bulk - User:',
        req.user?.username,
        'Body:',
        req.body
      );
      const { floors, unitsPerFloor, floorsSpec } = req.body;

      const result = await this.buildingService.bulkCreateApartments(
        req.user.username,
        req.params.id,
        { floors, unitsPerFloor, floorsSpec }
      );

      console.info(`Created ${result.count} apartments`);
      return ApiResponse.created(res, result, `${result.count} apartments created`);
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async createApartment(req, res) {
    try {
      console.info(
        'POST /api/buildings/:id/apartments - User:',
        req.user?.username,
        'Body:',
        req.body
      );
      const { unitNumber, address } = req.body;

      const apartment = await this.buildingService.createApartment(
        req.user.username,
        req.params.id,
        { unitNumber, address }
      );

      console.info('Apartment created:', apartment._id);
      return ApiResponse.created(
        res,
        {
          _id: apartment._id,
          building: apartment.building.toString(),
          unitNumber: apartment.unitNumber,
          address: apartment.address
        },
        'Apartment created successfully'
      );
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async listApartments(req, res) {
    try {
      console.info('GET /api/buildings/:id/apartments - User:', req.user?.username);

      const apartments = await this.buildingService.listApartments(req.params.id);
      return ApiResponse.success(res, apartments, 'Apartments retrieved');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async listTenants(req, res) {
    try {
      console.info('GET /api/buildings/:id/tenants - User:', req.user?.username);

      const tenants = await this.buildingService.listTenants(req.user.username, req.params.id);

      return ApiResponse.success(res, tenants, 'Tenants retrieved');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  _handleError(res, err) {
    console.error('Building controller error:', err.message);

    if (err instanceof ValidationError) {
      if (err.message.includes('not found')) {
        return ApiResponse.notFound(res, err.message);
      }
      return ApiResponse.badRequest(res, err.message);
    }

    if (err instanceof AuthorizationError) {
      return ApiResponse.forbidden(res, err.message);
    }

    if (err.status) {
      return ApiResponse.error(res, err.message, err.status);
    }

    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = BuildingController;
