const express = require('express');

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderActivityLogs,
  deleteOrder,
} = require('../controllers/order.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/:id/activity-logs', getOrderActivityLogs);
router.put('/:id/status', authorizeRoles('superadmin', 'admin'), updateOrderStatus);
router.delete('/:id', authorizeRoles('superadmin'), deleteOrder);

module.exports = router;

