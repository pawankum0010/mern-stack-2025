const Pincode = require('../models/pincode.model');
const PincodeNotification = require('../models/pincodeNotification.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

/**
 * Get all pincodes
 */
exports.getPincodes = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.pincode = { $regex: search, $options: 'i' };
  }

  const pincodes = await Pincode.find(query)
    .sort({ pincode: 1 })
    .lean();

  sendSuccess(res, {
    data: pincodes,
    message: 'Pincodes retrieved successfully',
  });
});

/**
 * Get pincode by code
 */
exports.getPincodeByCode = asyncHandler(async (req, res) => {
  const { pincode } = req.params;

  if (!/^\d{6}$/.test(pincode)) {
    return sendError(res, {
      message: 'Invalid pincode format. Must be 6 digits',
      statusCode: 400,
    });
  }

  const pincodeData = await Pincode.findOne({ pincode, status: 'active' }).lean();

  if (!pincodeData) {
    return sendNotFound(res, { message: 'Pincode not found or inactive' });
  }

  sendSuccess(res, {
    data: pincodeData,
    message: 'Pincode retrieved successfully',
  });
});

/**
 * Get pincode by ID
 */
exports.getPincodeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pincode = await Pincode.findById(id).lean();

  if (!pincode) {
    return sendNotFound(res, { message: 'Pincode not found' });
  }

  sendSuccess(res, {
    data: pincode,
    message: 'Pincode retrieved successfully',
  });
});

/**
 * Create pincode
 */
exports.createPincode = asyncHandler(async (req, res) => {
  const { pincode, shippingCharge, status = 'active', description } = req.body;

  if (!pincode || shippingCharge === undefined) {
    return sendError(res, {
      message: 'Pincode and shipping charge are required',
      statusCode: 400,
    });
  }

  if (!/^\d{6}$/.test(pincode)) {
    return sendError(res, {
      message: 'Pincode must be exactly 6 digits',
      statusCode: 400,
    });
  }

  if (shippingCharge < 0) {
    return sendError(res, {
      message: 'Shipping charge cannot be negative',
      statusCode: 400,
    });
  }

  // Check if pincode already exists
  const existingPincode = await Pincode.findOne({ pincode });

  if (existingPincode) {
    return sendError(res, {
      message: 'Pincode already exists',
      statusCode: 400,
    });
  }

  const newPincode = await Pincode.create({
    pincode: pincode.trim(),
    shippingCharge,
    status,
    description: description?.trim(),
  });

  // Mark related notifications as resolved
  await PincodeNotification.updateMany(
    { pincode: newPincode.pincode, status: 'pending' },
    { status: 'resolved', resolvedAt: new Date() }
  );

  sendSuccess(res, {
    data: newPincode,
    message: 'Pincode created successfully',
    statusCode: 201,
  });
});

/**
 * Update pincode
 */
exports.updatePincode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { shippingCharge, status, description } = req.body;

  const pincode = await Pincode.findById(id);

  if (!pincode) {
    return sendNotFound(res, { message: 'Pincode not found' });
  }

  if (shippingCharge !== undefined) {
    if (shippingCharge < 0) {
      return sendError(res, {
        message: 'Shipping charge cannot be negative',
        statusCode: 400,
      });
    }
    pincode.shippingCharge = shippingCharge;
  }

  if (status) {
    pincode.status = status;
  }

  if (description !== undefined) {
    pincode.description = description?.trim();
  }

  await pincode.save();

  sendSuccess(res, {
    data: pincode,
    message: 'Pincode updated successfully',
  });
});

/**
 * Delete pincode
 */
exports.deletePincode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pincode = await Pincode.findByIdAndDelete(id);

  if (!pincode) {
    return sendNotFound(res, { message: 'Pincode not found' });
  }

  sendSuccess(res, {
    message: 'Pincode deleted successfully',
  });
});

/**
 * Get pending notifications for missing pincodes
 */
exports.getPendingNotifications = asyncHandler(async (req, res) => {
  const notifications = await PincodeNotification.find({ status: 'pending' })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, {
    data: notifications,
    message: 'Pending notifications retrieved successfully',
  });
});

/**
 * Check if pincode exists and create notification if not
 */
exports.checkPincode = asyncHandler(async (req, res) => {
  const { pincode, userId, userEmail } = req.body;

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return sendError(res, {
      message: 'Valid 6-digit pincode is required',
      statusCode: 400,
    });
  }

  const pincodeData = await Pincode.findOne({ pincode, status: 'active' });

  if (pincodeData) {
    return sendSuccess(res, {
      data: {
        exists: true,
        shippingCharge: pincodeData.shippingCharge,
        pincode: pincodeData.pincode,
      },
      message: 'Pincode is available for shipping',
    });
  }

  // Pincode doesn't exist - create notification
  await PincodeNotification.findOneAndUpdate(
    { pincode, status: 'pending' },
    {
      pincode,
      userId: userId || null,
      userEmail: userEmail || null,
      status: 'pending',
    },
    { upsert: true, new: true }
  );

  return sendSuccess(res, {
    data: {
      exists: false,
      shippingCharge: null,
      pincode,
    },
    message: 'Pincode not available for shipping. Admin has been notified.',
  });
});

