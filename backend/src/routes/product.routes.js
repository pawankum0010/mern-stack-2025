const express = require('express');

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected admin routes
router.use(authenticate);
router.post('/', authorizeRoles('superadmin', 'admin'), createProduct);
router.put('/:id', authorizeRoles('superadmin', 'admin'), updateProduct);
router.delete('/:id', authorizeRoles('superadmin', 'admin'), deleteProduct);

module.exports = router;

