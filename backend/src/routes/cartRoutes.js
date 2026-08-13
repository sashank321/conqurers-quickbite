const express = require('express');
const { body } = require('express-validator');
const {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { studentOnly } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

// Apply auth and student restriction to all cart routes
router.use(protect, studentOnly);

router.get('/', getCart);
router.delete('/', clearCart);

router.post(
  '/items',
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be an integer >= 1'),
    validate
  ],
  addItemToCart
);

router.put(
  '/items/:productId',
  [
    body('quantity')
      .isInt()
      .withMessage('Quantity must be an integer'),
    validate
  ],
  updateCartItemQuantity
);

router.delete('/items/:productId', removeCartItem);

module.exports = router;
