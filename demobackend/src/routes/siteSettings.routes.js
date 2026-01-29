const express = require('express');
const router = express.Router();
const {
  getSettings,
  getAdminSettings,
  updateSettings,
  submitSupportRequest,
  getSupportRequests,
  getSupportRequestById,
  updateSupportRequest,
  deleteSupportRequest,
} = require('../controllers/siteSettings.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// Public routes
router.get('/contact', getSettings);
router.post('/support', submitSupportRequest);

// Admin routes
router.get('/', authenticate, authorizeRoles('admin', 'superadmin'), getAdminSettings);
router.put('/', authenticate, authorizeRoles('admin', 'superadmin'), updateSettings);

// Support request management routes (Admin only)
router.get('/support-requests', authenticate, authorizeRoles('admin', 'superadmin'), getSupportRequests);
router.get('/support-requests/:id', authenticate, authorizeRoles('admin', 'superadmin'), getSupportRequestById);
router.put('/support-requests/:id', authenticate, authorizeRoles('admin', 'superadmin'), updateSupportRequest);
router.delete('/support-requests/:id', authenticate, authorizeRoles('admin', 'superadmin'), deleteSupportRequest);

module.exports = router;

