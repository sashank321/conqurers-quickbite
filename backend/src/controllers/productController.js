const { prisma } = require('../config/db');

// Helper to map Prisma product to Mongoose-like product
const mapProduct = (p) => ({ ...p, _id: p.id });

// @desc    Get all products with filtering & search
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { search, category, available } = req.query;
    
    let where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (available !== undefined && available !== '') {
      where.available = available === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products.map(mapProduct)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: mapProduct(product)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, image, available, stock } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        category,
        image,
        available: available !== undefined ? Boolean(available) : true,
        stock: stock !== undefined ? Number(stock) : 0
      }
    });

    return res.status(201).json({
      success: true,
      data: mapProduct(product)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image, available, stock } = req.body;

    const productExists = await prisma.product.findUnique({ where: { id } });

    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description || undefined,
        price: price !== undefined ? Number(price) : undefined,
        category: category || undefined,
        image: image || undefined,
        available: available !== undefined ? Boolean(available) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined
      }
    });

    return res.status(200).json({
      success: true,
      data: mapProduct(updatedProduct)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Product removed'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
