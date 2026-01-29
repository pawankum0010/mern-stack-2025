const express = require('express');
const router = express.Router();
const {
  getAllCurrencies,
  getActiveCurrencies,
  getDefaultCurrency,
  getCurrencyById,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  setDefaultCurrency,
} = require('../controllers/currency.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// Public routes
router.get('/active', getActiveCurrencies);
router.get('/default', getDefaultCurrency);

// Protected routes - Admin only
router.get('/', authenticate, authorizeRoles('admin', 'superadmin'), getAllCurrencies);
router.get('/:id', authenticate, authorizeRoles('admin', 'superadmin'), getCurrencyById);
router.post('/', authenticate, authorizeRoles('admin', 'superadmin'), createCurrency);
router.put('/:id', authenticate, authorizeRoles('admin', 'superadmin'), updateCurrency);
router.delete('/:id', authenticate, authorizeRoles('admin', 'superadmin'), deleteCurrency);
router.patch('/:id/set-default', authenticate, authorizeRoles('admin', 'superadmin'), setDefaultCurrency);

module.exports = router;

