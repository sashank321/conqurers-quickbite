const { prisma } = require('../config/db');

// Helper to format cart response
const formatCartResponse = (cart) => {
  let grandTotal = 0;
  
  const items = cart.items.map((item) => {
    const product = item.product;
    const price = product && product.price ? product.price : 0;
    const itemTotal = price * item.quantity;
    grandTotal += itemTotal;

    return {
      product: { ...product, _id: product.id }, // Map id for frontend compatibility
      quantity: item.quantity,
      itemTotal
    };
  });

  return {
    _id: cart.id,
    user: cart.userId,
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
    const userId = req.user.id;
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, image: true, available: true, stock: true, category: true } }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } }
      });
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
    const userId = req.user.id;

    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer greater than or equal to 1'
      });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!product.available) {
      return res.status(400).json({ success: false, message: `Product "${product.name}" is currently unavailable` });
    }

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id
        }
      }
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + qty;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more "${product.name}". Available stock: ${product.stock}, current in cart: ${existingItem.quantity}`
        });
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      });
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${qty} of "${product.name}". Available stock: ${product.stock}`
        });
      }
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: qty
        }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, image: true, available: true, stock: true, category: true } }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: formatCartResponse(updatedCart)
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
    const userId = req.user.id;

    if (isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } }
    });

    if (!existingItem) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      if (!product.available) return res.status(400).json({ success: false, message: `Product "${product.name}" is currently unavailable` });
      if (qty > product.stock) return res.status(400).json({ success: false, message: `Cannot set quantity to ${qty}. Available stock for "${product.name}" is ${product.stock}` });

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: qty }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, image: true, available: true, stock: true, category: true } }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: formatCartResponse(updatedCart)
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
    const userId = req.user.id;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } }
    });

    if (existingItem) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, image: true, available: true, stock: true, category: true } }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: formatCartResponse(updatedCart)
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
    const userId = req.user.id;
    let cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    } else {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: formatCartResponse(updatedCart)
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
