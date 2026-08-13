const express = require('express');
const { prisma } = require('../config/db');

const router = express.Router();

// @desc    Check API and DB health
// @route   GET /api/health
// @access  Public
router.get('/', async (req, res) => {
  try {
    // A simple query to check if DB is connected
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'QuickBite API is running',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'QuickBite API is running',
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
