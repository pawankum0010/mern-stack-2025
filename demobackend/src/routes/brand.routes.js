const express = require('express');
const router = express.Router();
const {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brand.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// Public route - anyone can get brands (for product forms)
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Protected routes - only admins can manage brands
router.use(authenticate);
router.use(authorizeRoles('admin', 'superadmin'));

router.post('/', createBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

module.exports = router;

