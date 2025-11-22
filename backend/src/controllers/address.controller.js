const Address = require('../models/address.model');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

// Get all addresses for authenticated user
exports.getMyAddresses = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const query = { user: req.user.id };
  if (type && (type === 'shipping' || type === 'billing')) {
    query.type = type;
  }

  const addresses = await Address.find(query).sort({ isDefault: -1, createdAt: -1 });

  sendSuccess(res, {
    data: addresses,
    message: 'Addresses retrieved successfully',
  });
});

// Get single address by ID
exports.getAddressById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const address = await Address.findOne({
    _id: id,
    user: req.user.id,
  });

  if (!address) {
    return sendNotFound(res, { message: 'Address not found' });
  }

  sendSuccess(res, {
    data: address,
    message: 'Address retrieved successfully',
  });
});

// Create new address
exports.createAddress = asyncHandler(async (req, res) => {
  const { type, isDefault, label, name, phone, line1, line2, city, state, postalCode, country } = req.body;

  // Validate required fields
  if (!type || (type !== 'shipping' && type !== 'billing')) {
    return sendError(res, { message: 'Address type must be shipping or billing' }, 400);
  }

  if (!name || !line1 || !city || !state || !postalCode || !country) {
    return sendError(res, { message: 'Required fields: name, line1, city, state, postalCode, country' }, 400);
  }

  // If setting as default, unset other defaults of the same type
  if (isDefault) {
    await Address.updateMany(
      {
        user: req.user.id,
        type: type,
        isDefault: true,
      },
      { $set: { isDefault: false } }
    );
  }

  const address = await Address.create({
    user: req.user.id,
    type,
    isDefault: isDefault || false,
    label: label || 'Home',
    name,
    phone,
    line1,
    line2,
    city,
    state,
    postalCode,
    country,
  });

  sendSuccess(res, {
    data: address,
    message: 'Address created successfully',
  }, 201);
});

// Update address
exports.updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, isDefault, label, name, phone, line1, line2, city, state, postalCode, country } = req.body;

  const address = await Address.findOne({
    _id: id,
    user: req.user.id,
  });

  if (!address) {
    return sendNotFound(res, { message: 'Address not found' });
  }

  // If setting as default, unset other defaults of the same type
  if (isDefault && !address.isDefault) {
    await Address.updateMany(
      {
        user: req.user.id,
        type: address.type,
        _id: { $ne: id },
        isDefault: true,
      },
      { $set: { isDefault: false } }
    );
  }

  // Update fields
  if (type !== undefined) address.type = type;
  if (isDefault !== undefined) address.isDefault = isDefault;
  if (label !== undefined) address.label = label;
  if (name !== undefined) address.name = name;
  if (phone !== undefined) address.phone = phone;
  if (line1 !== undefined) address.line1 = line1;
  if (line2 !== undefined) address.line2 = line2;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (postalCode !== undefined) address.postalCode = postalCode;
  if (country !== undefined) address.country = country;

  await address.save();

  sendSuccess(res, {
    data: address,
    message: 'Address updated successfully',
  });
});

// Delete address
exports.deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const address = await Address.findOne({
    _id: id,
    user: req.user.id,
  });

  if (!address) {
    return sendNotFound(res, { message: 'Address not found' });
  }

  await address.deleteOne();

  sendSuccess(res, {
    message: 'Address deleted successfully',
  });
});

// Set default address
exports.setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const address = await Address.findOne({
    _id: id,
    user: req.user.id,
  });

  if (!address) {
    return sendNotFound(res, { message: 'Address not found' });
  }

  // Unset other defaults of the same type
  await Address.updateMany(
    {
      user: req.user.id,
      type: address.type,
      _id: { $ne: id },
      isDefault: true,
    },
    { $set: { isDefault: false } }
  );

  address.isDefault = true;
  await address.save();

  sendSuccess(res, {
    data: address,
    message: 'Default address set successfully',
  });
});

