const mongoose = require('mongoose');

const Product = require('../models/product.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    compareAtPrice,
    sku,
    category,
    tags,
    images,
    stock,
    status,
    featured,
    weight,
    dimensions,
    vendor,
    seo,
  } = req.body;

  if (!name || !price) {
    return sendError(res, {
      message: 'Name and price are required',
      statusCode: 400,
    });
  }

  if (price < 0) {
    return sendError(res, {
      message: 'Price cannot be negative',
      statusCode: 400,
    });
  }

  const productData = {
    name,
    description,
    price,
    compareAtPrice,
    sku,
    category,
    tags: Array.isArray(tags) ? tags : [],
    images: Array.isArray(images) ? images : [],
    stock: stock !== undefined ? stock : 0,
    status: status || 'active',
    featured: featured || false,
    weight,
    dimensions,
    vendor,
    seo,
  };

  const product = await Product.create(productData);

  sendSuccess(res, {
    data: product,
    message: 'Product created successfully',
    statusCode: 201,
  });
});

exports.getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    status,
    featured,
    search,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const query = {};

  if (category) {
    query.category = new RegExp(category, 'i');
  }

  if (status) {
    query.status = status;
  }

  if (featured !== undefined) {
    query.featured = featured === 'true';
  }

  if (search) {
    query.$text = { $search: search };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      query.price.$lte = Number(maxPrice);
    }
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(query),
  ]);

  if (!products.length) {
    return sendNotFound(res, { message: 'No products found' });
  }

  sendSuccess(res, {
    data: products,
    message: 'Products retrieved successfully',
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

exports.getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid product id', statusCode: 400 });
  }

  const product = await Product.findById(id);

  if (!product) {
    return sendNotFound(res, { message: 'Product not found' });
  }

  sendSuccess(res, {
    data: product,
    message: 'Product retrieved successfully',
  });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid product id', statusCode: 400 });
  }

  if (updates.price !== undefined && updates.price < 0) {
    return sendError(res, {
      message: 'Price cannot be negative',
      statusCode: 400,
    });
  }

  if (updates.stock !== undefined && updates.stock < 0) {
    return sendError(res, {
      message: 'Stock cannot be negative',
      statusCode: 400,
    });
  }

  if (updates.tags && !Array.isArray(updates.tags)) {
    updates.tags = [];
  }

  if (updates.images && !Array.isArray(updates.images)) {
    updates.images = [];
  }

  const product = await Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return sendNotFound(res, { message: 'Product not found' });
  }

  sendSuccess(res, {
    data: product,
    message: 'Product updated successfully',
  });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid product id', statusCode: 400 });
  }

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return sendNotFound(res, { message: 'Product not found' });
  }

  sendSuccess(res, {
    data: null,
    message: 'Product deleted successfully',
  });
});

