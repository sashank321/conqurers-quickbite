const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const { orderRouter, adminOrderRouter } = require('./routes/orderRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Parse CORS allowed origins from process.env.CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like server-to-server, curl, Postman, health check)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed by CLIENT_URL configuration`));
      }
    },
    credentials: true
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminOrderRouter);

// Base route handler
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to QuickBite Campus Food Ordering API'
  });
});

// Centralized 404 & Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
