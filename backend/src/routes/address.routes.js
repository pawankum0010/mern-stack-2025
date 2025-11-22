const express = require('express');
const {
  getMyAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/address.controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.route('/')
  .get(getMyAddresses)
  .post(createAddress);

router.route('/:id')
  .get(getAddressById)
  .put(updateAddress)
  .delete(deleteAddress);

router.put('/:id/default', setDefaultAddress);

module.exports = router;

