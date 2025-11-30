const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');

/**
 * Get active users report with their orders
 * Query params: userId, startDate, endDate, status
 */
exports.getActiveUsersReport = async (req, res) => {
  try {
    const { userId, startDate, endDate, status, page = 1, limit = 10 } = req.query;

    // Build query for orders
    const orderQuery = {};
    
    if (userId) {
      // Check if userId is ObjectId or email
      const user = await User.findOne({
        $or: [
          { _id: userId },
          { email: userId }
        ]
      });
      if (user) {
        orderQuery.user = user._id;
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    if (startDate || endDate) {
      orderQuery.createdAt = {};
      if (startDate) {
        orderQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        orderQuery.createdAt.$lte = new Date(endDate);
      }
    }

    if (status) {
      orderQuery.status = status;
    }

    // Get users who have placed orders
    const orders = await Order.find(orderQuery)
      .populate('user', 'name email phone role')
      .sort({ createdAt: -1 })
      .lean();

    // Filter out orders without valid user
    const validOrders = orders.filter(order => order.user && order.user._id);

    // Group orders by user
    const userOrderMap = new Map();
    
    validOrders.forEach(order => {
      const userId = order.user._id.toString();
      if (!userOrderMap.has(userId)) {
        userOrderMap.set(userId, {
          user: order.user,
          orders: [],
          totalOrders: 0,
          totalAmount: 0,
          lastOrderDate: null,
        });
      }
      
      const userData = userOrderMap.get(userId);
      userData.orders.push({
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        itemsCount: order.items.length,
      });
      userData.totalOrders += 1;
      userData.totalAmount += order.total;
      
      if (!userData.lastOrderDate || order.createdAt > userData.lastOrderDate) {
        userData.lastOrderDate = order.createdAt;
      }
    });

    // Convert map to array and sort by total amount or last order date
    let usersData = Array.from(userOrderMap.values());
    usersData = usersData.sort((a, b) => b.totalAmount - a.totalAmount);

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = usersData.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: usersData.length,
        pages: Math.ceil(usersData.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching active users report:', error);
    res.status(500).json({ message: 'Error fetching active users report', error: error.message });
  }
};

/**
 * Get highest selling products report
 * Query params: startDate, endDate, limit
 */
exports.getHighestSellingProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;

    // Build query for orders
    const orderQuery = { status: { $ne: 'cancelled' } };
    
    if (startDate || endDate) {
      orderQuery.createdAt = {};
      if (startDate) {
        orderQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        orderQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Get all orders in the date range
    const orders = await Order.find(orderQuery)
      .populate('items.product', 'name sku images')
      .lean();

    // Aggregate product sales
    const productSalesMap = new Map();

    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product?._id?.toString() || item.product?.toString();
        const productName = item.product?.name || item.name || 'Unknown Product';
        
        if (!productSalesMap.has(productId)) {
          productSalesMap.set(productId, {
            productId,
            productName,
            productSku: item.product?.sku || 'N/A',
            productImage: item.product?.images?.[0] || null,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            averagePrice: 0,
          });
        }

        const productData = productSalesMap.get(productId);
        productData.totalQuantity += item.quantity;
        productData.totalRevenue += item.total;
        productData.orderCount += 1;
      });
    });

    // Calculate average price and convert to array
    let productsData = Array.from(productSalesMap.values()).map(product => ({
      ...product,
      averagePrice: product.totalQuantity > 0 ? product.totalRevenue / product.totalQuantity : 0,
    }));

    // Sort by total revenue (highest first)
    productsData = productsData.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Limit results
    const topProducts = productsData.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: topProducts,
      summary: {
        totalProducts: productsData.length,
        totalRevenue: productsData.reduce((sum, p) => sum + p.totalRevenue, 0),
        totalQuantity: productsData.reduce((sum, p) => sum + p.totalQuantity, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching highest selling products:', error);
    res.status(500).json({ message: 'Error fetching highest selling products', error: error.message });
  }
};

/**
 * Get orders report grouped by status
 * Query params: startDate, endDate
 */
exports.getOrdersStatusReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build query
    const query = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get all orders with user information
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .lean();

    // Group by status
    const statusMap = {
      pending: { count: 0, totalAmount: 0, orders: [] },
      approved: { count: 0, totalAmount: 0, orders: [] },
      processing: { count: 0, totalAmount: 0, orders: [] },
      shipped: { count: 0, totalAmount: 0, orders: [] },
      delivered: { count: 0, totalAmount: 0, orders: [] },
      cancelled: { count: 0, totalAmount: 0, orders: [] },
    };

    orders.forEach(order => {
      const status = order.status || 'pending';
      if (statusMap[status]) {
        statusMap[status].count += 1;
        statusMap[status].totalAmount += order.total;
        statusMap[status].orders.push({
          orderNumber: order.orderNumber,
          user: order.user || { name: 'N/A', email: 'N/A' },
          total: order.total,
          createdAt: order.createdAt,
          itemsCount: order.items.length,
        });
      }
    });

    // Convert to array format
    const statusReport = Object.keys(statusMap).map(status => ({
      status,
      count: statusMap[status].count,
      totalAmount: statusMap[status].totalAmount,
      percentage: orders.length > 0 ? ((statusMap[status].count / orders.length) * 100).toFixed(2) : 0,
      orders: statusMap[status].orders,
    }));

    // Calculate totals
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);

    res.json({
      success: true,
      data: statusReport,
      summary: {
        totalOrders,
        totalAmount,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching orders status report:', error);
    res.status(500).json({ message: 'Error fetching orders status report', error: error.message });
  }
};

