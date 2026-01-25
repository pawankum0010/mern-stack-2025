const mongoose = require('mongoose');
const crypto = require('crypto');

const User = require('../models/user.model');
const Role = require('../models/role.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { generateToken } = require('../utils/token');
const { logCustomActivity } = require('../middlewares/activityLogger');
const { sendPasswordResetEmail } = require('../utils/email');

const buildTokenPayload = (user) => ({
  sub: user.id,
  email: user.email,
  role: {
    id: user.role?._id || user.role?.id,
    name: user.role?.name,
  },
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, {
      message: 'Email and password are required',
      statusCode: 400,
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password')
    .populate('role', 'name');

  if (!user) {
    return sendError(res, {
      message: 'Invalid credentials',
      statusCode: 401,
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, {
      message: 'Invalid credentials',
      statusCode: 401,
    });
  }

  const token = generateToken(buildTokenPayload(user));

  // Log login activity (only for customers)
  const userRole = user.role?.name || user.role || '';
  const isCustomer = userRole.toLowerCase() === 'customer';
  
  if (isCustomer && user._id) {
    logCustomActivity(user._id, 'login', {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      description: 'User logged in',
    });
  }

  sendSuccess(res, {
    message: 'Login successful',
    data: {
      token,
      user,
    },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  // Log logout activity (only for customers)
  if (req.user && req.user._id) {
    const userRole = req.user.role?.name || req.user.role || '';
    const isCustomer = userRole.toLowerCase() === 'customer';
    
    if (isCustomer) {
      logCustomActivity(req.user._id, 'logout', {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        description: 'User logged out',
      });
    }
  }

  sendSuccess(res, {
    message: 'Logout successful. Please discard the token on client side.',
    data: null,
  });
});

exports.registerSuperAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return sendError(res, {
      message: 'Name, email, and password are required',
      statusCode: 400,
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return sendError(res, {
      message: 'User already exists with this email',
      statusCode: 409,
    });
  }

  let role = await Role.findOne({ name: 'superadmin' });

  if (!role) {
    role = await Role.create({ name: 'superadmin', description: 'Super Admin' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role._id,
  });

  const populated = await user.populate('role', 'name');
  const token = generateToken(buildTokenPayload(populated));

  sendSuccess(res, {
    data: {
      token,
      user: populated,
    },
    message: 'Superadmin registered successfully',
    statusCode: 201,
  });
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, dob, address, pincode } = req.body;

  if (!name || !email || !password || !pincode) {
    return sendError(res, {
      message: 'Name, email, password, and pincode are required',
      statusCode: 400,
    });
  }

  // Validate pincode format
  if (!/^\d{6}$/.test(pincode)) {
    return sendError(res, {
      message: 'Pincode must be exactly 6 digits',
      statusCode: 400,
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return sendError(res, {
      message: 'User already exists with this email',
      statusCode: 409,
    });
  }

  // Check if pincode exists in admin list
  const Pincode = require('../models/pincode.model');
  const PincodeNotification = require('../models/pincodeNotification.model');
  const pincodeData = await Pincode.findOne({ pincode, status: 'active' });

  // Create notification if pincode doesn't exist
  if (!pincodeData) {
    await PincodeNotification.findOneAndUpdate(
      { pincode, status: 'pending' },
      {
        pincode,
        userEmail: email,
        status: 'pending',
      },
      { upsert: true, new: true }
    );
  }

  let role = await Role.findOne({ name: 'customer' });

  if (!role) {
    role = await Role.create({ name: 'customer', description: 'Customer' });
  }

  const userData = {
    name,
    email,
    password,
    phone,
    pincode,
    role: role._id,
  };

  if (dob) {
    const { parseDob, calculateAge } = require('../utils/date');
    try {
      userData.dateOfBirth = parseDob(dob);
      userData.age = calculateAge(userData.dateOfBirth);
    } catch (error) {
      return sendError(res, {
        message: error.message,
        statusCode: 400,
      });
    }
  }

  if (address) {
    userData.address = address;
  }

  const user = await User.create(userData);

  const populated = await user.populate('role', 'name');
  const token = generateToken(buildTokenPayload(populated));

  sendSuccess(res, {
    data: {
      token,
      user: populated,
    },
    message: 'Registration successful',
    statusCode: 201,
  });
});

// Request password reset
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, {
      message: 'Email is required',
      statusCode: 400,
    });
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  // Check if email exists - show error if not found
  if (!user) {
    return sendError(res, {
      message: 'No account found with this email address',
      statusCode: 404,
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set token and expiration (1 hour from now)
  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  // Remove trailing slash from FRONTEND_URL if present
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

  console.log('Password reset request initiated:', {
    email: user.email,
    frontendUrl,
    resetUrlGenerated: true,
    timestamp: new Date().toISOString(),
  });

  try {
    // Send email
    await sendPasswordResetEmail(user.email, resetToken, resetUrl);

    console.log('Password reset email sent successfully for:', user.email);

    sendSuccess(res, {
      message: 'Password reset email sent successfully. Please check your email.',
      data: null,
    });
  } catch (error) {
    // If email fails, remove the token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Password reset email failed - Detailed Error:', {
      email: user.email,
      errorMessage: error.message,
      errorCode: error.code,
      originalError: error.originalError?.message,
      stack: error.stack,
      smtpConfig: {
        host: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
        port: process.env.SMTP_PORT ? 'SET' : 'NOT SET',
        user: process.env.SMTP_USER ? 'SET' : 'NOT SET',
        pass: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
        fromName: process.env.SMTP_FROM_NAME ? 'SET' : 'NOT SET',
      },
    });

    // Return more descriptive error message
    const errorMessage = error.message || 'Failed to send password reset email. Please check SMTP configuration.';
    
    return sendError(res, {
      message: errorMessage,
      statusCode: 500,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        originalMessage: error.originalError?.message,
      } : undefined,
    });
  }
});

// Reset password with token
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return sendError(res, {
      message: 'Token, email, and password are required',
      statusCode: 400,
    });
  }

  if (password.length < 6) {
    return sendError(res, {
      message: 'Password must be at least 6 characters',
      statusCode: 400,
    });
  }

  // Hash the token to compare with stored hash
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid token and not expired
  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    return sendError(res, {
      message: 'Invalid or expired password reset token',
      statusCode: 400,
    });
  }

  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // Skip validation since we're only updating password and reset token fields
  await user.save({ validateBeforeSave: false });

  // Log password reset activity (only for customers)
  const populatedUser = await user.populate('role', 'name');
  const userRole = populatedUser.role?.name || populatedUser.role || '';
  const isCustomer = userRole.toLowerCase() === 'customer';
  
  if (isCustomer && user._id) {
    logCustomActivity(user._id, 'password_reset', {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      description: 'User reset password',
    });
  }

  sendSuccess(res, {
    message: 'Password reset successfully. You can now login with your new password.',
    data: null,
  });
});

