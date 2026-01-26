const mongoose = require('mongoose');

const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const OrderActivityLog = require('../models/orderActivityLog.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const { sendOrderNotificationEmail } = require('../utils/email');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shippingAddress, billingAddress, gstNumber, paymentMethod, notes, tax = 0, shipping } = req.body;

  if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.city) {
    return sendError(res, {
      message: 'Shipping address is required',
      statusCode: 400,
    });
  }

  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || !cart.items.length) {
    return sendError(res, {
      message: 'Cart is empty',
      statusCode: 400,
    });
  }

  // Calculate shipping charge based on shipping address postalCode if not provided
  let shippingCharge = 0;
  if (shipping !== undefined && shipping !== null) {
    // Use provided shipping charge
    shippingCharge = Number(shipping);
  } else {
    // Calculate from shipping address postalCode
    const Pincode = require('../models/pincode.model');
    const postalCode = shippingAddress?.postalCode;
    
    if (postalCode && postalCode.length === 6) {
      try {
        const pincodeData = await Pincode.findOne({ pincode: postalCode, status: 'active' });
        shippingCharge = pincodeData?.shippingCharge || 0;
      } catch (error) {
        // If pincode doesn't exist, shipping is 0
        shippingCharge = 0;
      }
    }
  }

  // Validate products and build order items
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.product._id);
    if (!product || product.status !== 'active') {
      return sendError(res, {
        message: `Product ${cartItem.product.name || cartItem.product._id} is not available`,
        statusCode: 400,
      });
    }

    if (product.stock < cartItem.quantity) {
      return sendError(res, {
        message: `Insufficient stock for ${product.name}`,
        statusCode: 400,
      });
    }

    const itemTotal = cartItem.price * cartItem.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      quantity: cartItem.quantity,
      price: cartItem.price,
      total: itemTotal,
    });
  }

  const total = subtotal + Number(tax) + Number(shippingCharge);

  // Generate order number
  const orderCount = await Order.countDocuments();
  const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(6, '0')}`;

  const order = await Order.create({
    orderNumber,
    user: userId,
    items: orderItems,
    subtotal,
    tax: Number(tax),
    shipping: Number(shippingCharge),
    total,
    shippingAddress,
    billingAddress,
    gstNumber,
    paymentMethod: paymentMethod || 'cash',
    notes,
  });

  // Log order creation
  const User = require('../models/user.model');
  const user = await User.findById(userId);
  await OrderActivityLog.create({
    order: order._id,
    action: 'created',
    performedBy: userId,
    performedByName: user?.name || user?.email || 'System',
    notes: 'Order created by customer',
  });

  // Update product stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  // Populate order with user and product details
  await order.populate('user', 'name email phone address');
  await order.populate('items.product', 'name images description');

  // Get customer details
  const customer = order.user;
  
  // Get product details for email
  const products = order.items.map(item => item.product).filter(Boolean);

  // Send order notification email to superadmin (non-blocking)
  console.log('Triggering order notification email...');
  sendOrderNotificationEmail(order, customer, products)
    .then((results) => {
      if (results) {
        console.log('Order notification email process completed.');
      } else {
        console.warn('Order notification email returned null - check logs above for details.');
      }
    })
    .catch((error) => {
      console.error('❌ Failed to send order notification email (non-blocking):', {
        orderNumber: order.orderNumber,
        error: error.message,
        stack: error.stack,
      });
    });

  sendSuccess(res, {
    data: order,
    message: 'Order placed successfully',
    statusCode: 201,
  });
});

exports.getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, userId } = req.query;
  const requesterRole = req.requesterRole || (typeof req.user.role === 'string' 
    ? req.user.role.toLowerCase() 
    : req.user.role?.name?.toLowerCase() || '');

  const query = {};

  // Customers can only see their own orders
  if (requesterRole === 'customer' || requesterRole === 'support') {
    query.user = req.user.id;
  } else if (userId && (requesterRole === 'admin' || requesterRole === 'superadmin')) {
    query.user = userId;
  }

  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query),
  ]);

  if (!orders.length) {
    return sendNotFound(res, { message: 'No orders found' });
  }

  sendSuccess(res, {
    data: orders,
    message: 'Orders retrieved successfully',
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.requesterRole || (typeof req.user.role === 'string' 
    ? req.user.role.toLowerCase() 
    : req.user.role?.name?.toLowerCase() || '');

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid order id', statusCode: 400 });
  }

  const query = { _id: id };

  // Customers can only see their own orders
  if (requesterRole === 'customer' || requesterRole === 'support') {
    query.user = req.user.id;
  }

  const order = await Order.findOne(query)
    .populate('user', 'name email phone address')
    .populate('items.product', 'name images description')
    .populate('approvedBy', 'name email');

  if (!order) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  sendSuccess(res, {
    data: order,
    message: 'Order retrieved successfully',
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const requesterRole = req.requesterRole || (typeof req.user.role === 'string' 
    ? req.user.role.toLowerCase() 
    : req.user.role?.name?.toLowerCase() || '');

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid order id', statusCode: 400 });
  }

  const validStatuses = ['pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return sendError(res, {
      message: `Status must be one of: ${validStatuses.join(', ')}`,
      statusCode: 400,
    });
  }

  // Only admin/superadmin can update order status
  if (requesterRole !== 'admin' && requesterRole !== 'superadmin') {
    return sendError(res, {
      message: 'You do not have permission to update order status',
      statusCode: 403,
    });
  }

  // Get current order to track status change
  const currentOrder = await Order.findById(id);
  if (!currentOrder) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  const fromStatus = currentOrder.status;
  const updateData = { status };
  if (notes) {
    updateData.notes = notes;
  }

  if (status === 'approved') {
    updateData.approvedBy = req.user.id;
    updateData.approvedAt = new Date();
  }

  const order = await Order.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .populate('approvedBy', 'name email');

  // Log the status change
  const User = require('../models/user.model');
  const performer = await User.findById(req.user.id);
  const actionMap = {
    approved: 'approved',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
  };

  await OrderActivityLog.create({
    order: order._id,
    action: actionMap[status] || 'status_changed',
    fromStatus,
    toStatus: status,
    performedBy: req.user.id,
    performedByName: performer?.name || performer?.email || 'System',
    notes: notes || `Order status changed from ${fromStatus} to ${status}`,
  });

  sendSuccess(res, {
    data: order,
    message: 'Order status updated successfully',
  });
});

exports.getOrderActivityLogs = asyncHandler(async (req, res) => {
  const { id: orderId } = req.params;
  const requesterRole = req.requesterRole || (typeof req.user.role === 'string' 
    ? req.user.role.toLowerCase() 
    : req.user.role?.name?.toLowerCase() || '');

  if (!isValidObjectId(orderId)) {
    return sendError(res, { message: 'Invalid order id', statusCode: 400 });
  }

  // Check if user has access to this order
  const order = await Order.findById(orderId);
  if (!order) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  // Customers can only see their own order logs
  if (requesterRole === 'customer' || requesterRole === 'support') {
    if (order.user.toString() !== req.user.id) {
      return sendError(res, {
        message: 'You do not have permission to view this order activity',
        statusCode: 403,
      });
    }
  }

  const logs = await OrderActivityLog.find({ order: orderId })
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, {
    data: logs,
    message: 'Order activity logs retrieved successfully',
  });
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.requesterRole || (typeof req.user.role === 'string' 
    ? req.user.role.toLowerCase() 
    : req.user.role?.name?.toLowerCase() || '');

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid order id', statusCode: 400 });
  }

  // Only superadmin can delete orders
  if (requesterRole !== 'superadmin') {
    return sendError(res, {
      message: 'You do not have permission to delete orders',
      statusCode: 403,
    });
  }

  const order = await Order.findByIdAndDelete(id);

  if (!order) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  sendSuccess(res, {
    data: null,
    message: 'Order deleted successfully',
  });
});

