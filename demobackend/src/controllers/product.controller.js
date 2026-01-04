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
    images: imagesFromBody,
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

  // Handle uploaded files - convert to base64 strings for MongoDB storage
  let imageBase64Array = [];
  if (req.files && req.files.length > 0) {
    // Convert each file buffer to base64 string
    imageBase64Array = req.files.map((file) => {
      const base64 = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    });
  } else if (imagesFromBody) {
    // Support both file uploads and base64 strings (for direct base64 submission)
    if (Array.isArray(imagesFromBody)) {
      imageBase64Array = imagesFromBody;
    } else {
      imageBase64Array = [imagesFromBody];
    }
  }

  // Parse tags if it's a string
  let parsedTags = [];
  if (tags) {
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map((tag) => tag.trim()).filter((tag) => tag);
    } else if (Array.isArray(tags)) {
      parsedTags = tags;
    }
  }

  // Parse dimensions if provided
  let parsedDimensions = undefined;
  if (dimensions) {
    if (typeof dimensions === 'string') {
      try {
        parsedDimensions = JSON.parse(dimensions);
      } catch (e) {
        // If parsing fails, try to construct from separate fields
        parsedDimensions = dimensions;
      }
    } else {
      parsedDimensions = dimensions;
    }
  }

  // Parse specifications if provided
  let parsedSpecifications = {};
  if (req.body.specifications) {
    if (typeof req.body.specifications === 'string') {
      try {
        parsedSpecifications = JSON.parse(req.body.specifications);
      } catch (e) {
        parsedSpecifications = {};
      }
    } else {
      parsedSpecifications = req.body.specifications;
    }
  }

  const productData = {
    name,
    description,
    price: Number(price),
    compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
    sku,
    category: category || undefined,
    tags: parsedTags,
    images: imageBase64Array,
    stock: stock !== undefined ? Number(stock) : 0,
    status: status || 'active',
    featured: featured === true || featured === 'true',
    weight: weight ? Number(weight) : undefined,
    weightUnit: req.body.weightUnit || 'kg',
    dimensions: parsedDimensions,
    dimensionUnit: req.body.dimensionUnit || 'cm',
    vendor: vendor || undefined,
    brand: req.body.brand || undefined,
    color: req.body.color || undefined,
    size: req.body.size || undefined,
    material: req.body.material || undefined,
    specifications: parsedSpecifications,
    warranty: req.body.warranty || undefined,
    shippingInfo: req.body.shippingInfo || undefined,
    returnPolicy: req.body.returnPolicy || undefined,
    seo: seo ? (typeof seo === 'string' ? JSON.parse(seo) : seo) : undefined,
  };

  const product = await Product.create(productData);
  await product.populate('category', 'name');
  await product.populate('vendor', 'name');
  await product.populate('weightUnit', 'name code symbol');
  await product.populate('size', 'name code');

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

  // Handle category filter - search by category name or ID
  if (category) {
    const Category = require('../models/category.model');
    if (mongoose.Types.ObjectId.isValid(category)) {
      // If it's a valid ObjectId, use it directly
      query.category = category;
    } else {
      // Search for categories by name (case-insensitive partial match)
      const matchingCategories = await Category.find({
        name: { $regex: category, $options: 'i' }
      }).select('_id').lean();
      
      if (matchingCategories.length > 0) {
        // Use the found category IDs
        query.category = { $in: matchingCategories.map(cat => cat._id) };
      } else {
        // No matching categories found, return empty result
        query.category = { $in: [] };
      }
    }
  }

  if (status) {
    query.status = status;
  }

  if (featured !== undefined) {
    query.featured = featured === 'true';
  }

  // Handle search - use regex on name and description instead of $text
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
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

  // Fetch products without populate first to avoid ObjectId casting errors
  let products = await Product.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .lean();
  
  // Manually populate only valid ObjectIds (in parallel for better performance)
  const Category = require('../models/category.model');
  const Vendor = require('../models/vendor.model');
  const WeightUnit = require('../models/weightUnit.model');
  const Size = require('../models/size.model');
  
  // Collect unique IDs
  const categoryIds = new Set();
  const vendorIds = new Set();
  const weightUnitIds = new Set();
  const sizeIds = new Set();
  
  products.forEach((product) => {
    if (product.category && mongoose.Types.ObjectId.isValid(product.category)) {
      categoryIds.add(product.category.toString());
    }
    if (product.vendor && mongoose.Types.ObjectId.isValid(product.vendor)) {
      vendorIds.add(product.vendor.toString());
    }
    if (product.weightUnit && mongoose.Types.ObjectId.isValid(product.weightUnit)) {
      weightUnitIds.add(product.weightUnit.toString());
    }
    if (product.size && mongoose.Types.ObjectId.isValid(product.size)) {
      sizeIds.add(product.size.toString());
    }
  });
  
  // Fetch all related data in parallel
  const [categories, vendors, weightUnits, sizes] = await Promise.all([
    categoryIds.size > 0
      ? Category.find({ _id: { $in: Array.from(categoryIds) } }).select('name').lean()
      : [],
    vendorIds.size > 0
      ? Vendor.find({ _id: { $in: Array.from(vendorIds) } }).select('name').lean()
      : [],
    weightUnitIds.size > 0
      ? WeightUnit.find({ _id: { $in: Array.from(weightUnitIds) } }).select('name code symbol').lean()
      : [],
    sizeIds.size > 0
      ? Size.find({ _id: { $in: Array.from(sizeIds) } }).select('name code').lean()
      : [],
  ]);
  
  // Create lookup maps
  const categoryMap = new Map(categories.map((cat) => [cat._id.toString(), cat]));
  const vendorMap = new Map(vendors.map((ven) => [ven._id.toString(), ven]));
  const weightUnitMap = new Map(weightUnits.map((wu) => [wu._id.toString(), wu]));
  const sizeMap = new Map(sizes.map((s) => [s._id.toString(), s]));
  
  // Populate products
  products.forEach((product) => {
    if (product.category && mongoose.Types.ObjectId.isValid(product.category)) {
      const category = categoryMap.get(product.category.toString());
      if (category) {
        product.category = category;
      }
    }
    if (product.vendor && mongoose.Types.ObjectId.isValid(product.vendor)) {
      const vendor = vendorMap.get(product.vendor.toString());
      if (vendor) {
        product.vendor = vendor;
      }
    }
    if (product.weightUnit && mongoose.Types.ObjectId.isValid(product.weightUnit)) {
      const weightUnit = weightUnitMap.get(product.weightUnit.toString());
      if (weightUnit) {
        product.weightUnit = weightUnit;
      }
    }
    if (product.size && mongoose.Types.ObjectId.isValid(product.size)) {
      const size = sizeMap.get(product.size.toString());
      if (size) {
        product.size = size;
      }
    }
  });
  
  const total = await Product.countDocuments(query);

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

  const product = await Product.findById(id)
    .populate('category', 'name')
    .populate('vendor', 'name')
    .populate('weightUnit', 'name code symbol')
    .populate('size', 'name code');

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

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid product id', statusCode: 400 });
  }

  // Get existing product
  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    return sendNotFound(res, { message: 'Product not found' });
  }

  const updates = { ...req.body };

  // Handle uploaded files - convert to base64 strings
  if (req.files && req.files.length > 0) {
    const newImageBase64Array = req.files.map((file) => {
      const base64 = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    });
    
    // If new images are uploaded, replace old ones
    if (updates.replaceImages !== 'false') {
      updates.images = newImageBase64Array;
    } else {
      // Append to existing images
      const existingImages = existingProduct.images || [];
      updates.images = [...existingImages, ...newImageBase64Array];
    }
  } else if (updates.images !== undefined) {
    // Handle explicit images array (could be base64 strings or empty array)
    if (Array.isArray(updates.images)) {
      updates.images = updates.images;
    } else if (typeof updates.images === 'string') {
      try {
        // Try to parse as JSON
        const parsedImages = JSON.parse(updates.images);
        if (Array.isArray(parsedImages)) {
          updates.images = parsedImages;
        }
      } catch (e) {
        // Not JSON, treat as single base64 string
        updates.images = [updates.images];
      }
    }
  }
  
  // If no images field in updates and no files uploaded, keep existing images
  if (!updates.images && (!req.files || req.files.length === 0)) {
    // Don't update images field - keep existing
  }

  // Parse tags if it's a string
  if (updates.tags) {
    if (typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag);
    } else if (!Array.isArray(updates.tags)) {
      updates.tags = [];
    }
  }

  // Handle other fields
  if (updates.price !== undefined) {
    updates.price = Number(updates.price);
    if (updates.price < 0) {
      return sendError(res, {
        message: 'Price cannot be negative',
        statusCode: 400,
      });
    }
  }

  if (updates.stock !== undefined) {
    updates.stock = Number(updates.stock);
    if (updates.stock < 0) {
      return sendError(res, {
        message: 'Stock cannot be negative',
        statusCode: 400,
      });
    }
  }

  // Parse dimensions
  if (updates.dimensions && typeof updates.dimensions === 'string') {
    try {
      updates.dimensions = JSON.parse(updates.dimensions);
    } catch (e) {
      // Keep as is if parsing fails
    }
  }

  // Parse specifications
  if (updates.specifications && typeof updates.specifications === 'string') {
    try {
      updates.specifications = JSON.parse(updates.specifications);
    } catch (e) {
      updates.specifications = {};
    }
  }

  // Parse SEO
  if (updates.seo && typeof updates.seo === 'string') {
    try {
      updates.seo = JSON.parse(updates.seo);
    } catch (e) {
      // Keep as is if parsing fails
    }
  }

  // Convert featured to boolean
  if (updates.featured !== undefined) {
    updates.featured = updates.featured === true || updates.featured === 'true';
  }

  // Remove replaceImages from updates (it's just a flag)
  delete updates.replaceImages;

  const product = await Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('category', 'name')
    .populate('vendor', 'name')
    .populate('weightUnit', 'name code symbol')
    .populate('size', 'name code');

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

  const product = await Product.findById(id);
  
  if (!product) {
    return sendNotFound(res, { message: 'Product not found' });
  }

  // Images are stored in MongoDB, so no file deletion needed
  // MongoDB will automatically clean up when document is deleted

  await Product.findByIdAndDelete(id);

  sendSuccess(res, {
    data: null,
    message: 'Product deleted successfully',
  });
});

