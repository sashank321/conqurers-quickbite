const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./src/app');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Cart = require('./src/models/Cart');
const Order = require('./src/models/Order');

dotenv.config();

const PORT = process.env.TEST_PORT || 5001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server;
let mongodInstance;
let studentToken = '';
let studentId = '';
let student2Token = '';
let student2Id = '';
let adminToken = '';
let createdProductId = '';
let createdOrderId = '';
let originalProductStock = 0;

let passedCount = 0;
let failedCount = 0;

const logTest = (stepNumber, title, passed, details = '') => {
  if (passed) {
    passedCount++;
    console.log(`\x1b[32m[PASS]\x1b[0m Step ${stepNumber}: ${title} ${details ? `(${details})` : ''}`);
  } else {
    failedCount++;
    console.error(`\x1b[31m[FAIL]\x1b[0m Step ${stepNumber}: ${title} ${details ? `(${details})` : ''}`);
  }
};

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          let parsedData;
          try {
            parsedData = JSON.parse(responseBody);
          } catch (e) {
            parsedData = responseBody;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedData
          });
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const setupTestDatabase = async () => {
  let mongoUri = process.env.MONGO_URI;

  try {
    if (mongoUri) {
      console.log(`[Test Suite]: Attempting connection to configured MONGO_URI...`);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[Test Suite]: Connected to target MongoDB.`);
    } else {
      throw new Error('MONGO_URI environment variable not provided');
    }
  } catch (err) {
    console.warn(`[Test Suite]: Connection to MONGO_URI failed (${err.message}). Starting isolated MongoMemoryServer for test execution...`);
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    mongoUri = mongodInstance.getUri();
    await mongoose.connect(mongoUri);
    console.log(`[Test Suite]: Connected to isolated MongoMemoryServer.`);
  }

  await User.deleteMany({});
  await Product.deleteMany({});
  await Cart.deleteMany({});
  await Order.deleteMany({});

  await User.create([
    {
      name: 'Admin User',
      email: 'admin@quickbite.com',
      password: 'Admin@123',
      role: 'admin'
    },
    {
      name: 'Rahul Sharma',
      email: 'student1@quickbite.com',
      password: 'Student@123',
      role: 'student'
    },
    {
      name: 'Priya Patel',
      email: 'student2@quickbite.com',
      password: 'Student@123',
      role: 'student'
    }
  ]);

  await Product.insertMany([
    {
      name: 'Classic Cheeseburger',
      description: 'Juicy patty topped with melted cheddar',
      price: 129,
      category: 'Burgers',
      available: true,
      stock: 50
    },
    {
      name: 'Margherita Pizza',
      description: 'Classic cheese pizza loaded with rich mozzarella',
      price: 199,
      category: 'Pizza',
      available: true,
      stock: 30
    }
  ]);

  const students = await User.find({ role: 'student' });
  for (const s of students) {
    await Cart.create({ user: s._id, items: [] });
  }
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('  STARTING QUICKBITE BACKEND AUTOMATED E2E TEST SUITE');
  console.log('======================================================\n');

  try {
    await setupTestDatabase();
    server = app.listen(PORT);
    console.log(`[Test Server]: Listening on ${BASE_URL}\n`);

    // 1. Health check
    try {
      const res = await request('/api/health');
      const pass = res.status === 200 && res.body.success === true && res.body.database === 'connected';
      logTest(1, 'Health Check Endpoint', pass, res.body.message);
    } catch (err) {
      logTest(1, 'Health Check Endpoint', false, err.message);
    }

    // 2. Register student
    try {
      const testEmail = `teststudent_${Date.now()}@quickbite.com`;
      const res = await request('/api/auth/register', 'POST', {
        name: 'Automated Test Student',
        email: testEmail,
        password: 'Password123'
      });
      const pass = res.status === 201 && res.body.success === true && !!res.body.data.token;
      logTest(2, 'Register Student', pass, `Email: ${testEmail}`);
    } catch (err) {
      logTest(2, 'Register Student', false, err.message);
    }

    // 2b. Register second student for privacy tests
    try {
      const testEmail2 = `teststudent2_${Date.now()}@quickbite.com`;
      const res = await request('/api/auth/register', 'POST', {
        name: 'Second Test Student',
        email: testEmail2,
        password: 'Password123'
      });
      if (res.status === 201 && res.body.data.token) {
        student2Token = res.body.data.token;
        student2Id = res.body.data._id;
      }
    } catch (err) {}

    // 3. Login student
    try {
      const res = await request('/api/auth/login', 'POST', {
        email: 'student1@quickbite.com',
        password: 'Student@123'
      });
      const pass = res.status === 200 && res.body.success === true && res.body.data.role === 'student';
      if (pass) {
        studentToken = res.body.data.token;
        studentId = res.body.data._id;
      }
      logTest(3, 'Login Student', pass, `User: ${res.body.data?.name}`);
    } catch (err) {
      logTest(3, 'Login Student', false, err.message);
    }

    // 4. Login admin
    try {
      const res = await request('/api/auth/login', 'POST', {
        email: 'admin@quickbite.com',
        password: 'Admin@123'
      });
      const pass = res.status === 200 && res.body.success === true && res.body.data.role === 'admin';
      if (pass) {
        adminToken = res.body.data.token;
      }
      logTest(4, 'Login Admin', pass, `Role: ${res.body.data?.role}`);
    } catch (err) {
      logTest(4, 'Login Admin', false, err.message);
    }

    // 5. Get products
    try {
      const res = await request('/api/products');
      const pass = res.status === 200 && res.body.success === true && Array.isArray(res.body.data) && res.body.data.length > 0;
      logTest(5, 'Get All Products', pass, `Found ${res.body.data?.length || 0} products`);
    } catch (err) {
      logTest(5, 'Get All Products', false, err.message);
    }

    // 6. Search/filter products
    try {
      const res = await request('/api/products?search=burger&category=Burgers');
      const pass = res.status === 200 && res.body.success === true && Array.isArray(res.body.data) && res.body.data.length > 0;
      logTest(6, 'Search/Filter Products', pass, `Filtered ${res.body.data?.length || 0} burger products`);
    } catch (err) {
      logTest(6, 'Search/Filter Products', false, err.message);
    }

    // 7. Admin creates product
    try {
      const res = await request('/api/products', 'POST', {
        name: 'Test Special Roll',
        description: 'Delicious test roll for automated testing',
        price: 85,
        category: 'Snacks',
        stock: 25,
        available: true
      }, adminToken);
      const pass = res.status === 201 && res.body.success === true && !!res.body.data._id;
      if (pass) {
        createdProductId = res.body.data._id;
        originalProductStock = res.body.data.stock;
      }
      logTest(7, 'Admin Create Product', pass, `Product ID: ${createdProductId}`);
    } catch (err) {
      logTest(7, 'Admin Create Product', false, err.message);
    }

    // 8. Admin updates product
    try {
      const res = await request(`/api/products/${createdProductId}`, 'PUT', {
        price: 90,
        stock: 30
      }, adminToken);
      const pass = res.status === 200 && res.body.success === true && res.body.data.price === 90 && res.body.data.stock === 30;
      if (pass) {
        originalProductStock = 30;
      }
      logTest(8, 'Admin Update Product', pass, `New price: 90, stock: 30`);
    } catch (err) {
      logTest(8, 'Admin Update Product', false, err.message);
    }

    // 9. Student adds product to cart
    try {
      const res = await request('/api/cart/items', 'POST', {
        productId: createdProductId,
        quantity: 2
      }, studentToken);
      const pass = res.status === 200 && res.body.success === true && res.body.data.items.some(i => i.product._id === createdProductId || i.product === createdProductId);
      logTest(9, 'Student Add Product to Cart', pass, `Added qty 2`);
    } catch (err) {
      logTest(9, 'Student Add Product to Cart', false, err.message);
    }

    // 10. Student updates cart quantity
    try {
      const res = await request(`/api/cart/items/${createdProductId}`, 'PUT', {
        quantity: 3
      }, studentToken);
      const pass = res.status === 200 && res.body.success === true && res.body.data.items.some(i => (i.product._id === createdProductId || i.product === createdProductId) && i.quantity === 3);
      logTest(10, 'Student Update Cart Quantity', pass, `Updated qty to 3`);
    } catch (err) {
      logTest(10, 'Student Update Cart Quantity', false, err.message);
    }

    // 11. Student creates order
    try {
      const res = await request('/api/orders', 'POST', {
        paymentMethod: 'UPI'
      }, studentToken);
      const pass = res.status === 201 && res.body.success === true && !!res.body.data._id;
      if (pass) {
        createdOrderId = res.body.data._id;
      }
      logTest(11, 'Student Create Order', pass, `Order ID: ${createdOrderId}, Number: ${res.body.data?.orderNumber}`);
    } catch (err) {
      logTest(11, 'Student Create Order', false, err.message);
    }

    // 12. Verify order created correctly
    try {
      const res = await request(`/api/orders/${createdOrderId}`, 'GET', null, studentToken);
      const order = res.body.data;
      const pass = res.status === 200 && res.body.success === true &&
                   order.totalAmount === (90 * 3) &&
                   order.status === 'PLACED' &&
                   order.items.length === 1 &&
                   order.items[0].quantity === 3;
      logTest(12, 'Verify Order Details', pass, `Total: ₹${order?.totalAmount}`);
    } catch (err) {
      logTest(12, 'Verify Order Details', false, err.message);
    }

    // 13. Verify cart was cleared
    try {
      const res = await request('/api/cart', 'GET', null, studentToken);
      const pass = res.status === 200 && res.body.success === true && res.body.data.items.length === 0;
      logTest(13, 'Verify Cart Cleared After Order', pass);
    } catch (err) {
      logTest(13, 'Verify Cart Cleared After Order', false, err.message);
    }

    // 14. Verify product stock decreased correctly
    try {
      const res = await request(`/api/products/${createdProductId}`);
      const expectedStock = originalProductStock - 3;
      const pass = res.status === 200 && res.body.data.stock === expectedStock;
      logTest(14, 'Verify Product Stock Decreased', pass, `Stock: ${res.body.data?.stock} (Expected: ${expectedStock})`);
    } catch (err) {
      logTest(14, 'Verify Product Stock Decreased', false, err.message);
    }

    // 15. Student retrieves order history
    try {
      const res = await request('/api/orders', 'GET', null, studentToken);
      const pass = res.status === 200 && res.body.success === true && Array.isArray(res.body.data) && res.body.data.some(o => o._id === createdOrderId);
      logTest(15, 'Student Retrieve Order History', pass, `Orders count: ${res.body.data?.length}`);
    } catch (err) {
      logTest(15, 'Student Retrieve Order History', false, err.message);
    }

    // 16. Student cannot retrieve another student's order
    try {
      const res = await request(`/api/orders/${createdOrderId}`, 'GET', null, student2Token);
      const pass = res.status === 403 && res.body.success === false;
      logTest(16, 'Privacy Check: Student Cannot Access Other User Order', pass, `Status code: ${res.status}`);
    } catch (err) {
      logTest(16, 'Privacy Check: Student Cannot Access Other User Order', false, err.message);
    }

    // 17. Admin retrieves all orders
    try {
      const res = await request('/api/admin/orders', 'GET', null, adminToken);
      const pass = res.status === 200 && res.body.success === true && Array.isArray(res.body.data) && res.body.data.length > 0;
      logTest(17, 'Admin Retrieve All Orders', pass, `Total system orders: ${res.body.data?.length}`);
    } catch (err) {
      logTest(17, 'Admin Retrieve All Orders', false, err.message);
    }

    // 18. Admin changes order status through valid transitions
    try {
      // PLACED -> CONFIRMED
      const res1 = await request(`/api/admin/orders/${createdOrderId}/status`, 'PUT', { status: 'CONFIRMED' }, adminToken);
      // CONFIRMED -> PREPARING
      const res2 = await request(`/api/admin/orders/${createdOrderId}/status`, 'PUT', { status: 'PREPARING' }, adminToken);
      
      const pass = res1.status === 200 && res1.body.data.status === 'CONFIRMED' &&
                   res2.status === 200 && res2.body.data.status === 'PREPARING';
      logTest(18, 'Admin Valid Order Status Transition', pass, `Status transitioned: PLACED -> CONFIRMED -> PREPARING`);
    } catch (err) {
      logTest(18, 'Admin Valid Order Status Transition', false, err.message);
    }

    // 19. Invalid status transition is rejected
    try {
      // PREPARING -> COMPLETED is invalid (must go PREPARING -> READY -> COMPLETED)
      const res = await request(`/api/admin/orders/${createdOrderId}/status`, 'PUT', { status: 'COMPLETED' }, adminToken);
      const pass = res.status === 400 && res.body.success === false;
      logTest(19, 'Invalid Order Status Transition Rejected', pass, `Rejected with 400: "${res.body.message}"`);
    } catch (err) {
      logTest(19, 'Invalid Order Status Transition Rejected', false, err.message);
    }

    // 20. Unauthorized request is rejected
    try {
      // Access admin endpoint without token
      const res1 = await request('/api/admin/orders');
      // Access admin endpoint with student token
      const res2 = await request('/api/admin/orders', 'GET', null, studentToken);
      const pass = res1.status === 401 && res2.status === 403;
      logTest(20, 'Unauthorized & Forbidden Requests Rejected', pass, `No token: ${res1.status}, Student on Admin: ${res2.status}`);
    } catch (err) {
      logTest(20, 'Unauthorized & Forbidden Requests Rejected', false, err.message);
    }

    // 21. Invalid request payload is rejected
    try {
      // Register with invalid email and short password
      const res = await request('/api/auth/register', 'POST', {
        name: 'Invalid User',
        email: 'not-an-email',
        password: '123'
      });
      const pass = res.status === 400 && res.body.success === false && Array.isArray(res.body.errors);
      logTest(21, 'Invalid Request Payload Rejected', pass, `Validation error message: "${res.body.message}"`);
    } catch (err) {
      logTest(21, 'Invalid Request Payload Rejected', false, err.message);
    }

    // 22. Admin deletes test product
    try {
      const res = await request(`/api/products/${createdProductId}`, 'DELETE', null, adminToken);
      const pass = res.status === 200 && res.body.success === true;
      logTest(22, 'Admin Delete Test Product', pass, res.body.message);
    } catch (err) {
      logTest(22, 'Admin Delete Test Product', false, err.message);
    }

  } catch (err) {
    console.error('[Runner Fatal Error]:', err);
  } finally {
    if (server) {
      server.close();
    }
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    if (mongodInstance) {
      await mongodInstance.stop();
    }

    console.log('\n======================================================');
    console.log(`  TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED OUT OF 22 TESTS`);
    console.log('======================================================\n');

    process.exit(failedCount === 0 ? 0 : 1);
  }
};

runTests();
