const Size = require('../models/size.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

/**
 * Get all sizes
 */
exports.getSizes = asyncHandler(async (req, res) => {
  const { status, category, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  const sizes = await Size.find(query)
    .sort({ name: 1 })
    .lean();

  sendSuccess(res, {
    data: sizes,
    message: 'Sizes retrieved successfully',
  });
});

/**
 * Get size by ID
 */
exports.getSizeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const size = await Size.findById(id).lean();

  if (!size) {
    return sendNotFound(res, { message: 'Size not found' });
  }

  sendSuccess(res, {
    data: size,
    message: 'Size retrieved successfully',
  });
});

/**
 * Create size
 */
exports.createSize = asyncHandler(async (req, res) => {
  const { name, code, category = 'general', status = 'active' } = req.body;

  if (!name || !code) {
    return sendError(res, {
      message: 'Name and code are required',
      statusCode: 400,
    });
  }

  // Check if size with same name or code already exists
  const existingSize = await Size.findOne({
    $or: [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }, { code: code.toUpperCase() }],
  });

  if (existingSize) {
    return sendError(res, {
      message: 'Size with this name or code already exists',
      statusCode: 400,
    });
  }

  const size = await Size.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    category,
    status,
  });

  sendSuccess(res, {
    data: size,
    message: 'Size created successfully',
    statusCode: 201,
  });
});

/**
 * Update size
 */
exports.updateSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, category, status } = req.body;

  const size = await Size.findById(id);

  if (!size) {
    return sendNotFound(res, { message: 'Size not found' });
  }

  // Check if updating name or code would create a duplicate
  if (name || code) {
    const duplicateQuery = {
      _id: { $ne: id },
      $or: [],
    };

    if (name) {
      duplicateQuery.$or.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    }
    if (code) {
      duplicateQuery.$or.push({ code: code.toUpperCase() });
    }

    if (duplicateQuery.$or.length > 0) {
      const existingSize = await Size.findOne(duplicateQuery);
      if (existingSize) {
        return sendError(res, {
          message: 'Size with this name or code already exists',
          statusCode: 400,
        });
      }
    }
  }

  if (name) size.name = name.trim();
  if (code) size.code = code.toUpperCase().trim();
  if (category) size.category = category;
  if (status) size.status = status;

  await size.save();

  sendSuccess(res, {
    data: size,
    message: 'Size updated successfully',
  });
});

/**
 * Delete size
 */
exports.deleteSize = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const size = await Size.findByIdAndDelete(id);

  if (!size) {
    return sendNotFound(res, { message: 'Size not found' });
  }

  sendSuccess(res, {
    message: 'Size deleted successfully',
  });
});

