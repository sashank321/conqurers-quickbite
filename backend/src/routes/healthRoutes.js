const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (req, res) => {
  const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: 'QuickBite API health degraded: Database unavailable',
      database: 'disconnected'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'QuickBite API is running',
    database: 'connected'
  });
});

module.exports = router;
