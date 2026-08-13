const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quickbite';

  try {
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });

    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    const isLocalhost = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev && isLocalhost) {
      console.warn(`[DB Dev Fallback]: Could not connect to local MongoDB at "${mongoUri}" (${error.message}).`);
      console.log('[DB Dev Fallback]: Initializing MongoDB Memory Server for local development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB Memory Server Connected]: ${memoryUri}`);
      return conn;
    }

    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
