const express = require('express');
const router = express.Router();

const { authMiddleware: authenticateToken } = require('../../../../middleware/authHelper');
const { userController: controller } = require('../../composition');

// ===== TENANT ENDPOINTS =====
router.delete('/tenants/:id', authenticateToken, (req, res) => controller.deleteTenant(req, res));
router.post('/tenants/:id/approve', authenticateToken, (req, res) =>
  controller.approveTenant(req, res)
);
router.post('/tenants/:id/assign', authenticateToken, (req, res) =>
  controller.assignTenant(req, res)
);
router.get('/tenants/me/apartment', authenticateToken, (req, res) =>
  controller.getMyApartment(req, res)
);

module.exports = router;
