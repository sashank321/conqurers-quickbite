const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect Database then start HTTP Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[QuickBite Server]: Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
