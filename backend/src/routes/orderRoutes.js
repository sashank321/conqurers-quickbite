const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getAnalytics
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, studentOnly } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validateMiddleware');

const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD'];

const router = express.Router();

// --- Student Order Routes ---
router.post(
  '/',
  [
    protect,
    studentOnly,
    body('paymentMethod')
      .isIn(PAYMENT_METHODS)
      .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`),
    validate
  ],
  createOrder
);

router.get('/', protect, studentOnly, getMyOrders);
router.get('/:id', protect, studentOnly, getOrderById);

// --- Admin Order Routes ---
// Note: Handled by orderRoutes mounted at /api or /api/orders / /api/admin/orders in app.js
// We can define admin routes here or separate them cleanly.
const adminRouter = express.Router();

adminRouter.use(protect, adminOnly);
adminRouter.get('/analytics', getAnalytics);
adminRouter.get('/orders', getAllOrders);
adminRouter.get('/orders/:id', getOrderById);
adminRouter.put(
  '/orders/:id/status',
  [
    body('status')
      .isIn(ORDER_STATUSES)
      .withMessage(`Status must be one of: ${ORDER_STATUSES.join(', ')}`),
    validate
  ],
  updateOrderStatus
);
adminRouter.patch(
  '/orders/:id/status',
  [
    body('status')
      .isIn(ORDER_STATUSES)
      .withMessage(`Status must be one of: ${ORDER_STATUSES.join(', ')}`),
    validate
  ],
  updateOrderStatus
);

module.exports = {
  orderRouter: router,
  adminOrderRouter: adminRouter
};
