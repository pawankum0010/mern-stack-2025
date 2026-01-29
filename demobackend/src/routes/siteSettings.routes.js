const express = require('express');
const router = express.Router();
const {
  getSettings,
  getAdminSettings,
  updateSettings,
  submitSupportRequest,
} = require('../controllers/siteSettings.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// Public routes
router.get('/contact', getSettings);
router.post('/support', submitSupportRequest);

// Admin routes
router.get('/', authenticate, authorizeRoles('admin', 'superadmin'), getAdminSettings);
router.put('/', authenticate, authorizeRoles('admin', 'superadmin'), updateSettings);

module.exports = router;

