const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// All report routes require authentication
router.use(authenticate);

// Dashboard stats (Magento-style) - allow admin, superadmin, support
router.get('/dashboard', authorizeRoles('admin', 'superadmin', 'support'), reportController.getDashboardStats);

// Other reports require admin/superadmin only
router.use(authorizeRoles('admin', 'superadmin'));

// Active users report
router.get('/active-users', reportController.getActiveUsersReport);

// Highest selling products report
router.get('/highest-selling-products', reportController.getHighestSellingProducts);

// Orders status report
router.get('/orders-status', reportController.getOrdersStatusReport);

module.exports = router;

