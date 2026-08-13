# QuickBite – Campus Food Ordering System (Backend API)

A clean, robust, production-ready Node.js, Express, and MongoDB backend for the **QuickBite Campus Food Ordering System**, designed for 100% free online cloud deployment using **Render** (Web Service) and **MongoDB Atlas** (Free Cluster).

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ORM)
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs
- **Validation**: express-validator
- **Security & Utilities**: dotenv, cors

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Production MongoDB Atlas connection module
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile
│   │   ├── productController.js  # Catalog CRUD & search/filter
│   │   ├── cartController.js     # Student cart management
│   │   └── orderController.js    # Order placement & admin status management
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT token verification
│   │   ├── adminMiddleware.js    # Role authorization (admin / student)
│   │   ├── errorMiddleware.js    # Production error & 404 handler
│   │   └── validateMiddleware.js # Input validation handling
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Product.js            # Product schema
│   │   ├── Cart.js               # Cart schema
│   │   └── Order.js              # Order schema (with snapshotted item details)
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── productRoutes.js      # /api/products
│   │   ├── cartRoutes.js         # /api/cart
│   │   ├── orderRoutes.js        # /api/orders & /api/admin/orders
│   │   └── healthRoutes.js       # /api/health
│   ├── utils/
│   │   ├── generateToken.js      # JWT generator
│   │   └── generateOrderNumber.js # Order number generator (QB-YYYYMMDD-XXXX)
│   ├── app.js                    # Express app setup & CORS
│   └── server.js                 # Server listener
├── seed/
│   └── seed.js                   # Seed script for MongoDB Atlas
├── test-backend.js               # 22-step automated integration test suite
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Deployment Guide (Step-by-Step)

### A. Local Setup & Development

1. Navigate to the `backend/` directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Copy `.env.example` to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Fill in `.env` variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/quickbite
   JWT_SECRET=your_super_secret_jwt_key_here
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. Run locally:
   ```bash
   npm run dev
   ```

---

### B. Setting Up Free MongoDB Atlas Database

1. **Create Account & Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
   - Click **Create a Database** and select the **M0 Free Shared Cluster**.

2. **Create Database User**:
   - Go to **Database Access** under *Security*.
   - Click **Add New Database User**.
   - Select **Password Authentication**. Set a username (e.g., `quickbite_admin`) and a strong password.
   - Set privileges to **Read and write to any database**.

3. **Configure Network Access**:
   - Go to **Network Access** under *Security*.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render instances can connect securely.

4. **Copy Connection String**:
   - Go to **Database** → Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string (format: `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/quickbite?retryWrites=true&w=majority`).
   - Replace `<username>` and `<password>` with your database credentials.

---

### C. Deploying to Render (Free Web Service)

1. **Push to GitHub**:
   - Commit and push your code repository to GitHub.

2. **Create Render Web Service**:
   - Log in to [Render](https://render.com).
   - Click **New +** → Select **Web Service**.
   - Connect your GitHub repository.

3. **Configure Build & Start Commands**:
   - **Name**: `quickbite-backend` (or your preferred name)
   - **Region**: Choose the closest location to you
   - **Branch**: `main`
   - **Root Directory**: `backend` (if code is in subfolder) or leave blank if backend is root
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install
     ```
   - **Start Command**:
     ```bash
     npm start
     ```

4. **Set Environment Variables on Render**:
   In the Render dashboard under **Environment**, add the following keys:

   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/quickbite` |
   | `JWT_SECRET` | `your_strong_random_secret_string` |
   | `CLIENT_URL` | `https://your-frontend-app.vercel.app` (or `*` during initial testing) |

5. **Deploy & Verify**:
   - Render will build and launch your backend web service.
   - Once live, verify your service health at:
     ```
     GET https://<your-render-app-name>.onrender.com/api/health
     ```
   - Expected Response:
     ```json
     {
       "success": true,
       "message": "QuickBite API is running",
       "database": "connected"
     }
     ```

---

### D. Seeding the MongoDB Atlas Database

After configuring `MONGO_URI` in `.env` or setting it in environment variables:

```bash
npm run seed
```

This populates MongoDB Atlas with initial data:
- **Admin**: `admin@quickbite.com` / `Admin@123`
- **Students**: `student1@quickbite.com`, `student2@quickbite.com`, `student3@quickbite.com` / `Student@123`
- **Products**: 22 food products across 7 categories

---

### E. Vercel Frontend Integration

When building and deploying the React frontend on Vercel:

Set your frontend environment variable (e.g., `VITE_API_BASE_URL`):

```env
VITE_API_BASE_URL=https://<your-render-app-name>.onrender.com/api
```

---

## 🧪 Automated Integration Tests

To run all 22 end-to-end API tests locally or in CI:

```bash
npm test
```

Verifies health check, authentication, product search/filter, admin CRUD, cart updates, order placement, stock decrements, privacy protection, and status state machine rules.

---

## 📡 API Reference Quick Summary

- **Health Check**: `GET /api/health`
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Products**: `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- **Cart**: `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/:productId`, `DELETE /api/cart/items/:productId`, `DELETE /api/cart`
- **Orders**: `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`
- **Admin Orders**: `GET /api/admin/orders`, `GET /api/admin/orders/:id`, `PUT /api/admin/orders/:id/status`
