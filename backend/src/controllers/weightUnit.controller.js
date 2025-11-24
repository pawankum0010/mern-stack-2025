const WeightUnit = require('../models/weightUnit.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

/**
 * Get all weight units
 */
exports.getWeightUnits = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { symbol: { $regex: search, $options: 'i' } },
    ];
  }

  const weightUnits = await WeightUnit.find(query)
    .sort({ name: 1 })
    .lean();

  sendSuccess(res, {
    data: weightUnits,
    message: 'Weight units retrieved successfully',
  });
});

/**
 * Get weight unit by ID
 */
exports.getWeightUnitById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const weightUnit = await WeightUnit.findById(id).lean();

  if (!weightUnit) {
    return sendNotFound(res, { message: 'Weight unit not found' });
  }

  sendSuccess(res, {
    data: weightUnit,
    message: 'Weight unit retrieved successfully',
  });
});

/**
 * Create weight unit
 */
exports.createWeightUnit = asyncHandler(async (req, res) => {
  const { name, code, symbol, status = 'active' } = req.body;

  if (!name || !code) {
    return sendError(res, {
      message: 'Name and code are required',
      statusCode: 400,
    });
  }

  // Check if weight unit with same name or code already exists
  const existingWeightUnit = await WeightUnit.findOne({
    $or: [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }, { code: code.toUpperCase() }],
  });

  if (existingWeightUnit) {
    return sendError(res, {
      message: 'Weight unit with this name or code already exists',
      statusCode: 400,
    });
  }

  const weightUnit = await WeightUnit.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    symbol: symbol?.trim() || '',
    status,
  });

  sendSuccess(res, {
    data: weightUnit,
    message: 'Weight unit created successfully',
    statusCode: 201,
  });
});

/**
 * Update weight unit
 */
exports.updateWeightUnit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, symbol, status } = req.body;

  const weightUnit = await WeightUnit.findById(id);

  if (!weightUnit) {
    return sendNotFound(res, { message: 'Weight unit not found' });
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
      const existingWeightUnit = await WeightUnit.findOne(duplicateQuery);
      if (existingWeightUnit) {
        return sendError(res, {
          message: 'Weight unit with this name or code already exists',
          statusCode: 400,
        });
      }
    }
  }

  if (name) weightUnit.name = name.trim();
  if (code) weightUnit.code = code.toUpperCase().trim();
  if (symbol !== undefined) weightUnit.symbol = symbol?.trim() || '';
  if (status) weightUnit.status = status;

  await weightUnit.save();

  sendSuccess(res, {
    data: weightUnit,
    message: 'Weight unit updated successfully',
  });
});

/**
 * Delete weight unit
 */
exports.deleteWeightUnit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const weightUnit = await WeightUnit.findByIdAndDelete(id);

  if (!weightUnit) {
    return sendNotFound(res, { message: 'Weight unit not found' });
  }

  sendSuccess(res, {
    message: 'Weight unit deleted successfully',
  });
});

