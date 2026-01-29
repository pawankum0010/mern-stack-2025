const Brand = require('../models/brand.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

/**
 * Get all brands
 */
exports.getBrands = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const brands = await Brand.find(query)
    .sort({ name: 1 })
    .lean();

  sendSuccess(res, {
    data: brands,
    message: 'Brands retrieved successfully',
  });
});

/**
 * Get brand by ID
 */
exports.getBrandById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const brand = await Brand.findById(id).lean();

  if (!brand) {
    return sendNotFound(res, { message: 'Brand not found' });
  }

  sendSuccess(res, {
    data: brand,
    message: 'Brand retrieved successfully',
  });
});

/**
 * Create brand
 */
exports.createBrand = asyncHandler(async (req, res) => {
  const { name, description, status = 'active' } = req.body;

  if (!name) {
    return sendError(res, {
      message: 'Brand name is required',
      statusCode: 400,
    });
  }

  // Check if brand with same name already exists
  const existingBrand = await Brand.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
  });

  if (existingBrand) {
    return sendError(res, {
      message: 'Brand with this name already exists',
      statusCode: 400,
    });
  }

  const brand = await Brand.create({
    name: name.trim(),
    description: description?.trim() || '',
    status,
  });

  sendSuccess(res, {
    data: brand,
    message: 'Brand created successfully',
    statusCode: 201,
  });
});

/**
 * Update brand
 */
exports.updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  const brand = await Brand.findById(id);

  if (!brand) {
    return sendNotFound(res, { message: 'Brand not found' });
  }

  // Check if updating name would create a duplicate
  if (name) {
    const existingBrand = await Brand.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existingBrand) {
      return sendError(res, {
        message: 'Brand with this name already exists',
        statusCode: 400,
      });
    }
  }

  if (name) brand.name = name.trim();
  if (description !== undefined) brand.description = description?.trim() || '';
  if (status) brand.status = status;

  await brand.save();

  sendSuccess(res, {
    data: brand,
    message: 'Brand updated successfully',
  });
});

/**
 * Delete brand
 */
exports.deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const brand = await Brand.findByIdAndDelete(id);

  if (!brand) {
    return sendNotFound(res, { message: 'Brand not found' });
  }

  sendSuccess(res, {
    message: 'Brand deleted successfully',
  });
});

