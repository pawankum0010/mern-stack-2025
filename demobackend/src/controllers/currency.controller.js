const Currency = require('../models/currency.model');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all currencies
 */
exports.getAllCurrencies = asyncHandler(async (req, res) => {
  const currencies = await Currency.find().sort({ isDefault: -1, name: 1 });
  res.json({
    success: true,
    data: currencies,
  });
});

/**
 * Get active currencies
 */
exports.getActiveCurrencies = asyncHandler(async (req, res) => {
  const currencies = await Currency.find({ isActive: true }).sort({ isDefault: -1, name: 1 });
  res.json({
    success: true,
    data: currencies,
  });
});

/**
 * Get default currency
 */
exports.getDefaultCurrency = asyncHandler(async (req, res) => {
  let currency = await Currency.findOne({ isDefault: true, isActive: true });
  
  // If no default currency, get first active currency
  if (!currency) {
    currency = await Currency.findOne({ isActive: true });
  }
  
  // If still no currency, return USD as fallback
  if (!currency) {
    currency = {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      position: 'before',
      decimalPlaces: 2,
      isDefault: true,
    };
  }
  
  res.json({
    success: true,
    data: currency,
  });
});

/**
 * Get currency by ID
 */
exports.getCurrencyById = asyncHandler(async (req, res) => {
  const currency = await Currency.findById(req.params.id);
  
  if (!currency) {
    return res.status(404).json({
      success: false,
      message: 'Currency not found',
    });
  }
  
  res.json({
    success: true,
    data: currency,
  });
});

/**
 * Create currency
 */
exports.createCurrency = asyncHandler(async (req, res) => {
  const { code, name, symbol, position, decimalPlaces, isDefault, isActive } = req.body;
  
  // Check if currency code already exists
  const existingCurrency = await Currency.findOne({ code: code.toUpperCase() });
  if (existingCurrency) {
    return res.status(400).json({
      success: false,
      message: 'Currency code already exists',
    });
  }
  
  const currency = await Currency.create({
    code: code.toUpperCase(),
    name,
    symbol,
    position: position || 'before',
    decimalPlaces: decimalPlaces || 2,
    isDefault: isDefault || false,
    isActive: isActive !== undefined ? isActive : true,
  });
  
  res.status(201).json({
    success: true,
    message: 'Currency created successfully',
    data: currency,
  });
});

/**
 * Update currency
 */
exports.updateCurrency = asyncHandler(async (req, res) => {
  const { name, symbol, position, decimalPlaces, isDefault, isActive } = req.body;
  
  const currency = await Currency.findById(req.params.id);
  
  if (!currency) {
    return res.status(404).json({
      success: false,
      message: 'Currency not found',
    });
  }
  
  // Update fields
  if (name !== undefined) currency.name = name;
  if (symbol !== undefined) currency.symbol = symbol;
  if (position !== undefined) currency.position = position;
  if (decimalPlaces !== undefined) currency.decimalPlaces = decimalPlaces;
  if (isDefault !== undefined) currency.isDefault = isDefault;
  if (isActive !== undefined) currency.isActive = isActive;
  
  await currency.save();
  
  res.json({
    success: true,
    message: 'Currency updated successfully',
    data: currency,
  });
});

/**
 * Delete currency
 */
exports.deleteCurrency = asyncHandler(async (req, res) => {
  const currency = await Currency.findById(req.params.id);
  
  if (!currency) {
    return res.status(404).json({
      success: false,
      message: 'Currency not found',
    });
  }
  
  // Prevent deleting default currency
  if (currency.isDefault) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete default currency. Please set another currency as default first.',
    });
  }
  
  await currency.deleteOne();
  
  res.json({
    success: true,
    message: 'Currency deleted successfully',
  });
});

/**
 * Set default currency
 */
exports.setDefaultCurrency = asyncHandler(async (req, res) => {
  const currency = await Currency.findById(req.params.id);
  
  if (!currency) {
    return res.status(404).json({
      success: false,
      message: 'Currency not found',
    });
  }
  
  if (!currency.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cannot set inactive currency as default',
    });
  }
  
  // Unset all other defaults
  await Currency.updateMany(
    { _id: { $ne: currency._id } },
    { isDefault: false }
  );
  
  currency.isDefault = true;
  await currency.save();
  
  res.json({
    success: true,
    message: 'Default currency updated successfully',
    data: currency,
  });
});

