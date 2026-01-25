const express = require('express');

const {
  login,
  logout,
  registerSuperAdmin,
  register,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const { authLimiter, registerLimiter } = require('../middlewares/security');

const router = express.Router();

// Apply rate limiting to authentication endpoints
router.post('/login', authLimiter, login);
router.post('/logout', authenticate, logout);
router.post('/register', registerLimiter, register);
router.post('/register-superadmin', registerLimiter, registerSuperAdmin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;

