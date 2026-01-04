const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// All report routes require authentication and admin/superadmin role
router.use(authenticate);
router.use(authorizeRoles('admin', 'superadmin'));

// Active users report
router.get('/active-users', reportController.getActiveUsersReport);

// Highest selling products report
router.get('/highest-selling-products', reportController.getHighestSellingProducts);

// Orders status report
router.get('/orders-status', reportController.getOrdersStatusReport);

module.exports = router;

