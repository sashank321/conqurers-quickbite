const { prisma } = require('../config/db');
const generateOrderNumber = require('../utils/generateOrderNumber');

const VALID_TRANSITIONS = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

// Helper to format order response
const formatOrderResponse = (order) => {
  return {
    ...order,
    _id: order.id,
    user: { ...order.user, _id: order.user?.id }
  };
};

// @desc    Create a new order from current student's cart
// @route   POST /api/orders
// @access  Private (Student)
const createOrder = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;
    const userId = req.user.id;

    if (!paymentMethod || !['CASH', 'UPI', 'CARD'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payment method (CASH, UPI, CARD) is required' });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot place an order with an empty cart' });
    }

    // Use Prisma Interactive Transaction for atomic order creation and stock decrements
    const newOrder = await prisma.$transaction(async (tx) => {
      const orderItems = [];
      let totalAmount = 0;

      for (const item of cart.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (!product) throw new Error('One or more products in your cart no longer exist');
        if (!product.available) throw new Error(`Product "${item.product.name}" is no longer available`);
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`);
        }

        const itemSubtotal = product.price * item.quantity;
        totalAmount += itemSubtotal;

        orderItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          subtotal: itemSubtotal
        });

        // Decrement stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      let orderNumber;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 5) {
        orderNumber = generateOrderNumber();
        const existingOrder = await tx.order.findUnique({ where: { orderNumber } });
        if (!existingOrder) {
          isUnique = true;
        }
        attempts++;
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PLACED',
          paymentMethod,
          totalAmount,
          items: { create: orderItems }
        },
        include: { items: true, user: { select: { id: true, name: true, email: true } } }
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: formatOrderResponse(newOrder)
    });
  } catch (error) {
    if (error.message.includes('Insufficient stock') || error.message.includes('no longer exist') || error.message.includes('no longer available')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get logged in student's orders
// @route   GET /api/orders/myorders
// @access  Private (Student)
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders.map(formatOrderResponse)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private (Admin)
const getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders.map(formatOrderResponse)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({ where: { id }, include: { items: true, user: { select: { id: true, name: true, email: true } } } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = order.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];

    if (!allowedTransitions || !allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true, user: { select: { id: true, name: true, email: true } } }
    });

    return res.status(200).json({
      success: true,
      data: formatOrderResponse(updatedOrder)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, user: { select: { id: true, name: true, email: true } } }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    return res.status(200).json({
      success: true,
      data: formatOrderResponse(order)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin analytics dashboard
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({ include: { items: true } });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, order) => {
      if (order.status !== 'CANCELLED') return acc + order.totalAmount;
      return acc;
    }, 0);

    const todayOrdersCount = orders.filter(o => new Date(o.createdAt) >= today).length;
    const todayRevenue = orders
      .filter(o => new Date(o.createdAt) >= today && o.status !== 'CANCELLED')
      .reduce((acc, o) => acc + o.totalAmount, 0);

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const productSales = {};
    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        order.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.name, sold: 0, revenue: 0 };
          }
          productSales[item.productId].sold += item.quantity;
          productSales[item.productId].revenue += item.subtotal;
        });
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        todayOrders: todayOrdersCount,
        todayRevenue,
        ordersByStatus: statusCounts,
        topProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getAnalytics
};
