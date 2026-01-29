const SiteSettings = require('../models/siteSettings.model');
const SupportRequest = require('../models/supportRequest.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSupportRequestEmail } = require('../utils/email');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

/**
 * Get site settings (public route)
 */
exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  res.json({
    success: true,
    data: settings,
  });
});

/**
 * Get site settings for admin
 */
exports.getAdminSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  res.json({
    success: true,
    data: settings,
  });
});

/**
 * Update site settings
 */
exports.updateSettings = asyncHandler(async (req, res) => {
  const {
    contactEmail,
    contactPhone,
    officeAddress,
    officeCity,
    officeState,
    officePostalCode,
    officeCountry,
    businessHours,
    supportMessage,
  } = req.body;

  let settings = await SiteSettings.findOne();

  if (!settings) {
    // Create new settings if none exist
    settings = await SiteSettings.create({
      contactEmail: contactEmail || 'infosoftchilli@gmail.com',
      contactPhone: contactPhone || '+91 9140100018',
      officeAddress: officeAddress || '',
      officeCity: officeCity || '',
      officeState: officeState || '',
      officePostalCode: officePostalCode || '',
      officeCountry: officeCountry || 'India',
      businessHours: businessHours || '',
      supportMessage: supportMessage || "We're here to help! Get in touch with our support team for any questions, concerns, or assistance you may need.",
    });
  } else {
    // Update existing settings
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (officeAddress !== undefined) settings.officeAddress = officeAddress;
    if (officeCity !== undefined) settings.officeCity = officeCity;
    if (officeState !== undefined) settings.officeState = officeState;
    if (officePostalCode !== undefined) settings.officePostalCode = officePostalCode;
    if (officeCountry !== undefined) settings.officeCountry = officeCountry;
    if (businessHours !== undefined) settings.businessHours = businessHours;
    if (supportMessage !== undefined) settings.supportMessage = supportMessage;

    await settings.save();
  }

  res.json({
    success: true,
    message: 'Site settings updated successfully',
    data: settings,
  });
});

/**
 * Submit support request
 */
exports.submitSupportRequest = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return sendError(res, {
      message: 'Name, email, and message are required',
      statusCode: 400,
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, {
      message: 'Please provide a valid email address',
      statusCode: 400,
    });
  }

  // Save support request to database
  const supportRequest = await SupportRequest.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject?.trim() || 'Support Request',
    message: message.trim(),
    status: 'pending',
  });

  // Send email to superadmin (non-blocking)
  console.log('Triggering support request email to superadmin...');
  sendSupportRequestEmail({ name, email, subject, message })
    .then((results) => {
      if (results) {
        console.log('Support request email to superadmin completed.');
      } else {
        console.warn('Support request email to superadmin returned null - check logs above for details.');
      }
    })
    .catch((error) => {
      console.error('❌ Failed to send support request email to superadmin (non-blocking):', {
        customerEmail: email,
        error: error.message,
        stack: error.stack,
      });
    });

  sendSuccess(res, {
    data: supportRequest,
    message: 'Support request submitted successfully. We will get back to you soon!',
    statusCode: 201,
  });
});

/**
 * Get all support requests (Admin only)
 */
exports.getSupportRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const supportRequests = await SupportRequest.find(query)
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await SupportRequest.countDocuments(query);

  sendSuccess(res, {
    data: supportRequests,
    message: 'Support requests retrieved successfully',
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get support request by ID (Admin only)
 */
exports.getSupportRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supportRequest = await SupportRequest.findById(id)
    .populate('resolvedBy', 'name email')
    .lean();

  if (!supportRequest) {
    return sendNotFound(res, { message: 'Support request not found' });
  }

  sendSuccess(res, {
    data: supportRequest,
    message: 'Support request retrieved successfully',
  });
});

/**
 * Update support request status (Admin only)
 */
exports.updateSupportRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const userId = req.user?.id;

  const supportRequest = await SupportRequest.findById(id);

  if (!supportRequest) {
    return sendNotFound(res, { message: 'Support request not found' });
  }

  if (status) {
    if (!['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return sendError(res, {
        message: 'Invalid status. Must be one of: pending, in_progress, resolved, closed',
        statusCode: 400,
      });
    }
    supportRequest.status = status;

    if (status === 'resolved' || status === 'closed') {
      supportRequest.resolvedAt = new Date();
      if (userId) {
        supportRequest.resolvedBy = userId;
      }
    }
  }

  if (adminNotes !== undefined) {
    supportRequest.adminNotes = adminNotes?.trim() || '';
  }

  await supportRequest.save();

  await supportRequest.populate('resolvedBy', 'name email');

  sendSuccess(res, {
    data: supportRequest,
    message: 'Support request updated successfully',
  });
});

/**
 * Delete support request (Admin only)
 */
exports.deleteSupportRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supportRequest = await SupportRequest.findByIdAndDelete(id);

  if (!supportRequest) {
    return sendNotFound(res, { message: 'Support request not found' });
  }

  sendSuccess(res, {
    message: 'Support request deleted successfully',
  });
});

