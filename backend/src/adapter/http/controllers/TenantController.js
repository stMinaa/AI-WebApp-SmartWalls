const { ERROR_MESSAGES } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');
const AuthorizationError = require('../../../domain/exception/AuthorizationError');
const ValidationError = require('../../../domain/exception/ValidationError');

class TenantController {
  constructor(tenantService) {
    this.tenantService = tenantService;
  }

  async deleteTenant(req, res) {
    console.info('DELETE /api/tenants/:id - User:', req.user?.username, 'Tenant:', req.params.id);
    return this._execute(res, async () => {
      await this.tenantService.deleteTenant(req.user.username, req.params.id);
      return ApiResponse.success(res, null, 'Tenant deleted successfully');
    });
  }

  async approveTenant(req, res) {
    console.info(`POST /api/tenants/:id/approve - User: ${req.user.username}`);
    return this._execute(res, async () => {
      const result = await this.tenantService.approveTenant(req.user.username, req.params.id);
      return ApiResponse.success(res, result, 'Tenant approved successfully');
    });
  }

  async assignTenant(req, res) {
    console.info(`POST /api/tenants/:id/assign - User: ${req.user.username} Body:`, req.body);
    const { apartmentId, buildingId, numPeople } = req.body;
    return this._execute(res, async () => {
      await this.tenantService.assignTenant(req.user.username, req.params.id, {
        apartmentId,
        buildingId,
        numPeople
      });
      return ApiResponse.success(res, null, 'Tenant assigned successfully');
    });
  }

  async getMyApartment(req, res) {
    console.info(`GET /api/tenants/me/apartment - User: ${req.user.username}`);
    return this._execute(res, async () => {
      const result = await this.tenantService.getMyApartment(req.user.username);
      return ApiResponse.success(res, result, 'Apartment info retrieved');
    });
  }

  async _execute(res, fn) {
    try {
      return await fn();
    } catch (err) {
      console.error('TenantController error:', err.message);
      return this._handleError(res, err);
    }
  }

  _handleError(res, err, fallbackMessage) {
    if (err instanceof ValidationError) {
      if (err.message.includes('not found') || err.message.includes('not assigned')) {
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

    return ApiResponse.serverError(res, fallbackMessage || ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = TenantController;
