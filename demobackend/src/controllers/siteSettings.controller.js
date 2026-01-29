const SiteSettings = require('../models/siteSettings.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSupportRequestEmail } = require('../utils/email');

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
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required',
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

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

  res.json({
    success: true,
    message: 'Support request submitted successfully. We will get back to you soon!',
  });
});

