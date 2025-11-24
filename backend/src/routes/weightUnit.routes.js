const express = require('express');
const router = express.Router();
const {
  getWeightUnits,
  getWeightUnitById,
  createWeightUnit,
  updateWeightUnit,
  deleteWeightUnit,
} = require('../controllers/weightUnit.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// Public route - anyone can get weight units (for product forms)
router.get('/', getWeightUnits);
router.get('/:id', getWeightUnitById);

// Protected routes - only admins can manage weight units
router.use(authenticate);
router.use(authorizeRoles('admin', 'superadmin'));

router.post('/', createWeightUnit);
router.put('/:id', updateWeightUnit);
router.delete('/:id', deleteWeightUnit);

module.exports = router;

