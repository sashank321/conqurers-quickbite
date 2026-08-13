const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected successfully via Prisma');
    return prisma;
  } catch (error) {
    console.error(`PostgreSQL connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, prisma };
