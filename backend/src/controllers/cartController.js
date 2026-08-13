const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to format cart response with populated products & calculated totals
const formatCartResponse = (cart) => {
  let grandTotal = 0;
  const items = cart.items.map((item) => {
    const product = item.product;
    const price = product && product.price ? product.price : 0;
    const itemTotal = price * item.quantity;
    grandTotal += itemTotal;

    return {
      product: item.product,
      quantity: item.quantity,
      itemTotal
    };
  });

  return {
    _id: cart._id,
    user: cart.user,
    items,
    totalAmount: grandTotal,
    updatedAt: cart.updatedAt
  };
};

// @desc    Get current student's cart
// @route   GET /api/cart
// @access  Private (Student)
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price image available stock category'
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    return res.status(200).json({
      success: true,
      data: formatCartResponse(cart)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart or update quantity if already present
// @route   POST /api/cart/items
// @access  Private (Student)
const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer greater than or equal to 1'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.available) {
      return res.status(400).json({
        success: false,
        message: `Product "${product.name}" is currently unavailable`
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + qty;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more "${product.name}". Available stock: ${product.stock}, current in cart: ${cart.items[itemIndex].quantity}`
        });
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${qty} of "${product.name}". Available stock: ${product.stock}`
        });
      }
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();

    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price image available stock category'
    });

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: formatCartResponse(cart)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:productId
// @access  Private (Student)
const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty)) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (!product.available) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is currently unavailable`
        });
      }

      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot set quantity to ${qty}. Available stock for "${product.name}" is ${product.stock}`
        });
      }

      cart.items[itemIndex].quantity = qty;
    }

    await cart.save();

    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price image available stock category'
    });

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: formatCartResponse(cart)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove single item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private (Student)
const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();

    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price image available stock category'
    });

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: formatCartResponse(cart)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all items in cart
// @route   DELETE /api/cart
// @access  Private (Student)
const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    } else {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: formatCartResponse(cart)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
};
