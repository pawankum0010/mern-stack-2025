const express = require('express');
const router = express.Router();
const {
  getSizes,
  getSizeById,
  createSize,
  updateSize,
  deleteSize,
} = require('../controllers/size.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// Public route - anyone can get sizes (for product forms)
router.get('/', getSizes);
router.get('/:id', getSizeById);

// Protected routes - only admins can manage sizes
router.use(authenticate);
router.use(authorizeRoles('admin', 'superadmin'));

router.post('/', createSize);
router.put('/:id', updateSize);
router.delete('/:id', deleteSize);

module.exports = router;

