const express = require('express');
const router = express.Router();
const {
  getPincodes,
  getPincodeById,
  getPincodeByCode,
  createPincode,
  updatePincode,
  deletePincode,
  getPendingNotifications,
  checkPincode,
} = require('../controllers/pincode.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// Public route - check if pincode exists (used during signup/cart)
router.post('/check', checkPincode);

// Public route - get pincode by code (for shipping calculation)
router.get('/code/:pincode', getPincodeByCode);

// Protected routes - only admins can manage pincodes
router.use(authenticate);
router.use(authorizeRoles('admin', 'superadmin'));

router.get('/', getPincodes);
router.get('/notifications', getPendingNotifications);
router.get('/:id', getPincodeById);
router.post('/', createPincode);
router.put('/:id', updatePincode);
router.delete('/:id', deletePincode);

module.exports = router;

