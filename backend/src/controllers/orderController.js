const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const generateOrderNumber = require('../utils/generateOrderNumber');

const VALID_TRANSITIONS = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

// @desc    Create a new order from current student's cart
// @route   POST /api/orders
// @access  Private (Student)
const createOrder = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;

    if (!paymentMethod || !['CASH', 'UPI', 'CARD'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment method (CASH, UPI, CARD) is required'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot place an order with an empty cart'
      });
    }

    const orderItems = [];
    let totalAmount = 0;
    const stockDecrementsToRollback = [];

    // Step 1: Validate all items & stock requirements first
    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'One or more products in your cart no longer exist'
        });
      }

      if (!product.available) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is no longer available`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`
        });
      }

      const itemPrice = Number(product.price);
      const itemSubtotal = itemPrice * item.quantity;
      totalAmount += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    // Step 2: Perform atomic conditional stock decrements
    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback stock for previously decremented items
        for (const rollbackItem of stockDecrementsToRollback) {
          await Product.findByIdAndUpdate(rollbackItem.product, {
            $inc: { stock: rollbackItem.quantity }
          });
        }

        return res.status(400).json({
          success: false,
          message: `Failed to secure stock for "${item.name}". Stock may have changed.`
        });
      }

      stockDecrementsToRollback.push({
        product: item.product,
        quantity: item.quantity
      });
    }

    // Step 3: Create Order document
    let orderNumber;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      orderNumber = generateOrderNumber();
      const existingOrder = await Order.findOne({ orderNumber });
      if (!existingOrder) {
        isUnique = true;
      }
      attempts++;
    }

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      totalAmount,
      status: 'PLACED',
      paymentMethod
    });

    // Step 4: Clear student cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated student's orders
// @route   GET /api/orders
// @access  Private (Student)
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated student's specific order
// @route   GET /api/orders/:id
// @access  Private (Student)
const getMyOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view another student\'s order'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details by ID (Admin)
// @route   GET /api/admin/orders/:id
// @access  Private (Admin)
const getAdminOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status with state machine transition rules (Admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const currentStatus = order.status;

    // Check if status is same
    if (currentStatus === status) {
      return res.status(200).json({
        success: true,
        message: `Order is already in status "${status}"`,
        data: order
      });
    }

    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${currentStatus}" to "${status}". Allowed transitions: [${allowedNextStatuses.join(', ')}]`
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin analytics dashboard data
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [allOrders, todayOrders, recentOrders] = await Promise.all([
      Order.find({}),
      Order.find({ createdAt: { $gte: startOfToday } }),
      Order.find({}).populate('user', 'name email').sort({ createdAt: -1 }).limit(10)
    ]);

    const totalRevenue = allOrders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const revenueToday = todayOrders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const ordersByStatus = {};
    allOrders.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    // Top products by quantity sold
    const productMap = {};
    allOrders
      .filter(o => o.status !== 'CANCELLED')
      .forEach(order => {
        order.items.forEach(item => {
          if (!productMap[item.name]) {
            productMap[item.name] = { name: item.name, totalSold: 0, revenue: 0 };
          }
          productMap[item.name].totalSold += item.quantity;
          productMap[item.name].revenue += item.subtotal;
        });
      });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        totalOrders: allOrders.length,
        totalRevenue,
        ordersToday: todayOrders.length,
        revenueToday,
        ordersByStatus,
        topProducts,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  getAnalytics
};
